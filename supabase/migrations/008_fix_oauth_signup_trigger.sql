-- ============================================================
-- Fix: "Database error saving new user" on Google OAuth signup
--
-- Root cause: send_welcome_email_on_signup() called extensions.http_post
-- which does not exist on Supabase. The AFTER INSERT trigger then failed and
-- rolled back the entire auth.users row.
--
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Harden public.users provisioning (OAuth email fallbacks)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, plan)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.email), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'email'), ''),
      NEW.id::text || '@users.scriptmind.ai'
    ),
    0,
    'free'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Welcome email is best-effort — must NEVER block signup
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net
AS $$
BEGIN
  BEGIN
    -- pg_net (async). Use net.http_post, not extensions.http_post.
    PERFORM net.http_post(
      url := 'https://epwvkctmlbrmmlvmudrv.supabase.co/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwd3ZrY3RtbGJybW1sdm11ZHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MjM2MywiZXhwIjoyMDkyNjI4MzYzfQ.UGdlfcTHeLTmUm-lK1FLnzt5J4XIE7klCtPdYv9WZoY'
      ),
      body := jsonb_build_object(
        'type',   'INSERT',
        'table',  'users',
        'schema', 'auth',
        'record', to_jsonb(NEW)
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log and continue — account creation must succeed even if email fails
      RAISE LOG 'send_welcome_email_on_signup (non-fatal): %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;

CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();
