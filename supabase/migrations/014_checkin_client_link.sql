-- Check-in ↔ client linking cleanup
-- Run in Supabase SQL Editor.
--
-- 1) checkins.client_id previously referenced the legacy public.clients table.
--    The portal now identifies clients by their profiles(id) (= auth uid), so
--    drop the legacy FK and treat client_id as a plain uuid pointing at profiles.
-- 2) Backfill client_id on existing check-ins by matching the typed name to a
--    client profile, so old submissions show up under the right client even if
--    they were submitted through the public form.

ALTER TABLE public.checkins DROP CONSTRAINT IF EXISTS checkins_client_id_fkey;

UPDATE public.checkins c
SET client_id = p.id
FROM public.profiles p
WHERE c.client_id IS NULL
  AND p.role = 'client'
  AND lower(trim(c.client_name)) = lower(trim(coalesce(p.full_name, '')));

-- Any client_id values that pointed at the legacy clients table (not profiles)
-- get re-matched by name too, so the trainer UI resolves them correctly.
UPDATE public.checkins c
SET client_id = p.id
FROM public.profiles p
WHERE p.role = 'client'
  AND lower(trim(c.client_name)) = lower(trim(coalesce(p.full_name, '')))
  AND NOT EXISTS (SELECT 1 FROM public.profiles pp WHERE pp.id = c.client_id);
