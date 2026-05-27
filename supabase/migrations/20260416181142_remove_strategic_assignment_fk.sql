DO $$
BEGIN
  ALTER TABLE public.strategic_assignments
    DROP CONSTRAINT IF EXISTS strategic_assignments_uc_cod_pess_fat_fkey;
END $$;
