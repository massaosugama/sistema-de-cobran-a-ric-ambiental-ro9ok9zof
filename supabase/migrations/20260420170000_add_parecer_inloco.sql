DO $$
BEGIN
  ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS parecer_inloco text;
END $$;
