-- Create functional indexes to speed up the regex replacements
CREATE INDEX IF NOT EXISTS pending_debts_clean_cpf_idx ON public.pending_debts (REGEXP_REPLACE(pessoa_fatura_cpf_cnpj, '[^0-9]', '', 'g'));
CREATE INDEX IF NOT EXISTS serasa_negativations_clean_cpf_idx ON public.serasa_negativations (REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g'));

-- Create an index to help with sorting and filtering active debts with positive value
CREATE INDEX IF NOT EXISTS pending_debts_active_vencido_idx ON public.pending_debts (is_active, valor_vencido DESC);

-- Replace the function with a simpler, optimized static SQL version using window functions
CREATE OR REPLACE FUNCTION public.get_devedores_a_negativar(
  p_search text DEFAULT NULL::text, 
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0
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
      pd.qt_fats
    FROM public.pending_debts pd
    WHERE pd.is_active = true 
      AND pd.valor_vencido > 0
      AND (
        p_search IS NULL OR p_search = '' 
        OR pd.uc ILIKE '%' || p_search || '%' 
        OR pd.pessoa_fatura_nome ILIKE '%' || p_search || '%' 
        OR pd.pessoa_fatura_cpf_cnpj ILIKE '%' || p_search || '%'
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
  ORDER BY f.valor_vencido DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
