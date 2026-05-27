-- Set a longer statement_timeout for this specific heavy function 
-- to avoid "canceling statement due to statement timeout" from PostgREST defaults
CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '5min'
AS $function$
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
    SELECT DISTINCT ON (dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE)
      dr.uc,
      date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE as data_ref_date,
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE as data_leitura_date
    FROM public.daily_readings dr
    WHERE dr.data_leitura_real >= v_start_ts
      AND dr.data_leitura_real < v_end_ts
      AND dr.data_referencia IS NOT NULL
    ORDER BY dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE, dr.data_leitura_real DESC
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
END;
$function$;

-- Add index to speed up check_needs_recalculation 
CREATE INDEX IF NOT EXISTS reading_working_days_metrics_data_leitura_real_idx 
ON public.reading_working_days_metrics USING btree (data_leitura_real);

-- Ensure index exists on daily_readings to speed up the recalculate query
CREATE INDEX IF NOT EXISTS daily_readings_ref_leitura_real_idx 
ON public.daily_readings USING btree (data_leitura_real, data_referencia);
