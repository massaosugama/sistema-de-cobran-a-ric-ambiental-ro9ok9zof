INSERT INTO public.app_settings (key, value) 
VALUES ('security_params', '{"inactivity_timeout": 120}')
ON CONFLICT (key) DO NOTHING;
