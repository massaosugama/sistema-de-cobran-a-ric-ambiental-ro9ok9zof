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
  curr_updates bigint;
  prev_updates bigint;
  pending_updates bigint;
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
  
  -- Gather current cadastral update stats
  SELECT count(*) INTO curr_updates FROM public.cadastral_updates WHERE status = 'completed';
  SELECT count(*) INTO pending_updates FROM public.cadastral_updates WHERE status = 'pending';

  SELECT count(*) INTO prev_contacts 
  FROM public.contact_history 
  WHERE date(created_at AT TIME ZONE tz) < today_date;
  
  SELECT count(*) INTO prev_followups 
  FROM public.follow_up_tasks 
  WHERE date(created_at AT TIME ZONE tz) < today_date;

  SELECT count(*) INTO prev_updates 
  FROM public.cadastral_updates 
  WHERE status = 'completed' AND date(resolved_at AT TIME ZONE tz) < today_date;

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
         'updates', curr_updates,
         'pending_updates', pending_updates
       ),
       'previous', json_build_object(
         'contacts', prev_contacts,
         'followups', prev_followups,
         'updates', prev_updates,
         'pending_updates', 0
       )
    )
  ) INTO result;

  RETURN result;
END;
$function$;
