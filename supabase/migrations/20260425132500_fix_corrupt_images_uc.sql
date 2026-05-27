-- Backup the record for UC 38926365 before modifying
CREATE TABLE IF NOT EXISTS public.strategic_assignments_backup (
  id UUID PRIMARY KEY,
  uc TEXT,
  cod_pess_fat TEXT,
  images JSONB,
  backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.strategic_assignments_backup (id, uc, cod_pess_fat, images)
SELECT id, uc, cod_pess_fat, images
FROM public.strategic_assignments
WHERE uc = '38926365'
ON CONFLICT (id) DO NOTHING;

-- Clear the corrupt images for UC 38926365 so they can be re-uploaded correctly
UPDATE public.strategic_assignments
SET images = '[]'::jsonb
WHERE uc = '38926365';
