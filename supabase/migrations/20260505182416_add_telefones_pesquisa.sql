DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_debts' AND column_name = 'telefones_pesquisa') THEN
    ALTER TABLE public.pending_debts ADD COLUMN telefones_pesquisa TEXT;
  END IF;
END $$;
