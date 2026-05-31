-- ============================================================================
-- Calendar — per-client events + day notes
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Workouts already live on a date via assigned_workouts.scheduled_date.
-- This adds:
--   • calendar_events — non-workout entries (rest day, in-person session,
--     appointment, check-in reminder, other) the trainer schedules per client.
--   • day_notes       — a note for a specific client + day. author_role lets
--     us support trainer-written notes now and client-written notes later.
-- Additive + re-runnable. RLS: client reads own; trainer reads/writes all.
-- ============================================================================

-- ─── Calendar events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_date  date        NOT NULL,
  type        text        NOT NULL DEFAULT 'other'
                          CHECK (type IN ('rest', 'session', 'appointment', 'checkin', 'other')),
  title       text        NOT NULL,
  notes       text,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calendar_events_client_date_idx
  ON public.calendar_events (client_id, event_date);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select" ON public.calendar_events;
CREATE POLICY "calendar_events_select" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer());

DROP POLICY IF EXISTS "calendar_events_trainer_write" ON public.calendar_events;
CREATE POLICY "calendar_events_trainer_write" ON public.calendar_events
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ─── Day notes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.day_notes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_date    date        NOT NULL,
  note         text        NOT NULL,
  author_role  text        NOT NULL DEFAULT 'trainer' CHECK (author_role IN ('trainer', 'client')),
  created_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, note_date, author_role)
);

CREATE INDEX IF NOT EXISTS day_notes_client_date_idx
  ON public.day_notes (client_id, note_date);

ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;

-- Client reads notes on their own days; trainer reads all.
DROP POLICY IF EXISTS "day_notes_select" ON public.day_notes;
CREATE POLICY "day_notes_select" ON public.day_notes
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer());

-- Trainer may write any note. (Client-authored notes can be enabled later by
-- adding a client policy scoped to author_role = 'client' AND client_id = uid.)
DROP POLICY IF EXISTS "day_notes_trainer_write" ON public.day_notes;
CREATE POLICY "day_notes_trainer_write" ON public.day_notes
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());
