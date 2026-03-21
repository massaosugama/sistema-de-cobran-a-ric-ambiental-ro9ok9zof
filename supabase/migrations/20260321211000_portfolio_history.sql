-- Create portfolio_history table
CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    total_cases INTEGER NOT NULL DEFAULT 0,
    total_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- Add policies
DROP POLICY IF EXISTS "authenticated_all" ON public.portfolio_history;
CREATE POLICY "authenticated_all" ON public.portfolio_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create a function to record the snapshot
CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
RETURNS void AS $$
BEGIN
    INSERT INTO public.portfolio_history (snapshot_date, total_cases, total_value)
    SELECT 
        CURRENT_DATE,
        COUNT(*),
        COALESCE(SUM(valor_total), 0)
    FROM (
        SELECT uc, cod_pess_fat, SUM(valor_total) as valor_total
        FROM public.pending_debts
        GROUP BY uc, cod_pess_fat
    ) unique_cases
    ON CONFLICT (snapshot_date) DO UPDATE 
    SET total_cases = EXCLUDED.total_cases, 
        total_value = EXCLUDED.total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current stats quickly via RPC
CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_cases', count(*),
    'total_value', COALESCE(sum(valor_total), 0)
  ) INTO result
  FROM (
    SELECT uc, cod_pess_fat, sum(valor_total) as valor_total
    FROM public.pending_debts
    GROUP BY uc, cod_pess_fat
  ) t;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Take initial snapshot right now
SELECT public.record_portfolio_snapshot();

-- Add statement-level trigger to keep snapshot updated automatically today
CREATE OR REPLACE FUNCTION public.trigger_record_snapshot()
RETURNS trigger AS $$
BEGIN
    PERFORM public.record_portfolio_snapshot();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_pending_debts_change ON public.pending_debts;
CREATE TRIGGER on_pending_debts_change
AFTER INSERT OR UPDATE OR DELETE ON public.pending_debts
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_record_snapshot();
