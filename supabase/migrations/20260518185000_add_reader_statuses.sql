ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS reader_statuses JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.apply_reader_status_range(
  p_reader_name text,
  p_status text,
  p_start_date date,
  p_end_date date
) RETURNS void AS $$
DECLARE
  v_date date;
BEGIN
  FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date LOOP
    INSERT INTO public.calendar_settings (date, is_working_day, reader_statuses, updated_at)
    VALUES (v_date, true, jsonb_build_object(p_reader_name, p_status), NOW())
    ON CONFLICT (date) DO UPDATE
    SET reader_statuses = COALESCE(calendar_settings.reader_statuses, '{}'::jsonb) || jsonb_build_object(p_reader_name, p_status),
        updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
