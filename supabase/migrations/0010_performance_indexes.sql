-- Migration: 0010_performance_indexes.sql
-- Add missing indexes for frequently queried columns to prevent N+1 and slow queries

-- 1. profiles: rating, xp, streak, last_daily_completed_date for leaderboards, streak calculations
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON public.profiles(streak DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_daily ON public.profiles(last_daily_completed_date);

-- 2. user_daily_progress: user_id + challenge_date for daily challenge lookups
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_user_date ON public.user_daily_progress(user_id, challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_progress_completed ON public.user_daily_progress(user_id, is_completed) WHERE is_completed = true;

-- 3. notifications: user_id + read + created_at for notification lists and unread counts
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- 4. friend_requests: to_user + status for incoming requests, from_user + status for outgoing
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status ON public.friend_requests(to_user, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_status ON public.friend_requests(from_user, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_pending ON public.friend_requests(to_user, status) WHERE status = 'pending';

-- 5. friends: user_a + user_b for friendship lookups (already has UNIQUE), but add for reverse lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_a ON public.friends(user_a);
CREATE INDEX IF NOT EXISTS idx_friends_user_b ON public.friends(user_b);

-- 6. matches: player1 + status, player2 + status for active match queries
CREATE INDEX IF NOT EXISTS idx_matches_player1_status ON public.matches(player1, status);
CREATE INDEX IF NOT EXISTS idx_matches_player2_status ON public.matches(player2, status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status) WHERE status IN ('waiting', 'active');

-- 7. battle_state: match_id (already PK), but add for status filtering
CREATE INDEX IF NOT EXISTS idx_battle_state_status ON public.battle_state(status) WHERE status = 'active';

-- 8. answers: match_id + user_id (already added in 0009), add for question_order
CREATE INDEX IF NOT EXISTS idx_answers_match_order ON public.answers(match_id, question_order);

-- 9. match_questions: match_id + question_order for ordered retrieval
CREATE INDEX IF NOT EXISTS idx_match_questions_order ON public.match_questions(match_id, question_order);

-- 10. activity_feed: user_id + created_at for user activity feeds
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_date ON public.activity_feed(user_id, created_at DESC);

-- 11. presence: last_seen for online user discovery
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen DESC);

-- 12. match_queue: rating for matchmaking
CREATE INDEX IF NOT EXISTS idx_match_queue_rating ON public.match_queue(rating);

-- 13. daily_challenges: date for daily challenge lookup
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON public.daily_challenges(date DESC);

-- 14. questions: type + difficulty for question generation
CREATE INDEX IF NOT EXISTS idx_questions_type_difficulty ON public.questions(type, difficulty);

-- 15. match_submissions: match_id + user_id (already UNIQUE), add for submitted_at
CREATE INDEX IF NOT EXISTS idx_match_submissions_date ON public.match_submissions(submitted_at DESC);