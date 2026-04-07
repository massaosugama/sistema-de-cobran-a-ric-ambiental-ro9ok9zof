ALTER TABLE public.settlements 
  DROP COLUMN IF EXISTS pessoa_fatura_nome,
  DROP COLUMN IF EXISTS pessoa_fatura_cpf_cnpj,
  DROP COLUMN IF EXISTS pessoa_fatura_celular;
