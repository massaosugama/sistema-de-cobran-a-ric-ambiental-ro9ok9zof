-- TRUNCATE just the reading_working_days_metrics as requested to allow recalculation of data_referencia correctly
TRUNCATE TABLE public.reading_working_days_metrics;

-- 1. Update recalculate_working_days_metrics to fix timezone of data_referencia
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
    -- Fixing the timezone shifting for data_referencia by explicitly evaluating it in UTC 
    -- (since it is saved as midnight UTC from the import)
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
END;
$function$;

-- 2. Update get_reading_rhythm_status to fix timezone of data_referencia
CREATE OR REPLACE FUNCTION public.get_reading_rhythm_status(p_month timestamp with time zone DEFAULT now())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_current_working_day_index INT;
  result json;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;

  WITH calendar AS (
    SELECT 
      d::DATE as cal_date,
      COALESCE(cs.is_working_day, true) as is_working
    FROM generate_series(v_start_date, LEAST((NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE, (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE), '1 day'::interval) d
    LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
  )
  SELECT SUM(CASE WHEN is_working THEN 1 ELSE 0 END) INTO v_current_working_day_index
  FROM calendar;

  IF v_current_working_day_index IS NULL THEN
    v_current_working_day_index := 0;
  END IF;

  WITH historical_avg AS (
    SELECT 
      uc,
      AVG(working_day_index) as avg_index
    FROM public.reading_working_days_metrics
    WHERE data_referencia < v_start_date
      AND data_referencia >= (v_start_date - INTERVAL '3 months')::DATE
    GROUP BY uc
  ),
  current_month_expected AS (
    SELECT 
      dr.uc,
      dr.data_leitura_real,
      h.avg_index,
      v_current_working_day_index as current_index
    FROM public.daily_readings dr
    JOIN historical_avg h ON h.uc = dr.uc
    WHERE date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE = v_start_date
  ),
  status_calc AS (
    SELECT 
      uc,
      CASE 
        WHEN data_leitura_real IS NOT NULL THEN 'Lido'
        WHEN current_index > CEIL(avg_index) THEN 'Atrasado'
        WHEN current_index < FLOOR(avg_index) THEN 'Adiantado'
        ELSE 'Em Dia'
      END as status
    FROM current_month_expected
  )
  SELECT json_build_object(
    'atrasado', COUNT(*) FILTER (WHERE status = 'Atrasado'),
    'em_dia', COUNT(*) FILTER (WHERE status = 'Em Dia'),
    'adiantado', COUNT(*) FILTER (WHERE status = 'Adiantado'),
    'lido', COUNT(*) FILTER (WHERE status = 'Lido'),
    'current_working_day', v_current_working_day_index
  ) INTO result
  FROM status_calc;

  RETURN COALESCE(result, '{"atrasado":0,"em_dia":0,"adiantado":0,"lido":0,"current_working_day":0}'::json);
END;
$function$;

-- 3. Update get_daily_readings_references
CREATE OR REPLACE FUNCTION public.get_daily_readings_references()
 RETURNS TABLE(referencia text, data_ref timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    to_char(data_referencia AT TIME ZONE 'UTC', 'MM/YYYY') as referencia,
    date_trunc('month', data_referencia AT TIME ZONE 'UTC') as data_ref
  FROM public.daily_readings
  WHERE data_referencia IS NOT NULL
  ORDER BY data_ref DESC;
END;
$function$;

-- 4. Update get_daily_readings_evolution
CREATE OR REPLACE FUNCTION public.get_daily_readings_evolution()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  WITH monthly_stats AS (
    SELECT 
      to_char(data_referencia AT TIME ZONE 'UTC', 'MM/YYYY') as month_label,
      date_trunc('month', data_referencia AT TIME ZONE 'UTC') as ref_date,
      COUNT(*) as total_expected,
      COUNT(data_leitura_real) as total_read
    FROM public.daily_readings
    WHERE data_referencia IS NOT NULL
    GROUP BY to_char(data_referencia AT TIME ZONE 'UTC', 'MM/YYYY'), date_trunc('month', data_referencia AT TIME ZONE 'UTC')
    ORDER BY ref_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM monthly_stats t;

  RETURN result;
END;
$function$;

-- 5. Update delete_daily_readings_by_reference
CREATE OR REPLACE FUNCTION public.delete_daily_readings_by_reference(p_data_ref timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INT := 0;
BEGIN
  WITH to_delete AS (
    SELECT id FROM public.daily_readings
    WHERE date_trunc('month', data_referencia AT TIME ZONE 'UTC') = date_trunc('month', p_data_ref AT TIME ZONE 'UTC')
  )
  DELETE FROM public.daily_readings
  WHERE id IN (SELECT id FROM to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN json_build_object('deleted_count', deleted_count);
END;
$function$;
