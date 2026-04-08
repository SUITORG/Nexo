-- ============================================================
-- 🔧 SUITORG - CREAR TABLAS FALTANTES v16.3.8
-- Tablas: Config_IA_Notebooks + Empresa_Galeria + Proyectos_Materiales
-- Proyecto: egyxgnlnzanxpqyuvmsg.supabase.co
-- Script IDEMPOTENTE: seguro para re-ejecutar cuantas veces sea necesario.
-- ============================================================


-- ─────────────────────────────────────────────
-- TABLA 1: Config_IA_Notebooks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."Config_IA_Notebooks" (
    id                  BIGSERIAL PRIMARY KEY,
    id_empresa          TEXT        NOT NULL,
    notebook_id         TEXT        NOT NULL UNIQUE,
    nombre_conocimiento TEXT,
    enabled             BOOLEAN     DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public."Config_IA_Notebooks" ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas (tabla YA existe en este punto)
DROP POLICY IF EXISTS "Leer notebooks propios"         ON public."Config_IA_Notebooks";
DROP POLICY IF EXISTS "Solo backend inserta notebooks"  ON public."Config_IA_Notebooks";

CREATE POLICY "Leer notebooks propios"
    ON public."Config_IA_Notebooks" FOR SELECT USING (true);

CREATE POLICY "Solo backend inserta notebooks"
    ON public."Config_IA_Notebooks" FOR INSERT WITH CHECK (true);


-- ─────────────────────────────────────────────
-- TABLA 2: Empresa_Galeria
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."Empresa_Galeria" (
    id          BIGSERIAL PRIMARY KEY,
    id_empresa  TEXT        NOT NULL,
    url_imagen  TEXT        NOT NULL,
    titulo      TEXT,
    descripcion TEXT,
    orden       INTEGER     DEFAULT 0,
    activo      BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public."Empresa_Galeria" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer galeria propia"          ON public."Empresa_Galeria";
DROP POLICY IF EXISTS "Solo backend inserta galeria"  ON public."Empresa_Galeria";

CREATE POLICY "Leer galeria propia"
    ON public."Empresa_Galeria" FOR SELECT USING (true);

CREATE POLICY "Solo backend inserta galeria"
    ON public."Empresa_Galeria" FOR INSERT WITH CHECK (true);


-- ─────────────────────────────────────────────
-- TABLA 3: Proyectos_Materiales
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."Proyectos_Materiales" (
    id              BIGSERIAL PRIMARY KEY,
    id_material     TEXT        NOT NULL,
    id_proyecto     TEXT        NOT NULL,
    id_empresa      TEXT        NOT NULL,
    nombre          TEXT        NOT NULL,
    descripcion     TEXT,
    cantidad        NUMERIC     DEFAULT 1,
    unidad          TEXT        DEFAULT 'pza',
    costo_unitario  NUMERIC     DEFAULT 0,
    costo_total     NUMERIC     GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
    proveedor       TEXT,
    estatus         TEXT        DEFAULT 'PENDIENTE',
    fecha_compra    DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public."Proyectos_Materiales" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leer materiales propios"           ON public."Proyectos_Materiales";
DROP POLICY IF EXISTS "Solo backend inserta materiales"   ON public."Proyectos_Materiales";
DROP POLICY IF EXISTS "Solo backend actualiza materiales" ON public."Proyectos_Materiales";

CREATE POLICY "Leer materiales propios"
    ON public."Proyectos_Materiales" FOR SELECT USING (true);

CREATE POLICY "Solo backend inserta materiales"
    ON public."Proyectos_Materiales" FOR INSERT WITH CHECK (true);

CREATE POLICY "Solo backend actualiza materiales"
    ON public."Proyectos_Materiales" FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_mat_empresa   ON public."Proyectos_Materiales" (id_empresa);
CREATE INDEX IF NOT EXISTS idx_mat_proyecto  ON public."Proyectos_Materiales" (id_proyecto);


-- ─────────────────────────────────────────────
-- SEEDS INICIALES
-- ─────────────────────────────────────────────
INSERT INTO public."Config_IA_Notebooks" (id_empresa, notebook_id, nombre_conocimiento, enabled)
VALUES
    ('PFM',   'NB-PFM-GEN-01',    'Menú y Catálogo PFM',          TRUE),
    ('PAPER', 'NB-PAPER-L73-01',  'Manual Operativo Ley 73',       TRUE),
    ('EVASOL','NB-EVASOL-GEN-01', 'Catálogo Técnico Solar EVASOL', TRUE)
ON CONFLICT (notebook_id) DO NOTHING;

INSERT INTO public."Empresa_Galeria" (id_empresa, url_imagen, titulo, orden, activo)
VALUES
    ('PFM', '', 'Imagen Principal PFM', 1, TRUE)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────
-- ✅ VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────
SELECT 'Config_IA_Notebooks'    AS tabla, COUNT(*) AS registros FROM public."Config_IA_Notebooks"
UNION ALL
SELECT 'Empresa_Galeria',        COUNT(*) FROM public."Empresa_Galeria"
UNION ALL
SELECT 'Proyectos_Materiales',   COUNT(*) FROM public."Proyectos_Materiales";
