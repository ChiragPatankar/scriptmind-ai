-- ============================================================
-- Scene-by-scene analysis: async job queue
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature       TEXT        NOT NULL DEFAULT 'scene_analysis'
                            CHECK (feature IN ('scene_analysis')),
  status        TEXT        NOT NULL DEFAULT 'queued'
                            CHECK (status IN (
                              'queued', 'parsing', 'batching', 'analyzing',
                              'aggregating', 'completed', 'failed'
                            )),
  progress_pct  INTEGER     NOT NULL DEFAULT 0
                            CHECK (progress_pct >= 0 AND progress_pct <= 100),
  phase_message TEXT,
  input_meta    JSONB       NOT NULL DEFAULT '{}',
  result        JSONB,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analysis_jobs_user_created_idx
  ON public.analysis_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analysis_jobs_status_idx
  ON public.analysis_jobs (status)
  WHERE status NOT IN ('completed', 'failed');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.analysis_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS analysis_jobs_updated_at ON public.analysis_jobs;
CREATE TRIGGER analysis_jobs_updated_at
  BEFORE UPDATE ON public.analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION public.analysis_jobs_updated_at();

ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analysis_jobs_read_own" ON public.analysis_jobs;
CREATE POLICY "analysis_jobs_read_own" ON public.analysis_jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "analysis_jobs_service_all" ON public.analysis_jobs;
CREATE POLICY "analysis_jobs_service_all" ON public.analysis_jobs
  FOR ALL USING (auth.role() = 'service_role');
