-- Adiciona a nova coluna datacriacao para armazenar a data real da operação
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS datacriacao TIMESTAMPTZ;

-- Atualiza a função de limpeza para usar datacriacao se disponível, fazendo fallback para o created_at
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

  -- Remove as movimentações de baixas mais antigas que o prazo estipulado (priorizando a data de criação real do registro no GIS)
  DELETE FROM public.settlements
  WHERE COALESCE(datacriacao, created_at) < NOW() - (retention_days || ' days')::interval;
END;
$$;

-- Atualiza a função de conversão para usar a datacriacao no cálculo da "idade" da baixa, priorizando-a sobre as outras datas
CREATE OR REPLACE FUNCTION public.process_conversions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_days INT;
  max_score_days INT;
BEGIN
  -- Parametros do sistema
  SELECT (value->>'max_days')::int INTO max_days FROM public.app_settings WHERE key = 'conversion_params';
  SELECT (value->>'max_score_days')::int INTO max_score_days FROM public.app_settings WHERE key = 'conversion_params';
  
  IF max_days IS NULL THEN max_days := 30; END IF;
  IF max_score_days IS NULL THEN max_score_days := 7; END IF;

  INSERT INTO public.contact_results (contact_id, uc, cod_pess_fat, settlement_id, valor_recuperado, data_baixa, dias_para_reversao, pontos_reversao)
  SELECT 
    ch.id as contact_id,
    s.uc,
    COALESCE(s.cod_pess_fat, ch.cod_pess_fat) as cod_pess_fat,
    s.id as settlement_id,
    s.valor_total as valor_recuperado,
    COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
    (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
    CASE WHEN (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN 5 ELSE 2 END as pontos_reversao
  FROM public.settlements s
  JOIN public.contact_history ch ON ch.uc = s.uc AND (ch.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
  WHERE 
    ch.is_active = true
    AND s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO')
    AND COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) >= (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
  ON CONFLICT (contact_id, settlement_id) DO NOTHING;
END;
$$;
