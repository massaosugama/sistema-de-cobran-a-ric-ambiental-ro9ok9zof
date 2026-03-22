-- Add color column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color TEXT;

-- Create an index to quickly find taken colors if the table grows
CREATE INDEX IF NOT EXISTS profiles_color_idx ON public.profiles(color);
