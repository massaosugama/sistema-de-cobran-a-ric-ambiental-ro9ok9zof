DO $do$
BEGIN
  -- Recreate vw_terms_queue_debts with the updated logic for has_termo and termo_date
  -- Incorporates fallback matching on UC if exact cod_pess_fat is empty or doesn't exist.
  CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
  SELECT 
      vw.*,
      (
          EXISTS (
              SELECT 1 
              FROM public.contact_history ch
              WHERE ch.uc = vw.uc 
              AND (
                  ch.cod_pess_fat = vw.cod_pess_fat 
                  OR COALESCE(vw.cod_pess_fat, '') = '' 
                  OR COALESCE(ch.cod_pess_fat, '') = ''
                  OR NOT EXISTS (
                      SELECT 1 FROM public.contact_history ch_exact
                      WHERE ch_exact.uc = vw.uc AND ch_exact.cod_pess_fat = vw.cod_pess_fat
                  )
              )
              AND ch.status = 'TERMO_ANEXADO' 
              AND ch.is_active = true
          )
          OR 
          EXISTS (
              SELECT 1 
              FROM public.strategic_assignments sa
              WHERE sa.uc = vw.uc
              AND (
                  sa.cod_pess_fat = vw.cod_pess_fat 
                  OR COALESCE(vw.cod_pess_fat, '') = '' 
                  OR COALESCE(sa.cod_pess_fat, '') = ''
                  OR NOT EXISTS (
                      SELECT 1 FROM public.strategic_assignments sa_exact
                      WHERE sa_exact.uc = vw.uc AND sa_exact.cod_pess_fat = vw.cod_pess_fat
                  )
              )
              AND sa.images IS NOT NULL 
              AND jsonb_typeof(sa.images) = 'array'
              AND jsonb_array_length(sa.images) > 0
          )
      ) AS has_termo,
      (
          SELECT MAX(created_at) 
          FROM (
              SELECT created_at FROM public.contact_history ch 
              WHERE ch.uc = vw.uc 
              AND (
                  ch.cod_pess_fat = vw.cod_pess_fat 
                  OR COALESCE(vw.cod_pess_fat, '') = '' 
                  OR COALESCE(ch.cod_pess_fat, '') = ''
                  OR NOT EXISTS (
                      SELECT 1 FROM public.contact_history ch_exact
                      WHERE ch_exact.uc = vw.uc AND ch_exact.cod_pess_fat = vw.cod_pess_fat
                  )
              )
              AND ch.status = 'TERMO_ANEXADO' 
              AND ch.is_active = true
              UNION ALL
              SELECT created_at FROM public.strategic_assignments sa
              WHERE sa.uc = vw.uc 
              AND (
                  sa.cod_pess_fat = vw.cod_pess_fat 
                  OR COALESCE(vw.cod_pess_fat, '') = '' 
                  OR COALESCE(sa.cod_pess_fat, '') = ''
                  OR NOT EXISTS (
                      SELECT 1 FROM public.strategic_assignments sa_exact
                      WHERE sa_exact.uc = vw.uc AND sa_exact.cod_pess_fat = vw.cod_pess_fat
                  )
              )
              AND sa.images IS NOT NULL 
              AND jsonb_typeof(sa.images) = 'array' 
              AND jsonb_array_length(sa.images) > 0
          ) combined
      ) AS termo_date
  FROM public.vw_queue_debts vw;
END $do$;

DO $do$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed initial user (idempotent check using email)
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

    INSERT INTO public.profiles (id, email, name, first_name, is_admin, role)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', 'Massao', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $do$;
