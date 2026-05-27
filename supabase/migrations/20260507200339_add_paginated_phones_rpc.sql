DO $$
BEGIN
  -- Create or replace the paginated function to fetch researched phones
  CREATE OR REPLACE FUNCTION public.get_researched_phones_paginated(p_limit INT DEFAULT 100, p_offset INT DEFAULT 0)
  RETURNS TABLE(
    id uuid, 
    uc text, 
    cod_pess_fat text, 
    phones jsonb, 
    created_at timestamp with time zone, 
    pessoa_fatura_nome text, 
    pessoa_fatura_cpf_cnpj text,
    valor_total numeric, 
    ultimo_disparo timestamp with time zone,
    total_count bigint
  )
  LANGUAGE plpgsql SECURITY DEFINER AS $func$
  BEGIN
    RETURN QUERY
    WITH filtered AS (
      SELECT 
        rp.id,
        rp.uc,
        rp.cod_pess_fat,
        rp.phones,
        rp.created_at,
        pd.pessoa_fatura_nome,
        pd.pessoa_fatura_cpf_cnpj,
        pd.valor_total,
        pd.ultimo_disparo,
        rp.updated_at
      FROM public.researched_phones rp
      JOIN public.pending_debts pd ON pd.uc = rp.uc AND pd.cod_pess_fat = rp.cod_pess_fat
    )
    SELECT 
      f.id, f.uc, f.cod_pess_fat, f.phones, f.created_at, f.pessoa_fatura_nome, f.pessoa_fatura_cpf_cnpj, f.valor_total, f.ultimo_disparo,
      (SELECT count(*) FROM filtered)::bigint AS total_count
    FROM filtered f
    ORDER BY f.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
  END;
  $func$;
END $$;
