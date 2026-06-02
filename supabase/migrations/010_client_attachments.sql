-- ============================================================================
-- 010 — Client attachments (trainer-only file storage per client)
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Keyla uploads important docs (PDFs / images) for each client. Clients have
-- NO access — this is trainer-only, like the billing tables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  note        text,
  file_path   text        NOT NULL,
  file_name   text        NOT NULL,
  mime_type   text,
  size_bytes  bigint,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_attachments_client_id_idx
  ON public.client_attachments (client_id);

ALTER TABLE public.client_attachments ENABLE ROW LEVEL SECURITY;

-- Trainer-only: no client policies => clients get zero rows (default deny).
DROP POLICY IF EXISTS "client_attachments_trainer_only" ON public.client_attachments;
CREATE POLICY "client_attachments_trainer_only" ON public.client_attachments
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ─── Private storage bucket (trainer-only) ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-attachments', 'client-attachments', false,
  20971520,  -- 20 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "trainer_manage_client_attachments" ON storage.objects;
CREATE POLICY "trainer_manage_client_attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-attachments' AND public.is_trainer())
  WITH CHECK (bucket_id = 'client-attachments' AND public.is_trainer());
