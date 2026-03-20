DO $$
BEGIN
    -- 1. Ensure existing cod_pess_fat are not null so we can add NOT NULL constraint
    UPDATE public.pending_debts SET cod_pess_fat = 'UNKNOWN' WHERE cod_pess_fat IS NULL;

    -- 2. Drop existing foreign keys that rely on the current PK
    ALTER TABLE public.contact_history DROP CONSTRAINT IF EXISTS contact_history_uc_fkey;
    ALTER TABLE public.contact_history DROP CONSTRAINT IF EXISTS contact_history_uc_cod_pess_fat_fkey;

    ALTER TABLE public.follow_up_tasks DROP CONSTRAINT IF EXISTS follow_up_tasks_uc_fkey;
    ALTER TABLE public.follow_up_tasks DROP CONSTRAINT IF EXISTS follow_up_tasks_uc_cod_pess_fat_fkey;

    -- 3. Update pending_debts to use composite PK
    ALTER TABLE public.pending_debts DROP CONSTRAINT IF EXISTS pending_debts_pkey CASCADE;
    ALTER TABLE public.pending_debts ALTER COLUMN cod_pess_fat SET NOT NULL;
    ALTER TABLE public.pending_debts ADD CONSTRAINT pending_debts_pkey PRIMARY KEY (uc, cod_pess_fat);

    -- 4. Add cod_pess_fat to referencing tables if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_history' AND column_name='cod_pess_fat') THEN
        ALTER TABLE public.contact_history ADD COLUMN cod_pess_fat TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='follow_up_tasks' AND column_name='cod_pess_fat') THEN
        ALTER TABLE public.follow_up_tasks ADD COLUMN cod_pess_fat TEXT;
    END IF;

    -- 5. Add new composite Foreign Keys
    ALTER TABLE public.contact_history ADD CONSTRAINT contact_history_uc_cod_pess_fat_fkey FOREIGN KEY (uc, cod_pess_fat) REFERENCES public.pending_debts(uc, cod_pess_fat) ON DELETE CASCADE;
    ALTER TABLE public.follow_up_tasks ADD CONSTRAINT follow_up_tasks_uc_cod_pess_fat_fkey FOREIGN KEY (uc, cod_pess_fat) REFERENCES public.pending_debts(uc, cod_pess_fat) ON DELETE CASCADE;

END $$;

-- 6. Ensure RLS policies remain functional
DROP POLICY IF EXISTS "authenticated_all" ON public.pending_debts;
CREATE POLICY "authenticated_all" ON public.pending_debts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.contact_history;
CREATE POLICY "authenticated_all" ON public.contact_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all" ON public.follow_up_tasks;
CREATE POLICY "authenticated_all" ON public.follow_up_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
