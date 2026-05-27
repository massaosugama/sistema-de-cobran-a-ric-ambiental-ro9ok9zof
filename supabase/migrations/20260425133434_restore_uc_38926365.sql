DO $$
BEGIN
  -- Restore images from backup only for UC 38926365
  UPDATE public.strategic_assignments sa
  SET images = sb.images
  FROM public.strategic_assignments_backup sb
  WHERE sa.id = sb.id 
    AND sa.uc = '38926365' 
    AND sb.uc = '38926365';
END $$;
