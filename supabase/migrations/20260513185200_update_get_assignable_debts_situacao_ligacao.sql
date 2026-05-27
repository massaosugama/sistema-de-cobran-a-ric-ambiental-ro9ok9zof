-- Drop previous versions to avoid ambiguity
DROP FUNCTION IF EXISTS public.get_assignable_debts(numeric, numeric, text[], text, text, text, text);
DROP FUNCTION IF EXISTS public.get_assignable_debts(numeric, numeric, text[], text, text, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_assignable_debts(numeric, numeric, text[], text, text, text, text, text, integer, integer);

-- Recreate views to ensure situacao_ligacao is correctly exposed
DROP VIEW IF EXISTS public.vw_queue_debts CASCADE;
DROP VIEW IF EXISTS public.vw_pending_debts_with_contacts CASCADE;

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
  pd.dt_vencto_ref_mais_recente,
  pd.situacao_ligacao,
  (SELECT MAX(created_at) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat AND ch.is_active = true) as latest_contact_date,
  (SELECT jsonb_agg(operator_id) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat AND ch.is_active = true) as operator_ids,
  (SELECT count(*) FROM public.contact_history ch WHERE ch.uc = pd.uc AND ch.cod_pess_fat = pd.cod_pess_fat AND ch.is_active = true) as contact_count
FROM public.pending_debts pd
WHERE pd.is_active = true;

CREATE OR REPLACE VIEW public.vw_queue_debts AS
SELECT v.*,
  EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) as is_strategic,
  EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado')) as is_legal,
  EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'cut' AND sa.status IN ('para_abrir_os', 'os_corte_aberta')) as is_cut,
  EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'recut' AND sa.status IN ('para_abrir_os', 'os_recorte_aberta')) as is_recut,
  EXISTS(SELECT 1 FROM public.strategic_assignments sa WHERE sa.uc = v.uc AND sa.cod_pess_fat = v.cod_pess_fat AND sa.queue_type = 'ferrule' AND sa.status IN ('para_abrir_os', 'os_ferrule_aberta')) as is_ferrule
FROM public.vw_pending_debts_with_contacts v;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_queue_debts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
$function$;

CREATE OR REPLACE FUNCTION public.uc_numeric(vw public.vw_pending_debts_with_contacts)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
$function$;

-- Update get_assignable_debts
CREATE OR REPLACE FUNCTION public.get_assignable_debts(
    p_min_value numeric DEFAULT NULL::numeric, 
    p_max_value numeric DEFAULT NULL::numeric, 
    p_periods text[] DEFAULT NULL::text[], 
    p_search_text text DEFAULT NULL::text, 
    p_search_address text DEFAULT NULL::text, 
    p_lotes text DEFAULT 'com_ligacoes'::text, 
    p_retidas text DEFAULT 'sem_retidas'::text,
    p_situacao_ligacao text DEFAULT 'todos'::text,
    p_limit integer DEFAULT 500, 
    p_offset integer DEFAULT 0
)
 RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, valor_total numeric, valor_vencido numeric, qt_fats integer, refs text, latest_contact_date timestamp with time zone)
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
    vw.latest_contact_date
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
