CREATE OR REPLACE FUNCTION public.trg_validate_assignment()
RETURNS trigger AS $$
BEGIN
  -- Validate if the UC and cod_pess_fat exist and are active in pending_debts
  IF NOT EXISTS (
    SELECT 1 FROM public.pending_debts pd
    WHERE pd.uc = NEW.uc 
      AND pd.cod_pess_fat = NEW.cod_pess_fat 
      AND pd.is_active = true
  ) THEN
    -- Silently drop the insert if validation fails (useful for bulk imports)
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_assignment_insert ON public.strategic_assignments;
CREATE TRIGGER validate_assignment_insert
BEFORE INSERT ON public.strategic_assignments
FOR EACH ROW EXECUTE FUNCTION public.trg_validate_assignment();
