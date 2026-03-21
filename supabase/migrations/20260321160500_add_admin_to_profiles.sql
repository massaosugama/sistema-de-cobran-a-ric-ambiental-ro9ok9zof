-- Add is_admin column to profiles for access control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Optionally, set the first user as admin to prevent locking everyone out
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  SELECT id INTO first_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    UPDATE public.profiles SET is_admin = true WHERE id = first_user_id;
  END IF;
END $$;
