DO $$
BEGIN
  -- Ensure that contact_results is decoupled from the settlement table existence
  -- so the cleanup of older settlements doesn't wipe our operation history
  ALTER TABLE public.contact_results
    DROP CONSTRAINT IF EXISTS contact_results_settlement_id_fkey;

  ALTER TABLE public.contact_results
    ADD CONSTRAINT contact_results_settlement_id_fkey
    FOREIGN KEY (settlement_id) REFERENCES public.settlements(id) ON DELETE SET NULL;
END $$;

CREATE OR REPLACE FUNCTION public.process_conversions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  max_days INT;
  max_score_days INT;
  fast_pts INT;
  late_pts INT;
BEGIN
  -- Parametros do sistema
  SELECT (value->>'max_days')::int INTO max_days FROM public.app_settings WHERE key = 'conversion_params';
  SELECT (value->>'max_score_days')::int INTO max_score_days FROM public.app_settings WHERE key = 'conversion_params';
  
  SELECT (value->>'fast_reversion')::int INTO fast_pts FROM public.app_settings WHERE key = 'score_params';
  SELECT (value->>'late_reversion')::int INTO late_pts FROM public.app_settings WHERE key = 'score_params';
  
  IF max_days IS NULL THEN max_days := 120; END IF;
  IF max_score_days IS NULL THEN max_score_days := 7; END IF;
  IF fast_pts IS NULL THEN fast_pts := 5; END IF;
  IF late_pts IS NULL THEN late_pts := 2; END IF;

  INSERT INTO public.contact_results (
    contact_id, 
    uc, 
    cod_pess_fat, 
    settlement_id, 
    valor_recuperado, 
    data_baixa, 
    dias_para_reversao, 
    pontos_reversao
  )
  SELECT 
    ch.id as contact_id,
    s.uc,
    COALESCE(s.cod_pess_fat, ch.cod_pess_fat) as cod_pess_fat,
    s.id as settlement_id,
    s.valor_total as valor_recuperado,
    COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
    (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
    CASE WHEN (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN fast_pts ELSE late_pts END as pontos_reversao
  FROM public.settlements s
  -- JOIN LATERAL with LIMIT 1 implements the "Lógica de Ciclos".
  -- We link each eligible settlement only to the single most recent valid contact before the settlement date.
  JOIN LATERAL (
    SELECT id, created_at, cod_pess_fat, is_active
    FROM public.contact_history ch2
    WHERE ch2.uc = s.uc 
      AND (ch2.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
      AND ch2.is_active = true
      AND (ch2.created_at AT TIME ZONE 'America/Sao_Paulo')::date <= COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data)
      AND (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch2.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
    ORDER BY ch2.created_at DESC
    LIMIT 1
  ) ch ON true
  WHERE s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO')
    -- Ensures we don't duplicate a result if the settlement was cleaned up and re-imported later.
    AND NOT EXISTS (
      SELECT 1 FROM public.contact_results cr 
      WHERE cr.contact_id = ch.id 
        AND cr.valor_recuperado = s.valor_total 
        AND cr.data_baixa = COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data)
    )
  ON CONFLICT (contact_id, settlement_id) DO NOTHING;
END;
$function$;
