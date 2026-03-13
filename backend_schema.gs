/* SuitOrg Backend Engine - v14.1.0
 * ---------------------------------------------------------
 * Sincronización: 2026-03-13 09:45 AM (v14.1.0 Multi-Tenant & SaaS Core)
 * 
 * Changelog v14.1.0:
 * - IDENTITY: Lanzamiento de CMARJAV con mensajes de Autoridad Familiar.
 * - AUDIT: ~850 Lines (v14.1.0 STABLE).
 * ---------------------------------------------------------
 */

const CONFIG = {
  VERSION: "14.1.0",
  DB_ID: "1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8", 
  DRIVE_ROOT_ID: "1UUtr70qr96_hpbwbgcRg-h14sHLvJVin", // Carpeta Maestra TopLux Finance
  GLOBAL_TABLES: ["Config_Empresas", "Config_Roles", "Usuarios", "Config_SEO", "Prompts_IA", "Cuotas_Pagos", "Config_Reportes", "Config_Dashboard", "Config_Flujo_Proyecto", "Config_Galeria", "Config_Paginas"], 
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos", "Reservaciones", "Config_Galeria"],
  AUDIT: { total: 13735, status: "STABLE_SYNC" }
};

/**
 * ⚡ DISPARADOR MANUAL (Usa este para el hito final)
 * Selecciona esta función en el menú de arriba y dale a EJECUTAR.
 */
function ejecutarConfiguracionManual() {
  var ss = SpreadsheetApp.openById(CONFIG.DB_ID);
  var output = { info: "" };
  console.log("🚀 Iniciando configuración de Pensión Inteligente v14.1.0...");
  initializeDatabase(ss, output);
  console.log("✅ Resultado: " + output.info);
}

/**
 * 🚀 ORQUESTADOR PRINCIPAL (GET)
 */
function doGet(e) {
  var output = ContentService.createTextOutput();
  var result = { status: "INIT", version: CONFIG.VERSION, timestamp: new Date() };

  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    var empresaSolicitante = (e && e.parameter && e.parameter.id_empresa) ? e.parameter.id_empresa.trim() : "SuitOrg";
    
    if (action === "getAll") {
        var ss = SpreadsheetApp.openById(CONFIG.DB_ID);
        CONFIG.GLOBAL_TABLES.forEach(function(tableName) {
            try {
                result[tableName] = getSheetData(ss, tableName);
            } catch (err) { result[tableName] = []; }
        });

        if (empresaSolicitante && empresaSolicitante !== "SuitOrg") {
             CONFIG.PRIVATE_TABLES.forEach(function(tableName) {
                try {
                    result[tableName] = getSheetData(ss, tableName, empresaSolicitante);
                } catch (err) { result[tableName] = []; }
             });
        } else {
             CONFIG.PRIVATE_TABLES.forEach(function(tableName) { result[tableName] = []; });
        }
        result.status = "OK";
    } else if (action === "ping") {
        result.message = "Pong! Backend " + CONFIG.VERSION + " Real-AI Online";
        result.status = "OK";
    } else {
        result.status = "UNKNOWN_ACTION";
    }
  } catch (globalError) {
    result.status = "FATAL_ERROR";
    result.error = globalError.toString();
  }
  return output.setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(result));
}

/**
 * ⚡ FUNCIÓN DE POST (Escritura)
 */
function doPost(e) {
  var output = ContentService.createTextOutput();
  var result = { success: false };

  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No payload");
    var data = JSON.parse(e.postData.contents);
    handlePostAction(data, result); 
  } catch (err) {
    result.error = err.message;
  }
  return output.setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(result));
}

function handlePostAction(data, output) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (e) { throw new Error("Servidor ocupado."); }

  var ss = SpreadsheetApp.openById(CONFIG.DB_ID);
  var action = data.action;

  try {
    switch (action) {
      case "initializeRbac":
        initializeDatabase(ss, output);
        output.success = true; break;

      case "askGemini":
        runGeminiInference(data, output);
        break;

      case "syncDrive":
        if (typeof DriveManager !== 'undefined') {
          // Detectar empresa para inicializar la estructura correcta (v1.4.2)
          var coId = data.id_empresa || empresaSolicitante || "GLOBAL";
          var resInit = DriveManager.initDriveStructure(coId);
          output.success = resInit.success;
          output.message = resInit.message || resInit.error;
        } else { output.error = "DRIVE_MANAGER_MISSING"; }
        break;

      case "createClientVault":
        if (typeof DriveManager !== 'undefined') {
          var resVault = DriveManager.crearCarpetaCliente(data.lead);
          output.success = resVault.success;
          output.folderId = resVault.folderId;
        } else { output.error = "DRIVE_MANAGER_MISSING"; }
        break;

      case "getCustomerDocs":
        var root = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
        var containers = root.getFoldersByName("01_EXPEDIENTES_CLIENTES");
        var leadFolderId = null;
        if (containers.hasNext()) {
          var container = containers.next();
          var itLead = container.getFolders();
          while (itLead.hasNext()) {
              var f = itLead.next();
              if (f.getName().toUpperCase().includes(data.leadName.toUpperCase())) {
                  leadFolderId = f.getId();
                  break;
              }
          }
        }
        if (leadFolderId && typeof DriveManager !== 'undefined') {
          output.files = DriveManager.obtenerDocumentosCliente(leadFolderId);
          output.success = true;
        } else { 
          output.success = true; // No error, just empty
          output.files = []; 
        }
        break;

      case "uploadToVault":
        if (typeof DriveManager !== 'undefined') {
          var vRes = DriveManager.crearCarpetaCliente(data.lead);
          if (vRes.success) {
            var fVault = DriveApp.getFolderById(vRes.folderId);
            var b64Data = data.fileData.split(',')[1];
            var dec = Utilities.base64Decode(b64Data);
            var blob = Utilities.newBlob(dec, data.fileType, data.fileName);
            fVault.createFile(blob);
            output.success = true;
          } else { output.error = vRes.error; }
        } else { output.error = "DRIVE_MANAGER_MISSING"; }
        break;

      case "listAiModels":
        var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
        if (!apiKey) { output.error = "API_KEY_MISSING"; break; }
        try {
          var res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1/models?key=" + apiKey);
          var dataModels = JSON.parse(res.getContentText());
          output.models = dataModels.models.map(function(m) { return m.name.replace("models/", ""); });
          output.success = true;
        } catch (e) {
          output.error = "ERROR_FETCHING_MODELS: " + e.message;
        }
        break;

      case "createLead": 
        var leadSheet = ss.getSheetByName("Leads");
        var lData = leadSheet.getDataRange().getValues();
        var nextL = lData.length + 99; // Offset para iniciar en ~100
        var newId = "LEAD-" + nextL;
        data.lead.id_lead = newId;
        appendRowMapped(ss, "Leads", data.lead);
        
        // GATILLO TOPLUX: Auto-creación de Bóveda (v6.1.8)
        var token = null;
        if (String(data.lead.id_empresa).toUpperCase().includes("TOPLUX")) {
          token = autoCreateUser(ss, data.lead);
        }

        output.newId = newId;
        output.vaultToken = token;
        output.success = true; break;

      case "updateLead":
        updateRowMapped(ss, "Leads", data.lead, "id_lead");
        output.success = true; break;

      case "processFullOrder":
        processTransaction(ss, data, output);
        break;

      case "createProduct":
        var catSheet = ss.getSheetByName("Catalogo");
        var catData = catSheet.getDataRange().getValues();
        var catHeaders = catData[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
        var idIdx = catHeaders.indexOf("id_producto");
        var coIdx = catHeaders.indexOf("id_empresa");
        var maxNum = 0;
        var coId = String(data.product.id_empresa).trim().toUpperCase();

        for (var i = 1; i < catData.length; i++) {
          var rCo = String(catData[i][coIdx]).trim().toUpperCase();
          if (rCo === coId) {
            var rId = String(catData[i][idIdx]);
            if (rId.indexOf("PROD-") === 0) {
              var num = parseInt(rId.split("-")[1]);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          }
        }
        data.product.id_producto = "PROD-" + String(maxNum + 1).padStart(2, '0');
        appendRowMapped(ss, "Catalogo", data.product);
        output.success = true; break;

      case "runMaintenance":
        runAutoPurge(ss);
        output.success = true; break;

      case "saveProduct":
      case "updateProduct":
        updateRowMapped(ss, "Catalogo", "id_producto", data.product.id_producto, data.product);
        output.success = true; break;

      case "deleteProduct":
        updateRowMapped(ss, "Catalogo", "id_producto", data.id, { activo: "FALSE" });
        output.success = true; break;

      case "createSupportTicket":
        appendRowMapped(ss, "Logs", { 
          id_empresa: data.ticket.id_empresa, 
          evento: "SUPPORT_TICKET", 
          detalle: JSON.stringify(data.ticket),
          fecha: new Date()
        });
        output.success = true; break;

      case "updateProjectStatus":
        var now = new Date();
        updateRowMapped(ss, "Proyectos", "id_proyecto", data.id, { 
          status: data.status, 
          estado: data.status,
          estatus: data.status,
          fecha_estatus: now 
        });
        
        // AUTO-LOG: Registro automático en Bitácora con Hora Exacta
        appendRowMapped(ss, "Proyectos_Bitacora", {
          id_empresa: data.id_empresa || "",
          id_proyecto: data.id,
          tipo: "SISTEMA",
          detalle: "Cambio de fase a: " + data.status + " (Registrado a las " + Utilities.formatDate(now, "GMT-6", "HH:mm:ss") + ")",
          fecha_hora: now
        });
        output.success = true; break;

      case "updateLeadStatus":
        updateRowMapped(ss, "Leads", "id_lead", data.id, { estatus: data.status });
        output.success = true; break;

      case "createProject":
        var projSheet = ss.getSheetByName("Proyectos");
        var pData = projSheet.getDataRange().getValues();
        var nextP = pData.length + 100;
        data.project.id_proyecto = "ORD-" + nextP; // Folio Oficial
        data.project.id_lead = data.project.id_lead || data.project.id_cliente; // Fallback durante transición
        data.project.fecha_inicio = new Date();
        data.project.fecha_estatus = new Date();
        data.project.activo = "TRUE";
        
        // Normalización v5.7.1
        var st = data.project.status || data.project.estado || data.project.estatus || "NUEVO";
        data.project.status = st;
        data.project.estado = st;
        data.project.estatus = st;

        appendRowMapped(ss, "Proyectos", data.project);
        output.success = true; break;

      case "deleteProject":
        updateRowMapped(ss, "Proyectos", "id_proyecto", data.id, { activo: "FALSE", estado: "ELIMINADO" });
        output.success = true; break;

      case "createBusiness":
        var bizSheet = ss.getSheetByName("Config_Empresas");
        var bData = bizSheet.getDataRange().getValues();
        var nextB = bData.length; 
        
        // Usar ID enviado o generar uno si falta (v6.1.1)
        var finalId = data.business.id_empresa || ("ONB-" + Math.random().toString(36).substring(2, 5).toUpperCase());
        data.business.id_empresa = finalId;
        
        // Automatic Defaults & Calculations
        data.business.fecha_creacion = new Date();
        data.business.habilitado = "FALSE";
        data.business.modo_creditos = "DIARIO";
        data.business.factura = "FALSE";
        data.business.autodepuracion = 30;
        
        // Respetar modo enviado (e.g. 'PROD') o default 'produccion'
        data.business.modo = data.business.modo || "produccion";
        
        // Expiration: Today + 20 days
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 20);
        data.business.fecha_vencimiento = expDate;
        
        appendRowMapped(ss, "Config_Empresas", data.business);
        output.newBusinessId = finalId;
        output.success = true; break;

      case "addProjectStage":
        appendRowMapped(ss, "Proyectos_Etapas", {
          id_empresa: data.id_empresa || "",
          id_proyecto: data.id,
          nombre_etapa: data.stage,
          completada: "FALSE",
          fecha_creacion: new Date()
        });
        output.success = true; break;

      case "toggleProjectStage":
        // Búsqueda específica por Proyecto + Etapa (Aislamiento total)
        updateRowMappedExtended(ss, "Proyectos_Etapas", { id_proyecto: data.id, nombre_etapa: data.stage }, { 
          completada: data.completed ? "TRUE" : "FALSE",
          fecha_actualizacion: new Date()
        });
        output.success = true; break;

      case "addProjectPayment":
        var payId = "PAY-" + Math.floor(Math.random() * 100000);
        var pData = {
          id_pago: payId,
          id_proyecto: data.id,
          id_empresa: data.id_empresa || "",
          monto: data.monto,
          concepto: data.concepto,
          fecha_pago: new Date()
        };
        appendRowMapped(ss, "Proyectos_Pagos", pData);
        appendRowMapped(ss, "Pagos", pData);
        output.success = true; break;

      case "addProjectLog":
        appendRowMapped(ss, "Proyectos_Bitacora", {
          id_empresa: data.id_empresa || "",
          id_proyecto: data.id,
          tipo: data.type,
          detalle: data.detail,
          fecha_hora: new Date()
        });
        output.success = true; break;

      case "createReservation":
        var reservation = data.reservation;
        var bizSheet = ss.getSheetByName("Config_Empresas");
        var bizData = getSheetData(ss, "Config_Empresas");
        var biz = bizData.find(b => b.id_empresa === reservation.id_empresa);
        
        if (!biz) throw new Error("Empresa no encontrada");
        
        // 1. Garantizar Calendario (v6.1.0)
        var calId = biz.id_calendario_google;
        if (!calId || calId === "") {
          try {
            var newCal = CalendarApp.createCalendar("Reservas: " + biz.nomempresa);
            calId = newCal.getId();
            updateRowMapped(ss, "Config_Empresas", "id_empresa", biz.id_empresa, { id_calendario_google: calId });
          } catch (calErr) {
            console.error("Error creating calendar: " + calErr.message);
          }
        }
        
        // 2. Crear Evento en Google Calendar (si calId existe)
        if (calId) {
          try {
            var cal = CalendarApp.getCalendarById(calId);
            var startTime = new Date(reservation.fecha_cita);
            var endTime = new Date(startTime.getTime() + (60 * 60 * 1000)); // 1 hora default
            cal.createEvent(
              "Reserva: " + reservation.nombre_cliente,
              startTime,
              endTime,
              {
                description: "Servicio: " + reservation.servicio + "\nWA: " + reservation.whatsapp,
                location: biz.direccion || ""
              }
            );
          } catch (e) { console.error("Calendar event error: " + e.message); }
        }
        
        // 3. Guardar en Hoja de cálculo
        reservation.id = "RES-" + Date.now();
        reservation.status = "PENDIENTE";
        appendRowMapped(ss, "Reservaciones", reservation);
        output.success = true; break;

      default:
        output.error = "Acción no implementada en " + CONFIG.VERSION + ": " + action;
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🧠 MOTOR DE INFERENCIA GEMINI
 */
function runGeminiInference(data, output) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    output.answer = "⚠️ Error: GEMINI_API_KEY no configurada en Propiedades del Script.";
    output.success = true; return;
  }

  const ss = SpreadsheetApp.openById(CONFIG.DB_ID);
  const model = data.model || "gemini-1.5-flash";
  const systemPrompt = data.promptBase || "Eres un asistente servicial de SuitOrg.";
  const history = data.history || [];
  const userMsg = data.message || data.prompt || "";

  const contents = [];
  // Inyectar el system prompt como el primer mensaje del historial para máxima compatibilidad en v1
  contents.push({ role: "user", parts: [{ text: "INSTRUCCIONES DEL SISTEMA (IMPORTANTE):\n" + systemPrompt }] });
  contents.push({ role: "model", parts: [{ text: "Entendido. Aplicaré estas instrucciones para el resto de la conversación." }] });

  history.forEach(h => {
    contents.push({
      role: (h.role === 'user' ? 'user' : 'model'),
      parts: [{ text: h.content }]
    });
  });
  contents.push({ role: "user", parts: [{ text: userMsg }] });

  const payload = {
    contents: contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
  };

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  
  try {
    const res = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const result = JSON.parse(res.getContentText());
    if (result.candidates && result.candidates[0]) {
      var responseText = (result.candidates && result.candidates[0].content.parts[0].text) || "Error IA: Respuesta vacía.";
      output.answer = responseText;
      output.success = true;

      // 📊 TELEMETRÍA DE TOKENS (v4.9.3)
      try {
        var usage = result.usageMetadata || {};
        var detail = "Model: " + model + " | Tokens: " + (usage.totalTokenCount || "?") + " (In: " + (usage.promptTokenCount || "?") + " / Out: " + (usage.candidatesTokenCount || "?") + ")";
        appendRowMapped(ss, "Logs", {
          fecha: new Date(),
          id_empresa: String(data.id_empresa || "SYSTEM").toUpperCase(),
          usuario: data.usuario || "Visitante",
          evento: "AI_TOKEN_USAGE",
          detalle: detail
        });
      } catch(e) { console.error("Telemetry fail: " + e.message); }

    } else {
      output.error = "AI_RESP_EMPTY";
      output.detail = res.getContentText();
    }
  } catch (e) {
    output.error = "FETCH_FAIL: " + e.toString();
  }
}

/**
 * 🛠️ INICIALIZACIÓN Y SEMILLAS (REPAIR DB)
 */
function initializeDatabase(ss, output) {
  // Asegurar tabla Prompts_IA
  const agents = [
    { 
      id_agente: "AGT-001", 
      nombre: "Chef Asistente", 
      prompt_base: "Eres el Chef Ejecutivo y Especialista en Servicio de SuitOrg. Tu objetivo es deleitar al cliente. \n\n" +
                   "REGLAS DE ORO:\n" +
                   "1. PERSONALIDAD: Eres apasionado por la cocina, amable y profesional.\n" +
                   "2. CONOCIMIENTO: Tu conocimiento se basa en la tabla [Catalogo]. Si el cliente pregunta por platillos, descríbelos de forma apetitosa.\n" +
                   "3. SOPORTE: Si el cliente tiene un problema con su orden, retardo o error en el pago, ofrece generar un TICKET DE SOPORTE enviando un JSON con {nombre, telefono, queja}.\n" +
                   "4. CIERRE: Siempre despídete con una frase cordial como '¡Buen provecho!' o 'Quedo a tus órdenes en la cocina'.", 
      id_empresa: "GLOBAL", 
      activo: "TRUE" 
    },
    { id_agente: "AGT-WRITER", nombre: "Redactor Gourmet", prompt_base: "Eres un redactor especializado en el ramo alimenticio. Ayudas a redactar menús, promociones y políticas de higiene.", id_empresa: "GLOBAL", activo: "TRUE" }
  ];
  
  agents.forEach(a => ensureSeed(ss, "Prompts_IA", "id_agente", a.id_agente, a));
  
  // Asegurar tabla Cuotas_Pagos (Control SaaS)
  const cuotasBase = [
    { id_cuota: "CUO-001", id_empresa: "EVASOL", monto: 1500, fecha_vencimiento: "2026-02-01", estatus: "PAGADO", nota: "Cuota inicial plataforma" },
    { id_cuota: "CUO-002", id_empresa: "PFM", monto: 1200, fecha_vencimiento: "2026-02-15", estatus: "PENDIENTE", nota: "Mensualidad Febrero" }
  ];
  cuotasBase.forEach(c => ensureSeed(ss, "Cuotas_Pagos", "id_cuota", c.id_cuota, c));
  
  // Asegurar Columnas Críticas
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

  // Semilla: Pensión Inteligente - CMARJAV (v1.6.0)
  ensureSeed(ss, "Config_Empresas", "id_empresa", "CMARJAV", {
    id_empresa: "CMARJAV",
    nomempresa: "Pensión Inteligente",
    tipo_negocio: "Consultoría / Préstamos",
    slogan: "CMARJAV | Consultoría Familiar",
    mensaje1: "MAXIMIZA TU PENSIÓN IMSS SIN PAGAR POR ADELANTADO",
    mensaje2: "Préstamos Inmediatos para Jubilados y Pensionados",
    descripcion: "Especialistas en Modalidad 40 y financiamiento para pensionados.",
    color_tema: "#001f3f", // Azul Marino Marina
    accent_color: "#FFD700", // Oro
    usa_features_estandar: "FALSE",
    habilitado: "TRUE",
    modo: "PROD",
    db_engine: "GSHEETS",
    autodepuracion: 60,
    usa_reservaciones: "TRUE"
  });

  // Semilla Marca Personal: Roberto Villarreal (v5.7.6)

  // Semillas Flujo Maestro EVASOL (v5.7.3)
  const flujoEvasol = [
    { id_empresa: "EVASOL", id_fase: "LVT", nombre_fase: "Levantamiento", peso_porcentaje: 10, orden: 1, color_hex: "#90A4AE", descripcion: "Inspección técnica en sitio." },
    { id_empresa: "EVASOL", id_fase: "VST", nombre_fase: "Visita Validación", peso_porcentaje: 20, orden: 2, color_hex: "#4DD0E1", descripcion: "Confirmación de viabilidad y medidas." },
    { id_empresa: "EVASOL", id_fase: "ANT", nombre_fase: "Pago Anticipo", peso_porcentaje: 40, orden: 3, color_hex: "#FFD54F", descripcion: "Entrada de capital inicial." },
    { id_empresa: "EVASOL", id_fase: "IMP", nombre_fase: "Implementación", peso_porcentaje: 70, orden: 4, color_hex: "#64B5F6", descripcion: "Fase de instalación y montaje." },
    { id_empresa: "EVASOL", id_fase: "PAG", nombre_fase: "Pago Parcial", peso_porcentaje: 85, orden: 5, color_hex: "#FFB74D", descripcion: "Cobro intermedio tras avance." },
    { id_empresa: "EVASOL", id_fase: "TER", nombre_fase: "Terminado", peso_porcentaje: 95, orden: 6, color_hex: "#81C784", descripcion: "Obra finalizada al 100%." },
    { id_empresa: "EVASOL", id_fase: "FAC", nombre_fase: "Facturado", peso_porcentaje: 98, orden: 7, color_hex: "#F06292", descripcion: "Documentación fiscal emitida." },
    { id_empresa: "EVASOL", id_fase: "CER", nombre_fase: "Cierre", peso_porcentaje: 100, orden: 8, color_hex: "#004D40", descripcion: "Proyecto cerrado y entregado." },
    { id_empresa: "EVASOL", id_fase: "CAN", nombre_fase: "Cancelado", peso_porcentaje: 0, orden: 9, color_hex: "#E57373", descripcion: "Proyecto abortado o rechazado." }
  ];

  const flowSheet = ss.getSheetByName("Config_Flujo_Proyecto");
  if (flowSheet) {
    flujoEvasol.forEach(f => ensureSeed(ss, "Config_Flujo_Proyecto", "id_fase", f.id_fase, f));
  }
  

  // Asegurar tabla Proyectos_Etapas
  const stageSheet = ss.getSheetByName("Proyectos_Etapas");
  if (!stageSheet) {
    const s = ss.insertSheet("Proyectos_Etapas");
    s.appendRow(["id_empresa", "id_proyecto", "nombre_etapa", "completada", "fecha_creacion", "fecha_actualizacion"]);
  } else {
    // Si ya existe pero falta id_empresa, lo inyectamos (Migración Quirúrgica v5.7.2)
    const headers = stageSheet.getRange(1, 1, 1, stageSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("id_empresa") === -1) {
      stageSheet.insertColumnBefore(1).getRange(1, 1).setValue("id_empresa");
    }
  }

  // Asegurar tabla Proyectos_Bitacora & Pagos (Headers)
  ["Proyectos_Bitacora", "Proyectos_Pagos"].forEach(tn => {
    const sh = ss.getSheetByName(tn);
    if (sh) {
       const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
       if (h.indexOf("id_empresa") === -1) sh.insertColumnBefore(1).getRange(1, 1).setValue("id_empresa");
    }
  });

  // Asegurar tabla Config_Paginas (v6.2.0)
  const pagesSheet = ss.getSheetByName("Config_Paginas");
  if (!pagesSheet) {
    const s = ss.insertSheet("Config_Paginas");
    s.appendRow(["id_empresa", "id_pagina", "meta_json", "schema_json", "contenido_json"]);
  }

  // Asegurar columna db_engine en Config_Empresas (v6.2.1)
  const empSheet = ss.getSheetByName("Config_Empresas");
  if (empSheet) {
    const headers = empSheet.getRange(1, 1, 1, empSheet.getLastColumn()).getValues()[0];
    if (headers.indexOf("db_engine") === -1) {
       empSheet.insertColumnAfter(empSheet.getLastColumn()).getRange(1, empSheet.getLastColumn()+1).setValue("db_engine");
    }
  }

  output.info = "Database structure verified and seeds restored.";
  
  // Ejecutar Autodepuración Quirúrgica (v4.9.2)
  try { runAutoPurge(ss); } catch(e) { console.error("Purge fail: " + e.message); }
}

/**
 * 🧹 MOTOR DE AUTODEPURACIÓN MULTI-INQUILINO (v4.9.2)
 */
function runAutoPurge(ss) {
  var logSheet = ss.getSheetByName("Logs");
  if (!logSheet) return;
  
  var empresas = getSheetData(ss, "Config_Empresas");
  var logData = logSheet.getDataRange().getValues();
  if (logData.length < 2) return;
  
  var headers = logData[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var coIdx = headers.indexOf("id_empresa");
  var dateIdx = headers.indexOf("fecha");
  if (coIdx === -1 || dateIdx === -1) return;

  var now = new Date();
  var rowsToDelete = [];

  // 1. Mapear reglas de depuración por empresa
  var rules = {};
  empresas.forEach(function(e) {
    var days = parseInt(e.autodepuracion);
    if (!isNaN(days) && days > 0) {
      rules[String(e.id_empresa).toUpperCase()] = days;
    }
  });

  // 2. Identificar filas caducas (Procesar de abajo hacia arriba para mantener índices)
  for (var i = logData.length - 1; i >= 1; i--) {
    var rCo = String(logData[i][coIdx]).toUpperCase().trim();
    var rDate = new Date(logData[i][dateIdx]);
    
    if (rules[rCo] && !isNaN(rDate.getTime())) {
      var diffDays = (now - rDate) / (1000 * 60 * 60 * 24);
      if (diffDays > rules[rCo]) {
        logSheet.deleteRow(i + 1);
      }
    }
  }
}

function ensureSeed(ss, sheetName, idCol, idVal, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(Object.keys(dataObj));
  }
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(h => String(h).toLowerCase().trim());
  var idIdx = headers.indexOf(idCol.toLowerCase());
  
  var exists = false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(idVal)) { exists = true; break; }
  }
  if (!exists) appendRowMapped(ss, sheetName, dataObj);
}

/**
 * 📊 UTILIDADES DE DATOS
 */
function getSheetData(ss, sheetName, filterId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; 
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var rows = data.slice(1);
  var result = [];
  var coIdx = headers.indexOf('id_empresa');
  
  for (var i = 0; i < rows.length; i++) {
    if (filterId && coIdx !== -1) {
      var rCo = String(rows[i][coIdx] || "").trim().toUpperCase();
      // Transición: Si el ID está vacío, se considera visible (GLOBAL) para evitar 'pérdida' de datos.
      if (rCo !== filterId.toUpperCase() && rCo !== 'GLOBAL' && rCo !== "") continue;
    }
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = rows[i][j];
      obj[headers[j]] = (typeof val === 'string') ? val.trim() : val;
    }
    result.push(obj);
  }
  return result;
}

function appendRowMapped(ss, sheetName, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(h => {
    var k = String(h).toLowerCase().trim().replace(/\s+/g, '_');
    return dataObj[k] !== undefined ? dataObj[k] : "";
  });
  sheet.appendRow(row);
}

function updateRowMapped(ss, sheetName, idCol, idVal, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var idIdx = headers.indexOf(idCol.toLowerCase().trim());
  var rowI = -1;
  var searchId = String(idVal).trim().toUpperCase();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toUpperCase() === searchId) { 
      rowI = i + 1; 
      break; 
    }
  }
  
  if (rowI === -1) throw new Error("Registro no encontrado: " + searchId + " en " + sheetName);
  
  for (var k in dataObj) {
    var cIdx = headers.indexOf(k.toLowerCase().trim().replace(/\s+/g, '_'));
    if (cIdx !== -1) sheet.getRange(rowI, cIdx + 1).setValue(dataObj[k]);
  }
}

/**
 * 🔍 ACTUALIZACIÓN POR MULTIPLE CRITERIO (v5.7.2)
 */
function updateRowMappedExtended(ss, sheetName, filters, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var rowI = -1;

  for (var i = 1; i < data.length; i++) {
    var match = true;
    for (var key in filters) {
      var colIdx = headers.indexOf(key.toLowerCase());
      if (colIdx === -1 || String(data[i][colIdx]).trim().toUpperCase() !== String(filters[key]).trim().toUpperCase()) {
        match = false; break;
      }
    }
    if (match) { rowI = i + 1; break; }
  }

  if (rowI !== -1) {
    for (var k in dataObj) {
      var cIdx = headers.indexOf(k.toLowerCase().trim().replace(/\s+/g, '_'));
      if (cIdx !== -1) sheet.getRange(rowI, cIdx + 1).setValue(dataObj[k]);
    }
  }
}

function processTransaction(ss, data, output) {
  var leadId = data.lead.id_lead;
  if (!leadId) {
     var leadSheet = ss.getSheetByName("Leads");
     var lData = leadSheet.getDataRange().getValues();
     var nextL = lData.length + 99;
     leadId = "LEAD-" + nextL;
     data.lead.id_lead = leadId;
     appendRowMapped(ss, "Leads", data.lead);
  }
  
  // Generar Folio Secuencial Corto
  var projectsSheet = ss.getSheetByName("Proyectos");
  var nextNum = 100;
  if (projectsSheet) {
    var lastRow = projectsSheet.getLastRow();
    if (lastRow > 1) {
      nextNum = lastRow + 99; // Offset para empezar en ~100
    }
  }
  var projId = "ORD-" + nextNum;
  
  data.project.id_proyecto = projId;
  data.project.id_lead = leadId;
  data.project.fecha_inicio = new Date();
  data.project.fecha_estatus = new Date();
  
  // Normalización de Estados (v5.7.1)
  var mainStatus = data.project.status || data.project.estado || data.project.estatus || "PEDIDO-RECIBIDO";
  data.project.status = mainStatus;
  data.project.estado = mainStatus;
  data.project.estatus = mainStatus;

  appendRowMapped(ss, "Proyectos", data.project);
  
  if (data.payment) {
    // Usar mismo número para pago para trazabilidad
    data.payment.id_pago = "PAY-" + nextNum;
    data.payment.id_proyecto = projId;
    data.payment.fecha_pago = new Date();
    
    // El objeto payment ya debe traer pago_con y cambio desde el POS (v5.7.1)
    appendRowMapped(ss, "Proyectos_Pagos", data.payment);
    appendRowMapped(ss, "Pagos", data.payment); // Restaurada Integridad de Tabla Principal (v4.8.6)
  }
  
  // PROCESAR STOCK AUTOMÁTICO (v4.4.0)
  if (data.stockUpdates && data.stockUpdates.length > 0) {
    data.stockUpdates.forEach(function(update) {
       updateRowMapped(ss, "Catalogo", "id_producto", update.id_producto, { stock: update.stock });
    });
  }

  output.newOrderId = projId;
  output.success = true;
}

/**
 * 🔑 GENERADOR DE LLAVES DE ACCESO (v6.1.8)
 */
function generateVaultToken() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var res = "TX-";
  for (var i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * 🤖 AUTO-CREACIÓN DE USUARIO PARA BÓVEDA
 */
function autoCreateUser(ss, lead) {
  try {
    var token = generateVaultToken();
    var newUser = {
      id_empresa: lead.id_empresa || "TOPLUXF",
      nombre: lead.nombre,
      email: lead.correo || lead.email,
      username: lead.correo || lead.email,
      password: token,
      nivel_acceso: 1,
      id_rol: "CLIENTE",
      activo: "TRUE",
      fecha_creacion: new Date()
    };
    appendRowMapped(ss, "Usuarios", newUser);
    return token;
  } catch(e) {
    console.error("Error auto-creating user: " + e.message);
    return null;
  }
}
