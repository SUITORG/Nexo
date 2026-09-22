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

// ── Menu Brief (se llama desde onOpen de database.js) ─────────────
function addToMenuBrief(ui) {
  ui.createMenu(' Brief')
    .addItem('Generar Brief (abre sidebar)', 'showBriefSidebar')
    .addItem('Validar Brief de empresa activa', 'validarBriefSeleccion')
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

// ── Get company list for sidebar ────────────────────────────────────────
function getBriefCompanies() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
    <button class="btn btn-primary" onclick="copyVector()">Copiar vector</button>
    <button class="btn btn-secondary" onclick="openWorkflow()">Abrir /brief</button>
  </div>

  <script>
    let currentVector = '';

    google.script.run
      .withSuccessHandler(companies => {
        const sel = document.getElementById('companySelect');
        companies.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.id + ' (' + c.filled + '/' + c.total + ' - ' + c.status + ')';
          sel.appendChild(opt);
        });
      })
      .getBriefCompanies();

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
        .getBriefDetails(id);
    }

    function copyVector() {
      if (!currentVector) { alert('Selecciona una empresa primero'); return; }
      navigator.clipboard.writeText(currentVector);
      google.script.run.showToast('Vector copiado al portapapeles');
    }

    function openWorkflow() {
      const id = document.getElementById('companySelect').value;
      if (!id) { alert('Selecciona una empresa primero'); return; }
      const msg = 'Abre tu terminal y ejecuta:\\n\\n/brief ' + id + '\\n\\nEsto genera el Brief completo con el agente IA.';
      alert(msg);
    }
  </script>
</body>
</html>`;
}
