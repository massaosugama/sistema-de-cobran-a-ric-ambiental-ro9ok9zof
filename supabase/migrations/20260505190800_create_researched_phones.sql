CREATE TABLE IF NOT EXISTS public.researched_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uc TEXT NOT NULL,
  cod_pess_fat TEXT NOT NULL,
  phones JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'researched_phones_uc_cod_pess_fat_fkey'
  ) THEN
    ALTER TABLE public.researched_phones
      ADD CONSTRAINT researched_phones_uc_cod_pess_fat_fkey 
      FOREIGN KEY (uc, cod_pess_fat) REFERENCES public.pending_debts(uc, cod_pess_fat) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS researched_phones_uc_cod_pess_fat_key ON public.researched_phones (uc, cod_pess_fat);

ALTER TABLE public.researched_phones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.researched_phones;
CREATE POLICY "authenticated_all" ON public.researched_phones FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_researched_phones()
RETURNS TABLE (
  id UUID,
  uc TEXT,
  cod_pess_fat TEXT,
  phones JSONB,
  created_at TIMESTAMPTZ,
  pessoa_fatura_nome TEXT,
  valor_total NUMERIC,
  ultimo_disparo TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.uc,
    rp.cod_pess_fat,
    rp.phones,
    rp.created_at,
    pd.pessoa_fatura_nome,
    pd.valor_total,
    pd.ultimo_disparo
  FROM public.researched_phones rp
  JOIN public.pending_debts pd ON pd.uc = rp.uc AND pd.cod_pess_fat = rp.cod_pess_fat
  ORDER BY rp.updated_at DESC
  LIMIT 100;
END;
$function$;
