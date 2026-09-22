/**
 * Capa 2 — Event Logger (Reactive Sync)
 * 
 * Captura onEdit en hojas PRIVATE_TABLES y escribe a _EventLog.
 * El Node.js server lee _EventLog cada 30 min y sync a Supabase.
 * 
 * Setup: ejecutar createOnOpenTrigger() una vez desde el editor GAS.
 */

const CAPA2_CONFIG = {
  EVENT_LOG_SHEET: '_EventLog',
  PRIVATE_TABLES: [
    'Leads', 'Proyectos', 'Proyectos_Etapas', 'Proyectos_Pagos',
    'Proyectos_Bitacora', 'Catalogo', 'Logs', 'Pagos',
    'Empresa_Documentos', 'Reservaciones', 'Config_Galeria',
    'Logs_Chat_IA', 'Memoria_IA_Snapshots', 'Logs_Consultas_SOP'
  ]
};

function onEdit(e) {
  try {
    const sheet = e.source.getSheetName();
    if (CAPA2_CONFIG.PRIVATE_TABLES.indexOf(sheet) === -1) return;

    const range = e.range;
    const row = range.getRow();
    const col = range.getColumn();
    if (row <= 1) return; // skip header

    const ss = e.source;
    const headers = ss.getSheetByName(sheet).getRange(1, 1, 1, ss.getSheetByName(sheet).getLastColumn()).getValues()[0];

    // find id_empresa column
    const idEmpCol = headers.map(h => String(h).toLowerCase().trim()).indexOf('id_empresa');
    const id_empresa = idEmpCol >= 0 ? String(ss.getSheetByName(sheet).getRange(row, idEmpCol + 1).getValue()).trim() : '';

    const oldValue = e.oldValue !== undefined ? String(e.oldValue) : '';
    const newValue = e.value !== undefined ? String(e.value) : '';
    const colName = headers[col - 1] || `col_${col}`;

    _writeEventLog(ss, sheet, row, colName, oldValue, newValue, id_empresa);
  } catch (err) {
    Logger.log('[CAPA2_ERROR] ' + err.message);
  }
}

function _writeEventLog(ss, sheet, row, colName, oldValue, newValue, id_empresa) {
  let logSheet = ss.getSheetByName(CAPA2_CONFIG.EVENT_LOG_SHEET);
  if (!logSheet) {
    logSheet = ss.insertSheet(CAPA2_CONFIG.EVENT_LOG_SHEET);
    logSheet.appendRow(['timestamp', 'sheet', 'row', 'column', 'old_value', 'new_value', 'id_empresa', 'synced']);
  }

  logSheet.appendRow([
    new Date().toISOString(),
    sheet,
    row,
    colName,
    oldValue,
    newValue,
    id_empresa,
    'false'
  ]);

  Logger.log('[CAPA2] ' + sheet + ':' + row + ':' + colName + ' "' + oldValue + '" → "' + newValue + '"');
}

function createOnOpenTrigger() {
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(CAPA2_CONFIG.DB_ID || SpreadsheetApp.getActiveSpreadsheet().getId())
    .onEdit()
    .create();
  Logger.log('[CAPA2] Trigger onEdit creado.');
}

function getUnsyncedEvents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CAPA2_CONFIG.EVENT_LOG_SHEET);
  if (!logSheet) return [];

  const data = logSheet.getDataRange().getValues();
  const headers = data[0];
  const events = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]).trim() === 'false') {
      events.push({
        timestamp: data[i][0],
        sheet: data[i][1],
        row: data[i][2],
        column: data[i][3],
        old_value: data[i][4],
        new_value: data[i][5],
        id_empresa: data[i][6],
        rowIndex: i + 1
      });
    }
  }
  return events;
}

function markEventSynced(rowIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CAPA2_CONFIG.EVENT_LOG_SHEET);
  if (logSheet) {
    logSheet.getRange(rowIndex, 8).setValue('true');
  }
}
