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
  GLOBAL_TABLES: ["Config_Auth", "Config_Empresas", "Config_Roles", "Usuarios", "Config_SEO", "Prompts_IA", "Cuotas_Pagos", "Config_Reportes", "Config_Dashboard", "Config_Flujo_Proyecto", "Config_Galeria", "Config_Paginas"], 
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos", "Reservaciones", "Config_Galeria", "Logs_Chat_IA", "Memoria_IA_Snapshots", "Logs_Consultas_SOP"],
  AUDIT: { total: 14780, status: "GOLDEN_SYNC" }
};

/**
 * Raíz de Drive para carpetas cte<id>.
 * Orden: Script Property DRIVE_ROOT_ID → My Drive root (getFolderById resuelve
 * IDs inválidos lanzando, por eso se usa getRootFolder cuando no hay property).
 * ADR-028: los IDs hardcodeados previos (1mJWzX.../1BxmUT...) estaban
 * desincronizados de la estructura real (cte* viven en My Drive root).
 */
function getRootFolder_() {
  var prop = PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_ID');
  if (prop) {
    try { return DriveApp.getFolderById(prop); } catch (e) { /* property inválida → root */ }
  }
  return DriveApp.getRootFolder();
}

/**
 * Busca cte<id> en la raíz de forma case-insensitive (ADR-028).
 * Carpetas reales usan "CteTOPLUXF", el código pide "cteTOPLUXF".
 * @returns {Folder|null}
 */
function findCteFolder_(rootFolder, idEmpresa) {
  var want = ("cte" + idEmpresa).toLowerCase();
  var it = rootFolder.getFoldersByName("cte" + idEmpresa);
  if (it.hasNext()) return it.next();
  var all = rootFolder.getFolders();
  while (all.hasNext()) {
    var f = all.next();
    if (f.getName().toLowerCase() === want) return f;
  }
  return null;
}

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
          var syncRes = syncToSupabase(ss, data.id_empresa) || { ok: true };
          output.success = syncRes.ok !== false;
          output.msg = syncRes.ok !== false
            ? "SYNC_COMPLETE for " + data.id_empresa
            : "SYNC_FAILED for " + data.id_empresa;
          if (syncRes.error) output.error = syncRes.error;
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
      case "appendRows":
        // clusters-seo: alta de filas mapeadas por header (appendRowMapped)
        if (data.table && Array.isArray(data.rows) && data.rows.length) {
          try {
            data.rows.forEach(function(r) { appendRowMapped(ss, data.table, r); });
            output.success = true;
            output.msg = "APPENDED " + data.rows.length + " rows to " + data.table;
          } catch (eApp) { output.success = false; output.error = "APPEND_ERROR: " + eApp.message; }
        } else {
          output.success = false;
          output.error = "MISSING_PARAMS: table, rows[]";
        }
        break;
      case "subirImagenCte":
        // clusters-seo: imagenurl-{id_cluster}.jpg en cte<id>/[/subcarpeta] con share ANYONE
        var upRes = subirImagenCte_(data.id_empresa, data.fileName, data.imageUrl, data.folder || "");
        for (var upKey in upRes) output[upKey] = upRes[upKey];
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
      case "ensureLogoUrl":
        var ensureLogoResult = ensureLogoUrl(data.id_empresa, data.opts || {});
        for (var elrKey in ensureLogoResult) output[elrKey] = ensureLogoResult[elrKey];
        break;
      case "ensureAvatarUrl":
        var ensureAvatarResult = ensureAvatarUrl(data.id_empresa, data.opts || {});
        for (var eavrKey in ensureAvatarResult) output[eavrKey] = ensureAvatarResult[eavrKey];
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
      case "setNodeBaseUrl":
        var nbResult = setNodeBaseUrl_(data.url, data.token);
        for (var nbrKey in nbResult) output[nbrKey] = nbResult[nbrKey];
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

  // Respaldo best-effort a _brief/historial/ antes de sobrescribir (no bloquea)
  try { backupBriefVector(idEmpresa); } catch (e) { /* sin cte/_brief → seguir */ }

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
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) {
      return { success: false, error: "CTE_FOLDER_NOT_FOUND: cte" + idEmpresa };
    }

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
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) {
      return { success: false, error: "CTE_FOLDER_NOT_FOUND: cte" + idEmpresa };
    }

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
      briefFolder.createFile("brief.json", JSON.stringify(briefData, null, 2), "application/json");
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
      briefFolder.createFile("confianza.json", JSON.stringify(confianzaData, null, 2), "application/json");
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
//   ├── logo.png         ← slot 1 LAPVTFU (directo en cte<id>, ADR-028)
//   ├── favicon.png      ← espejo de logo.png (se crea/sincroniza en ensureLogoUrl)
//   ├── _activos/
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
    var rootFolder = getRootFolder_();
    var cteFolderName = "cte" + idEmpresa;

    // Buscar (case-insensitive) o crear cte<id>/
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) cteFolder = rootFolder.createFolder(cteFolderName);

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

    var lapvtfuSubfolders = ["avatar", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];
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

// Sube una imagen a cte<id>[/subcarpeta] con nombre fijo (overwrite) y share ANYONE.
// Usado por clusters-seo: imagenurl-{id_cluster}.jpg
function subirImagenCte_(idEmpresa, fileName, imageUrl, folder) {
  try {
    if (!idEmpresa || !fileName || !imageUrl) {
      return { success: false, error: "Se requieren id_empresa, fileName e imageUrl" };
    }
    var root = getRootFolder_();
    var cte = findCteFolder_(root, idEmpresa);
    if (!cte) {
      var ens = ensureCteFolders(idEmpresa);
      if (!ens.success) return ens;
      cte = findCteFolder_(root, idEmpresa);
    }
    var target = cte;
    if (folder) {
      var fIt = cte.getFoldersByName(folder);
      target = fIt.hasNext() ? fIt.next() : cte.createFolder(folder);
    }
    var blob = UrlFetchApp.fetch(imageUrl).getBlob().setName(fileName);
    var old = target.getFilesByName(fileName);
    while (old.hasNext()) { old.next().setTrashed(true); }
    var file = target.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, fileName: fileName, fileUrl: file.getUrl(), folder: folder || "(raiz cte)" };
  } catch (e) {
    return { success: false, error: "UPLOAD_ERROR: " + e.message };
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
  var VALID_TYPES = ["logo", "avatar", "fotoagente", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];
  if (VALID_TYPES.indexOf(tipo) === -1) {
    return { success: false, error: "Tipo inválido: " + tipo + ". Válidos: " + VALID_TYPES.join(", ") };
  }

  try {
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) {
      return { success: false, error: "Carpeta cte" + idEmpresa + " no existe. Ejecuta ensureCteFolders primero." };
    }

    // ADR-028: logo.png vive directo en cte<id>/ (nombre fijo, overwrite)
    if (tipo === "logo") {
      if (opts.imageUrl) {
        var logoBlob = UrlFetchApp.fetch(opts.imageUrl).getBlob();
        _writeLogoPng_(cteFolder, logoBlob);
        var createdLogo = cteFolder.getFilesByName("logo.png").next();
        return { success: true, fileName: "logo.png", fileUrl: createdLogo.getUrl(), tipo: "logo" };
      }
      // No destruir logo.png existente ni basura vieja — reutilizar ensureLogoUrl
      return ensureLogoUrl(idEmpresa, {});
    }

    // fotoagente: foto de marca/agente en la RAÍZ de cte<id>/ (nombre fijo, overwrite)
    // empresa-registro: sube imagen desde imageUrl con share ANYONE (patrón lf-005).
    if (tipo === "fotoagente") {
      if (!opts.imageUrl) return { success: false, error: "Se requiere imageUrl para fotoagente" };
      var faBlob = UrlFetchApp.fetch(opts.imageUrl).getBlob().setName("fotoagente.jpg");
      var faOld = cteFolder.getFilesByName("fotoagente.jpg");
      while (faOld.hasNext()) { var faDel = faOld.next(); faDel.setTrashed(true); }
      var faFile = cteFolder.createFile(faBlob);
      faFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return { success: true, fileName: "fotoagente.jpg", fileUrl: faFile.getUrl(), tipo: "fotoagente" };
    }

    // ADR-028: avatar.png vive directo en cte<id>/ — gate = fotopersonal.png.
    // Nunca placeholder ni descarga del slot: ensureAvatarUrl decide
    // (no_foto → skip | existing → reutiliza | needs_generate → Node+Gemini).
    if (tipo === "avatar") {
      return ensureAvatarUrl(idEmpresa, {});
    }

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
    if (tipo === "fotos-personales" || tipo === "fotos") {
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
 * Asegura logo.png en cte<id>, lo comparte (anyone-with-link) y escribe la URL
 * en el slot 1 del segmento LAPVTFU del vector (sobrescribe solo ese slot).
 *
 * opts:
 *   { base64: string }  → crear/overwrite logo.png desde base64 (procesado rembg)
 *   { createInitials: true } → forzar creación de iniciales aunque haya candidatos
 *
 * @returns {object} { success, status, url?, fileId?, vectorUpdated?, candidates?, base64?, source? }
 *   status: ready | needs_clean | created
 */
function ensureLogoUrl(idEmpresa, opts) {
  opts = opts || {};
  try {
    ensureCteFolders(idEmpresa);
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) return { success: false, error: "cte" + idEmpresa + " no existe" };

    var empresa = _getEmpresaRow_(idEmpresa) || {};

    // 1) opts.base64 → escribir logo.png procesado
    if (opts.base64) {
      var bytes = Utilities.base64Decode(opts.base64);
      _writeLogoPng_(cteFolder, Utilities.newBlob(bytes, 'image/png', 'logo.png'));
      return _finalizeLogo_(cteFolder, idEmpresa, 'processed');
    }

    // 2) logo.png ya existe → compartir + write-back
    var existingPng = cteFolder.getFilesByName('logo.png');
    if (existingPng.hasNext()) {
      return _finalizeLogo_(cteFolder, idEmpresa, 'existing');
    }

    // 3) candidatos con "logo" en el nombre → pedir limpieza (Node hace rembg)
    if (!opts.createInitials) {
      var candidates = _listFilesInfo_(cteFolder.getFiles(), /logo/i);
      if (!candidates.length) {
        // fallback _activos/logo/
        var actFolders = cteFolder.getFoldersByName('_activos');
        if (actFolders.hasNext()) {
          var logoOld = actFolders.next().getFoldersByName('logo');
          if (logoOld.hasNext()) candidates = _listFilesInfo_(logoOld.next().getFiles());
        }
      }
      if (candidates.length) {
        var best = _pickBestLogoCandidate_(candidates);
        var bestBase64 = '';
        try {
          bestBase64 = Utilities.base64Encode(DriveApp.getFileById(best.id).getBlob().getBytes());
        } catch (eBest) { /* continuar sin base64 */ }
        return { success: true, status: 'needs_clean', candidates: candidates, best: best, base64: bestBase64 };
      }
    }

    // 4) nada → crear iniciales (opción A) con color_tema del registro
    var nombre = empresa.nomempresa || empresa.nombreempresa || idEmpresa;
    var color = empresa.color_tema || '#2563eb';
    var ini = _inicialesDe_(nombre);
    var phUrl = 'https://placehold.co/400x400/' + String(color).replace('#', '') + '/ffffff/png?text=' + encodeURIComponent(ini);
    var iniBlob = UrlFetchApp.fetch(phUrl).getBlob();
    _writeLogoPng_(cteFolder, iniBlob);
    return _finalizeLogo_(cteFolder, idEmpresa, 'initials');
  } catch (e) {
    return { success: false, error: 'ENSURE_LOGO_ERROR: ' + e.message };
  }
}

function _finalizeLogo_(cteFolder, idEmpresa, source) {
  var files = cteFolder.getFilesByName('logo.png');
  if (!files.hasNext()) return { success: false, error: 'logo.png no encontrado tras crear' };
  var logoFile = files.next();
  logoFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/uc?export=view&id=' + logoFile.getId();

  var currentVector = _getLogoUrlVector_(idEmpresa);
  var newVector = _setLapvtfuSlot_(currentVector, 0, url);
  var vectorUpdated = false;
  if (newVector !== currentVector) {
    var wr = updateBriefVector(idEmpresa, newVector);
    vectorUpdated = !!(wr && wr.success);
  }

  // favicon.png en cte<id> (best-effort — un fallo no tumba el logo).
  // source='existing' → logo no cambió en esta pasada: solo crear si falta.
  var fav = _ensureFavicon_(cteFolder, logoFile, source !== 'existing');

  return {
    success: true,
    status: 'ready',
    url: url,
    fileId: logoFile.getId(),
    fileName: 'logo.png',
    source: source,
    vectorUpdated: vectorUpdated,
    faviconUrl: fav ? fav.url : '',
    faviconFileId: fav ? fav.fileId : ''
  };
}

/**
 * favicon.png en cte<id> — copia del blob de logo.png, compartido
 * anyone-with-link. force=true (logo recién escrito) → sobrescribe el
 * favicon viejo para mantenerlos sincronizados; force=false → solo crea
 * si falta. Devuelve { url, fileId } o null (best-effort).
 */
function _ensureFavicon_(cteFolder, logoFile, force) {
  try {
    var existing = cteFolder.getFilesByName('favicon.png');
    if (existing.hasNext()) {
      if (!force) {
        var cur = existing.next();
        return { url: 'https://drive.google.com/uc?export=view&id=' + cur.getId(), fileId: cur.getId() };
      }
      while (existing.hasNext()) existing.next().setTrashed(true); // solo favicon.png
    }
    var fav = cteFolder.createFile(logoFile.getBlob().setName('favicon.png'));
    fav.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { url: 'https://drive.google.com/uc?export=view&id=' + fav.getId(), fileId: fav.getId() };
  } catch (eFav) {
    return null;
  }
}

/**
 * Asegura avatar.png en cte<id>/ (raíz, ADR-028), lo comparte y escribe la URL
 * en el slot 2 del segmento LAPVTFU.
 *
 * Regla del usuario (2026-09-24):
 *   - SIN fotopersonal.png → status 'no_foto': NO se crea avatar, jamás
 *     placeholder, jamás fallback al logo. La foto la sube el usuario a mano.
 *   - CON fotopersonal.png y sin avatar.png → status 'needs_generate' con
 *     base64 de la foto: Node llama a Gemini 2.5 Flash Image (caricatura
 *     fiel a la foto) y re-postea opts.base64.
 *
 * opts:
 *   { base64: string } → escribe avatar.png desde base64 (caricatura generada)
 *
 * @returns {object} { success, status, url?, fileId?, vectorUpdated?, base64?, mime?, foto?, source? }
 *   status: ready | needs_generate | no_foto
 */
function ensureAvatarUrl(idEmpresa, opts) {
  opts = opts || {};
  try {
    ensureCteFolders(idEmpresa);
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) return { success: false, error: "cte" + idEmpresa + " no existe" };

    // 1) opts.base64 → escribir avatar.png (caricatura desde Gemini)
    if (opts.base64) {
      var bytes = Utilities.base64Decode(opts.base64);
      _writeAvatarPng_(cteFolder, Utilities.newBlob(bytes, 'image/png', 'avatar.png'));
      return _finalizeAvatar_(cteFolder, idEmpresa, 'generated');
    }

    // 2) avatar.png ya existe → compartir + write-back (idempotente)
    var existingPng = cteFolder.getFilesByName('avatar.png');
    if (existingPng.hasNext()) {
      return _finalizeAvatar_(cteFolder, idEmpresa, 'existing');
    }

    // 3) fotopersonal.png en raíz de cte<id> → pedir generación (Node+Gemini)
    var fotos = _listFilesInfo_(cteFolder.getFiles(), /^fotopersonal\.(png|jpe?g|webp)$/i);
    if (!fotos.length) {
      return {
        success: true,
        status: 'no_foto',
        reason: 'fotopersonal.png no existe en cte' + idEmpresa + ' — súbela a la raíz de la carpeta (la sube el usuario, nunca se genera)'
      };
    }
    var foto = fotos[0];
    var ext = (foto.name.match(/\.(png|jpe?g|webp)$/i) || [])[1] || 'png';
    var mime = /jpe?g/i.test(ext) ? 'image/jpeg' : (/webp/i.test(ext) ? 'image/webp' : 'image/png');
    var fotoBase64 = Utilities.base64Encode(DriveApp.getFileById(foto.id).getBlob().getBytes());
    return { success: true, status: 'needs_generate', foto: foto, base64: fotoBase64, mime: mime };
  } catch (e) {
    return { success: false, error: 'ENSURE_AVATAR_ERROR: ' + e.message };
  }
}

function _finalizeAvatar_(cteFolder, idEmpresa, source) {
  var files = cteFolder.getFilesByName('avatar.png');
  if (!files.hasNext()) return { success: false, error: 'avatar.png no encontrado tras crear' };
  var avatarFile = files.next();
  avatarFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/uc?export=view&id=' + avatarFile.getId();

  var currentVector = _getLogoUrlVector_(idEmpresa);
  var newVector = _setLapvtfuSlot_(currentVector, 1, url);
  var vectorUpdated = false;
  if (newVector !== currentVector) {
    var wr = updateBriefVector(idEmpresa, newVector);
    vectorUpdated = !!(wr && wr.success);
  }

  return {
    success: true,
    status: 'ready',
    url: url,
    fileId: avatarFile.getId(),
    fileName: 'avatar.png',
    source: source,
    vectorUpdated: vectorUpdated
  };
}

/** Sobrescribe SOLO avatar.png en la raíz de cte<id>. */
function _writeAvatarPng_(folder, blob) {
  var existing = folder.getFilesByName('avatar.png');
  while (existing.hasNext()) existing.next().setTrashed(true); // solo avatar.png
  return folder.createFile(blob.setName('avatar.png'));
}

/**
 * Lee el vector actual de Config_Empresas.logo_url para id_empresa.
 * (Extraído de _finalizeLogo_ — usado también por _finalizeAvatar_.)
 */
function _getLogoUrlVector_(idEmpresa) {
  var ss = getSS();
  var sheet = ss.getSheetByName('Config_Empresas');
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var idIdx = headers.indexOf('id_empresa');
  var logoIdx = headers.indexOf('logo_url');
  if (idIdx === -1 || logoIdx === -1) return '';
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
      return String(data[r][logoIdx] || '').trim();
    }
  }
  return '';
}

/**
 * Sobrescribe SOLO el slot `idx` del segmento LAPVTFU; conserva los otros 6.
 * idx: 0 = logo, 1 = avatar (sin fallback avatar=logo — decisión 2026-09-24).
 */
function _setLapvtfuSlot_(vector, idx, url) {
  function blankVector() {
    var slots = ['', '', '', '', '', '', ''];
    slots[idx] = url;
    return 'LAPVTFU: ' + slots.join(',');
  }
  if (!vector || !String(vector).trim()) return blankVector();
  var segs = String(vector).split('|');
  var found = false;
  for (var i = 0; i < segs.length; i++) {
    if (/^\s*LAPVTFU\s*:/i.test(segs[i])) {
      var colon = segs[i].indexOf(':');
      var parts = segs[i].slice(colon + 1).split(',');
      while (parts.length < 7) parts.push('');
      parts[idx] = url;
      segs[i] = 'LAPVTFU: ' + parts.join(',');
      found = true;
      break;
    }
  }
  if (!found) segs.push(blankVector());
  return segs.join('|');
}

function _writeLogoPng_(folder, blob) {
  var existing = folder.getFilesByName('logo.png');
  while (existing.hasNext()) existing.next().setTrashed(true); // solo logo.png; basura vieja se queda
  return folder.createFile(blob.setName('logo.png'));
}

function _inicialesDe_(nombre) {
  var words = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'XX';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.slice(0, 3).map(function(w) { return w.charAt(0); }).join('').toUpperCase();
}

function _getEmpresaRow_(idEmpresa) {
  try {
    var ss = getSS();
    var sheet = ss.getSheetByName('Config_Empresas');
    if (!sheet) return null;
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
    var idIdx = headers.indexOf('id_empresa');
    if (idIdx === -1) return null;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]).trim().toLowerCase() === String(idEmpresa).trim().toLowerCase()) {
        var row = {};
        for (var h = 0; h < headers.length; h++) row[headers[h]] = data[r][h];
        return row;
      }
    }
  } catch (e) { /* best-effort */ }
  return null;
}

/** Prefiere logo.png exacto > *removebg* > .png > .jpg > más grande. */
function _pickBestLogoCandidate_(candidates) {
  var scored = candidates.map(function(c) {
    var name = String(c.name || '');
    var s = 0;
    if (name === 'logo.png') s += 1000;
    if (/removebg/i.test(name)) s += 100;
    if (/\.png$/i.test(name)) s += 50;
    if (/\.jpe?g$/i.test(name)) s += 30;
    s += Math.min(Number(c.size || 0) / 10000, 20);
    return { c: c, s: s };
  });
  scored.sort(function(a, b) { return b.s - a.s; });
  return scored[0].c;
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

    // Avatar: el gate es fotopersonal.png (ensureAvatarUrl decide),
    // NO el contenido del slot — así "Crear assets" nunca duplica el logo.
    if (t.tipo === "avatar") {
      results.push({ tipo: t.tipo, ...generateAsset(idEmpresa, "avatar", {}) });
      continue;
    }

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
    var rootFolder = getRootFolder_();
    var cteFolder = findCteFolder_(rootFolder, idEmpresa);
    if (!cteFolder) return { success: true, assets: {} };

    var assets = {};
    var tipos = ["logo", "avatar", "fotos-personales", "videos", "testimonios", "fotos", "ugc"];

    // ADR-028: logo desde raíz de cte<id> — preferir match exacto logo.png (G4);
    // si no, cualquier archivo con "logo" en el nombre; fallback _activos/logo/
    var logoFiles = _listFilesInfo_(cteFolder.getFiles(), /logo/i);
    var exactPng = logoFiles.filter(function(f) { return f.name === 'logo.png'; });
    assets["logo"] = exactPng.length ? exactPng : logoFiles;
    if (!assets["logo"].length) {
      var actFolders = cteFolder.getFoldersByName("_activos");
      if (actFolders.hasNext()) {
        var logoOldFolders = actFolders.next().getFoldersByName("logo");
        if (logoOldFolders.hasNext()) assets["logo"] = _listFilesInfo_(logoOldFolders.next().getFiles());
      }
    }

    // ADR-028: avatar.png también vive en raíz de cte<id>; fallback _activos/avatar/
    var avatarFiles = _listFilesInfo_(cteFolder.getFiles(), /^avatar\.png$/i);
    assets["avatar"] = avatarFiles;

    var activosFolders = cteFolder.getFoldersByName("_activos");
    var activosFolder = activosFolders.hasNext() ? activosFolders.next() : null;

    for (var i = 0; i < tipos.length; i++) {
      var tipo = tipos[i];
      if (tipo === "logo") continue;
      if (tipo === "avatar") {
        // raíz ya resuelta arriba; si vacía, caer a _activos/avatar/ (legado)
        if (assets["avatar"].length) continue;
        if (activosFolder) {
          var avFolders = activosFolder.getFoldersByName("avatar");
          if (avFolders.hasNext()) assets["avatar"] = _listFilesInfo_(avFolders.next().getFiles());
        }
        if (!assets["avatar"].length) assets["avatar"] = [];
        continue;
      }
      if (!activosFolder) { assets[tipo] = []; continue; }
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

/**
 * Convierte un FileIterator en array de metadatos.
 * @param {FileIterator} files
 * @param {RegExp} [nameFilter] - filtro opcional sobre el nombre del archivo
 * @returns {object[]}
 */
function _listFilesInfo_(files, nameFilter) {
  var out = [];
  while (files.hasNext()) {
    var file = files.next();
    if (nameFilter && !nameFilter.test(file.getName())) continue;
    out.push({
      name: file.getName(),
      url: file.getUrl(),
      id: file.getId(),
      size: file.getSize(),
      created: file.getDateCreated().toISOString()
    });
  }
  return out;
}

// Los proxies Node.js del sidebar de Brief (fetchNode, generateBriefViaNode,
// writeBriefVectorViaNode, saveBriefMetadataViaNode, generateAssetsViaNode,
// getBriefAssetsViaNode, getBriefCompaniesViaNode) viven en brief-sidebar.js —
// estaban duplicados acá (mismo NODE_BASE_URL) y GAS junta todos los archivos
// en un solo scope global, lo que rompía onOpen() con
// "Identifier 'NODE_BASE_URL' has already been declared".
