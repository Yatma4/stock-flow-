
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text NOT NULL,
  device_info text NOT NULL,
  browser text NOT NULL,
  os text NOT NULL,
  session_token text NOT NULL UNIQUE,
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to active_sessions"
  ON public.active_sessions FOR ALL
  USING (true)
  WITH CHECK (true);
