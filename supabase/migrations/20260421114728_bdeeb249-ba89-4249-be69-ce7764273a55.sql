
CREATE TABLE IF NOT EXISTS public.app_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  access_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_users"
  ON public.app_users FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_users (id, name, email, role, access_code)
VALUES
  ('1', 'Administrateur', 'admin@stock.com', 'admin', '1234'),
  ('2', 'Employé 1', 'employe1@stock.com', 'employee', '5678'),
  ('3', 'Assistant', 'assistant@stock.com', 'assistant', '9012')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_settings"
  ON public.app_settings FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
