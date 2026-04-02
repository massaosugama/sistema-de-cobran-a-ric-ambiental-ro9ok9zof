-- Adiciona configuração de parâmetros de Qualidade Cadastral
INSERT INTO public.app_settings (key, value)
VALUES ('cadastral_quality_params', '{"required": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;
