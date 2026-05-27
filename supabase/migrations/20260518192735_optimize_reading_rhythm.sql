-- Optimization for get_all_readers (fetching directly from gis_users instead of scanning daily_readings)
CREATE OR REPLACE FUNCTION public.get_all_readers()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'usuario_id', u.usuario_id,
      'nome', COALESCE(u.nome, u.usuario_id)
    )
  ), '[]'::json) INTO result
  FROM public.gis_users u
  ORDER BY COALESCE(u.nome, u.usuario_id);

  RETURN result;
END;
$function$;

-- Optimization for get_daily_readings_by_day (index usage for data_leitura_real)
CREATE OR REPLACE FUNCTION public.get_daily_readings_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start timestamp with time zone;
  v_end timestamp with time zone;
BEGIN
  v_start := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
  v_end := v_start + interval '1 month';

  WITH daily_stats AS (
    SELECT 
      to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date_label,
      COUNT(*) as total_read
    FROM public.daily_readings
    WHERE data_leitura_real >= v_start
      AND data_leitura_real < v_end
    GROUP BY to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    ORDER BY date_label ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_stats t;

  RETURN result;
END;
$function$;

-- Optimization for get_readers_by_day (index usage for data_leitura_real)
CREATE OR REPLACE FUNCTION public.get_readers_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start timestamp with time zone;
  v_end timestamp with time zone;
BEGIN
  v_start := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo';
  v_end := v_start + interval '1 month';

  WITH daily_readers AS (
    SELECT 
      to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date_label,
      usuario_id,
      COUNT(*) as total_read
    FROM public.daily_readings
    WHERE data_leitura_real >= v_start
      AND data_leitura_real < v_end
      AND usuario_id IS NOT NULL
      AND usuario_id != ''
    GROUP BY to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'), usuario_id
  ),
  aggregated AS (
    SELECT
      date_label,
      json_agg(json_build_object('usuario_id', usuario_id, 'total_read', total_read)) as readers
    FROM daily_readers
    GROUP BY date_label
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM aggregated t;

  RETURN result;
END;
$function$;

-- Optimization for recalculate_working_days_metrics (index usage for data_referencia)
CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_ref_start timestamp with time zone;
  v_ref_end timestamp with time zone;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  v_ref_start := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_ref_end := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

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
  )
  INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index)
  SELECT 
    dr.uc,
    date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE,
    (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE,
    cc.working_day_index
  FROM public.daily_readings dr
  JOIN cumulative_calendar cc ON cc.cal_date = (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE
  WHERE dr.data_referencia >= v_ref_start
    AND dr.data_referencia < v_ref_end
    AND dr.data_leitura_real IS NOT NULL
  ON CONFLICT (uc, data_referencia) DO UPDATE SET
    data_leitura_real = EXCLUDED.data_leitura_real,
    working_day_index = EXCLUDED.working_day_index;

END;
$function$;

-- Optimization for get_reading_rhythm_status (index usage for data_referencia)
CREATE OR REPLACE FUNCTION public.get_reading_rhythm_status(p_month timestamp with time zone DEFAULT now())
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_current_working_day_index INT;
  v_ref_start timestamp with time zone;
  v_ref_end timestamp with time zone;
  result json;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;

  v_ref_start := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_ref_end := (v_start_date + INTERVAL '1 month')::timestamp AT TIME ZONE 'America/Sao_Paulo';

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
    WHERE dr.data_referencia >= v_ref_start
      AND dr.data_referencia < v_ref_end
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
