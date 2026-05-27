CREATE OR REPLACE FUNCTION public.get_regularized_assignments(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, uc text, cod_pess_fat text, snapshot_nome_cliente text, created_at timestamp with time zone, status text, images jsonb, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered AS (
    SELECT 
      sa.id,
      sa.uc,
      sa.cod_pess_fat,
      sa.snapshot_nome_cliente,
      sa.created_at,
      sa.status,
      sa.images
    FROM public.strategic_assignments sa
    WHERE sa.images IS NOT NULL 
      AND jsonb_typeof(sa.images) = 'array'
      AND jsonb_array_length(sa.images) > 0
      AND NOT EXISTS (
        SELECT 1 
        FROM public.pending_debts pd 
        WHERE pd.uc = sa.uc 
          AND pd.cod_pess_fat = sa.cod_pess_fat 
          AND pd.is_active = true
      )
  )
  SELECT 
    f.id,
    f.uc,
    f.cod_pess_fat,
    f.snapshot_nome_cliente,
    f.created_at,
    f.status,
    f.images,
    (SELECT count(*) FROM filtered)::bigint AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
