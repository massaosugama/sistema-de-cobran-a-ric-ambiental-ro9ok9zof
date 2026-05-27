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
      to_char(data_referencia, 'MM/YYYY') as month_label,
      date_trunc('month', data_referencia) as ref_date,
      COUNT(*) as total_expected,
      COUNT(data_leitura_real) as total_read
    FROM public.daily_readings
    WHERE data_referencia IS NOT NULL
    GROUP BY to_char(data_referencia, 'MM/YYYY'), date_trunc('month', data_referencia)
    ORDER BY ref_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM monthly_stats t;

  RETURN result;
END;
$function$;
