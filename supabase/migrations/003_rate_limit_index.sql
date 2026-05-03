-- ============================================================
-- ScriptMind AI — Composite index for daily rate-limit queries
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Speeds up: COUNT(*) WHERE user_id = ? AND feature = ? AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS usage_logs_rate_limit_idx
  ON public.usage_logs (user_id, feature, created_at DESC);
