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
  
  IF max_days IS NULL THEN max_days := 30; END IF;
  IF max_score_days IS NULL THEN max_score_days := 7; END IF;
  IF fast_pts IS NULL THEN fast_pts := 5; END IF;
  IF late_pts IS NULL THEN late_pts := 2; END IF;

  INSERT INTO public.contact_results (contact_id, uc, cod_pess_fat, settlement_id, valor_recuperado, data_baixa, dias_para_reversao, pontos_reversao)
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
  JOIN public.contact_history ch ON ch.uc = s.uc AND (ch.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
  WHERE 
    ch.is_active = true
    AND s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO')
    AND COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) >= (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
  ON CONFLICT (contact_id, settlement_id) DO NOTHING;
END;
$function$;
