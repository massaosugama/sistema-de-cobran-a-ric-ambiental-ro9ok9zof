-- 1. Create quote_clicks table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS public.quote_clicks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- RLS policies for quote_clicks
ALTER TABLE public.quote_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_quote_clicks" ON public.quote_clicks;
CREATE POLICY "authenticated_insert_quote_clicks" ON public.quote_clicks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_select_quote_clicks" ON public.quote_clicks;
CREATE POLICY "authenticated_select_quote_clicks" ON public.quote_clicks
  FOR SELECT TO authenticated USING (true);

-- 2. Alter profiles to add first_name and last_name
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Seed existing names if possible
DO $$ 
BEGIN
  UPDATE public.profiles
  SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
  WHERE first_name IS NULL AND name IS NOT NULL AND name != '';
END $$;

-- 3. Update the handle_new_user trigger to extract first_name and last_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
