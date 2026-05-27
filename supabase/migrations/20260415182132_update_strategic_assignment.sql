CREATE OR REPLACE FUNCTION public.get_distinct_refs()
RETURNS TABLE(ref text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH all_refs AS (
    SELECT unnest(regexp_split_to_array(trim(refs), '\s+')) as r
    FROM public.pending_debts
    WHERE refs IS NOT NULL AND refs != ''
  )
  SELECT DISTINCT r
  FROM all_refs
  WHERE r != ''
  ORDER BY 
    CASE WHEN r = 'NEG' THEN 1 ELSE 0 END, 
    r DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_assignable_debts(p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_periods text[] DEFAULT NULL::text[])
 RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, valor_total numeric, valor_vencido numeric, qt_fats integer, refs text, latest_contact_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pd.uc, 
    pd.cod_pess_fat, 
    pd.pessoa_fatura_nome, 
    pd.valor_total, 
    pd.valor_vencido, 
    pd.qt_fats, 
    pd.refs,
    vw.latest_contact_date
  FROM public.pending_debts pd
  LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat
  WHERE (p_min_value IS NULL OR pd.valor_vencido >= p_min_value)
    AND (p_max_value IS NULL OR pd.valor_vencido <= p_max_value)
    AND (
      p_periods IS NULL 
      OR array_length(p_periods, 1) IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(p_periods) per WHERE pd.refs LIKE '%' || per || '%'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strategic_assignments sa 
      WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat 
      AND sa.status IN ('pending', 'started')
    )
  ORDER BY pd.valor_vencido DESC NULLS LAST
  LIMIT 500;
END;
$function$;
