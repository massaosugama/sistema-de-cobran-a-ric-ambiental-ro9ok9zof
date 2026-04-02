ALTER TABLE public.import_history ALTER COLUMN latest_record_date TYPE TIMESTAMPTZ USING latest_record_date::TIMESTAMPTZ;
