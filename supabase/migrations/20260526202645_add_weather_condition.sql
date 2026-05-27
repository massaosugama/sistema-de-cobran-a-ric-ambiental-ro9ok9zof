ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS weather_condition TEXT DEFAULT 'normal';

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_comparison(p_current_month timestamp with time zone, p_references date[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '120s'
AS $function$
DECLARE
  result json;
  v_start date;
  v_end date;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  WITH calendar AS (
    SELECT d::date as cal_date,
           COALESCE((SELECT weather_condition FROM public.calendar_settings cs2 WHERE cs2.date = d::date), 'normal') as weather_condition
    FROM generate_series(v_start, LEAST(v_end, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  current_month_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real as cal_date,
      m.working_day_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = v_start
  ),
  reference_metrics AS (
    SELECT 
      m.uc,
      ROUND(AVG(m.working_day_index)) as avg_ref_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = ANY(p_references)
    GROUP BY m.uc
  ),
  comparison AS (
    SELECT 
      c.cal_date,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 'gray'
        WHEN c.working_day_index < r.avg_ref_index THEN 'green'
        WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
        WHEN c.working_day_index > r.avg_ref_index THEN 'red'
      END as status
    FROM current_month_metrics c
    LEFT JOIN reference_metrics r ON r.uc = c.uc
  ),
  daily_counts AS (
    SELECT 
      to_char(cal.cal_date, 'YYYY-MM-DD') as date_label,
      cal.weather_condition,
      COUNT(comp.*) FILTER (WHERE comp.status = 'green') as green_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'yellow') as yellow_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'red') as red_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'gray') as gray_count
    FROM calendar cal
    LEFT JOIN comparison comp ON comp.cal_date = cal.cal_date
    GROUP BY cal.cal_date, cal.weather_condition
    ORDER BY cal.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;

  RETURN result;
END;
$function$;
