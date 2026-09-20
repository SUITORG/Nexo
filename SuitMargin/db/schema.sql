-- SuitMargin SaaS - Database Schema
-- Multi-tenant: business_id en todas las tablas
-- Extiende sh_technicians/sh_orders de SuitServiHogar

CREATE TABLE IF NOT EXISTS sm_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  service_area TEXT,
  currency TEXT DEFAULT 'MXN',
  labor_cost_per_hour NUMERIC DEFAULT 50,
  target_margin_pct NUMERIC DEFAULT 30,
  minimum_job_price NUMERIC DEFAULT 500,
  travel_fee NUMERIC DEFAULT 100,
  tax_pct NUMERIC DEFAULT 16,
  overhead_pct NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES sm_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES sm_businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES sm_customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  address TEXT,
  preferred_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','estimating','quote_sent','viewed','accepted',
    'declined','scheduled','in_progress','completed','cancelled'
  )),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sm_jobs(id) ON DELETE CASCADE,
  labor_hours NUMERIC,
  labor_cost NUMERIC,
  materials_cost NUMERIC,
  material_markup_pct NUMERIC DEFAULT 20,
  travel_cost NUMERIC,
  equipment_cost NUMERIC,
  overhead_cost NUMERIC,
  tax_cost NUMERIC,
  total_estimated_cost NUMERIC,
  minimum_price NUMERIC,
  recommended_price NUMERIC,
  premium_price NUMERIC,
  estimated_profit NUMERIC,
  estimated_margin_pct NUMERIC,
  breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES sm_estimates(id) ON DELETE CASCADE,
  public_id TEXT UNIQUE NOT NULL,
  scope_of_work TEXT,
  included_materials TEXT[],
  exclusions TEXT[],
  price NUMERIC,
  timeline_days INTEGER,
  terms TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','viewed','accepted','declined','expired')),
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sm_jobs(id) ON DELETE CASCADE,
  actual_hours NUMERIC,
  actual_material_cost NUMERIC,
  actual_additional_expenses NUMERIC,
  final_revenue NUMERIC,
  actual_cost NUMERIC,
  actual_profit NUMERIC,
  actual_margin_pct NUMERIC,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sm_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES sm_businesses(id) ON DELETE CASCADE,
  insight_type TEXT CHECK (insight_type IN ('margin_warning','labor_underestimate','category_performance','pricing_recommendation')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  confidence_pct INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE sm_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sm_ai_insights ENABLE ROW LEVEL SECURITY;

-- Business owner policies
CREATE POLICY "business_owner_all" ON sm_businesses FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "business_customers_all" ON sm_customers FOR ALL USING (EXISTS (SELECT 1 FROM sm_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "business_jobs_all" ON sm_jobs FOR ALL USING (EXISTS (SELECT 1 FROM sm_businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "business_estimates_all" ON sm_estimates FOR ALL USING (EXISTS (SELECT 1 FROM sm_jobs j JOIN sm_businesses b ON b.id = j.business_id WHERE j.id = job_id AND b.owner_id = auth.uid()));
CREATE POLICY "business_quotes_all" ON sm_quotes FOR ALL USING (EXISTS (SELECT 1 FROM sm_estimates e JOIN sm_jobs j ON j.id = e.job_id JOIN sm_businesses b ON b.id = j.business_id WHERE e.id = estimate_id AND b.owner_id = auth.uid()));
CREATE POLICY "business_results_all" ON sm_job_results FOR ALL USING (EXISTS (SELECT 1 FROM sm_jobs j JOIN sm_businesses b ON b.id = j.business_id WHERE j.id = job_id AND b.owner_id = auth.uid()));
CREATE POLICY "business_insights_all" ON sm_ai_insights FOR ALL USING (business_id IN (SELECT id FROM sm_businesses WHERE owner_id = auth.uid()));

-- Public quote access
CREATE POLICY "public_quote_read" ON sm_quotes FOR SELECT USING (true);