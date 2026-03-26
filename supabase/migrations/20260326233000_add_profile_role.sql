ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'operator';

UPDATE public.profiles 
SET role = 'admin' 
WHERE is_admin = true;

UPDATE public.profiles 
SET role = 'operator' 
WHERE is_admin = false OR is_admin IS NULL;

