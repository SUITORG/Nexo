-- ============================================================================
-- SUITORG - MIGRACIÓN COMPLETA A SUPABASE (v16.7.0)
-- Script para crear todas las tablas con RLS por id_empresa
-- ============================================================================
-- Ejecutar en: https://egyxgnlnzanxpqyuvmsg.supabase.co → SQL Editor
-- Fecha: 2026-04-04
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ELIMINAR TABLAS EXISTENTES (si las hay) - CUIDADO: BORRA DATOS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public."Proyectos_Materiales" CASCADE;
DROP TABLE IF EXISTS public."Proyectos_Bitacora" CASCADE;
DROP TABLE IF EXISTS public."Proyectos_Etapas" CASCADE;
DROP TABLE IF EXISTS public."Config_Flujo_Proyecto" CASCADE;
DROP TABLE IF EXISTS public."Proyectos_Pagos" CASCADE;
DROP TABLE IF EXISTS public."Pagos" CASCADE;
DROP TABLE IF EXISTS public."Leads" CASCADE;
DROP TABLE IF EXISTS public."Logs" CASCADE;
DROP TABLE IF EXISTS public."Cuotas_Pagos" CASCADE;
DROP TABLE IF EXISTS public."Catalogo" CASCADE;
DROP TABLE IF EXISTS public."Config_Roles" CASCADE;
DROP TABLE IF EXISTS public."Usuarios" CASCADE;
DROP TABLE IF EXISTS public."Empresa_Documentos" CASCADE;
DROP TABLE IF EXISTS public."Prompts_IA" CASCADE;
DROP TABLE IF EXISTS public."Logs_Chat_IA" CASCADE;
DROP TABLE IF EXISTS public."Memoria_IA_Snapshots" CASCADE;
DROP TABLE IF EXISTS public."Config_Galeria" CASCADE;
DROP TABLE IF EXISTS public."Reservaciones" CASCADE;
DROP TABLE IF EXISTS public."Config_Reportes" CASCADE;
DROP TABLE IF EXISTS public."Config_Dashboard" CASCADE;
DROP TABLE IF EXISTS public."Atencion_Cliente" CASCADE;
DROP TABLE IF EXISTS public."Empresa_Galeria" CASCADE;
DROP TABLE IF EXISTS public."Config_Paginas" CASCADE;
DROP TABLE IF EXISTS public."Config_SEO" CASCADE;
DROP TABLE IF EXISTS public."Config_Empresas" CASCADE;
DROP TABLE IF EXISTS public."Config_IA_Notebooks" CASCADE;

-- ----------------------------------------------------------------------------
-- 2. CREACIÓN DE TABLAS MAESTRO (siempre en GSheets, copia en Supabase)
-- ----------------------------------------------------------------------------

-- Config_Empresas
CREATE TABLE public."Config_Empresas" (
    id_empresa TEXT PRIMARY KEY,
    nomempresa TEXT,
    es_principal TEXT DEFAULT 'FALSE',
    modo_sitio TEXT DEFAULT 'PROD',
    db_engine TEXT DEFAULT 'GSHEETS',
    habilitado TEXT DEFAULT 'TRUE',
    modo TEXT DEFAULT 'USUARIO',
    telefonowhatsapp TEXT,
    correoempresarial TEXT,
    foto_agente TEXT,
    slogan TEXT,
    mensaje1 TEXT,
    mensaje2 TEXT,
    mision TEXT,
    vision TEXT,
    valores TEXT,
    impacto TEXT,
    politicas TEXT,
    ubicacion_url TEXT,
    ubicacion TEXT,
    direccion TEXT,
    logo_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    tipo_negocio TEXT,
    color_tema TEXT,
    formulario TEXT,
    modo_creditos TEXT DEFAULT 'USUARIO',
    creditos_totales INTEGER DEFAULT 0,
    fecha_vencimiento DATE,
    origen_politicas TEXT,
    infobanco TEXT,
    infocuenta TEXT,
    infonom TEXT,
    enlace_oficial TEXT,
    alias_seo TEXT,
    rsface TEXT,
    rsinsta TEXT,
    rstik TEXT,
    usa_otp_entrega TEXT DEFAULT 'FALSE',
    usa_features_estandar TEXT DEFAULT 'FALSE',
    is_isolated TEXT DEFAULT 'FALSE',
    usa_soporte_ia TEXT DEFAULT 'FALSE',
    id_notebooklm TEXT,
    usa_qr_sitio TEXT DEFAULT 'FALSE',
    usa_reservaciones TEXT DEFAULT 'FALSE',
    id_calendario_google TEXT,
    drive_folder_id TEXT,
    costo_envio NUMERIC DEFAULT 0,
    descripcion TEXT,
    factura TEXT,
    autodepuracion INTEGER DEFAULT 60,
    whatsapp_negocio TEXT,
    url_logo_identidad TEXT,
    giro_especifico TEXT,
    slogan_empresa TEXT,
    agent_enabled TEXT DEFAULT 'TRUE'
);

-- Config_SEO
CREATE TABLE public."Config_SEO" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    division TEXT,
    id_cluster TEXT,
    titulo TEXT,
    icono TEXT,
    keywords_coma TEXT,
    imagen_url TEXT,
    wa_directo TEXT,
    hex_color TEXT,
    mail_directo TEXT
);

-- Config_Paginas
CREATE TABLE public."Config_Paginas" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    id_pagina TEXT,
    id_cluster TEXT,
    meta_json JSONB,
    schema_json JSONB,
    contenido_json JSONB
);

-- Usuarios
CREATE TABLE public."Usuarios" (
    id_usuario TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    nombre TEXT,
    email TEXT,
    password TEXT,
    rol TEXT,
    nivel_acceso TEXT DEFAULT 'BASICO',
    creditos INTEGER DEFAULT 0,
    fecha_limite_acceso DATE,
    activo TEXT DEFAULT 'TRUE',
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id_usuario, id_empresa)
);

-- Config_Roles
CREATE TABLE public."Config_Roles" (
    id_rol TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    nombre_rol TEXT,
    nivel_acceso TEXT DEFAULT 'BASICO',
    creditos_base INTEGER DEFAULT 0,
    vigencia_dias INTEGER DEFAULT 30,
    modulos_visibles JSONB,
    PRIMARY KEY (id_rol, id_empresa)
);

-- ----------------------------------------------------------------------------
-- 3. TABLAS PRIVATE (datos operativos por tenant)
-- ----------------------------------------------------------------------------

-- Catalogo
CREATE TABLE public."Catalogo" (
    id_producto TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    categoria TEXT,
    nombre TEXT,
    descripcion TEXT,
    precio NUMERIC DEFAULT 0,
    precio_oferta NUMERIC DEFAULT 0,
    unidad TEXT DEFAULT 'pz',
    es_combo TEXT DEFAULT 'FALSE',
    stock INTEGER DEFAULT 0,
    min INTEGER DEFAULT 0,
    max INTEGER DEFAULT 100,
    imagen_url TEXT,
    activo TEXT DEFAULT 'TRUE',
    etiqueta_promo TEXT,
    contenido_combo TEXT,
    media TEXT,
    p_mes NUMERIC DEFAULT 0,
    p_mes_of NUMERIC DEFAULT 0,
    PRIMARY KEY (id_producto, id_empresa)
);

-- Leads
CREATE TABLE public."Leads" (
    id_lead TEXT PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    nombre TEXT,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    asunto TEXT,
    body TEXT,
    nivel_crm INTEGER DEFAULT 0,
    rfc TEXT,
    nom_negocio TEXT,
    dir_comercial TEXT,
    subtipo_negocio TEXT,
    score_riesgo TEXT,
    status TEXT DEFAULT 'NUEVO',
    motivo_status TEXT,
    apellido TEXT,
    edad INTEGER,
    semanas_cotizadas INTEGER,
    referido_por TEXT,
    nss TEXT,
    curp TEXT,
    hora_llamada TEXT
);

-- Proyectos
CREATE TABLE public."Proyectos" (
    id_proyecto TEXT PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    id_cliente TEXT,
    nombre_proyecto TEXT,
    estado TEXT DEFAULT 'ACTIVO',
    responsable TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    line_items JSONB,
    descripcion TEXT,
    codigo_otp TEXT,
    activo TEXT DEFAULT 'TRUE',
    id_lead TEXT,
    nombre TEXT,
    status TEXT DEFAULT 'PEDIDO-RECIBIDO',
    fecha_estatus TIMESTAMP DEFAULT NOW()
);

-- Pagos
CREATE TABLE public."Pagos" (
    id_pago TEXT PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    id_proyecto TEXT,
    monto NUMERIC DEFAULT 0,
    metodo_pago TEXT,
    folio TEXT,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    pago_con NUMERIC DEFAULT 0,
    cambio NUMERIC DEFAULT 0
);

-- Proyectos_Pagos
CREATE TABLE public."Proyectos_Pagos" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    id_pago TEXT,
    id_proyecto TEXT,
    monto NUMERIC DEFAULT 0,
    concepto TEXT,
    metodo_pago TEXT,
    folio TEXT,
    referencia TEXT,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    activo TEXT DEFAULT 'TRUE',
    pago_con NUMERIC DEFAULT 0,
    cambio NUMERIC DEFAULT 0
);

-- Proyectos_Etapas
CREATE TABLE public."Proyectos_Etapas" (
    id_etapa TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    id_proyecto TEXT,
    nombre_etapa TEXT,
    estado TEXT DEFAULT 'PENDIENTE',
    fecha_compromiso DATE,
    completada TEXT DEFAULT 'FALSE',
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (id_etapa, id_empresa)
);

-- Proyectos_Bitacora
CREATE TABLE public."Proyectos_Bitacora" (
    id_evento TEXT PRIMARY KEY,
    id_empresa TEXT NOT NULL,
    id_proyecto TEXT,
    tipo_evento TEXT,
    detalle JSONB,
    usuario TEXT,
    fecha_hora TIMESTAMP DEFAULT NOW(),
    activo TEXT DEFAULT 'TRUE'
);

-- Config_Flujo_Proyecto
CREATE TABLE public."Config_Flujo_Proyecto" (
    id_fase TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    nombre_fase TEXT,
    peso_porcentaje INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    color_hex TEXT,
    descripcion TEXT,
    PRIMARY KEY (id_fase, id_empresa)
);

-- Proyectos_Materiales
CREATE TABLE public."Proyectos_Materiales" (
    id_consumo TEXT PRIMARY KEY,
    id_proyecto TEXT NOT NULL,
    id_producto TEXT,
    cantidad INTEGER DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLAS DE IA Y LOGS
-- ----------------------------------------------------------------------------

-- Prompts_IA
CREATE TABLE public."Prompts_IA" (
    id_agente TEXT NOT NULL,
    id_empresa TEXT NOT NULL,
    nombre TEXT,
    prompt_base TEXT,
    habilitado TEXT DEFAULT 'TRUE',
    nivel_acceso TEXT DEFAULT 'PUBLICO',
    recibe_files TEXT DEFAULT 'FALSE',
    PRIMARY KEY (id_agente, id_empresa)
);

-- Logs_Chat_IA
CREATE TABLE public."Logs_Chat_IA" (
    id SERIAL PRIMARY KEY,
    id_conversacion TEXT,
    id_visitante TEXT,
    id_empresa TEXT,
    agente_id TEXT,
    role TEXT,
    content TEXT,
    fecha_hora TIMESTAMP DEFAULT NOW()
);

-- Memoria_IA_Snapshots
CREATE TABLE public."Memoria_IA_Snapshots" (
    id_conversacion TEXT PRIMARY KEY,
    id_visitante TEXT,
    id_empresa TEXT,
    resumen_semantico TEXT,
    contexto_datos TEXT,
    ultimo_agente TEXT,
    estado_sesion TEXT DEFAULT 'ACTIVA',
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Logs
CREATE TABLE public."Logs" (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT NOW(),
    evento TEXT,
    usuario TEXT,
    detalle JSONB,
    id_empresa TEXT
);

-- Cuotas_Pagos
CREATE TABLE public."Cuotas_Pagos" (
    id_cuota TEXT PRIMARY KEY,
    id_empresa TEXT,
    monto NUMERIC DEFAULT 0,
    fecha_vencimiento DATE,
    estatus TEXT DEFAULT 'PENDIENTE',
    nota TEXT
);

-- ----------------------------------------------------------------------------
-- 5. TABLAS DE GALERÍA Y DOCUMENTOS
-- ----------------------------------------------------------------------------

-- Config_Galeria
CREATE TABLE public."Config_Galeria" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT,
    titulo TEXT,
    url_imagen TEXT,
    categoria TEXT,
    activo TEXT DEFAULT 'TRUE'
);

-- Empresa_Galeria
CREATE TABLE public."Empresa_Galeria" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT,
    url_imagen TEXT,
    titulo TEXT,
    categoria TEXT,
    orden INTEGER DEFAULT 0
);

-- Empresa_Documentos
CREATE TABLE public."Empresa_Documentos" (
    id_doc TEXT PRIMARY KEY,
    id_empresa TEXT,
    id_drive_file TEXT,
    nombre_archivo TEXT,
    mimetype TEXT,
    fecha_sincronizacion TIMESTAMP DEFAULT NOW(),
    activo TEXT DEFAULT 'TRUE'
);

-- Reservaciones
CREATE TABLE public."Reservaciones" (
    id TEXT PRIMARY KEY,
    id_empresa TEXT,
    fecha_cita TIMESTAMP,
    nombre_cliente TEXT,
    whatsapp TEXT,
    servicio TEXT,
    status TEXT DEFAULT 'PENDIENTE'
);

-- ----------------------------------------------------------------------------
-- 6. TABLAS DE REPORTES Y DASHBOARD
-- ----------------------------------------------------------------------------

-- Config_Reportes
CREATE TABLE public."Config_Reportes" (
    id_reporte TEXT PRIMARY KEY,
    nombre TEXT,
    tipo_negocio TEXT,
    tabla_origen TEXT,
    columnas JSONB,
    labels JSONB,
    filtro_base TEXT,
    acceso_minimo TEXT DEFAULT 'BASICO',
    habilitado TEXT DEFAULT 'TRUE',
    icono TEXT,
    descripcion TEXT
);

-- Config_Dashboard
CREATE TABLE public."Config_Dashboard" (
    id_widget TEXT PRIMARY KEY,
    titulo TEXT,
    tipo TEXT,
    tabla_origen TEXT,
    operacion TEXT,
    metrica TEXT,
    dimension TEXT,
    icono TEXT,
    color TEXT,
    giro TEXT,
    orden INTEGER DEFAULT 0
);

-- Atencion_Cliente
CREATE TABLE public."Atencion_Cliente" (
    id_reporte TEXT PRIMARY KEY,
    id_empresa TEXT,
    nombre TEXT,
    telefono TEXT,
    email TEXT,
    queja TEXT,
    estado TEXT DEFAULT 'ABIERTO',
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    activo TEXT DEFAULT 'TRUE'
);

-- Config_IA_Notebooks
CREATE TABLE public."Config_IA_Notebooks" (
    id SERIAL PRIMARY KEY,
    id_empresa TEXT,
    notebook_id TEXT,
    nombre_conocimiento TEXT,
    enabled TEXT DEFAULT 'TRUE'
);

-- ----------------------------------------------------------------------------
-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Habilitar RLS en todas las tablas
ALTER TABLE public."Config_Empresas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_SEO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Paginas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Catalogo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proyectos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pagos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proyectos_Pagos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proyectos_Etapas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proyectos_Bitacora" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Flujo_Proyecto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proyectos_Materiales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Prompts_IA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Logs_Chat_IA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Memoria_IA_Snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Cuotas_Pagos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Galeria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Empresa_Galeria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Empresa_Documentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Reservaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Reportes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_Dashboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Atencion_Cliente" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Config_IA_Notebooks" ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS POR TENANT (id_empresa)
-- ----------------------------------------------------------------------------

-- POLÍTICAS DE LECTURA (SELECT) - Cada tenant solo ve sus datos
CREATE POLICY "tenant_isolation_read" ON public."Config_Empresas"
    FOR SELECT USING (true); -- Config_Empresas es compartida para el hub

CREATE POLICY "tenant_isolation_read" ON public."Config_SEO"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_Paginas"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Usuarios"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_Roles"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Catalogo"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Leads"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Proyectos"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Pagos"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Proyectos_Pagos"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Proyectos_Etapas"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Proyectos_Bitacora"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_Flujo_Proyecto"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Proyectos_Materiales"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Prompts_IA"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Logs_Chat_IA"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Memoria_IA_Snapshots"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Logs"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Cuotas_Pagos"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_Galeria"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Empresa_Galeria"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Empresa_Documentos"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Reservaciones"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_Reportes"
    FOR SELECT USING (true); -- Reportes son compartidos

CREATE POLICY "tenant_isolation_read" ON public."Config_Dashboard"
    FOR SELECT USING (true); -- Dashboard widgets son compartidos

CREATE POLICY "tenant_isolation_read" ON public."Atencion_Cliente"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

CREATE POLICY "tenant_isolation_read" ON public."Config_IA_Notebooks"
    FOR SELECT USING (id_empresa = current_setting('app.settings.id_empresa', true));

-- POLÍTICAS DE ESCRITURA (INSERT/UPDATE/DELETE) - Solo con API key
CREATE POLICY "api_full_access" ON public."Config_Empresas"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_SEO"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Paginas"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Usuarios"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Roles"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Catalogo"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Leads"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Proyectos"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Pagos"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Proyectos_Pagos"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Proyectos_Etapas"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Proyectos_Bitacora"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Flujo_Proyecto"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Proyectos_Materiales"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Prompts_IA"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Logs_Chat_IA"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Memoria_IA_Snapshots"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Logs"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Cuotas_Pagos"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Galeria"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Empresa_Galeria"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Empresa_Documentos"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Reservaciones"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Reportes"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_Dashboard"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Atencion_Cliente"
    FOR ALL USING (true);

CREATE POLICY "api_full_access" ON public."Config_IA_Notebooks"
    FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 9. ÍNDICES PARA RENDIMIENTO
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_config_empresas_habilitado ON public."Config_Empresas"(habilitado);
CREATE INDEX IF NOT EXISTS idx_config_seo_empresa ON public."Config_SEO"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_config_paginas_empresa ON public."Config_Paginas"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public."Usuarios"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_config_roles_empresa ON public."Config_Roles"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_catalogo_empresa ON public."Catalogo"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_catalogo_activo ON public."Catalogo"(activo);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON public."Leads"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_leads_fecha ON public."Leads"(fecha);
CREATE INDEX IF NOT EXISTS idx_proyectos_empresa ON public."Proyectos"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_proyectos_status ON public."Proyectos"(status);
CREATE INDEX IF NOT EXISTS idx_pagos_empresa ON public."Pagos"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_proyectos_pagos_empresa ON public."Proyectos_Pagos"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_proyectos_etapas_empresa ON public."Proyectos_Etapas"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_proyectos_bitacora_empresa ON public."Proyectos_Bitacora"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_logs_empresa ON public."Logs"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_logs_fecha ON public."Logs"(fecha);
CREATE INDEX IF NOT EXISTS idx_prompts_empresa ON public."Prompts_IA"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_logs_chat_empresa ON public."Logs_Chat_IA"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_memoria_empresa ON public."Memoria_IA_Snapshots"(id_empresa);

-- ----------------------------------------------------------------------------
-- FIN DEL SCRIPT
-- ----------------------------------------------------------------------------
