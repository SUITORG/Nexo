-- 005_pattern_interrupts.sql
-- Catálogo de Pattern Interrupts (detonantes de atención) para la escena 1 del
-- guion VIDE. Escrito por nicho, con 'GENERAL' como fallback ampliamente aplicable
-- (no se inventaron interrupts falsos "específicos" de nicho sin dato real del
-- usuario — se sembró un catálogo general de 5, ampliable por nicho después).
-- Aplicado directo vía Supabase MCP el 2026-07-31; este archivo es la copia documental.

CREATE TABLE IF NOT EXISTS video_pattern_interrupts (
  id SERIAL PRIMARY KEY,
  nicho TEXT NOT NULL DEFAULT 'GENERAL',
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('visual', 'sonoro', 'texto')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_pattern_interrupts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_pattern_interrupts_select ON video_pattern_interrupts;
CREATE POLICY video_pattern_interrupts_select ON video_pattern_interrupts
  FOR SELECT USING (true);

INSERT INTO video_pattern_interrupts (nicho, descripcion, tipo) VALUES
  ('GENERAL', 'Movimiento físico brusco hacia la cámara en el primer segundo', 'visual'),
  ('GENERAL', 'Efecto de sonido discordante (whoosh o glitch) al iniciar', 'sonoro'),
  ('GENERAL', 'Afirmación contraintuitiva en pantalla que contradice una creencia popular', 'texto'),
  ('GENERAL', 'Corte abrupto a primer plano extremo (extreme close-up) sin transición', 'visual'),
  ('GENERAL', 'Silencio repentino de medio segundo seguido de golpe de bajo (bass drop)', 'sonoro');
