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
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started') ) AS is_strategic,
    EXISTS ( SELECT 1 FROM public.legal_queue lq WHERE lq.uc = pd.uc AND lq.cod_pess_fat = pd.cod_pess_fat AND lq.status IN ('a_encaminhar', 'encaminhado') ) AS is_legal
FROM public.pending_debts pd
LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat
WHERE pd.is_active = true;
