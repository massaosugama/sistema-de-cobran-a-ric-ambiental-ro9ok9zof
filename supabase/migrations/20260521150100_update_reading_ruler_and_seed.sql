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
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Massao Sugama"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, role, is_admin)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_ruler(p_current_month timestamp with time zone, p_references text[] DEFAULT '{}'::text[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_current_month_start DATE;
  v_current_working_day INT;
  v_current_month_working_days INT;
  v_max_working_days INT;
  result json;
BEGIN
  v_current_month_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;

  SELECT COUNT(*) INTO v_current_month_working_days
  FROM public.calendar_settings
  WHERE date >= v_current_month_start
    AND date < (v_current_month_start + interval '1 month')::date
    AND is_working_day = true;
    
  IF v_current_month_working_days = 0 THEN
    SELECT COUNT(*) INTO v_current_month_working_days
    FROM generate_series(v_current_month_start, (v_current_month_start + interval '1 month' - interval '1 day')::date, '1 day'::interval) AS d(cal_date)
    WHERE extract(dow from cal_date) BETWEEN 1 AND 5;
  END IF;

  v_max_working_days := v_current_month_working_days;

  IF date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date = v_current_month_start THEN
    SELECT COUNT(*) INTO v_current_working_day
    FROM public.calendar_settings
    WHERE date >= v_current_month_start 
      AND date <= (now() AT TIME ZONE 'America/Sao_Paulo')::date
      AND is_working_day = true;
      
    IF v_current_working_day = 0 AND (now() AT TIME ZONE 'America/Sao_Paulo')::date >= v_current_month_start THEN
        SELECT COUNT(*) INTO v_current_working_day
        FROM generate_series(v_current_month_start, (now() AT TIME ZONE 'America/Sao_Paulo')::date, '1 day'::interval) AS d(cal_date)
        WHERE extract(dow from cal_date) BETWEEN 1 AND 5;
    END IF;
  ELSE
    v_current_working_day := NULL;
  END IF;

  WITH days AS (
    SELECT generate_series(1, v_max_working_days) as idx
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
    'max_working_days', v_max_working_days,
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
