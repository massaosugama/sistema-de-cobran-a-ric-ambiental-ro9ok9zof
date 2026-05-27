-- Migration for User Story: Régua de Progresso and Recalcular Dias enhancements

CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '5min'
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

  -- Stamp missing days in calendar_settings as is_working_day = true
  INSERT INTO public.calendar_settings (date, is_working_day, updated_at)
  SELECT d::DATE, true, NOW()
  FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
  ON CONFLICT (date) DO NOTHING;

  -- Create temp table to hold calculated values
  CREATE TEMP TABLE IF NOT EXISTS tmp_metrics (
    uc text,
    data_referencia date,
    data_leitura_real date,
    working_day_index integer
  ) ON COMMIT DROP;
  
  TRUNCATE tmp_metrics;

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
  ),
  unique_readings AS (
    SELECT DISTINCT ON (dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE)
      dr.uc,
      date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE as data_ref_date,
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE as data_leitura_date
    FROM public.daily_readings dr
    WHERE dr.data_leitura_real >= v_start_ts
      AND dr.data_leitura_real < v_end_ts
      AND dr.data_referencia IS NOT NULL
    ORDER BY dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE, dr.data_leitura_real DESC
  )
  INSERT INTO tmp_metrics (uc, data_referencia, data_leitura_real, working_day_index)
  SELECT 
    ur.uc,
    ur.data_ref_date,
    ur.data_leitura_date,
    cc.working_day_index
  FROM unique_readings ur
  JOIN cumulative_calendar cc ON cc.cal_date = ur.data_leitura_date;

  -- Upsert from temp table in a single robust operation
  INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index, updated_at)
  SELECT uc, data_referencia, data_leitura_real, working_day_index, NOW()
  FROM tmp_metrics
  ON CONFLICT (uc, data_referencia) DO UPDATE SET
    data_leitura_real = EXCLUDED.data_leitura_real,
    working_day_index = EXCLUDED.working_day_index,
    updated_at = EXCLUDED.updated_at;

  DROP TABLE IF EXISTS tmp_metrics;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_ruler(p_current_month timestamp with time zone, p_references text[] DEFAULT '{}'::text[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_max_working_days_global INT;
  v_current_month_start DATE;
  v_current_working_day INT;
  v_current_month_working_days INT;
  result json;
BEGIN
  v_current_month_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;

  -- Calculate the global max working days from history
  SELECT MAX(working_day_index) INTO v_max_working_days_global
  FROM public.reading_working_days_metrics;

  -- Fallback to current month if no data
  IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
    SELECT COUNT(*) INTO v_max_working_days_global
    FROM public.calendar_settings
    WHERE date >= v_current_month_start
      AND date < (v_current_month_start + interval '1 month')::date
      AND is_working_day = true;
      
    IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
      v_max_working_days_global := 23;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_current_month_working_days
  FROM public.calendar_settings
  WHERE date >= v_current_month_start
    AND date < (v_current_month_start + interval '1 month')::date
    AND is_working_day = true;

  IF date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date = v_current_month_start THEN
    SELECT COUNT(*) INTO v_current_working_day
    FROM public.calendar_settings
    WHERE date >= v_current_month_start 
      AND date <= (now() AT TIME ZONE 'America/Sao_Paulo')::date
      AND is_working_day = true;
  ELSE
    v_current_working_day := NULL;
  END IF;

  WITH days AS (
    SELECT generate_series(1, v_max_working_days_global) as idx
  ),
  current_daily AS (
    SELECT working_day_index, COUNT(uc) as cnt
    FROM public.reading_working_days_metrics
    WHERE data_referencia = v_current_month_start
    GROUP BY working_day_index
  ),
  ref_daily AS (
    SELECT working_day_index, COUNT(uc) as cnt
    FROM public.reading_working_days_metrics
    WHERE data_referencia IN (SELECT (unnest(p_references))::date)
    GROUP BY working_day_index
  ),
  acc AS (
    SELECT 
      d.idx,
      SUM(COALESCE(c.cnt, 0)) OVER (ORDER BY d.idx) as curr_acc,
      SUM(COALESCE(r.cnt, 0)) OVER (ORDER BY d.idx) / NULLIF(array_length(p_references, 1), 0) as ref_acc
    FROM days d
    LEFT JOIN current_daily c ON c.working_day_index = d.idx
    LEFT JOIN ref_daily r ON r.working_day_index = d.idx
  )
  SELECT json_build_object(
    'max_working_days', v_max_working_days_global,
    'current_month_working_days', v_current_month_working_days,
    'current_working_day', v_current_working_day,
    'blocks', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'index', idx,
          'current_acc', curr_acc,
          'ref_acc', ROUND(COALESCE(ref_acc, 0))
        ) ORDER BY idx
      ), '[]'::json) FROM acc
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- Ensure seed user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'massao.sugama@alje.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'massao.sugama@alje.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Massao Sugama"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin, role)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
