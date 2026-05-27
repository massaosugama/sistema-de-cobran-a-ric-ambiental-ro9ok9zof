CREATE OR REPLACE VIEW public.vw_queue_debts AS
SELECT 
  v.*,
  EXISTS (
    SELECT 1 FROM public.strategic_assignments sa 
    WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat
  ) as is_strategic,
  EXISTS (
    SELECT 1 FROM public.legal_queue lq 
    WHERE lq.uc = v.uc AND lq.cod_pess_fat = v.cod_pess_fat
  ) as is_legal
FROM public.vw_pending_debts_with_contacts v;

GRANT SELECT ON public.vw_queue_debts TO authenticated;
GRANT SELECT ON public.vw_queue_debts TO anon;
GRANT SELECT ON public.vw_queue_debts TO service_role;
