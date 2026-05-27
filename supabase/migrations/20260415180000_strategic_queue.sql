DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.strategic_assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      uc text NOT NULL,
      cod_pess_fat text NOT NULL,
      operator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      started_at timestamptz,
      completed_at timestamptz,
      FOREIGN KEY (uc, cod_pess_fat) REFERENCES public.pending_debts (uc, cod_pess_fat) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS strategic_assignments_operator_idx ON public.strategic_assignments(operator_id);
  CREATE INDEX IF NOT EXISTS strategic_assignments_uc_cod_pess_fat_idx ON public.strategic_assignments(uc, cod_pess_fat);
END $$;

ALTER TABLE public.strategic_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.strategic_assignments;
CREATE POLICY "authenticated_all" ON public.strategic_assignments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_assignable_debts(
  p_min_value numeric DEFAULT NULL,
  p_max_value numeric DEFAULT NULL,
  p_periods text[] DEFAULT NULL
)
RETURNS TABLE (
  uc text,
  cod_pess_fat text,
  pessoa_fatura_nome text,
  valor_total numeric,
  valor_vencido numeric,
  qt_fats integer,
  refs text,
  latest_contact_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pd.uc, 
    pd.cod_pess_fat, 
    pd.pessoa_fatura_nome, 
    pd.valor_total, 
    pd.valor_vencido, 
    pd.qt_fats, 
    pd.refs,
    vw.latest_contact_date
  FROM public.pending_debts pd
  LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat
  WHERE (p_min_value IS NULL OR pd.valor_total >= p_min_value)
    AND (p_max_value IS NULL OR pd.valor_total <= p_max_value)
    AND (
      p_periods IS NULL 
      OR array_length(p_periods, 1) IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(p_periods) per WHERE pd.refs LIKE '%' || per || '%'
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strategic_assignments sa 
      WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat 
      AND sa.status IN ('pending', 'started')
    )
  ORDER BY pd.valor_total DESC NULLS LAST
  LIMIT 500;
END;
$function$;
