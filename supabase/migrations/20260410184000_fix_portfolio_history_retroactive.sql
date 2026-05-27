DO $$
BEGIN
  -- 1. Apply the new rule (Total - Retidas) for historical data starting from 03/04/2026 up to 09/04/2026.
  -- We don't touch dates before 03/04 because total_retidas wasn't reliably separated.
  UPDATE public.portfolio_history
  SET total_value = total_value - COALESCE(total_retidas, 0)
  WHERE snapshot_date >= '2026-04-03'::date 
    AND snapshot_date <= '2026-04-09'::date
    AND COALESCE(total_retidas, 0) > 0;

  -- 2. Execute the snapshot function manually to overwrite today's record
  -- using the new rule embedded in the recently updated function.
  PERFORM public.record_portfolio_snapshot();
END $$;
