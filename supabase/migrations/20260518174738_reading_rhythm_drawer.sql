DO $$
BEGIN
  ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS vencimento_padrao INT;
  ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS ignored_readers TEXT[] DEFAULT '{}'::TEXT[];
  ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS added_readers TEXT[] DEFAULT '{}'::TEXT[];

  UPDATE public.system_documentation
  SET content = content || E'\n\nDisparos de Cobrança: Automatiza o contato inicial via mensagens para "aquecer" a negociação antes do telefone.'
  WHERE route = '/billing-dispatches';
END $$;

CREATE OR REPLACE FUNCTION public.get_readers_by_day(p_month timestamp with time zone)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  WITH daily_readers AS (
    SELECT 
      to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date_label,
      usuario_id,
      COUNT(*) as total_read
    FROM public.daily_readings
    WHERE data_leitura_real IS NOT NULL
      AND date_trunc('month', data_leitura_real AT TIME ZONE 'America/Sao_Paulo') = date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')
      AND usuario_id IS NOT NULL
      AND usuario_id != ''
    GROUP BY to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'), usuario_id
  ),
  aggregated AS (
    SELECT
      date_label,
      json_agg(json_build_object('usuario_id', usuario_id, 'total_read', total_read)) as readers
    FROM daily_readers
    GROUP BY date_label
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM aggregated t;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_all_readers()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(usuario_id), '[]'::json) INTO result
  FROM (
    SELECT DISTINCT usuario_id 
    FROM public.daily_readings 
    WHERE usuario_id IS NOT NULL AND usuario_id != ''
    ORDER BY usuario_id
  ) t;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
