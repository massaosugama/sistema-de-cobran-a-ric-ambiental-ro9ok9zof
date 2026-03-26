-- 1. Remove invalid records from contact_results
DELETE FROM public.contact_results
WHERE settlement_id IN (
  SELECT id FROM public.settlements
  WHERE tipo_baixa NOT IN ('CONV.ARREC', 'DEB.AUTO')
);

-- 2. Update the function process_conversions
CREATE OR REPLACE FUNCTION public.process_conversions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  max_days INT;
  max_score_days INT;
BEGIN
  -- Get params
  SELECT (value->>'max_days')::int INTO max_days FROM public.app_settings WHERE key = 'conversion_params';
  SELECT (value->>'max_score_days')::int INTO max_score_days FROM public.app_settings WHERE key = 'conversion_params';
  
  IF max_days IS NULL THEN max_days := 30; END IF;
  IF max_score_days IS NULL THEN max_score_days := 7; END IF;

  INSERT INTO public.contact_results (contact_id, uc, cod_pess_fat, settlement_id, valor_recuperado, data_baixa, dias_para_reversao, pontos_reversao)
  SELECT 
    ch.id as contact_id,
    s.uc,
    COALESCE(s.cod_pess_fat, ch.cod_pess_fat) as cod_pess_fat,
    s.id as settlement_id,
    s.valor_total as valor_recuperado,
    COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
    (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
    CASE WHEN (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN 5 ELSE 2 END as pontos_reversao
  FROM public.settlements s
  JOIN public.contact_history ch ON ch.uc = s.uc AND (ch.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
  WHERE 
    ch.is_active = true
    AND s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO') -- REVISED BUSINESS RULE
    AND COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) >= (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
  ON CONFLICT (contact_id, settlement_id) DO NOTHING;
END;
$function$;
