-- ============================================================
-- Migration 0006: Friend System
-- Tables: friend_requests, friends, notifications
-- RPCs: send_friend_request, respond_friend_request
-- ============================================================

-- 1. Friend Requests Table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);

-- 2. Friends Table (normalized: user_a < user_b always)
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: friend_requests
CREATE POLICY "Users can see their own requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "Users can insert their own requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user);
CREATE POLICY "Recipients can update request status" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = to_user);

-- RLS: friends
CREATE POLICY "Users can see their own friendships" ON public.friends
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "System can insert friendships" ON public.friends
  FOR INSERT WITH CHECK (true);

-- RLS: notifications
CREATE POLICY "Users can see own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- RPC: send_friend_request
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_friend_request(p_to_user UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_user UUID := auth.uid();
  v_request_id UUID;
  v_existing_status TEXT;
BEGIN
  IF v_from_user = p_to_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send request to yourself');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.friends
    WHERE user_a = LEAST(v_from_user, p_to_user) AND user_b = GREATEST(v_from_user, p_to_user)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already friends');
  END IF;

  SELECT status INTO v_existing_status
  FROM public.friend_requests
  WHERE from_user = v_from_user AND to_user = p_to_user;

  IF v_existing_status = 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already pending');
  END IF;

  INSERT INTO public.friend_requests(from_user, to_user, status)
  VALUES (v_from_user, p_to_user, 'pending')
  ON CONFLICT (from_user, to_user) DO UPDATE SET status = 'pending', created_at = NOW()
  RETURNING id INTO v_request_id;

  INSERT INTO public.notifications(user_id, type, payload)
  VALUES (
    p_to_user,
    'friend_request',
    jsonb_build_object(
      'request_id', v_request_id,
      'from_user', v_from_user,
      'from_username', (SELECT username FROM public.profiles WHERE id = v_from_user)
    )
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;

-- ============================================================
-- RPC: respond_friend_request
-- ============================================================
CREATE OR REPLACE FUNCTION public.respond_friend_request(
  p_request_id UUID,
  p_accept BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_to_user UUID := auth.uid();
  v_from_user UUID;
  v_status TEXT;
BEGIN
  SELECT from_user, status INTO v_from_user, v_status
  FROM public.friend_requests
  WHERE id = p_request_id AND to_user = v_to_user;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already responded');
  END IF;

  IF p_accept THEN
    UPDATE public.friend_requests SET status = 'accepted' WHERE id = p_request_id;

    INSERT INTO public.friends(user_a, user_b)
    VALUES (LEAST(v_from_user, v_to_user), GREATEST(v_from_user, v_to_user))
    ON CONFLICT (user_a, user_b) DO NOTHING;

    INSERT INTO public.notifications(user_id, type, payload)
    VALUES (
      v_from_user,
      'friend_accepted',
      jsonb_build_object(
        'from_user', v_to_user,
        'from_username', (SELECT username FROM public.profiles WHERE id = v_to_user)
      )
    );

    RETURN jsonb_build_object('success', true, 'accepted', true);
  ELSE
    UPDATE public.friend_requests SET status = 'declined' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'accepted', false);
  END IF;
END;
$$;
