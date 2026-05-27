DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Seed user (idempotent: skip if email already exists)
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
      NULL, '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, first_name, last_name, is_admin, role)
    VALUES (new_user_id, 'massao.sugama@alje.com.br', 'Massao Sugama', 'Massao', 'Sugama', true, 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.vw_terms_queue_debts AS
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
  pd.qtd_os_total_cancel_devolv,
  pd.ultima_data_criacao_os,
  vw.latest_contact_date,
  vw.operator_ids,
  vw.contact_count,
  EXISTS ( SELECT 1
           FROM strategic_assignments sa
          WHERE ((sa.uc = pd.uc) AND (sa.queue_type = 'strategic'::text) AND (sa.status = ANY (ARRAY['pending'::text, 'started'::text])))) AS is_strategic,
  EXISTS ( SELECT 1
           FROM strategic_assignments sa
          WHERE ((sa.uc = pd.uc) AND (sa.queue_type = 'legal'::text) AND (sa.status = ANY (ARRAY['a_encaminhar'::text, 'encaminhado'::text])))) AS is_legal,
  EXISTS ( SELECT 1
           FROM strategic_assignments sa
          WHERE ((sa.uc = pd.uc) AND (sa.queue_type = 'cut'::text) AND (sa.status = ANY (ARRAY['para_abrir_os'::text, 'os_corte_aberta'::text])))) AS is_cut,
  EXISTS ( SELECT 1
           FROM strategic_assignments sa
          WHERE ((sa.uc = pd.uc) AND (sa.queue_type = 'recut'::text) AND (sa.status = ANY (ARRAY['para_abrir_os'::text, 'os_recorte_aberta'::text])))) AS is_recut,
  EXISTS ( SELECT 1
           FROM strategic_assignments sa
          WHERE ((sa.uc = pd.uc) AND (sa.queue_type = 'ferrule'::text) AND (sa.status = ANY (ARRAY['para_abrir_os'::text, 'os_ferrule_aberta'::text])))) AS is_ferrule,
  EXISTS (
    SELECT 1 
    FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc 
      AND (sa.cod_pess_fat = pd.cod_pess_fat OR sa.cod_pess_fat = pd.uc OR sa.cod_pess_fat IS NULL OR sa.cod_pess_fat = '') 
      AND jsonb_typeof(sa.images) = 'array'
      AND jsonb_array_length(sa.images) > 0
  ) as has_termo,
  (
    SELECT MAX(sa.created_at)
    FROM public.strategic_assignments sa 
    WHERE sa.uc = pd.uc 
      AND (sa.cod_pess_fat = pd.cod_pess_fat OR sa.cod_pess_fat = pd.uc OR sa.cod_pess_fat IS NULL OR sa.cod_pess_fat = '') 
      AND jsonb_typeof(sa.images) = 'array'
      AND jsonb_array_length(sa.images) > 0
  ) as termo_date
FROM public.pending_debts pd
LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat;

CREATE OR REPLACE FUNCTION public.get_daily_readings_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start date;
  v_end date;
BEGIN
  v_start := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  WITH calendar AS (
    SELECT d::date as cal_date
    FROM generate_series(v_start, LEAST(v_end, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  daily_stats AS (
    SELECT 
      to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
      COUNT(dr.id) as total_read
    FROM calendar c
    LEFT JOIN public.daily_readings dr 
      ON (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date = c.cal_date
    GROUP BY c.cal_date
    ORDER BY c.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_stats t;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_readers_by_day(p_month timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start date;
  v_end date;
BEGIN
  v_start := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  WITH calendar AS (
    SELECT d::date as cal_date
    FROM generate_series(v_start, LEAST(v_end, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  daily_readers AS (
    SELECT 
      c.cal_date,
      dr.usuario_id,
      COUNT(dr.id) as total_read
    FROM calendar c
    JOIN public.daily_readings dr 
      ON (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date = c.cal_date
    WHERE dr.usuario_id IS NOT NULL AND dr.usuario_id != ''
    GROUP BY c.cal_date, dr.usuario_id
  ),
  aggregated AS (
    SELECT
      to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
      COALESCE(
        json_agg(json_build_object('usuario_id', dr.usuario_id, 'total_read', dr.total_read)) FILTER (WHERE dr.usuario_id IS NOT NULL),
        '[]'::json
      ) as readers
    FROM calendar c
    LEFT JOIN daily_readers dr ON dr.cal_date = c.cal_date
    GROUP BY c.cal_date
    ORDER BY c.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM aggregated t;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_comparison(p_current_month timestamp with time zone, p_references date[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start date;
  v_end date;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;

  WITH calendar AS (
    SELECT d::date as cal_date
    FROM generate_series(v_start, LEAST(v_end, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.calendar_settings cs
      WHERE cs.date = d::date AND cs.is_working_day = false
    )
  ),
  current_month_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real,
      m.data_leitura_real as cal_date,
      m.working_day_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = v_start
      AND m.data_leitura_real IN (SELECT cal_date FROM calendar)
  ),
  reference_metrics AS (
    SELECT 
      m.uc,
      ROUND(AVG(m.working_day_index)) as avg_ref_index
    FROM public.reading_working_days_metrics m
    INNER JOIN current_month_metrics c ON c.uc = m.uc
    WHERE m.data_referencia = ANY(p_references)
    GROUP BY m.uc
  ),
  comparison AS (
    SELECT 
      c.cal_date,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 'gray'
        WHEN c.working_day_index < r.avg_ref_index THEN 'green'
        WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
        WHEN c.working_day_index > r.avg_ref_index THEN 'red'
      END as status
    FROM current_month_metrics c
    LEFT JOIN reference_metrics r ON r.uc = c.uc
  ),
  daily_counts AS (
    SELECT 
      to_char(cal.cal_date, 'YYYY-MM-DD') as date_label,
      COUNT(comp.*) FILTER (WHERE comp.status = 'green') as green_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'yellow') as yellow_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'red') as red_count,
      COUNT(comp.*) FILTER (WHERE comp.status = 'gray') as gray_count
    FROM calendar cal
    LEFT JOIN comparison comp ON comp.cal_date = cal.cal_date
    GROUP BY cal.cal_date
    ORDER BY cal.cal_date ASC
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;

  RETURN result;
END;
$function$;
