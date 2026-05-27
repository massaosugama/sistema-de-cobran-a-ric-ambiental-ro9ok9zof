CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_access_logs" ON public.access_logs;
CREATE POLICY "authenticated_select_access_logs" ON public.access_logs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_access_logs" ON public.access_logs;
CREATE POLICY "authenticated_insert_access_logs" ON public.access_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS access_logs_user_id_idx ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS access_logs_created_at_idx ON public.access_logs(created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'security_params') THEN
    INSERT INTO public.app_settings (key, value)
    VALUES ('security_params', '{"inactivity_timeout": 120, "login_count_hours": 24, "login_history_days": 30}'::jsonb);
  ELSE
    UPDATE public.app_settings
    SET value = value || '{"login_count_hours": 24, "login_history_days": 30}'::jsonb
    WHERE key = 'security_params'
      AND NOT (value ? 'login_count_hours');
  END IF;
END $$;
