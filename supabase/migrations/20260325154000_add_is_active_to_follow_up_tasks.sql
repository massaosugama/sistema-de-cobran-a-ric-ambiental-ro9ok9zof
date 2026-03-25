ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
