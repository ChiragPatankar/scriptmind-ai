-- ============================================================
-- ScriptMind AI — Credits & Usage System
-- Run once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─────────────────────────────────────────
-- 1. USERS TABLE (credit wallet + plan)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  credits    INTEGER     NOT NULL DEFAULT 20,
  plan       TEXT        NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT credits_non_negative CHECK (credits >= 0),
  CONSTRAINT plan_valid            CHECK (plan IN ('free', 'basic', 'pro'))
);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- 2. USAGE LOGS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature      TEXT        NOT NULL,
  credits_used INTEGER     NOT NULL,
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx    ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS usage_logs_created_at_idx ON public.usage_logs(created_at DESC);

-- ─────────────────────────────────────────
-- 3. RLS POLICIES
-- ─────────────────────────────────────────
ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can read only their own row
DROP POLICY IF EXISTS "users_read_own"      ON public.users;
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Service role handles all writes (anon/authenticated never write directly)
DROP POLICY IF EXISTS "users_service_write" ON public.users;
CREATE POLICY "users_service_write" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own logs
DROP POLICY IF EXISTS "logs_read_own"       ON public.usage_logs;
CREATE POLICY "logs_read_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role writes logs
DROP POLICY IF EXISTS "logs_service_write"  ON public.usage_logs;
CREATE POLICY "logs_service_write" ON public.usage_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- 4. AUTO-PROVISION USER ON SIGNUP
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, plan)
  VALUES (NEW.id, NEW.email, 20, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- 5. ATOMIC DEDUCTION RPC
--    Returns: remaining credits (≥ 0)
--             or -1 if insufficient / user missing
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_credits_atomic(
  p_user_id  UUID,
  p_cost     INTEGER,
  p_feature  TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Single atomic UPDATE — no read-then-write, no race condition
  UPDATE public.users
    SET credits = credits - p_cost
  WHERE id = p_user_id
    AND credits >= p_cost
  RETURNING credits INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;   -- insufficient credits OR user row missing
  END IF;

  -- Log in the same transaction — if this fails, UPDATE rolls back
  INSERT INTO public.usage_logs (user_id, feature, credits_used, metadata)
  VALUES (p_user_id, p_feature, p_cost, p_metadata);

  RETURN v_remaining;
END;
$$;

-- ─────────────────────────────────────────
-- 6. ADD CREDITS RPC (for plan upgrades / top-ups)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount  INTEGER,
  p_reason  TEXT DEFAULT 'manual'
)
RETURNS INTEGER   -- new balance
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.users
    SET credits = credits + p_amount
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  INSERT INTO public.usage_logs (user_id, feature, credits_used, metadata)
  VALUES (p_user_id, 'credit_top_up', -p_amount,
          jsonb_build_object('reason', p_reason));

  RETURN v_new_balance;
END;
$$;

-- ─────────────────────────────────────────
-- 7. BACKFILL: provision rows for existing auth users
-- ─────────────────────────────────────────
INSERT INTO public.users (id, email, credits, plan)
SELECT id, email, 20, 'free'
FROM   auth.users
ON CONFLICT (id) DO NOTHING;
