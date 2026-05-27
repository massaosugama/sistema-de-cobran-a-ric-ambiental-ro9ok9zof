DO $$
BEGIN
  -- Create the tracking table for the new workflow
  CREATE TABLE IF NOT EXISTS public.serasa_workflow (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uc TEXT NOT NULL,
      cod_pess_fat TEXT NOT NULL,
      cpf_cnpj TEXT NOT NULL,
      nome TEXT NOT NULL,
      valor_vencido NUMERIC NOT NULL,
      status TEXT NOT NULL DEFAULT 'sendo_negativado',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'serasa_workflow_uc_cod_pess_fat_key') THEN
    ALTER TABLE public.serasa_workflow ADD CONSTRAINT serasa_workflow_uc_cod_pess_fat_key UNIQUE (uc, cod_pess_fat);
  END IF;
END $$;

ALTER TABLE public.serasa_workflow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.serasa_workflow;
CREATE POLICY "authenticated_all" ON public.serasa_workflow FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to handle moving from 'sendo_negativado' to 'negativado' automatically
CREATE OR REPLACE FUNCTION public.trg_update_serasa_workflow_on_negativation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $FUNC$
BEGIN
  IF NEW.situacao != 'Baixado' THEN
    UPDATE public.serasa_workflow
    SET 
      status = 'negativado',
      updated_at = NOW()
    WHERE status = 'sendo_negativado'
      AND (cpf_cnpj = NEW.cpf_cnpj OR cpf_cnpj = REGEXP_REPLACE(NEW.cpf_cnpj, '[^0-9]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$FUNC$;

DROP TRIGGER IF EXISTS on_serasa_negativation_added ON public.serasa_negativations;
CREATE TRIGGER on_serasa_negativation_added
AFTER INSERT OR UPDATE ON public.serasa_negativations
FOR EACH ROW EXECUTE FUNCTION public.trg_update_serasa_workflow_on_negativation();

-- View/Function to get pending debts ready for the workflow
CREATE OR REPLACE FUNCTION public.get_devedores_a_negativar(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  uc text,
  cod_pess_fat text,
  cpf_cnpj text,
  nome text,
  valor_vencido numeric,
  qt_fats integer,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $FUNC$
DECLARE
  v_sql text;
  v_where text := 'pd.is_active = true AND pd.valor_vencido > 0';
BEGIN
  v_where := v_where || ' AND (LENGTH(REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, ''[^0-9]'', '''', ''g'')) IN (11, 14))';
  
  v_where := v_where || ' AND NOT EXISTS (
    SELECT 1 FROM public.serasa_negativations sn 
    WHERE (REGEXP_REPLACE(sn.cpf_cnpj, ''[^0-9]'', '''', ''g'') = REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, ''[^0-9]'', '''', ''g'') OR sn.cpf_cnpj = pd.pessoa_fatura_cpf_cnpj)
  )';

  v_where := v_where || ' AND NOT EXISTS (
    SELECT 1 FROM public.serasa_workflow sw 
    WHERE sw.uc = pd.uc AND sw.cod_pess_fat = pd.cod_pess_fat
  )';

  IF p_search IS NOT NULL AND p_search <> '' THEN
    v_where := v_where || ' AND (pd.uc ILIKE ''%'' || $1 || ''%'' OR pd.pessoa_fatura_nome ILIKE ''%'' || $1 || ''%'' OR pd.pessoa_fatura_cpf_cnpj ILIKE ''%'' || $1 || ''%'')';
  END IF;

  v_sql := 'WITH filtered AS (
              SELECT 
                pd.uc, 
                pd.cod_pess_fat, 
                REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, ''[^0-9]'', '''', ''g'') as cpf_cnpj, 
                pd.pessoa_fatura_nome as nome, 
                pd.valor_vencido, 
                pd.qt_fats
              FROM public.pending_debts pd
              WHERE ' || v_where || '
            )
            SELECT *, (SELECT count(*) FROM filtered) AS total_count
            FROM filtered
            ORDER BY valor_vencido DESC
            LIMIT $2 OFFSET $3';

  RETURN QUERY EXECUTE v_sql USING p_search, p_limit, p_offset;
END;
$FUNC$;
