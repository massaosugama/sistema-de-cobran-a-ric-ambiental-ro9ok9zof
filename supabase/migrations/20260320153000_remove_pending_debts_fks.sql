DO $$
BEGIN
    -- Remove the foreign key constraints to allow deleting from pending_debts 
    -- without deleting the associated contact_history and follow_up_tasks (Option B),
    -- keeping the uc and cod_pess_fat values intact in the child tables.

    ALTER TABLE public.contact_history DROP CONSTRAINT IF EXISTS contact_history_uc_cod_pess_fat_fkey;
    ALTER TABLE public.follow_up_tasks DROP CONSTRAINT IF EXISTS follow_up_tasks_uc_cod_pess_fat_fkey;

    -- Also remove the legacy single-column constraints just in case they are still present
    ALTER TABLE public.contact_history DROP CONSTRAINT IF EXISTS contact_history_uc_fkey;
    ALTER TABLE public.follow_up_tasks DROP CONSTRAINT IF EXISTS follow_up_tasks_uc_fkey;
END $$;
