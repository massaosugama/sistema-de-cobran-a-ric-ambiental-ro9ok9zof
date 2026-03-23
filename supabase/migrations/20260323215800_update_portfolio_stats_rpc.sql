CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*),
    'total_value', COALESCE(sum(valor_total), 0),
    'total_vencido', COALESCE(sum(valor_vencido), 0),
    'total_a_vencer', COALESCE(sum(valor_a_vencer), 0)
  ) INTO result
  FROM (
    SELECT 
      uc, 
      cod_pess_fat, 
      sum(valor_total) as valor_total,
      sum(valor_vencido) as valor_vencido,
      sum(valor_a_vencer) as valor_a_vencer
    FROM public.pending_debts
    GROUP BY uc, cod_pess_fat
  ) t;
  
  RETURN result;
END;
$$;
