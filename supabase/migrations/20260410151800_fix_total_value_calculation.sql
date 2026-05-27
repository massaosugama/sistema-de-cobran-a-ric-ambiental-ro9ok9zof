-- Fix calculation for "Faturas em Aberto" (total_value) to be (valor_total - valor_retidas_em_aberto)

CREATE OR REPLACE FUNCTION public.get_dashboard_evolution(tz text DEFAULT 'America/Sao_Paulo'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  curr_portfolio record;
  prev_portfolio record;
  curr_contacts bigint;
  prev_contacts bigint;
  curr_followups bigint;
  prev_followups bigint;
  today_date date := date(now() AT TIME ZONE tz);
BEGIN
  SELECT 
    count(*) FILTER (WHERE COALESCE(setor, '') != '4036') as total_cases,
    COALESCE(sum(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_value,
    COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_vencido,
    COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_a_vencer,
    COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_retidas,
    count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0) as total_retidas_cases,
    count(*) FILTER (WHERE COALESCE(setor, '') = '4036') as total_lotes_cases,
    COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0) as total_lotes_value,
    COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') = '4036'), 0) as total_lotes_vencido,
    COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') = '4036'), 0) as total_lotes_a_vencer
  INTO curr_portfolio
  FROM public.pending_debts;

  SELECT * INTO prev_portfolio
  FROM public.portfolio_history
  WHERE snapshot_date < today_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  SELECT count(*) INTO curr_contacts FROM public.contact_history;
  SELECT count(*) INTO curr_followups FROM public.follow_up_tasks;

  SELECT count(*) INTO prev_contacts 
  FROM public.contact_history 
  WHERE date(created_at AT TIME ZONE tz) < today_date;
  
  SELECT count(*) INTO prev_followups 
  FROM public.follow_up_tasks 
  WHERE date(created_at AT TIME ZONE tz) < today_date;

  SELECT json_build_object(
    'portfolio', json_build_object(
       'current', json_build_object(
         'total_cases', curr_portfolio.total_cases,
         'total_value', curr_portfolio.total_value,
         'total_vencido', curr_portfolio.total_vencido,
         'total_a_vencer', curr_portfolio.total_a_vencer,
         'total_retidas', curr_portfolio.total_retidas,
         'total_retidas_cases', curr_portfolio.total_retidas_cases,
         'total_lotes_cases', curr_portfolio.total_lotes_cases,
         'total_lotes_value', curr_portfolio.total_lotes_value,
         'total_lotes_vencido', curr_portfolio.total_lotes_vencido,
         'total_lotes_a_vencer', curr_portfolio.total_lotes_a_vencer
       ),
       'previous', json_build_object(
         'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
         'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
         'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
         'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer),
         'total_retidas', COALESCE(prev_portfolio.total_retidas, curr_portfolio.total_retidas),
         'total_retidas_cases', COALESCE(prev_portfolio.total_retidas_cases, curr_portfolio.total_retidas_cases),
         'total_lotes_cases', COALESCE(prev_portfolio.total_lotes_cases, curr_portfolio.total_lotes_cases),
         'total_lotes_value', COALESCE(prev_portfolio.total_lotes_value, curr_portfolio.total_lotes_value),
         'total_lotes_vencido', COALESCE(prev_portfolio.total_lotes_vencido, curr_portfolio.total_lotes_vencido),
         'total_lotes_a_vencer', COALESCE(prev_portfolio.total_lotes_a_vencer, curr_portfolio.total_lotes_a_vencer)
       )
    ),
    'productivity', json_build_object(
       'current', json_build_object(
         'contacts', curr_contacts,
         'followups', curr_followups,
         'updates', 0
       ),
       'previous', json_build_object(
         'contacts', prev_contacts,
         'followups', prev_followups,
         'updates', 0
       )
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.portfolio_history (
        snapshot_date, total_cases, total_value, total_vencido, total_a_vencer, total_retidas, total_retidas_cases,
        total_lotes_cases, total_lotes_value, total_lotes_vencido, total_lotes_a_vencer
    )
    SELECT 
        CURRENT_DATE,
        COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036'),
        COALESCE(SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
        COALESCE(SUM(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
        COALESCE(SUM(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
        COALESCE(SUM(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
        COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0),
        COUNT(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
        COALESCE(SUM(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0),
        COALESCE(SUM(valor_vencido) FILTER (WHERE COALESCE(setor, '') = '4036'), 0),
        COALESCE(SUM(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
    FROM public.pending_debts
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value,
        total_vencido = EXCLUDED.total_vencido,
        total_a_vencer = EXCLUDED.total_a_vencer,
        total_retidas = EXCLUDED.total_retidas,
        total_retidas_cases = EXCLUDED.total_retidas_cases,
        total_lotes_cases = EXCLUDED.total_lotes_cases,
        total_lotes_value = EXCLUDED.total_lotes_value,
        total_lotes_vencido = EXCLUDED.total_lotes_vencido,
        total_lotes_a_vencer = EXCLUDED.total_lotes_a_vencer;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036'),
    'total_value', COALESCE(sum(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
    'total_vencido', COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
    'total_a_vencer', COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
    'total_retidas', COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
    'total_retidas_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0),
    'total_lotes_cases', count(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
    'total_lotes_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
  ) INTO result
  FROM public.pending_debts;
  
  RETURN result;
END;
$function$;

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
    SELECT snapshot_date as date, total_value as value, total_cases as cases
    FROM public.portfolio_history
    ORDER BY snapshot_date ASC
    LIMIT 30
  ) t;

  -- Se não houver histórico, cria um mock básico com o valor atual para visualização
  IF json_array_length(d1_history) = 0 THEN
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
    FROM (
      SELECT current_date as date, SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) as value, COUNT(*) as cases
      FROM public.pending_debts
      WHERE COALESCE(setor, '') != '4036'
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

  -- D6: Análise de Perfis (CPF vs CNPJ) - Com filtros alinhados à visão geral
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
    WHERE COALESCE(setor, '') != '4036'
    GROUP BY 1
  ) t;

  -- Contact Results (Resultado do atendimento)
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

  -- Follow up stats (Saúde da Operação de Retorno)
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
