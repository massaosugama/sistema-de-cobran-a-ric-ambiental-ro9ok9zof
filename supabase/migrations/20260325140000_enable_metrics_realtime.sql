-- Enable real-time for contact_history and follow_up_tasks to support live dashboard updates
DO $$
DECLARE
  pub_exists boolean;
  table_in_pub boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') INTO pub_exists;
  
  IF pub_exists THEN
    -- Check and add contact_history
    SELECT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'contact_history'
    ) INTO table_in_pub;
    
    IF NOT table_in_pub THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE contact_history;
    END IF;

    -- Check and add follow_up_tasks
    SELECT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'follow_up_tasks'
    ) INTO table_in_pub;
    
    IF NOT table_in_pub THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE follow_up_tasks;
    END IF;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE contact_history, follow_up_tasks;
  END IF;
END
$$;
