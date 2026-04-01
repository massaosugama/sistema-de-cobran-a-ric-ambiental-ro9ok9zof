DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'import_history') THEN
        CREATE TABLE public.import_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            table_name TEXT NOT NULL,
            total_records INT NOT NULL DEFAULT 0,
            inserted_records INT NOT NULL DEFAULT 0,
            ignored_records INT NOT NULL DEFAULT 0,
            latest_record_date DATE
        );
    END IF;
END $$;

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.import_history;
CREATE POLICY "authenticated_all" ON public.import_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.keep_latest_20_import_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.import_history
    WHERE id NOT IN (
        SELECT id FROM public.import_history
        ORDER BY created_at DESC
        LIMIT 20
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limit_import_history ON public.import_history;
CREATE TRIGGER trg_limit_import_history
AFTER INSERT ON public.import_history
FOR EACH ROW EXECUTE FUNCTION public.keep_latest_20_import_history();
