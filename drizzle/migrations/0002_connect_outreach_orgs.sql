CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  feature text NOT NULL CHECK (feature IN ('connect','outreach','organization')),
  status text NOT NULL DEFAULT 'requested', created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature));
GRANT SELECT, INSERT ON public.entitlements TO authenticated; GRANT UPDATE ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ent read" ON public.entitlements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ent request" ON public.entitlements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'requested');
CREATE POLICY "ent admin" ON public.entitlements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.has_feature(_f text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.entitlements WHERE user_id=auth.uid() AND feature=_f AND status='active') OR public.has_role(auth.uid(),'admin') $$;

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, connector text NOT NULL,
  label text, status text NOT NULL DEFAULT 'awaiting_authorization', last_sync_at timestamptz,
  records_contributed integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated; GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connections" ON public.connections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND status IN ('awaiting_authorization','revoked') AND records_contributed = 0);
CREATE POLICY "admin connections" ON public.connections FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  company text, name text NOT NULL, email text, role text, industry text, grp text,
  unsubscribed boolean NOT NULL DEFAULT false, notes text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated; GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.has_feature('outreach'));

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL,
  target_group text, subject text, body text, scheduled_for timestamptz, follow_up_days integer,
  status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated; GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.campaigns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.has_feature('outreach') AND status IN ('draft','scheduled'));

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL, name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid, email text NOT NULL, role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','manager','member')),
  department text, status text NOT NULL DEFAULT 'invited', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(org_id,email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations, public.org_members TO authenticated;
GRANT ALL ON public.organizations, public.org_members TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.org_role(_org uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT CASE WHEN EXISTS(SELECT 1 FROM public.organizations WHERE id=_org AND owner_id=auth.uid()) THEN 'owner'
  ELSE (SELECT role FROM public.org_members WHERE org_id=_org AND user_id=auth.uid() AND status='active' LIMIT 1) END $$;
CREATE POLICY "org read" ON public.organizations FOR SELECT TO authenticated USING (public.org_role(id) IS NOT NULL OR public.has_role(auth.uid(),'admin')
  OR EXISTS(SELECT 1 FROM public.org_members m WHERE m.org_id=id AND m.email=(auth.jwt()->>'email')));
CREATE POLICY "org create" ON public.organizations FOR INSERT TO authenticated WITH CHECK (owner_id=auth.uid() AND public.has_feature('organization'));
CREATE POLICY "org update" ON public.organizations FOR UPDATE TO authenticated USING (public.org_role(id)='owner');
CREATE POLICY "members read" ON public.org_members FOR SELECT TO authenticated USING (public.org_role(org_id) IS NOT NULL OR email=(auth.jwt()->>'email') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "members manage" ON public.org_members FOR INSERT TO authenticated WITH CHECK (public.org_role(org_id) IN ('owner','manager'));
CREATE POLICY "members update" ON public.org_members FOR UPDATE TO authenticated USING (public.org_role(org_id) IN ('owner','manager'));
CREATE POLICY "members delete" ON public.org_members FOR DELETE TO authenticated USING (public.org_role(org_id) IN ('owner','manager'));

CREATE OR REPLACE FUNCTION public.accept_invite(_member uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.org_members SET user_id=auth.uid(), status='active'
  WHERE id=_member AND email=(auth.jwt()->>'email') AND status='invited';
  IF NOT FOUND THEN RAISE EXCEPTION 'invitation not found'; END IF;
END $$;