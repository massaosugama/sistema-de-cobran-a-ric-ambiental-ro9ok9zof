DO $$
BEGIN
  ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS ultimo_disparo TIMESTAMPTZ;
END $$;

CREATE OR REPLACE FUNCTION public.bulk_update_ultimo_disparo(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  row record;
BEGIN
  FOR row IN SELECT * FROM jsonb_to_recordset(payload) AS x(uc text, cod_pess_fat text, ultimo_disparo timestamptz) LOOP
    UPDATE public.pending_debts
    SET ultimo_disparo = row.ultimo_disparo
    WHERE uc = row.uc AND cod_pess_fat = row.cod_pess_fat;
  END LOOP;
END;
$function$;
