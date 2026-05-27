-- Add updated_at column to track calculation freshness
ALTER TABLE public.reading_working_days_metrics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Update the recalculate function to be precise about the month of the reading
CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month TIMESTAMP WITH TIME ZONE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_start_ts TIMESTAMP WITH TIME ZONE;
  v_end_ts TIMESTAMP WITH TIME ZONE;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

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
  INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index, updated_at)
  SELECT 
    dr.uc,
    date_trunc('month', dr.data_referencia AT TIME ZONE 'America/Sao_Paulo')::DATE,
    (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE,
    cc.working_day_index,
    NOW()
  FROM public.daily_readings dr
  JOIN cumulative_calendar cc ON cc.cal_date = (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE
  WHERE dr.data_referencia IS NOT NULL
    AND dr.data_leitura_real >= v_start_ts
    AND dr.data_leitura_real < v_end_ts
  ON CONFLICT (uc, data_referencia) DO UPDATE SET
    data_leitura_real = EXCLUDED.data_leitura_real,
    working_day_index = EXCLUDED.working_day_index,
    updated_at = EXCLUDED.updated_at;
END;
$function$;

-- Create RPC to check if a month needs recalculation
CREATE OR REPLACE FUNCTION public.check_needs_recalculation(p_month timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_start_ts TIMESTAMP WITH TIME ZONE;
  v_end_ts TIMESTAMP WITH TIME ZONE;
  v_last_calc TIMESTAMPTZ;
  v_last_setting TIMESTAMPTZ;
  v_last_reading TIMESTAMPTZ;
  v_calc_count INT;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
  v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  -- Verifica o último cálculo feito para as leituras que ocorreram neste mês
  SELECT COUNT(*), MAX(updated_at)
  INTO v_calc_count, v_last_calc
  FROM public.reading_working_days_metrics
  WHERE data_leitura_real >= v_start_date AND data_leitura_real <= v_end_date;

  -- Se não há nenhum cálculo para o mês
  IF v_calc_count = 0 THEN
    -- verifica se tem leituras
    IF EXISTS (
      SELECT 1 FROM public.daily_readings 
      WHERE data_leitura_real >= v_start_ts
        AND data_leitura_real < v_end_ts
    ) THEN
      RETURN true;
    ELSE
      RETURN false; -- sem leituras, não tem o que recalcular
    END IF;
  END IF;

  -- Verifica a última alteração nas configurações do calendário neste mês
  SELECT MAX(updated_at)
  INTO v_last_setting
  FROM public.calendar_settings
  WHERE date >= v_start_date AND date <= v_end_date;

  -- Se a última alteração no calendário for mais recente que o último cálculo, precisa recalcular
  IF v_last_setting IS NOT NULL AND v_last_setting > v_last_calc THEN
    RETURN true;
  END IF;

  -- Verifica a última inserção/atualização de leituras neste mês
  SELECT MAX(created_at)
  INTO v_last_reading
  FROM public.daily_readings
  WHERE data_leitura_real >= v_start_ts AND data_leitura_real < v_end_ts;

  IF v_last_reading IS NOT NULL AND v_last_reading > v_last_calc THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;
