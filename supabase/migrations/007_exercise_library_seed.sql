-- ============================================================================
-- Exercise library — add category + tags, then seed Keyla's catalog
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Adds `category` and `tags` columns, then inserts the full exercise list.
-- Idempotent: each exercise is only inserted if no exercise with that name
-- already exists (case-insensitive), so re-running is safe. created_by is set
-- to the trainer profile.
-- ============================================================================

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags     text;

CREATE INDEX IF NOT EXISTS exercises_category_idx ON public.exercises (category);

INSERT INTO public.exercises (name, muscle_group, category, tags, is_unilateral, created_by)
SELECT v.name, v.muscle_group, v.category, v.tags, v.is_unilateral,
       (SELECT id FROM public.profiles WHERE role = 'trainer' ORDER BY created_at LIMIT 1)
FROM (VALUES
  -- ── Hip Hinge / Posterior Chain ──────────────────────────────────────────
  ('Romanian Deadlift',      'Hamstrings, Glutes',        'Hip Hinge / Posterior Chain', 'Strength, Posterior Chain',   false),
  ('Dumbbell RDL',           'Hamstrings, Glutes',        'Hip Hinge / Posterior Chain', 'Strength',                    false),
  ('Isometric RDL Hold',     'Hamstrings, Glutes',        'Hip Hinge / Posterior Chain', 'Stability, Muscle Awareness', false),
  ('Single Leg RDL',         'Glutes, Hamstrings, Core',  'Hip Hinge / Posterior Chain', 'Balance, Stability',          true),
  ('Banded Good Morning',    'Hamstrings, Glutes',        'Hip Hinge / Posterior Chain', 'Mobility, Strength',          false),
  ('Hip Hinge Drill',        'Hamstrings, Glutes',        'Hip Hinge / Posterior Chain', 'Beginner, Movement Education',false),

  -- ── Upper Body Push ──────────────────────────────────────────────────────
  ('Push Up',                'Chest, Shoulders, Triceps', 'Upper Body Push', 'Functional Training, Core Stability', false),
  ('Incline Push Up',        'Chest, Shoulders, Triceps', 'Upper Body Push', 'Beginner',                            false),
  ('Dumbbell Chest Press',   'Chest, Triceps',            'Upper Body Push', 'Strength',                            false),
  ('Dumbbell Floor Press',   'Chest, Triceps',            'Upper Body Push', 'Shoulder-Friendly',                   false),
  ('Dumbbell Shoulder Press','Shoulders, Triceps',        'Upper Body Push', 'Strength',                            false),
  ('Arnold Press',           'Shoulders',                 'Upper Body Push', 'Strength, Mobility',                  false),
  ('Lateral Raise',          'Lateral Delts',             'Upper Body Push', 'Hypertrophy',                         false),
  ('Front Raise',            'Front Delts',               'Upper Body Push', 'Hypertrophy',                         false),
  ('Y Raise',                'Lower Traps, Shoulders',    'Upper Body Push', 'Posture, Rehabilitation',             false),
  ('Tricep Dips',            'Triceps',                   'Upper Body Push', 'Strength',                            false),
  ('Bench Dips',             'Triceps',                   'Upper Body Push', 'Strength',                            false),
  ('Overhead Tricep Extension','Triceps',                 'Upper Body Push', 'Hypertrophy',                         false),
  ('Tricep Kickback',        'Triceps',                   'Upper Body Push', 'Hypertrophy',                         false),
  ('Chair Tricep Press',     'Triceps',                   'Upper Body Push', 'Pilates, Stability',                  false),

  -- ── Hamstrings & Calves ──────────────────────────────────────────────────
  ('Stability Ball Hamstring Curl', 'Hamstrings',         'Hamstrings & Calves', 'Stability, Core',       false),
  ('Slider Hamstring Curl',         'Hamstrings',         'Hamstrings & Calves', 'Stability',             false),
  ('Single Leg Hamstring Bridge',   'Hamstrings, Glutes', 'Hamstrings & Calves', 'Stability, Balance',    true),
  ('Standing Calf Raise',           'Calves',             'Hamstrings & Calves', 'Functional Training',   false),
  ('Single Leg Calf Raise',         'Calves',             'Hamstrings & Calves', 'Balance',               true),
  ('Seated Calf Raise',             'Soleus',             'Hamstrings & Calves', 'Strength',              false),

  -- ── Upper Body Pull ──────────────────────────────────────────────────────
  ('Dumbbell Row',     'Lats, Rhomboids',       'Upper Body Pull', 'Strength, Posture',             false),
  ('Single Arm Row',   'Lats, Rhomboids',       'Upper Body Pull', 'Unilateral Training',           true),
  ('Bent Over Row',    'Lats, Mid Back',        'Upper Body Pull', 'Strength',                      false),
  ('Renegade Row',     'Lats, Core',            'Upper Body Pull', 'Stability, Functional Training',false),
  ('Reverse Fly',      'Rear Delts, Rhomboids', 'Upper Body Pull', 'Posture',                       false),
  ('Prone Y Raise',    'Lower Traps',           'Upper Body Pull', 'Rehabilitation, Posture',       false),
  ('Prone T Raise',    'Mid Traps',             'Upper Body Pull', 'Rehabilitation, Posture',       false),
  ('Prone W Raise',    'Rotator Cuff',          'Upper Body Pull', 'Rehabilitation',                false),
  ('Dumbbell Curl',    'Biceps',                'Upper Body Pull', 'Strength',                      false),
  ('Hammer Curl',      'Biceps',                'Upper Body Pull', 'Strength, Grip',                false),

  -- ── Core & Stability ─────────────────────────────────────────────────────
  ('Dead Bug',                'Deep Core',           'Core & Stability', 'Rehabilitation, Stability', false),
  ('Bird Dog',                'Core, Glutes',        'Core & Stability', 'Rehabilitation, Stability', false),
  ('Bear Plank',              'Core, Shoulders',     'Core & Stability', 'Stability',                 false),
  ('Plank',                   'Core',                'Core & Stability', 'Stability',                 false),
  ('Forearm Plank',           'Core',                'Core & Stability', 'Stability',                 false),
  ('Shoulder Taps',           'Core, Shoulders',     'Core & Stability', 'Anti-Rotation',             false),
  ('Side Plank',              'Obliques, Glute Medius','Core & Stability','Stability',                true),
  ('Side Plank Reach Through','Obliques',            'Core & Stability', 'Mobility, Stability',       true),
  ('Russian Twist',           'Obliques',            'Core & Stability', 'Athletic Performance',      false),
  ('Bicycle Crunch',          'Abs, Obliques',       'Core & Stability', 'Conditioning',              false),
  ('Mountain Climbers',       'Core, Hip Flexors',   'Core & Stability', 'Conditioning',              false),
  ('Leg Lower',               'Lower Abs',           'Core & Stability', 'Core Control',              false),
  ('Hollow Hold',             'Deep Core',           'Core & Stability', 'Stability',                 false),
  ('Toe Reach',               'Upper Abs',           'Core & Stability', 'Core Endurance',            false),

  -- ── Mobility & Corrective ────────────────────────────────────────────────
  ('90/90 Hip Rotation',            'Hip Rotators',    'Mobility & Corrective', 'Mobility',            false),
  ('Hip Flexor Stretch',            'Hip Flexors',     'Mobility & Corrective', 'Mobility',            true),
  ('Figure 4 Stretch',              'Glutes',          'Mobility & Corrective', 'Mobility',            true),
  ('Adductor Rock Back',            'Adductors',       'Mobility & Corrective', 'Mobility',            false),
  ('Cat Cow',                       'Spine',           'Mobility & Corrective', 'Mobility',            false),
  ('Thoracic Rotation',             'Thoracic Spine',  'Mobility & Corrective', 'Mobility',            false),
  ('Child''s Pose',                 'Lats, Low Back',  'Mobility & Corrective', 'Recovery',            false),
  ('Spine Stretch Forward',         'Posterior Chain', 'Mobility & Corrective', 'Pilates, Mobility',   false),
  ('Mermaid Stretch',               'Obliques, Lats',  'Mobility & Corrective', 'Pilates, Mobility',   true),
  ('Ankle Dorsiflexion Mobilization','Ankles',         'Mobility & Corrective', 'Mobility',            false),
  ('Heel Elevated Squat Hold',      'Quads',           'Mobility & Corrective', 'Mobility, Stability', false),
  ('Calf Stretch',                  'Calves',          'Mobility & Corrective', 'Mobility',            false),

  -- ── Conditioning ─────────────────────────────────────────────────────────
  ('Sled Push',        'Quads, Glutes, Core',    'Conditioning', 'Conditioning, Athletic Performance', false),
  ('Sled Pull',        'Back, Hamstrings',       'Conditioning', 'Conditioning',                       false),
  ('Farmer Carry',     'Grip, Core, Shoulders',  'Conditioning', 'Functional Training',                false),
  ('Battle Ropes',     'Shoulders, Core',        'Conditioning', 'Conditioning',                       false),
  ('Assault Bike',     'Full Body',              'Conditioning', 'Conditioning',                       false),
  ('Row Erg',          'Back, Legs, Core',       'Conditioning', 'Conditioning',                       false),
  ('Ski Erg',          'Lats, Core',             'Conditioning', 'Conditioning',                       false),
  ('Walking Intervals','Cardiovascular System',  'Conditioning', 'Recovery, Conditioning',             false),
  ('Jog Intervals',    'Cardiovascular System',  'Conditioning', 'Conditioning',                       false),
  ('Stair Climber',    'Glutes, Quads',          'Conditioning', 'Conditioning',                       false),
  ('Pogo Hops',        'Calves',                 'Conditioning', 'Athletic Performance',               false),
  ('Skipping',         'Calves',                 'Conditioning', 'Athletic Performance',               false),
  ('Bear Crawl',       'Core, Shoulders, Quads', 'Conditioning', 'Stability, Conditioning',            false)
) AS v(name, muscle_group, category, tags, is_unilateral)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE lower(e.name) = lower(v.name)
);
