-- Cortex Postgres Database Schema & RLS Policies

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  guest_id TEXT UNIQUE,
  avatar_color TEXT DEFAULT '#111111',
  rating INTEGER DEFAULT 1200,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_tactical_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Realtime Presence Table
CREATE TABLE IF NOT EXISTS public.presence (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'online',
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Match Queue Table
CREATE TABLE IF NOT EXISTS public.match_queue (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1 UUID REFERENCES public.profiles(id),
  player2 UUID REFERENCES public.profiles(id),
  winner UUID REFERENCES public.profiles(id),
  rating_delta_p1 INTEGER DEFAULT 0,
  rating_delta_p2 INTEGER DEFAULT 0,
  rematch_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting', -- waiting, active, completed, cancelled
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- 5. Server-Authoritative Battle State Table
CREATE TABLE IF NOT EXISTS public.battle_state (
  match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  current_question INTEGER DEFAULT 1,
  question_started_at TIMESTAMPTZ DEFAULT NOW(),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- 6. Social Activity Feed Table
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'streak_milestone', 'division_promoted', 'daily_puzzle_completed'
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'math',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Match Questions Join Table
CREATE TABLE IF NOT EXISTS public.match_questions (
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  PRIMARY KEY (match_id, question_order)
);

-- 9. Answers Table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  answer TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Daily Puzzles Table
CREATE TABLE IF NOT EXISTS public.daily_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle JSONB NOT NULL,
  solution TEXT NOT NULL,
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE
);

-- 11. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

-- 12. User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Presence is viewable by everyone" ON public.presence FOR SELECT USING (true);
CREATE POLICY "Users can manage own presence" ON public.presence FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Queue is viewable by authenticated users" ON public.match_queue FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own queue entry" ON public.match_queue FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Matches viewable by players" ON public.matches FOR SELECT USING (auth.uid() = player1 OR auth.uid() = player2 OR status = 'active');
CREATE POLICY "Battle state viewable by match players" ON public.battle_state FOR SELECT USING (true);
CREATE POLICY "Activity feed viewable by everyone" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Answers viewable by match players" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Users can insert own answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Questions viewable by authenticated users" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Match questions viewable by authenticated users" ON public.match_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Daily puzzles viewable by everyone" ON public.daily_puzzles FOR SELECT USING (true);
CREATE POLICY "Achievements viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "User achievements viewable by everyone" ON public.user_achievements FOR SELECT USING (true);

-- Realtime Publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_queue;
