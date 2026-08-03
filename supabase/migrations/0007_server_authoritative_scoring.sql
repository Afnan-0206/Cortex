-- Migration: 0007_server_authoritative_scoring.sql
-- Description: Server-authoritative RPC for validating match results and computing ratings/XP.

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

  -- Lock user profile row for authoritative update
  SELECT COALESCE(rating, 1200), COALESCE(xp, 0), COALESCE(streak, 0)
  INTO v_current_rating, v_current_xp, v_current_streak
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- Compute server-authoritative ELO & XP
  IF p_is_winner THEN
    v_earned_xp := 50 + (LEAST(p_score, 100) * 5);
    v_new_rating := v_current_rating + 25;
    v_new_streak := v_current_streak + 1;
  ELSE
    v_earned_xp := LEAST(15, GREATEST(0, p_score * 2));
    v_new_rating := GREATEST(100, v_current_rating - 15);
    v_new_streak := 0;
  END IF;

  -- Perform server-authoritative write
  UPDATE public.profiles
  SET 
    rating = v_new_rating,
    xp = v_current_xp + v_earned_xp,
    streak = v_new_streak,
    best_streak = GREATEST(COALESCE(best_streak, 0), v_new_streak),
    updated_at = NOW()
  WHERE id = v_user_id;

  v_result := jsonb_build_object(
    'new_rating', v_new_rating,
    'earned_xp', v_earned_xp,
    'new_streak', v_new_streak
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_match_result TO authenticated;
