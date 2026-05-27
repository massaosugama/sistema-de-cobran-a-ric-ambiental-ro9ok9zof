DO $$
BEGIN
  -- Cria índice em data_referencia para otimizar filtros diretos por mês de referência
  -- que estavam forçando scan pesado no banco de dados e gerando timeout.
  CREATE INDEX IF NOT EXISTS reading_working_days_metrics_data_ref_idx 
    ON public.reading_working_days_metrics USING btree (data_referencia);
END $$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_comparison(p_current_month timestamp with time zone, p_references date[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result json;
  v_start date;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;

  WITH current_month_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real,
      to_char(m.data_leitura_real, 'YYYY-MM-DD') as date_label,
      m.working_day_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = v_start
  ),
  reference_metrics AS (
    SELECT 
      m.uc,
      ROUND(AVG(m.working_day_index)) as avg_ref_index
    FROM public.reading_working_days_metrics m
    -- Otimização: Restringe o cálculo da média APENAS às UCs que constam no mês atual.
    -- Evita calcular milhares de médias desnecessárias.
    INNER JOIN current_month_metrics c ON c.uc = m.uc
    WHERE m.data_referencia = ANY(p_references)
    GROUP BY m.uc
  ),
  comparison AS (
    SELECT 
      c.date_label,
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
      date_label,
      COUNT(*) FILTER (WHERE status = 'green') as green_count,
      COUNT(*) FILTER (WHERE status = 'yellow') as yellow_count,
      COUNT(*) FILTER (WHERE status = 'red') as red_count,
      COUNT(*) FILTER (WHERE status = 'gray') as gray_count
    FROM comparison
    GROUP BY date_label
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_reading_rhythm_day_details(
  p_current_month timestamp with time zone,
  p_date_label text,
  p_references date[]
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start date;
  v_month_minus_1 date;
  v_month_minus_2 date;
  v_month_minus_3 date;
  v_month_minus_4 date;
  v_month_minus_5 date;
  v_month_minus_6 date;
  result json;
BEGIN
  v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
  v_month_minus_1 := (v_start - interval '1 month')::date;
  v_month_minus_2 := (v_start - interval '2 months')::date;
  v_month_minus_3 := (v_start - interval '3 months')::date;
  v_month_minus_4 := (v_start - interval '4 months')::date;
  v_month_minus_5 := (v_start - interval '5 months')::date;
  v_month_minus_6 := (v_start - interval '6 months')::date;

  WITH current_day_metrics AS (
    SELECT 
      m.uc,
      m.data_leitura_real,
      m.working_day_index
    FROM public.reading_working_days_metrics m
    WHERE m.data_referencia = v_start
      -- Otimização: Uso de cast para habilitar verificação direta por índice
      AND m.data_leitura_real = p_date_label::date
  ),
  reference_metrics AS (
    SELECT 
      m.uc,
      ROUND(AVG(m.working_day_index)) as avg_ref_index
    FROM public.reading_working_days_metrics m
    -- Otimização: Restringe o cálculo APENAS às UCs específicas deste dia selecionado
    INNER JOIN current_day_metrics c ON c.uc = m.uc
    WHERE m.data_referencia = ANY(p_references)
    GROUP BY m.uc
  ),
  history_metrics AS (
    SELECT 
      m.uc,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_1) as m1,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_2) as m2,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_3) as m3,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_4) as m4,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_5) as m5,
      MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_6) as m6
    FROM public.reading_working_days_metrics m
    -- Otimização: Restringe a busca histórica APENAS às UCs deste dia
    INNER JOIN current_day_metrics c ON c.uc = m.uc
    WHERE m.data_referencia >= v_month_minus_6
      AND m.data_referencia <= v_month_minus_1
    GROUP BY m.uc
  ),
  comparison AS (
    SELECT 
      c.uc,
      c.data_leitura_real,
      c.working_day_index,
      r.avg_ref_index,
      h.m1, h.m2, h.m3, h.m4, h.m5, h.m6,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 'gray'
        WHEN c.working_day_index < r.avg_ref_index THEN 'green'
        WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
        WHEN c.working_day_index > r.avg_ref_index THEN 'red'
      END as status,
      CASE 
        WHEN r.avg_ref_index IS NULL THEN 1
        WHEN c.working_day_index > r.avg_ref_index THEN 2
        WHEN c.working_day_index = r.avg_ref_index THEN 3
        WHEN c.working_day_index < r.avg_ref_index THEN 4
      END as order_weight
    FROM current_day_metrics c
    LEFT JOIN reference_metrics r ON r.uc = c.uc
    LEFT JOIN history_metrics h ON h.uc = c.uc
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result
  FROM (
    SELECT * FROM comparison
    ORDER BY order_weight ASC, uc ASC
  ) t;

  RETURN result;
END;
$function$;
