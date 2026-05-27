DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.serasa_negativations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cpf_cnpj TEXT NOT NULL,
      nome TEXT NOT NULL,
      num_contrato TEXT NOT NULL,
      valor NUMERIC NOT NULL,
      data_envio DATE,
      situacao TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(cpf_cnpj, num_contrato)
  );

  ALTER TABLE public.serasa_negativations ENABLE ROW LEVEL SECURITY;
END $$;

DROP POLICY IF EXISTS "authenticated_all" ON public.serasa_negativations;
CREATE POLICY "authenticated_all" ON public.serasa_negativations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
