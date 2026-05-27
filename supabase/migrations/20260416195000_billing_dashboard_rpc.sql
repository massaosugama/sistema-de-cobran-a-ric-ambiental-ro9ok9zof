DO $$
BEGIN
  -- Migração idempotente para o painel de rotas de leitura
END $$;

CREATE OR REPLACE FUNCTION public.get_billing_routes_stats()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH route_stats AS (
    SELECT 
      NULLIF(split_part(localizacao_ligacao, '.', 3), '') as route,
      NULLIF(split_part(localizacao_ligacao, '.', 2), '') as cycle,
      count(*) as expected_ucs,
      count(*) FILTER (WHERE data_leitura_real IS NOT NULL) as read_ucs,
      MAX(data_leitura_calculada) as max_deadline
    FROM public.daily_readings
    WHERE localizacao_ligacao IS NOT NULL
    GROUP BY split_part(localizacao_ligacao, '.', 3), split_part(localizacao_ligacao, '.', 2)
  ),
  enriched AS (
    SELECT 
      route,
      cycle,
      expected_ucs,
      read_ucs,
      CASE WHEN expected_ucs > 0 THEN ROUND((read_ucs::numeric / expected_ucs::numeric) * 100, 0)::int ELSE 0 END as percentage,
      COALESCE(EXTRACT(DAY FROM (max_deadline - CURRENT_DATE))::int, 0) as remaining_days
    FROM route_stats
    WHERE route IS NOT NULL AND cycle IS NOT NULL
  ),
  final_routes AS (
    SELECT 
      gen_random_uuid() as id,
      'R-' || route as route,
      'Ciclo ' || cycle as cycle,
      expected_ucs as "expectedUcs",
      read_ucs as "readUcs",
      percentage,
      remaining_days as "remainingDays",
      CASE 
        WHEN percentage = 0 AND remaining_days >= 0 THEN 'Não Iniciada'
        WHEN percentage = 100 THEN 'Concluída'
        WHEN remaining_days < 0 AND percentage < 100 THEN 'Atrasada'
        WHEN remaining_days <= 2 AND percentage < 100 THEN 'Prazo Curto'
        ELSE 'Em Andamento'
      END as criticality
    FROM enriched
    ORDER BY remaining_days ASC, percentage ASC
  )
  SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result FROM final_routes r;

  RETURN result;
END;
$$;
