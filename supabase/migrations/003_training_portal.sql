-- ============================================================================
-- Training Portal — full data model (all phases)
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Scaffolds every table for Phases 1–3. UI is built phase by phase, but the
-- schema + RLS is created up front so nothing needs re-migrating later.
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                   uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                 text        NOT NULL DEFAULT 'client' CHECK (role IN ('trainer', 'client')),
  full_name            text,
  email                text,
  phone                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  onboarding_complete  boolean     NOT NULL DEFAULT false
);

-- ─── Helper: is the caller a trainer? ────────────────────────────────────────
-- Defined AFTER the profiles table so the SQL body validates at creation time.
-- SECURITY DEFINER so it bypasses RLS on profiles (avoids recursive policy).

CREATE OR REPLACE FUNCTION public.is_trainer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'trainer'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_trainer" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_trainer());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own_or_trainer" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_trainer())
  WITH CHECK (id = auth.uid() OR public.is_trainer());

-- Auto-create a profile row when a new auth user signs up (default role = client)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, onboarding_complete)
  VALUES (
    NEW.id,
    'client',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HEALTH INTAKE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_intake (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dob                      date,
  height                   text,
  weight                   numeric,
  injuries                 text,
  medical_conditions       text,
  medications              text,
  goals                    text,
  activity_level           text,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  submitted_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_intake_client_idx ON public.health_intake (client_id);
ALTER TABLE public.health_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_intake_client_rw" ON public.health_intake
  FOR ALL TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid());

-- ============================================================================
-- LIABILITY WAIVERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.liability_waivers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signed_name     text        NOT NULL,
  agreed          boolean     NOT NULL DEFAULT false,
  signed_at       timestamptz NOT NULL DEFAULT now(),
  ip_address      text,
  waiver_version  text        NOT NULL DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS liability_waivers_client_idx ON public.liability_waivers (client_id);
ALTER TABLE public.liability_waivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waivers_client_rw" ON public.liability_waivers
  FOR ALL TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid());

-- ============================================================================
-- EXERCISE LIBRARY (trainer-owned)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exercises (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  muscle_group  text,
  equipment     text,
  video_url     text,
  default_sets  int,
  default_reps  text,
  cue_notes     text,
  created_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercises_muscle_idx ON public.exercises (muscle_group);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Clients can read the library (needed to render assigned exercises)
CREATE POLICY "exercises_select_authenticated" ON public.exercises
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "exercises_trainer_write" ON public.exercises
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ============================================================================
-- PROGRAMS (reusable templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.programs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  created_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_trainer_all" ON public.programs
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

CREATE TABLE IF NOT EXISTS public.program_days (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid        NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  day_label    text        NOT NULL,
  order_index  int         NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS program_days_program_idx ON public.program_days (program_id);
ALTER TABLE public.program_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_days_trainer_all" ON public.program_days
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

CREATE TABLE IF NOT EXISTS public.program_exercises (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id  uuid        NOT NULL REFERENCES public.program_days(id) ON DELETE CASCADE,
  exercise_id     uuid        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index     int         NOT NULL DEFAULT 0,
  target_sets     int,
  target_reps     text,
  target_rpe      text,
  rest_seconds    int,
  notes           text
);

CREATE INDEX IF NOT EXISTS program_exercises_day_idx ON public.program_exercises (program_day_id);
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_exercises_trainer_all" ON public.program_exercises
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ============================================================================
-- ASSIGNED WORKOUTS (a program/day assigned to a client for a week)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assigned_workouts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id   uuid        REFERENCES public.programs(id) ON DELETE SET NULL,
  week_of      date        NOT NULL,
  day_label    text        NOT NULL,
  status       text        NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  order_index  int         NOT NULL DEFAULT 0,
  assigned_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assigned_workouts_client_week_idx ON public.assigned_workouts (client_id, week_of);
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assigned_workouts_client_select" ON public.assigned_workouts
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer());

-- Clients may flip status to in_progress; trainer can do anything
CREATE POLICY "assigned_workouts_client_update" ON public.assigned_workouts
  FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid() OR public.is_trainer());

CREATE POLICY "assigned_workouts_trainer_write" ON public.assigned_workouts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer());

CREATE POLICY "assigned_workouts_trainer_delete" ON public.assigned_workouts
  FOR DELETE TO authenticated
  USING (public.is_trainer());

CREATE TABLE IF NOT EXISTS public.assigned_exercises (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_id  uuid        NOT NULL REFERENCES public.assigned_workouts(id) ON DELETE CASCADE,
  exercise_id          uuid        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index          int         NOT NULL DEFAULT 0,
  target_sets          int,
  target_reps          text,
  target_rpe           text,
  rest_seconds         int,
  notes                text
);

CREATE INDEX IF NOT EXISTS assigned_exercises_workout_idx ON public.assigned_exercises (assigned_workout_id);
ALTER TABLE public.assigned_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assigned_exercises_client_select" ON public.assigned_exercises
  FOR SELECT TO authenticated
  USING (
    public.is_trainer()
    OR EXISTS (
      SELECT 1 FROM public.assigned_workouts aw
      WHERE aw.id = assigned_workout_id AND aw.client_id = auth.uid()
    )
  );

CREATE POLICY "assigned_exercises_trainer_write" ON public.assigned_exercises
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ============================================================================
-- WORKOUT SESSIONS (client's logged performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_id     uuid        REFERENCES public.assigned_workouts(id) ON DELETE SET NULL,
  client_id               uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at              timestamptz,
  completed_at            timestamptz,
  total_duration_seconds  int,
  submitted               boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_sessions_client_idx ON public.workout_sessions (client_id, created_at DESC);
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sessions_client_rw" ON public.workout_sessions
  FOR ALL TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer())
  WITH CHECK (client_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.set_logs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id   uuid        NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  assigned_exercise_id uuid        REFERENCES public.assigned_exercises(id) ON DELETE SET NULL,
  set_number           int         NOT NULL,
  weight               numeric,
  reps                 int,
  rpe                  numeric,
  rest_taken_seconds   int,
  done                 boolean     NOT NULL DEFAULT false,
  notes                text
);

CREATE INDEX IF NOT EXISTS set_logs_session_idx ON public.set_logs (workout_session_id);
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "set_logs_client_rw" ON public.set_logs
  FOR ALL TO authenticated
  USING (
    public.is_trainer()
    OR EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.client_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws
      WHERE ws.id = workout_session_id AND ws.client_id = auth.uid()
    )
  );

-- ============================================================================
-- NUTRITION PLANS (Phase 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pdf_url     text,
  notes       text,
  protein_g   int,
  carbs_g     int,
  fats_g      int,
  calories    int,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS nutrition_plans_client_idx ON public.nutrition_plans (client_id);
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_plans_client_select" ON public.nutrition_plans
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_trainer());

CREATE POLICY "nutrition_plans_trainer_write" ON public.nutrition_plans
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- ============================================================================
-- STORAGE BUCKETS (private)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutrition-plans', 'nutrition-plans', false,
  20971520, -- 20 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos', 'exercise-videos', false,
  104857600, -- 100 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Trainer can manage all objects in these buckets
CREATE POLICY "trainer_manage_nutrition_plans" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'nutrition-plans' AND public.is_trainer())
  WITH CHECK (bucket_id = 'nutrition-plans' AND public.is_trainer());

CREATE POLICY "trainer_manage_exercise_videos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'exercise-videos' AND public.is_trainer())
  WITH CHECK (bucket_id = 'exercise-videos' AND public.is_trainer());

-- Clients can read their own nutrition plan files (path prefix = their uid)
CREATE POLICY "client_read_own_nutrition" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nutrition-plans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Clients can read exercise videos (path-agnostic; videos are not sensitive)
CREATE POLICY "client_read_exercise_videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'exercise-videos');
