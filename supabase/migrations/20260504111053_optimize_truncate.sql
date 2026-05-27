CREATE OR REPLACE FUNCTION public.truncate_pending_debts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10min'
AS $function$
BEGIN
  -- Ao invés de usar TRUNCATE, realiza uma exclusão controlada marcando como inativos,
  -- para que o histórico operacional se mantenha mas não apareça nos dashboards financeiros.
  -- Utiliza uma única instrução UPDATE para evitar o overhead de loops limitados e snapshot expansion
  -- O statement_timeout é aumentado localmente nesta função para evitar cancelamentos de timeout durante o processo
  UPDATE public.pending_debts 
  SET is_active = false 
  WHERE is_active = true OR is_active IS NULL;
END;
$function$;
