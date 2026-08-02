-- 006_campanas_fix_schema.sql
-- Repara tabla `campanas`: columnas que el endpoint POST /api/campanas espera
-- (activo, plataforma, modo, contenido, metadata) + contenido_json para el
-- JSON completo del guion. Crea políticas RLS (antes: RLS activo con 0 políticas
-- = deny-all para anon, por eso todo insert fallaba silenciosamente).

ALTER TABLE campanas
  ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS plataforma text DEFAULT '',
  ADD COLUMN IF NOT EXISTS modo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contenido text DEFAULT '',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contenido_json jsonb DEFAULT '{}'::jsonb;

CREATE POLICY campanas_select ON campanas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY campanas_insert ON campanas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY campanas_update ON campanas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
