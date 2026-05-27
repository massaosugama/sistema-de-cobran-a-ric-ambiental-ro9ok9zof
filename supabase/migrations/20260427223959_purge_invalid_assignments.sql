DO $$
BEGIN
  -- Purge invalid strategic assignments created today (2026-04-27)
  -- Deletes records that don't have an active counterpart in pending_debts
  DELETE FROM public.strategic_assignments sa
  WHERE DATE(sa.created_at AT TIME ZONE 'America/Sao_Paulo') = '2026-04-27'
    AND NOT EXISTS (
      SELECT 1 FROM public.pending_debts pd
      WHERE pd.uc = sa.uc 
        AND pd.cod_pess_fat = sa.cod_pess_fat 
        AND pd.is_active = true
    );
END $$;
