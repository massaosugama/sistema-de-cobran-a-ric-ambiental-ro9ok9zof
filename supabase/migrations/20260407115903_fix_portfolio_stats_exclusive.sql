-- Fix: Make "Emitidas" and "Retidas" mutually exclusive in portfolio statistics
-- Retidas are defined as cases where valor_retidas_em_aberto > 0
-- Emitidas should only include cases where valor_retidas_em_aberto is 0 or null

CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0),
    'total_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
    'total_vencido', COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
    'total_a_vencer', COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
    'total_retidas', COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0), 0),
    'total_retidas_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0),
    'total_lotes_cases', count(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
    'total_lotes_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
  ) INTO result
  FROM public.pending_debts;
  
  RETURN result;
END;
$function$;

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
    count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0) as total_cases,
    COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0) as total_value,
    COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0) as total_vencido,
    COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0) as total_a_vencer,
    COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0), 0) as total_retidas,
    count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0) as total_retidas_cases,
    count(*) FILTER (WHERE COALESCE(setor, '') = '4036') as total_lotes_cases,
    COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0) as total_lotes_value
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
         'total_lotes_value', curr_portfolio.total_lotes_value
       ),
       'previous', json_build_object(
         'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
         'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
         'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
         'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer),
         'total_retidas', COALESCE(prev_portfolio.total_retidas, curr_portfolio.total_retidas),
         'total_retidas_cases', COALESCE(prev_portfolio.total_retidas_cases, curr_portfolio.total_retidas_cases),
         'total_lotes_cases', COALESCE(prev_portfolio.total_lotes_cases, curr_portfolio.total_lotes_cases),
         'total_lotes_value', COALESCE(prev_portfolio.total_lotes_value, curr_portfolio.total_lotes_value)
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
        total_lotes_cases, total_lotes_value
    )
    SELECT 
        CURRENT_DATE,
        COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0),
        COALESCE(SUM(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
        COALESCE(SUM(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
        COALESCE(SUM(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) <= 0), 0),
        COALESCE(SUM(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0), 0),
        COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0),
        COUNT(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
        COALESCE(SUM(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
    FROM public.pending_debts
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value,
        total_vencido = EXCLUDED.total_vencido,
        total_a_vencer = EXCLUDED.total_a_vencer,
        total_retidas = EXCLUDED.total_retidas,
        total_retidas_cases = EXCLUDED.total_retidas_cases,
        total_lotes_cases = EXCLUDED.total_lotes_cases,
        total_lotes_value = EXCLUDED.total_lotes_value;
END;
$function$;
