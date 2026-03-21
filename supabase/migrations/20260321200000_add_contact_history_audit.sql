-- Adiciona a coluna is_active para inativação lógica
ALTER TABLE public.contact_history ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Cria a tabela de auditoria para rastreabilidade
CREATE TABLE IF NOT EXISTS public.contact_history_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES public.contact_history(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_history_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.contact_history_audit;
CREATE POLICY "authenticated_all" ON public.contact_history_audit FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função de trigger para registrar alterações
CREATE OR REPLACE FUNCTION public.audit_contact_history_changes()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.contact_history_audit (contact_id, changed_by, old_data, new_data)
    VALUES (
        NEW.id,
        auth.uid(),
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa a trigger à tabela contact_history
DROP TRIGGER IF EXISTS trg_audit_contact_history ON public.contact_history;
CREATE TRIGGER trg_audit_contact_history
AFTER UPDATE ON public.contact_history
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.audit_contact_history_changes();
