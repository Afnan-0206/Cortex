-- 14. Add first_game_completed and coins columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_game_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- Function to safely award first game coins
CREATE OR REPLACE FUNCTION public.award_first_game_reward(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed BOOLEAN;
  v_new_coins INTEGER;
BEGIN
  SELECT first_game_completed INTO v_completed
  FROM public.profiles
  WHERE id = user_id;

  IF v_completed IS TRUE THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed');
  END IF;

  UPDATE public.profiles
  SET 
    first_game_completed = true,
    coins = COALESCE(coins, 0) + 100
  WHERE id = user_id
  RETURNING coins INTO v_new_coins;

  RETURN jsonb_build_object(
    'success', true, 
    'coins_awarded', 100, 
    'total_coins', v_new_coins
  );
END;
$$;
