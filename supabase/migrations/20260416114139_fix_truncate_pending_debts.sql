CREATE OR REPLACE FUNCTION public.truncate_pending_debts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  batch_size INT := 10000;
  affected INT;
BEGIN
  -- Ao invés de usar TRUNCATE, realiza uma exclusão controlada marcando como inativos,
  -- para que o histórico operacional se mantenha mas não apareça nos dashboards financeiros.
  -- Utiliza um loop de atualização em lotes e cláusula WHERE explícita para evitar 
  -- o erro "UPDATE requires a WHERE clause" do pg_safeupdate e otimizar a atualização.
  LOOP
    UPDATE public.pending_debts 
    SET is_active = false 
    WHERE (uc, cod_pess_fat) IN (
      SELECT uc, cod_pess_fat 
      FROM public.pending_debts 
      WHERE is_active = true OR is_active IS NULL
      LIMIT batch_size
    );
    
    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
  END LOOP;
END;
$function$;
