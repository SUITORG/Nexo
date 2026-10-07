-- 20260916110000_decisions_config.sql
-- Semillas de categoría decisions en sh_config
-- Consolidado desde migrations/ → fuente canónica supabase/migrations/ (2026-10-07)
-- Idempotente (ON CONFLICT DO NOTHING)

INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'charity_fee_pct',
  '1'::jsonb,
  'Porcentaje de comisión destinado a caridad (Fundación Hogar Digno AC)',
  'decisions'
)
ON CONFLICT (key) DO NOTHING;

-- Flag de impuestos (incluido desde migrations/APLICAR_EN_SUPABASE.sql para no
-- perderlo al archivar el agregado): false = oculto en pantallas de cliente,
-- true = visible; editable desde Admin → Configuración
INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'show_tax_info',
  'false'::jsonb,
  'Mostrar info fiscal (SAT/ISR/IVA/CFDI) en pantallas de cliente. Editable desde Admin → Configuración',
  'decisions'
)
ON CONFLICT (key) DO NOTHING;
