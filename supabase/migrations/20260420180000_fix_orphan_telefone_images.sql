DO $$
DECLARE
  row_record RECORD;
  img JSONB;
  new_images JSONB;
  updated BOOLEAN;
BEGIN
  FOR row_record IN SELECT id, images FROM public.strategic_assignments WHERE images IS NOT NULL AND jsonb_typeof(images) = 'array'
  LOOP
    new_images := '[]'::jsonb;
    updated := false;
    
    FOR img IN SELECT * FROM jsonb_array_elements(row_record.images)
    LOOP
      IF img->>'section' = 'telefone' THEN
        img := jsonb_set(img, '{section}', '"telefones"');
        updated := true;
      END IF;
      new_images := new_images || img;
    END LOOP;

    IF updated THEN
      UPDATE public.strategic_assignments SET images = new_images WHERE id = row_record.id;
    END IF;
  END LOOP;
END $$;
