CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
SELECT 
  v.*,
  (
    SELECT MAX(ch.created_at)
    FROM public.contact_history ch
    WHERE ch.uc = v.uc
      AND (ch.cod_pess_fat = v.cod_pess_fat OR v.cod_pess_fat IS NULL)
      AND ch.status = 'TERMO_ANEXADO'
  ) AS termo_date,
  EXISTS (
    SELECT 1
    FROM public.contact_history ch
    WHERE ch.uc = v.uc
      AND (ch.cod_pess_fat = v.cod_pess_fat OR v.cod_pess_fat IS NULL)
      AND ch.status = 'TERMO_ANEXADO'
  ) AS has_termo
FROM public.vw_queue_debts v;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_terms_queue_debts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
$function$;
