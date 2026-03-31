-- Adiciona a coluna created_at se não existir, para podermos usar como base de expiração
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Cria a função de limpeza que será chamada ao final do processo de importação
CREATE OR REPLACE FUNCTION public.cleanup_old_settlements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  retention_days INT;
BEGIN
  -- Tenta ler o parâmetro de retenção do app_settings, se não encontrar usa 90 como padrão
  SELECT (value->>'retention_days')::int INTO retention_days 
  FROM public.app_settings 
  WHERE key = 'conversion_params';
  
  IF retention_days IS NULL THEN 
    retention_days := 90; 
  END IF;

  -- Remove as movimentações de baixas mais antigas que o prazo estipulado
  DELETE FROM public.settlements
  WHERE created_at < NOW() - (retention_days || ' days')::interval;
END;
$$;
