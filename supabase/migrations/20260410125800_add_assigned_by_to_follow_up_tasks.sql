ALTER TABLE public.follow_up_tasks ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS follow_up_tasks_assigned_by_idx ON public.follow_up_tasks USING btree (assigned_by);
