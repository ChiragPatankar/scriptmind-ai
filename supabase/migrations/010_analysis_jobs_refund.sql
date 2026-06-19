-- ============================================================
-- Scene analysis: track credit refunds for failed jobs
-- Adds a `refunded` flag so credits are returned exactly once
-- when a scene job ends in the 'failed' state.
-- ============================================================

ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS refunded BOOLEAN NOT NULL DEFAULT FALSE;
