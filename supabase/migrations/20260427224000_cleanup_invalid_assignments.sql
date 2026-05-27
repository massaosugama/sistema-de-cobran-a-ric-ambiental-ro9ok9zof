DO $$
BEGIN
  -- Delete invalid assignments created today from mass transfer or manual assignments 
  -- that do not have an active corresponding record in pending_debts
  DELETE FROM public.strategic_assignments sa
  WHERE sa.created_at >= '2026-04-27 00:00:00-03' 
    AND sa.created_at < '2026-04-28 00:00:00-03'
    AND NOT EXISTS (
      SELECT 1 FROM public.pending_debts pd
      WHERE pd.uc = sa.uc 
        AND pd.cod_pess_fat = sa.cod_pess_fat
        AND pd.is_active = true
    );
END $$;
