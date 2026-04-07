CREATE OR REPLACE FUNCTION public.get_strategic_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
  d1_history json;
  d2_monthly json;
  d3_funnel json;
  d4_performance json;
  d6_profiles json;
BEGIN
  -- DEMANDA 1: Valor da Inadimplência Acumulada
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
  FROM (
    SELECT snapshot_date as date, total_value as value, total_cases as cases
    FROM public.portfolio_history
    ORDER BY snapshot_date ASC
    LIMIT 30
  ) t;

  -- Se não houver histórico, cria um mock básico com o valor atual para visualização
  IF json_array_length(d1_history) = 0 THEN
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
    FROM (
      SELECT current_date as date, SUM(valor_total) as value, COUNT(*) as cases
      FROM public.pending_debts
    ) t;
  END IF;

  -- DEMANDA 2: Inadimplência Mensal (desde Out/24)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d2_monthly
  FROM (
    SELECT 
      COALESCE(refs, 'Sem Ref') as month,
      SUM(valor_total) as value,
      COUNT(*) as cases
    FROM public.pending_debts
    GROUP BY COALESCE(refs, 'Sem Ref')
    ORDER BY SUM(valor_total) DESC
    LIMIT 12
  ) t;

  -- DEMANDA 3: Régua de Cobrança
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d3_funnel
  FROM (
    SELECT 
      contact_type as step,
      COUNT(*) as volume,
      COUNT(DISTINCT uc) as unique_cases
    FROM public.contact_history
    WHERE contact_type IS NOT NULL
    GROUP BY contact_type
    ORDER BY COUNT(*) DESC
  ) t;

  -- DEMANDA 4: Desempenho do Setor
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d4_performance
  FROM (
    SELECT 
      p.name as operator,
      COUNT(ch.id) as contacts,
      COUNT(cr.id) as recoveries,
      COALESCE(SUM(cr.valor_recuperado), 0) as recovered_value
    FROM public.profiles p
    LEFT JOIN public.contact_history ch ON ch.operator_id = p.id
    LEFT JOIN public.contact_results cr ON cr.contact_id = ch.id
    GROUP BY p.name
    ORDER BY COALESCE(SUM(cr.valor_recuperado), 0) DESC
    LIMIT 10
  ) t;

  -- DEMANDA 6: Análise de Perfis (CPF vs CNPJ)
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d6_profiles
  FROM (
    SELECT 
      CASE 
        WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) <= 11 THEN 'Residencial (PF)'
        WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) > 11 THEN 'Comercial (PJ)'
        ELSE 'Não Identificado'
      END as profile_type,
      COUNT(*) as volume,
      SUM(valor_total) as value
    FROM public.pending_debts
    GROUP BY 1
  ) t;

  SELECT json_build_object(
    'd1_history', d1_history,
    'd2_monthly', d2_monthly,
    'd3_funnel', d3_funnel,
    'd4_performance', d4_performance,
    'd6_profiles', d6_profiles
  ) INTO result;

  RETURN result;
END;
$function$;
