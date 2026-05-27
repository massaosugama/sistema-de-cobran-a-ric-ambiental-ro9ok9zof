CREATE TABLE IF NOT EXISTS public.daily_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uc TEXT,
    leitura_id TEXT,
    is_visivel TEXT,
    organizacao_id TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE,
    usuario_id TEXT,
    uc_id TEXT,
    situacao_ligacao TEXT,
    descricao_ligacao TEXT,
    data_referencia TIMESTAMP WITH TIME ZONE,
    leitura_anterior NUMERIC,
    data_leitura_anterior TIMESTAMP WITH TIME ZONE,
    leitura_real NUMERIC,
    data_leitura_real TIMESTAMP WITH TIME ZONE,
    consumo_real NUMERIC,
    leitura_calculada NUMERIC,
    data_leitura_calculada TIMESTAMP WITH TIME ZONE,
    consumo_calculado NUMERIC,
    media_consumo NUMERIC,
    critica TEXT,
    ocorrencia_id TEXT,
    documento_id TEXT,
    os_id TEXT,
    situacao TEXT,
    localizacao_ligacao TEXT,
    lote_medicao_id TEXT,
    data_apresentacao_documento TIMESTAMP WITH TIME ZONE,
    original_id TEXT,
    tipo_calculo TEXT,
    hidrometro_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.daily_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all" ON public.daily_readings;
CREATE POLICY "authenticated_all" ON public.daily_readings
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS daily_readings_original_id_idx ON public.daily_readings (original_id);
CREATE INDEX IF NOT EXISTS daily_readings_uc_idx ON public.daily_readings (uc);
CREATE INDEX IF NOT EXISTS daily_readings_data_leitura_real_idx ON public.daily_readings (data_leitura_real);
