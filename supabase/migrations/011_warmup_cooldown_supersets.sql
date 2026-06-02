-- ============================================================================
-- 011 — Warm-up / Cool-down sections + supersets
-- Run in Supabase SQL Editor (or `supabase db push`)
--
--   • Warm-up / cool-down: freestyle text + a trainer-set timer (seconds) on
--     both program-builder days and assigned workouts. Shown to the client.
--   • Supersets: assigned_exercises sharing a superset_group are performed
--     back-to-back as one set. superset_order keeps the pair ordered.
-- Additive + re-runnable.
-- ============================================================================

ALTER TABLE public.program_days
  ADD COLUMN IF NOT EXISTS warmup_text      text,
  ADD COLUMN IF NOT EXISTS warmup_seconds   int,
  ADD COLUMN IF NOT EXISTS cooldown_text    text,
  ADD COLUMN IF NOT EXISTS cooldown_seconds int;

ALTER TABLE public.assigned_workouts
  ADD COLUMN IF NOT EXISTS warmup_text      text,
  ADD COLUMN IF NOT EXISTS warmup_seconds   int,
  ADD COLUMN IF NOT EXISTS cooldown_text    text,
  ADD COLUMN IF NOT EXISTS cooldown_seconds int;

ALTER TABLE public.assigned_exercises
  ADD COLUMN IF NOT EXISTS superset_group uuid,
  ADD COLUMN IF NOT EXISTS superset_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS assigned_exercises_superset_idx
  ON public.assigned_exercises (superset_group);
