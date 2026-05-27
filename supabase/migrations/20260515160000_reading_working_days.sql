CREATE TABLE IF NOT EXISTS public.reading_working_days_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT NOT NULL,
    data_referencia DATE NOT NULL,
    data_leitura_real DATE NOT NULL,
    working_day_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(uc, data_referencia)
);

ALTER TABLE public.reading_working_days_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.reading_working_days_metrics;
CREATE POLICY "authenticated_all" ON public.reading_working_days_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month TIMESTAMP WITH TIME ZONE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  WITH calendar AS (
    SELECT 
      d::DATE as cal_date,
      COALESCE(cs.is_working_day, true) as is_working
    FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
    LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
  ),
  cumulative_calendar AS (
    SELECT 
      cal_date,
      is_working,
      SUM(CASE WHEN is_working THEN 1 ELSE 0 END) OVER (ORDER BY cal_date) as working_day_index
    FROM calendar
  )
  INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index)
  SELECT 
    dr.uc,
    date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE,
    (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE,
    cc.working_day_index
  FROM public.daily_readings dr
  JOIN cumulative_calendar cc ON cc.cal_date = (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE
  WHERE dr.data_referencia IS NOT NULL
    AND dr.data_leitura_real IS NOT NULL
    AND date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE = v_start_date
  ON CONFLICT (uc, data_referencia) DO UPDATE SET
    data_leitura_real = EXCLUDED.data_leitura_real,
    working_day_index = EXCLUDED.working_day_index;

END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_status(p_month TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_current_working_day_index INT;
  result json;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;

  WITH calendar AS (
    SELECT 
      d::DATE as cal_date,
      COALESCE(cs.is_working_day, true) as is_working
    FROM generate_series(v_start_date, LEAST((NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE, (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE), '1 day'::interval) d
    LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
  )
  SELECT SUM(CASE WHEN is_working THEN 1 ELSE 0 END) INTO v_current_working_day_index
  FROM calendar;

  IF v_current_working_day_index IS NULL THEN
    v_current_working_day_index := 0;
  END IF;

  WITH historical_avg AS (
    SELECT 
      uc,
      AVG(working_day_index) as avg_index
    FROM public.reading_working_days_metrics
    WHERE data_referencia < v_start_date
      AND data_referencia >= (v_start_date - INTERVAL '3 months')::DATE
    GROUP BY uc
  ),
  current_month_expected AS (
    SELECT 
      dr.uc,
      dr.data_leitura_real,
      h.avg_index,
      v_current_working_day_index as current_index
    FROM public.daily_readings dr
    JOIN historical_avg h ON h.uc = dr.uc
    WHERE date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE = v_start_date
  ),
  status_calc AS (
    SELECT 
      uc,
      CASE 
        WHEN data_leitura_real IS NOT NULL THEN 'Lido'
        WHEN current_index > CEIL(avg_index) THEN 'Atrasado'
        WHEN current_index < FLOOR(avg_index) THEN 'Adiantado'
        ELSE 'Em Dia'
      END as status
    FROM current_month_expected
  )
  SELECT json_build_object(
    'atrasado', COUNT(*) FILTER (WHERE status = 'Atrasado'),
    'em_dia', COUNT(*) FILTER (WHERE status = 'Em Dia'),
    'adiantado', COUNT(*) FILTER (WHERE status = 'Adiantado'),
    'lido', COUNT(*) FILTER (WHERE status = 'Lido'),
    'current_working_day', v_current_working_day_index
  ) INTO result
  FROM status_calc;

  RETURN COALESCE(result, '{"atrasado":0,"em_dia":0,"adiantado":0,"lido":0,"current_working_day":0}'::json);
END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_post_import_routines()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- 1º: Limpeza de dados baseada no prazo de retenção (retention_days lido do app_settings)
  PERFORM public.cleanup_old_settlements();
  
  -- 2º: Processamento do motor de cálculo de conversões apenas nos dados que restaram e são elegíveis
  PERFORM public.process_conversions();

  -- 3º: Atualização das métricas de dias úteis (mês atual e anterior para garantir histórico atualizado)
  PERFORM public.recalculate_working_days_metrics(NOW());
  PERFORM public.recalculate_working_days_metrics(NOW() - INTERVAL '1 month');
END;
$function$;
