DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('system_documentation_images', 'system_documentation_images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Setup RLS for storage.objects
DROP POLICY IF EXISTS "Public Access to system_documentation_images" ON storage.objects;
CREATE POLICY "Public Access to system_documentation_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'system_documentation_images');

DROP POLICY IF EXISTS "Auth Insert to system_documentation_images" ON storage.objects;
CREATE POLICY "Auth Insert to system_documentation_images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'system_documentation_images');

DROP POLICY IF EXISTS "Auth Update to system_documentation_images" ON storage.objects;
CREATE POLICY "Auth Update to system_documentation_images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'system_documentation_images');

DROP POLICY IF EXISTS "Auth Delete to system_documentation_images" ON storage.objects;
CREATE POLICY "Auth Delete to system_documentation_images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'system_documentation_images');
