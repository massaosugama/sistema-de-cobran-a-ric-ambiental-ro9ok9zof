-- Adiciona a nova coluna na tabela de pendências
ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS valor_retidas_em_aberto numeric DEFAULT 0;

-- Adiciona a coluna correspondente no histórico de snapshots para manter a evolução
ALTER TABLE public.portfolio_history ADD COLUMN IF NOT EXISTS total_retidas numeric DEFAULT 0;

-- Atualiza a função de snapshot para registrar o novo campo
CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.portfolio_history (snapshot_date, total_cases, total_value, total_vencido, total_a_vencer, total_retidas)
    SELECT 
        CURRENT_DATE,
        COUNT(*),
        COALESCE(SUM(valor_total), 0),
        COALESCE(SUM(valor_vencido), 0),
        COALESCE(SUM(valor_a_vencer), 0),
        COALESCE(SUM(valor_retidas_em_aberto), 0)
    FROM public.pending_debts
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value,
        total_vencido = EXCLUDED.total_vencido,
        total_a_vencer = EXCLUDED.total_a_vencer,
        total_retidas = EXCLUDED.total_retidas;
END;
$function$;

-- Atualiza a função do Dashboard para retornar os dados retidos
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
  -- Snapshot atual da carteira (tempo real)
  SELECT 
    count(*) as total_cases,
    COALESCE(sum(valor_total), 0) as total_value,
    COALESCE(sum(valor_vencido), 0) as total_vencido,
    COALESCE(sum(valor_a_vencer), 0) as total_a_vencer,
    COALESCE(sum(valor_retidas_em_aberto), 0) as total_retidas
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
         'total_a_vencer', curr_portfolio.total_a_vencer,
         'total_retidas', curr_portfolio.total_retidas
       ),
       'previous', json_build_object(
         'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
         'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
         'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
         'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer),
         'total_retidas', COALESCE(prev_portfolio.total_retidas, curr_portfolio.total_retidas)
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

-- Atualiza as estatísticas globais da carteira
CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*),
    'total_value', COALESCE(sum(valor_total), 0),
    'total_vencido', COALESCE(sum(valor_vencido), 0),
    'total_a_vencer', COALESCE(sum(valor_a_vencer), 0),
    'total_retidas', COALESCE(sum(valor_retidas_em_aberto), 0)
  ) INTO result
  FROM public.pending_debts;
  
  RETURN result;
END;
$function$;
