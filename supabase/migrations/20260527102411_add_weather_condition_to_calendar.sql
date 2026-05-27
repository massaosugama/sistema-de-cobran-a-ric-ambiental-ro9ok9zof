ALTER TABLE public.calendar_settings ADD COLUMN IF NOT EXISTS weather_condition TEXT DEFAULT 'normal';
