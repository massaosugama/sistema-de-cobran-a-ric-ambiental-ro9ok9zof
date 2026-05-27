-- Create the 'termos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('termos', 'termos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the 'termos' bucket
DROP POLICY IF EXISTS "Authenticated users can upload termos" ON storage.objects;
CREATE POLICY "Authenticated users can upload termos"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'termos');

DROP POLICY IF EXISTS "Anyone can view termos" ON storage.objects;
CREATE POLICY "Anyone can view termos"
ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'termos');
