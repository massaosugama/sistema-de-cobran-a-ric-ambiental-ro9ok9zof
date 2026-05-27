-- Secure serasa_negativations table
DROP POLICY IF EXISTS "authenticated_all" ON public.serasa_negativations;
DROP POLICY IF EXISTS "authenticated_select" ON public.serasa_negativations;
DROP POLICY IF EXISTS "authenticated_insert" ON public.serasa_negativations;
DROP POLICY IF EXISTS "authenticated_update" ON public.serasa_negativations;
DROP POLICY IF EXISTS "authenticated_delete" ON public.serasa_negativations;

CREATE POLICY "authenticated_select" ON public.serasa_negativations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert" ON public.serasa_negativations
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (COALESCE(role, 'consultas') != 'consultas' OR is_admin = true)
    )
  );

CREATE POLICY "authenticated_update" ON public.serasa_negativations
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (COALESCE(role, 'consultas') != 'consultas' OR is_admin = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (COALESCE(role, 'consultas') != 'consultas' OR is_admin = true)
    )
  );

CREATE POLICY "authenticated_delete" ON public.serasa_negativations
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (COALESCE(role, 'consultas') != 'consultas' OR is_admin = true)
    )
  );
