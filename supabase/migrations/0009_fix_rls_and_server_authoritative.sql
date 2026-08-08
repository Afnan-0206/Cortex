-- Migration: 0009_fix_rls_and_server_authoritative.sql
-- Fix RLS policies for battle_state and answers to restrict to match participants only

-- Fix battle_state RLS: only match participants can read
DROP POLICY IF EXISTS "Battle state viewable by match players" ON public.battle_state;
CREATE POLICY "Battle state viewable by match players" ON public.battle_state
  FOR SELECT USING (
    auth.uid() IN (
      SELECT player1 FROM public.matches WHERE id = match_id
      UNION
      SELECT player2 FROM public.matches WHERE id = match_id
    )
  );

-- Fix answers RLS: only match participants can read
DROP POLICY IF EXISTS "Answers viewable by match players" ON public.answers;
CREATE POLICY "Answers viewable by match players" ON public.answers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT player1 FROM public.matches WHERE id = match_id
      UNION
      SELECT player2 FROM public.matches WHERE id = match_id
    )
  );

-- Users can only insert their own answers
DROP POLICY IF EXISTS "Users can insert own answers" ON public.answers;
CREATE POLICY "Users can insert own answers" ON public.answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating);
CREATE INDEX IF NOT EXISTS idx_answers_match_user ON public.answers(match_id, user_id);
CREATE INDEX IF NOT EXISTS idx_matches_players_status ON public.matches(player1, player2, status);