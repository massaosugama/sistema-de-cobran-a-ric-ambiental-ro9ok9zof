DO $$
BEGIN
  -- Safely drop if exists to ensure idempotency
  DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts;
END $$;

CREATE OR REPLACE VIEW public.vw_pending_debts_with_contacts AS
SELECT 
  pd.uc,
  pd.cod_pess_fat,
  pd.setor,
  pd.endereco,
  pd.uc_repete,
  pd.ta_nome_de_quem,
  pd.qt_fats,
  pd.situ_docto,
  pd.valor_total,
  pd.refs,
  pd.pessoa_fatura_nome,
  pd.pessoa_fatura_cpf_cnpj,
  pd.pessoa_fatura_celular,
  pd.proprietario_nome,
  pd.proprietario_cpf_cnpj,
  pd.proprietario_celular,
  pd.responsavel_nome,
  pd.responsavel_cpf_cnpj,
  pd.responsavel_celular,
  pd.valor_vencido,
  pd.valor_a_vencer,
  pd.valor_retidas_em_aberto,
  ch_agg.latest_contact_date,
  ch_agg.operator_ids,
  COALESCE(ch_agg.contact_count, 0) as contact_count
FROM public.pending_debts pd
LEFT JOIN (
  SELECT 
    uc, 
    cod_pess_fat,
    MAX(created_at) as latest_contact_date,
    jsonb_agg(DISTINCT operator_id) FILTER (WHERE operator_id IS NOT NULL) as operator_ids,
    COUNT(id) as contact_count
  FROM public.contact_history
  WHERE is_active = true
  GROUP BY uc, cod_pess_fat
) ch_agg ON ch_agg.uc = pd.uc AND ch_agg.cod_pess_fat = pd.cod_pess_fat;

-- Grant permissions for authenticated users to select from the view
GRANT SELECT ON public.vw_pending_debts_with_contacts TO authenticated;
