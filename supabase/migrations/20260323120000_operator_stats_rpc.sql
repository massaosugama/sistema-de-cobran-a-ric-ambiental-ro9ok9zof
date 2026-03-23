CREATE OR REPLACE FUNCTION public.get_operator_stats()
RETURNS TABLE (
    operator_id uuid,
    total_contacts bigint,
    today_contacts bigint,
    total_followups bigint,
    today_followups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as operator_id,
        (SELECT count(*) FROM public.contact_history ch WHERE ch.operator_id = p.id) as total_contacts,
        (SELECT count(*) FROM public.contact_history ch WHERE ch.operator_id = p.id AND date(ch.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo')) as today_contacts,
        (SELECT count(*) FROM public.follow_up_tasks ft WHERE ft.operator_id = p.id) as total_followups,
        (SELECT count(*) FROM public.follow_up_tasks ft WHERE ft.operator_id = p.id AND date(ft.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo')) as today_followups
    FROM public.profiles p;
END;
$$;
