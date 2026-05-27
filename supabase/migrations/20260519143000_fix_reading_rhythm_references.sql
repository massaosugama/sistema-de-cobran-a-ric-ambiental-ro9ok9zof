-- Drop and recreate the function to get references from reading_working_days_metrics
-- It's much faster than querying daily_readings directly
DROP FUNCTION IF EXISTS public.get_daily_readings_references();
CREATE OR REPLACE FUNCTION public.get_daily_readings_references()
 RETURNS TABLE(referencia text, data_ref text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    to_char(data_referencia, 'MM/YYYY') as referencia,
    to_char(data_referencia, 'YYYY-MM-DD') as data_ref
  FROM public.reading_working_days_metrics
  WHERE data_referencia IS NOT NULL
  ORDER BY data_ref DESC;
END;
$$;

-- Ensure get_reading_rhythm_comparison is efficient and correct
DROP FUNCTION IF EXISTS public.get_reading_rhythm_comparison(timestamp with time zone, date[]);
CREATE OR REPLACE FUNCTION public.get_reading_rhythm_comparison(p_current_month timestamp with time zone, p_references date[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  result json;
  v_start date;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;

  WITH current_month_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real,
      to_char(m.data_leitura_real, 'YYYY-MM-DD') as date_label,
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
      c.date_label,
      CASE 
        WHEN c.working_day_index < r.avg_ref_index THEN 'green'
        WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
        WHEN c.working_day_index > r.avg_ref_index THEN 'red'
      END as status
    FROM current_month_metrics c
    JOIN reference_metrics r ON r.uc = c.uc
  ),
  daily_counts AS (
    SELECT 
      date_label,
      COUNT(*) FILTER (WHERE status = 'green') as green_count,
      COUNT(*) FILTER (WHERE status = 'yellow') as yellow_count,
      COUNT(*) FILTER (WHERE status = 'red') as red_count
    FROM comparison
    GROUP BY date_label
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;

  RETURN result;
END;
$$;
