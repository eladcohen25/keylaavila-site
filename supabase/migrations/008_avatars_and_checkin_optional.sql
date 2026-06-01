-- ============================================================================
-- 008 — Client profile pictures + make check-in "push preference" optional
-- Run in Supabase SQL Editor (or `supabase db push`)
-- ============================================================================

-- The "For next week, how do you want it?" question was removed from the
-- check-in form, so the column must accept NULL going forward. Existing rows
-- keep their value.
ALTER TABLE public.checkins
  ALTER COLUMN push_preference DROP NOT NULL;

-- Profile picture for each client.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ── Avatars storage bucket (public read) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Trainer can upload / replace / delete any avatar.
DROP POLICY IF EXISTS "trainer_manage_avatars" ON storage.objects;
CREATE POLICY "trainer_manage_avatars" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND public.is_trainer())
  WITH CHECK (bucket_id = 'avatars' AND public.is_trainer());

-- A client may manage their own avatar (path prefix = their uid).
DROP POLICY IF EXISTS "client_manage_own_avatar" ON storage.objects;
CREATE POLICY "client_manage_own_avatar" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public bucket → objects are readable via the public CDN URL without a policy.
