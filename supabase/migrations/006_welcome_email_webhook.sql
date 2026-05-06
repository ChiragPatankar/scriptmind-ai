-- Trigger a welcome email via Edge Function whenever a new user signs up
-- Works for both email/password and OAuth (Google, etc.)
-- Uses pg_net extension (built into Supabase) to make the HTTP call

-- Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Trigger function: fires on every new auth.users row
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM extensions.http_post(
    url     := 'https://epwvkctmlbrmmlvmudrv.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwd3ZrY3RtbGJybW1sdm11ZHJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MjM2MywiZXhwIjoyMDkyNjI4MzYzfQ.UGdlfcTHeLTmUm-lK1FLnzt5J4XIE7klCtPdYv9WZoY'
    ),
    body    := to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-runs
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_email ON auth.users;

CREATE TRIGGER on_auth_user_created_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.send_welcome_email_on_signup();
