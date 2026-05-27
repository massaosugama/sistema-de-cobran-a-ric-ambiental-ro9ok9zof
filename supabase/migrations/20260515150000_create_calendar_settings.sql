CREATE TABLE IF NOT EXISTS public.calendar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "authenticated_all" ON public.calendar_settings;
CREATE POLICY "authenticated_all" ON public.calendar_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_daily_readings_by_day(p_month timestamp with time zone)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  WITH daily_stats AS (
    SELECT 
      to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') as date_label,
      COUNT(*) as total_read
    FROM public.daily_readings
    WHERE data_leitura_real IS NOT NULL
      AND date_trunc('month', data_leitura_real AT TIME ZONE 'America/Sao_Paulo') = date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY to_char(data_leitura_real AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
    ORDER BY date_label ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_stats t;

  RETURN result;
END;
$function$;
