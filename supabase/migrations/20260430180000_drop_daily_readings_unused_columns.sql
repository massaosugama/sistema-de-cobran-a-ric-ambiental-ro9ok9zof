ALTER TABLE public.daily_readings
DROP COLUMN IF EXISTS is_visivel,
DROP COLUMN IF EXISTS organizacao_id,
DROP COLUMN IF EXISTS os_id,
DROP COLUMN IF EXISTS tipo_calculo,
DROP COLUMN IF EXISTS hidrometro_id;
