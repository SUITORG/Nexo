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
 * 💰 POS / CAJA / EXPRESS (Lógica Restaurada v15.9.1)
 */
function processTransaction(ss, data, output) {
  var leadId = (data.lead && data.lead.id_lead) ? data.lead.id_lead : ("LEAD-" + (ss.getSheetByName("Leads").getLastRow() + 99));
  if (data.lead && !data.lead.id_lead) {
     data.lead.id_lead = leadId;
     appendRowMapped(ss, "Leads", data.lead);
  }
  
  var projSheet = ss.getSheetByName("Proyectos");
  var nextNum = projSheet.getLastRow() + 99;
  var projId = "ORD-" + nextNum;
  
  data.project.id_proyecto = projId;
  data.project.status = data.project.status || "RECIBIDO";
  data.project.fecha_inicio = new Date();
  appendRowMapped(ss, "Proyectos", data.project);
  
  // CAJA: Gestión de pagos y cambio
  if (data.payment) {
     var payObj = {
       id_empresa: data.id_empresa, id_proyecto: projId, id_cliente: leadId,
       monto: data.payment.monto, metodo_pago: data.payment.metodo || "Efectivo",
       referencia: data.payment.cambio ? ("Pago con: " + data.payment.recibido + " | Cambio: " + data.payment.cambio) : "Pago Directo",
       fecha_pago: new Date()
     };
     appendRowMapped(ss, "Pagos", payObj);
  }

  // STOCK: Salida automática de artículos
  if (data.items && data.items.length > 0) {
    var catSheet = ss.getSheetByName("Catalogo");
    var catData = catSheet.getDataRange().getValues();
    var catHeaders = catData[0].map(h => String(h).toLowerCase().trim());
    var stockIdx = catHeaders.indexOf("stock");
    var idCodeIdx = catHeaders.indexOf("id_codigo");

    data.items.forEach(item => {
      for (var i = 1; i < catData.length; i++) {
        if (String(catData[i][idCodeIdx]) === String(item.id_codigo)) {
           var cur = Number(catData[i][stockIdx]) || 0;
           catSheet.getRange(i + 1, stockIdx + 1).setValue(cur - (Number(item.cantidad) || 0));
           break;
        }
      }
    });
  }

  output.newOrderId = projId;
  output.success = true;
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
