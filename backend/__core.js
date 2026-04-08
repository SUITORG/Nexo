/* SuitOrg Backend - Orquestador Maestro (v16.3.8)
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
  PRIVATE_TABLES: ["Leads", "Proyectos", "Proyectos_Etapas", "Proyectos_Pagos", "Proyectos_Bitacora", "Catalogo", "Logs", "Pagos", "Empresa_Documentos", "Reservaciones", "Logs_Chat_IA", "Memoria_IA_Snapshots"],
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
    console.error("SUPABASE_FAIL:", e.message, "| Tabla:", tableName);
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
    var engine = "GSHEETS";
    if (coData && coData.length > 0 && coData[0].db_engine) {
      engine = coData[0].db_engine.toString().toUpperCase().trim();
    }
    result.engine_target = engine;
    console.log(`[ENGINE] coId=${coId} → engine=${engine}`);

    if (action === "getAll") {
      let source_log = {};

      // 1. Tablas Globales
      CONFIG.GLOBAL_TABLES.forEach(t => {
        let tableData = [];
        let source = "NONE";

        // Restricción selectiva: Solo estas 3 tablas intentan Supabase según el requerimiento actual
        const allowSupabase = ["Config_Empresas", "Config_SEO", "Config_Paginas"].includes(t);

        if (engine === "SUPABASE" && allowSupabase) {
          tableData = getRemoteData(t);
          if (tableData && tableData.length > 0) {
            source = "SUPABASE_CLOUD";
          } else {
            console.warn(`[SUPABASE_FAIL] Tabla: ${t} - Activando Fallback a GSheet...`);
          }
        }

        // Fallback Tabla por Tabla
        if (source === "NONE") {
          try {
            tableData = getSheetData(ss, t);
            source = "GSHEET_LOCAL";
          } catch (e) {
            source = "CRITICAL_ERROR";
            tableData = [];
          }
        }

        // Lógica especial de Usuarios
        if (t === "Usuarios") {
          try {
            const sudoUsers = getSheetData(ss, "MAESTRO_SUDO");
            if (sudoUsers && sudoUsers.length > 0) tableData = (tableData || []).concat(sudoUsers);
          } catch (e) { }

          const rescueUser = {
            id_usuario: "SUDO-MASTER", nombre: "Administrador Recuperación",
            email: "admin", pass: "Admin2020!S", id_rol: "DIOS",
            nivel_acceso: 99, id_empresa: "GLOBAL", habilitado: "TRUE"
          };
          tableData.push(rescueUser);
        }

        result[t] = tableData;
        source_log[t] = source;
      });

      // 2. Tablas Privadas
      if (coId && coId !== "SuitOrg") {
        CONFIG.PRIVATE_TABLES.forEach(t => {
          let privateData = [];
          let pSource = "NONE";

          if (engine === "SUPABASE") {
            privateData = getRemoteData(t, coId);
            if (privateData && privateData.length > 0) pSource = "SUPABASE_CLOUD";
          }

          if (pSource === "NONE") {
            try {
              privateData = getSheetData(ss, t, coId);
              pSource = "GSHEET_LOCAL";
            } catch (e) { pSource = "ERROR"; privateData = []; }
          }
          result[t] = privateData;
          source_log[t] = pSource;
        });
      }

      result.status = "OK";
      result.backend_log = source_log; // Log de auditoría para el frontend
    } else if (action === "ping") {
      result.version = CONFIG.VERSION;
      result.status = "OK";
    } else if (action === "full_migrate") {
      result.log = runFullGSheetToSupabaseSync();
      result.status = "MIGRATION_COMPLETED";
    } else if (action === "generate_sql") {
      return ContentService.createTextOutput(generateFullSQLSchema()).setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (err) {
    result.status = "FATAL_ERROR";
    result.error = err.toString();
    console.error("DIAGNOSTICO_DOGET_FAIL:", err.toString());
  }
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
