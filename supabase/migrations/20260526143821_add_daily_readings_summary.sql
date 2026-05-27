-- Create the consolidated summary table for daily readings
CREATE TABLE IF NOT EXISTS public.daily_readings_summary (
  day DATE PRIMARY KEY,
  total_readings INTEGER NOT NULL DEFAULT 0,
  reader_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and setup policies
ALTER TABLE public.daily_readings_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_summary" ON public.daily_readings_summary;
CREATE POLICY "authenticated_select_summary" ON public.daily_readings_summary
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_all_summary" ON public.daily_readings_summary;
CREATE POLICY "authenticated_all_summary" ON public.daily_readings_summary
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create function to refresh the summary for a given month
CREATE OR REPLACE FUNCTION public.refresh_daily_readings_summary(p_month timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  -- Delete existing records for the month to allow clean aggregation
  DELETE FROM public.daily_readings_summary
  WHERE day >= v_start_date AND day <= v_end_date;

  -- Insert aggregated data
  WITH daily_data AS (
    SELECT 
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE AS day_date,
      COUNT(*) as total_readings,
      dr.usuario_id
    FROM public.daily_readings dr
    WHERE dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
    GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE, dr.usuario_id
  ),
  aggregated AS (
    SELECT 
      day_date as day,
      SUM(total_readings)::INT as total_readings,
      jsonb_object_agg(COALESCE(usuario_id, 'UNKNOWN'), total_readings) as reader_stats
    FROM daily_data
    GROUP BY day_date
  )
  INSERT INTO public.daily_readings_summary (day, total_readings, reader_stats, updated_at)
  SELECT day, total_readings, reader_stats, NOW()
  FROM aggregated;
END;
$$;

-- Refactor execute_post_import_routines to also refresh the summary
CREATE OR REPLACE FUNCTION public.execute_post_import_routines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1º: Limpeza de dados baseada no prazo de retenção (retention_days lido do app_settings)
  PERFORM public.cleanup_old_settlements();
  
  -- 2º: Processamento do motor de cálculo de conversões apenas nos dados que restaram e são elegíveis
  PERFORM public.process_conversions();

  -- 3º: Atualização das métricas de dias úteis (mês atual e anterior para garantir histórico atualizado)
  PERFORM public.recalculate_working_days_metrics(NOW());
  PERFORM public.recalculate_working_days_metrics(NOW() - INTERVAL '1 month');

  -- 4º: Atualização da tabela de resumo diário
  PERFORM public.refresh_daily_readings_summary(NOW());
  PERFORM public.refresh_daily_readings_summary(NOW() - INTERVAL '1 month');
END;
$$;

-- Update recalculate_working_days_metrics to invoke refresh_daily_readings_summary at the end
CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month timestamp with time zone)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '5min'
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_start_ts TIMESTAMP WITH TIME ZONE;
  v_end_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  -- Stamp missing days in calendar_settings as is_working_day = true
  INSERT INTO public.calendar_settings (date, is_working_day, updated_at)
  SELECT d::DATE, true, NOW()
  FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
  ON CONFLICT (date) DO NOTHING;

  -- Create temp table to hold calculated values
  CREATE TEMP TABLE IF NOT EXISTS tmp_metrics (
    uc text,
    data_referencia date,
    data_leitura_real date,
    working_day_index integer
  ) ON COMMIT DROP;
  
  TRUNCATE tmp_metrics;

  WITH calendar AS (
    SELECT 
      d::DATE as cal_date,
      COALESCE(cs.is_working_day, true) as is_working
    FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
    LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
  ),
  cumulative_calendar AS (
    SELECT 
      cal_date,
      is_working,
      SUM(CASE WHEN is_working THEN 1 ELSE 0 END) OVER (ORDER BY cal_date) as working_day_index
    FROM calendar
  ),
  unique_readings AS (
    SELECT DISTINCT ON (dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE)
      dr.uc,
      date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE as data_ref_date,
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE as data_leitura_date
    FROM public.daily_readings dr
    WHERE dr.data_leitura_real >= v_start_ts
      AND dr.data_leitura_real < v_end_ts
      AND dr.data_referencia IS NOT NULL
    ORDER BY dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE, dr.data_leitura_real DESC
  )
  INSERT INTO tmp_metrics (uc, data_referencia, data_leitura_real, working_day_index)
  SELECT 
    ur.uc,
    ur.data_ref_date,
    ur.data_leitura_date,
    cc.working_day_index
  FROM unique_readings ur
  JOIN cumulative_calendar cc ON cc.cal_date = ur.data_leitura_date;

  -- Upsert from temp table in a single robust operation
  INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index, updated_at)
  SELECT uc, data_referencia, data_leitura_real, working_day_index, NOW()
  FROM tmp_metrics
  ON CONFLICT (uc, data_referencia) DO UPDATE SET
    data_leitura_real = EXCLUDED.data_leitura_real,
    working_day_index = EXCLUDED.working_day_index,
    updated_at = EXCLUDED.updated_at;

  DROP TABLE IF EXISTS tmp_metrics;

  -- Refreshes the daily_readings_summary for the calculated month
  PERFORM public.refresh_daily_readings_summary(p_month);
END;
$$;

-- Seed the initial summary for the past 6 months to ensure smooth loading immediately
DO $$
DECLARE
  month_date DATE;
BEGIN
  FOR i IN 0..6 LOOP
    month_date := (date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo') - (i || ' month')::interval)::DATE;
    PERFORM public.refresh_daily_readings_summary(month_date::timestamp with time zone);
  END LOOP;
END $$;
