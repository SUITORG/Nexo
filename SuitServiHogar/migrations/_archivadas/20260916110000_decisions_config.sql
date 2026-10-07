-- 20260916110000_decisions_config.sql
-- Agregar charity_fee_pct a sh_config (falta de la migración anterior)

INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'charity_fee_pct',
  '1'::jsonb,
  'Porcentaje de comisión destinado a caridad (Fundación Hogar Digno AC)',
  'decisions'
)
ON CONFLICT (key) DO NOTHING;
