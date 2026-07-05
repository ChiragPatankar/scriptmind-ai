-- ============================================================
-- ScriptMind AI — Projects Database Schema
-- Run once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id                  TEXT        PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  description         TEXT        NOT NULL DEFAULT '',
  type                TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'draft',
  genre               TEXT,
  tags                TEXT[]      DEFAULT '{}',
  word_count          INTEGER,
  target_word_count   INTEGER,
  script_id           TEXT,
  budget              NUMERIC,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- Enable Row Level Security (RLS)
-- ─────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/write their own projects
DROP POLICY IF EXISTS "projects_user_all" ON public.projects;
CREATE POLICY "projects_user_all" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Auto-update updated_at on write
-- ─────────────────────────────────────────
DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- Performance Indexes
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects(created_at DESC);
