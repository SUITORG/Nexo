-- ============================================================
-- 🚀 SUITORG - SEED FINAL v16.7.0 (v2 - SIN ON CONFLICT)
-- Basado en estructura REAL de Supabase (23 tablas)
-- Proyecto: egyxgnlnzanxpqyuvmsg.supabase.co
-- Estrategia: WHERE NOT EXISTS (seguro sin constraints)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Config_Empresas
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Empresas" (
  id_empresa, nomempresa, tipo_negocio, slogan,
  color_tema, logo_url,
  usa_features_estandar, habilitado, modo, db_engine,
  usa_soporte_ia, usa_reservaciones, costo_envio
)
SELECT 'PFM', 'Punto Fresón del Mar', 'Alimentos', 'La frescura del mar en tu mesa',
    '#0077b6', '',
    'FALSE', 'TRUE', 'PROD', 'SUPABASE',
    'FALSE', 'FALSE', 0
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Empresas" WHERE id_empresa = 'PFM');

INSERT INTO public."Config_Empresas" (
  id_empresa, nomempresa, tipo_negocio, slogan,
  color_tema, logo_url,
  usa_features_estandar, habilitado, modo, db_engine,
  usa_soporte_ia, usa_reservaciones, costo_envio
)
SELECT 'PAPER', 'PA PER', 'Servicios', 'Patrimonio Personal',
    '#001f3f', 'https://drive.google.com/uc?id=11GOSsHDaO-JmtcKd9J5Io5J8aYbcQHOH',
    'FALSE', 'TRUE', 'PROD', 'SUPABASE',
    'TRUE', 'TRUE', 0
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Empresas" WHERE id_empresa = 'PAPER');

INSERT INTO public."Config_Empresas" (
  id_empresa, nomempresa, tipo_negocio, slogan,
  color_tema, logo_url,
  usa_features_estandar, habilitado, modo, db_engine,
  usa_soporte_ia, usa_reservaciones, costo_envio
)
SELECT 'EVASOL', 'EVASOL', 'Servicios', 'Energía para tu vida',
    '#2e7d32', '',
    'TRUE', 'TRUE', 'PROD', 'GSHEETS',
    'TRUE', 'FALSE', 0
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Empresas" WHERE id_empresa = 'EVASOL');

-- ─────────────────────────────────────────────
-- 2. Config_Roles
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PFM', 'GUEST',  'Visitante',    '1', 0, 30, '["landing","catalogo"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PFM' AND id_rol = 'GUEST');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PFM', 'STAFF',  'Staff POS',    '5', 0, 30, '["pos","ordenes","catalogo"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PFM' AND id_rol = 'STAFF');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PFM', 'ADMIN',  'Administrador','10', 0, 30, '["pos","ordenes","leads","reportes","config"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PFM' AND id_rol = 'ADMIN');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PAPER','GUEST', 'Visitante',    '1', 0, 30, '["landing"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PAPER' AND id_rol = 'GUEST');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PAPER','STAFF', 'Asesor',       '5', 0, 30, '["leads","agenda"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PAPER' AND id_rol = 'STAFF');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'PAPER','ADMIN', 'Administrador','10', 0, 30, '["leads","proyectos","reportes","config"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'PAPER' AND id_rol = 'ADMIN');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'EVASOL','GUEST','Visitante',    '1', 0, 30, '["landing","catalogo"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'EVASOL' AND id_rol = 'GUEST');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'EVASOL','STAFF','Técnico',      '5', 0, 30, '["proyectos","catalogo"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'EVASOL' AND id_rol = 'STAFF');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'EVASOL','ADMIN','Administrador','10', 0, 30, '["proyectos","leads","catalogo","reportes","config"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'EVASOL' AND id_rol = 'ADMIN');

INSERT INTO public."Config_Roles" (id_empresa, id_rol, nombre_rol, nivel_acceso, creditos_base, vigencia_dias, modulos_visibles)
SELECT 'GLOBAL','SUDO', 'Super Admin',  '99', 999999, 9999, '["*"]'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Roles" WHERE id_empresa = 'GLOBAL' AND id_rol = 'SUDO');

-- ─────────────────────────────────────────────
-- 3. Usuarios
-- ─────────────────────────────────────────────
INSERT INTO public."Usuarios" (id_usuario, id_empresa, nombre, email, password, rol, nivel_acceso, creditos, fecha_limite_acceso, activo)
SELECT 'usr-global-sudo', 'GLOBAL', 'Super Administrador', 'admin@suitorg.mx', 'paper_admin_v1', 'SUDO', '99', 999999, '2099-12-31', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Usuarios" WHERE id_usuario = 'usr-global-sudo' AND id_empresa = 'GLOBAL');

INSERT INTO public."Usuarios" (id_usuario, id_empresa, nombre, email, password, rol, nivel_acceso, creditos, fecha_limite_acceso, activo)
SELECT 'usr-pfm-admin', 'PFM', 'Admin PFM', 'admin@pfm.mx', 'pfm_admin_v1', 'ADMIN', '10', 500, '2026-12-31', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Usuarios" WHERE id_usuario = 'usr-pfm-admin' AND id_empresa = 'PFM');

INSERT INTO public."Usuarios" (id_usuario, id_empresa, nombre, email, password, rol, nivel_acceso, creditos, fecha_limite_acceso, activo)
SELECT 'usr-pfm-staff', 'PFM', 'Staff POS', 'staff@pfm.mx', 'pfm_staff_v1', 'STAFF', '5', 100, '2026-12-31', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Usuarios" WHERE id_usuario = 'usr-pfm-staff' AND id_empresa = 'PFM');

INSERT INTO public."Usuarios" (id_usuario, id_empresa, nombre, email, password, rol, nivel_acceso, creditos, fecha_limite_acceso, activo)
SELECT 'usr-paper-admin', 'PAPER', 'Admin PAPER', 'admin@paper.mx', 'paper_admin_v1', 'ADMIN', '10', 500, '2026-12-31', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Usuarios" WHERE id_usuario = 'usr-paper-admin' AND id_empresa = 'PAPER');

-- ─────────────────────────────────────────────
-- 4. Config_SEO
-- ─────────────────────────────────────────────
INSERT INTO public."Config_SEO" (id_empresa, division, id_cluster, titulo, icono, keywords_coma, imagen_url, wa_directo, hex_color, mail_directo)
SELECT 'PAPER', 'PENSIONES', 'LEY73',  'ESTRATEGIA LEY 73', 'fa-calculator', 'pensiones,ley73,imss', '', '', '#001f3f', 'contacto@paper.mx'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_SEO" WHERE id_empresa = 'PAPER' AND id_cluster = 'LEY73');

INSERT INTO public."Config_SEO" (id_empresa, division, id_cluster, titulo, icono, keywords_coma, imagen_url, wa_directo, hex_color, mail_directo)
SELECT 'PAPER', 'PRÉSTAMOS', 'MOD40',  'MODALIDAD 40', 'fa-hand-holding-dollar', 'prestamos,modalidad40,imss', '', '', '#001f3f', 'contacto@paper.mx'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_SEO" WHERE id_empresa = 'PAPER' AND id_cluster = 'MOD40');

INSERT INTO public."Config_SEO" (id_empresa, division, id_cluster, titulo, icono, keywords_coma, imagen_url, wa_directo, hex_color, mail_directo)
SELECT 'PAPER', 'ASESORÍA',  'PADRON', 'PADRÓN PÉREZ', 'fa-users-gear', 'asesoria,patrimonial', '', '', '#001f3f', 'contacto@paper.mx'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_SEO" WHERE id_empresa = 'PAPER' AND id_cluster = 'PADRON');

-- ─────────────────────────────────────────────
-- 5. Config_Paginas
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Paginas" (id_empresa, id_pagina, id_cluster, meta_json, schema_json, contenido_json)
SELECT 'PAPER', 'home', 'LEY73', '{"section":"story","active":true}', '{}', '{"titulo":"TU PATRIMONIO, NUESTRA ESTRATEGIA FAMILIAR","subtitulo":"PA PER"}'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Paginas" WHERE id_empresa = 'PAPER' AND id_pagina = 'home');

INSERT INTO public."Config_Paginas" (id_empresa, id_pagina, id_cluster, meta_json, schema_json, contenido_json)
SELECT 'PAPER', 'requisitos', 'MOD40', '{"section":"full-page","active":true}', '{}', '{"titulo":"REQUISITOS PA PER","texto":"• Identificación Oficial\\n• CURP y RFC actualizado"}'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Paginas" WHERE id_empresa = 'PAPER' AND id_pagina = 'requisitos');

-- ─────────────────────────────────────────────
-- 6. Catalogo PFM
-- ─────────────────────────────────────────────
INSERT INTO public."Catalogo" (id_empresa, id_producto, categoria, nombre, descripcion, precio, precio_oferta, unidad, es_combo, stock, activo)
SELECT 'PFM','PROD-01','Mariscos','Camarón Fresco U15','Camarón fresco calibre U15 por kg.',320,300,'kg','FALSE',100,'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Catalogo" WHERE id_empresa = 'PFM' AND id_producto = 'PROD-01');

INSERT INTO public."Catalogo" (id_empresa, id_producto, categoria, nombre, descripcion, precio, precio_oferta, unidad, es_combo, stock, activo)
SELECT 'PFM','PROD-02','Mariscos','Pulpo Limpio','Pulpo limpio listo para cocinar.',280,260,'kg','FALSE',50,'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Catalogo" WHERE id_empresa = 'PFM' AND id_producto = 'PROD-02');

INSERT INTO public."Catalogo" (id_empresa, id_producto, categoria, nombre, descripcion, precio, precio_oferta, unidad, es_combo, stock, activo)
SELECT 'PFM','PROD-03','Combos','Combo Parrillero','Camarón 500g + Pulpo 500g + Salsa.',550,499,'combo','TRUE',30,'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Catalogo" WHERE id_empresa = 'PFM' AND id_producto = 'PROD-03');

-- ─────────────────────────────────────────────
-- 7. Config_Flujo_Proyecto
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Flujo_Proyecto" (id_empresa, id_fase, nombre_fase, peso_porcentaje, orden, color_hex, descripcion)
SELECT 'EVASOL', 'FASE-1', 'Visita Técnica', 20, 1, '#4CAF50', 'Relevación inicial del sitio'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Flujo_Proyecto" WHERE id_empresa = 'EVASOL' AND id_fase = 'FASE-1');

INSERT INTO public."Config_Flujo_Proyecto" (id_empresa, id_fase, nombre_fase, peso_porcentaje, orden, color_hex, descripcion)
SELECT 'EVASOL', 'FASE-2', 'Diseño', 15, 2, '#2196F3', 'Diseño del sistema'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Flujo_Proyecto" WHERE id_empresa = 'EVASOL' AND id_fase = 'FASE-2');

INSERT INTO public."Config_Flujo_Proyecto" (id_empresa, id_fase, nombre_fase, peso_porcentaje, orden, color_hex, descripcion)
SELECT 'EVASOL', 'FASE-3', 'Instalación', 40, 3, '#FF9800', 'Instalación de equipos'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Flujo_Proyecto" WHERE id_empresa = 'EVASOL' AND id_fase = 'FASE-3');

INSERT INTO public."Config_Flujo_Proyecto" (id_empresa, id_fase, nombre_fase, peso_porcentaje, orden, color_hex, descripcion)
SELECT 'EVASOL', 'FASE-4', 'Pruebas', 15, 4, '#9C27B0', 'Pruebas y ajustes'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Flujo_Proyecto" WHERE id_empresa = 'EVASOL' AND id_fase = 'FASE-4');

INSERT INTO public."Config_Flujo_Proyecto" (id_empresa, id_fase, nombre_fase, peso_porcentaje, orden, color_hex, descripcion)
SELECT 'EVASOL', 'FASE-5', 'Entrega', 10, 5, '#4CAF50', 'Entrega final al cliente'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Flujo_Proyecto" WHERE id_empresa = 'EVASOL' AND id_fase = 'FASE-5');

-- ─────────────────────────────────────────────
-- 8. Config_Galeria
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Galeria" (id_empresa, titulo, url_imagen, categoria, activo)
SELECT 'PFM', 'Fachada Principal', '', 'exterior', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Galeria" WHERE id_empresa = 'PFM' AND titulo = 'Fachada Principal');

INSERT INTO public."Config_Galeria" (id_empresa, titulo, url_imagen, categoria, activo)
SELECT 'PFM', 'Área de Preparación', '', 'interior', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Galeria" WHERE id_empresa = 'PFM' AND titulo = 'Área de Preparación');

INSERT INTO public."Config_Galeria" (id_empresa, titulo, url_imagen, categoria, activo)
SELECT 'EVASOL', 'Proyecto Residencial', '', 'instalaciones', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Galeria" WHERE id_empresa = 'EVASOL' AND titulo = 'Proyecto Residencial');

INSERT INTO public."Config_Galeria" (id_empresa, titulo, url_imagen, categoria, activo)
SELECT 'EVASOL', 'Proyecto Comercial', '', 'instalaciones', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Galeria" WHERE id_empresa = 'EVASOL' AND titulo = 'Proyecto Comercial');

-- ─────────────────────────────────────────────
-- 9. Config_Reportes
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Reportes" (id_reporte, nombre, tipo_negocio, tabla_origen, columnas, labels, filtro_base, acceso_minimo, habilitado, icono, descripcion)
SELECT 'REP-001', 'Ventas por Día', 'Alimentos', 'Proyectos', '["fecha","monto"]', '["Fecha","Monto"]', 'tipo_negocio=Alimentos', '5', 'TRUE', 'fa-chart-line', 'Reporte diario de ventas'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Reportes" WHERE id_reporte = 'REP-001');

INSERT INTO public."Config_Reportes" (id_reporte, nombre, tipo_negocio, tabla_origen, columnas, labels, filtro_base, acceso_minimo, habilitado, icono, descripcion)
SELECT 'REP-002', 'Ventas por Producto', 'Alimentos', 'Catalogo', '["nombre","stock"]', '["Producto","Stock"]', 'categoria=Mariscos', '5', 'TRUE', 'fa-box', 'Stock de productos'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Reportes" WHERE id_reporte = 'REP-002');

INSERT INTO public."Config_Reportes" (id_reporte, nombre, tipo_negocio, tabla_origen, columnas, labels, filtro_base, acceso_minimo, habilitado, icono, descripcion)
SELECT 'REP-003', 'Proyectos Activos', 'Servicios', 'Proyectos', '["nombre_proyecto","estado"]', '["Proyecto","Estado"]', 'estado=ACTIVO', '5', 'TRUE', 'fa-tasks', 'Seguimiento de proyectos'
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Reportes" WHERE id_reporte = 'REP-003');

-- ─────────────────────────────────────────────
-- 10. Config_Dashboard
-- ─────────────────────────────────────────────
INSERT INTO public."Config_Dashboard" (id_widget, titulo, tipo, tabla_origen, operacion, metrica, dimension, icono, color, giro, orden)
SELECT 'WID-001', 'Ventas Hoy', 'kpi', 'Proyectos', 'COUNT', 'id_proyecto', 'fecha_inicio', 'fa-cash-register', '#4CAF50', 'Alimentos', 1
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Dashboard" WHERE id_widget = 'WID-001');

INSERT INTO public."Config_Dashboard" (id_widget, titulo, tipo, tabla_origen, operacion, metrica, dimension, icono, color, giro, orden)
SELECT 'WID-002', 'Tickets Promedio', 'kpi', 'Pagos', 'AVG', 'monto', 'metodo_pago', 'fa-receipt', '#2196F3', 'Alimentos', 2
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Dashboard" WHERE id_widget = 'WID-002');

INSERT INTO public."Config_Dashboard" (id_widget, titulo, tipo, tabla_origen, operacion, metrica, dimension, icono, color, giro, orden)
SELECT 'WID-003', 'Proyectos Activos', 'kpi', 'Proyectos', 'COUNT', 'id_proyecto', 'estado', 'fa-tasks', '#FF9800', 'Servicios', 1
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Dashboard" WHERE id_widget = 'WID-003');

INSERT INTO public."Config_Dashboard" (id_widget, titulo, tipo, tabla_origen, operacion, metrica, dimension, icono, color, giro, orden)
SELECT 'WID-004', 'Ingreso Mensual', 'chart', 'Pagos', 'SUM', 'monto', 'fecha_pago', 'fa-chart-bar', '#9C27B0', 'Alimentos', 3
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Dashboard" WHERE id_widget = 'WID-004');

INSERT INTO public."Config_Dashboard" (id_widget, titulo, tipo, tabla_origen, operacion, metrica, dimension, icono, color, giro, orden)
SELECT 'WID-005', 'Leads por CRM', 'chart', 'Leads', 'COUNT', 'id_lead', 'nivel_crm', 'fa-users', '#00BCD4', 'Servicios', 2
WHERE NOT EXISTS (SELECT 1 FROM public."Config_Dashboard" WHERE id_widget = 'WID-005');

-- ─────────────────────────────────────────────
-- 11. Cuotas_Pagos
-- ─────────────────────────────────────────────
INSERT INTO public."Cuotas_Pagos" (id_cuota, id_empresa, monto, fecha_vencimiento, estatus, nota)
SELECT 'CUOTA-001', 'PAPER', 5000, '2026-05-01', 'PENDIENTE', 'Cuota mensual mayo'
WHERE NOT EXISTS (SELECT 1 FROM public."Cuotas_Pagos" WHERE id_cuota = 'CUOTA-001');

INSERT INTO public."Cuotas_Pagos" (id_cuota, id_empresa, monto, fecha_vencimiento, estatus, nota)
SELECT 'CUOTA-002', 'EVASOL', 3000, '2026-05-15', 'PENDIENTE', 'Cuota mantenimiento'
WHERE NOT EXISTS (SELECT 1 FROM public."Cuotas_Pagos" WHERE id_cuota = 'CUOTA-002');

-- ─────────────────────────────────────────────
-- 12. Empresa_Documentos
-- ─────────────────────────────────────────────
INSERT INTO public."Empresa_Documentos" (id_doc, id_empresa, id_drive_file, nombre_archivo, mimetype, activo)
SELECT 'DOC-001', 'PAPER', '1ABC123XYZ', 'Contrato_Servicios.pdf', 'application/pdf', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Empresa_Documentos" WHERE id_doc = 'DOC-001');

INSERT INTO public."Empresa_Documentos" (id_doc, id_empresa, id_drive_file, nombre_archivo, mimetype, activo)
SELECT 'DOC-002', 'PAPER', '1DEF456ABC', 'Politicas_Privacidad.pdf', 'application/pdf', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Empresa_Documentos" WHERE id_doc = 'DOC-002');

INSERT INTO public."Empresa_Documentos" (id_doc, id_empresa, id_drive_file, nombre_archivo, mimetype, activo)
SELECT 'DOC-003', 'EVASOL', '1GHI789DEF', 'Manual_Instalacion.pdf', 'application/pdf', 'TRUE'
WHERE NOT EXISTS (SELECT 1 FROM public."Empresa_Documentos" WHERE id_doc = 'DOC-003');

-- ─────────────────────────────────────────────
-- 13. Reservaciones
-- ─────────────────────────────────────────────
INSERT INTO public."Reservaciones" (id, id_empresa, fecha_cita, nombre_cliente, whatsapp, servicio, status)
SELECT 'RES-001', 'PAPER', '2026-05-10 10:00:00', 'Juan Pérez', '5512345678', 'Asesoría Patrimonial', 'PENDIENTE'
WHERE NOT EXISTS (SELECT 1 FROM public."Reservaciones" WHERE id = 'RES-001');

INSERT INTO public."Reservaciones" (id, id_empresa, fecha_cita, nombre_cliente, whatsapp, servicio, status)
SELECT 'RES-002', 'EVASOL', '2026-05-12 15:00:00', 'María González', '5587654321', 'Visita Técnica', 'CONFIRMADA'
WHERE NOT EXISTS (SELECT 1 FROM public."Reservaciones" WHERE id = 'RES-002');

-- ============================================================
-- ✅ VERIFICACIÓN POST-SEED
-- ============================================================
SELECT 'Config_Empresas' AS tabla, COUNT(*) AS total FROM public."Config_Empresas"
UNION ALL
SELECT 'Config_Roles',   COUNT(*) FROM public."Config_Roles"
UNION ALL
SELECT 'Usuarios',       COUNT(*) FROM public."Usuarios"
UNION ALL
SELECT 'Config_SEO',     COUNT(*) FROM public."Config_SEO"
UNION ALL
SELECT 'Config_Paginas', COUNT(*) FROM public."Config_Paginas"
UNION ALL
SELECT 'Catalogo',       COUNT(*) FROM public."Catalogo"
UNION ALL
SELECT 'Config_Flujo_Proyecto', COUNT(*) FROM public."Config_Flujo_Proyecto"
UNION ALL
SELECT 'Config_Galeria', COUNT(*) FROM public."Config_Galeria"
UNION ALL
SELECT 'Config_Reportes', COUNT(*) FROM public."Config_Reportes"
UNION ALL
SELECT 'Config_Dashboard', COUNT(*) FROM public."Config_Dashboard";
