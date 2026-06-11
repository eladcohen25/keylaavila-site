-- ============================================================================
-- 013 — Single-session workout templates
-- Run in Supabase SQL Editor (or `supabase db push`)
--
--   • workout_templates: a reusable single-session workout (e.g. "Upper Body
--     Day") with optional warm-up / cool-down. Trainer-only.
--   • workout_template_exercises: ordered exercises with the same prescription
--     fields and superset support as assigned_exercises, so a template can be
--     cloned 1:1 into a client's assigned workout.
-- Additive + re-runnable.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  description      text,
  warmup_text      text,
  warmup_seconds   int,
  cooldown_text    text,
  cooldown_seconds int,
  created_by       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_templates_trainer_all" ON public.workout_templates;
CREATE POLICY "workout_templates_trainer_all" ON public.workout_templates
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_template_id uuid        NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id         uuid        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index         int         NOT NULL DEFAULT 0,
  target_sets         int,
  target_reps         text,
  target_rpe          text,
  rest_seconds        int,
  notes               text,
  use_percent         boolean     NOT NULL DEFAULT false,
  tempo               text,
  percent_1rm         numeric,
  each_side           boolean     NOT NULL DEFAULT false,
  superset_group      uuid,
  superset_order      int         NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS workout_template_exercises_tpl_idx
  ON public.workout_template_exercises (workout_template_id);
CREATE INDEX IF NOT EXISTS workout_template_exercises_superset_idx
  ON public.workout_template_exercises (superset_group);

ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_template_exercises_trainer_all" ON public.workout_template_exercises;
CREATE POLICY "workout_template_exercises_trainer_all" ON public.workout_template_exercises
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());
