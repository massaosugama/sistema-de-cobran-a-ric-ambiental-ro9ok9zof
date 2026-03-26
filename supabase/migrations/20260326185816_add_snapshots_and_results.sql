DO $$ 
BEGIN
  -- Create app_settings table
  CREATE TABLE IF NOT EXISTS public.app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Add snapshot columns
  ALTER TABLE public.contact_history 
    ADD COLUMN IF NOT EXISTS snapshot_valor_total NUMERIC,
    ADD COLUMN IF NOT EXISTS snapshot_valor_vencido NUMERIC,
    ADD COLUMN IF NOT EXISTS snapshot_valor_a_vencer NUMERIC,
    ADD COLUMN IF NOT EXISTS snapshot_qt_fats INTEGER,
    ADD COLUMN IF NOT EXISTS snapshot_refs TEXT;

  -- Create contact_results
  CREATE TABLE IF NOT EXISTS public.contact_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      contact_id UUID REFERENCES public.contact_history(id) ON DELETE CASCADE,
      uc TEXT NOT NULL,
      cod_pess_fat TEXT NOT NULL,
      settlement_id UUID REFERENCES public.settlements(id) ON DELETE CASCADE,
      valor_recuperado NUMERIC NOT NULL,
      data_baixa DATE NOT NULL,
      dias_para_reversao INTEGER NOT NULL,
      pontos_reversao INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(contact_id, settlement_id)
  );
END $$;

-- RLS for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.app_settings;
CREATE POLICY "authenticated_all" ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for contact_results
ALTER TABLE public.contact_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_all" ON public.contact_results;
CREATE POLICY "authenticated_all" ON public.contact_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert defaults
INSERT INTO public.app_settings (key, value) VALUES 
('conversion_params', '{"max_days": 30, "max_score_days": 7}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Backfill
DO $$
BEGIN
  UPDATE public.contact_history ch
  SET 
    snapshot_valor_total = pd.valor_total,
    snapshot_valor_vencido = pd.valor_vencido,
    snapshot_valor_a_vencer = pd.valor_a_vencer,
    snapshot_qt_fats = pd.qt_fats,
    snapshot_refs = pd.refs
  FROM public.pending_debts pd
  WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat
    AND ch.snapshot_valor_total IS NULL;
END $$;

-- Drop heavy trigger on pending_debts to prevent timeout during large imports
DROP TRIGGER IF EXISTS on_pending_debts_change ON public.pending_debts;

-- Create RPC to process conversions
CREATE OR REPLACE FUNCTION public.process_conversions()
RETURNS void AS $$
DECLARE
  max_days INT;
  max_score_days INT;
BEGIN
  -- Get params
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
    COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
    (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
    CASE WHEN (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN 5 ELSE 2 END as pontos_reversao
  FROM public.settlements s
  JOIN public.contact_history ch ON ch.uc = s.uc AND (ch.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
  WHERE 
    ch.is_active = true
    AND COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) >= (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND (COALESCE(s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
  ON CONFLICT (contact_id, settlement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
