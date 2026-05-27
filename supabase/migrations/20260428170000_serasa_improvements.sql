-- Add new columns
ALTER TABLE public.serasa_negativations 
ADD COLUMN IF NOT EXISTS ultima_verificacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS possui_debitos BOOLEAN;

-- Update the existing function
DROP FUNCTION IF EXISTS public.get_serasa_cross_reference;
CREATE OR REPLACE FUNCTION public.get_serasa_cross_reference(p_cpf_cnpj text DEFAULT NULL::text, p_situacao text DEFAULT NULL::text, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, cpf_cnpj text, nome text, num_contrato text, valor numeric, data_envio date, situacao text, created_at timestamp with time zone, possui_debitos boolean, ultima_verificacao timestamp with time zone)
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
    s.possui_debitos,
    s.ultima_verificacao
  FROM public.serasa_negativations s
  WHERE (p_cpf_cnpj IS NULL OR p_cpf_cnpj = '' OR s.cpf_cnpj ILIKE '%' || p_cpf_cnpj || '%' OR s.nome ILIKE '%' || p_cpf_cnpj || '%')
    AND (p_situacao IS NULL OR p_situacao = '' OR p_situacao = 'todas' OR s.situacao = p_situacao)
    AND (p_start_date IS NULL OR s.data_envio >= p_start_date)
    AND (p_end_date IS NULL OR s.data_envio <= p_end_date)
    AND (p_min_value IS NULL OR s.valor >= p_min_value)
    AND (p_max_value IS NULL OR s.valor <= p_max_value)
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- Create the update function
CREATE OR REPLACE FUNCTION public.update_serasa_debts_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  last_import_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the last pending_debts import date
  SELECT MAX(created_at) INTO last_import_date 
  FROM public.import_history 
  WHERE table_name = 'Pendências (Substituição Total)';
  
  -- Update records where ultima_verificacao is null OR less than last_import_date
  UPDATE public.serasa_negativations s
  SET 
    possui_debitos = EXISTS (
      SELECT 1 FROM public.pending_debts pd 
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
    ),
    ultima_verificacao = NOW()
  WHERE s.ultima_verificacao IS NULL OR s.ultima_verificacao < COALESCE(last_import_date, '1900-01-01'::timestamptz);
END;
$function$;
