ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS previous_queue TEXT;
ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS previous_status TEXT;

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_strategic_assignments_updated_at ON public.strategic_assignments;
CREATE TRIGGER set_strategic_assignments_updated_at
BEFORE UPDATE ON public.strategic_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
