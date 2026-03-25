/* SuitOrg Backend - Master Seeds Module (v15.9.0)
 * ---------------------------------------------------------
 * Responsabilidad: Datos históricos, SEO Matrix y Configuraciones de Negocio.
 * ---------------------------------------------------------
 */

function runMasterSeeds(ss) {
  if (!ss) ss = getSS();

  const projSheet = ss.getSheetByName("Proyectos");
  if (projSheet) {
    const headers = projSheet.getRange(1, 1, 1, projSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("fecha_estatus") === -1) projSheet.insertColumnAfter(projSheet.getLastColumn()).getRange(1, projSheet.getLastColumn()+1).setValue("fecha_estatus");
  }

  const cat = ss.getSheetByName("Catalogo");
  if (cat) {
    const headers = cat.getRange(1, 1, 1, cat.getLastColumn()).getValues()[0];
    if (headers.indexOf("id_empresa") === -1) cat.insertColumnAfter(1).getRange(1, 2).setValue("id_empresa");
  }

  // Semilla: PA PER - Padrón Pérez (v15.0.0)
  ensureSeed(ss, "Config_Empresas", "id_empresa", "PAPER", {
    id_empresa: "PAPER", nomempresa: "PA PER", tipo_negocio: "Consultoría Patrimonial", slogan: "Patrimonio Personal",
    mensaje1: "MAXIMIZA TU PENSIÓN IMSS SIN PAGAR POR ADELANTADO", mensaje2: "Firma Padrón Pérez | Estrategia de Retiro",
    descripcion: "Especialistas en Modalidad 40 y blindaje patrimonial para pensionados.",
    color_tema: "#001f3f", accent_color: "#FFD700", logo_url: "https://drive.google.com/uc?id=11GOSsHDaO-JmtcKd9J5Io5J8aYbcQHOH",
    usa_features_estandar: "FALSE", habilitado: "TRUE", modo: "PROD", db_engine: "SUPABASE", usa_soporte_ia: "TRUE", autodepuracion: 60, usa_reservaciones: "TRUE"
  });

  // Semilla: EVASOL (Motor Estándar)
  ensureSeed(ss, "Config_Empresas", "id_empresa", "EVASOL", {
    id_empresa: "EVASOL", nomempresa: "EVASOL", tipo_negocio: "Energía Solar", slogan: "Energía para tu vida",
    color_tema: "#2e7d32", accent_color: "#ffa000", usa_features_estandar: "TRUE", habilitado: "TRUE", modo: "PROD", db_engine: "GSHEETS", usa_soporte_ia: "TRUE"
  });

  const secureAdminPass = PropertiesService.getScriptProperties().getProperty('ADMIN_PAPER_PASS') || "paper_admin_v1";
  ensureSeed(ss, "Usuarios", "username", "admin", {
    id_empresa: "GLOBAL", nombre: "Administrador del Sistema", email: "admin@paper.mx", username: "admin", password: secureAdminPass, nivel_acceso: 10, id_rol: "SUDO", activo: "TRUE", fecha_creacion: new Date().toISOString()
  });

  // Semillas Flujo Maestro EVASOL (v5.7.3)
  const flujoEvasol = [
    { id_empresa: "EVASOL", id_fase: "LVT", nombre_fase: "Levantamiento", peso_porcentaje: 10, orden: 1, color_hex: "#90A4AE" },
    { id_empresa: "EVASOL", id_fase: "VST", nombre_fase: "Visita Validación", peso_porcentaje: 20, orden: 2, color_hex: "#4DD0E1" },
    { id_empresa: "EVASOL", id_fase: "ANT", nombre_fase: "Pago Anticipo", peso_porcentaje: 40, orden: 3, color_hex: "#FFD54F" },
    { id_empresa: "EVASOL", id_fase: "IMP", nombre_fase: "Implementación", peso_porcentaje: 70, orden: 4, color_hex: "#64B5F6" },
    { id_empresa: "EVASOL", id_fase: "PAG", nombre_fase: "Pago Parcial", peso_porcentaje: 85, orden: 5, color_hex: "#FFB74D" },
    { id_empresa: "EVASOL", id_fase: "TER", nombre_fase: "Terminado", peso_porcentaje: 95, orden: 6, color_hex: "#81C784" },
    { id_empresa: "EVASOL", id_fase: "FAC", nombre_fase: "Facturado", peso_porcentaje: 98, orden: 7, color_hex: "#F06292" },
    { id_empresa: "EVASOL", id_fase: "CER", nombre_fase: "Cierre", peso_porcentaje: 100, orden: 8, color_hex: "#004D40" },
    { id_empresa: "EVASOL", id_fase: "CAN", nombre_fase: "Cancelado", peso_porcentaje: 0, orden: 9, color_hex: "#E57373" }
  ];
  flujoEvasol.forEach(f => ensureSeed(ss, "Config_Flujo_Proyecto", "id_fase", f.id_fase, f));
  
  // Semillas: SEO Matrix CMARJAV (v14.4.1)
  const seoCmarjav = [
    { id_empresa: "PAPER", division: "PENSIONES", id_cluster: "LEY73", titulo: "ESTRATEGIA LEY 73", icono: "fa-calculator", hex_color: "#001f3f", mail_directo: "contacto@paper.mx" },
    { id_empresa: "PAPER", division: "PRÉSTAMOS", id_cluster: "MOD40", titulo: "MODALIDAD 40", icono: "fa-hand-holding-dollar", hex_color: "#001f3f", mail_directo: "contacto@paper.mx" },
    { id_empresa: "PAPER", division: "ASESORÍA", id_cluster: "PADRON", titulo: "PADRÓN PÉREZ", icono: "fa-users-gear", hex_color: "#001f3f", mail_directo: "contacto@paper.mx" }
  ];
  seoCmarjav.forEach(s => ensureSeed(ss, "Config_SEO", "id_cluster", s.id_cluster, s));

  // Semillas: Config_Paginas PA PER (v15.0.0)
  const paginasPaper = [
    { id_empresa: "PAPER", id_pagina: "home", meta_json: JSON.stringify({ section: "story", active: true }), contenido_json: JSON.stringify({ titulo: "TU PATRIMONIO, NUESTRA ESTRATEGIA FAMILIAR", subtitulo: "PA PER" }) },
    { id_empresa: "PAPER", id_pagina: "requisitos", meta_json: JSON.stringify({ section: "full-page", active: true }), contenido_json: JSON.stringify({ titulo: "REQUISITOS PA PER", texto: "• Identificación Oficial\n• CURP y RFC actualizado" }) }
  ];
  paginasPaper.forEach(p => ensureSeed(ss, "Config_Paginas", "id_pagina", p.id_pagina + "_" + p.id_empresa, p));
  
  // Asegurar Tablas de Memoria y Leads
  const chatLogsSheet = ss.getSheetByName("Logs_Chat_IA");
  if (!chatLogsSheet) {
    const s = ss.insertSheet("Logs_Chat_IA");
    s.appendRow(["id_conversacion", "id_visitante", "id_empresa", "agente_id", "role", "content", "fecha_hora"]);
  }

  // Semilla: Config_IA_Notebooks (v16.1.0)
  const notebooksSeed = [
    { id_empresa: "PAPER", notebook_id: "NB-PAPER-LIBRETA-01", nombre_conocimiento: "Manual Operativo L73", enabled: "TRUE" },
    { id_empresa: "EVASOL", notebook_id: "NB-EVASOL-GEN-01", nombre_conocimiento: "Catálogo Técnico Solar", enabled: "TRUE" }
  ];
  notebooksSeed.forEach(n => ensureSeed(ss, "Config_IA_Notebooks", "notebook_id", n.notebook_id, n));

  // Asegurar Tabla de Soporte/Tickets (v16.1.1)
  const ticketSheet = ss.getSheetByName("Logs_Consultas_SOP");
  if (!ticketSheet) {
    const s = ss.insertSheet("Logs_Consultas_SOP");
    s.appendRow(["fecha", "id_empresa", "nombre", "email", "telefono", "queja", "estatus"]);
  }
}
