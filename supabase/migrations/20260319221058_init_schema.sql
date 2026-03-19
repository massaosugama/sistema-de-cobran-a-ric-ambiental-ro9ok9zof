DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_type_enum') THEN
    CREATE TYPE contact_type_enum AS ENUM ('WTK PASSIVO', 'TEL PASSIVO', 'WTK ATIVO', 'TEL ATIVO', 'E-MAIL', 'OUTRO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pending_debts (
    uc TEXT PRIMARY KEY,
    setor TEXT,
    endereco TEXT,
    uc_repete TEXT,
    ta_nome_de_quem TEXT,
    qt_fats INTEGER,
    situ_docto TEXT,
    valor_total NUMERIC,
    refs TEXT,
    cod_pess_fat TEXT,
    pessoa_fatura_nome TEXT,
    pessoa_fatura_cpf_cnpj TEXT,
    pessoa_fatura_celular TEXT,
    proprietario_nome TEXT,
    proprietario_cpf_cnpj TEXT,
    proprietario_celular TEXT,
    responsavel_nome TEXT,
    responsavel_cpf_cnpj TEXT,
    responsavel_celular TEXT
);

CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT,
    qt_fats INTEGER,
    tipo_baixa TEXT,
    valor_total NUMERIC,
    refs TEXT,
    cod_pess_fat TEXT,
    pessoa_fatura_nome TEXT,
    pessoa_fatura_cpf_cnpj TEXT,
    pessoa_fatura_celular TEXT,
    databaixa_inicial DATE,
    databaixa_final DATE,
    datacredito_inicial DATE,
    datacredito_final DATE,
    neg_data DATE,
    neg_valor_acordo NUMERIC,
    neg_parcelas INTEGER,
    neg_desconto NUMERIC
);

CREATE TABLE IF NOT EXISTS public.contact_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT REFERENCES public.pending_debts(uc) ON DELETE CASCADE,
    operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    contact_type contact_type_enum,
    status TEXT,
    quality_result TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT REFERENCES public.pending_debts(uc) ON DELETE CASCADE,
    operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.profiles;
CREATE POLICY "authenticated_all" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.pending_debts;
CREATE POLICY "authenticated_all" ON public.pending_debts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.settlements;
CREATE POLICY "authenticated_all" ON public.settlements FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.contact_history;
CREATE POLICY "authenticated_all" ON public.contact_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.follow_up_tasks;
CREATE POLICY "authenticated_all" ON public.follow_up_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
DECLARE
  admin_id uuid;
  user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@ricambiental.com.br') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'admin@ricambiental.com.br', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Admin Ric"}', false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.profiles (id, email, name) VALUES (admin_id, 'admin@ricambiental.com.br', 'Admin Ric') ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'operador@ricambiental.com.br') THEN
    user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      user_id, '00000000-0000-0000-0000-000000000000', 'operador@ricambiental.com.br', crypt('operador123', gen_salt('bf')), NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}', '{"name": "Ana Costa"}', false, 'authenticated', 'authenticated',
      '', '', '', '', '', NULL, '', '', ''
    );
    INSERT INTO public.profiles (id, email, name) VALUES (user_id, 'operador@ricambiental.com.br', 'Ana Costa') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.pending_debts (uc, setor, endereco, uc_repete, ta_nome_de_quem, qt_fats, situ_docto, valor_total, refs, cod_pess_fat, pessoa_fatura_nome, pessoa_fatura_cpf_cnpj, pessoa_fatura_celular, proprietario_nome, proprietario_cpf_cnpj, proprietario_celular, responsavel_nome, responsavel_cpf_cnpj, responsavel_celular)
  VALUES 
    ('1098234', 'Centro', 'Rua das Flores, 123', 'N', 'Pessoa Fatura', 2, 'Aberto', 1250.50, '08/23 09/23', 'P-9921', 'Carlos Almeida Silva', '123.456.789-00', '(11) 98888-1111', 'Carlos Almeida Silva', '123.456.789-00', '(11) 98888-1111', NULL, NULL, NULL),
    ('1098235', 'Industrial', 'Av. Industrial, 5000', 'N', 'Pessoa Fatura', 1, 'Aberto', 8500.00, '05/23', 'P-9922', 'Empresa Alpha Ltda', '00.111.222/0001-33', '(11) 4000-5000', 'Empresa Alpha Ltda', '00.111.222/0001-33', '(11) 4000-5000', NULL, NULL, NULL),
    ('1098236', 'Bela Vista', 'Condomínio Bela Vista, Bloco B', 'N', 'Pessoa Fatura', 1, 'Aberto', 120.00, '10/23', 'P-9923', 'Beatriz Santos', '987.654.321-11', '(11) 97777-6666', 'Beatriz Santos', '987.654.321-11', '(11) 97777-6666', NULL, NULL, NULL)
  ON CONFLICT (uc) DO NOTHING;

  INSERT INTO public.settlements (uc, qt_fats, tipo_baixa, valor_total, refs, databaixa_inicial)
  VALUES 
    ('1098234', 1, 'PIX', 400.00, '07/23', '2023-10-15')
  ON CONFLICT DO NOTHING;

END $$;
