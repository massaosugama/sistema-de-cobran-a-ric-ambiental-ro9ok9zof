-- Enable real-time for profiles table to support live online/offline status
DO $$
DECLARE
  pub_exists boolean;
  table_in_pub boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') INTO pub_exists;
  
  IF pub_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
    ) INTO table_in_pub;
    
    IF NOT table_in_pub THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE profiles;
  END IF;
END
$$;
