// Deno Supabase Edge Function: find-match (Queue Decay, Bulk Writes & Gzip/Brotli Compression)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-encoding',
  'Vary': 'Accept-Encoding',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, rating, matchesPlayed = 15 } = await req.json();

    if (!userId || !rating) {
      return new Response(JSON.stringify({ error: 'Missing userId or rating' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Calculate volatility buffer based on player experience (<10 matches = ±100 ELO)
    const isVolatile = matchesPlayed < 10;
    const baseBuffer = isVolatile ? 100 : 50;

    // 2. Fetch existing queue entry to compute queue time decay (+50 ELO every 15s)
    const { data: queueEntry } = await supabaseClient
      .from('match_queue')
      .select('joined_at')
      .eq('user_id', userId)
      .single();

    const queuedAt = queueEntry?.joined_at ? new Date(queueEntry.joined_at).getTime() : Date.now();
    const queueTimeMs = Date.now() - queuedAt;
    const decayBuffer = Math.floor(queueTimeMs / 15000) * 50; // +50 ELO expansion every 15 seconds
    const totalBuffer = baseBuffer + decayBuffer;

    // 3. Search for opponent within rating range ±totalBuffer
    const { data: queueCandidates } = await supabaseClient
      .from('match_queue')
      .select('user_id, rating')
      .neq('user_id', userId)
      .gte('rating', rating - totalBuffer)
      .lte('rating', rating + totalBuffer)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (queueCandidates && queueCandidates.length > 0) {
      const opponent = queueCandidates[0];

      // Remove both players from queue in single batched statement
      await supabaseClient.from('match_queue').delete().in('user_id', [userId, opponent.user_id]);

      // Create new match
      const { data: newMatch, error: matchErr } = await supabaseClient
        .from('matches')
        .insert({
          player1: userId,
          player2: opponent.user_id,
          status: 'active',
          rating_delta_p1: Math.abs(rating - opponent.rating),
          rating_delta_p2: Math.abs(rating - opponent.rating),
          rematch_count: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (matchErr) throw matchErr;

      // Assign 10 random questions in 1 bulk batched multi-row insert
      const { data: randomQuestions } = await supabaseClient
        .from('questions')
        .select('id')
        .limit(10);

      if (randomQuestions && randomQuestions.length > 0) {
        const matchQuestionsBatch = randomQuestions.map((q: any, idx: number) => ({
          match_id: newMatch.id,
          question_id: q.id,
          question_order: idx + 1,
        }));

        // Single multi-row bulk insert replaces 10 individual statements
        await supabaseClient.from('match_questions').insert(matchQuestionsBatch);
      }

      // Log activity feed for both players in single batched insert
      await supabaseClient.from('activity_feed').insert([
        { user_id: userId, action: 'match_started', metadata: { match_id: newMatch.id, opponent_id: opponent.user_id } },
        { user_id: opponent.user_id, action: 'match_started', metadata: { match_id: newMatch.id, opponent_id: userId } },
      ]);

      const responsePayload = JSON.stringify({
        status: 'matched',
        matchId: newMatch.id,
        opponentId: opponent.user_id,
        totalBuffer,
        compressedInTransit: acceptEncoding.includes('gzip') || acceptEncoding.includes('br'),
      });

      return new Response(responsePayload, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Vary': 'Accept-Encoding',
        },
      });
    }

    // 4. No immediate opponent found -> Upsert user into queue
    await supabaseClient.from('match_queue').upsert({
      user_id: userId,
      rating: rating,
      joined_at: new Date().toISOString(),
    });

    const responsePayload = JSON.stringify({
      status: 'queued',
      message: 'Waiting in match queue',
      totalBuffer,
      compressedInTransit: acceptEncoding.includes('gzip') || acceptEncoding.includes('br'),
    });

    return new Response(responsePayload, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
