-- Create indexes to speed up the Serasa cross reference checks
CREATE INDEX IF NOT EXISTS pending_debts_pessoa_fatura_cpf_cnpj_idx ON public.pending_debts USING btree (pessoa_fatura_cpf_cnpj);
CREATE INDEX IF NOT EXISTS pending_debts_proprietario_cpf_cnpj_idx ON public.pending_debts USING btree (proprietario_cpf_cnpj);
CREATE INDEX IF NOT EXISTS pending_debts_responsavel_cpf_cnpj_idx ON public.pending_debts USING btree (responsavel_cpf_cnpj);
CREATE INDEX IF NOT EXISTS pending_debts_cod_pess_fat_idx ON public.pending_debts USING btree (cod_pess_fat);
CREATE INDEX IF NOT EXISTS serasa_negativations_ultima_verificacao_idx ON public.serasa_negativations USING btree (ultima_verificacao);

-- Rewrite function to use batch processing to avoid statement timeout
CREATE OR REPLACE FUNCTION public.update_serasa_debts_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  last_import_date TIMESTAMP WITH TIME ZONE;
  batch_size INT := 250;
  affected INT;
BEGIN
  -- Get the last pending_debts import date
  SELECT MAX(created_at) INTO last_import_date 
  FROM public.import_history 
  WHERE table_name = 'Pendências (Substituição Total)';
  
  -- Use loop for batch processing to avoid statement timeout
  LOOP
    WITH to_update AS (
      SELECT id, cpf_cnpj, REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf_cnpj
      FROM public.serasa_negativations
      WHERE ultima_verificacao IS NULL OR ultima_verificacao < COALESCE(last_import_date, '1900-01-01'::timestamptz)
      LIMIT batch_size
    )
    UPDATE public.serasa_negativations s
    SET 
      possui_debitos = EXISTS (
        SELECT 1 FROM public.pending_debts pd 
        WHERE pd.is_active = true 
        AND (
          pd.pessoa_fatura_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR 
          pd.proprietario_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR 
          pd.responsavel_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
          pd.cod_pess_fat IN (u.cpf_cnpj, u.clean_cpf_cnpj)
        )
      ),
      ultima_verificacao = NOW()
    FROM to_update u
    WHERE s.id = u.id;

    GET DIAGNOSTICS affected = ROW_COUNT;
    EXIT WHEN affected = 0;
    
    -- Small pause to let other transactions run
    PERFORM pg_sleep(0.01);
  END LOOP;
END;
$function$;
