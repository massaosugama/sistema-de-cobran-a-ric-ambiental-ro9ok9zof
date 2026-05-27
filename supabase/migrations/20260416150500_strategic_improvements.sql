DO $$
BEGIN
  ALTER TABLE public.strategic_assignments
    ADD COLUMN IF NOT EXISTS parecer_consumo TEXT,
    ADD COLUMN IF NOT EXISTS telefones_localizados TEXT,
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
END $$;

CREATE TABLE IF NOT EXISTS public.legal_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uc TEXT NOT NULL,
  cod_pess_fat TEXT NOT NULL,
  strategic_assignment_id UUID REFERENCES public.strategic_assignments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'a_encaminhar',
  operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  snapshot_valor_vencido NUMERIC,
  snapshot_qt_fats INTEGER,
  snapshot_nome_cliente TEXT
);

ALTER TABLE public.legal_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.legal_queue;
CREATE POLICY "authenticated_all" ON public.legal_queue
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('strategic_images', 'strategic_images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

DROP POLICY IF EXISTS "strategic_images_public_read" ON storage.objects;
CREATE POLICY "strategic_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'strategic_images');

DROP POLICY IF EXISTS "strategic_images_auth_insert" ON storage.objects;
CREATE POLICY "strategic_images_auth_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'strategic_images');

DROP POLICY IF EXISTS "strategic_images_auth_delete" ON storage.objects;
CREATE POLICY "strategic_images_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'strategic_images');
