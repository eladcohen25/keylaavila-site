-- Weekly client check-ins
-- Run in Supabase SQL Editor or via `supabase db push`

-- ─── Table ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checkins (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL    DEFAULT now(),

  client_name         text        NOT NULL,
  week_of             date        NOT NULL,

  weight              numeric,
  waist               numeric,
  hips                numeric,
  chest               numeric,
  arms                numeric,
  thighs              numeric,

  photo_front_url     text,
  photo_back_url      text,

  sessions_with_keyla int         NOT NULL,
  solo_session        text        CHECK (solo_session IN ('completed', 'partial', 'skipped')),
  session_difficulty  text        NOT NULL CHECK (session_difficulty IN ('too_easy', 'just_right', 'too_hard')),
  push_preference     text        NOT NULL CHECK (push_preference IN ('push_more', 'keep_same', 'ease_off')),

  nutrition_rating    int         NOT NULL CHECK (nutrition_rating BETWEEN 1 AND 5),
  nutrition_notes     text,
  sleep_hours         numeric,

  recovery            text        NOT NULL CHECK (recovery IN ('fresh', 'okay', 'sore', 'exhausted')),
  energy_mood         int         NOT NULL CHECK (energy_mood BETWEEN 1 AND 5),

  weekly_notes        text
);

CREATE INDEX IF NOT EXISTS checkins_week_of_idx    ON public.checkins (week_of DESC);
CREATE INDEX IF NOT EXISTS checkins_client_name_idx ON public.checkins (client_name);

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Public form submits via the Next.js API (service role). This policy also
-- allows direct anon inserts if you ever wire the client to Supabase directly.
CREATE POLICY "anon_insert_checkins"
  ON public.checkins
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (Keyla) can read submissions.
CREATE POLICY "authenticated_select_checkins"
  ON public.checkins
  FOR SELECT
  TO authenticated
  USING (true);

-- ─── Storage bucket (private) ────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checkin-photos',
  'checkin-photos',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Service role (used by /api/checkin) bypasses storage RLS.
-- Optional: allow authenticated users to read their own folder later.
CREATE POLICY "authenticated_read_checkin_photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'checkin-photos');
