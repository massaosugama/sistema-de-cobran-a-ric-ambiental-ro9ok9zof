DO $BODY$
BEGIN
  -- Fix the foreign key so we can join `quote_clicks` with `profiles` 
  -- instead of `auth.users`, allowing the frontend to fetch user data for engagements.
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quote_clicks_user_id_fkey'
    AND table_name = 'quote_clicks'
  ) THEN
    ALTER TABLE public.quote_clicks DROP CONSTRAINT quote_clicks_user_id_fkey;
  END IF;

  ALTER TABLE public.quote_clicks
    ADD CONSTRAINT quote_clicks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $BODY$;
