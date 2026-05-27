CREATE OR REPLACE FUNCTION public.get_daily_readings_references()
RETURNS TABLE (referencia text, data_ref timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    to_char(data_referencia, 'MM/YYYY') as referencia,
    date_trunc('month', data_referencia) as data_ref
  FROM public.daily_readings
  WHERE data_referencia IS NOT NULL
  ORDER BY data_ref DESC;
END;
$function$;

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
    WHERE date_trunc('month', data_referencia) = date_trunc('month', p_data_ref)
  )
  DELETE FROM public.daily_readings
  WHERE id IN (SELECT id FROM to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN json_build_object('deleted_count', deleted_count);
END;
$function$;
