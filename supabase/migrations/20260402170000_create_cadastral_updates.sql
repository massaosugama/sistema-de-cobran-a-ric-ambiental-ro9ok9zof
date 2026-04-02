CREATE TABLE IF NOT EXISTS public.cadastral_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT NOT NULL,
    cod_pess_fat TEXT,
    customer_name TEXT,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.cadastral_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.cadastral_updates;
CREATE POLICY "authenticated_all" ON public.cadastral_updates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS cadastral_updates_status_idx ON public.cadastral_updates(status);
CREATE INDEX IF NOT EXISTS cadastral_updates_created_at_idx ON public.cadastral_updates(created_at);
