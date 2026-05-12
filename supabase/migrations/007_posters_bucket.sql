-- Create the posters storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posters',
  'posters',
  true,
  5242880,  -- 5 MB max per poster
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "posters_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'posters' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own posters
CREATE POLICY "posters_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'posters' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own posters
CREATE POLICY "posters_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'posters' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for all posters (the bucket is public)
CREATE POLICY "posters_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'posters');
