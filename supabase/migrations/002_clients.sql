-- Clients table + link to checkins
-- Run in Supabase SQL Editor

-- ─── Clients table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL    DEFAULT now(),
  name        text        NOT NULL,
  email       text,
  phone       text,
  notes       text,
  active      boolean     NOT NULL    DEFAULT true
);

CREATE INDEX IF NOT EXISTS clients_name_idx ON public.clients (name);

-- ─── Link checkins to clients ────────────────────────────────────────────────

ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
CREATE INDEX IF NOT EXISTS checkins_client_id_idx ON public.checkins(client_id);

-- ─── RLS for clients ─────────────────────────────────────────────────────────

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Authenticated (Keyla) can do everything
CREATE POLICY "authenticated_all_clients"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role (API routes) can read clients to validate IDs on check-in
CREATE POLICY "service_role_select_clients"
  ON public.clients
  FOR SELECT
  TO service_role
  USING (true);

-- ─── Update checkins RLS to allow service role insert with client_id ─────────

-- Allow service role full access (it already bypasses RLS, but explicit for clarity)
-- The anon insert policy already exists from 001_checkins.sql
-- Add authenticated SELECT for the admin panel (already exists from 001)

-- Allow authenticated users to see all checkins (admin reads)
-- This policy may already exist; use IF NOT EXISTS via DO block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_select_checkins' AND tablename = 'checkins'
  ) THEN
    CREATE POLICY "authenticated_select_checkins"
      ON public.checkins
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
