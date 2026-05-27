DO $$
BEGIN
    DROP VIEW IF EXISTS public.vw_terms_queue_debts CASCADE;
END $$;

CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
WITH latest_term AS (
    SELECT uc, cod_pess_fat, MAX(created_at) as termo_date,
           (array_agg(id ORDER BY created_at DESC))[1] as contact_id
    FROM public.contact_history
    WHERE status = 'TERMO_ANEXADO' AND COALESCE(is_active, true) = true
    GROUP BY uc, cod_pess_fat
)
SELECT 
    pd.uc,
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
    pd.valor_total,
    pd.valor_vencido,
    pd.valor_a_vencer,
    pd.valor_retidas_em_aberto,
    pd.qt_fats,
    pd.refs,
    pd.endereco,
    pd.setor,
    pd.situacao_ligacao,
    pd.situ_docto,
    pd.tem_negociacao_vencida,
    pd.dt_vencto_ref_mais_recente,
    pd.uc_repete,
    pd.ta_nome_de_quem,
    false AS has_termo,
    NULL::timestamp with time zone AS termo_date,
    NULL::timestamp with time zone AS latest_contact_date,
    NULL::jsonb AS operator_ids,
    0::bigint AS contact_count,
    COALESCE(sa.queue_type = 'strategic', false) AS is_strategic,
    COALESCE(sa.queue_type = 'legal', false) AS is_legal,
    COALESCE(sa.queue_type = 'cut', false) AS is_cut,
    COALESCE(sa.queue_type = 'recut', false) AS is_recut,
    COALESCE(sa.queue_type = 'ferrule', false) AS is_ferrule
FROM public.pending_debts pd
LEFT JOIN latest_term lt ON pd.uc = lt.uc AND pd.cod_pess_fat = lt.cod_pess_fat
LEFT JOIN public.strategic_assignments sa ON sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat 
  AND sa.status IN ('pending', 'started', 'a_encaminhar', 'encaminhado', 'para_abrir_os', 'os_corte_aberta', 'os_recorte_aberta')
WHERE COALESCE(pd.is_active, true) = true AND lt.uc IS NULL

UNION ALL

SELECT 
    lt.uc,
    lt.cod_pess_fat,
    COALESCE(pd.pessoa_fatura_nome, 'Registro Histórico (Baixado)'),
    pd.pessoa_fatura_cpf_cnpj,
    pd.pessoa_fatura_celular,
    pd.proprietario_nome,
    pd.proprietario_cpf_cnpj,
    pd.proprietario_celular,
    pd.responsavel_nome,
    pd.responsavel_cpf_cnpj,
    pd.responsavel_celular,
    COALESCE(pd.valor_total, 0),
    COALESCE(pd.valor_vencido, 0),
    COALESCE(pd.valor_a_vencer, 0),
    COALESCE(pd.valor_retidas_em_aberto, 0),
    COALESCE(pd.qt_fats, 0),
    pd.refs,
    COALESCE(pd.endereco, 'Dados removidos da base ativa'),
    pd.setor,
    pd.situacao_ligacao,
    pd.situ_docto,
    COALESCE(pd.tem_negociacao_vencida, false),
    pd.dt_vencto_ref_mais_recente,
    pd.uc_repete,
    pd.ta_nome_de_quem,
    true AS has_termo,
    lt.termo_date,
    lt.termo_date AS latest_contact_date,
    (SELECT jsonb_agg(operator_id) FROM public.contact_history ch_sub WHERE ch_sub.uc = lt.uc AND ch_sub.cod_pess_fat = lt.cod_pess_fat AND ch_sub.status = 'TERMO_ANEXADO' AND COALESCE(ch_sub.is_active, true) = true) AS operator_ids,
    (SELECT count(*) FROM public.contact_history ch_sub WHERE ch_sub.uc = lt.uc AND ch_sub.cod_pess_fat = lt.cod_pess_fat AND ch_sub.status = 'TERMO_ANEXADO' AND COALESCE(ch_sub.is_active, true) = true) AS contact_count,
    false AS is_strategic,
    false AS is_legal,
    false AS is_cut,
    false AS is_recut,
    false AS is_ferrule
FROM latest_term lt
LEFT JOIN public.pending_debts pd ON lt.uc = pd.uc AND lt.cod_pess_fat = pd.cod_pess_fat AND COALESCE(pd.is_active, true) = true;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_terms_queue_debts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
$function$;
