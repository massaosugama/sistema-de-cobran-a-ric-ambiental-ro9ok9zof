ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS analyzed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS analyzed_at date;
