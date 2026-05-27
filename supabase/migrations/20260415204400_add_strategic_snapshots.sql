ALTER TABLE public.strategic_assignments
ADD COLUMN IF NOT EXISTS snapshot_valor_vencido NUMERIC,
ADD COLUMN IF NOT EXISTS snapshot_qt_fats INTEGER,
ADD COLUMN IF NOT EXISTS snapshot_refs TEXT,
ADD COLUMN IF NOT EXISTS snapshot_valor_total NUMERIC,
ADD COLUMN IF NOT EXISTS snapshot_nome_cliente TEXT,
ADD COLUMN IF NOT EXISTS parecer TEXT;
