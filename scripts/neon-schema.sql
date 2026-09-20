-- ============================================================
-- SuitOrg — Neon Postgres Schema
-- Migrated from Supabase (egyxgnlnzanxpqyuvmsg)
-- Multi-tenant via id_empresa | Soft delete via activo
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CORE / SHARED TABLES
-- ============================================================

CREATE TABLE Lead (
  id_lead TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  empresa TEXT,
  giro TEXT,
  ciudad TEXT,
  nota TEXT,
  fuente TEXT,
  status TEXT DEFAULT 'NUEVO',
  assignee TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Clientes (
  id_cliente TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  rfc TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Negocios (
  id_negocio TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  email TEXT,
  website TEXT,
  rubro TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. COTIZACIONES
-- ============================================================

CREATE TABLE Cuenta (
  id_cuenta TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  rfc TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  codigo_postal TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Contacto (
  id_contacto TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cuenta TEXT,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  cargo TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Proyecto (
  id_proyecto TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cuenta TEXT,
  id_contacto TEXT,
  nombre TEXT,
  descripcion TEXT,
  status TEXT DEFAULT 'PENDIENTE',
  prioridad TEXT DEFAULT 'NORMAL',
  fecha_inicio DATE,
  fecha_fin DATE,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Material (
  id_material TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  unidad TEXT,
  precio_unitario NUMERIC(12,2),
  categoria TEXT,
  proveedor TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Servicio (
  id_servicio TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  unidad TEXT,
  precio_unitario NUMERIC(12,2),
  categoria TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ManoDeObra (
  id_mano_obra TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  unidad TEXT,
  precio_unitario NUMERIC(12,2),
  especialidad TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Concepto (
  id_concepto TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cotizacion TEXT,
  tipo TEXT,
  id_referencia TEXT,
  descripcion TEXT,
  cantidad NUMERIC(10,2),
  precio_unitario NUMERIC(12,2),
  total NUMERIC(12,2),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Plantilla (
  id_plantilla TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  contenido JSONB,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. PEDIDO EXPRESS / POS / VENTAS
-- ============================================================

CREATE TABLE NegocioPDV (
  id_negocio TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Terminal (
  id_terminal TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_negocio TEXT,
  nombre TEXT,
  uuid TEXT,
  status TEXT DEFAULT 'ACTIVA',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Turno (
  id_turno TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_terminal TEXT,
  id_usuario TEXT,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  monto_inicial NUMERIC(12,2),
  monto_final NUMERIC(12,2),
  status TEXT DEFAULT 'ABIERTO',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Orden (
  id_orden TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_negocio TEXT,
  id_terminal TEXT,
  id_cliente TEXT,
  id_cajero TEXT,
  tipo TEXT DEFAULT 'TAKE_AWAY',
  status TEXT DEFAULT 'PENDIENTE',
  total NUMERIC(12,2),
  subtotal NUMERIC(12,2),
  impuestos NUMERIC(12,2),
  descuento NUMERIC(12,2),
  propina NUMERIC(12,2),
  metodo_pago TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE OrdenItem (
  id_item TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_orden TEXT,
  id_producto TEXT,
  cantidad NUMERIC(10,2),
  precio_unitario NUMERIC(12,2),
  total NUMERIC(12,2),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Pago (
  id_pago TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_orden TEXT,
  metodo TEXT,
  monto NUMERIC(12,2),
  referencia TEXT,
  status TEXT DEFAULT 'COMPLETADO',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. PRODUCTOS / INVENTARIOS / BODEGA
-- ============================================================

CREATE TABLE Producto (
  id_producto TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  sku TEXT,
  codigo_barras TEXT,
  categoria TEXT,
  precio_compra NUMERIC(12,2),
  precio_venta NUMERIC(12,2),
  stock_minimo NUMERIC(10,2) DEFAULT 0,
  unidad TEXT DEFAULT 'pza',
  imagen_url TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Inventario (
  id_inventario TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_producto TEXT,
  id_bodega TEXT,
  cantidad NUMERIC(10,2) DEFAULT 0,
  ubicacion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE Bodega (
  id_bodega TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  direccion TEXT,
  ciudad TEXT,
  capacidad NUMERIC(10,2),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE MovimientoInventario (
  id_movimiento TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_producto TEXT,
  id_bodega_origen TEXT,
  id_bodega_destino TEXT,
  tipo TEXT,
  cantidad NUMERIC(10,2),
  referencia TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. RESERVACIONES (SuitReservaciones)
-- ============================================================

CREATE TABLE Reservacion (
  id_reservacion TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cliente TEXT,
  id_negocio TEXT,
  fecha DATE,
  hora TIME,
  personas NUMERIC(3,0),
  status TEXT DEFAULT 'CONFIRMADA',
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CITAS (SuitCitas)
-- ============================================================

CREATE TABLE Cita (
  id_cita TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cliente TEXT,
  id_servicio TEXT,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  status TEXT DEFAULT 'PROGRAMADA',
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. CAMPAÑAS / MARKETING (SuitCampanas)
-- ============================================================

CREATE TABLE Campana (
  id_campana TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  tipo TEXT,
  status TEXT DEFAULT 'BORRADOR',
  fecha_inicio DATE,
  fecha_fin DATE,
  presupuesto NUMERIC(12,2),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ContactoCampana (
  id_contacto_campana TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_campana TEXT,
  id_lead TEXT,
  id_cliente TEXT,
  status TEXT DEFAULT 'PENDIENTE',
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SERVIHOGAR (Servicios a domicilio)
-- ============================================================

CREATE TABLE ServicioDom (
  id_servicio_dom TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_cliente TEXT,
  tipo_servicio TEXT,
  direccion TEXT,
  fecha DATE,
  hora TIME,
  status TEXT DEFAULT 'PENDIENTE',
  precio NUMERIC(12,2),
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. AI / CHAT (SuitAI / SuitChatTG)
-- ============================================================

CREATE TABLE SesionChat (
  id_sesion TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_usuario TEXT,
  canal TEXT,
  status TEXT DEFAULT 'ACTIVA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE MensajeChat (
  id_mensaje TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  id_sesion TEXT,
  rol TEXT,
  contenido TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE TareaAI (
  id_tarea TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  tipo TEXT,
  status TEXT DEFAULT 'PENDIENTE',
  input JSONB,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 10. VIDEO (ViRe / SuitVidGenRemotion)
-- ============================================================

CREATE TABLE VideoProject (
  id_proyecto_video TEXT PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT,
  descripcion TEXT,
  status TEXT DEFAULT 'BORRADOR',
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Multi-tenant filtering (most common query pattern)
CREATE INDEX idx_lead_empresa ON Lead(id_empresa);
CREATE INDEX idx_clientes_empresa ON Clientes(id_empresa);
CREATE INDEX idx_negocios_empresa ON Negocios(id_empresa);
CREATE INDEX idx_producto_empresa ON Producto(id_empresa);
CREATE INDEX idx_inventario_empresa ON Inventario(id_empresa);
CREATE INDEX idx_orden_empresa ON Orden(id_empresa);
CREATE INDEX idx_orden_negocio ON Orden(id_empresa, id_negocio);
CREATE INDEX idx_orden_fecha ON Orden(id_empresa, created_at);
CREATE INDEX idx_cuenta_empresa ON Cuenta(id_empresa);
CREATE INDEX idx_contacto_empresa ON Contacto(id_empresa);
CREATE INDEX idx_proyecto_empresa ON Proyecto(id_empresa);
CREATE INDEX idx_reservacion_empresa ON Reservacion(id_empresa);
CREATE INDEX idx_reservacion_fecha ON Reservacion(id_empresa, fecha);
CREATE INDEX idx_cita_empresa ON Cita(id_empresa);
CREATE INDEX idx_cita_fecha ON Cita(id_empresa, fecha);
CREATE INDEX idx_campana_empresa ON Campana(id_empresa);
CREATE INDEX idx_servicio_dom_empresa ON ServicioDom(id_empresa);
CREATE INDEX idx_sesion_chat_empresa ON SesionChat(id_empresa);
CREATE INDEX idx_mensaje_chat_empresa ON MensajeChat(id_empresa);
CREATE INDEX idx_tarea_ai_empresa ON TareaAI(id_empresa);
CREATE INDEX idx_video_project_empresa ON VideoProject(id_empresa);
CREATE INDEX idx_orden_item_empresa ON OrdenItem(id_empresa);
CREATE INDEX idx_orden_item_orden ON OrdenItem(id_empresa, id_orden);
CREATE INDEX idx_pago_empresa ON Pago(id_empresa);
CREATE INDEX idx_pago_orden ON Pago(id_empresa, id_orden);
CREATE INDEX idx_movimiento_empresa ON MovimientoInventario(id_empresa);
CREATE INDEX idx_negocio_pdv_empresa ON NegocioPDV(id_empresa);
CREATE INDEX idx_terminal_empresa ON Terminal(id_empresa);
CREATE INDEX idx_turno_empresa ON Turno(id_empresa);
CREATE INDEX idx_material_empresa ON Material(id_empresa);
CREATE INDEX idx_servicio_empresa ON Servicio(id_empresa);
CREATE INDEX idx_mano_obra_empresa ON ManoDeObra(id_empresa);
CREATE INDEX idx_concepto_empresa ON Concepto(id_empresa);
CREATE INDEX idx_plantilla_empresa ON Plantilla(id_empresa);
CREATE INDEX idx_contacto_campana_empresa ON ContactoCampana(id_empresa);
CREATE INDEX idx_lead_status ON Lead(id_empresa, status);
CREATE INDEX idx_orden_status ON Orden(id_empresa, status);
CREATE INDEX idx_producto_sku ON Producto(id_empresa, sku);
CREATE INDEX idx_producto_codigo_barras ON Producto(id_empresa, codigo_barras);
CREATE INDEX idx_cliente_email ON Clientes(id_empresa, email);
CREATE INDEX idx_lead_email ON Lead(id_empresa, email);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Multi-tenant enforcement at DB level
-- ============================================================

ALTER TABLE Lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE Clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE Producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE Bodega ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE OrdenItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE Pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE MovimientoInventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE NegocioPDV ENABLE ROW LEVEL SECURITY;
ALTER TABLE Terminal ENABLE ROW LEVEL SECURITY;
ALTER TABLE Turno ENABLE ROW LEVEL SECURITY;
ALTER TABLE Cuenta ENABLE ROW LEVEL SECURITY;
ALTER TABLE Contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Material ENABLE ROW LEVEL SECURITY;
ALTER TABLE Servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE ManoDeObra ENABLE ROW LEVEL SECURITY;
ALTER TABLE Concepto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Plantilla ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reservacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE Cita ENABLE ROW LEVEL SECURITY;
ALTER TABLE Campana ENABLE ROW LEVEL SECURITY;
ALTER TABLE ContactoCampana ENABLE ROW LEVEL SECURITY;
ALTER TABLE ServicioDom ENABLE ROW LEVEL SECURITY;
ALTER TABLE SesionChat ENABLE ROW LEVEL SECURITY;
ALTER TABLE MensajeChat ENABLE ROW LEVEL SECURITY;
ALTER TABLE TareaAI ENABLE ROW LEVEL SECURITY;
ALTER TABLE VideoProject ENABLE ROW LEVEL SECURITY;

-- Generic tenant isolation policy (uses current_setting for app-level id_empresa)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'Lead','Clientes','Negocios','Producto','Inventario','Bodega',
      'Orden','OrdenItem','Pago','MovimientoInventario',
      'NegocioPDV','Terminal','Turno',
      'Cuenta','Contacto','Proyecto','Material','Servicio','ManoDeObra',
      'Concepto','Plantilla','Reservacion','Cita',
      'Campana','ContactoCampana','ServicioDom',
      'SesionChat','MensajeChat','TareaAI','VideoProject'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (id_empresa = current_setting(''app.id_empresa''))',
      t
    );
  END LOOP;
END $$;
