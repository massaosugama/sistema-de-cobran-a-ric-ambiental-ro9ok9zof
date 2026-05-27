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
    c.latest_contact_date,
    c.operator_ids,
    c.contact_count,
    EXISTS (
        SELECT 1 
        FROM public.strategic_assignments sa 
        WHERE sa.uc = pd.uc 
          AND sa.cod_pess_fat = pd.cod_pess_fat 
          AND sa.queue_type = 'strategic'
    ) AS is_strategic,
    EXISTS (
        SELECT 1 
        FROM public.strategic_assignments sa 
        WHERE sa.uc = pd.uc 
          AND sa.cod_pess_fat = pd.cod_pess_fat 
          AND sa.queue_type = 'legal'
    ) AS is_legal,
    EXISTS (
        SELECT 1 
        FROM public.strategic_assignments sa 
        WHERE sa.uc = pd.uc 
          AND sa.cod_pess_fat = pd.cod_pess_fat 
          AND sa.queue_type = 'cut'
    ) AS is_cut,
    EXISTS (
        SELECT 1 
        FROM public.strategic_assignments sa 
        WHERE sa.uc = pd.uc 
          AND sa.cod_pess_fat = pd.cod_pess_fat 
          AND sa.queue_type = 'recut'
    ) AS is_recut
FROM public.pending_debts pd
LEFT JOIN (
    SELECT 
        contact_history.uc,
        contact_history.cod_pess_fat,
        max(contact_history.created_at) AS latest_contact_date,
        jsonb_agg(DISTINCT contact_history.operator_id) FILTER (WHERE contact_history.operator_id IS NOT NULL) AS operator_ids,
        count(contact_history.id) AS contact_count
    FROM public.contact_history
    WHERE contact_history.is_active = true
    GROUP BY contact_history.uc, contact_history.cod_pess_fat
) c ON c.uc = pd.uc AND c.cod_pess_fat = pd.cod_pess_fat
WHERE pd.is_active = true;
