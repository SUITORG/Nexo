-- ============================================================
-- Migración: SuitCotizador - Portal de Cotización en Línea
-- Creado: 2026-07-05
-- Descripción: Tablas para motor de cotizaciones configurables
-- ============================================================

-- 1. Procesos_Cotizacion - Definición de procesos/productos/servicios cotizables
CREATE TABLE IF NOT EXISTS "Procesos_Cotizacion" (
    id TEXT PRIMARY KEY,                    -- PROC-XXX
    id_empresa TEXT NOT NULL,               -- FK a Config_Empresas
    nombre TEXT NOT NULL,                   -- "Diseño Web", "Instalación Solar"
    descripcion TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('producto', 'servicio', 'proceso')),
    config_calculadora JSONB NOT NULL DEFAULT '{}', -- Config de campos y fórmulas
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_procesos_cotizacion_empresa ON "Procesos_Cotizacion"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_procesos_cotizacion_activo ON "Procesos_Cotizacion"(activo) WHERE activo = TRUE;

-- RLS
ALTER TABLE "Procesos_Cotizacion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "procesos_cotizacion_select" ON "Procesos_Cotizacion"
    FOR SELECT USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "procesos_cotizacion_insert" ON "Procesos_Cotizacion"
    FOR INSERT WITH CHECK (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "procesos_cotizacion_update" ON "Procesos_Cotizacion"
    FOR UPDATE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "procesos_cotizacion_delete" ON "Procesos_Cotizacion"
    FOR DELETE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

-- 2. Variables_Cotizacion - Variables dinámicas por proceso
CREATE TABLE IF NOT EXISTS "Variables_Cotizacion" (
    id TEXT PRIMARY KEY,                    -- VAR-XXX
    id_empresa TEXT NOT NULL,
    id_proceso TEXT NOT NULL REFERENCES "Procesos_Cotizacion"(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,                   -- "complejidad", "urgencia", "metros_cuadrados"
    tipo TEXT NOT NULL CHECK (tipo IN ('numero', 'porcentaje', 'select', 'booleano', 'texto')),
    etiqueta TEXT,                          -- Label amigable para UI
    opciones JSONB,                         -- Para select: [{"label":"Alta","value":"alta","multiplicador":1.5}]
    valor_default TEXT,
    obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
    orden INT NOT NULL DEFAULT 0,           -- Orden en formulario
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_variables_proceso ON "Variables_Cotizacion"(id_proceso);
CREATE INDEX IF NOT EXISTS idx_variables_empresa ON "Variables_Cotizacion"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_variables_activo ON "Variables_Cotizacion"(activo) WHERE activo = TRUE;

-- RLS
ALTER TABLE "Variables_Cotizacion" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variables_cotizacion_select" ON "Variables_Cotizacion"
    FOR SELECT USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "variables_cotizacion_insert" ON "Variables_Cotizacion"
    FOR INSERT WITH CHECK (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "variables_cotizacion_update" ON "Variables_Cotizacion"
    FOR UPDATE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "variables_cotizacion_delete" ON "Variables_Cotizacion"
    FOR DELETE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

-- 3. Reglas_Precios - Reglas de precios dinámicas
CREATE TABLE IF NOT EXISTS "Reglas_Precios" (
    id TEXT PRIMARY KEY,                    -- REG-XXX
    id_empresa TEXT NOT NULL,
    id_proceso TEXT NOT NULL REFERENCES "Procesos_Cotizacion"(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,                   -- "Descuento por volumen", "Recargo urgencia"
    condicion JSONB NOT NULL,               -- {"variable": "urgencia", "operador": "=", "valor": "alta"}
    tipo_aplicacion TEXT NOT NULL CHECK (tipo_aplicacion IN ('descuento', 'recargo', 'precio_fijo', 'porcentaje')),
    valor NUMERIC NOT NULL,                 -- Valor del descuento/recargo/precio
    base_calculo TEXT CHECK (base_calculo IN ('subtotal', 'linea', 'total')), -- Base sobre la que aplica
    prioridad INT NOT NULL DEFAULT 0,       -- Orden de evaluación (mayor = primero)
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reglas_proceso ON "Reglas_Precios"(id_proceso);
CREATE INDEX IF NOT EXISTS idx_reglas_empresa ON "Reglas_Precios"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_reglas_activo ON "Reglas_Precios"(activo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_reglas_prioridad ON "Reglas_Precios"(prioridad DESC);

-- RLS
ALTER TABLE "Reglas_Precios" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reglas_precios_select" ON "Reglas_Precios"
    FOR SELECT USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "reglas_precios_insert" ON "Reglas_Precios"
    FOR INSERT WITH CHECK (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "reglas_precios_update" ON "Reglas_Precios"
    FOR UPDATE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "reglas_precios_delete" ON "Reglas_Precios"
    FOR DELETE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

-- 4. Cotizaciones - Cotizaciones principales
CREATE TABLE IF NOT EXISTS "Cotizaciones" (
    id TEXT PRIMARY KEY,                    -- COT-XXX secuencial por empresa
    id_empresa TEXT NOT NULL,
    id_cliente TEXT,                        -- FK a Clientes (opcional)
    id_lead TEXT,                           -- FK a Leads (opcional)
    id_proyecto TEXT,                       -- FK a Proyectos (opcional, si ya convertida)
    id_proceso TEXT NOT NULL REFERENCES "Procesos_Cotizacion"(id),
    folio TEXT NOT NULL,                    -- COT-XXX (legible)
    moneda TEXT NOT NULL DEFAULT 'MXN',
    subtotal NUMERIC NOT NULL DEFAULT 0,
    impuestos NUMERIC NOT NULL DEFAULT 0,
    descuentos NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    estatus TEXT NOT NULL DEFAULT 'borrador' CHECK (estatus IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'convertida', 'vencida')),
    vigencia_dias INT NOT NULL DEFAULT 30,  -- Días de validez
    fecha_vigencia DATE,                    -- Calculada: creado_en + vigencia_dias
    notas TEXT,
    pdf_url TEXT,                           -- Enlace a Google Drive
    drive_file_id TEXT,                     -- ID del archivo en Drive
    variables_aplicadas JSONB NOT NULL DEFAULT '{}', -- Variables usadas en cálculo
    reglas_aplicadas JSONB NOT NULL DEFAULT '[]',    -- Reglas que se aplicaron
    creado_por TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    enviado_en TIMESTAMPTZ,
    aprobado_en TIMESTAMPTZ,
    convertido_en TIMESTAMPTZ,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON "Cotizaciones"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estatus ON "Cotizaciones"(estatus);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON "Cotizaciones"(id_cliente);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_lead ON "Cotizaciones"(id_lead);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_proyecto ON "Cotizaciones"(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_folio ON "Cotizaciones"(folio);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha ON "Cotizaciones"(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_activo ON "Cotizaciones"(activo) WHERE activo = TRUE;

-- RLS
ALTER TABLE "Cotizaciones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_select" ON "Cotizaciones"
    FOR SELECT USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "cotizaciones_insert" ON "Cotizaciones"
    FOR INSERT WITH CHECK (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "cotizaciones_update" ON "Cotizaciones"
    FOR UPDATE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

CREATE POLICY "cotizaciones_delete" ON "Cotizaciones"
    FOR DELETE USING (
        id_empresa = current_setting('app.settings.id_empresa', true)
    );

-- 5. Cotizacion_Detalle - Líneas de cotización
CREATE TABLE IF NOT EXISTS "Cotizacion_Detalle" (
    id BIGSERIAL PRIMARY KEY,
    id_cotizacion TEXT NOT NULL REFERENCES "Cotizaciones"(id) ON DELETE CASCADE,
    id_producto TEXT,                       -- FK a Catalogo (opcional)
    concepto TEXT NOT NULL,                 -- Descripción libre
    cantidad NUMERIC NOT NULL DEFAULT 1,
    precio_unitario NUMERIC NOT NULL DEFAULT 0,
    descuento NUMERIC NOT NULL DEFAULT 0,   -- % o monto fijo según regla
    tipo_descuento TEXT CHECK (tipo_descuento IN ('porcentaje', 'fijo')),
    subtotal NUMERIC NOT NULL DEFAULT 0,
    variables JSONB NOT NULL DEFAULT '{}',  -- Variables específicas de esta línea
    orden INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_detalle_cotizacion ON "Cotizacion_Detalle"(id_cotizacion);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON "Cotizacion_Detalle"(id_producto);
CREATE INDEX IF NOT EXISTS idx_detalle_orden ON "Cotizacion_Detalle"(id_cotizacion, orden);

-- RLS (hereda de Cotizaciones via FK)
ALTER TABLE "Cotizacion_Detalle" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalle_select" ON "Cotizacion_Detalle"
    FOR SELECT USING (
        id_cotizacion IN (
            SELECT id FROM "Cotizaciones"
            WHERE id_empresa = current_setting('app.settings.id_empresa', true)
        )
    );

CREATE POLICY "detalle_insert" ON "Cotizacion_Detalle"
    FOR INSERT WITH CHECK (
        id_cotizacion IN (
            SELECT id FROM "Cotizaciones"
            WHERE id_empresa = current_setting('app.settings.id_empresa', true)
        )
    );

CREATE POLICY "detalle_update" ON "Cotizacion_Detalle"
    FOR UPDATE USING (
        id_cotizacion IN (
            SELECT id FROM "Cotizaciones"
            WHERE id_empresa = current_setting('app.settings.id_empresa', true)
        )
    );

CREATE POLICY "detalle_delete" ON "Cotizacion_Detalle"
    FOR DELETE USING (
        id_cotizacion IN (
            SELECT id FROM "Cotizaciones"
            WHERE id_empresa = current_setting('app.settings.id_empresa', true)
        )
    );

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para generar folio secuencial COT-XXX por empresa
CREATE OR REPLACE FUNCTION generar_folio_cotizacion(p_id_empresa TEXT)
RETURNS TEXT AS $$
DECLARE
    v_ultimo TEXT;
    v_numero INT;
    v_folio TEXT;
BEGIN
    -- Buscar el último folio de esta empresa
    SELECT folio INTO v_ultimo
    FROM "Cotizaciones"
    WHERE id_empresa = p_id_empresa
      AND folio LIKE 'COT-%'
    ORDER BY creado_en DESC
    LIMIT 1;

    IF v_ultimo IS NULL THEN
        v_numero := 1;
    ELSE
        v_numero := (split_part(v_ultimo, '-', 2))::INT + 1;
    END IF;

    v_folio := 'COT-' || lpad(v_numero::TEXT, 3, '0');
    RETURN v_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular cotización completa
CREATE OR REPLACE FUNCTION calcular_cotizacion_completa(
    p_id_empresa TEXT,
    p_id_proceso TEXT,
    p_variables JSONB,
    p_lineas JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_proceso RECORD;
    v_variables RECORD;
    v_reglas RECORD;
    v_subtotal NUMERIC := 0;
    v_impuestos NUMERIC := 0;
    v_descuentos NUMERIC := 0;
    v_total NUMERIC := 0;
    v_reglas_aplicadas JSONB := '[]'::JSONB;
    v_linea JSONB;
    v_precio_base NUMERIC;
    v_factor NUMERIC;
BEGIN
    -- 1. Obtener proceso y validar
    SELECT * INTO v_proceso
    FROM "Procesos_Cotizacion"
    WHERE id = p_id_proceso
      AND id_empresa = p_id_empresa
      AND activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proceso no encontrado o inactivo';
    END IF;

    -- 2. Validar variables obligatorias
    FOR v_variables IN
        SELECT * FROM "Variables_Cotizacion"
        WHERE id_proceso = p_id_proceso
          AND id_empresa = p_id_empresa
          AND activo = TRUE
          AND obligatorio = TRUE
    LOOP
        IF p_variables->>v_variables.nombre IS NULL THEN
            RAISE EXCEPTION 'Variable obligatoria faltante: %', v_variables.nombre;
        END IF;
    END LOOP;

    -- 3. Calcular subtotal base (desde líneas o config_calculadora)
    IF jsonb_array_length(p_lineas) > 0 THEN
        -- Calcular desde líneas proporcionadas
        FOR v_linea IN SELECT * FROM jsonb_array_elements(p_lineas) LOOP
            v_subtotal := v_subtotal + COALESCE((v_linea->>'subtotal')::NUMERIC, 0);
        END LOOP;
    ELSE
        -- Usar precio base de config_calculadora
        v_precio_base := COALESCE((v_proceso.config_calculadora->>'precio_base')::NUMERIC, 0);
        v_subtotal := v_precio_base;
    END IF;

    -- 4. Aplicar reglas de precios en orden de prioridad
    FOR v_reglas IN
        SELECT * FROM "Reglas_Precios"
        WHERE id_proceso = p_id_proceso
          AND id_empresa = p_id_empresa
          AND activo = TRUE
        ORDER BY prioridad DESC
    LOOP
        -- Evaluar condición
        IF evaluar_condicion_regla(v_reglas.condicion, p_variables) THEN
            -- Aplicar regla
            CASE v_reglas.tipo_aplicacion
                WHEN 'descuento' THEN
                    IF v_reglas.base_calculo = 'subtotal' THEN
                        v_descuentos := v_descuentos + (v_subtotal * v_reglas.valor / 100);
                    ELSIF v_reglas.base_calculo = 'total' THEN
                        v_descuentos := v_descuentos + (v_total * v_reglas.valor / 100);
                    ELSE
                        v_descuentos := v_descuentos + v_reglas.valor;
                    END IF;
                WHEN 'recargo' THEN
                    IF v_reglas.base_calculo = 'subtotal' THEN
                        v_total := v_total + (v_subtotal * v_reglas.valor / 100);
                    ELSIF v_reglas.base_calculo = 'total' THEN
                        v_total := v_total + (v_total * v_reglas.valor / 100);
                    ELSE
                        v_total := v_total + v_reglas.valor;
                    END IF;
                WHEN 'porcentaje' THEN
                    v_factor := 1 + (v_reglas.valor / 100);
                    v_subtotal := v_subtotal * v_factor;
                WHEN 'precio_fijo' THEN
                    v_subtotal := v_reglas.valor;
            END CASE;

            v_reglas_aplicadas := v_reglas_aplicadas || jsonb_build_object(
                'id_regla', v_reglas.id,
                'nombre', v_reglas.nombre,
                'tipo', v_reglas.tipo_aplicacion,
                'valor', v_reglas.valor
            );
        END IF;
    END LOOP;

    -- 5. Calcular impuestos (IVA 16% México)
    v_impuestos := (v_subtotal - v_descuentos) * 0.16;

    -- 6. Total final
    v_total := v_subtotal - v_descuentos + v_impuestos;

    RETURN jsonb_build_object(
        'subtotal', v_subtotal,
        'impuestos', v_impuestos,
        'descuentos', v_descuentos,
        'total', v_total,
        'reglas_aplicadas', v_reglas_aplicadas,
        'variables_usadas', p_variables
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para evaluar condiciones
CREATE OR REPLACE FUNCTION evaluar_condicion_regla(p_condicion JSONB, p_variables JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_variable TEXT;
    v_operador TEXT;
    v_valor TEXT;
    v_valor_actual TEXT;
BEGIN
    v_variable := p_condicion->>'variable';
    v_operador := COALESCE(p_condicion->>'operador', '=');
    v_valor := p_condicion->>'valor';
    v_valor_actual := p_variables->>v_variable;

    IF v_valor_actual IS NULL THEN
        RETURN FALSE;
    END IF;

    CASE v_operador
        WHEN '=' THEN RETURN v_valor_actual = v_valor;
        WHEN '!=' THEN RETURN v_valor_actual != v_valor;
        WHEN 'in' THEN RETURN v_valor_actual = ANY(string_to_array(v_valor, ','));
        WHEN 'not_in' THEN RETURN v_valor_actual != ALL(string_to_array(v_valor, ','));
        WHEN '>' THEN RETURN v_valor_actual::NUMERIC > v_valor::NUMERIC;
        WHEN '>=' THEN RETURN v_valor_actual::NUMERIC >= v_valor::NUMERIC;
        WHEN '<' THEN RETURN v_valor_actual::NUMERIC < v_valor::NUMERIC;
        WHEN '<=' THEN RETURN v_valor_actual::NUMERIC <= v_valor::NUMERIC;
        WHEN 'contains' THEN RETURN v_valor_actual ILIKE '%' || v_valor || '%';
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizado_en
CREATE OR REPLACE FUNCTION update_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_procesos_cotizacion_updated
    BEFORE UPDATE ON "Procesos_Cotizacion"
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER trigger_variables_cotizacion_updated
    BEFORE UPDATE ON "Variables_Cotizacion"
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER trigger_reglas_precios_updated
    BEFORE UPDATE ON "Reglas_Precios"
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

CREATE TRIGGER trigger_cotizaciones_updated
    BEFORE UPDATE ON "Cotizaciones"
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en();

-- ============================================================
-- DATOS SEMILLA ESTÁNDARES MÉXICO
-- ============================================================

-- Procesos base para giros comunes en México
-- Estos se insertan automáticamente cuando se habilita un giro
-- Se insertan vía la API al detectar giro_especifico con ',1'

-- Nota: Los procesos específicos por giro se crean dinámicamente
-- desde el panel de admin de SuitCotizador

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE "Procesos_Cotizacion" IS 'Catálogo de procesos/productos/servicios que se pueden cotizar';
COMMENT ON TABLE "Variables_Cotizacion" IS 'Variables dinámicas que afectan el cálculo (complejidad, urgencia, metros, etc.)';
COMMENT ON TABLE "Reglas_Precios" IS 'Reglas de negocio para descuentos, recargos, precios fijos por condiciones';
COMMENT ON TABLE "Cotizaciones" IS 'Cotizaciones generadas con folio, totales y estado';
COMMENT ON TABLE "Cotizacion_Detalle" IS 'Líneas de detalle de cada cotización';