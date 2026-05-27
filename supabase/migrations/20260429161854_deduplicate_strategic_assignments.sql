DO $$
DECLARE
  r RECORD;
  master_id UUID;
BEGIN
  -- Identifica registros duplicados e consolida os dados mantendo o histórico de análises e anexos
  FOR r IN 
    SELECT uc, cod_pess_fat 
    FROM public.strategic_assignments 
    GROUP BY uc, cod_pess_fat 
    HAVING count(*) > 1
  LOOP
    -- Encontra o registro mais recente como "master"
    SELECT id INTO master_id 
    FROM public.strategic_assignments 
    WHERE uc = r.uc AND cod_pess_fat = r.cod_pess_fat 
    ORDER BY COALESCE(updated_at, created_at) DESC 
    LIMIT 1;

    -- Atualiza o registro master para herdar dados de parecer e anexos caso estejam vazios
    UPDATE public.strategic_assignments m
    SET 
      parecer = COALESCE(m.parecer, o.parecer),
      parecer_consumo = COALESCE(m.parecer_consumo, o.parecer_consumo),
      parecer_imovel = COALESCE(m.parecer_imovel, o.parecer_imovel),
      parecer_inloco = COALESCE(m.parecer_inloco, o.parecer_inloco),
      telefones_localizados = COALESCE(m.telefones_localizados, o.telefones_localizados),
      images = CASE WHEN (m.images IS NULL OR m.images::text = '[]') THEN o.images ELSE m.images END
    FROM (
      SELECT 
        parecer, parecer_consumo, parecer_imovel, parecer_inloco, telefones_localizados, images
      FROM public.strategic_assignments
      WHERE uc = r.uc AND cod_pess_fat = r.cod_pess_fat AND id != master_id
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT 1
    ) o
    WHERE m.id = master_id;

    -- Remove os registros duplicados mais antigos
    DELETE FROM public.strategic_assignments 
    WHERE uc = r.uc AND cod_pess_fat = r.cod_pess_fat AND id != master_id;
  END LOOP;
END $$;
