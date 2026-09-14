-- Per-client label color, chosen by the trainer.
-- Stored as a hex string (e.g. "#F472B6"); null = no color assigned.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color text;
