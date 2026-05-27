DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.get_devedores_a_negativar(text, integer, integer, text[], text, boolean);
END $$;

CREATE OR REPLACE FUNCTION public.get_devedores_a_negativar(
    p_search text DEFAULT NULL::text,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_situ_docto text[] DEFAULT ARRAY['pend'::text],
    p_order_by text DEFAULT 'valor_vencido'::text,
    p_order_desc boolean DEFAULT true,
    p_periods text[] DEFAULT NULL::text[]
)
 RETURNS TABLE(uc text, cod_pess_fat text, cpf_cnpj text, nome text, valor_vencido numeric, qt_fats integer, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH base_debts AS (
    SELECT 
      pd.uc, 
      pd.cod_pess_fat, 
      REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf_cnpj, 
      pd.pessoa_fatura_nome as nome, 
      pd.valor_vencido, 
      pd.qt_fats,
      pd.situ_docto,
      pd.refs
    FROM public.pending_debts pd
    WHERE pd.is_active = true 
      AND pd.valor_vencido > 0
      AND (
        p_search IS NULL OR p_search = '' 
        OR pd.uc ILIKE '%' || p_search || '%' 
        OR pd.pessoa_fatura_nome ILIKE '%' || p_search || '%' 
        OR pd.pessoa_fatura_cpf_cnpj ILIKE '%' || p_search || '%'
      )
      AND (
        p_situ_docto IS NULL OR array_length(p_situ_docto, 1) IS NULL OR pd.situ_docto = ANY(p_situ_docto)
      )
      AND (
        p_periods IS NULL 
        OR array_length(p_periods, 1) IS NULL 
        OR EXISTS (
          SELECT 1 FROM unnest(p_periods) per 
          WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
        )
      )
  ),
  filtered AS (
    SELECT b.*
    FROM base_debts b
    WHERE LENGTH(b.clean_cpf_cnpj) IN (11, 14)
      AND NOT EXISTS (
        SELECT 1 FROM public.serasa_workflow sw 
        WHERE sw.uc = b.uc AND sw.cod_pess_fat = b.cod_pess_fat
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.serasa_negativations sn 
        WHERE REGEXP_REPLACE(sn.cpf_cnpj, '[^0-9]', '', 'g') = b.clean_cpf_cnpj
      )
  )
  SELECT 
    f.uc, 
    f.cod_pess_fat, 
    f.clean_cpf_cnpj as cpf_cnpj, 
    f.nome, 
    f.valor_vencido, 
    f.qt_fats, 
    COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY 
    CASE WHEN p_order_by = 'uc' AND p_order_desc THEN f.uc END DESC NULLS LAST,
    CASE WHEN p_order_by = 'uc' AND NOT p_order_desc THEN f.uc END ASC NULLS LAST,
    CASE WHEN p_order_by = 'nome' AND p_order_desc THEN f.nome END DESC NULLS LAST,
    CASE WHEN p_order_by = 'nome' AND NOT p_order_desc THEN f.nome END ASC NULLS LAST,
    CASE WHEN p_order_by = 'cpf_cnpj' AND p_order_desc THEN f.clean_cpf_cnpj END DESC NULLS LAST,
    CASE WHEN p_order_by = 'cpf_cnpj' AND NOT p_order_desc THEN f.clean_cpf_cnpj END ASC NULLS LAST,
    CASE WHEN p_order_by = 'qt_fats' AND p_order_desc THEN f.qt_fats END DESC NULLS LAST,
    CASE WHEN p_order_by = 'qt_fats' AND NOT p_order_desc THEN f.qt_fats END ASC NULLS LAST,
    CASE WHEN p_order_by = 'valor_vencido' AND p_order_desc THEN f.valor_vencido END DESC NULLS LAST,
    CASE WHEN p_order_by = 'valor_vencido' AND NOT p_order_desc THEN f.valor_vencido END ASC NULLS LAST,
    f.valor_vencido DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
