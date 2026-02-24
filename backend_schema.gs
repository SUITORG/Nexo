/* SuitOrg Backend Engine - v5.7.0
 * ---------------------------------------------------------
 * Sincronización: 2026-02-24 10:20 AM (v5.7.0 BI Matrix)
 * 
 * Changelog v5.7.0:
 * - BI: Implementación de 'Config_Dashboard' (Motor BI Matrix).
 * - DATA: Soporte para Widgets de Inteligencia Dinámicos.
 * 
 * AUDIT: ~10150 Total Lines (v5.7.0).
 * ---------------------------------------------------------
 */

const CONFIG = {
  VERSION: "5.7.0",
  DB_ID: "1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8", 
  GLOBAL_TABLES: ["Config_Empresas", "Config_Roles", "Usuarios", "Config_SEO", "Prompts_IA", "Cuotas_Pagos", "Config_Reportes", "Config_Dashboard"], 
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos"],
  AUDIT: { total: 10150, status: "STABLE_SYNC" }
};

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

      case "listAiModels":
        output.models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"];
        output.success = true; break;

      case "createLead": 
        var leadSheet = ss.getSheetByName("Leads");
        var lData = leadSheet.getDataRange().getValues();
        var nextL = lData.length + 99; // Offset para iniciar en ~100
        var newId = "LEAD-" + nextL;
        data.lead.id_lead = newId;
        appendRowMapped(ss, "Leads", data.lead);
        output.newId = newId;
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
        updateRowMapped(ss, "Proyectos", "id_proyecto", data.id, { 
          status: data.status, 
          estado: data.status,
          estatus: data.status,
          fecha_estatus: new Date() 
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
        appendRowMapped(ss, "Proyectos", data.project);
        output.success = true; break;

      case "deleteProject":
        updateRowMapped(ss, "Proyectos", "id_proyecto", data.id, { activo: "FALSE", estado: "ELIMINADO" });
        output.success = true; break;

      case "createBusiness":
        var bizSheet = ss.getSheetByName("Config_Empresas");
        var bData = bizSheet.getDataRange().getValues();
        var nextB = bData.length; 
        
        // Auto-ID: ONB + Random 3 chars (v5.3.9)
        var autoId = "ONB-" + Math.random().toString(36).substring(2, 5).toUpperCase();
        data.business.id_empresa = autoId;
        
        // Automatic Defaults & Calculations
        data.business.fecha_creacion = new Date();
        data.business.habilitado = "FALSE";
        data.business.modo_creditos = "DIARIO";
        data.business.factura = "FALSE";
        data.business.autodepuracion = 30;
        data.business.modo = "produccion";
        
        // Expiration: Today + 20 days
        var expDate = new Date();
        expDate.setDate(expDate.getDate() + 20);
        data.business.fecha_vencimiento = expDate;
        
        appendRowMapped(ss, "Config_Empresas", data.business);
        output.newBusinessId = autoId;
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

  const model = data.model || "gemini-1.5-flash";
  const systemPrompt = data.promptBase || "Eres un asistente servicial de SuitOrg.";
  const history = data.history || [];
  const userMsg = data.message || data.prompt || "";

  // Convert history to Gemini Format
  const contents = history.map(h => ({
    role: (h.role === 'user' ? 'user' : 'model'),
    parts: [{ text: h.content }]
  }));
  contents.push({ role: "user", parts: [{ text: userMsg }] });

  const payload = {
    contents: contents,
    system_instruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
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
  appendRowMapped(ss, "Proyectos", data.project);
  
  if (data.payment) {
    // Usar mismo número para pago para trazabilidad
    data.payment.id_pago = "PAY-" + nextNum;
    data.payment.id_proyecto = projId;
    data.payment.fecha_pago = new Date();
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
