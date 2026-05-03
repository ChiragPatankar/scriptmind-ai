-- ============================================================
-- Migration 005: Profile preferences
-- Add notification_prefs (JSONB) and theme_preference (TEXT)
-- to public.profiles, and create the avatars storage bucket.
-- ============================================================

-- 1. Ensure profiles table exists with base columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  username   TEXT,
  location   TEXT,
  bio        TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add new columns (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
    "email_updates":    true,
    "credit_alerts":    true,
    "project_activity": false,
    "weekly_digest":    true,
    "marketing":        false
  }'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'dark';

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- 4. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own"   ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_write_own"  ON public.profiles;
CREATE POLICY "profiles_write_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 5. Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read for all avatars
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
