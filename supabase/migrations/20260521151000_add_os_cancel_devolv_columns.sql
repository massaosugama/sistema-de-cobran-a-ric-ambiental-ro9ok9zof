DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'massao.sugama@alje.com.br') THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'massao.sugama@alje.com.br',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Massao Sugama"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, is_admin)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Drop dependent functions to be able to drop views
DROP FUNCTION IF EXISTS public.uc_numeric(vw vw_terms_queue_debts);
DROP FUNCTION IF EXISTS public.uc_numeric(vw vw_queue_debts);
DROP FUNCTION IF EXISTS public.uc_numeric(vw vw_pending_debts_with_contacts);

DROP VIEW IF EXISTS public.vw_terms_queue_debts CASCADE;
DROP VIEW IF EXISTS public.vw_queue_debts CASCADE;
DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts CASCADE;

ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS qtd_os_total_cancel_devolv INTEGER;
ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS ultima_data_criacao_os DATE;

-- Recreate vw_pending_debts_with_contacts
CREATE OR REPLACE VIEW public.vw_pending_debts_with_contacts AS
SELECT pd.uc,
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
    pd.valor_vencido_neg_com_ativa,
    pd.dt_vencto_ref_mais_recente,
    pd.situacao_ligacao,
    pd.tem_negociacao_vencida,
    pd.qtd_os_total_cancel_devolv,
    pd.ultima_data_criacao_os,
    ch_agg.latest_contact_date,
    ch_agg.operator_ids,
    ch_agg.contact_count
FROM public.pending_debts pd
LEFT JOIN (
    SELECT 
        contact_history.uc, 
        contact_history.cod_pess_fat,
        MAX(contact_history.created_at) as latest_contact_date,
        jsonb_agg(DISTINCT contact_history.operator_id) filter (where contact_history.operator_id is not null) as operator_ids,
        COUNT(contact_history.id) as contact_count
    FROM public.contact_history
    WHERE contact_history.is_active = true
    GROUP BY contact_history.uc, contact_history.cod_pess_fat
) ch_agg ON ch_agg.uc = pd.uc AND ch_agg.cod_pess_fat = pd.cod_pess_fat;

-- Recreate vw_queue_debts
CREATE OR REPLACE VIEW public.vw_queue_debts AS
SELECT v.uc,
    v.setor,
    v.endereco,
    v.uc_repete,
    v.ta_nome_de_quem,
    v.qt_fats,
    v.situ_docto,
    v.valor_total,
    v.refs,
    v.cod_pess_fat,
    v.pessoa_fatura_nome,
    v.pessoa_fatura_cpf_cnpj,
    v.pessoa_fatura_celular,
    v.proprietario_nome,
    v.proprietario_cpf_cnpj,
    v.proprietario_celular,
    v.responsavel_nome,
    v.responsavel_cpf_cnpj,
    v.responsavel_celular,
    v.valor_vencido,
    v.valor_a_vencer,
    v.valor_retidas_em_aberto,
    v.valor_vencido_neg_com_ativa,
    v.dt_vencto_ref_mais_recente,
    v.situacao_ligacao,
    v.tem_negociacao_vencida,
    v.qtd_os_total_cancel_devolv,
    v.ultima_data_criacao_os,
    v.latest_contact_date,
    v.operator_ids,
    v.contact_count,
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) AS is_strategic,
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado')) AS is_legal,
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'cut' AND sa.status IN ('para_abrir_os', 'os_corte_aberta')) AS is_cut,
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'recut' AND sa.status IN ('para_abrir_os', 'os_recorte_aberta')) AS is_recut,
    EXISTS ( SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'ferrule' AND sa.status IN ('para_abrir_os', 'os_aberta')) AS is_ferrule
   FROM public.vw_pending_debts_with_contacts v;

-- Recreate vw_terms_queue_debts
CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
SELECT v.uc,
    v.setor,
    v.endereco,
    v.uc_repete,
    v.ta_nome_de_quem,
    v.qt_fats,
    v.situ_docto,
    v.valor_total,
    v.refs,
    v.cod_pess_fat,
    v.pessoa_fatura_nome,
    v.pessoa_fatura_cpf_cnpj,
    v.pessoa_fatura_celular,
    v.proprietario_nome,
    v.proprietario_cpf_cnpj,
    v.proprietario_celular,
    v.responsavel_nome,
    v.responsavel_cpf_cnpj,
    v.responsavel_celular,
    v.valor_vencido,
    v.valor_a_vencer,
    v.valor_retidas_em_aberto,
    v.valor_vencido_neg_com_ativa,
    v.dt_vencto_ref_mais_recente,
    v.situacao_ligacao,
    v.tem_negociacao_vencida,
    v.qtd_os_total_cancel_devolv,
    v.ultima_data_criacao_os,
    v.latest_contact_date,
    v.operator_ids,
    v.contact_count,
    v.is_strategic,
    v.is_legal,
    v.is_cut,
    v.is_recut,
    v.is_ferrule,
    false AS has_termo,
    NULL::timestamp with time zone AS termo_date
   FROM public.vw_queue_debts v;

-- Recreate uc_numeric functions
CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_terms_queue_debts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_pending_debts_with_contacts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_queue_debts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;
