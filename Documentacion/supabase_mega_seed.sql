-- ============================================================
-- 🚀 SUITORG - MEGA SEED v16.3.8
-- DB-2.2: Volcado Total Idempotente GSheet → Supabase
-- Proyecto: egyxgnlnzanxpqyuvmsg.supabase.co
-- Ejecutar en: Supabase SQL Editor
-- Estrategia: ON CONFLICT DO NOTHING (seguro para re-ejecutar)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Config_Empresas
-- ─────────────────────────────────────────────
INSERT INTO "Config_Empresas" (
  id_empresa, nomempresa, tipo_negocio, slogan,
  color_tema, accent_color, logo_url,
  usa_features_estandar, habilitado, modo, db_engine,
  usa_soporte_ia, usa_reservaciones
)
VALUES
  (
    'PFM', 'Punto Fresón del Mar', 'Estándar', 'La frescura del mar en tu mesa',
    '#0077b6', '#f4a261', '',
    TRUE, TRUE, 'PROD', 'SUPABASE',
    FALSE, FALSE
  ),
  (
    'PAPER', 'PA PER', 'Consultoría Patrimonial', 'Patrimonio Personal',
    '#001f3f', '#FFD700', 'https://drive.google.com/uc?id=11GOSsHDaO-JmtcKd9J5Io5J8aYbcQHOH',
    FALSE, TRUE, 'PROD', 'SUPABASE',
    TRUE, TRUE
  ),
  (
    'EVASOL', 'EVASOL', 'Energía Solar', 'Energía para tu vida',
    '#2e7d32', '#ffa000', '',
    TRUE, TRUE, 'PROD', 'GSHEETS',
    TRUE, FALSE
  )
ON CONFLICT (id_empresa) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. Config_Roles
-- ─────────────────────────────────────────────
INSERT INTO "Config_Roles" (id_empresa, id_rol, nombre_rol, modulos_visibles, permisos)
VALUES
  -- PFM
  ('PFM', 'GUEST',  'Visitante',    '["landing","catalogo"]',                         '{"leer": true,  "escribir": false, "admin": false}'),
  ('PFM', 'STAFF',  'Staff POS',    '["pos","ordenes","catalogo"]',                   '{"leer": true,  "escribir": true,  "admin": false}'),
  ('PFM', 'ADMIN',  'Administrador','["pos","ordenes","leads","reportes","config"]',   '{"leer": true,  "escribir": true,  "admin": true}'),
  -- PAPER
  ('PAPER','GUEST', 'Visitante',    '["landing"]',                                    '{"leer": true,  "escribir": false, "admin": false}'),
  ('PAPER','STAFF', 'Asesor',       '["leads","agenda"]',                             '{"leer": true,  "escribir": true,  "admin": false}'),
  ('PAPER','ADMIN', 'Administrador','["leads","proyectos","reportes","config"]',        '{"leer": true,  "escribir": true,  "admin": true}'),
  -- EVASOL
  ('EVASOL','GUEST','Visitante',    '["landing","catalogo"]',                         '{"leer": true,  "escribir": false, "admin": false}'),
  ('EVASOL','STAFF','Técnico',      '["proyectos","catalogo"]',                       '{"leer": true,  "escribir": true,  "admin": false}'),
  ('EVASOL','ADMIN','Administrador','["proyectos","leads","catalogo","reportes","config"]','{"leer": true,"escribir": true,  "admin": true}'),
  -- SUDO GLOBAL
  ('GLOBAL','SUDO', 'Super Admin',  '["*"]',                                          '{"leer": true,  "escribir": true,  "admin": true,  "sudo": true}')
ON CONFLICT (id_empresa, id_rol) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. Usuarios
-- ─────────────────────────────────────────────
INSERT INTO "Usuarios" (
  id_usuario, id_empresa, nombre, email, username,
  password, rol, id_rol, nivel_acceso, creditos,
  fecha_limite_acceso, activo
)
VALUES
  (
    'usr-global-sudo', 'GLOBAL', 'Super Administrador', 'admin@suitorg.mx', 'admin',
    'paper_admin_v1', 'SUDO', 'SUDO', 10, 999999,
    '2099-12-31', TRUE
  ),
  (
    'usr-pfm-admin', 'PFM', 'Admin PFM', 'admin@pfm.mx', 'admin_pfm',
    'pfm_admin_v1', 'ADMIN', 'ADMIN', 10, 500,
    '2026-12-31', TRUE
  ),
  (
    'usr-pfm-staff', 'PFM', 'Staff POS', 'staff@pfm.mx', 'staff_pfm',
    'pfm_staff_v1', 'STAFF', 'STAFF', 5, 100,
    '2026-12-31', TRUE
  )
ON CONFLICT (id_usuario) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. Config_SEO (PAPER)
-- ─────────────────────────────────────────────
INSERT INTO "Config_SEO" (
  id_empresa, division, id_cluster, titulo, icono, hex_color, mail_directo
)
VALUES
  ('PAPER', 'PENSIONES', 'LEY73',  'ESTRATEGIA LEY 73', 'fa-calculator',         '#001f3f', 'contacto@paper.mx'),
  ('PAPER', 'PRÉSTAMOS', 'MOD40',  'MODALIDAD 40',       'fa-hand-holding-dollar','#001f3f', 'contacto@paper.mx'),
  ('PAPER', 'ASESORÍA',  'PADRON', 'PADRÓN PÉREZ',       'fa-users-gear',         '#001f3f', 'contacto@paper.mx')
ON CONFLICT (id_cluster) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. Config_Paginas (PAPER)
-- ─────────────────────────────────────────────
INSERT INTO "Config_Paginas" (id_empresa, id_pagina, meta_json, contenido_json)
VALUES
  (
    'PAPER', 'home',
    '{"section":"story","active":true}',
    '{"titulo":"TU PATRIMONIO, NUESTRA ESTRATEGIA FAMILIAR","subtitulo":"PA PER"}'
  ),
  (
    'PAPER', 'requisitos',
    '{"section":"full-page","active":true}',
    '{"titulo":"REQUISITOS PA PER","texto":"• Identificación Oficial\n• CURP y RFC actualizado"}'
  )
ON CONFLICT (id_empresa, id_pagina) DO NOTHING;

-- ─────────────────────────────────────────────
-- 6. Catalogo PFM (productos de prueba)
-- ─────────────────────────────────────────────
INSERT INTO "Catalogo" (
  id_empresa, id_producto, categoria, nombre,
  descripcion, precio, precio_oferta, unidad,
  es_combo, stock, activo
)
VALUES
  ('PFM','PROD-01','Mariscos','Camarón Fresco U15','Camarón fresco calibre U15 por kg.',320,300,'kg',FALSE,100,TRUE),
  ('PFM','PROD-02','Mariscos','Pulpo Limpio','Pulpo limpio listo para cocinar.',280,260,'kg',FALSE,50, TRUE),
  ('PFM','PROD-03','Combos',  'Combo Parrillero','Camarón 500g + Pulpo 500g + Salsa.',550,499,'combo',TRUE,30, TRUE)
ON CONFLICT (id_empresa, id_producto) DO NOTHING;

-- ─────────────────────────────────────────────
-- ✅ VERIFICACIÓN POST-SEED
-- ─────────────────────────────────────────────
SELECT 'Config_Empresas' AS tabla, COUNT(*) AS total FROM "Config_Empresas"
UNION ALL
SELECT 'Config_Roles',   COUNT(*) FROM "Config_Roles"
UNION ALL
SELECT 'Usuarios',       COUNT(*) FROM "Usuarios"
UNION ALL
SELECT 'Config_SEO',     COUNT(*) FROM "Config_SEO"
UNION ALL
SELECT 'Config_Paginas', COUNT(*) FROM "Config_Paginas"
UNION ALL
SELECT 'Catalogo',       COUNT(*) FROM "Catalogo";
