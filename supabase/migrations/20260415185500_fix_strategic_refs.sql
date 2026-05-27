-- Re-create get_distinct_refs to strip the single quote
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
  ),
  cleaned_refs AS (
    SELECT DISTINCT 
      CASE WHEN r LIKE '''%' THEN substring(r from 2) ELSE r END as clean_ref
    FROM all_refs
    WHERE r != ''
  )
  SELECT clean_ref 
  FROM cleaned_refs
  ORDER BY 
    CASE WHEN clean_ref = 'NEG' THEN 1 ELSE 0 END, 
    clean_ref DESC;
END;
$function$;

-- Re-create get_assignable_debts to match cleanly using regex
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
        SELECT 1 FROM unnest(p_periods) per 
        WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
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
