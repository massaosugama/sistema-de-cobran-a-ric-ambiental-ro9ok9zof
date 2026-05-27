DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists)
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
      '',    -- confirmation_token
      '',    -- recovery_token
      '',    -- email_change_token_new
      '',    -- email_change
      '',    -- email_change_token_current
      NULL,  -- phone
      '',    -- phone_change
      '',    -- phone_change_token
      ''     -- reauthentication_token
    );

    INSERT INTO public.profiles (id, email, name, first_name, last_name, role, is_admin)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', 'Massao', 'Sugama', 'admin', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Ensure RLS policies are permissive for authenticated users on contact_history and strategic_assignments
DROP POLICY IF EXISTS "authenticated_all" ON public.strategic_assignments;
CREATE POLICY "authenticated_all" ON public.strategic_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.contact_history;
CREATE POLICY "authenticated_all" ON public.contact_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
