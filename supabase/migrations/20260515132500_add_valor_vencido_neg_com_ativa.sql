-- Adiciona a coluna na tabela pending_debts (idempotente)
ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS valor_vencido_neg_com_ativa NUMERIC DEFAULT 0;

DO $$
BEGIN
  -- Precisamos derrubar as funções vinculadas aos tipos das views antes de recriar
  DROP FUNCTION IF EXISTS public.uc_numeric(public.vw_terms_queue_debts);
  DROP FUNCTION IF EXISTS public.uc_numeric(public.vw_queue_debts);
  DROP FUNCTION IF EXISTS public.uc_numeric(public.vw_pending_debts_with_contacts);
  
  -- Derruba as views em cascata para garantir recriação correta dos tipos
  DROP VIEW IF EXISTS public.vw_terms_queue_debts;
  DROP VIEW IF EXISTS public.vw_queue_debts;
  DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts;
END $$;

-- 1. Recria vw_pending_debts_with_contacts com a nova coluna incluída
CREATE OR REPLACE VIEW public.vw_pending_debts_with_contacts AS
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
  pd.valor_vencido_neg_com_ativa,
  pd.dt_vencto_ref_mais_recente,
  pd.situacao_ligacao,
  pd.tem_negociacao_vencida,
  c.latest_contact_date,
  c.operator_ids,
  c.contact_count
FROM public.pending_debts pd
LEFT JOIN (
  SELECT 
    ch.uc, 
    ch.cod_pess_fat, 
    max(ch.created_at) AS latest_contact_date, 
    jsonb_agg(DISTINCT ch.operator_id) AS operator_ids, 
    count(*) AS contact_count
  FROM public.contact_history ch
  WHERE ch.is_active = true
  GROUP BY ch.uc, ch.cod_pess_fat
) c ON c.uc = pd.uc AND c.cod_pess_fat = pd.cod_pess_fat;

-- 2. Recria vw_queue_debts apontando para a view anterior
CREATE OR REPLACE VIEW public.vw_queue_debts AS
SELECT 
  vw.*,
  sa.is_strategic,
  sa.is_legal,
  sa.is_cut,
  sa.is_recut,
  sa.is_ferrule
FROM public.vw_pending_debts_with_contacts vw
LEFT JOIN (
  SELECT 
    uc, 
    cod_pess_fat,
    bool_or(queue_type = 'strategic' AND status IN ('pending', 'started')) as is_strategic,
    bool_or(queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) as is_legal,
    bool_or(queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) as is_cut,
    bool_or(queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta')) as is_recut,
    bool_or(queue_type = 'ferrule' AND status IN ('para_abrir_os', 'os_ferrule_aberta')) as is_ferrule
  FROM public.strategic_assignments
  GROUP BY uc, cod_pess_fat
) sa ON sa.uc = vw.uc AND sa.cod_pess_fat = vw.cod_pess_fat;

-- 3. Recria vw_terms_queue_debts
CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
SELECT 
  vw.*,
  COALESCE(t.has_termo, false) as has_termo,
  t.termo_date
FROM public.vw_queue_debts vw
LEFT JOIN (
  SELECT 
    uc, 
    cod_pess_fat, 
    true as has_termo, 
    max(created_at) as termo_date
  FROM public.contact_history
  WHERE status = 'TERMO_ANEXADO' AND is_active = true
  GROUP BY uc, cod_pess_fat
) t ON t.uc = vw.uc AND t.cod_pess_fat = vw.cod_pess_fat;

-- Recria as funções atreladas às views
CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_terms_queue_debts) 
RETURNS numeric LANGUAGE sql IMMUTABLE AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_queue_debts) 
RETURNS numeric LANGUAGE sql IMMUTABLE AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_pending_debts_with_contacts) 
RETURNS numeric LANGUAGE sql IMMUTABLE AS $function$ 
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric; 
$function$;
