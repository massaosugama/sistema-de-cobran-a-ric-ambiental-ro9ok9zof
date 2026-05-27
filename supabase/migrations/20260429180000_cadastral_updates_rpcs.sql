CREATE OR REPLACE FUNCTION public.get_cadastral_debts(
  p_filter_type text,
  p_search text DEFAULT NULL,
  p_order_by text DEFAULT 'valor_vencido',
  p_order_desc boolean DEFAULT true,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  uc text,
  cod_pess_fat text,
  pessoa_fatura_nome text,
  pessoa_fatura_cpf_cnpj text,
  pessoa_fatura_celular text,
  valor_total numeric,
  valor_vencido numeric,
  qt_fats integer,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_sql text;
  v_where text := 'is_active = true';
BEGIN
  IF p_filter_type = 'no_phone' THEN
    v_where := v_where || ' AND (COALESCE(pessoa_fatura_celular, '''') = '''' AND COALESCE(proprietario_celular, '''') = '''' AND COALESCE(responsavel_celular, '''') = '''')';
  ELSIF p_filter_type = 'invalid_doc' THEN
    v_where := v_where || ' AND (pessoa_fatura_cpf_cnpj IS NULL OR pessoa_fatura_cpf_cnpj = '''' OR LENGTH(REGEXP_REPLACE(pessoa_fatura_cpf_cnpj, ''[^0-9]'', '''', ''g'')) NOT IN (11, 14))';
  END IF;

  IF p_search IS NOT NULL AND p_search <> '' THEN
    v_where := v_where || ' AND (uc ILIKE ''%'' || p_search || ''%'' OR pessoa_fatura_nome ILIKE ''%'' || p_search || ''%'' OR pessoa_fatura_cpf_cnpj ILIKE ''%'' || p_search || ''%'')';
  END IF;

  v_sql := 'WITH filtered AS (
              SELECT uc, cod_pess_fat, pessoa_fatura_nome, pessoa_fatura_cpf_cnpj, pessoa_fatura_celular, valor_total, valor_vencido, qt_fats
              FROM public.pending_debts
              WHERE ' || v_where || '
            )
            SELECT *, (SELECT count(*) FROM filtered) AS total_count
            FROM filtered
            ORDER BY ' || quote_ident(p_order_by) || CASE WHEN p_order_desc THEN ' DESC NULLS LAST' ELSE ' ASC NULLS LAST' END || '
            LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  RETURN QUERY EXECUTE v_sql;
END;
$function$;
