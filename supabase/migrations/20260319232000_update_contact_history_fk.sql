ALTER TABLE public.contact_history DROP CONSTRAINT IF EXISTS contact_history_operator_id_fkey;

ALTER TABLE public.contact_history
ADD CONSTRAINT contact_history_operator_id_fkey
FOREIGN KEY (operator_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

DROP POLICY IF EXISTS "authenticated_all" ON public.contact_history;
CREATE POLICY "authenticated_all" ON public.contact_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
