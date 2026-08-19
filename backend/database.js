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
    },
    {
      id_agente: "AGT-ROOMMATENL", nombre: "Huizcro",
      prompt_base: "Eres Huizcro, el asistente virtual de RoommateNL. Tu personalidad es amigable, profesional y servicial.\n\n" +
                   "MISIÓN: Ayudar a los clientes a encontrar la habitación ideal, responder dudas sobre precios, ubicación y servicios, y recopilar sus datos de contacto (nombre, teléfono, email) para que un asesor los contacte.\n\n" +
                   "REGLAS:\n" +
                   "- Preséntate siempre como Huizcro al inicio de la conversación.\n" +
                   "- Sé cálido y natural, como un concierge de confianza.\n" +
                   "- No inventes precios ni disponibilidad que no estén en el contexto.\n" +
                   "- Cuando tengas nombre + teléfono, confirma que un asesor se comunicará pronto.\n" +
                   "- Si el usuario comparte datos, responde con [LEAD] nombre, teléfono, email para que el sistema los registre.\n\n" +
                   "TONO: Conversacional, empático, servicial. Habla en español neutro.",
      id_empresa: "ROOMMATENL", activo: "TRUE"
    }
  ];
  agents.forEach(a => ensureSeed(ss, "Prompts_IA", "id_agente", a.id_agente, a));
  
  // 💳 Asegurar columnas Stripe en Config_Empresas y Pagos (v16.0.0)
  var empresasSheet = ss.getSheetByName("Config_Empresas");
  if (empresasSheet) {
    var eHeaders = empresasSheet.getRange(1, 1, 1, empresasSheet.getLastColumn()).getValues()[0];
    var stripeCols = ["stripe_activo", "stripe_public_key", "usa_estilos_visuales"];
    stripeCols.forEach(function(col) {
      if (eHeaders.indexOf(col) === -1) {
        empresasSheet.getRange(1, empresasSheet.getLastColumn() + 1).setValue(col);
      }
    });
  }
  ["Pagos", "Proyectos_Pagos"].forEach(function(sheetName) {
    var paySheet = ss.getSheetByName(sheetName);
    if (paySheet) {
      var pHeaders = paySheet.getRange(1, 1, 1, paySheet.getLastColumn()).getValues()[0];
      if (pHeaders.indexOf("referencia_stripe") === -1) {
        paySheet.getRange(1, paySheet.getLastColumn() + 1).setValue("referencia_stripe");
      }
    }
  });

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
    const missing = ["id_visitante", "id_conversacion", "apellido", "edad", "fecha_nacimiento", "semanas_cotizadas", "referido_por", "nss", "curp", "rfc", "hora_llamada", "current_phase", "suit_index"].filter(f => h.indexOf(f) === -1);
    missing.forEach(f => {
      leadsSheet.insertColumnAfter(leadsSheet.getLastColumn()).getRange(1, leadsSheet.getLastColumn()+1).setValue(f);
    });
  }

  // Asegurar columna billing_type en Catalogo (v16.7.28)
  const catSheet = ss.getSheetByName("Catalogo");
  if (catSheet) {
    const catH = catSheet.getRange(1, 1, 1, catSheet.getLastColumn()).getValues()[0];
    if (catH.indexOf("billing_type") === -1) {
      catSheet.insertColumnAfter(catSheet.getLastColumn()).getRange(1, catSheet.getLastColumn()+1).setValue("billing_type");
    }
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
    console.log("🛡️ Registro protegido (Ya existe): " + idVal);
  }
}

function autoCrearRegistrosSUDO(ss, idEmpresa, nombreEmpresa) {
  if (!idEmpresa || !idEmpresa.toString().trim()) return;
  idEmpresa = idEmpresa.toString().trim().toUpperCase();
  nombreEmpresa = (nombreEmpresa || idEmpresa).toString().trim();
  var email = 'admin@' + idEmpresa.toLowerCase() + '.com';
  var fecha = new Date().toISOString();

  var rolesSheet = ss.getSheetByName("Config_Roles");
  if (rolesSheet) {
    var rolExistente = false;
    var rData = rolesSheet.getDataRange().getValues();
    var rHeaders = rData[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
    var rRoleIdx = rHeaders.indexOf('id_rol');
    var rEmpIdx = rHeaders.indexOf('id_empresa');
    if (rRoleIdx !== -1 && rEmpIdx !== -1) {
      for (var i = 1; i < rData.length; i++) {
        if (String(rData[i][rEmpIdx]).trim().toUpperCase() === idEmpresa &&
            String(rData[i][rRoleIdx]).trim().toUpperCase() === 'SUDO') {
          rolExistente = true;
          break;
        }
      }
    }
    if (!rolExistente) {
      appendRowMapped(ss, "Config_Roles", {
        id_rol: "SUDO",
        id_empresa: idEmpresa,
        nivel_acceso: 999,
        modulos_visibles: "pos,leads,projects,catalog,cotizador,reports,vault,quotas",
        creditos_base: 99999,
        activo: "TRUE",
        fecha_creacion: fecha
      });
      console.log("✅ Rol SUDO creado para " + idEmpresa);
    }
  }

  var userSheet = ss.getSheetByName("Usuarios");
  if (!userSheet) return;
  var userExistente = false;
  var uData = userSheet.getDataRange().getValues();
  var uHeaders = uData[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var uEmpIdx = uHeaders.indexOf('id_empresa');
  var uNameIdx = uHeaders.indexOf('username');
  if (uEmpIdx !== -1 && uNameIdx !== -1) {
    for (var j = 1; j < uData.length; j++) {
      if (String(uData[j][uEmpIdx]).trim().toUpperCase() === idEmpresa &&
          String(uData[j][uNameIdx]).trim().toLowerCase() === 'sudo') {
        userExistente = true;
        break;
      }
    }
  }
  if (!userExistente) {
    appendRowMapped(ss, "Usuarios", {
      id_empresa: idEmpresa,
      nombre: "Super Admin",
      email: email,
      username: "sudo",
      password: "Sudo1234.",
      nivel_acceso: 999,
      id_rol: "SUDO",
      activo: "TRUE",
      fecha_creacion: fecha
    });
    console.log("✅ Usuario SUDO creado para " + idEmpresa + " (" + email + ")");
  }
}

function onEdit(e) {
  if (!e || !e.range) return;
  var ss = e.source;
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  if (sheetName !== "Config_Empresas") return;
  var row = e.range.getRow();
  if (row < 2) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerMap = {};
  for (var h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  var idColIdx = headerMap['id_empresa'];
  if (idColIdx === undefined) return;
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var nuevoId = String(rowData[idColIdx] || "").trim();
  if (!nuevoId) return;
  var nameColIdx = headerMap['nomempresa'];
  var nuevoNombre = nameColIdx !== undefined ? String(rowData[nameColIdx] || "").trim() : nuevoId;
  autoCrearRegistrosSUDO(ss, nuevoId, nuevoNombre);
}

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('SuitOrg')
      .addItem('Activar SUDO para todas las empresas', 'aplicarSUDOaTodas')
      .addSeparator()
      .addItem('Generar SUDO para empresa activa', 'generarSUDOparaSeleccion')
      .addToUi();
  } catch(e) {}
}

function avisar(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch(e) { console.log(msg); }
}

function aplicarSUDOaTodas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) ss = getSS();
  var sheet = ss.getSheetByName("Config_Empresas");
  if (!sheet) { avisar("No existe la hoja Config_Empresas"); return; }
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim().replace(/\s+/g, '_'); });
  var idIdx = headers.indexOf('id_empresa');
  var nameIdx = headers.indexOf('nomempresa');
  if (idIdx === -1) { avisar("No se encontró columna id_empresa"); return; }
  for (var i = 1; i < data.length; i++) {
    var idEmp = String(data[i][idIdx] || "").trim();
    if (!idEmp) continue;
    var nomEmp = nameIdx !== -1 ? String(data[i][nameIdx] || "").trim() : idEmp;
    autoCrearRegistrosSUDO(ss, idEmp, nomEmp);
  }
  avisar("SUDO aplicado a todas las empresas. Revisa Usuarios y Config_Roles.");
}

function generarSUDOparaSeleccion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) ss = getSS();
  var sheet = ss.getActiveSheet();
  if (sheet.getName() !== "Config_Empresas") {
    avisar("Selecciona una celda en la hoja Config_Empresas");
    return;
  }
  var row = sheet.getActiveRange().getRow();
  if (row < 2) { avisar("Selecciona una fila de datos (no el encabezado)"); return; }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerMap = {};
  for (var h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  var idIdx = headerMap['id_empresa'];
  var nameIdx = headerMap['nomempresa'];
  if (idIdx === undefined) { avisar("No se encontró columna id_empresa"); return; }
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idEmp = String(rowData[idIdx] || "").trim();
  if (!idEmp) { avisar("La celda id_empresa está vacía"); return; }
  var nomEmp = nameIdx !== undefined ? String(rowData[nameIdx] || "").trim() : idEmp;
  autoCrearRegistrosSUDO(ss, idEmp, nomEmp);
  avisar("SUDO generado para " + idEmp + ". Revisa Usuarios y Config_Roles.");
}
