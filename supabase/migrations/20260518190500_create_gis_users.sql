CREATE TABLE IF NOT EXISTS public.gis_users (
    id UUID DEFAULT gen_random_uuid(),
    usuario_id TEXT PRIMARY KEY,
    login TEXT,
    is_visivel BOOLEAN,
    is_ativo BOOLEAN,
    nome TEXT,
    celular TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gis_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.gis_users;
CREATE POLICY "authenticated_all" ON public.gis_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_all_readers()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'usuario_id', t.usuario_id,
      'nome', COALESCE(u.nome, t.usuario_id)
    )
  ), '[]'::json) INTO result
  FROM (
    SELECT DISTINCT usuario_id 
    FROM public.daily_readings 
    WHERE usuario_id IS NOT NULL AND usuario_id != ''
  ) t
  LEFT JOIN public.gis_users u ON u.usuario_id = t.usuario_id
  ORDER BY COALESCE(u.nome, t.usuario_id);

  RETURN result;
END;
$function$;
