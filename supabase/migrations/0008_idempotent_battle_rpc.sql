-- Migration: 0008_idempotent_battle_rpc.sql
-- Description: Idempotent match result submission PL/pgSQL function preventing double-rewards, race conditions, and negative timers.

CREATE TABLE IF NOT EXISTS public.match_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  opponent_id TEXT,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  earned_xp INT NOT NULL DEFAULT 0,
  new_rating INT NOT NULL DEFAULT 1200,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_match UNIQUE (match_id, user_id)
);

ALTER TABLE public.match_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own match submissions"
  ON public.match_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_match_result(
  p_match_id TEXT,
  p_score INT,
  p_opponent_id TEXT,
  p_is_winner BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_sub RECORD;
  v_current_rating INT;
  v_current_xp INT;
  v_current_streak INT;
  v_new_rating INT;
  v_earned_xp INT;
  v_new_streak INT;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User session required';
  END IF;

  -- 1. Check for existing idempotent submission
  SELECT earned_xp, new_rating INTO v_existing_sub
  FROM public.match_submissions
  WHERE match_id = p_match_id AND user_id = v_user_id;

  IF FOUND THEN
    -- Return cached canonical outcome without mutating rating/XP again
    RETURN jsonb_build_object(
      'status', 'already_processed',
      'new_rating', v_existing_sub.new_rating,
      'earned_xp', v_existing_sub.earned_xp
    );
  END IF;

  -- 2. Lock user profile row for authoritative update
  SELECT COALESCE(rating, 1200), COALESCE(xp, 0), COALESCE(streak, 0)
  INTO v_current_rating, v_current_xp, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- 3. Calculate ELO & XP
  IF p_is_winner THEN
    v_earned_xp := 50 + (LEAST(p_score, 100) * 5);
    v_new_rating := v_current_rating + 25;
    v_new_streak := v_current_streak + 1;
  ELSE
    v_earned_xp := LEAST(15, GREATEST(0, p_score * 2));
    v_new_rating := GREATEST(100, v_current_rating - 15);
    v_new_streak := 0;
  END IF;

  -- 4. Insert idempotent submission record
  INSERT INTO public.match_submissions (
    match_id, user_id, score, opponent_id, is_winner, earned_xp, new_rating
  ) VALUES (
    p_match_id, v_user_id, p_score, p_opponent_id, p_is_winner, v_earned_xp, v_new_rating
  )
  ON CONFLICT (match_id, user_id) DO NOTHING;

  -- 5. Perform canonical profile update
  UPDATE public.profiles
  SET 
    rating = v_new_rating,
    xp = v_current_xp + v_earned_xp,
    streak = v_new_streak,
    best_streak = GREATEST(COALESCE(best_streak, 0), v_new_streak),
    updated_at = NOW()
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'status', 'success',
    'new_rating', v_new_rating,
    'earned_xp', v_earned_xp,
    'new_streak', v_new_streak
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_match_result TO authenticated;
