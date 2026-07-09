-- ============================================================================
-- SUITORG - MIGRACION MODULO DE CITAS (v1.0.0)
-- Extiende Reservaciones + crea clientes + lista_espera
-- Multi-tenant por id_empresa
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENDER TABLA Reservaciones
-- ----------------------------------------------------------------------------
ALTER TABLE public."Reservaciones"
  ADD COLUMN IF NOT EXISTS id_cliente TEXT,
  ADD COLUMN IF NOT EXISTS duracion_min INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS google_event_id TEXT,
  ADD COLUMN IF NOT EXISTS nota TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- 2. TABLA clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id_cliente TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa_tel ON public.clientes(id_empresa, telefono);

-- ----------------------------------------------------------------------------
-- 3. TABLA lista_espera
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lista_espera (
  id SERIAL PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cliente TEXT NOT NULL,
  servicio TEXT,
  nota TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lista_espera_empresa ON public.lista_espera(id_empresa, activo);
