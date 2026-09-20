-- 009_gps_address.sql
-- Agregar campos de dirección y GPS a sh_orders

ALTER TABLE sh_orders ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE sh_orders ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE sh_orders ADD COLUMN IF NOT EXISTS gps_lat NUMERIC;
ALTER TABLE sh_orders ADD COLUMN IF NOT EXISTS gps_lng NUMERIC;

COMMENT ON COLUMN sh_orders.street IS 'Calle/Avenida principal del servicio';
COMMENT ON COLUMN sh_orders.number IS 'Número exterior del domicilio';
COMMENT ON COLUMN sh_orders.gps_lat IS 'Latitud GPS ofuscada (radio 150-250m)';
COMMENT ON COLUMN sh_orders.gps_lng IS 'Longitud GPS ofuscada (radio 150-250m)';

CREATE INDEX IF NOT EXISTS idx_sh_orders_gps ON sh_orders(gps_lat, gps_lng);