-- Adiciona a coluna is_leiturista para distinguir quais usuarios GIS realmente fazem leitura
ALTER TABLE public.gis_users ADD COLUMN IF NOT EXISTS is_leiturista BOOLEAN DEFAULT false;

-- Atualiza os leituristas baseando-se no historico existente
UPDATE public.gis_users
SET is_leiturista = true
WHERE usuario_id IN (
    SELECT DISTINCT usuario_id 
    FROM public.daily_readings 
    WHERE usuario_id IS NOT NULL AND usuario_id != ''
);

-- Cria ou substitui a function de gatilho
CREATE OR REPLACE FUNCTION public.trg_update_is_leiturista()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usuario_id IS NOT NULL AND NEW.usuario_id != '' THEN
        UPDATE public.gis_users
        SET is_leiturista = true
        WHERE usuario_id = NEW.usuario_id AND (is_leiturista IS FALSE OR is_leiturista IS NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o gatilho para a tabela daily_readings
DROP TRIGGER IF EXISTS on_daily_reading_insert ON public.daily_readings;

CREATE TRIGGER on_daily_reading_insert
AFTER INSERT OR UPDATE OF usuario_id ON public.daily_readings
FOR EACH ROW EXECUTE FUNCTION public.trg_update_is_leiturista();
