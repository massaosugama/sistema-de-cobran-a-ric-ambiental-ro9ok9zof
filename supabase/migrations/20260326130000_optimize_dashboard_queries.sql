-- Add indexes to improve dashboard performance
CREATE INDEX IF NOT EXISTS pending_debts_valor_total_idx ON public.pending_debts (valor_total DESC);
CREATE INDEX IF NOT EXISTS contact_history_operator_id_idx ON public.contact_history (operator_id);
CREATE INDEX IF NOT EXISTS contact_history_created_at_idx ON public.contact_history (created_at);
CREATE INDEX IF NOT EXISTS follow_up_tasks_operator_id_idx ON public.follow_up_tasks (operator_id);
CREATE INDEX IF NOT EXISTS follow_up_tasks_created_at_idx ON public.follow_up_tasks (created_at);
CREATE INDEX IF NOT EXISTS contact_history_uc_cod_pess_fat_idx ON public.contact_history (uc, cod_pess_fat);

-- Simplify get_dashboard_evolution (removes expensive GROUP BY)
CREATE OR REPLACE FUNCTION public.get_dashboard_evolution(tz text DEFAULT 'America/Sao_Paulo')
RETURNS json AS $$
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
  -- Snapshot atual da carteira (tempo real)
  SELECT 
    count(*) as total_cases,
    COALESCE(sum(valor_total), 0) as total_value,
    COALESCE(sum(valor_vencido), 0) as total_vencido,
    COALESCE(sum(valor_a_vencer), 0) as total_a_vencer
  INTO curr_portfolio
  FROM public.pending_debts;

  -- Snapshot anterior da carteira (último dia salvo antes de hoje)
  SELECT * INTO prev_portfolio
  FROM public.portfolio_history
  WHERE snapshot_date < today_date
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Produtividade: Totais até o momento
  SELECT count(*) INTO curr_contacts FROM public.contact_history;
  SELECT count(*) INTO curr_followups FROM public.follow_up_tasks;

  -- Produtividade: Totais até o final do dia anterior
  SELECT count(*) INTO prev_contacts 
  FROM public.contact_history 
  WHERE date(created_at AT TIME ZONE tz) < today_date;
  
  SELECT count(*) INTO prev_followups 
  FROM public.follow_up_tasks 
  WHERE date(created_at AT TIME ZONE tz) < today_date;

  -- Constrói o resultado
  SELECT json_build_object(
    'portfolio', json_build_object(
       'current', json_build_object(
         'total_cases', curr_portfolio.total_cases,
         'total_value', curr_portfolio.total_value,
         'total_vencido', curr_portfolio.total_vencido,
         'total_a_vencer', curr_portfolio.total_a_vencer
       ),
       'previous', json_build_object(
         'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
         'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
         'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
         'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplify get_portfolio_stats
CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*),
    'total_value', COALESCE(sum(valor_total), 0),
    'total_vencido', COALESCE(sum(valor_vencido), 0),
    'total_a_vencer', COALESCE(sum(valor_a_vencer), 0)
  ) INTO result
  FROM public.pending_debts;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simplify get_operator_stats (uses LEFT JOIN instead of correlated subqueries)
CREATE OR REPLACE FUNCTION public.get_operator_stats()
RETURNS TABLE (
    operator_id uuid,
    total_contacts bigint,
    today_contacts bigint,
    total_followups bigint,
    today_followups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as operator_id,
        COALESCE(c.total_contacts, 0) as total_contacts,
        COALESCE(c.today_contacts, 0) as today_contacts,
        COALESCE(f.total_followups, 0) as total_followups,
        COALESCE(f.today_followups, 0) as today_followups
    FROM public.profiles p
    LEFT JOIN (
        SELECT 
            ch.operator_id, 
            count(*) as total_contacts,
            sum(CASE WHEN date(ch.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo') THEN 1 ELSE 0 END) as today_contacts
        FROM public.contact_history ch
        GROUP BY ch.operator_id
    ) c ON c.operator_id = p.id
    LEFT JOIN (
        SELECT 
            ft.operator_id, 
            count(*) as total_followups,
            sum(CASE WHEN date(ft.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo') THEN 1 ELSE 0 END) as today_followups
        FROM public.follow_up_tasks ft
        GROUP BY ft.operator_id
    ) f ON f.operator_id = p.id;
END;
$$;

-- Simplify record_portfolio_snapshot
CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
RETURNS void AS $$
BEGIN
    INSERT INTO public.portfolio_history (snapshot_date, total_cases, total_value, total_vencido, total_a_vencer)
    SELECT 
        CURRENT_DATE,
        COUNT(*),
        COALESCE(SUM(valor_total), 0),
        COALESCE(SUM(valor_vencido), 0),
        COALESCE(SUM(valor_a_vencer), 0)
    FROM public.pending_debts
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value,
        total_vencido = EXCLUDED.total_vencido,
        total_a_vencer = EXCLUDED.total_a_vencer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
