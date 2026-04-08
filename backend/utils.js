/* SuitOrg Backend - Utilities Module (v15.9.1)
 * ---------------------------------------------------------
 * Responsabilidad: Gestión de Datos & Lógica POS/Caja.
 * ---------------------------------------------------------
 */

function getSheetData(ss, sheetName, filterId) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; 
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var result = [];
  var coIdx = headers.indexOf('id_empresa');
  for (var i = 1; i < data.length; i++) {
    if (filterId && coIdx !== -1) {
      if (String(data[i][coIdx]).trim().toUpperCase() !== filterId.toUpperCase() && String(data[i][coIdx]).trim().toUpperCase() !== 'GLOBAL') continue;
    }
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = data[i][j];
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
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toUpperCase() === String(idVal).trim().toUpperCase()) { rowI = i + 1; break; }
  }
  if (rowI === -1) throw new Error("Not Found: " + idVal);
  for (var k in dataObj) {
    var cIdx = headers.indexOf(k.toLowerCase().trim().replace(/\s+/g, '_'));
    if (cIdx !== -1) sheet.getRange(rowI, cIdx + 1).setValue(dataObj[k]);
  }
}

function updateRowMappedExtended(ss, sheetName, filters, dataObj) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var rowI = -1;
  for (var i = 1; i < data.length; i++) {
    var match = true;
    for (var key in filters) {
      if (String(data[i][headers.indexOf(key.toLowerCase())]).trim().toUpperCase() !== String(filters[key]).trim().toUpperCase()) { match = false; break; }
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

function deleteRowMapped(ss, sheetName, idCol, idVal) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  var idIdx = headers.indexOf(idCol.toLowerCase().trim());
  var rowI = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toUpperCase() === String(idVal).trim().toUpperCase()) { 
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * 💰 POS / CAJA / EXPRESS (MIGRACIÓN SUPABASE v16.7.0)
 * Escribe primero a Supabase, luego replica a GSheets como respaldo
 */
function processTransaction(ss, data, output) {
  var coId = data.lead?.id_empresa || data.project?.id_empresa || "GLOBAL";

  // =====================================================================
  // 1. DETECTAR MOTOR DE DATOS
  // =====================================================================
  var configData = getSheetData(ss, "Config_Empresas", coId);
  var company = configData && configData.length > 0 ? configData[0] : {};
  var dbEngine = String(company.db_engine || company.dbengine || "GSHEETS").toUpperCase();
  var useSupabase = dbEngine === "SUPABASE";

  if (useSupabase) {
    try {
      processTransactionSupabase(ss, data, output, coId);
      // Replicar a GSheets como backup (background)
      processTransactionGSheets(ss, data, output, true);
      return;
    } catch (sbErr) {
      console.error("[SUPABASE_FAIL] Fallback a GSheets:", sbErr.message);
      // Fallback automático a GSheets si Supabase falla
    }
  }

  // =====================================================================
  // 2. FALLBACK A GSHEETS (comportamiento original)
  // =====================================================================
  processTransactionGSheets(ss, data, output, false);
}

/**
 * 💰 PROCESAR TRANSACCIÓN EN SUPABASE
 */
function processTransactionSupabase(ss, data, output, coId) {
  var SB_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');
  var SB_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL') || 'https://egyxgnlnzanxpqyuvmsg.supabase.co';

  if (!SB_KEY) throw new Error("SUPABASE_KEY no configurada en Script Properties");

  var headers = {
    "Content-Type": "application/json",
    "apikey": SB_KEY,
    "Authorization": "Bearer " + SB_KEY,
    "Prefer": "return=representation"
  };

  // 1. INSERTAR LEAD
  var leadId = data.lead?.id_lead || ("LEAD-" + Date.now());
  var leadPayload = {
    id_lead: leadId,
    id_empresa: coId,
    fecha: new Date().toISOString(),
    nombre: data.lead?.nombre || "",
    email: data.lead?.email || "",
    telefono: data.lead?.telefono || "",
    direccion: data.lead?.direccion || "",
    origen: data.lead?.origen || "POS",
    nivel_crm: data.lead?.nivel_crm || 0,
    status: "NUEVO"
  };
  var leadRes = UrlFetchApp.fetch(SB_URL + "/rest/v1/Leads", {
    method: "post",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify(leadPayload),
    muteHttpExceptions: true
  });
  if (leadRes.getResponseCode() !== 201 && leadRes.getResponseCode() !== 200) {
    console.warn("[SUPABASE] Lead insert falló:", leadRes.getContentText());
  }

  // 2. INSERTAR PROYECTO/PEDIDO
  var projId = data.project?.id_proyecto || ("PED-" + Date.now());
  data.project.id_proyecto = projId;
  data.project.status = data.project.status || "PEDIDO-RECIBIDO";
  data.project.estado = data.project.estado || "PEDIDO-RECIBIDO";
  data.project.estatus = data.project.estatus || "PEDIDO-RECIBIDO";
  data.project.fecha_estatus = new Date().toISOString();
  data.project.activo = "TRUE";

  var projPayload = {
    id_proyecto: projId,
    id_empresa: coId,
    id_cliente: leadId,
    nombre_proyecto: data.project.nombre_proyecto || "Pedido POS",
    direccion: data.project.direccion || "",
    telefono: data.project.telefono || "",
    descripcion: data.project.descripcion || "",
    line_items: typeof data.project.line_items === "string" ? JSON.parse(data.project.line_items) : (data.project.line_items || []),
    codigo_otp: data.project.codigo_otp || "",
    status: data.project.status,
    estado: data.project.estado,
    estatus: data.project.estatus,
    fecha_estatus: new Date().toISOString()
  };
  var projRes = UrlFetchApp.fetch(SB_URL + "/rest/v1/Proyectos", {
    method: "post",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify(projPayload),
    muteHttpExceptions: true
  });
  if (projRes.getResponseCode() !== 201 && projRes.getResponseCode() !== 200) {
    console.error("[SUPABASE] Proyecto insert falló:", projRes.getContentText());
  }

  // 3. INSERTAR PAGO
  if (data.payment) {
    var payId = "PAY-" + Date.now();
    var payPayload = {
      id_pago: payId,
      id_empresa: coId,
      id_proyecto: projId,
      monto: parseFloat(data.payment.monto) || 0,
      metodo_pago: data.payment.metodo_pago || "Efectivo",
      folio: data.payment.folio || "CAJA",
      referencia: data.payment.referencia || "POS",
      fecha_pago: new Date().toISOString(),
      pago_con: parseFloat(data.payment.pago_con) || 0,
      cambio: parseFloat(data.payment.cambio) || 0
    };
    var payRes = UrlFetchApp.fetch(SB_URL + "/rest/v1/Pagos", {
      method: "post",
      contentType: "application/json",
      headers: headers,
      payload: JSON.stringify(payPayload),
      muteHttpExceptions: true
    });
    if (payRes.getResponseCode() !== 201 && payRes.getResponseCode() !== 200) {
      console.warn("[SUPABASE] Pago insert falló:", payRes.getContentText());
    }

    // 4. INSERTAR EN Proyectos_Pagos
    var projPagoPayload = {
      id_empresa: coId,
      id_pago: payId,
      id_proyecto: projId,
      monto: payPayload.monto,
      concepto: data.payment.concepto || "Venta POS",
      metodo_pago: payPayload.metodo_pago,
      folio: payPayload.folio,
      referencia: payPayload.referencia,
      fecha_pago: payPayload.fecha_pago,
      activo: "TRUE",
      pago_con: payPayload.pago_con,
      cambio: payPayload.cambio
    };
    UrlFetchApp.fetch(SB_URL + "/rest/v1/Proyectos_Pagos", {
      method: "post",
      contentType: "application/json",
      headers: headers,
      payload: JSON.stringify(projPagoPayload),
      muteHttpExceptions: true
    });
  }

  // 5. ACTUALIZAR STOCK en Catalogo
  if (data.stockUpdates && data.stockUpdates.length > 0) {
    data.stockUpdates.forEach(function(item) {
      var fetchUrl = SB_URL + "/rest/v1/Catalogo?id_producto=eq." + item.id_producto + "&id_empresa=eq." + item.id_empresa;
      UrlFetchApp.fetch(fetchUrl, {
        method: "patch",
        contentType: "application/json",
        headers: headers,
        payload: JSON.stringify({ stock: item.stock }),
        muteHttpExceptions: true
      });
    });
  }

  output.newOrderId = projId;
  output.success = true;
  output.source = "SUPABASE";
}

/**
 * 💰 PROCESAR TRANSACCIÓN EN GSHEETS (fallback/respaldo)
 */
function processTransactionGSheets(ss, data, output, isBackup) {
  var leadId = (data.lead && data.lead.id_lead) ? data.lead.id_lead : ("LEAD-" + (ss.getSheetByName("Leads").getLastRow() + 99));
  if (data.lead && !data.lead.id_lead) {
     data.lead.id_lead = leadId;
     appendRowMapped(ss, "Leads", data.lead);
  }

  var projSheet = ss.getSheetByName("Proyectos");
  var nextNum = projSheet.getLastRow() + 99;
  var projId = data.project?.id_proyecto || ("ORD-" + nextNum);

  data.project.id_proyecto = projId;
  data.project.status = data.project.status || "RECIBIDO";
  data.project.fecha_inicio = new Date();
  appendRowMapped(ss, "Proyectos", data.project);

  // CAJA: Gestión de pagos y cambio
  if (data.payment) {
     var payObj = {
       id_empresa: data.project?.id_empresa || "GLOBAL",
       id_proyecto: projId,
       id_cliente: leadId,
       monto: data.payment.monto,
       metodo_pago: data.payment.metodo_pago || "Efectivo",
       folio: data.payment.folio || "CAJA",
       referencia: data.payment.referencia || (data.payment.cambio ? ("Pago con: " + data.payment.pago_con + " | Cambio: " + data.payment.cambio) : "Pago Directo"),
       fecha_pago: new Date(),
       pago_con: data.payment.pago_con || 0,
       cambio: data.payment.cambio || 0
     };
     appendRowMapped(ss, "Pagos", payObj);

     // También en Proyectos_Pagos
     var projPagoObj = {
       id_empresa: data.project?.id_empresa || "GLOBAL",
       id_pago: "PAY-" + Date.now(),
       id_proyecto: projId,
       monto: data.payment.monto,
       concepto: data.payment.concepto || "Venta POS",
       metodo_pago: payObj.metodo_pago,
       folio: payObj.folio,
       referencia: payObj.referencia,
       fecha_pago: new Date(),
       activo: "TRUE",
       pago_con: payObj.pago_con,
       cambio: payObj.cambio
     };
     appendRowMapped(ss, "Proyectos_Pagos", projPagoObj);
  }

  // STOCK: Salida automática de artículos
  if (data.stockUpdates && data.stockUpdates.length > 0) {
    var catSheet = ss.getSheetByName("Catalogo");
    var catData = catSheet.getDataRange().getValues();
    var catHeaders = catData[0].map(h => String(h).toLowerCase().trim());
    var idProdIdx = catHeaders.indexOf("id_producto");
    var empIdx = catHeaders.indexOf("id_empresa");
    var stockIdx = catHeaders.indexOf("stock");

    data.stockUpdates.forEach(function(item) {
      for (var i = 1; i < catData.length; i++) {
        var rowProd = String(catData[i][idProdIdx]).trim();
        var rowEmp = String(catData[i][empIdx]).trim();
        if (rowProd === String(item.id_producto) && rowEmp === String(item.id_empresa)) {
           var cur = Number(catData[i][stockIdx]) || 0;
           catSheet.getRange(i + 1, stockIdx + 1).setValue(cur - (Number(item.stock) || 0));
           break;
        }
      }
    });
  }

  output.newOrderId = projId;
  output.success = true;
  output.source = isBackup ? "GSHEETS_BACKUP" : "GSHEETS";
}

function syncToSupabase(ss, coId) {
  const SB_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');
  if(!SB_KEY) return;
  ['Catalogo', 'Leads', 'Proyectos'].forEach(t => {
    try {
      var d = getSheetData(ss, t, coId);
      if (d.length) UrlFetchApp.fetch(`https://hmrpotibipxhsnowgjvq.supabase.co/rest/v1/${t}`, {
        method: "post", contentType: "application/json", headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Prefer": "resolution=merge-duplicates" },
        payload: JSON.stringify(d)
      });
    } catch (e) {}
  });
}
