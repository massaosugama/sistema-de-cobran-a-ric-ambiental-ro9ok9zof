ALTER TABLE public.serasa_negativations ADD COLUMN IF NOT EXISTS data_baixa_aqui TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.get_serasa_cross_reference;
CREATE OR REPLACE FUNCTION public.get_serasa_cross_reference(
  p_cpf_cnpj text DEFAULT NULL::text, 
  p_possui_debitos boolean DEFAULT NULL::boolean, 
  p_start_date date DEFAULT NULL::date, 
  p_end_date date DEFAULT NULL::date, 
  p_min_value numeric DEFAULT NULL::numeric, 
  p_max_value numeric DEFAULT NULL::numeric, 
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0, 
  p_baixado_aqui boolean DEFAULT false
)
 RETURNS TABLE(
   id uuid, 
   cpf_cnpj text, 
   nome text, 
   num_contrato text, 
   valor numeric, 
   data_envio date, 
   situacao text, 
   created_at timestamp with time zone, 
   possui_debitos boolean, 
   ultima_verificacao timestamp with time zone, 
   baixado_aqui boolean,
   data_baixa_aqui timestamp with time zone
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
    s.possui_debitos,
    s.ultima_verificacao,
    s.baixado_aqui,
    s.data_baixa_aqui
  FROM public.serasa_negativations s
  WHERE (p_cpf_cnpj IS NULL OR p_cpf_cnpj = '' OR s.cpf_cnpj ILIKE '%' || p_cpf_cnpj || '%' OR s.nome ILIKE '%' || p_cpf_cnpj || '%')
    AND (p_possui_debitos IS NULL OR s.possui_debitos = p_possui_debitos)
    AND (p_start_date IS NULL OR s.data_envio >= p_start_date)
    AND (p_end_date IS NULL OR s.data_envio <= p_end_date)
    AND (p_min_value IS NULL OR s.valor >= p_min_value)
    AND (p_max_value IS NULL OR s.valor <= p_max_value)
    AND (s.baixado_aqui = p_baixado_aqui)
  ORDER BY 
    CASE WHEN s.possui_debitos = false THEN 0 ELSE 1 END,
    s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
