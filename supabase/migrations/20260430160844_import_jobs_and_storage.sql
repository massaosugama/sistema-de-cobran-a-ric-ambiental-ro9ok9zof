DO $$
BEGIN
  -- Create imports storage bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'imports', 
    'imports', 
    false, 
    104857600, 
    ARRAY[
      'text/csv', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Setup Storage Policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imports');

DROP POLICY IF EXISTS "Allow authenticated selects" ON storage.objects;
CREATE POLICY "Allow authenticated selects" ON storage.objects 
  FOR SELECT TO authenticated USING (bucket_id = 'imports');

-- Create import_jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_records INT DEFAULT 0,
  processed_records INT DEFAULT 0,
  error_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

DROP POLICY IF EXISTS "authenticated_all" ON public.import_jobs;
CREATE POLICY "authenticated_all" ON public.import_jobs 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
