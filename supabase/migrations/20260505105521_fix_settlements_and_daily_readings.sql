-- Fix deduplication for settlements by ignoring milliseconds
CREATE OR REPLACE FUNCTION public.remove_duplicate_settlements()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INT := 0;
BEGIN
  WITH ranked_settlements AS (
    SELECT 
      s.id,
      EXISTS (SELECT 1 FROM public.contact_results cr WHERE cr.settlement_id = s.id) as is_referenced,
      ROW_NUMBER() OVER (
        PARTITION BY 
          s.uc, 
          COALESCE(s.cod_pess_fat, ''), 
          s.valor_total, 
          COALESCE(date_trunc('second', s.datacriacao::timestamp)::text, s.databaixa_final::text, s.databaixa_inicial::text, s.datacredito_final::text, s.datacredito_inicial::text, s.neg_data::text),
          COALESCE(s.refs, '')
        ORDER BY 
          CASE WHEN EXISTS (SELECT 1 FROM public.contact_results cr WHERE cr.settlement_id = s.id) THEN 0 ELSE 1 END,
          s.created_at ASC
      ) as rn
    FROM public.settlements s
  ),
  to_delete AS (
    SELECT id 
    FROM ranked_settlements 
    WHERE rn > 1 AND is_referenced = false
  )
  DELETE FROM public.settlements
  WHERE id IN (SELECT id FROM to_delete);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object('deleted_count', deleted_count);
END;
$function$;

-- Add useful index for daily readings for better performance
CREATE INDEX IF NOT EXISTS daily_readings_data_referencia_idx ON public.daily_readings (data_referencia);
