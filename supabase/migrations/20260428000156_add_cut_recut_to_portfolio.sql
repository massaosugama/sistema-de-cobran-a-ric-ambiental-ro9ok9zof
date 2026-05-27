ALTER TABLE public.portfolio_history 
  ADD COLUMN IF NOT EXISTS total_corte_cases integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_corte_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_corte_vencido numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_corte_a_vencer numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_corte_retidas numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_corte_retidas_cases integer DEFAULT 0,
  
  ADD COLUMN IF NOT EXISTS total_recorte_cases integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recorte_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recorte_vencido numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recorte_a_vencer numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recorte_retidas numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recorte_retidas_cases integer DEFAULT 0;

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
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true) as total_cases,
    COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_a_vencer,
    COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_retidas,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true) as total_retidas_cases,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true) as total_lotes_cases,
    COALESCE(sum(pd.valor_total) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_a_vencer,
    
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic') as total_estrat_cases,
    COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_a_vencer,
    COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_retidas,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'strategic') as total_estrat_retidas_cases,

    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal') as total_jurid_cases,
    COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_a_vencer,
    COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_retidas,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'legal') as total_jurid_retidas_cases,

    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut') as total_corte_cases,
    COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_a_vencer,
    COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_retidas,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'cut') as total_corte_retidas_cases,

    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut') as total_recorte_cases,
    COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_value,
    COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_vencido,
    COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_a_vencer,
    COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_retidas,
    count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'recut') as total_recorte_retidas_cases

  INTO curr_portfolio
  FROM public.pending_debts pd
  LEFT JOIN LATERAL (
    SELECT queue_type 
    FROM public.strategic_assignments 
    WHERE uc = pd.uc AND cod_pess_fat = pd.cod_pess_fat 
      AND (
        (queue_type = 'strategic' AND status IN ('pending', 'started')) OR
        (queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) OR
        (queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) OR
        (queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta'))
      )
    LIMIT 1
  ) sa ON true;

  SELECT * INTO prev_portfolio
  FROM public.portfolio_history
  WHERE snapshot_date < today_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  SELECT count(*) INTO curr_contacts FROM public.contact_history;
  SELECT count(*) INTO curr_followups FROM public.follow_up_tasks;
  
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
         'total_lotes_a_vencer', curr_portfolio.total_lotes_a_vencer,
         'total_estrat_cases', curr_portfolio.total_estrat_cases,
         'total_estrat_value', curr_portfolio.total_estrat_value,
         'total_estrat_vencido', curr_portfolio.total_estrat_vencido,
         'total_estrat_a_vencer', curr_portfolio.total_estrat_a_vencer,
         'total_estrat_retidas', curr_portfolio.total_estrat_retidas,
         'total_estrat_retidas_cases', curr_portfolio.total_estrat_retidas_cases,
         'total_jurid_cases', curr_portfolio.total_jurid_cases,
         'total_jurid_value', curr_portfolio.total_jurid_value,
         'total_jurid_vencido', curr_portfolio.total_jurid_vencido,
         'total_jurid_a_vencer', curr_portfolio.total_jurid_a_vencer,
         'total_jurid_retidas', curr_portfolio.total_jurid_retidas,
         'total_jurid_retidas_cases', curr_portfolio.total_jurid_retidas_cases,
         'total_corte_cases', curr_portfolio.total_corte_cases,
         'total_corte_value', curr_portfolio.total_corte_value,
         'total_corte_vencido', curr_portfolio.total_corte_vencido,
         'total_corte_a_vencer', curr_portfolio.total_corte_a_vencer,
         'total_corte_retidas', curr_portfolio.total_corte_retidas,
         'total_corte_retidas_cases', curr_portfolio.total_corte_retidas_cases,
         'total_recorte_cases', curr_portfolio.total_recorte_cases,
         'total_recorte_value', curr_portfolio.total_recorte_value,
         'total_recorte_vencido', curr_portfolio.total_recorte_vencido,
         'total_recorte_a_vencer', curr_portfolio.total_recorte_a_vencer,
         'total_recorte_retidas', curr_portfolio.total_recorte_retidas,
         'total_recorte_retidas_cases', curr_portfolio.total_recorte_retidas_cases
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
         'total_lotes_a_vencer', COALESCE(prev_portfolio.total_lotes_a_vencer, curr_portfolio.total_lotes_a_vencer),
         'total_estrat_cases', COALESCE(prev_portfolio.total_estrat_cases, curr_portfolio.total_estrat_cases),
         'total_estrat_value', COALESCE(prev_portfolio.total_estrat_value, curr_portfolio.total_estrat_value),
         'total_estrat_vencido', COALESCE(prev_portfolio.total_estrat_vencido, curr_portfolio.total_estrat_vencido),
         'total_estrat_a_vencer', COALESCE(prev_portfolio.total_estrat_a_vencer, curr_portfolio.total_estrat_a_vencer),
         'total_estrat_retidas', COALESCE(prev_portfolio.total_estrat_retidas, curr_portfolio.total_estrat_retidas),
         'total_estrat_retidas_cases', COALESCE(prev_portfolio.total_estrat_retidas_cases, curr_portfolio.total_estrat_retidas_cases),
         'total_jurid_cases', COALESCE(prev_portfolio.total_jurid_cases, curr_portfolio.total_jurid_cases),
         'total_jurid_value', COALESCE(prev_portfolio.total_jurid_value, curr_portfolio.total_jurid_value),
         'total_jurid_vencido', COALESCE(prev_portfolio.total_jurid_vencido, curr_portfolio.total_jurid_vencido),
         'total_jurid_a_vencer', COALESCE(prev_portfolio.total_jurid_a_vencer, curr_portfolio.total_jurid_a_vencer),
         'total_jurid_retidas', COALESCE(prev_portfolio.total_jurid_retidas, curr_portfolio.total_jurid_retidas),
         'total_jurid_retidas_cases', COALESCE(prev_portfolio.total_jurid_retidas_cases, curr_portfolio.total_jurid_retidas_cases),
         'total_corte_cases', COALESCE(prev_portfolio.total_corte_cases, curr_portfolio.total_corte_cases),
         'total_corte_value', COALESCE(prev_portfolio.total_corte_value, curr_portfolio.total_corte_value),
         'total_corte_vencido', COALESCE(prev_portfolio.total_corte_vencido, curr_portfolio.total_corte_vencido),
         'total_corte_a_vencer', COALESCE(prev_portfolio.total_corte_a_vencer, curr_portfolio.total_corte_a_vencer),
         'total_corte_retidas', COALESCE(prev_portfolio.total_corte_retidas, curr_portfolio.total_corte_retidas),
         'total_corte_retidas_cases', COALESCE(prev_portfolio.total_corte_retidas_cases, curr_portfolio.total_corte_retidas_cases),
         'total_recorte_cases', COALESCE(prev_portfolio.total_recorte_cases, curr_portfolio.total_recorte_cases),
         'total_recorte_value', COALESCE(prev_portfolio.total_recorte_value, curr_portfolio.total_recorte_value),
         'total_recorte_vencido', COALESCE(prev_portfolio.total_recorte_vencido, curr_portfolio.total_recorte_vencido),
         'total_recorte_a_vencer', COALESCE(prev_portfolio.total_recorte_a_vencer, curr_portfolio.total_recorte_a_vencer),
         'total_recorte_retidas', COALESCE(prev_portfolio.total_recorte_retidas, curr_portfolio.total_recorte_retidas),
         'total_recorte_retidas_cases', COALESCE(prev_portfolio.total_recorte_retidas_cases, curr_portfolio.total_recorte_retidas_cases)
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

CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.portfolio_history (
        snapshot_date, total_cases, total_value, total_vencido, total_a_vencer, total_retidas, total_retidas_cases,
        total_lotes_cases, total_lotes_value, total_lotes_vencido, total_lotes_a_vencer,
        total_estrat_cases, total_estrat_value, total_estrat_vencido, total_estrat_a_vencer, total_estrat_retidas, total_estrat_retidas_cases,
        total_jurid_cases, total_jurid_value, total_jurid_vencido, total_jurid_a_vencer, total_jurid_retidas, total_jurid_retidas_cases,
        total_corte_cases, total_corte_value, total_corte_vencido, total_corte_a_vencer, total_corte_retidas, total_corte_retidas_cases,
        total_recorte_cases, total_recorte_value, total_recorte_vencido, total_recorte_a_vencer, total_recorte_retidas, total_recorte_retidas_cases
    )
    SELECT 
        CURRENT_DATE,
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true),
        COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
        COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true),
        
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true),
        COALESCE(SUM(pd.valor_total) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),

        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'),
        COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
        COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'strategic'),

        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'),
        COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
        COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'legal'),

        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'),
        COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
        COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'cut'),

        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'),
        COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
        COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
        COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
        COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
        COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'recut')

    FROM public.pending_debts pd
    LEFT JOIN LATERAL (
      SELECT queue_type 
      FROM public.strategic_assignments 
      WHERE uc = pd.uc AND cod_pess_fat = pd.cod_pess_fat 
        AND (
          (queue_type = 'strategic' AND status IN ('pending', 'started')) OR
          (queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) OR
          (queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) OR
          (queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta'))
        )
      LIMIT 1
    ) sa ON true
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
        total_lotes_a_vencer = EXCLUDED.total_lotes_a_vencer,
        total_estrat_cases = EXCLUDED.total_estrat_cases,
        total_estrat_value = EXCLUDED.total_estrat_value,
        total_estrat_vencido = EXCLUDED.total_estrat_vencido,
        total_estrat_a_vencer = EXCLUDED.total_estrat_a_vencer,
        total_estrat_retidas = EXCLUDED.total_estrat_retidas,
        total_estrat_retidas_cases = EXCLUDED.total_estrat_retidas_cases,
        total_jurid_cases = EXCLUDED.total_jurid_cases,
        total_jurid_value = EXCLUDED.total_jurid_value,
        total_jurid_vencido = EXCLUDED.total_jurid_vencido,
        total_jurid_a_vencer = EXCLUDED.total_jurid_a_vencer,
        total_jurid_retidas = EXCLUDED.total_jurid_retidas,
        total_jurid_retidas_cases = EXCLUDED.total_jurid_retidas_cases,
        total_corte_cases = EXCLUDED.total_corte_cases,
        total_corte_value = EXCLUDED.total_corte_value,
        total_corte_vencido = EXCLUDED.total_corte_vencido,
        total_corte_a_vencer = EXCLUDED.total_corte_a_vencer,
        total_corte_retidas = EXCLUDED.total_corte_retidas,
        total_corte_retidas_cases = EXCLUDED.total_corte_retidas_cases,
        total_recorte_cases = EXCLUDED.total_recorte_cases,
        total_recorte_value = EXCLUDED.total_recorte_value,
        total_recorte_vencido = EXCLUDED.total_recorte_vencido,
        total_recorte_a_vencer = EXCLUDED.total_recorte_a_vencer,
        total_recorte_retidas = EXCLUDED.total_recorte_retidas,
        total_recorte_retidas_cases = EXCLUDED.total_recorte_retidas_cases;
END;
$function$;
