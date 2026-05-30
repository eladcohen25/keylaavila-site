-- ============================================================================
-- Workout-logging upgrade — %1RM, tempo, per-set rest, each-side, 1RM maxes
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Additive only: extends existing tables and adds client_exercise_maxes.
-- Safe to re-run (IF NOT EXISTS everywhere). No existing data is touched.
-- ============================================================================

-- ─── Exercise library: target tempo + unilateral flag ───────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS tempo         text,
  ADD COLUMN IF NOT EXISTS is_unilateral boolean NOT NULL DEFAULT false;

-- ─── Program template exercises: prescription extras ─────────────────────────
ALTER TABLE public.program_exercises
  ADD COLUMN IF NOT EXISTS use_percent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tempo       text,
  ADD COLUMN IF NOT EXISTS percent_1rm numeric,
  ADD COLUMN IF NOT EXISTS each_side   boolean NOT NULL DEFAULT false;

-- ─── Assigned (per-client) exercises: same prescription extras ───────────────
ALTER TABLE public.assigned_exercises
  ADD COLUMN IF NOT EXISTS use_percent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tempo       text,
  ADD COLUMN IF NOT EXISTS percent_1rm numeric,
  ADD COLUMN IF NOT EXISTS each_side   boolean NOT NULL DEFAULT false;

-- ─── Logged sets: record the %1RM the client actually trained at ─────────────
ALTER TABLE public.set_logs
  ADD COLUMN IF NOT EXISTS percent_1rm numeric;

-- ============================================================================
-- CLIENT EXERCISE MAXES (powers %1RM → weight auto-calc)
-- One current 1RM per (client, exercise).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_exercise_maxes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  exercise_id  uuid        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  one_rep_max  numeric     NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS client_exercise_maxes_client_idx
  ON public.client_exercise_maxes (client_id);

ALTER TABLE public.client_exercise_maxes ENABLE ROW LEVEL SECURITY;

-- Client reads their own maxes; trainer reads all.
DROP POLICY IF EXISTS "client_maxes_select" ON public.client_exercise_maxes;
CREATE POLICY "client_maxes_select" ON public.client_exercise_maxes
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer());

-- Client may set/adjust their own 1RM (during a session); trainer may write any.
DROP POLICY IF EXISTS "client_maxes_write" ON public.client_exercise_maxes;
CREATE POLICY "client_maxes_write" ON public.client_exercise_maxes
  FOR ALL TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid() OR public.is_trainer());
