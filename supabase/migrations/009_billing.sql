-- ============================================================================
-- 009 — Manual billing ledger (trainer-only)
-- Run in Supabase SQL Editor (or `supabase db push`)
--
-- Charges (+) minus payments (−) = balance. No Stripe / no client access.
-- RLS: ONLY public.is_trainer() — no policies grant clients any access.
-- ============================================================================

-- ─── Recurring charge templates (monthly clients) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_charges (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      numeric(10, 2) NOT NULL CHECK (amount > 0),
  description text           NOT NULL DEFAULT 'Monthly training',
  active      boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recurring_charges_client_id_idx
  ON public.recurring_charges (client_id);

-- ─── Charges (what a client owes) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.charges (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount              numeric(10, 2) NOT NULL CHECK (amount > 0),
  charge_type         text           NOT NULL DEFAULT 'other'
                                     CHECK (charge_type IN ('session', 'monthly', 'package', 'other')),
  description         text           NOT NULL DEFAULT '',
  charge_date         date           NOT NULL DEFAULT (CURRENT_DATE),
  sessions_included   int            CHECK (sessions_included IS NULL OR sessions_included > 0),
  sessions_used       int            NOT NULL DEFAULT 0 CHECK (sessions_used >= 0),
  recurring_charge_id uuid           REFERENCES public.recurring_charges(id) ON DELETE SET NULL,
  created_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS charges_client_id_idx ON public.charges (client_id);
CREATE INDEX IF NOT EXISTS charges_charge_date_idx ON public.charges (charge_date);

-- ─── Payments (what a client paid) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount      numeric(10, 2) NOT NULL CHECK (amount > 0),
  method      text           NOT NULL DEFAULT 'other'
                             CHECK (method IN ('venmo', 'zelle', 'cash', 'other')),
  paid_on     date           NOT NULL DEFAULT (CURRENT_DATE),
  note        text,
  charge_id   uuid           REFERENCES public.charges(id) ON DELETE SET NULL,
  created_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_client_id_idx ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS payments_paid_on_idx ON public.payments (paid_on);

-- ─── RLS: trainer-only (no client policies) ───────────────────────────────────
ALTER TABLE public.recurring_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_charges_trainer_only" ON public.recurring_charges;
CREATE POLICY "recurring_charges_trainer_only" ON public.recurring_charges
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

DROP POLICY IF EXISTS "charges_trainer_only" ON public.charges;
CREATE POLICY "charges_trainer_only" ON public.charges
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

DROP POLICY IF EXISTS "payments_trainer_only" ON public.payments;
CREATE POLICY "payments_trainer_only" ON public.payments
  FOR ALL TO authenticated
  USING (public.is_trainer())
  WITH CHECK (public.is_trainer());

-- Prevent duplicate monthly posts from the same recurring template in one calendar month
CREATE UNIQUE INDEX IF NOT EXISTS charges_recurring_month_unique
  ON public.charges (
    recurring_charge_id,
    (date_trunc('month', charge_date::timestamp))
  )
  WHERE recurring_charge_id IS NOT NULL AND charge_type = 'monthly';
