CREATE TABLE IF NOT EXISTS public.system_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_documentation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_system_documentation" ON public.system_documentation;
CREATE POLICY "authenticated_select_system_documentation" ON public.system_documentation
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_system_documentation" ON public.system_documentation;
CREATE POLICY "admin_insert_system_documentation" ON public.system_documentation
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.is_admin = true)
        )
    );

DROP POLICY IF EXISTS "admin_update_system_documentation" ON public.system_documentation;
CREATE POLICY "admin_update_system_documentation" ON public.system_documentation
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.is_admin = true)
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.is_admin = true)
        )
    );

DROP POLICY IF EXISTS "admin_delete_system_documentation" ON public.system_documentation;
CREATE POLICY "admin_delete_system_documentation" ON public.system_documentation
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.is_admin = true)
        )
    );

-- Seed initial data
INSERT INTO public.system_documentation (route, title, content) VALUES
('/dashboard', 'Visão Geral (Dashboard)', 'Esta tela apresenta um resumo gerencial da carteira de cobrança.

## Funcionalidades
- **Saldo Diário:** Acompanhamento da evolução da dívida.
- **Posição de Negociações:** Detalha os saldos de parcelas negociadas vencidas e a composição de clientes com "NEG".
- **Projeções:** Estimativas de recuperação e impacto futuro.

Use os filtros de data e setor para refinar as visualizações.'),
('/queue', 'Fila de Cobrança', 'Esta tela exibe a lista de dívidas ativas para a operação de cobrança.

- Utilize a barra de busca para encontrar clientes específicos.
- Clique sobre um cliente para abrir a tela de detalhamento e registrar contatos.'),
('/login', 'Acesso ao Sistema', 'Bem-vindo ao Sistema de Cobrança Ric Ambiental.

Em caso de problemas de acesso, contate o administrador do sistema.')
ON CONFLICT (route) DO NOTHING;
