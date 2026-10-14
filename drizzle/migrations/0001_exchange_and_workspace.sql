CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, category text NOT NULL, region text NOT NULL,
  records integer NOT NULL DEFAULT 0, points integer NOT NULL DEFAULT 0,
  description text, fields text[] NOT NULL DEFAULT '{}',
  sample jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.datasets TO anon, authenticated;
GRANT ALL ON public.datasets TO service_role;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "datasets public read" ON public.datasets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "datasets admin write" ON public.datasets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.datasets TO authenticated;

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, name text NOT NULL, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own collections" ON public.collections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.acquisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, dataset_id uuid NOT NULL REFERENCES public.datasets(id),
  points_spent integer NOT NULL DEFAULT 0,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}', notes text, status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dataset_id)
);
GRANT SELECT, UPDATE ON public.acquisitions TO authenticated;
GRANT ALL ON public.acquisitions TO service_role;
ALTER TABLE public.acquisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own acquisitions read" ON public.acquisitions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own acquisitions update" ON public.acquisitions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_acquisition_fields() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.points_spent := OLD.points_spent; NEW.dataset_id := OLD.dataset_id; NEW.user_id := OLD.user_id;
  END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_acquisition BEFORE UPDATE ON public.acquisitions FOR EACH ROW EXECUTE FUNCTION public.protect_acquisition_fields();

CREATE OR REPLACE FUNCTION public.acquire_dataset(_dataset_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.datasets; bal integer; new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sign in required'; END IF;
  SELECT * INTO d FROM public.datasets WHERE id = _dataset_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'dataset not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.acquisitions WHERE user_id = auth.uid() AND dataset_id = _dataset_id) THEN RAISE EXCEPTION 'already acquired'; END IF;
  SELECT points_balance INTO bal FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF bal < d.points THEN RAISE EXCEPTION 'not enough data points'; END IF;
  UPDATE public.profiles SET points_balance = points_balance - d.points WHERE id = auth.uid();
  INSERT INTO public.points_ledger(user_id, amount, reason) VALUES (auth.uid(), -d.points, 'Acquired: '||d.name);
  INSERT INTO public.acquisitions(user_id, dataset_id, points_spent) VALUES (auth.uid(), _dataset_id, d.points) RETURNING id INTO new_id;
  RETURN new_id;
END $$;

INSERT INTO public.datasets(name,category,region,records,points,description,fields,sample) VALUES
('US Manufacturing Firms — Ops Contacts','Business Data','North America',18400,420,'Operations leaders at verified US manufacturers, with company size and sector.','{company,contact_role,state,employees,sector}','[{"company":"Midwest Forge Co.","contact_role":"VP Operations","state":"OH","employees":320,"sector":"Metals"},{"company":"Pacific Plastics","contact_role":"Plant Manager","state":"CA","employees":140,"sector":"Plastics"},{"company":"Carolina Textiles","contact_role":"COO","state":"NC","employees":510,"sector":"Textiles"}]'),
('EU Retail Consumer Spend Panel','Consumer Insights','Europe',92000,860,'Monthly anonymised spend by category across 9 EU markets.','{country,month,category,avg_spend_eur}','[{"country":"DE","month":"2026-08","category":"Grocery","avg_spend_eur":412},{"country":"FR","month":"2026-08","category":"Apparel","avg_spend_eur":96},{"country":"ES","month":"2026-08","category":"Dining","avg_spend_eur":143}]'),
('SaaS Pricing Benchmarks 2026','Market Intelligence','Global',3100,310,'List prices and packaging for 3,100 B2B SaaS products.','{product,segment,tier,monthly_usd}','[{"product":"Flowdesk","segment":"Support","tier":"Pro","monthly_usd":49},{"product":"Ledgerly","segment":"Finance","tier":"Team","monthly_usd":79},{"product":"Shipyard","segment":"DevOps","tier":"Business","monthly_usd":199}]'),
('Logistics Carriers Directory','Business Data','North America',7600,240,'Licensed freight carriers with fleet size and lanes.','{carrier,hq_state,fleet_size,primary_lane}','[{"carrier":"Ridgeline Freight","hq_state":"TX","fleet_size":84,"primary_lane":"TX-CA"},{"carrier":"Northstar Haul","hq_state":"MN","fleet_size":36,"primary_lane":"MN-IL"}]'),
('Healthcare Clinic Locations','Business Data','United Kingdom',12900,380,'Private and NHS-partnered clinic locations with specialties.','{clinic,city,specialty,partner}','[{"clinic":"Harbourside Clinic","city":"Bristol","specialty":"Physio","partner":"NHS"},{"clinic":"Kensington Derm","city":"London","specialty":"Dermatology","partner":"Private"}]'),
('Restaurant Foot-Traffic Trends','Consumer Insights','North America',45000,540,'Weekly visit indices for 45,000 restaurant locations.','{venue_type,metro,week,visit_index}','[{"venue_type":"Fast casual","metro":"Chicago","week":"2026-W38","visit_index":112},{"venue_type":"Fine dining","metro":"Austin","week":"2026-W38","visit_index":94}]'),
('Renewable Energy Project Pipeline','Market Intelligence','Global',2200,690,'Planned and under-construction solar, wind and storage projects.','{project,country,technology,capacity_mw,stage}','[{"project":"Atacama Sun II","country":"CL","technology":"Solar","capacity_mw":480,"stage":"Construction"},{"project":"Dogger Bank D","country":"UK","technology":"Offshore wind","capacity_mw":1320,"stage":"Permitting"}]');