-- ============================================================================
-- Per-day workout scheduling
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Adds an optional calendar date to an assigned workout so the trainer can
-- pin a session to a specific day (e.g. a client moved their workout or did an
-- in-person session). week_of still groups workouts into weeks; scheduled_date
-- is the exact day it should appear for the client. Additive + re-runnable.
-- ============================================================================

ALTER TABLE public.assigned_workouts
  ADD COLUMN IF NOT EXISTS scheduled_date date;

CREATE INDEX IF NOT EXISTS assigned_workouts_client_date_idx
  ON public.assigned_workouts (client_id, scheduled_date);
