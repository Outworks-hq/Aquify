CREATE TYPE public.app_role AS ENUM ('admin','business','individual');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  account_type text NOT NULL DEFAULT 'individual',
  company_name text, company_website text, industry text,
  points_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- prevent users editing their own balance/type
CREATE OR REPLACE FUNCTION public.protect_profile_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.points_balance := OLD.points_balance;
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_profile BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger" ON public.points_ledger FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.contributions TO authenticated;
GRANT UPDATE ON public.contributions TO authenticated;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin" ON public.contributions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "insert own pending" ON public.contributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND points_awarded = 0);
CREATE POLICY "admin review" ON public.contributions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- admin approves: award points atomically
CREATE OR REPLACE FUNCTION public.review_contribution(_id uuid, _approve boolean, _points integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.contributions;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT * INTO c FROM public.contributions WHERE id = _id FOR UPDATE;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;
  IF _approve THEN
    UPDATE public.contributions SET status='approved', points_awarded=GREATEST(_points,0) WHERE id=_id;
    INSERT INTO public.points_ledger(user_id,amount,reason) VALUES (c.user_id, GREATEST(_points,0), 'Contribution approved: '||c.title);
    UPDATE public.profiles SET points_balance = points_balance + GREATEST(_points,0) WHERE id = c.user_id;
  ELSE
    UPDATE public.contributions SET status='rejected' WHERE id=_id;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.review_contribution(uuid,boolean,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text := COALESCE(NEW.raw_user_meta_data->>'account_type','individual');
BEGIN
  IF t NOT IN ('individual','business') THEN t := 'individual'; END IF;
  INSERT INTO public.profiles(id, full_name, account_type, company_name, company_website, industry, points_balance)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', t, NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'company_website', NEW.raw_user_meta_data->>'industry', 100);
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, t::public.app_role);
  INSERT INTO public.points_ledger(user_id, amount, reason) VALUES (NEW.id, 100, 'Introductory data points');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();