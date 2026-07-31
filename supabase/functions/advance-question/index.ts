// Deno Supabase Edge Function: advance-question (Bulk Writes & Compression Negotiation)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-encoding',
  'Vary': 'Accept-Encoding',
};

function calculateElo(rA: number, rB: number, scoreA: number, k = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const changeA = Math.round(k * (scoreA - expectedA));
  return { newRatingA: rA + changeA, deltaA: changeA };
}

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

    const { matchId } = await req.json();

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Missing matchId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch match & current battle_state
    const { data: match } = await supabaseClient
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    const { data: battleState } = await supabaseClient
      .from('battle_state')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (!match || !battleState) {
      return new Response(JSON.stringify({ error: 'Match or BattleState not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nextQuestion = battleState.current_question + 1;
    const isCompleted = nextQuestion > 10;

    if (isCompleted) {
      // Determine winner
      let winnerId = null;
      let score1 = 0.5;
      let score2 = 0.5;

      if (battleState.player1_score > battleState.player2_score) {
        winnerId = match.player1;
        score1 = 1;
        score2 = 0;
      } else if (battleState.player2_score > battleState.player1_score) {
        winnerId = match.player2;
        score1 = 0;
        score2 = 1;
      }

      // Update match and battle_state status
      await supabaseClient
        .from('matches')
        .update({ status: 'completed', winner: winnerId, ended_at: new Date().toISOString() })
        .eq('id', matchId);

      await supabaseClient
        .from('battle_state')
        .update({ status: 'completed' })
        .eq('match_id', matchId);

      // Elo updates for both profiles in 1 single batched upsert statement
      const { data: p1 } = await supabaseClient.from('profiles').select('id, rating, xp').eq('id', match.player1).single();
      const { data: p2 } = await supabaseClient.from('profiles').select('id, rating, xp').eq('id', match.player2).single();

      if (p1 && p2) {
        const elo1 = calculateElo(p1.rating, p2.rating, score1);
        const elo2 = calculateElo(p2.rating, p1.rating, score2);

        // Multi-row batched profile rating update replacing 2 individual statements
        await supabaseClient
          .from('profiles')
          .upsert([
            { id: p1.id, rating: elo1.newRatingA, xp: p1.xp + 50 },
            { id: p2.id, rating: elo2.newRatingA, xp: p2.xp + 50 },
          ]);
      }

      const responsePayload = JSON.stringify({
        status: 'completed',
        winnerId,
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

    // Advance to next question with server timestamp
    const { data: updatedState, error } = await supabaseClient
      .from('battle_state')
      .update({
        current_question: nextQuestion,
        question_started_at: new Date().toISOString(),
      })
      .eq('match_id', matchId)
      .select()
      .single();

    if (error) throw error;

    const responsePayload = JSON.stringify({
      status: 'advanced',
      currentQuestion: nextQuestion,
      battleState: updatedState,
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
