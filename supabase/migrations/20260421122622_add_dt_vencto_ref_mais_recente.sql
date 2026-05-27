ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS dt_vencto_ref_mais_recente DATE;

-- Drop and Recreate views to include the new column
DROP VIEW IF EXISTS public.vw_queue_debts;
DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts;

CREATE VIEW public.vw_pending_debts_with_contacts AS
SELECT 
  pd.uc,
  pd.setor,
  pd.endereco,
  pd.uc_repete,
  pd.ta_nome_de_quem,
  pd.qt_fats,
  pd.situ_docto,
  pd.valor_total,
  pd.refs,
  pd.cod_pess_fat,
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
  pd.dt_vencto_ref_mais_recente,
  ch.latest_contact_date,
  ch.operator_ids,
  ch.contact_count
FROM public.pending_debts pd
LEFT JOIN (
  SELECT 
    contact_history.uc,
    contact_history.cod_pess_fat,
    max(contact_history.created_at) AS latest_contact_date,
    jsonb_agg(DISTINCT contact_history.operator_id) AS operator_ids,
    count(contact_history.id) AS contact_count
  FROM public.contact_history
  GROUP BY contact_history.uc, contact_history.cod_pess_fat
) ch ON pd.uc = ch.uc AND pd.cod_pess_fat = ch.cod_pess_fat;

CREATE VIEW public.vw_queue_debts AS
SELECT 
  vw.uc,
  vw.setor,
  vw.endereco,
  vw.uc_repete,
  vw.ta_nome_de_quem,
  vw.qt_fats,
  vw.situ_docto,
  vw.valor_total,
  vw.refs,
  vw.cod_pess_fat,
  vw.pessoa_fatura_nome,
  vw.pessoa_fatura_cpf_cnpj,
  vw.pessoa_fatura_celular,
  vw.proprietario_nome,
  vw.proprietario_cpf_cnpj,
  vw.proprietario_celular,
  vw.responsavel_nome,
  vw.responsavel_cpf_cnpj,
  vw.responsavel_celular,
  vw.valor_vencido,
  vw.valor_a_vencer,
  vw.valor_retidas_em_aberto,
  vw.dt_vencto_ref_mais_recente,
  vw.latest_contact_date,
  vw.operator_ids,
  vw.contact_count,
  EXISTS ( 
    SELECT 1
    FROM public.strategic_assignments sa
    WHERE sa.uc = vw.uc AND sa.cod_pess_fat = vw.cod_pess_fat AND sa.queue_type = 'strategic'::text AND (sa.status = ANY (ARRAY['pending'::text, 'started'::text]))
  ) AS is_strategic,
  EXISTS ( 
    SELECT 1
    FROM public.strategic_assignments sa
    WHERE sa.uc = vw.uc AND sa.cod_pess_fat = vw.cod_pess_fat AND sa.queue_type = 'legal'::text AND (sa.status = ANY (ARRAY['a_encaminhar'::text, 'encaminhado'::text]))
  ) AS is_legal
FROM public.vw_pending_debts_with_contacts vw;
