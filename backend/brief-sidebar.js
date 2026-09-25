/**
 * brief-sidebar.js — Google Apps Script Sidebar para generación de Brief.
 *
 * Agregar al proyecto GAS existente. Desde el editor de GAS:
 *   Ejecutar: showBriefSidebar()
 *   Menú: Brief > Generar Brief (abre sidebar)
 *
 * Lee Config_Empresas.logo_url y muestra el vector parseado.
 * El agente IA (OpenCode/Claude Code) ejecuta la generación real.
 */

// ── Brief field definitions ─────────────────────────────────────────────
const BRIEF_FIELDS = [
  'industria', 'nicho', 'especializacion', 'vendes', 'audiencia',
  'dolor', 'PBP', 'lograr', 'vivir', 'LAPVTFU', 'PM', 'objecion',
  'competidores', 'tono', 'PS', 'RLP', 'slogan', 'oferta',
  'descripcion', 'cta', 'tipografia'
];

// ── Helper: obtener Spreadsheet en scripts standalone ──────────────────
// En un sidebar, getActiveSpreadsheet() SÍ funciona porque se abre desde la hoja.
// Fallback a openById() por si acaso.
function getSidebarSS() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch(e) {}
  return SpreadsheetApp.openById('1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8');
}

// ── PROXY FUNCTIONS (llamadas desde sidebar HTML vía google.script.run) ──
// Estas funciones en GAS hacen fetch a Node.js. UrlFetchApp corre en la nube de
// Google, no en la PC del usuario — 'localhost' NO sirve acá (Error DNS
// confirmado en vivo). Usa un túnel público (cloudflared) hacia el server real.
// Si el túnel se reinicia, la URL cambia: actualiza la Script Property
// NODE_BASE_URL (Configuración del proyecto > Propiedades del script) en vez
// de tocar código.

// Valida la property: localhost/127.0.0.1 no sirve desde UrlFetchApp (nube) → DNS error.
// Si la property está vacía o apunta a la PC local, usa el túnel vivo.
const NODE_BASE_URL = (function () {
  const v = (getConfigValue('NODE_BASE_URL') || '').trim();
  if (!v || /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(v) || /knock-align-relation-test/.test(v) || /kitty-accessibility-packaging-semiconductor/.test(v)) {
    return 'https://reservation-ross-checks-douglas.trycloudflare.com';
  }
  return v;
})();

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

function generateBriefViaNode(idEmpresa) {
  return fetchNode('/api/brief/generate', { id_empresa: idEmpresa });
}

function writeBriefVectorViaNode(idEmpresa, vector) {
  return fetchNode('/api/brief/write', { id_empresa: idEmpresa, vector: vector });
}

function saveBriefMetadataViaNode(idEmpresa, vector, confianza) {
  return fetchNode('/api/brief/metadata', { id_empresa: idEmpresa, vector: vector, confianza: confianza });
}

function generateAssetsViaNode(idEmpresa) {
  return fetchNode('/api/brief/assets', { id_empresa: idEmpresa });
}

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

function ensureLogoViaNode(idEmpresa) {
  return fetchNode('/api/brief/ensure-logo', { id_empresa: idEmpresa });
}

function ensureAvatarViaNode(idEmpresa) {
  return fetchNode('/api/brief/ensure-avatar', { id_empresa: idEmpresa });
}

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

// ── Menu Brief (se llama desde onOpen de database.js) ─────────────
function addToMenuBrief(ui) {
  ui = ui || SpreadsheetApp.getUi();
  ui.createMenu(' Brief')
    .addItem('🔍 Ver Brief (sidebar)', 'showBriefSidebar')
    .addItem('⚡ Generar Brief (IA)', 'generarBriefDesdeMenu')
    .addItem('🖼️ Generar Assets (LAPVTFU)', 'generarAssetsDesdeMenu')
    .addItem('📋 Copiar Vector', 'copiarVectorDesdeMenu')
    .addItem('📊 Resumen Confianza', 'mostrarResumenConfianza')
    .addItem('🔄 Revisar Pendientes', 'mostrarPendientes')
    .addItem('📥 Importar Brief (JSON)', 'importarBriefJSON')
    .addItem('📤 Exportar Brief (JSON)', 'exportarBriefJSON')
    .addItem('🔗 Share Brief (link)', 'shareBriefLink')
    .addItem('📈 Historial de Cambios', 'mostrarHistorialBrief')
    .addToUi();
}

// ── Show Brief Sidebar ──────────────────────────────────────────────────
function showBriefSidebar() {
  const html = HtmlService.createHtmlOutput(getBriefSidebarHtml())
    .setTitle('Brief Generator')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ── Validate Brief for active company ───────────────────────────────────
function validarBriefSeleccion() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Selecciona una fila de datos (no el encabezado)');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }

  const idIdx = headerMap['id_empresa'];
  const logoIdx = headerMap['logo_url'];
  if (idIdx === undefined) {
    SpreadsheetApp.getUi().alert('No se encontró columna id_empresa');
    return;
  }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  const logoUrl = logoIdx !== undefined ? String(rowData[logoIdx] || '').trim() : '';

  if (!idEmpresa) {
    SpreadsheetApp.getUi().alert('La celda id_empresa está vacía');
    return;
  }

  // Parse brief
  const result = parseBriefLocal(logoUrl);
  const filled = result.fields.filter(f => f.value && !f.value.includes('[PENDIENTE')).length;
  const total = BRIEF_FIELDS.length;

  let msg = `Brief de ${idEmpresa}\n\n`;
  msg += `Campos: ${filled}/${total} completos\n`;
  msg += `Confianza A: ${result.confidence.A} | B: ${result.confidence.B} | C: ${result.confidence.C}\n\n`;

  result.fields.forEach(f => {
    const icon = f.value.includes('[PENDIENTE') ? '[PENDIENTE]' : f.confidence;
    const preview = f.value.length > 40 ? f.value.substring(0, 40) + '...' : f.value;
    msg += `${f.index}. ${f.name}: ${icon} ${preview}\n`;
  });

  SpreadsheetApp.getUi().alert(msg);
}

// ── Parse brief locally (pipe-delimited) ────────────────────────────────
function parseBriefLocal(vector) {
  const fields = [];
  const confidence = { A: 0, B: 0, C: 0 };

  if (!vector || vector.trim() === '') {
    return {
      fields: BRIEF_FIELDS.map((name, i) => ({
        index: i + 1,
        name: name,
        value: `[PENDIENTE - Activo]`,
        confidence: 'C'
      })),
      confidence: { A: 0, B: 0, C: 21 }
    };
  }

  const parts = vector.split('|');
  BRIEF_FIELDS.forEach((name, i) => {
    let value = (parts[i] || '').trim();
    if (!value) value = '[PENDIENTE - Activo]';

    let conf = 'C';
    if (value.includes('[A]')) { conf = 'A'; confidence.A++; }
    else if (value.includes('[B]')) { conf = 'B'; confidence.B++; }
    else if (!value.includes('[PENDIENTE')) { confidence.C++; }

    fields.push({ index: i + 1, name: name, value: value, confidence: conf });
  });

  return { fields, confidence };
}

// ── Menu item: Generar Brief desde menú (sin sidebar) ────────────────────
function generarBriefDesdeMenu() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    ui.alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  if (idIdx === undefined) { ui.alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  if (!idEmpresa) { ui.alert('La celda id_empresa está vacía'); return; }

  const resp = ui.alert('Generar Brief', 'Esto generará el Brief de ' + idEmpresa + ' con IA.\n¿Continuar?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  ui.alert('Abre el sidebar "⚡ Generar Brief" para ver el progreso.\nMenú > Brief > ⚡ Generar Brief (IA)');
}

// ── Menu item: Generar Assets LAPVTFU desde menú ────────────────────────
function generarAssetsDesdeMenu() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    ui.alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  if (idIdx === undefined) { ui.alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  if (!idEmpresa) { ui.alert('La celda id_empresa está vacía'); return; }

  const resp = ui.alert('Generar Assets', 'Esto generará los 7 activos LAPVTFU de ' + idEmpresa + ' en Drive.\n¿Continuar?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  ui.alert('Abre el sidebar "🖼️ Generar Assets" para ver el progreso.\nMenú > Brief > 🖼️ Generar Assets (LAPVTFU)');
}

// ── Menu item: Copiar Vector desde menú ──────────────────────────────────
function copiarVectorDesdeMenu() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  const logoIdx = headerMap['logo_url'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const logoUrl = logoIdx !== undefined ? String(rowData[logoIdx] || '').trim() : '';

  if (!logoUrl) { SpreadsheetApp.getUi().alert('No hay vector para copiar'); return; }

  // Copiar al portapapeles usando Google Apps Script
  const html = HtmlService.createHtmlOutput('<script>navigator.clipboard.writeText("' + logoUrl.replace(/"/g, '\\"') + '").then(()=>google.script.host.close())</script>');
  SpreadsheetApp.getUi().showModalDialog(html, 'Copiando...');
  SpreadsheetApp.getUi().alert('Vector copiado al portapapeles');
}

// ── Menu item: Resumen Confianza ─────────────────────────────────────────
function mostrarResumenConfianza() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  const logoIdx = headerMap['logo_url'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  const logoUrl = logoIdx !== undefined ? String(rowData[logoIdx] || '').trim() : '';

  const result = parseBriefLocal(logoUrl);
  const conf = result.confidence;
  const total = conf.A + conf.B + conf.C;
  const pctA = total > 0 ? Math.round(conf.A / total * 100) : 0;
  const pctB = total > 0 ? Math.round(conf.B / total * 100) : 0;
  const pctC = total > 0 ? Math.round(conf.C / total * 100) : 0;

  let msg = `📊 Resumen de Confianza — ${idEmpresa}\n\n`;
  msg += `✅ A (Datos del cliente): ${conf.A} campos (${pctA}%)\n`;
  msg += `🔍 B (Inferido con fuente): ${conf.B} campos (${pctB}%)\n`;
  msg += `💡 C (Propuesta creativa): ${conf.C} campos (${pctC}%)\n\n`;

  if (conf.C > conf.A) {
    msg += '⚠️ Muchos campos son propuestas creativas.\n';
    msg += '   Edita el Brief para confirmar o ajustar.';
  } else if (conf.A > conf.B + conf.C) {
    msg += '✅ Brief mayormente basado en datos reales.';
  }

  SpreadsheetApp.getUi().alert(msg);
}

// ── Menu item: Revisar Pendientes ────────────────────────────────────────
function mostrarPendientes() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  const logoIdx = headerMap['logo_url'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  const logoUrl = logoIdx !== undefined ? String(rowData[logoIdx] || '').trim() : '';

  const result = parseBriefLocal(logoUrl);
  const pendientes = result.fields.filter(f => f.value.includes('[PENDIENTE'));

  let msg = `🔄 Pendientes — ${idEmpresa}\n\n`;
  if (pendientes.length === 0) {
    msg += '✅ Todos los campos están completos.';
  } else {
    msg += `${pendientes.length} campos pendientes:\n\n`;
    pendientes.forEach(f => {
      msg += `  ${f.index}. ${f.name}\n`;
    });
    msg += '\nEdita el Brief en el sidebar para completarlos.';
  }

  SpreadsheetApp.getUi().alert(msg);
}

// ── Menu item: Importar Brief (JSON) ─────────────────────────────────────
function importarBriefJSON() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Importar Brief', 'Pega el JSON del Brief:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const jsonStr = response.getResponseText().trim();
  if (!jsonStr) { ui.alert('No se ingresó JSON'); return; }

  try {
    const brief = JSON.parse(jsonStr);
    const sheet = SpreadsheetApp.getActiveSheet();
    if (sheet.getName() !== 'Config_Empresas') {
      ui.alert('Selecciona una fila en Config_Empresas');
      return;
    }
    const row = sheet.getActiveRange().getRow();
    if (row < 2) { ui.alert('Selecciona una fila de datos'); return; }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headerMap = {};
    for (let h = 0; h < headers.length; h++) {
      headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
    }
    const idIdx = headerMap['id_empresa'];
    const logoIdx = headerMap['logo_url'];
    if (idIdx === undefined || logoIdx === undefined) {
      ui.alert('Faltan columnas id_empresa o logo_url');
      return;
    }

    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idEmpresa = String(rowData[idIdx] || '').trim();

    // Construir vector desde JSON
    const BRIEF_FIELD_ORDER = [
      'industria', 'nicho', 'especializacion', 'vendes', 'audiencia',
      'dolor', 'PBP', 'lograr', 'vivir', 'LAPVTFU', 'PM', 'objecion',
      'competidores', 'tono', 'PS', 'RLP', 'slogan', 'oferta', 'descripcion', 'cta', 'tipografia'
    ];
    const vector = BRIEF_FIELD_ORDER.map(f => {
      const val = brief[f] || brief[f.toLowerCase()] || '';
      return `${f}: ${val}`;
    }).join(' | ');

    sheet.getRange(row, logoIdx + 1).setValue(vector);
    ui.alert('Brief importado para ' + idEmpresa);
  } catch (e) {
    ui.alert('JSON inválido: ' + e.message);
  }
}

// ── Menu item: Exportar Brief (JSON) ─────────────────────────────────────
function exportarBriefJSON() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  const logoIdx = headerMap['logo_url'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();
  const logoUrl = logoIdx !== undefined ? String(rowData[logoIdx] || '').trim() : '';

  const result = parseBriefLocal(logoUrl);
  const jsonObj = {};
  result.fields.forEach(f => {
    jsonObj[f.name] = f.value.replace(/\s*\[([ABC])\]\s*$/i, '').trim();
  });

  const jsonStr = JSON.stringify(jsonObj, null, 2);
  const html = HtmlService.createHtmlOutput(
    '<textarea style="width:100%;height:300px;" readonly>' + jsonStr.replace(/</g, '&lt;') + '</textarea>' +
    '<script>navigator.clipboard.writeText(document.querySelector("textarea").value).then(()=>document.querySelector("textarea").style.background="#d4edda")</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'JSON copiado al portapapeles');
}

// ── Menu item: Share Brief (link) ────────────────────────────────────────
function shareBriefLink() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();

  const ss = getSidebarSS();
  const url = ss.getUrl() + '?gid=' + sheet.getSheetId() + '&range=A' + row;
  const html = HtmlService.createHtmlOutput(
    '<p>Link a la fila de <strong>' + idEmpresa + '</strong>:</p>' +
    '<input style="width:100%" readonly value="' + url + '" onclick="this.select()">' +
    '<script>document.querySelector("input").select()</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Share Brief Link');
}

// ── Menu item: Historial de Cambios ──────────────────────────────────────
function mostrarHistorialBrief() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== 'Config_Empresas') {
    SpreadsheetApp.getUi().alert('Selecciona una fila en Config_Empresas');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { SpreadsheetApp.getUi().alert('Selecciona una fila de datos'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerMap = {};
  for (let h = 0; h < headers.length; h++) {
    headerMap[String(headers[h]).toLowerCase().trim().replace(/\s+/g, '_')] = h;
  }
  const idIdx = headerMap['id_empresa'];
  if (idIdx === undefined) { SpreadsheetApp.getUi().alert('No se encontró columna id_empresa'); return; }

  const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idEmpresa = String(rowData[idIdx] || '').trim();

  try {
    // getRootFolder_/findCteFolder_ viven en core.js (mismo scope GAS, ADR-028)
    const rootFolder = typeof getRootFolder_ === 'function'
      ? getRootFolder_()
      : DriveApp.getFolderById(getConfigValue('DRIVE_ROOT_ID'));
    const cteFolder = typeof findCteFolder_ === 'function'
      ? findCteFolder_(rootFolder, idEmpresa)
      : rootFolder.getFoldersByName('cte' + idEmpresa).next();
    if (!cteFolder) {
      SpreadsheetApp.getUi().alert('No hay historial para ' + idEmpresa);
      return;
    }
    const briefFolders = cteFolder.getFoldersByName('_brief');
    if (!briefFolders.hasNext()) {
      SpreadsheetApp.getUi().alert('No hay carpeta _brief para ' + idEmpresa);
      return;
    }
    const briefFolder = briefFolders.next();
    const historialFolders = briefFolder.getFoldersByName('historial');
    if (!historialFolders.hasNext()) {
      SpreadsheetApp.getUi().alert('No hay historial para ' + idEmpresa);
      return;
    }
    const historialFolder = historialFolders.next();
    const files = historialFolder.getFiles();
    let msg = '📈 Historial de Brief — ' + idEmpresa + '\n\n';
    let count = 0;
    while (files.hasNext() && count < 10) {
      const file = files.next();
      msg += '• ' + file.getName() + ' (' + file.getDateCreated().toLocaleDateString() + ')\n';
      count++;
    }
    if (count === 0) msg += 'No hay respaldos anteriores.';
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error leyendo historial: ' + e.message);
  }
}

// ── Helper: get config value from GAS properties ─────────────────────────
function getConfigValue(key) {
  const props = PropertiesService.getScriptProperties();
  const val = props.getProperty(key);
  if (val) return val;
  // Fallback: My Drive root para DRIVE_ROOT_ID (ADR-028 — el ID anterior
  // 1BxmUT... daba 404); el resto sigue hardcodeado.
  if (key === 'DRIVE_ROOT_ID') {
    try { return DriveApp.getRootFolder().getId(); } catch (e) { return ''; }
  }
  const CONFIG = {
    DB_ID: '1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8'
  };
  return CONFIG[key] || '';
}

// ── Get company list for sidebar ────────────────────────────────────────
function getBriefCompanies() {
  const ss = getSidebarSS();
  if (!ss) return [];
  const sheet = ss.getSheetByName('Config_Empresas');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  const idIdx = headers.indexOf('id_empresa');
  const nameIdx = headers.indexOf('nomempresa');
  const logoIdx = headers.indexOf('logo_url');

  if (idIdx === -1) return [];

  const companies = [];
  for (let i = 1; i < data.length; i++) {
    const id = String(data[i][idIdx] || '').trim();
    if (!id) continue;
    const name = nameIdx !== -1 ? String(data[i][nameIdx] || '').trim() : id;
    const logo = logoIdx !== -1 ? String(data[i][logoIdx] || '').trim() : '';
    const parsed = parseBriefLocal(logo);
    const filled = parsed.fields.filter(f => f.value && !f.value.includes('[PENDIENTE')).length;
    companies.push({
      id: id,
      name: name,
      filled: filled,
      total: BRIEF_FIELDS.length,
      status: filled === BRIEF_FIELDS.length ? 'COMPLETO' : 'INCOMPLETO'
    });
  }
  return companies;
}

// ── Get brief details for a company ─────────────────────────────────────
function getBriefDetails(idEmpresa) {
  const ss = getSidebarSS();
  if (!ss) return null;
  const sheet = ss.getSheetByName('Config_Empresas');
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, '_'));
  const idIdx = headers.indexOf('id_empresa');
  const logoIdx = headers.indexOf('logo_url');

  if (idIdx === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx] || '').trim() === idEmpresa) {
      const logo = logoIdx !== -1 ? String(data[i][logoIdx] || '').trim() : '';
      return parseBriefLocal(logo);
    }
  }
  return null;
}

// ── Sidebar HTML ────────────────────────────────────────────────────────
function getBriefSidebarHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', sans-serif; margin: 0; padding: 12px; background: #1a1a2e; color: #e0e0e0; }
  h2 { color: #00d4aa; margin: 0 0 12px; font-size: 16px; }
  .status { padding: 6px 10px; border-radius: 6px; font-size: 12px; margin-bottom: 10px; }
  .status-ok { background: #0d3320; border: 1px solid #00d4aa; }
  .status-warn { background: #3d2e00; border: 1px solid #ffb700; }
  .status-error { background: #3d0000; border: 1px solid #ff4444; }
  .field-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #333; font-size: 12px; }
  .field-name { color: #aaa; }
  .field-val { color: #fff; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .confidence-A { color: #00d4aa; }
  .confidence-B { color: #ffb700; }
  .confidence-C { color: #ff6b6b; }
  select { width: 100%; padding: 8px; background: #0f0f23; color: #e0e0e0; border: 1px solid #333; border-radius: 6px; margin-bottom: 10px; }
  .btn { display: inline-block; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; border: none; margin: 4px 2px; }
  .btn-primary { background: #00d4aa; color: #000; }
  .btn-secondary { background: #333; color: #e0e0e0; }
  .btn:hover { opacity: 0.85; }
  .section { margin-top: 12px; }
  .section-title { color: #00d4aa; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
  .loader { display: none; color: #00d4aa; font-size: 12px; }
  .progress-bar { width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 8px 0; overflow: hidden; }
  .progress-fill { height: 100%; background: #00d4aa; width: 0%; transition: width 0.3s; }
  .progress-text { font-size: 11px; color: #888; margin-top: 4px; }
</style>
</head>
<body>
  <h2>Brief Generator</h2>

  <div class="section">
    <div class="section-title">Empresa:</div>
    <select id="companySelect" onchange="loadBrief()">
      <option value="">-- Seleccionar empresa --</option>
    </select>
  </div>

  <div id="status" class="status status-warn" style="display:none;"></div>
  <div id="loader" class="loader">Cargando...</div>

  <div id="fields" class="section" style="display:none;"></div>

  <div class="section" style="margin-top:16px;">
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
      <button class="btn btn-primary" onclick="generarBrief()" style="flex:1;min-width:120px;">⚡ Generar Brief</button>
      <button class="btn btn-secondary" onclick="copyVector()" style="flex:1;min-width:120px;">📋 Copiar Vector</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
      <button class="btn btn-secondary" onclick="generarAssets()" style="flex:1;min-width:120px;">🖼️ Generar Assets</button>
      <button class="btn btn-secondary" onclick="verAssets()" style="flex:1;min-width:120px;">📂 Ver Assets</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
      <button class="btn btn-primary" onclick="asegurarLogo()" style="flex:1;min-width:120px;">🎯 Asegurar Logo</button>
      <button class="btn btn-primary" onclick="asegurarAvatar()" style="flex:1;min-width:120px;">👤 Asegurar Avatar</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
      <button class="btn btn-secondary" onclick="mostrarResumen()" style="flex:1;min-width:120px;">📊 Resumen</button>
      <button class="btn btn-secondary" onclick="mostrarPendientes()" style="flex:1;min-width:120px;">🔄 Pendientes</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
      <button class="btn btn-secondary" onclick="exportarJSON()" style="flex:1;min-width:120px;">📤 Exportar JSON</button>
      <button class="btn btn-secondary" onclick="importarJSON()" style="flex:1;min-width:120px;">📥 Importar JSON</button>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
      <button class="btn btn-secondary" onclick="shareLink()" style="flex:1;min-width:120px;">🔗 Share Link</button>
      <button class="btn btn-secondary" onclick="mostrarHistorial()" style="flex:1;min-width:120px;">📈 Historial</button>
    </div>
  </div>

  <div id="progress" style="display:none;">
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="progress-text" id="progressText">Generando Brief...</div>
  </div>

  <div id="result" style="display:none; margin-top:12px; padding:8px; border-radius:6px; font-size:12px;"></div>

  <script>
    let currentVector = '';

    // Cargar empresas al iniciar — usa GAS proxy a Node.js
    google.script.run
      .withSuccessHandler(companies => {
        const sel = document.getElementById('companySelect');
        if (companies.status === 'success' && companies.data) {
          companies.data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id_empresa;
            opt.textContent = c.id_empresa + ' — ' + c.nomempresa;
            sel.appendChild(opt);
          });
        } else {
          document.getElementById('status').style.display = 'block';
          document.getElementById('status').className = 'status status-error';
          document.getElementById('status').textContent = 'Error cargando empresas: ' + (companies.error || 'desconocido');
        }
      })
      .withFailureHandler(err => {
        document.getElementById('status').style.display = 'block';
        document.getElementById('status').className = 'status status-error';
        document.getElementById('status').textContent = 'Error: ' + err.message;
      })
      .getBriefCompaniesViaNode();

    function loadBrief() {
      const id = document.getElementById('companySelect').value;
      if (!id) { document.getElementById('fields').style.display = 'none'; return; }

      document.getElementById('loader').style.display = 'block';
      document.getElementById('fields').style.display = 'none';

      google.script.run
        .withSuccessHandler(result => {
          document.getElementById('loader').style.display = 'none';
          if (!result) {
            document.getElementById('status').style.display = 'block';
            document.getElementById('status').textContent = 'Empresa no encontrada';
            return;
          }

          const filled = result.fields.filter(f => !f.value.includes('[PENDIENTE')).length;
          const total = result.fields.length;
          const statusEl = document.getElementById('status');
          statusEl.style.display = 'block';
          statusEl.className = 'status ' + (filled === total ? 'status-ok' : 'status-warn');
          statusEl.textContent = filled + '/' + total + ' campos completos';

          let html = '';
          result.fields.forEach(f => {
            const cls = 'confidence-' + f.confidence;
            const display = f.value.length > 35 ? f.value.substring(0, 35) + '...' : f.value;
            html += '<div class="field-row">';
            html += '<span class="field-name">' + f.index + '. ' + f.name + '</span>';
            html += '<span class="field-val ' + cls + '">' + display + '</span>';
            html += '</div>';
          });
          document.getElementById('fields').innerHTML = html;
          document.getElementById('fields').style.display = 'block';

          currentVector = result.fields.map(f => f.value).join('|');
        })
        .withFailureHandler(err => {
          document.getElementById('loader').style.display = 'none';
          document.getElementById('status').style.display = 'block';
          document.getElementById('status').className = 'status status-error';
          document.getElementById('status').textContent = 'Error: ' + err.message;
        })
        .getBriefDetails(id);
    }

    function copyVector() {
      if (!currentVector) { alert('Selecciona una empresa primero'); return; }
      navigator.clipboard.writeText(currentVector);
      google.script.run
        .withFailureHandler(err => console.warn('showToast failed:', err))
        .showToast('Vector copiado al portapapeles');
    }

    // ── Generar Brief vía GAS proxy → Node.js ─────────────────────────────
    function generarBrief() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa primero'); return; }

      const progressEl = document.getElementById('progress');
      const fillEl = document.getElementById('progressFill');
      const textEl = document.getElementById('progressText');
      const resultEl = document.getElementById('result');

      progressEl.style.display = 'block';
      resultEl.style.display = 'none';
      fillEl.style.width = '10%';
      textEl.textContent = 'Leyendo datos de la empresa...';

      google.script.run
        .withSuccessHandler(data => {
          fillEl.style.width = '50%';
          textEl.textContent = 'Procesando resultado...';

          if (data.status === 'error') {
            fillEl.style.width = '100%';
            fillEl.style.background = '#ff4444';
            textEl.textContent = 'Error: ' + data.error;
            resultEl.style.display = 'block';
            resultEl.style.background = '#3d0000';
            resultEl.style.border = '1px solid #ff4444';
            resultEl.innerHTML = '<strong>Error al generar</strong><br>' + data.error;
            return;
          }

          fillEl.style.width = '80%';
          textEl.textContent = 'Escribiendo vector a Sheets...';

          // Escribir vector a Config_Empresas.logo_url
          google.script.run
            .withSuccessHandler(writeResult => {
              fillEl.style.width = '90%';
              textEl.textContent = 'Guardando metadata en Drive...';

              if (!writeResult.success) {
                fillEl.style.width = '100%';
                fillEl.style.background = '#ff4444';
                textEl.textContent = 'Error escribiendo: ' + writeResult.error;
                resultEl.style.display = 'block';
                resultEl.style.background = '#3d0000';
                resultEl.style.border = '1px solid #ff4444';
                resultEl.innerHTML = '<strong>Error escribiendo vector</strong><br>' + writeResult.error;
                return;
              }

              // Guardar metadata (brief.json + confianza.json)
              google.script.run
                .withSuccessHandler(metaResult => {
                  fillEl.style.width = '100%';
                  textEl.textContent = '¡Brief generado y guardado!';

                  const brief = data.data.brief;
                  const completitud = data.data.completitud;
                  resultEl.style.display = 'block';
                  resultEl.style.background = completitud.filled === completitud.total ? '#0d3320' : '#3d2e00';
                  resultEl.style.border = '1px solid ' + (completitud.filled === completitud.total ? '#00d4aa' : '#ffb700');
                  resultEl.innerHTML = '<strong>✓ Brief generado</strong><br>' +
                    completitud.filled + '/' + completitud.total + ' campos completos<br>' +
                    '<span style="font-size:11px; color:#888;">Vector escrito a logo_url · Metadata en Drive</span>';

                  if (data.data.vector) {
                    navigator.clipboard.writeText(data.data.vector);
                    currentVector = data.data.vector;
                  }

                  // Recargar vista
                  setTimeout(() => { loadBrief(); }, 500);

                  setTimeout(() => { progressEl.style.display = 'none'; }, 1500);
                })
                .withFailureHandler(err => {
                  fillEl.style.width = '100%';
                  fillEl.style.background = '#ff4444';
                  textEl.textContent = 'Error guardando metadata: ' + err.message;
                  resultEl.style.display = 'block';
                  resultEl.style.background = '#3d0000';
                  resultEl.style.border = '1px solid #ff4444';
                  resultEl.innerHTML = '<strong>Error metadata</strong><br>' + err.message;
                })
                .saveBriefMetadataViaNode(id, data.data.vector, data.data.confidence || {});
            })
            .withFailureHandler(err => {
              fillEl.style.width = '100%';
              fillEl.style.background = '#ff4444';
              textEl.textContent = 'Error escribiendo vector: ' + err.message;
              resultEl.style.display = 'block';
              resultEl.style.background = '#3d0000';
              resultEl.style.border = '1px solid #ff4444';
              resultEl.innerHTML = '<strong>Error write</strong><br>' + err.message;
            })
            .writeBriefVectorViaNode(id, data.data.vector);
        })
        .withFailureHandler(err => {
          fillEl.style.width = '100%';
          fillEl.style.background = '#ff4444';
          textEl.textContent = 'Error: ' + err.message;
          resultEl.style.display = 'block';
          resultEl.style.background = '#3d0000';
          resultEl.style.border = '1px solid #ff4444';
          resultEl.innerHTML = '<strong>Error al generar</strong><br>' + err.message;
        })
        .generateBriefViaNode(id);
    }

    // ── Generar Assets LAPVTFU vía GAS proxy → Node.js ───────────────────
    function generarAssets() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }

      const progressEl = document.getElementById('progress');
      const fillEl = document.getElementById('progressFill');
      const textEl = document.getElementById('progressText');
      const resultEl = document.getElementById('result');

      progressEl.style.display = 'block';
      resultEl.style.display = 'none';
      fillEl.style.width = '20%';
      textEl.textContent = 'Creando carpetas en Drive...';

      google.script.run
        .withSuccessHandler(data => {
          if (data.status === 'error') {
            fillEl.style.width = '100%';
            fillEl.style.background = '#ff4444';
            textEl.textContent = 'Error: ' + data.error;
            resultEl.style.display = 'block';
            resultEl.style.background = '#3d0000';
            resultEl.style.border = '1px solid #ff4444';
            resultEl.innerHTML = '<strong>Error generando assets</strong><br>' + data.error;
            return;
          }

          const gen = data.data.generated;
          const total = data.data.total;
          fillEl.style.width = '100%';
          textEl.textContent = gen + '/' + total + ' assets generados';

          resultEl.style.display = 'block';
          resultEl.style.background = gen > 0 ? '#0d3320' : '#3d2e00';
          resultEl.style.border = '1px solid ' + (gen > 0 ? '#00d4aa' : '#ffb700');

          let html = '<strong>🖼️ Assets LAPVTFU</strong><br>' + gen + '/' + total + ' generados<br>';
          if (data.data.results) {
            data.data.results.forEach(r => {
              const icon = r.success ? '✅' : (r.status === 'skipped' ? '⏭️' : '❌');
              html += '<span style="font-size:11px;">' + icon + ' ' + r.tipo + ': ' + (r.fileName || r.reason || r.error) + '</span><br>';
            });
          }
          resultEl.innerHTML = html;
          progressEl.style.display = 'none';
        })
        .withFailureHandler(err => {
          fillEl.style.width = '100%';
          fillEl.style.background = '#ff4444';
          textEl.textContent = 'Error: ' + err.message;
          resultEl.style.display = 'block';
          resultEl.style.background = '#3d0000';
          resultEl.style.border = '1px solid #ff4444';
          resultEl.innerHTML = '<strong>Error generando assets</strong><br>' + err.message;
        })
        .generateAssetsViaNode(id);
    }

    // ── Asegurar Logo slot 1 LAPVTFU ──────────────────────────────────────
    function asegurarLogo() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }

      const progressEl = document.getElementById('progress');
      const fillEl = document.getElementById('progressFill');
      const textEl = document.getElementById('progressText');
      const resultEl = document.getElementById('result');

      progressEl.style.display = 'block';
      resultEl.style.display = 'none';
      fillEl.style.width = '30%';
      textEl.textContent = 'Asegurando logo.png (limpiar / crear / compartir)...';

      google.script.run
        .withSuccessHandler(data => {
          progressEl.style.display = 'none';
          if (!data || data.status === 'error') {
            resultEl.style.display = 'block';
            resultEl.style.background = '#3d0000';
            resultEl.style.border = '1px solid #ff4444';
            resultEl.innerHTML = '<strong>Error logo</strong><br>' + ((data && data.error) || 'desconocido');
            return;
          }
          const d = data.data || {};
          const ok = d.success !== false && d.url;
          resultEl.style.display = 'block';
          resultEl.style.background = ok ? '#0d3320' : '#3d2e00';
          resultEl.style.border = '1px solid ' + (ok ? '#00d4aa' : '#ffb700');
          resultEl.innerHTML = ok
            ? '<strong>✅ Logo asegurado</strong><br>' +
              '<span style="font-size:11px;">origen: ' + (d.source || '?') + ' · vector: ' + (d.vectorUpdated ? 'slot 1 escrito' : 'sin cambio') + '</span><br>' +
              '<a href="' + d.url + '" target="_blank" style="font-size:11px; color:#00d4aa;">Abrir logo.png</a>' +
              (d.faviconUrl ? ' · <a href="' + d.faviconUrl + '" target="_blank" style="font-size:11px; color:#00d4aa;">favicon.png</a>' : '')
            : '<strong>⚠️ Logo</strong><br>' + (d.error || d.status || 'sin URL');
        })
        .withFailureHandler(err => {
          progressEl.style.display = 'none';
          resultEl.style.display = 'block';
          resultEl.style.background = '#3d0000';
          resultEl.style.border = '1px solid #ff4444';
          resultEl.innerHTML = '<strong>Error logo</strong><br>' + err.message;
        })
        .ensureLogoViaNode(id);
    }

    // ── Asegurar Avatar slot 2 LAPVTFU ────────────────────────────────────
    // Gate = fotopersonal.png en cte<id>/ (la sube el usuario; nunca se crea).
    function asegurarAvatar() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }

      const progressEl = document.getElementById('progress');
      const fillEl = document.getElementById('progressFill');
      const textEl = document.getElementById('progressText');
      const resultEl = document.getElementById('result');

      progressEl.style.display = 'block';
      resultEl.style.display = 'none';
      fillEl.style.width = '30%';
      textEl.textContent = 'Asegurando avatar.png (fotopersonal → caricatura)...';

      google.script.run
        .withSuccessHandler(data => {
          progressEl.style.display = 'none';
          if (!data || data.status === 'error') {
            resultEl.style.display = 'block';
            resultEl.style.background = '#3d0000';
            resultEl.style.border = '1px solid #ff4444';
            resultEl.innerHTML = '<strong>Error avatar</strong><br>' + ((data && data.error) || 'desconocido');
            return;
          }
          const d = data.data || {};
          resultEl.style.display = 'block';
          if (d.status === 'no_foto') {
            resultEl.style.background = '#3d2e00';
            resultEl.style.border = '1px solid #ffb700';
            resultEl.innerHTML = '<strong>⚠️ Sin fotopersonal.png</strong><br>' +
              '<span style="font-size:11px;">' + (d.reason || 'Sube fotopersonal.png a la raíz de cte' + id + ' y vuelve a intentar') + '</span>';
            return;
          }
          const ok = d.success !== false && d.url;
          resultEl.style.background = ok ? '#0d3320' : '#3d0000';
          resultEl.style.border = '1px solid ' + (ok ? '#00d4aa' : '#ff4444');
          resultEl.innerHTML = ok
            ? '<strong>✅ Avatar asegurado</strong><br>' +
              '<span style="font-size:11px;">origen: ' + (d.source || '?') + ' · vector: ' + (d.vectorUpdated ? 'slot 2 escrito' : 'sin cambio') + '</span><br>' +
              '<a href="' + d.url + '" target="_blank" style="font-size:11px; color:#00d4aa;">Abrir avatar.png</a>'
            : '<strong>⚠️ Avatar</strong><br>' + (d.error || d.status || 'sin URL');
        })
        .withFailureHandler(err => {
          progressEl.style.display = 'none';
          resultEl.style.display = 'block';
          resultEl.style.background = '#3d0000';
          resultEl.style.border = '1px solid #ff4444';
          resultEl.innerHTML = '<strong>Error avatar</strong><br>' + err.message;
        })
        .ensureAvatarViaNode(id);
    }

    // ── Ver Assets existentes vía GAS proxy → Node.js ─────────────────────
    function verAssets() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }

      google.script.run
        .withSuccessHandler(data => {
          if (data.status === 'error') {
            alert('Error: ' + data.error);
            return;
          }

          const assets = data.data?.assets || {};
          const tipos = ['logo', 'avatar', 'fotos-personales', 'videos', 'testimonios', 'fotos', 'ugc'];
          let html = '<strong>📂 Assets LAPVTFU — ' + id + '</strong><br><br>';

          tipos.forEach(tipo => {
            const files = assets[tipo] || [];
            const icon = files.length > 0 ? '✅' : '❌';
            html += icon + ' <strong>' + tipo + '</strong>: ' + (files.length > 0 ? files.length + ' archivo(s)' : 'vacío') + '<br>';
            files.forEach(f => {
              html += '<span style="font-size:11px; color:#888;">  └ ' + f.name + ' (' + Math.round(f.size/1024) + 'KB)</span><br>';
            });
          });

          const resultEl = document.getElementById('result');
          resultEl.style.display = 'block';
          resultEl.style.background = '#0f0f23';
          resultEl.style.border = '1px solid #333';
          resultEl.innerHTML = html;
        })
        .withFailureHandler(err => {
          alert('Error: ' + err.message);
        })
        .getBriefAssetsViaNode(id);
    }

    // ── Resumen de confianza ──────────────────────────────────────────────
    function mostrarResumen() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }
      const fields = document.querySelectorAll('.field-row');
      let a = 0, b = 0, c = 0;
      fields.forEach(row => {
        const cls = row.querySelector('.field-val')?.className || '';
        if (cls.includes('confidence-A')) a++;
        else if (cls.includes('confidence-B')) b++;
        else c++;
      });
      const total = a + b + c;
      alert('📊 Resumen de Confianza\\n\\n' +
        '✅ A (Cliente): ' + a + ' (' + Math.round(a/total*100) + '%)\\n' +
        '🔍 B (Inferido): ' + b + ' (' + Math.round(b/total*100) + '%)\\n' +
        '💡 C (Creativo): ' + c + ' (' + Math.round(c/total*100) + '%)');
    }

    // ── Pendientes ────────────────────────────────────────────────────────
    function mostrarPendientes() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }
      const fields = document.querySelectorAll('.field-row');
      let pendientes = [];
      fields.forEach((row, i) => {
        const val = row.querySelector('.field-val')?.textContent || '';
        if (val.includes('[PENDIENTE')) {
          pendientes.push((i+1) + '. ' + row.querySelector('.field-name')?.textContent);
        }
      });
      if (pendientes.length === 0) {
        alert('✅ Todos los campos están completos');
      } else {
        alert('🔄 Pendientes (' + pendientes.length + '):\\n\\n' + pendientes.join('\\n'));
      }
    }

    // ── Exportar JSON ─────────────────────────────────────────────────────
    function exportarJSON() {
      if (!currentVector) { alert('Primero carga un Brief'); return; }
      const parts = currentVector.split('|');
      const obj = {};
      const fields = ['industria','nicho','especializacion','vendes','audiencia','dolor','PBP','lograr','vivir','LAPVTFU','PM','objecion','competidores','tono','PS','RLP','slogan','oferta','descripcion','cta','tipografia'];
      parts.forEach((seg, i) => {
        const colon = seg.indexOf(':');
        if (colon > 0) {
          const key = seg.slice(0, colon).trim().toLowerCase();
          const val = seg.slice(colon + 1).trim().replace(/\\s*\\[([ABC])\\]\\s*$/i, '').trim();
          obj[key] = val;
        }
      });
      const json = JSON.stringify(obj, null, 2);
      navigator.clipboard.writeText(json);
      alert('JSON copiado al portapapeles:\\n\\n' + json.substring(0, 200) + '...');
    }

    // ── Importar JSON ─────────────────────────────────────────────────────
    function importarJSON() {
      const json = prompt('Pega el JSON del Brief:');
      if (!json) return;
      try {
        const obj = JSON.parse(json);
        const fields = ['industria','nicho','especializacion','vendes','audiencia','dolor','PBP','lograr','vivir','LAPVTFU','PM','objecion','competidores','tono','PS','RLP','slogan','oferta','descripcion','cta','tipografia'];
        const vector = fields.map(f => f + ': ' + (obj[f] || '')).join(' | ');
        currentVector = vector;
        navigator.clipboard.writeText(vector);
        alert('Vector importado y copiado al portapapeles');
        loadBrief();
      } catch (e) {
        alert('JSON inválido: ' + e.message);
      }
    }

    // ── Share Link ────────────────────────────────────────────────────────
    function shareLink() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa'); return; }
      const url = window.location.href.split('?')[0] + '?empresa=' + id;
      navigator.clipboard.writeText(url);
      alert('Link copiado:\\n' + url);
    }

    // ── Historial ─────────────────────────────────────────────────────────
    function mostrarHistorial() {
      alert('📈 Historial de Cambios\\n\\nUsa el menú GAS: Brief > 📈 Historial de Cambios\\n(Requiere acceso a Google Drive)');
    }
  </script>
</body>
</html>`;
}
