/* SuitOrg Backend - Orquestador Maestro (v15.9.1)
 * ---------------------------------------------------------
 * Responsabilidad: Orquestador y Tracking de Proyectos.
 * ---------------------------------------------------------
 */

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
  try { lock.waitLock(15000); } catch (e) { throw new Error("Busy"); }
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
      case "createLead": 
        data.lead.id_lead = "LEAD-" + (ss.getSheetByName("Leads").getLastRow() + 99);
        appendRowMapped(ss, "Leads", data.lead);
        output.newId = data.lead.id_lead;
        output.success = true; break;
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
      default: output.error = "ACTION_WAITING: " + action;
    }
  } finally { lock.releaseLock(); }
}
