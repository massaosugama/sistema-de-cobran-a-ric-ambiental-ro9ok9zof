-- Alter the default value of the role column in the profiles table
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'consultas';

-- Update the handle_new_user function to explicitly set role to 'consultas'
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'consultas'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
END;
$$;

-- Secure the profiles table to prevent regular users from updating other users' profiles
-- or maliciously elevating their own privileges
DROP POLICY IF EXISTS "authenticated_all" ON public.profiles;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

-- Create a trigger to strictly protect role and is_admin columns from being changed by non-admins
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- If role and is_admin are not being changed, proceed normally
  IF NEW.role IS NOT DISTINCT FROM OLD.role AND NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin THEN
    RETURN NEW;
  END IF;

  -- If system/service_role bypass (auth.uid() is null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if the caller is an admin
  SELECT (role = 'admin' OR is_admin = true) INTO is_caller_admin 
  FROM public.profiles 
  WHERE id = auth.uid();

  IF COALESCE(is_caller_admin, false) THEN
    RETURN NEW;
  ELSE
    -- If not admin, ignore the role changes (revert them to OLD values to prevent privilege escalation)
    NEW.role = OLD.role;
    NEW.is_admin = OLD.is_admin;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_roles();
