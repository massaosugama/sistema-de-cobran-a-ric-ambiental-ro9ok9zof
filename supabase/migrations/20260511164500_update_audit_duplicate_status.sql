DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.get_invalid_debts_for_audit();
END $$;

CREATE OR REPLACE FUNCTION public.get_invalid_debts_for_audit()
 RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, refs text, is_active boolean, issue_type text, duplicate_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
          WHERE t !~ '^''?(NEG|[0-9]{2}/[0-9]{2})'
        )
        AND d.refs NOT LIKE '%0.00%'
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
      WHEN a.refs LIKE '%0.00%' THEN 'Valor Zerado no REFS'::text
      WHEN a.is_active = false THEN 'Inativo com Ref Inválida'::text
      ELSE 'Ativo com Ref Inválida'::text
    END as issue_type,
    COALESCE((
      SELECT CASE 
               WHEN bool_or(b.is_active = true) THEN 'active'::text
               ELSE 'inactive'::text
             END
      FROM all_debts b
      WHERE b.uc = a.uc 
        AND b.is_valid = true
    ), 'none'::text) as duplicate_status
  FROM all_debts a
  WHERE a.is_valid = false
  ORDER BY a.uc, a.is_active DESC;
END;
$function$;
