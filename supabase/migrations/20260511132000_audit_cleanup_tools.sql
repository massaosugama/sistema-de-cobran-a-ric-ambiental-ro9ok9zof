-- Function to get invalid debts for audit (Regex mismatch and duplicates)
CREATE OR REPLACE FUNCTION public.get_invalid_debts_for_audit()
RETURNS TABLE (
  uc text,
  cod_pess_fat text,
  pessoa_fatura_nome text,
  refs text,
  is_active boolean,
  issue_type text,
  has_valid_duplicate boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH all_debts AS (
    SELECT 
      d.uc, 
      d.cod_pess_fat, 
      d.pessoa_fatura_nome, 
      d.refs, 
      COALESCE(d.is_active, true) as is_active,
      (
        d.refs IS NOT NULL 
        AND trim(d.refs) != '' 
        AND NOT EXISTS (
          SELECT 1 FROM unnest(regexp_split_to_array(trim(d.refs), '\s+')) AS t
          WHERE t !~ '^''?(NEG|[0-9]{2}/[0-9]{2})$'
        )
      ) AS is_valid
    FROM public.pending_debts d
  )
  SELECT 
    a.uc,
    a.cod_pess_fat,
    a.pessoa_fatura_nome,
    a.refs,
    a.is_active,
    CASE 
      WHEN a.is_active = false THEN 'Inativo com Ref Inválida'::text
      ELSE 'Ativo com Ref Inválida'::text
    END as issue_type,
    EXISTS (
      SELECT 1 FROM all_debts b 
      WHERE b.uc = a.uc 
        AND b.is_active = true 
        AND b.is_valid = true
    ) as has_valid_duplicate
  FROM all_debts a
  WHERE a.is_valid = false
    AND (
      a.is_active = true
      OR 
      (a.is_active = false AND EXISTS (
        SELECT 1 FROM all_debts b 
        WHERE b.uc = a.uc 
          AND b.is_active = true 
          AND b.is_valid = true
      ))
    )
  ORDER BY a.uc, a.is_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete selected invalid debts
CREATE OR REPLACE FUNCTION public.delete_invalid_debts_batch(p_records jsonb)
RETURNS json AS $$
DECLARE
  deleted_count INT := 0;
BEGIN
  WITH to_delete AS (
    SELECT x.uc, x.cod_pess_fat
    FROM jsonb_to_recordset(p_records) AS x(uc text, cod_pess_fat text)
  )
  DELETE FROM public.pending_debts pd
  USING to_delete
  WHERE pd.uc = to_delete.uc AND pd.cod_pess_fat = to_delete.cod_pess_fat;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN json_build_object('deleted_count', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
