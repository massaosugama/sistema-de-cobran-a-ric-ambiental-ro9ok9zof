-- Create covering index to optimize reference lookups
CREATE INDEX IF NOT EXISTS reading_working_days_metrics_data_ref_uc_idx 
ON public.reading_working_days_metrics USING btree (data_referencia, uc, working_day_index);

-- Optimize get_reading_rhythm_comparison
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
    SELECT d::date as cal_date
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
      COUNT(comp.*) FILTER (WHERE comp.status = 'green') as green_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'yellow') as yellow_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'red') as red_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'gray') as gray_count
    FROM calendar cal
    LEFT JOIN comparison comp ON comp.cal_date = cal.cal_date
    GROUP BY cal.cal_date
    ORDER BY cal.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;

  RETURN result;
END;
$function$;

-- Optimize get_reading_rhythm_day_details
CREATE OR REPLACE FUNCTION public.get_reading_rhythm_day_details(p_current_month timestamp with time zone, p_date_label text, p_references date[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout TO '120s'
AS $function$
DECLARE
  v_start date;
  v_month_minus_1 date;
  v_month_minus_2 date;
  v_month_minus_3 date;
  v_month_minus_4 date;
  v_month_minus_5 date;
  v_month_minus_6 date;
  result json;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_month_minus_1 := (v_start - interval '1 month')::date;
  v_month_minus_2 := (v_start - interval '2 months')::date;
  v_month_minus_3 := (v_start - interval '3 months')::date;
  v_month_minus_4 := (v_start - interval '4 months')::date;
  v_month_minus_5 := (v_start - interval '5 months')::date;
  v_month_minus_6 := (v_start - interval '6 months')::date;

  WITH current_day_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real,
      m.working_day_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = v_start
      AND m.data_leitura_real = p_date_label::date
  ),
  reference_metrics AS (
    SELECT 
      m.uc,
      ROUND(AVG(m.working_day_index)) as avg_ref_index
    FROM current_day_metrics c
    JOIN public.reading_working_days_metrics m ON m.uc = c.uc
    WHERE m.data_referencia = ANY(p_references)
    GROUP BY m.uc
  ),
  history_metrics AS (
    SELECT 
      m.uc,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_1) as m1,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_2) as m2,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_3) as m3,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_4) as m4,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_5) as m5,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_6) as m6
    FROM current_day_metrics c
    JOIN public.reading_working_days_metrics m ON m.uc = c.uc
    WHERE m.data_referencia IN (v_month_minus_1, v_month_minus_2, v_month_minus_3, v_month_minus_4, v_month_minus_5, v_month_minus_6)
    GROUP BY m.uc
  ),
  comparison AS (
    SELECT 
      c.uc,
      c.data_leitura_real,
      c.working_day_index,
      r.avg_ref_index,
      h.m1, h.m2, h.m3, h.m4, h.m5, h.m6,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 'gray'
        WHEN c.working_day_index < r.avg_ref_index THEN 'green'
        WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
        WHEN c.working_day_index > r.avg_ref_index THEN 'red'
      END as status,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 1
        WHEN c.working_day_index > r.avg_ref_index THEN 2
        WHEN c.working_day_index = r.avg_ref_index THEN 3
        WHEN c.working_day_index < r.avg_ref_index THEN 4
      END as order_weight
    FROM current_day_metrics c
    LEFT JOIN reference_metrics r ON r.uc = c.uc
    LEFT JOIN history_metrics h ON h.uc = c.uc
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT * FROM comparison
    ORDER BY order_weight ASC, uc ASC
  ) t;

  RETURN result;
END;
$function$;
