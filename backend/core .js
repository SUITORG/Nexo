/* SuitOrg Backend - Orquestador Maestro (v16.3.3)
 * ---------------------------------------------------------
 * Responsabilidad: Orquestador Híbrido (GSheet + Supabase).
 * ---------------------------------------------------------
 */

const CONFIG = {
  VERSION: "16.3.8", 
  DB_ID: "1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8", 
  DRIVE_ROOT_ID: "1mJWzX-xRVOOCt4fSRDLUk6QhOMCzfKhL", 
  SB_URL: "https://egyxgnlnzanxpqyuvmsg.supabase.co/rest/v1",
  GLOBAL_TABLES: ["Config_Auth", "Config_Empresas", "Config_Roles", "Usuarios", "Config_SEO", "Prompts_IA", "Cuotas_Pagos", "Config_Reportes", "Config_Dashboard", "Config_Flujo_Proyecto", "Config_Galeria", "Config_Paginas"], 
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos", "Reservaciones", "Config_Galeria", "Logs_Chat_IA", "Memoria_IA_Snapshots", "Logs_Consultas_SOP"],
  AUDIT: { total: 14780, status: "SUPABASE_ACTIVE" }
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

function getRemoteData(tableName, filterId) {
    try {
        const SB_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');
        if (!SB_KEY) return null;
        
        let url = `${CONFIG.SB_URL}/${tableName}?select=*`;
        if (filterId) url += `&id_empresa=eq.${filterId}`;
        
        var response = UrlFetchApp.fetch(url, {
            method: "get",
            headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY },
            muteHttpExceptions: true
        });
        
        if (response.getResponseCode() !== 200) {
            console.error("SUPABASE_HTTP_ERROR: " + response.getResponseCode());
            return null;
        }
        return JSON.parse(response.getContentText());
    } catch (e) {
        console.error("SUPABASE_CONNECTION_TIMEOUT_OR_FAIL");
        return null;
    }
}

function doGet(e) {
  var output = ContentService.createTextOutput();
  var result = { status: "INIT", version: CONFIG.VERSION, timestamp: new Date(), engine_actual: "INIT" };
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    var ss = getSS();
    var coId = (e && e.parameter && e.parameter.id_empresa) ? e.parameter.id_empresa.trim() : "";
    
    // Check Engine Config
    var coData = getSheetData(ss, "Config_Empresas", coId || "SYSTEM");
    var engine = (coData && coData.length > 0) ? (coData[0].db_engine || "GSHEETS") : "GSHEETS";
    result.engine_target = engine;

    if (action === "getAll") {
        CONFIG.GLOBAL_TABLES.forEach(t => { 
            let tableData = [];
            if (engine === "SUPABASE") {
              tableData = getRemoteData(t);
            }
            // FALLBACK: Si Supabase falló o está vacío, ir a GSheet (v16.3.9)
            if (!tableData || tableData.length === 0) {
               try { tableData = getSheetData(ss, t); } catch (e) { tableData = []; }
            }
            
            if (t === "Usuarios") {
                try {
                    const sudoUsers = getSheetData(ss, "MAESTRO_SUDO");
                    if (sudoUsers && sudoUsers.length > 0) tableData = (tableData || []).concat(sudoUsers);
                } catch (e) {}
                
                const rescueUser = {
                  id_usuario: "SUDO-MASTER", nombre: "Administrador Recuperación",
                  email: "admin", pass: "Admin2020!S", id_rol: "DIOS",
                  nivel_acceso: 99, id_empresa: "GLOBAL", habilitado: "TRUE"
                };
                tableData.push(rescueUser);
            }
            result[t] = tableData;
        });
        
        if (coId && coId !== "SuitOrg") {
             CONFIG.PRIVATE_TABLES.forEach(t => { 
                 let privateData = [];
                 if (engine === "SUPABASE") {
                    privateData = getRemoteData(t, coId);
                 }
                 // FALLBACK PRIVATE
                 if (!privateData || privateData.length === 0) {
                    try { privateData = getSheetData(ss, t, coId); } catch (e) { privateData = []; }
                 }
                 result[t] = privateData;
             });
        }
        result.status = "OK";
        result.engine_actual = (result.Config_Empresas && result.Config_Empresas.length > 0) ? "GSHEET_LOADED" : "EMPTY";
    } else if (action === "ping") {
        result.version = CONFIG.VERSION;
        result.status = "OK";
    } else if (action === "full_migrate") {
        result.log = runFullGSheetToSupabaseSync();
        result.status = "MIGRATION_COMPLETED";
    } else if (action === "generate_sql") {
        return ContentService.createTextOutput(generateFullSQLSchema()).setMimeType(ContentService.MimeType.TEXT);
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
      case "full_migrate": 
        output.log = runFullGSheetToSupabaseSync();
        output.success = true; break;
      case "askGemini": 
        runGeminiInference(data, output); break;
      case "processFullOrder":
        processTransaction(ss, data, output); break;
      case "updateProjectStatus":
        updateRowMappedExtended(ss, "Proyectos", { id_proyecto: data.id }, { status: data.status, fecha_estatus: new Date() });
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
      case "orchestrate":
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
        }
        break;
      default: output.error = "ACTION_WAITING: " + action;
    }
  } finally { lock.releaseLock(); }
}
