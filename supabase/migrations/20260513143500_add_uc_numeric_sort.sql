-- Add computed column functions for numeric sorting of UC
-- This allows PostgREST to order by uc_numeric safely without schema destruction

CREATE OR REPLACE FUNCTION public.uc_numeric(rec public.vw_queue_debts) 
RETURNS NUMERIC AS $$
  SELECT NULLIF(regexp_replace(rec.uc, '\D', '', 'g'), '')::NUMERIC;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION public.uc_numeric(rec public.vw_pending_debts_with_contacts) 
RETURNS NUMERIC AS $$
  SELECT NULLIF(regexp_replace(rec.uc, '\D', '', 'g'), '')::NUMERIC;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION public.uc_numeric(rec public.pending_debts) 
RETURNS NUMERIC AS $$
  SELECT NULLIF(regexp_replace(rec.uc, '\D', '', 'g'), '')::NUMERIC;
$$ LANGUAGE SQL IMMUTABLE;
