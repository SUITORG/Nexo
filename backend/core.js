/* SuitOrg Backend - Orquestador Maestro (v15.9.1)
 * ---------------------------------------------------------
 * Responsabilidad: Orquestador y Tracking de Proyectos.
 * ---------------------------------------------------------
 */

/** 
 * 🛠️ CONFIGURACIÓN DE SEGURIDAD (v16.10.27)
 * La llave se lee desde las Script Properties, configuradas vía .env.
 * Para establecerla: PropertiesService.getScriptProperties().setProperty('OPENROUTER_API_KEY', 'sk-or-v1-...');
 */
function setupOpenRouterKey() {
  const key = PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY');
  if (!key) {
    Logger.log("❌ OPENROUTER_API_KEY no encontrada en Script Properties. Configúrala en .env");
    return;
  }
  PropertiesService.getScriptProperties().setProperty('USE_OPENROUTER', 'true');
  Logger.log("✅ [SEGURIDAD] OPENROUTER_API_KEY ya configurada en Script Properties.");
}


const CONFIG = {
  VERSION: "15.9.9", // Sistema Estable (v15.9.9)
  DB_ID: "1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8", 
  DRIVE_ROOT_ID: "1mJWzX-xRVOOCt4fSRDLUk6QhOMCzfKhL", 
  GLOBAL_TABLES: ["Config_Auth", "Config_Empresas", "Config_Roles", "Usuarios", "Config_SEO", "Prompts_IA", "Cuotas_Pagos", "Config_Reportes", "Config_Dashboard", "Config_Flujo_Proyecto", "Config_Galeria", "Config_Paginas"], 
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos", "Reservaciones", "Config_Galeria", "Logs_Chat_IA", "Memoria_IA_Snapshots", "Logs_Consultas_SOP"],
  AUDIT: { total: 14780, status: "GOLDEN_SYNC" }
};

function getSS() {
    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) return ss;
        ss = SpreadsheetApp.openById(CONFIG.DB_ID);
        if (ss) return ss;
        throw new Error("No se pudo conectar a la base de datos.");
    } catch (e) {
        throw new Error("FALLO_CONEXION: " + e.message + " (ID: " + CONFIG.DB_ID + ")");
    }
}

function ejecutarConfiguracionManual() {
  var ss = getSS();
  var output = { info: "" };
  console.log("🚀 Iniciando configuración modular v15.9.1...");
  initializeDatabase(ss, output);
  if (typeof DriveManager !== 'undefined') {
    var resDrive = DriveManager.initDriveStructure("CMARJAV");
    output.info += " | Drive: " + (resDrive.message || resDrive.error);
  }
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  var result = { status: "INIT", version: CONFIG.VERSION, timestamp: new Date() };
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    var ss = getSS();
    if (action === "getAll") {
        CONFIG.GLOBAL_TABLES.forEach(t => { try { result[t] = getSheetData(ss, t); } catch (err) { result[t] = []; } });
        var coId = (e && e.parameter && e.parameter.id_empresa) ? e.parameter.id_empresa.trim() : "";
        if (coId && coId !== "SuitOrg") {
             CONFIG.PRIVATE_TABLES.forEach(t => { try { result[t] = getSheetData(ss, t, coId); } catch (err) { result[t] = []; } });
        }
        result.status = "OK";
    } else if (action === "getUnsyncedEvents") {
        var logSheet = ss.getSheetByName("_EventLog");
        if (logSheet) {
          var logData = logSheet.getDataRange().getValues();
          var events = [];
          for (var i = 1; i < logData.length; i++) {
            if (String(logData[i][7]).trim() === "false") {
              events.push({
                timestamp: logData[i][0], sheet: logData[i][1], row: logData[i][2],
                column: logData[i][3], old_value: logData[i][4], new_value: logData[i][5],
                id_empresa: logData[i][6], rowIndex: i + 1
              });
            }
          }
          result.events = events;
          result.count = events.length;
        } else {
          result.events = [];
          result.count = 0;
        }
        result.status = "OK";
    } else if (action === "markEventSynced") {
        var logSheet2 = ss.getSheetByName("_EventLog");
        var rIdx = (e && e.parameter && e.parameter.rowIndex) ? parseInt(e.parameter.rowIndex) : 0;
        if (logSheet2 && rIdx > 0) {
          logSheet2.getRange(rIdx, 8).setValue("true");
        }
        result.status = "OK";
    } else if (action === "ping") {
        result.message = "Pong! Backend Modular v15.9.1 Online";
        result.status = "OK";
    }
  } catch (err) { result.status = "FATAL_ERROR"; result.error = err.toString(); }
  return output.setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(result));
}

function doPost(e) {
  var output = ContentService.createTextOutput();
  var result = { success: false };
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No payload");
    var data = JSON.parse(e.postData.contents);
    handlePostAction(data, result); 
  } catch (err) { result.error = err.message; }
  return output.setMimeType(ContentService.MimeType.JSON).setContent(JSON.stringify(result));
}

function handlePostAction(data, result) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch (e) { 
    result.success = false;
    result.error = 'LOCK_TIMEOUT: ' + action;
    return;
  }
  var ss = getSS();
  var action = data.action;
  var output = result; 

  try {
    switch (action) {
      case "repairDatabase": initializeDatabase(ss, output); output.success = true; break;
      case "askGemini":
        var coData = getSheetData(ss, "Config_Empresas", data.id_empresa || "SYSTEM");
        if (coData && coData.length > 0) data.ai_config = coData[0].usa_soporte_ia;
        runGeminiInference(data, output); 
        break;
      case "askNotebookLM":
        // --- BRIDGE MCP NOTEBOOKLM (v16.1.0) ---
        var nbConfig = getSheetData(ss, "Config_IA_Notebooks", data.id_empresa);
        if (nbConfig && nbConfig.length > 0) data.notebook_id = nbConfig[0].notebook_id;
        runNotebookLMQuery(data, output);
        break;
      case "syncDrive":
        if (typeof DriveManager !== 'undefined') output.success = DriveManager.initDriveStructure(data.id_empresa || "GLOBAL").success;
        break;
      case "processFullOrder":
        processTransaction(ss, data, output);
        break;
      case "updateProjectStatus":
        updateRowMappedExtended(ss, "Proyectos", { id_proyecto: data.id }, { status: data.status, fecha_estatus: new Date() });
        // --- REGISTRO EN BITÁCORA (INTEGRIDAD TRACKING v5.7.0) ---
        appendRowMapped(ss, "Proyectos_Bitacora", {
          id_empresa: data.id_empresa || "SYSTEM", id_proyecto: data.id,
          evento: "CAMBIO_ESTATUS", comentario: data.comentario || ("Cambio a " + data.status), fecha: new Date()
        });
        output.success = true; break;
      case "getLeadByVisitor":
        var allLeads = getSheetData(ss, "Leads", data.id_empresa);
        var lead = allLeads.filter(l => String(l.id_visitante) === String(data.id_visitante)).pop();
        if (lead) {
          result.lead = lead;
          result.success = true;
        } else { result.success = true; } 
        break;
      case "createLead": 
        // 🔒 PROTECCIÓN ATÓMICA: Evitar duplicados
        var leads = getSheetData(ss, "Leads", data.lead.id_empresa || "SYSTEM");
        var cleanTel = (data.lead.telefono || "").replace(/[\s\-]/g,"");
        var existingLead = leads.find(l => 
          String(l.id_visitante) === String(data.lead.id_visitante) || 
          (data.lead.email && String(l.email).toLowerCase() === String(data.lead.email).toLowerCase()) ||
          (cleanTel && String(l.telefono).replace(/[\s\-]/g,"") === cleanTel)
        );
        if (existingLead) {
          updateRowMapped(ss, "Leads", "id_lead", existingLead.id_lead, data.lead);
          output.success = true;
          output.msg = "LEAD_MERGED";
        } else {
          data.lead.id_lead = "LEAD-" + (ss.getSheetByName("Leads").getLastRow() + 99);
          appendRowMapped(ss, "Leads", data.lead);
          output.newId = data.lead.id_lead;
          output.success = true; 
        }
        break;
      case "updateLead":
        try {
          const lead = data.lead;
          if (!lead || !lead.id_lead) {
            output.success = false;
            output.error = "MISSING_ID_LEAD";
            break;
          }
          Logger.log("[BACKEND] updateLead recibido: " + JSON.stringify(lead));
          // Filtrar solo campos que vinieron con contenido real
          const updateObj = {};
          for (let k in lead) {
            if (k !== 'id_lead' && lead[k] !== undefined && lead[k] !== null && lead[k] !== '') {
              updateObj[k] = lead[k];
            }
          }
          Logger.log("[BACKEND] Actualizando con: " + JSON.stringify(updateObj));
          updateRowMapped(ss, "Leads", "id_lead", lead.id_lead, updateObj);
          output.success = true;
          output.message = "Lead actualizado: " + lead.id_lead;
        } catch (error) {
          Logger.log("[ERROR] updateLead: " + error.message);
          output.success = false;
          output.error = error.message;
        }
        break;
      case "saveAiConversation":
        appendRowMapped(ss, "Logs_Chat_IA", {
          id_conversacion: data.id_conversacion, id_visitante: data.id_visitante,
          id_empresa: data.id_empresa || "SYSTEM", role: data.role, content: data.content, fecha_hora: new Date()
        });
        output.success = true; break;
      case "saveAiMemory":
        var memObj = {
          id_conversacion: data.id_conversacion, id_visitante: data.id_visitante,
          id_empresa: data.id_empresa || "SYSTEM", resumen_semantico: data.resumen,
          contexto_datos: typeof data.contexto === 'object' ? JSON.stringify(data.contexto) : data.contexto,
          ultimo_agente: data.agente_id, estado_sesion: data.estado || "ACTIVA", fecha_actualizacion: new Date()
        };
        try { updateRowMapped(ss, "Memoria_IA_Snapshots", "id_conversacion", data.id_conversacion, memObj); }
        catch (e) { appendRowMapped(ss, "Memoria_IA_Snapshots", memObj); }
        output.success = true; break;
      case "getAiMemory":
        var allMem = getSheetData(ss, "Memoria_IA_Snapshots", data.id_empresa);
        var match = allMem.filter(m => String(m.id_visitante) === String(data.id_visitante)).pop();
        if (match) {
          output.memory = match;
          var allLogs = getSheetData(ss, "Logs_Chat_IA", data.id_empresa);
          output.history = allLogs.filter(l => l.id_conversacion === match.id_conversacion).slice(-20);
          output.success = true;
        } else { output.success = true; }
        break;
      case "listAiModels":
        output.models = listAiModels(); 
        output.success = true; break;
      case "createSupportTicket":
        data.ticket.fecha = new Date();
        appendRowMapped(ss, "Logs_Consultas_SOP", data.ticket);
        output.success = true; break;
      case "updateRow":
        if (data.table && data.matchField && data.matchValue && data.updates) {
          updateRowMapped(ss, data.table, data.matchField, data.matchValue, data.updates);
          output.success = true;
        } else {
          output.success = false;
          output.error = "MISSING_PARAMS: table, matchField, matchValue, updates";
        }
        break;
      case "orchestrate":
        // 🔒 PUENTE UNIVERSAL ANTIGRAVITY (v15.9.6)
        if (data.token !== "PROTON-77-X") { output.error = "ERROR_AUTH: Orchestration Denied"; break; }
        var subAction = data.subAction;
        var tableName = data.table;
        
        if (subAction === "READ_RAW") {
          output.data = getSheetData(ss, tableName, data.tenantID || "GLOBAL");
          output.success = true;
        } else if (subAction === "UPDATE_FIELD") {
          var updateObj = {}; 
          updateObj[data.field] = data.value;
          updateRowMappedExtended(ss, tableName, { [data.idKey]: data.idValue }, updateObj);
          output.success = true;
          output.msg = "UPDATE_SUCCESS: " + data.field + " in " + tableName;
        } else if (subAction === "APPEND_ROW") {
          appendRowMapped(ss, tableName, data.rowData);
          output.success = true;
          output.msg = "APPEND_SUCCESS: Row added to " + tableName;
        } else if (subAction === "DELETE_ROW") {
          var deleted = deleteRowMapped(ss, tableName, data.idKey, data.idValue);
          output.success = deleted;
          output.msg = deleted ? "DELETE_SUCCESS: " + data.idValue + " removed" : "DELETE_FAIL: " + data.idValue + " NOT found";
        }
        break;
      case "createReservation":
        var res = data.reservation;
        if (!res) { output.error = "MISSING_RESERVATION_DATA"; break; }
        res.id = "RES-" + new Date().getTime();
        res.status = res.status || "PENDIENTE";
        appendRowMapped(ss, "Reservaciones", res);
        output.success = true;
        output.id = res.id;
        break;
      case "getAll":
        CONFIG.GLOBAL_TABLES.forEach(t => { try { output[t] = getSheetData(ss, t); } catch (err) { output[t] = []; } });
        var coId2 = data.id_empresa ? String(data.id_empresa).trim() : "";
        if (coId2 && coId2 !== "SuitOrg") {
          CONFIG.PRIVATE_TABLES.forEach(t => { try { output[t] = getSheetData(ss, t, coId2); } catch (err) { output[t] = []; } });
        }
        output.success = true;
        break;
      case "syncToSupabase":
        if (typeof syncToSupabase === 'function') {
          syncToSupabase(ss, data.id_empresa);
          output.success = true;
          output.msg = "SYNC_COMPLETE for " + data.id_empresa;
        } else {
          output.error = "syncToSupabase not found";
        }
        break;
      case "migrateRRSS":
        var sheet = ss.getSheetByName("Config_Empresas");
        if (!sheet) { output.error = "SHEET_NOT_FOUND"; break; }
        var sData = sheet.getDataRange().getValues();
        if (sData.length < 2) { output.success = true; output.msg = "NO_DATA"; break; }
        var sHeaders = sData[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
        var rrssIdx = sHeaders.indexOf('rrss');
        var rsfaceIdx = sHeaders.indexOf('rsface');
        var rsinstaIdx = sHeaders.indexOf('rsinsta');
        var rstikIdx = sHeaders.indexOf('rstik');
        var rsytIdx = sHeaders.indexOf('rsyt');
        if (rrssIdx === -1) {
          var lastCol = sData[0].length;
          sheet.getRange(1, lastCol + 1).setValue('rrss');
          sHeaders.push('rrss');
          rrssIdx = lastCol;
        }
        var updated = 0;
        for (var r = 1; r < sData.length; r++) {
          var parts = [];
          if (rsfaceIdx !== -1 && sData[r][rsfaceIdx]) parts.push(String(sData[r][rsfaceIdx]).trim());
          if (rsinstaIdx !== -1 && sData[r][rsinstaIdx]) parts.push(String(sData[r][rsinstaIdx]).trim());
          if (rstikIdx !== -1 && sData[r][rstikIdx]) parts.push(String(sData[r][rstikIdx]).trim());
          if (rsytIdx !== -1 && sData[r][rsytIdx]) parts.push(String(sData[r][rsytIdx]).trim());
          var merged = parts.join(',');
          if (merged) { sheet.getRange(r + 1, rrssIdx + 1).setValue(merged); updated++; }
        }
        output.success = true;
        output.updated = updated;
        output.msg = "RRSS_MIGRATED: " + updated + " rows";
        break;
      case "saveBriefMetadata":
        var metaResult = saveBriefMetadata(data.id_empresa, data.vector, data.confianza);
        output.success = metaResult.success;
        if (metaResult.success) {
          output.msg = "METADATA_SAVED";
          output.briefFile = metaResult.briefFile;
          output.confianzaFile = metaResult.confianzaFile;
        } else {
          output.error = metaResult.error;
        }
        break;
      case "ensureCteFolders":
        var folderResult = ensureCteFolders(data.id_empresa);
        output.success = folderResult.success;
        if (folderResult.success) {
          output.msg = folderResult.msg;
          output.cteFolderId = folderResult.cteFolderId;
          output.created = folderResult.created;
        } else {
          output.error = folderResult.error;
        }
        break;
      case "generateAsset":
        var assetResult = generateAsset(data.id_empresa, data.tipo, data.opts || {});
        output.success = assetResult.success;
        if (assetResult.success) {
          output.fileName = assetResult.fileName;
          output.fileUrl = assetResult.fileUrl;
        } else {
          output.error = assetResult.error;
        }
        break;
      case "generateAllAssets":
        var allResult = generateAllAssets(data.id_empresa, data.activos);
        output.success = allResult.success;
        output.total = allResult.total;
        output.generated = allResult.generated;
        output.results = allResult.results;
        break;
      case "getBriefAssets":
        var assetsResult = getBriefAssets(data.id_empresa);
        output.success = assetsResult.success;
        output.assets = assetsResult.assets || {};
        break;
      case "updateBriefVector":
        var vectorResult = updateBriefVector(data.id_empresa, data.vector);
        output.success = vectorResult.success;
        if (vectorResult.success) {
          output.msg = "VECTOR_UPDATED";
          output.previousValue = vectorResult.previousValue;
          output.row = vectorResult.row;
        } else {
          output.error = vectorResult.error;
        }
        break;
      default: output.error = "ACTION_WAITING: " + action;
    }
  } finally { lock.releaseLock(); }
}

// ── BRIEF WRITER — Escritura de Brief a Config_Empresas.logo_url ──────────
// Estas funciones son llamadas desde el sidebar o desde el endpoint Node.js
// para escribir el vector de Brief completo en la hoja.

/**
 * Actualiza el campo logo_url de una empresa con el vector de Brief.
 * @param {string} idEmpresa - ID de la empresa
 * @param {string} vector - Vector de Brief completo (pipe-delimited)
 * @returns {object} { success, previousValue }
 */
function updateBriefVector(idEmpresa, vector) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Config_Empresas");
  if (!sheet) return { success: false, error: "SHEET_NOT_FOUND" };

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var idIdx = headers.indexOf('id_empresa');
  var logoIdx = headers.indexOf('logo_url');

  if (idIdx === -1 || logoIdx === -1) {
    return { success: false, error: "COLUMN_NOT_FOUND: id_empresa=" + (idIdx !== -1) + " logo_url=" + (logoIdx !== -1) };
  }

  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
      var previousValue = String(data[r][logoIdx] || '').trim();
      sheet.getRange(r + 1, logoIdx + 1).setValue(vector);
      return { success: true, previousValue: previousValue, row: r + 1 };
    }
  }

  return { success: false, error: "EMPRESA_NOT_FOUND: " + idEmpresa };
}

/**
 * Respalda el logo_url actual de una empresa antes de sobrescribir.
 * Guarda en la carpeta cte<id>/_brief/historial/ de Drive.
 * @param {string} idEmpresa - ID de la empresa
 * @returns {object} { success, backupId }
 */
function backupBriefVector(idEmpresa) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Config_Empresas");
  if (!sheet) return { success: false, error: "SHEET_NOT_FOUND" };

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var idIdx = headers.indexOf('id_empresa');
  var logoIdx = headers.indexOf('logo_url');
  var nombreIdx = headers.indexOf('nomempresa');

  if (idIdx === -1 || logoIdx === -1) {
    return { success: false, error: "COLUMN_NOT_FOUND" };
  }

  var currentVector = '';
  var nombreEmpresa = '';
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
      currentVector = String(data[r][logoIdx] || '').trim();
      nombreEmpresa = nombreIdx !== -1 ? String(data[r][nombreIdx] || '').trim() : idEmpresa;
      break;
    }
  }

  if (!currentVector) {
    return { success: false, error: "EMPTY_VECTOR: No hay Brief que respaldar" };
  }

  try {
    // Buscar carpeta cte<id> en Drive
    var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
    var cteFolderName = "cte" + idEmpresa;
    var cteFolders = rootFolder.getFoldersByName(cteFolderName);
    if (!cteFolders.hasNext()) {
      return { success: false, error: "CTE_FOLDER_NOT_FOUND: " + cteFolderName };
    }
    var cteFolder = cteFolders.next();

    // Buscar o crear subcarpeta _brief/historial
    var briefFolders = cteFolder.getFoldersByName("_brief");
    if (!briefFolders.hasNext()) {
      return { success: false, error: "_BRIEF_FOLDER_NOT_FOUND" };
    }
    var briefFolder = briefFolders.next();
    var historialFolders = briefFolder.getFoldersByName("historial");
    var historialFolder;
    if (historialFolders.hasNext()) {
      historialFolder = historialFolders.next();
    } else {
      historialFolder = briefFolder.createFolder("historial");
    }

    // Crear archivo de respaldo
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    var fileName = "brief_" + idEmpresa + "_" + timestamp + ".txt";
    historialFolder.createFile(fileName, currentVector, MimeType.PLAIN_TEXT);

    return { success: true, backupId: fileName, previousValue: currentVector };
  } catch (e) {
    return { success: false, error: "DRIVE_ERROR: " + e.message };
  }
}

/**
 * Función GAS expuesta para el sidebar: genera el Brief completo.
 * Lee la empresa, genera el vector, lo escribe y respalda.
 * @param {string} idEmpresa - ID de la empresa
 * @returns {object} { success, vector, previousValue }
 */
function generateAndWriteBrief(idEmpresa) {
  try {
    // 1. Respaldo del vector actual
    var backup = backupBriefVector(idEmpresa);
    var previousValue = backup.previousValue || '';

    // 2. Obtener datos de la empresa
    var ss = getSS();
    var sheet = ss.getSheetByName("Config_Empresas");
    if (!sheet) return { success: false, error: "SHEET_NOT_FOUND" };

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
    var idIdx = headers.indexOf('id_empresa');
    var logoIdx = headers.indexOf('logo_url');

    var empresaRow = null;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
        empresaRow = {};
        for (var h = 0; h < headers.length; h++) {
          empresaRow[headers[h]] = data[r][h];
        }
        break;
      }
    }

    if (!empresaRow) return { success: false, error: "EMPRESA_NOT_FOUND" };

    // 3. Leer brief actual
    var briefRaw = String(empresaRow.logo_url || empresaRow.tipo_negocio || '').trim();

    // 4. Llamar al endpoint Node.js para generar
    // (Esto se hace desde el sidebar vía google.script.run, no desde GAS directamente)
    return {
      success: true,
      message: "Usa el sidebar para generar vía Node.js",
      currentBrief: briefRaw,
      empresa: {
        id: empresaRow.id_empresa,
        nombre: empresaRow.nomempresa,
        giro: empresaRow.giro_especifico
      }
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── BRIEF METADATA — Guardar brief.json + confianza.json en Drive ─────────
// Guarda los archivos JSON del Brief generado en la carpeta cte<id>/_brief/
// de Google Drive. Llamado desde el sidebar después de generar el Brief.

/**
 * Guarda brief.json y confianza.json en Drive.
 * @param {string} idEmpresa - ID de la empresa
 * @param {string} vector - Vector pipe-delimited generado
 * @param {object} confianza - Mapa { campo: 'A'|'B'|'C' }
 * @returns {object} { success, briefFile, confianzaFile }
 */
function saveBriefMetadata(idEmpresa, vector, confianza) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Config_Empresas");
  if (!sheet) return { success: false, error: "SHEET_NOT_FOUND" };

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var idIdx = headers.indexOf('id_empresa');
  var nombreIdx = headers.indexOf('nomempresa');

  var nombreEmpresa = idEmpresa;
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
      nombreEmpresa = nombreIdx !== -1 ? String(data[r][nombreIdx] || idEmpresa).trim() : idEmpresa;
      break;
    }
  }

  try {
    var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
    var cteFolderName = "cte" + idEmpresa;
    var cteFolders = rootFolder.getFoldersByName(cteFolderName);
    if (!cteFolders.hasNext()) {
      return { success: false, error: "CTE_FOLDER_NOT_FOUND: " + cteFolderName };
    }
    var cteFolder = cteFolders.next();

    // Buscar o crear _brief
    var briefFolders = cteFolder.getFoldersByName("_brief");
    var briefFolder;
    if (briefFolders.hasNext()) {
      briefFolder = briefFolders.next();
    } else {
      briefFolder = cteFolder.createFolder("_brief");
    }

    // Guardar brief.json
    var briefData = {
      id_empresa: idEmpresa,
      nombre_empresa: nombreEmpresa,
      vector: vector,
      fecha_generacion: new Date().toISOString(),
      campos: {}
    };

    // Parsear vector para extraer campos
    var BRIEF_FIELD_ORDER = [
      'industria', 'nicho', 'especializacion', 'vendes', 'audiencia',
      'dolor', 'PBP', 'lograr', 'vivir', 'LAPVTFU', 'PM', 'objecion',
      'competidores', 'tono', 'PS', 'RLP', 'slogan', 'oferta', 'descripcion', 'cta', 'tipografia'
    ];
    var segments = vector.split('|');
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i].trim();
      var colon = seg.indexOf(':');
      if (colon < 0) continue;
      var key = seg.slice(0, colon).trim().toLowerCase();
      var value = seg.slice(colon + 1).trim().replace(/\s*\[([ABC])\]\s*$/i, '').trim();
      briefData.campos[key] = value;
    }

    // Crear o sobrescribir brief.json
    var briefFiles = briefFolder.getFilesByName("brief.json");
    if (briefFiles.hasNext()) {
      briefFiles.next().setContent(JSON.stringify(briefData, null, 2));
    } else {
      briefFolder.createFile("brief.json", JSON.stringify(briefData, null, 2), MimeType.JSON);
    }

    // Guardar confianza.json
    var confianzaData = {
      id_empresa: idEmpresa,
      fecha_generacion: new Date().toISOString(),
      semaforos: confianza || {},
      resumen: {
        A: 0, B: 0, C: 0
      }
    };

    // Contar semáforos
    var vals = Object.values(confianzaData.semaforos);
    for (var c = 0; c < vals.length; c++) {
      var nivel = String(vals[c]).toUpperCase();
      if (nivel === 'A') confianzaData.resumen.A++;
      else if (nivel === 'B') confianzaData.resumen.B++;
      else if (nivel === 'C') confianzaData.resumen.C++;
    }

    var confFiles = briefFolder.getFilesByName("confianza.json");
    if (confFiles.hasNext()) {
      confFiles.next().setContent(JSON.stringify(confianzaData, null, 2));
    } else {
      briefFolder.createFile("confianza.json", JSON.stringify(confianzaData, null, 2), MimeType.JSON);
    }

    return {
      success: true,
      briefFile: "cte" + idEmpresa + "/_brief/brief.json",
      confianzaFile: "cte" + idEmpresa + "/_brief/confianza.json"
    };
  } catch (e) {
    return { success: false, error: "DRIVE_ERROR: " + e.message };
  }
}

// ── FOLDER CREATOR — Crear estructura cte<id>/ si no existe ──────────────
// Crea la estructura completa de carpetas para un cliente:
//   cte<id>/
//   ├── _brief/
//   │   ├── historial/     ← respaldos de vectors
//   │   ├── brief.json
//   │   └── confianza.json
//   ├── _activos/
//   │   ├── logo/
//   │   ├── avatar/
//   │   ├── fotos-personales/
//   │   ├── videos/
//   │   ├── testimonios/
//   │   ├── fotos/
//   │   └── ugc/
//   └── _share/
//
// Idempotente: si ya existe, no duplica.

/**
 * Crea la estructura de carpetas cte<id>/ en Drive.
 * @param {string} idEmpresa - ID de la empresa
 * @returns {object} { success, folders: string[] }
 */
function ensureCteFolders(idEmpresa) {
  try {
    var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
    var cteFolderName = "cte" + idEmpresa;

    // Buscar o crear cte<id>/
    var cteFolders = rootFolder.getFoldersByName(cteFolderName);
    var cteFolder = cteFolders.hasNext() ? cteFolders.next() : rootFolder.createFolder(cteFolderName);

    var created = [];

    // _brief/
    var briefFolders = cteFolder.getFoldersByName("_brief");
    var briefFolder = briefFolders.hasNext() ? briefFolders.next() : cteFolder.createFolder("_brief");
    if (!briefFolders.hasNext()) created.push("_brief");

    // _brief/historial/
    var histFolders = briefFolder.getFoldersByName("historial");
    if (!histFolders.hasNext()) { briefFolder.createFolder("historial"); created.push("_brief/historial"); }

    // _activos/ + subcarpetas LAPVTFU
    var activosFolders = cteFolder.getFoldersByName("_activos");
    var activosFolder = activosFolders.hasNext() ? activosFolders.next() : cteFolder.createFolder("_activos");
    if (!activosFolders.hasNext()) created.push("_activos");

    var lapvtfuSubfolders = ["logo", "avatar", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];
    for (var i = 0; i < lapvtfuSubfolders.length; i++) {
      var subName = lapvtfuSubfolders[i];
      var subFolders = activosFolder.getFoldersByName(subName);
      if (!subFolders.hasNext()) {
        activosFolder.createFolder(subName);
        created.push("_activos/" + subName);
      }
    }

    // _share/
    var shareFolders = cteFolder.getFoldersByName("_share");
    if (!shareFolders.hasNext()) { cteFolder.createFolder("_share"); created.push("_share"); }

    return {
      success: true,
      cteFolderId: cteFolder.getId(),
      created: created,
      msg: created.length > 0
        ? "Carpetas creadas: " + created.join(", ")
        : "Estructura ya existía"
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── ASSET GENERATOR — Pipeline LAPVTFU ──────────────────────────────────
// Genera los 7 tipos de activos del Brief. Cada tipo tiene su fuente:
//   1. logo        → ComfyUI / placeholder
//   2. avatar      → ComfyUI / placeholder
//   3. fotos-personales → Pexels/Unsplash (búsqueda por industria)
//   4. videos      → Pexels (video stock)
//   5. testimonios → Texto + opcional TTS
//   6. fotos       → Pexels/Unsplash (búsqueda genérica)
//   7. ugc         → Placeholder (requiere contenido real del usuario)

/**
 * Genera un asset individual y lo guarda en Drive.
 * @param {string} idEmpresa - ID de la empresa
 * @param {string} tipo - Tipo de asset: logo|avatar|fotos-personales|videos|testimonios|fotos|ugc
 * @param {object} opts - Opciones: { prompt, query, imageUrl, texto }
 * @returns {object} { success, fileUrl, fileName }
 */
function generateAsset(idEmpresa, tipo, opts) {
  var VALID_TYPES = ["logo", "avatar", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];
  if (VALID_TYPES.indexOf(tipo) === -1) {
    return { success: false, error: "Tipo inválido: " + tipo + ". Válidos: " + VALID_TYPES.join(", ") };
  }

  try {
    var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
    var cteFolderName = "cte" + idEmpresa;
    var cteFolders = rootFolder.getFoldersByName(cteFolderName);
    if (!cteFolders.hasNext()) {
      return { success: false, error: "Carpeta cte" + idEmpresa + " no existe. Ejecuta ensureCteFolders primero." };
    }
    var cteFolder = cteFolders.next();
    var activosFolders = cteFolder.getFoldersByName("_activos");
    if (!activosFolders.hasNext()) {
      return { success: false, error: "Carpeta _activos no existe" };
    }
    var activosFolder = activosFolders.next();
    var tipoFolders = activosFolder.getFoldersByName(tipo);
    if (!tipoFolders.hasNext()) {
      return { success: false, error: "Carpeta " + tipo + " no existe" };
    }
    var tipoFolder = tipoFolders.next();

    // Nombre del archivo
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    var fileName = tipo + "_" + idEmpresa + "_" + timestamp;

    // ── Generar según tipo ───────────────────────────────────────────────
    if (tipo === "logo" || tipo === "avatar") {
      // Logo y avatar: descargar de URL proporcionada o crear placeholder
      if (opts.imageUrl) {
        var blob = UrlFetchApp.fetch(opts.imageUrl).getBlob();
        var ext = opts.imageUrl.match(/\.(png|jpg|jpeg|gif|svg)/i)?.[1] || 'png';
        fileName += '.' + ext;
        tipoFolder.createFile(blob.setName(fileName));
        return { success: true, fileName: fileName, fileUrl: tipoFolder.getUrl(), tipo: tipo };
      }
      // Placeholder: crear imagen con texto
      return _createPlaceholderAsset(tipoFolder, fileName, idEmpresa, tipo, opts);

    } else if (tipo === "fotos-personales" || tipo === "fotos") {
      // Fotos: descargar de URL (Pexels/Unsplash)
      if (opts.imageUrl) {
        var blob = UrlFetchApp.fetch(opts.imageUrl).getBlob();
        fileName += '.jpg';
        tipoFolder.createFile(blob.setName(fileName));
        return { success: true, fileName: fileName, fileUrl: tipoFolder.getUrl(), tipo: tipo };
      }
      return { success: false, error: "Se requiere imageUrl para fotos" };

    } else if (tipo === "videos") {
      // Videos: descargar de URL (Pexels video)
      if (opts.videoUrl) {
        var blob = UrlFetchApp.fetch(opts.videoUrl).getBlob();
        fileName += '.mp4';
        tipoFolder.createFile(blob.setName(fileName));
        return { success: true, fileName: fileName, fileUrl: tipoFolder.getUrl(), tipo: tipo };
      }
      return { success: false, error: "Se requiere videoUrl para videos" };

    } else if (tipo === "testimonios") {
      // Testimonios: guardar como archivo de texto
      var texto = opts.texto || "Testimonio pendiente de agregar";
      fileName += '.txt';
      tipoFolder.createFile(fileName, texto, MimeType.PLAIN_TEXT);
      return { success: true, fileName: fileName, fileUrl: tipoFolder.getUrl(), tipo: tipo, texto: texto };

    } else if (tipo === "ugc") {
      // UGC: placeholder — requiere contenido real del usuario
      return { success: false, error: "UGC requiere contenido real del usuario. Sube el archivo manualmente a la carpeta." };
    }

    return { success: false, error: "Tipo no implementado: " + tipo };
  } catch (e) {
    return { success: false, error: "ASSET_ERROR: " + e.message };
  }
}

/**
 * Crea un asset placeholder (imagen con texto) para logo/avatar.
 */
function _createPlaceholderAsset(folder, fileName, idEmpresa, tipo, opts) {
  try {
    var texto = opts.texto || idEmpresa;
    // Crear imagen placeholder con CanvasService (GAS)
    var canvas = Trends.newCanvas(400, 400);
    var ctx = Trends.newContext(canvas);

    // Fondo
    ctx.fillStyle = tipo === 'logo' ? '#1a1a2e' : '#0d3320';
    ctx.fillRect(0, 0, 400, 400);

    // Texto
    ctx.fillStyle = '#00d4aa';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(texto.substring(0, 10).toUpperCase(), 200, 200);

    var blob = Trends.newBlob(canvas, 'image/png');
    fileName += '.png';
    folder.createFile(blob.setName(fileName));
    return { success: true, fileName: fileName, fileUrl: folder.getUrl(), tipo: tipo };
  } catch (e) {
    // Fallback: crear archivo de texto con instrucciones
    var instructions = tipo === 'logo'
      ? "LOGO PLACEHOLDER — Reemplazar con el logo real de " + idEmpresa
      : "AVATAR PLACEHOLDER — Reemplazar con el avatar real de " + idEmpresa;
    fileName += '.txt';
    folder.createFile(fileName, instructions, MimeType.PLAIN_TEXT);
    return { success: true, fileName: fileName, fileUrl: folder.getUrl(), tipo: tipo, placeholder: true };
  }
}

/**
 * Genera todos los assets LAPVTFU para una empresa.
 * @param {string} idEmpresa - ID de la empresa
 * @param {object} activos - Objeto { logo, avatar, fotoPersonal, videos, testimonios, fotos, ugc }
 * @returns {object} { success, results: object[] }
 */
function generateAllAssets(idEmpresa, activos) {
  var results = [];
  var tipos = [
    { tipo: "logo",           campo: "logo" },
    { tipo: "avatar",         campo: "avatar" },
    { tipo: "fotos-personales", campo: "fotoPersonal" },
    { tipo: "videos",         campo: "videos" },
    { tipo: "testimonios",    campo: "testimonios" },
    { tipo: "fotos",          campo: "fotos" },
    { tipo: "ugc",            campo: "ugc" }
  ];

  for (var i = 0; i < tipos.length; i++) {
    var t = tipos[i];
    var valor = activos[t.campo] || '';
    if (!valor || valor.trim() === '' || valor.includes('[PENDIENTE')) {
      results.push({ tipo: t.tipo, status: "skipped", reason: "campo vacío" });
      continue;
    }

    var opts = {};
    // Determinar tipo de asset por URL
    if (valor.match(/\.(mp4|mov|avi|webm)/i)) {
      opts.videoUrl = valor;
    } else if (valor.match(/drive\.google\.com/)) {
      opts.imageUrl = valor;
    } else if (valor.match(/^https?:\/\//)) {
      opts.imageUrl = valor;
    } else if (t.tipo === 'testimonios') {
      opts.texto = valor;
    }

    var result = generateAsset(idEmpresa, t.tipo, opts);
    results.push({ tipo: t.tipo, ...result });
  }

  var successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    total: results.length,
    generated: successCount,
    results: results
  };
}

// ── GET BRIEF ASSETS — Obtener URLs de assets LAPVTFU ───────────────────
/**
 * Retorna las URLs de los assets LAPVTFU de una empresa.
 * @param {string} idEmpresa - ID de la empresa
 * @returns {object} { success, assets: { logo: url, avatar: url, ... } }
 */
function getBriefAssets(idEmpresa) {
  try {
    var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_ID);
    var cteFolders = rootFolder.getFoldersByName("cte" + idEmpresa);
    if (!cteFolders.hasNext()) return { success: true, assets: {} };

    var cteFolder = cteFolders.next();
    var activosFolders = cteFolder.getFoldersByName("_activos");
    if (!activosFolders.hasNext()) return { success: true, assets: {} };

    var activosFolder = activosFolders.next();
    var assets = {};
    var tipos = ["logo", "avatar", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];

    for (var i = 0; i < tipos.length; i++) {
      var tipo = tipos[i];
      var tipoFolders = activosFolder.getFoldersByName(tipo);
      if (!tipoFolders.hasNext()) { assets[tipo] = []; continue; }

      var tipoFolder = tipoFolders.next();
      var files = tipoFolder.getFiles();
      var fileUrls = [];
      while (files.hasNext()) {
        var file = files.next();
        fileUrls.push({
          name: file.getName(),
          url: file.getUrl(),
          id: file.getId(),
          size: file.getSize(),
          created: file.getDateCreated().toISOString()
        });
      }
      assets[tipo] = fileUrls;
    }

    return { success: true, assets: assets };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── NODE.JS PROXY FUNCTIONS (llamadas desde sidebar vía google.script.run) ──
// Estas funciones hacen fetch a Node.js (localhost:3001) desde GAS.
// Server-to-server: GAS (HTTPS) → Node.js (HTTP localhost) está PERMITIDO.
// El sidebar (GS HTTPS) NO puede fetch directo a localhost (Mixed Content),
// pero SÍ puede llamar a estas funciones vía google.script.run.

const NODE_BASE_URL = 'http://localhost:3001';

function fetchNode(endpoint, payload) {
  try {
    var options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(NODE_BASE_URL + endpoint, options);
    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code >= 400) throw new Error('HTTP ' + code + ': ' + text);
    return JSON.parse(text);
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

/**
 * Genera Brief vía Node.js (proxy desde GAS).
 * @param {string} idEmpresa
 * @returns {object} { status, data: { vector, brief, confidence, ... } }
 */
function generateBriefViaNode(idEmpresa) {
  return fetchNode('/api/brief/generate', { id_empresa: idEmpresa });
}

/**
 * Escribe vector de Brief a Config_Empresas.logo_url vía Node.js → GAS.
 * @param {string} idEmpresa
 * @param {string} vector
 * @returns {object} { success, previousValue, row }
 */
function writeBriefVectorViaNode(idEmpresa, vector) {
  return fetchNode('/api/brief/write', { id_empresa: idEmpresa, vector: vector });
}

/**
 * Guarda metadata (brief.json, confianza.json) en Drive vía Node.js → GAS.
 * @param {string} idEmpresa
 * @param {string} vector
 * @param {object} confianza
 * @returns {object} { success, briefFile, confianzaFile }
 */
function saveBriefMetadataViaNode(idEmpresa, vector, confianza) {
  return fetchNode('/api/brief/metadata', { id_empresa: idEmpresa, vector: vector, confianza: confianza });
}

/**
 * Genera assets LAPVTFU vía Node.js → GAS.
 * @param {string} idEmpresa
 * @returns {object} { success, total, generated, results }
 */
function generateAssetsViaNode(idEmpresa) {
  return fetchNode('/api/brief/assets', { id_empresa: idEmpresa });
}

/**
 * Obtiene assets LAPVTFU existentes vía Node.js → GAS.
 * @param {string} idEmpresa
 * @returns {object} { success, assets }
 */
function getBriefAssetsViaNode(idEmpresa) {
  try {
    var response = UrlFetchApp.fetch(NODE_BASE_URL + '/api/brief/assets?id=' + encodeURIComponent(idEmpresa), {
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code >= 400) throw new Error('HTTP ' + code + ': ' + text);
    return JSON.parse(text);
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

/**
 * Obtiene lista de empresas para el selector del sidebar.
 * @returns {object} { status, data: [{ id, nomempresa, logo_url, ... }] }
 */
function getBriefCompaniesViaNode() {
  try {
    var response = UrlFetchApp.fetch(NODE_BASE_URL + '/api/brief/companies', {
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    var text = response.getContentText();
    if (code >= 400) throw new Error('HTTP ' + code + ': ' + text);
    return JSON.parse(text);
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}
