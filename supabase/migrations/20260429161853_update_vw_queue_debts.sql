-- Atualiza a view vw_queue_debts para considerar as badges independentemente do status
CREATE OR REPLACE VIEW public.vw_queue_debts AS
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
  vw.latest_contact_date,
  vw.operator_ids,
  vw.contact_count,
  EXISTS (
    SELECT 1 FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'strategic'
  ) as is_strategic,
  EXISTS (
    SELECT 1 FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'legal'
  ) as is_legal,
  EXISTS (
    SELECT 1 FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'cut'
  ) as is_cut,
  EXISTS (
    SELECT 1 FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'recut'
  ) as is_recut
FROM public.pending_debts pd
LEFT JOIN public.vw_pending_debts_with_contacts vw 
  ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat;
