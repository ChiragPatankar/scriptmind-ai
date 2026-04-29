-- ============================================================
-- ScriptMind AI — Finance Studio trial column
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS finance_trial_used BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing rows already have DEFAULT false so no UPDATE needed.
-- Verify:
-- SELECT id, plan, finance_trial_used FROM public.users LIMIT 5;
