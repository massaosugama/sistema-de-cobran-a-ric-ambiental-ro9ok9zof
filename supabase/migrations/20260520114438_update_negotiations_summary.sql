CREATE OR REPLACE FUNCTION public.get_negotiations_summary()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_vencido', COALESCE(SUM(valor_vencido_neg_com_ativa) FILTER (WHERE is_active = true), 0),
    'total_cases_vencidos', COUNT(*) FILTER (WHERE is_active = true AND valor_vencido_neg_com_ativa > 0),
    'total_cases_neg', COUNT(*) FILTER (WHERE is_active = true AND refs ILIKE '%NEG%'),
    'total_cases', COUNT(*) FILTER (WHERE is_active = true AND refs ILIKE '%NEG%')
  ) INTO result
  FROM public.pending_debts;
  
  RETURN result;
END;
$function$;
