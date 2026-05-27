CREATE OR REPLACE FUNCTION public.get_serasa_cross_reference(
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_situacao TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_min_value NUMERIC DEFAULT NULL,
  p_max_value NUMERIC DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  cpf_cnpj TEXT,
  nome TEXT,
  num_contrato TEXT,
  valor NUMERIC,
  data_envio DATE,
  situacao TEXT,
  created_at TIMESTAMPTZ,
  match_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.cpf_cnpj,
    s.nome,
    s.num_contrato,
    s.valor,
    s.data_envio,
    s.situacao,
    s.created_at,
    (
      SELECT COUNT(*)::INT 
      FROM public.pending_debts pd 
      WHERE pd.is_active = true 
      AND (
        pd.pessoa_fatura_cpf_cnpj = s.cpf_cnpj OR 
        pd.proprietario_cpf_cnpj = s.cpf_cnpj OR 
        pd.responsavel_cpf_cnpj = s.cpf_cnpj OR
        pd.pessoa_fatura_cpf_cnpj = REGEXP_REPLACE(s.cpf_cnpj, '[^0-9]', '', 'g') OR 
        pd.proprietario_cpf_cnpj = REGEXP_REPLACE(s.cpf_cnpj, '[^0-9]', '', 'g') OR 
        pd.responsavel_cpf_cnpj = REGEXP_REPLACE(s.cpf_cnpj, '[^0-9]', '', 'g') OR
        pd.cod_pess_fat = s.cpf_cnpj OR
        pd.cod_pess_fat = REGEXP_REPLACE(s.cpf_cnpj, '[^0-9]', '', 'g')
      )
    ) as match_count
  FROM public.serasa_negativations s
  WHERE (p_cpf_cnpj IS NULL OR p_cpf_cnpj = '' OR s.cpf_cnpj ILIKE '%' || p_cpf_cnpj || '%' OR s.nome ILIKE '%' || p_cpf_cnpj || '%')
    AND (p_situacao IS NULL OR p_situacao = '' OR s.situacao = p_situacao)
    AND (p_start_date IS NULL OR s.data_envio >= p_start_date)
    AND (p_end_date IS NULL OR s.data_envio <= p_end_date)
    AND (p_min_value IS NULL OR s.valor >= p_min_value)
    AND (p_max_value IS NULL OR s.valor <= p_max_value)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
