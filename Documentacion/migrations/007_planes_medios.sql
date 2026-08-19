-- 007_planes_medios.sql
-- Pipeline Brief → MediaPlanner → BriefMarker (plan-briefmarker-mediaplanner.md)
-- Dos tablas nuevas jerárquicas: 1 brief → 1 plan → N campañas → N piezas.
-- Mismo patrón de RLS abierto que campanas (ADR-019): herramienta interna de un solo tenant.

CREATE TABLE IF NOT EXISTS planes_medios (
  id text PRIMARY KEY,
  id_empresa text,
  empresa text,
  brief_raw text,
  brief_normalizado jsonb DEFAULT '{}'::jsonb,
  plan_de_medios jsonb DEFAULT '{}'::jsonb,
  estado text DEFAULT 'pendiente_revision',
  total_slots integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS piezas_creativas (
  id text PRIMARY KEY,
  plan_id text REFERENCES planes_medios(id),
  campaign_id text,
  slot_id text,
  format text,
  channel text,
  goal text,
  priority text,
  creative_json jsonb DEFAULT '{}'::jsonb,
  estado text DEFAULT 'generado',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planes_medios ENABLE ROW LEVEL SECURITY;
ALTER TABLE piezas_creativas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='planes_medios' AND policyname='planes_medios_all') THEN
    CREATE POLICY planes_medios_all ON planes_medios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='piezas_creativas' AND policyname='piezas_creativas_all') THEN
    CREATE POLICY piezas_creativas_all ON piezas_creativas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
