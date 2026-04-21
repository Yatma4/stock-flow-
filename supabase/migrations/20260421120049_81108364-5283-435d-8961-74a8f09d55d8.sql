-- Ensure all app tables are part of supabase_realtime publication and have REPLICA IDENTITY FULL
-- so INSERT/UPDATE/DELETE events are streamed reliably to all connected clients.

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'financial_entries',
    'products',
    'categories',
    'sales',
    'sale_items',
    'quotes',
    'quote_items',
    'active_sessions'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    -- REPLICA IDENTITY FULL
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    -- Add to publication if not already
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Also ensure app_users and app_settings have REPLICA IDENTITY FULL (in case prior migration didn't set it)
ALTER TABLE public.app_users REPLICA IDENTITY FULL;
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;