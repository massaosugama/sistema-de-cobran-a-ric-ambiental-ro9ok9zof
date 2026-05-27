-- 1. Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_daily_readings_data_leitura_real ON public.daily_readings (data_leitura_real);
CREATE INDEX IF NOT EXISTS idx_daily_readings_data_referencia ON public.daily_readings (data_referencia);
CREATE INDEX IF NOT EXISTS idx_daily_readings_leitura_ref ON public.daily_readings (data_leitura_real, data_referencia);
CREATE INDEX IF NOT EXISTS idx_daily_readings_usuario_id ON public.daily_readings (usuario_id);

-- 2. Auth Seed
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
      '{"name": "Admin Massao"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin, role)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Admin Massao', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3. Optimization of get_daily_readings_by_day
CREATE OR REPLACE FUNCTION public.get_daily_readings_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start_ts timestamp with time zone;
  v_end_ts timestamp with time zone;
  v_start_date date;
  v_end_date date;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;
  
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + interval '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  WITH calendar AS (
    SELECT d::date as cal_date
    FROM generate_series(v_start_date, LEAST(v_end_date, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  daily_stats AS (
    SELECT 
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date as read_date,
      COUNT(dr.id) as total_read
    FROM public.daily_readings dr
    WHERE dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
    GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date
  ),
  combined AS (
    SELECT 
      to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
      COALESCE(ds.total_read, 0) as total_read
    FROM calendar c
    LEFT JOIN daily_stats ds ON ds.read_date = c.cal_date
    ORDER BY c.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM combined t;

  RETURN result;
END;
$function$;

-- 4. Optimization of get_readers_by_day
CREATE OR REPLACE FUNCTION public.get_readers_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start_ts timestamp with time zone;
  v_end_ts timestamp with time zone;
  v_start_date date;
  v_end_date date;
BEGIN
  v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;
  
  v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
  v_end_ts := (v_end_date + interval '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';

  WITH calendar AS (
    SELECT d::date as cal_date
    FROM generate_series(v_start_date, LEAST(v_end_date, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  daily_readers AS (
    SELECT 
      (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date as cal_date,
      dr.usuario_id,
      COUNT(dr.id) as total_read
    FROM public.daily_readings dr 
    WHERE dr.usuario_id IS NOT NULL AND dr.usuario_id != ''
      AND dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
    GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date, dr.usuario_id
  ),
  aggregated AS (
    SELECT
      to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
      COALESCE(
        json_agg(json_build_object('usuario_id', dr.usuario_id, 'total_read', dr.total_read)) FILTER (WHERE dr.usuario_id IS NOT NULL),
        '[]'::json
      ) as readers
    FROM calendar c
    LEFT JOIN daily_readers dr ON dr.cal_date = c.cal_date
    GROUP BY c.cal_date
    ORDER BY c.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM aggregated t;

  RETURN result;
END;
$function$;
