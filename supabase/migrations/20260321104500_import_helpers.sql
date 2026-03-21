-- Function to truncate pending_debts table, allowing the client to reset the table before a full upload
CREATE OR REPLACE FUNCTION public.truncate_pending_debts()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE public.pending_debts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
