DO $$
BEGIN
  -- 1. Create table
  CREATE TABLE IF NOT EXISTS public.serasa_blacklist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf_cnpj text NOT NULL UNIQUE,
    nome text,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  -- 2. RLS
  ALTER TABLE public.serasa_blacklist ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "authenticated_all" ON public.serasa_blacklist;
  CREATE POLICY "authenticated_all" ON public.serasa_blacklist
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- 3. Update get_serasa_cross_reference
DROP FUNCTION IF EXISTS public.get_serasa_cross_reference(text, boolean, date, date, numeric, numeric, integer, integer, boolean);

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
) RETURNS TABLE(
  id uuid, cpf_cnpj text, nome text, num_contrato text, valor numeric, 
  data_envio date, situacao text, created_at timestamp with time zone, 
  possui_debitos boolean, ultima_verificacao timestamp with time zone, 
  baixado_aqui boolean, data_baixa_aqui timestamp with time zone,
  is_blacklisted boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  RETURN QUERY
  WITH blacklisted AS (
    SELECT regexp_replace(b.cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf 
    FROM public.serasa_blacklist b
  )
  SELECT 
    s.id, s.cpf_cnpj, s.nome, s.num_contrato, s.valor, s.data_envio, 
    s.situacao, s.created_at, s.possui_debitos, s.ultima_verificacao, 
    s.baixado_aqui, s.data_baixa_aqui,
    EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = regexp_replace(s.cpf_cnpj, '[^0-9]', '', 'g')) as is_blacklisted
  FROM public.serasa_negativations s
  WHERE (p_cpf_cnpj IS NULL OR p_cpf_cnpj = '' OR s.cpf_cnpj ILIKE '%' || p_cpf_cnpj || '%' OR s.nome ILIKE '%' || p_cpf_cnpj || '%')
    AND (p_possui_debitos IS NULL OR s.possui_debitos = p_possui_debitos)
    AND (p_start_date IS NULL OR s.data_envio >= p_start_date)
    AND (p_end_date IS NULL OR s.data_envio <= p_end_date)
    AND (p_min_value IS NULL OR s.valor >= p_min_value)
    AND (p_max_value IS NULL OR s.valor <= p_max_value)
    AND (s.baixado_aqui = p_baixado_aqui)
  ORDER BY 
    EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = regexp_replace(s.cpf_cnpj, '[^0-9]', '', 'g')) DESC,
    CASE WHEN s.possui_debitos = false THEN 0 ELSE 1 END,
    s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 4. Update get_devedores_a_negativar
DROP FUNCTION IF EXISTS public.get_devedores_a_negativar(text, integer, integer, text[], text, boolean, text[]);
DROP FUNCTION IF EXISTS public.get_devedores_a_negativar(text, integer, integer, text[], text, boolean, text[], text);

CREATE OR REPLACE FUNCTION public.get_devedores_a_negativar(
  p_search text DEFAULT NULL::text, 
  p_limit integer DEFAULT 50, 
  p_offset integer DEFAULT 0, 
  p_situ_docto text[] DEFAULT ARRAY['pend'::text], 
  p_order_by text DEFAULT 'valor_vencido'::text, 
  p_order_desc boolean DEFAULT true, 
  p_periods text[] DEFAULT NULL::text[],
  p_blacklist_filter text DEFAULT 'sem'::text
) RETURNS TABLE(
  uc text, cod_pess_fat text, cpf_cnpj text, nome text, valor_vencido numeric, qt_fats integer, total_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  RETURN QUERY
  WITH blacklisted AS (
    SELECT regexp_replace(b.cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf 
    FROM public.serasa_blacklist b
  ),
  base_debts AS (
    SELECT 
      pd.uc, pd.cod_pess_fat, 
      REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf_cnpj, 
      pd.pessoa_fatura_nome as nome, pd.valor_vencido, pd.qt_fats, pd.situ_docto, pd.refs
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
      AND (
        p_blacklist_filter = 'ambos' OR
        (p_blacklist_filter = 'sem' AND NOT EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = b.clean_cpf_cnpj)) OR
        (p_blacklist_filter = 'so' AND EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = b.clean_cpf_cnpj))
      )
  )
  SELECT 
    f.uc, f.cod_pess_fat, f.clean_cpf_cnpj as cpf_cnpj, f.nome, f.valor_vencido, f.qt_fats, 
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
