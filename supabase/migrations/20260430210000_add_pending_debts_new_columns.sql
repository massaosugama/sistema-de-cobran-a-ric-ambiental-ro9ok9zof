-- Adiciona as novas colunas solicitadas para controle de antiguidade da dívida e situação da ligação
ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS dt_vencto_ref_mais_antiga date;
ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS situacao_ligacao text;
