CREATE OR REPLACE FUNCTION public.revert_billing_dispatches(p_date date)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  affected_count INT := 0;
BEGIN
  UPDATE public.pending_debts
  SET ultimo_disparo = NULL
  WHERE DATE(ultimo_disparo AT TIME ZONE 'America/Sao_Paulo') = p_date;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RETURN json_build_object('affected_count', affected_count);
END;
$function$;
