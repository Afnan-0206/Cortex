-- 15. Daily Challenge Tables & Server-Authoritative Streak Function (Idempotent)

-- Add dedicated last_daily_completed_date column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_daily_completed_date DATE;

-- 1. Predefined Daily Challenges Table (1 per date)
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  sections JSONB NOT NULL,
  total_questions INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Persistent User Daily Progress Table
CREATE TABLE IF NOT EXISTS public.user_daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  completed_sections INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  user_answers JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies (Safely drop if already exists)
DROP POLICY IF EXISTS "Daily challenges viewable by everyone" ON public.daily_challenges;
CREATE POLICY "Daily challenges viewable by everyone" ON public.daily_challenges 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own daily progress" ON public.user_daily_progress;
CREATE POLICY "Users can manage own daily progress" ON public.user_daily_progress 
  FOR ALL USING (auth.uid() = user_id);

-- Safely add to Realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'user_daily_progress'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_daily_progress;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Dynamic Server-Authoritative Completion & Streak RPC Function
CREATE OR REPLACE FUNCTION public.complete_daily_challenge(
  p_user_id UUID,
  p_challenge_date DATE,
  p_answers JSONB,
  p_completed_sections INTEGER DEFAULT 4,
  p_total_questions INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_completed BOOLEAN;
  v_last_date DATE;
  v_current_streak INTEGER;
  v_best_streak INTEGER;
  v_new_streak INTEGER;
  v_new_best INTEGER;
  v_new_xp INTEGER;
  v_new_coins INTEGER;
BEGIN
  -- 1. Check if already completed today
  SELECT is_completed INTO v_already_completed
  FROM public.user_daily_progress
  WHERE user_id = p_user_id AND challenge_date = p_challenge_date;

  IF v_already_completed IS TRUE THEN
    SELECT xp, coins, streak, best_streak 
    INTO v_new_xp, v_new_coins, v_new_streak, v_new_best
    FROM public.profiles WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_completed_today',
      'new_streak', COALESCE(v_new_streak, 1),
      'new_best_streak', COALESCE(v_new_best, 1),
      'xp_earned', 0,
      'coins_earned', 0,
      'total_xp', COALESCE(v_new_xp, 0),
      'total_coins', COALESCE(v_new_coins, 0)
    );
  END IF;

  -- 2. Fetch current user streak metrics using dedicated last_daily_completed_date
  SELECT streak, best_streak, last_daily_completed_date 
  INTO v_current_streak, v_best_streak, v_last_date
  FROM public.profiles
  WHERE id = p_user_id;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_best_streak := COALESCE(v_best_streak, 0);

  -- 3. Calculate streak increment or reset
  IF v_last_date = (p_challenge_date - INTERVAL '1 day')::DATE THEN
    v_new_streak := v_current_streak + 1;
  ELSIF v_last_date = p_challenge_date THEN
    v_new_streak := GREATEST(v_current_streak, 1);
  ELSE
    v_new_streak := 1;
  END IF;

  v_new_best := GREATEST(v_best_streak, v_new_streak);

  -- 4. Update Profile with dedicated last_daily_completed_date, streak & rewards
  UPDATE public.profiles
  SET
    streak = v_new_streak,
    best_streak = v_new_best,
    last_daily_completed_date = p_challenge_date,
    xp = COALESCE(xp, 0) + 250,
    rating = COALESCE(rating, 1200) + 15,
    coins = COALESCE(coins, 0) + 50
  WHERE id = p_user_id
  RETURNING xp, coins INTO v_new_xp, v_new_coins;

  -- 5. Mark daily progress record completed using dynamic section/question counts
  INSERT INTO public.user_daily_progress (
    user_id, challenge_date, completed_sections, current_question_index, user_answers, is_completed, completed_at
  )
  VALUES (
    p_user_id, p_challenge_date, p_completed_sections, p_total_questions, p_answers, true, NOW()
  )
  ON CONFLICT (user_id, challenge_date) DO UPDATE
  SET
    completed_sections = p_completed_sections,
    current_question_index = p_total_questions,
    user_answers = p_answers,
    is_completed = true,
    completed_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'new_streak', v_new_streak,
    'new_best_streak', v_new_best,
    'xp_earned', 250,
    'coins_earned', 50,
    'total_xp', v_new_xp,
    'total_coins', v_new_coins
  );
END;
$$;
