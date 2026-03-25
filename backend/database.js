/* SuitOrg Backend - Database Module (v15.9.0)
 * ---------------------------------------------------------
 * Responsabilidad: Inicialización, Semillas (Seeds) y Depuración.
 * ---------------------------------------------------------
 */

function initializeDatabase(ss, output) {
  if (!ss) ss = getSS();
  
  // 🧩 LLAMADO MAESTRO A SEMILLAS HISTÓRICAS (v15.9.0)
  if (typeof runMasterSeeds === "function") {
    console.log("💎 Cargando Bóveda de Semillas Maestras...");
    runMasterSeeds(ss);
  }

  // Asegurar Agentes IA Críticos
  const agents = [
    { 
      id_agente: "AGT-PAPER-IMSS", nombre: "Estratega PA PER", 
      prompt_base: "Eres el ALMA de Martha Padrón de PA PER. No eres un bot administrativo, eres una ESTRATEGA DE CONFIANZA. \n\n" +
                   "TONO: Fluido y empático. Nunca pidas datos sin antes generar confianza.", 
      id_empresa: "PAPER", activo: "TRUE" 
    }
  ];
  agents.forEach(a => ensureSeed(ss, "Prompts_IA", "id_agente", a.id_agente, a));
  
  // 🔐 Asegurar Tabla Config_Auth para Aislamiento (v15.9.7)
  const authKeys = { 
    token_id: "INIT_TOKEN", 
    id_empresa: "SYSTEM", 
    nivel_acceso: "MASTER", 
    fecha_creacion: new Date(), 
    estado: "ACTIVO" 
  };
  ensureSeed(ss, "Config_Auth", "token_id", "INIT_TOKEN", authKeys);

  // Asegurar Estructuras de Auditoría Patrimonial (v15.4.0)
  const leadsSheet = ss.getSheetByName("Leads");
  if (leadsSheet) {
    const h = leadsSheet.getRange(1, 1, 1, leadsSheet.getLastColumn()).getValues()[0];
    const missing = ["apellido", "edad", "semanas_cotizadas", "referido_por", "nss", "curp", "rfc", "hora_llamada"].filter(f => h.indexOf(f) === -1);
    missing.forEach(f => {
      leadsSheet.insertColumnAfter(leadsSheet.getLastColumn()).getRange(1, leadsSheet.getLastColumn()+1).setValue(f);
    });
  }

  output.info = "Arquitectura Modular v15.9.0 ONLINE | Semillas Maestras Sincronizadas.";
  try { runAutoPurge(ss); } catch(e) { console.error("Purge fail: " + e.message); }
}

function runAutoPurge(ss) {
  var logSheet = ss.getSheetByName("Logs");
  if (!logSheet) return;
  var logData = logSheet.getDataRange().getValues();
  if (logData.length < 2) return;
  var now = new Date();
  for (var i = logData.length - 1; i >= 1; i--) {
    var rDate = new Date(logData[i][0]);
    if (!isNaN(rDate.getTime()) && (now - rDate) / (1000 * 60 * 60 * 24) > 30) logSheet.deleteRow(i + 1);
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
    if (String(data[i][idIdx]).toLowerCase().trim() === String(idVal).toLowerCase().trim()) { 
      exists = true; 
      break; 
    }
  }
  if (!exists) {
    appendRowMapped(ss, sheetName, dataObj);
    console.log("🌱 Semilla insertada: " + idVal);
  } else {
    // 🛡️ PROTECCIÓN DE DATOS: Si ya existe, NO sobreescribimos los cambios manuales del usuario.
    console.log("🛡️ Registro protegido (Ya existe): " + idVal);
  }
}
