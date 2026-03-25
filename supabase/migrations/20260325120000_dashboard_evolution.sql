-- Adiciona colunas para acompanhar a evolução do saldo vencido e a vencer no histórico
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'total_vencido') THEN
    ALTER TABLE public.portfolio_history ADD COLUMN total_vencido NUMERIC NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portfolio_history' AND column_name = 'total_a_vencer') THEN
    ALTER TABLE public.portfolio_history ADD COLUMN total_a_vencer NUMERIC NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Atualiza a função de snapshot para gravar os novos campos
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
    FROM (
        SELECT 
            uc, 
            cod_pess_fat, 
            SUM(valor_total) as valor_total,
            SUM(valor_vencido) as valor_vencido,
            SUM(valor_a_vencer) as valor_a_vencer
        FROM public.pending_debts
        GROUP BY uc, cod_pess_fat
    ) unique_cases
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value,
        total_vencido = EXCLUDED.total_vencido,
        total_a_vencer = EXCLUDED.total_a_vencer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria a função para buscar os dados de evolução do dashboard
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
  FROM (
    SELECT uc, cod_pess_fat, sum(valor_total) as valor_total, sum(valor_vencido) as valor_vencido, sum(valor_a_vencer) as valor_a_vencer
    FROM public.pending_debts
    GROUP BY uc, cod_pess_fat
  ) t;

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

  -- Constrói o resultado garantindo que previous não seja nulo (usa current se não houver histórico)
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
