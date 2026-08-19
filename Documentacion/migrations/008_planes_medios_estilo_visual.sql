-- 008_planes_medios_estilo_visual.sql
-- El estilo visual (Director o elección manual del usuario) se fija en la
-- primera aprobación de un plan y se reusa en reintentos posteriores (ej. tras
-- un 429 de rate limit a mitad del lote) — evita que un mismo plan termine con
-- piezas de estilos distintos si el selector cambia entre una aprobación y otra.

ALTER TABLE planes_medios ADD COLUMN IF NOT EXISTS estilo_visual jsonb;
