-- ============================================================
-- Migration: 0002_rls_and_auth_security.sql
--
-- Adds two things on top of the base schema (0001):
--   1. Trigger: auto-creates a profiles row on every new sign-up
--   2. REVOKE: strips anonymous-key write access from sensitive tables
--
-- NOTE: RLS and policies are already defined in 0001_cortex_schema.sql.
--       Column names in `matches` are `player1` and `player2` (not player1_id).
-- ============================================================

-- ── 1. Trigger function: create profile on sign-up ──────────
-- Uses SECURITY DEFINER so it can INSERT into profiles even though
-- auth.users is owned by the Supabase internal role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
    NEW.id,
    -- Derive a default username from email (before the @)
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (idempotent: drop before re-create)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ── 2. Strip anon write access from sensitive tables ─────────
-- The anon role (used by the public/anonymous Supabase key) should
-- never be able to INSERT, UPDATE, or DELETE user data directly.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.answers  FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.matches  FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.battle_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.activity_feed FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM anon;
