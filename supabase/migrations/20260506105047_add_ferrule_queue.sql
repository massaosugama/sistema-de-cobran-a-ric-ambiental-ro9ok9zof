DO $$
BEGIN
  -- Recreate vw_queue_debts to include is_ferrule
  DROP VIEW IF EXISTS public.vw_queue_debts;
  
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
    (SELECT max(created_at) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat) AS latest_contact_date,
    (SELECT jsonb_agg(DISTINCT operator_id) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat) AS operator_ids,
    (SELECT count(*) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat) AS contact_count,
    EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) AS is_strategic,
    EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado')) AS is_legal,
    EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'cut' AND sa.status IN ('para_abrir_os', 'os_corte_aberta')) AS is_cut,
    EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'recut' AND sa.status IN ('para_abrir_os', 'os_recorte_aberta')) AS is_recut,
    EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat AND sa.queue_type = 'ferrule' AND sa.status IN ('para_abrir_os', 'os_ferrule_aberta')) AS is_ferrule
  FROM public.pending_debts pd
  WHERE pd.is_active = true;

END $$;
