-- ============================================================
-- ScriptMind AI — Subscription expiry
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ NULL;

-- Index for fast expiry checks
CREATE INDEX IF NOT EXISTS users_plan_expires_at_idx
  ON public.users (plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;
