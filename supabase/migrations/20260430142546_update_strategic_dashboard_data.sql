CREATE OR REPLACE FUNCTION public.get_strategic_dashboard_data()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  d1_history json;
  d2_operator_channel json;
  d4_performance json;
  d6_profiles json;
  contact_results json;
  follow_up_stats json;
BEGIN
  -- D1: Valor da Inadimplência Acumulada
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
  FROM (
    SELECT snapshot_date as date, total_value as value, total_vencido as vencido, total_cases as cases
    FROM public.portfolio_history
    WHERE snapshot_date >= '2026-04-01'
    ORDER BY snapshot_date ASC
  ) t;

  IF json_array_length(d1_history) = 0 THEN
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
    FROM (
      SELECT current_date as date, SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) as value, SUM(valor_vencido) as vencido, COUNT(*) as cases
      FROM public.pending_debts
      WHERE COALESCE(setor, '') != '4036' AND is_active = true
    ) t;
  END IF;

  -- D2: Atuação por Operador e Canal
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d2_operator_channel
  FROM (
    SELECT 
      COALESCE(p.first_name, p.name, 'SISTEMA') as operator,
      ch.contact_type as channel,
      COUNT(*) as count
    FROM public.contact_history ch
    LEFT JOIN public.profiles p ON p.id = ch.operator_id
    WHERE ch.contact_type IS NOT NULL
    GROUP BY COALESCE(p.first_name, p.name, 'SISTEMA'), ch.contact_type
  ) t;

  -- D4: Desempenho do Setor
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d4_performance
  FROM (
    SELECT 
      COALESCE(p.first_name, p.name, 'SISTEMA') as operator,
      COUNT(ch.id) as contacts,
      COUNT(cr.id) as recoveries,
      COALESCE(SUM(cr.valor_recuperado), 0) as recovered_value
    FROM public.contact_history ch
    LEFT JOIN public.profiles p ON p.id = ch.operator_id
    LEFT JOIN public.contact_results cr ON cr.contact_id = ch.id
    GROUP BY COALESCE(p.first_name, p.name, 'SISTEMA')
    ORDER BY COALESCE(SUM(cr.valor_recuperado), 0) DESC
    LIMIT 10
  ) t;

  -- D6: Análise de Perfis (CPF vs CNPJ) - Apenas ativos
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d6_profiles
  FROM (
    SELECT 
      CASE 
        WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) <= 11 THEN 'Residencial (PF)'
        WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) > 11 THEN 'Comercial (PJ)'
        ELSE 'Não Identificado'
      END as profile_type,
      COUNT(*) as volume,
      SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) as value
    FROM public.pending_debts
    WHERE COALESCE(setor, '') != '4036' AND is_active = true
    GROUP BY 1
  ) t;

  -- Contact Results
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO contact_results
  FROM (
    SELECT 
      COALESCE(status, 'Sem Status') as status,
      COUNT(*) as count
    FROM public.contact_history
    WHERE status IS NOT NULL
    GROUP BY status
    ORDER BY count DESC
  ) t;

  -- Follow up stats
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO follow_up_stats
  FROM (
    SELECT 
      CASE 
        WHEN completed = true THEN 'Concluído'
        WHEN due_date < CURRENT_DATE THEN 'Atrasado'
        WHEN due_date = CURRENT_DATE THEN 'Hoje'
        ELSE 'No Prazo/Futuro'
      END as status,
      COUNT(*) as count
    FROM public.follow_up_tasks
    GROUP BY 1
    ORDER BY count DESC
  ) t;

  SELECT json_build_object(
    'd1_history', d1_history,
    'd2_operator_channel', d2_operator_channel,
    'd4_performance', d4_performance,
    'd6_profiles', d6_profiles,
    'contact_results', contact_results,
    'follow_up_stats', follow_up_stats
  ) INTO result;

  RETURN result;
END;
$function$;
