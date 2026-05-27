CREATE OR REPLACE FUNCTION public.get_reading_rhythm_ruler(p_current_month timestamp with time zone, p_references text[] DEFAULT '{}'::text[])
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_max_working_days_global INT;
  v_current_month_start DATE;
  v_current_working_day INT;
  result json;
  v_refs DATE[];
BEGIN
  v_current_month_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
  
  IF p_references IS NOT NULL THEN
    SELECT array_agg(d::date) INTO v_refs FROM unnest(p_references) d;
  ELSE
    v_refs := '{}'::date[];
  END IF;

  -- Calculate the global max working days from history
  SELECT MAX(working_day_index) INTO v_max_working_days_global
  FROM public.reading_working_days_metrics;

  -- Fallback to current month if no data
  IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
    SELECT COUNT(*) INTO v_max_working_days_global
    FROM public.calendar_settings
    WHERE date >= v_current_month_start
      AND date < (v_current_month_start + interval '1 month')::date
      AND is_working_day = true;
      
    IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
      v_max_working_days_global := 23;
    END IF;
  END IF;

  IF date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date = v_current_month_start THEN
    SELECT COUNT(*) INTO v_current_working_day
    FROM public.calendar_settings
    WHERE date >= v_current_month_start 
      AND date <= (now() AT TIME ZONE 'America/Sao_Paulo')::date
      AND is_working_day = true;
  ELSE
    v_current_working_day := NULL;
  END IF;

  WITH days AS (
    SELECT generate_series(1, v_max_working_days_global) as idx
  ),
  all_months AS (
    SELECT v_current_month_start as month_date, true as is_current
    UNION ALL
    SELECT unnest(v_refs) as month_date, false as is_current
  ),
  monthly_daily AS (
    SELECT 
      data_referencia,
      working_day_index,
      COUNT(uc) as cnt
    FROM public.reading_working_days_metrics
    WHERE data_referencia IN (SELECT month_date FROM all_months)
    GROUP BY data_referencia, working_day_index
  ),
  monthly_acc AS (
    SELECT
      am.month_date,
      am.is_current,
      d.idx,
      COALESCE(md.cnt, 0) as daily_cnt,
      SUM(COALESCE(md.cnt, 0)) OVER (PARTITION BY am.month_date ORDER BY d.idx) as curr_acc
    FROM all_months am
    CROSS JOIN days d
    LEFT JOIN monthly_daily md ON md.data_referencia = am.month_date AND md.working_day_index = d.idx
  ),
  ref_avg AS (
    SELECT
      idx,
      AVG(curr_acc) as ref_acc
    FROM monthly_acc
    WHERE is_current = false
    GROUP BY idx
  ),
  monthly_json AS (
    SELECT 
      m.month_date,
      m.is_current,
      to_char(m.month_date, 'MM/YYYY') as month_label,
      json_agg(
        json_build_object(
          'index', m.idx,
          'daily', m.daily_cnt,
          'accumulated', m.curr_acc,
          'ref_acc', r.ref_acc
        ) ORDER BY m.idx
      ) as blocks
    FROM monthly_acc m
    LEFT JOIN ref_avg r ON r.idx = m.idx AND m.is_current = true
    GROUP BY m.month_date, m.is_current
  )
  SELECT json_build_object(
    'max_working_days', v_max_working_days_global,
    'current_working_day', v_current_working_day,
    'rulers', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'month', month_label,
          'is_current', is_current,
          'month_date', month_date,
          'blocks', blocks
        ) ORDER BY is_current DESC, month_date DESC
      ), '[]'::json)
      FROM monthly_json
    )
  ) INTO result;

  RETURN result;
END;
$function$;
