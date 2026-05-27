DO $$
BEGIN
  ALTER TABLE public.pending_debts ADD COLUMN IF NOT EXISTS tem_negociacao_vencida boolean DEFAULT false;
END $$;

DROP FUNCTION IF EXISTS public.uc_numeric(vw_queue_debts);
DROP FUNCTION IF EXISTS public.uc_numeric(vw_pending_debts_with_contacts);

DROP VIEW IF EXISTS public.vw_queue_debts CASCADE;
DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts CASCADE;

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
    pd.dt_vencto_ref_mais_recente,
    pd.situacao_ligacao,
    pd.tem_negociacao_vencida,
    latest_contact.latest_contact_date,
    latest_contact.operator_ids,
    latest_contact.contact_count
   FROM public.pending_debts pd
     LEFT JOIN ( SELECT ch.uc,
            ch.cod_pess_fat,
            max(ch.created_at) AS latest_contact_date,
            jsonb_agg(DISTINCT ch.operator_id) AS operator_ids,
            count(ch.id) AS contact_count
           FROM public.contact_history ch
          WHERE ch.is_active = true
          GROUP BY ch.uc, ch.cod_pess_fat) latest_contact ON pd.uc = latest_contact.uc AND pd.cod_pess_fat = latest_contact.cod_pess_fat;

CREATE OR REPLACE VIEW public.vw_queue_debts AS
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
    pd.dt_vencto_ref_mais_recente,
    pd.situacao_ligacao,
    pd.tem_negociacao_vencida,
    latest_contact.latest_contact_date,
    latest_contact.operator_ids,
    latest_contact.contact_count,
    sa.is_strategic,
    sa.is_legal,
    sa.is_cut,
    sa.is_recut,
    sa.is_ferrule
   FROM public.pending_debts pd
     LEFT JOIN ( SELECT ch.uc,
            ch.cod_pess_fat,
            max(ch.created_at) AS latest_contact_date,
            jsonb_agg(DISTINCT ch.operator_id) AS operator_ids,
            count(ch.id) AS contact_count
           FROM public.contact_history ch
          WHERE ch.is_active = true
          GROUP BY ch.uc, ch.cod_pess_fat) latest_contact ON pd.uc = latest_contact.uc AND pd.cod_pess_fat = latest_contact.cod_pess_fat
     LEFT JOIN ( SELECT strategic_assignments.uc,
            strategic_assignments.cod_pess_fat,
            bool_or(strategic_assignments.queue_type = 'strategic'::text AND (strategic_assignments.status = ANY (ARRAY['pending'::text, 'started'::text]))) AS is_strategic,
            bool_or(strategic_assignments.queue_type = 'legal'::text AND (strategic_assignments.status = ANY (ARRAY['a_encaminhar'::text, 'encaminhado'::text]))) AS is_legal,
            bool_or(strategic_assignments.queue_type = 'cut'::text AND (strategic_assignments.status = ANY (ARRAY['para_abrir_os'::text, 'os_corte_aberta'::text]))) AS is_cut,
            bool_or(strategic_assignments.queue_type = 'recut'::text AND (strategic_assignments.status = ANY (ARRAY['para_abrir_os'::text, 'os_recorte_aberta'::text]))) AS is_recut,
            bool_or(strategic_assignments.queue_type = 'ferrule'::text AND (strategic_assignments.status = ANY (ARRAY['para_abrir_os'::text, 'os_ferrule_aberta'::text]))) AS is_ferrule
           FROM public.strategic_assignments
          GROUP BY strategic_assignments.uc, strategic_assignments.cod_pess_fat) sa ON pd.uc = sa.uc AND pd.cod_pess_fat = sa.cod_pess_fat;

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

DROP FUNCTION IF EXISTS public.get_assignable_debts;

CREATE OR REPLACE FUNCTION public.get_assignable_debts(p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_periods text[] DEFAULT NULL::text[], p_search_text text DEFAULT NULL::text, p_search_address text DEFAULT NULL::text, p_lotes text DEFAULT 'com_ligacoes'::text, p_retidas text DEFAULT 'sem_retidas'::text, p_situacao_ligacao text DEFAULT 'todos'::text, p_limit integer DEFAULT 500, p_offset integer DEFAULT 0)
 RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, valor_total numeric, valor_vencido numeric, qt_fats integer, refs text, latest_contact_date timestamp with time zone, tem_negociacao_vencida boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pd.uc, 
    pd.cod_pess_fat, 
    pd.pessoa_fatura_nome, 
    pd.valor_total, 
    pd.valor_vencido, 
    pd.qt_fats, 
    pd.refs,
    vw.latest_contact_date,
    pd.tem_negociacao_vencida
  FROM public.pending_debts pd
  LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat
  WHERE pd.is_active = true
    AND (p_min_value IS NULL OR pd.valor_vencido >= p_min_value)
    AND (p_max_value IS NULL OR pd.valor_vencido <= p_max_value)
    AND (
      p_periods IS NULL 
      OR array_length(p_periods, 1) IS NULL 
      OR EXISTS (
        SELECT 1 FROM unnest(p_periods) per 
        WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
      )
    )
    AND (
      p_search_text IS NULL 
      OR p_search_text = ''
      OR pd.uc ILIKE '%' || p_search_text || '%'
      OR pd.pessoa_fatura_nome ILIKE '%' || p_search_text || '%'
      OR pd.pessoa_fatura_cpf_cnpj ILIKE '%' || p_search_text || '%'
    )
    AND (
      p_search_address IS NULL 
      OR p_search_address = ''
      OR pd.endereco ILIKE '%' || p_search_address || '%'
    )
    AND (
      p_lotes = 'ambos'
      OR (p_lotes = 'com_ligacoes' AND COALESCE(pd.setor, '') != '4036')
      OR (p_lotes = 'so_lotes' AND COALESCE(pd.setor, '') = '4036')
    )
    AND (
      p_retidas = 'ambos'
      OR (p_retidas = 'com_retidas' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0)
      OR (p_retidas = 'sem_retidas' AND COALESCE(pd.valor_retidas_em_aberto, 0) = 0)
    )
    AND (
      p_situacao_ligacao = 'todos'
      OR (p_situacao_ligacao = 'susp_deb' AND pd.situacao_ligacao = 'SUSP_DEB')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.strategic_assignments sa 
      WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat 
      AND (
        (sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) OR
        (sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado')) OR
        (sa.queue_type = 'cut' AND sa.status IN ('para_abrir_os', 'os_corte_aberta')) OR
        (sa.queue_type = 'recut' AND sa.status IN ('para_abrir_os', 'os_recorte_aberta'))
      )
    )
  ORDER BY pd.valor_vencido DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
