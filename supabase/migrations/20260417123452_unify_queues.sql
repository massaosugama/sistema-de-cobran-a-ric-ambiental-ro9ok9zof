ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS queue_type text NOT NULL DEFAULT 'strategic';
ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS previous_queue text;
ALTER TABLE public.strategic_assignments ADD COLUMN IF NOT EXISTS previous_status text;

DO $$
DECLARE
  lq RECORD;
BEGIN
  FOR lq IN SELECT * FROM public.legal_queue LOOP
    IF lq.strategic_assignment_id IS NOT NULL THEN
      UPDATE public.strategic_assignments 
      SET 
        queue_type = 'legal', 
        status = lq.status,
        previous_queue = 'strategic',
        previous_status = 'completed'
      WHERE id = lq.strategic_assignment_id;
    ELSE
      INSERT INTO public.strategic_assignments (
        uc, cod_pess_fat, operator_id, status, queue_type, created_at,
        snapshot_valor_vencido, snapshot_qt_fats, snapshot_nome_cliente
      ) VALUES (
        lq.uc, lq.cod_pess_fat, lq.operator_id, lq.status, 'legal', lq.created_at,
        lq.snapshot_valor_vencido, lq.snapshot_qt_fats, lq.snapshot_nome_cliente
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_assignable_debts(p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_periods text[] DEFAULT NULL::text[])
 RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, valor_total numeric, valor_vencido numeric, qt_fats integer, refs text, latest_contact_date timestamp with time zone)
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
  WHERE pd.is_active = true
    AND (p_min_value IS NULL OR pd.valor_vencido >= p_min_value)
    AND (p_max_value IS NULL OR pd.valor_vencido <= p_max_value)
    AND (
      p_periods IS NULL 
      OR array_length(p_periods, 1) IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(p_periods) per 
        WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strategic_assignments sa 
      WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat 
      AND (
        (sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) OR
        (sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado'))
      )
    )
  ORDER BY pd.valor_vencido DESC NULLS LAST
  LIMIT 500;
END;
$function$;
