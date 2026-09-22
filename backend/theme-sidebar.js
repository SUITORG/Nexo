/**
 * theme-sidebar.js — Google Apps Script Sidebar para selector de temas.
 *
 * Agregar al proyecto GAS existente. Desde el editor de GAS:
 *   Ejecutar: showThemeSidebar()
 *   Personalizado: onOpen() agrega menu "Temas" al sheet.
 *
 * Presets embebidos (mismos de presets.json, no dependen de archivo externo).
 */

// ── Presets embebidos ─────────────────────────────────────────────────────
const PRESETS = {
  fontPairs: [
    { id: 'tp-01', tone: 'SaaS moderno', heading: 'Satoshi 700', body: 'Satoshi 400', provider: 'fontshare' },
    { id: 'tp-02', tone: 'Editorial premium', heading: 'Instrument Serif 400', body: 'DM Sans 400', provider: 'google' },
    { id: 'tp-03', tone: 'Corporativo sobrio', heading: 'General Sans 600', body: 'Inter 400', provider: 'fontshare+google' },
    { id: 'tp-04', tone: 'Tech / dev', heading: 'Space Grotesk 600', body: 'IBM Plex Sans 400', provider: 'google' },
    { id: 'tp-05', tone: 'Lujo / boutique', heading: 'Fraunces 600', body: 'Work Sans 400', provider: 'google' },
    { id: 'tp-06', tone: 'Salud / confianza', heading: 'Bricolage Grotesque 600', body: 'Source Sans 3 400', provider: 'google' },
    { id: 'tp-07', tone: 'Infoproducto directo', heading: 'Archivo 700', body: 'Public Sans 400', provider: 'google' },
    { id: 'tp-08', tone: 'Servicio local', heading: 'Outfit 600', body: 'Manrope 400', provider: 'google' },
    { id: 'tp-09', tone: 'Fintech autoridad', heading: 'Source Serif 4 600', body: 'Source Sans 3 400', provider: 'google' },
    { id: 'tp-10', tone: 'Creativo expresivo', heading: 'Bespoke Serif 500', body: 'Switzer 400', provider: 'fontshare' },
  ],
  palettes: [
    { id: 'pal-teal', name: 'Nexus teal', primary: '#01696F', bg: '#F7F6F2', text: '#28251D' },
    { id: 'pal-navy', name: 'Navy fintech', primary: '#12395E', bg: '#FAFAF8', text: '#121A2B' },
    { id: 'pal-terra', name: 'Terracota calida', primary: '#A84B2F', bg: '#FBF7F3', text: '#2A1F18' },
    { id: 'pal-forest', name: 'Verde sostenible', primary: '#2F6B3A', bg: '#F6F8F4', text: '#1B2418' },
    { id: 'pal-violet', name: 'Violeta producto', primary: '#5B3BC4', bg: '#FAF9FC', text: '#1D172A' },
    { id: 'pal-mono', name: 'Mono alto contraste', primary: '#111111', bg: '#FFFFFF', text: '#111111' },
  ],
  templates: [
    { id: 'lp-squeeze-minimal', type: 'squeeze', useCase: 'Captura de email, una pantalla' },
    { id: 'lp-saas-trial', type: 'saas-trial', useCase: 'Prueba gratis B2B' },
    { id: 'lp-sales-longform', type: 'sales-long-form', useCase: 'Carta de ventas larga' },
    { id: 'lp-local-service', type: 'local-service', useCase: 'Negocio local, telefono visible' },
    { id: 'lp-webinar', type: 'webinar', useCase: 'Registro a webinar' },
    { id: 'lp-product-ecom', type: 'product-detail', useCase: 'Producto fisico con galeria' },
    { id: 'lp-booking', type: 'booking', useCase: 'Agenda una consultoria' },
    { id: 'lp-waitlist', type: 'waitlist-coming-soon', useCase: 'Prelanzamiento' },
    { id: 'lp-vsl', type: 'vsl', useCase: 'Video sales letter' },
    { id: 'lp-clinica-salud', type: 'lead-capture', useCase: 'Salud y bienestar' },
    { id: 'lp-comparison', type: 'comparison', useCase: 'Nosotros vs competencia' },
    { id: 'lp-link-in-bio', type: 'link-in-bio', useCase: 'Hub de enlaces' },
  ]
};

// ── Menu temas (se llama desde onOpen de database.js) ─────────────────────
function addToMenuTemas(ui) {
  ui = ui || SpreadsheetApp.getUi();
  ui.createMenu(' Temas')
    .addItem('Abrir selector de temas', 'showThemeSidebar')
    .addToUi();
}



// ── Installable trigger ───────────────────────────────────────────────────
// Ejecutar desde la hoja de cálculo: Menú > Extensions > Apps Script >
// Seleccionar createOnOpenTrigger > ▶ Ejecutar.
// IMPORTANTE: La hoja debe estar abierta para que el trigger se vincule.
function createOnOpenTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('❌ No hay hoja activa. Abre la hoja de cálculo primero.');
    return;
  }
  // Eliminar triggers previos de onOpen
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onOpen') ScriptApp.deleteTrigger(t);
  });
  // Crear trigger installable
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(ss)
    .onOpen()
    .create();
  Logger.log('✅ Trigger installable creado para: ' + ss.getName());
}

// ── Sidebar ───────────────────────────────────────────────────────────────
// Para abrir: usa el menú " Temas" en la barra de la hoja.
function showThemeSidebar() {
  try {
    const html = HtmlService.createHtmlOutput(getSidebarHtml())
      .setTitle('Selector de Temas')
      .setWidth(420);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    SpreadsheetApp.getUi().alert(
      'Error: No se puede abrir desde el editor.\n\n' +
      'Recarga la hoja de cálculo (F5) y usa el menú " Temas" en la barra superior.'
    );
  }
}

function getSidebarHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #1a1a2e; padding: 16px; }
  h2 { font-size: 16px; margin-bottom: 12px; color: #333; }
  h3 { font-size: 13px; margin: 12px 0 6px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 12px; border: 1px solid #e0e0e0; }
  .palette-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .palette-card {
    border: 2px solid #e0e0e0; border-radius: 8px; padding: 10px; cursor: pointer;
    transition: all 0.15s ease; position: relative;
  }
  .palette-card:hover { border-color: #999; transform: translateY(-1px); }
  .palette-card.selected { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
  .palette-card .swatch {
    width: 100%; height: 32px; border-radius: 6px; margin-bottom: 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .palette-card .name { font-size: 11px; font-weight: 600; }
  .palette-card .id { font-size: 10px; color: #999; }
  .font-card {
    border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; cursor: pointer;
    transition: all 0.15s ease; margin-bottom: 6px;
  }
  .font-card:hover { border-color: #999; }
  .font-card.selected { border-color: #2563eb; background: #f0f7ff; }
  .font-card .tone { font-size: 11px; font-weight: 600; color: #333; }
  .font-card .names { font-size: 10px; color: #888; margin-top: 2px; }
  .tpl-card {
    border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; cursor: pointer;
    transition: all 0.15s ease; margin-bottom: 6px;
  }
  .tpl-card:hover { border-color: #999; }
  .tpl-card.selected { border-color: #2563eb; background: #f0f7ff; }
  .tpl-card .type { font-size: 11px; font-weight: 600; color: #333; }
  .tpl-card .usecase { font-size: 10px; color: #888; margin-top: 2px; }
  .lock-row { display: flex; align-items: center; gap: 8px; margin: 12px 0; }
  .lock-row label { font-size: 12px; color: #555; }
  .lock-row input[type=checkbox] { width: 16px; height: 16px; }
  .color-input { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
  .color-input input[type=color] { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; }
  .color-input input[type=text] { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; font-family: monospace; }
  .preview-box {
    border-radius: 8px; padding: 16px; margin-top: 12px; text-align: center;
    color: #fff; font-weight: 700; font-size: 14px;
  }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
  .btn {
    flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: all 0.15s ease;
  }
  .btn-primary { background: #2563eb; color: #fff; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .output { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 8px; border-radius: 6px; margin-top: 8px; word-break: break-all; color: #475569; }
</style>
</head>
<body>
  <h2>Selector de Temas</h2>

  <div class="section">
    <h3>Color</h3>
    <div class="color-input">
      <input type="color" id="colorPicker" value="#2563eb">
      <input type="text" id="colorHex" value="#2563eb" placeholder="#hex">
    </div>
  </div>

  <div class="section">
    <h3>Paleta de colores</h3>
    <div class="palette-grid" id="paletteGrid"></div>
  </div>

  <div class="section">
    <h3>Tipografia</h3>
    <div id="fontList"></div>
  </div>

  <div class="section">
    <h3>Plantilla de landing</h3>
    <div id="tplList"></div>
  </div>

  <div class="section">
    <div class="lock-row">
      <input type="checkbox" id="candado" checked>
      <label for="candado">Habilitar plantilla (candado:1)</label>
    </div>
  </div>

  <div class="section">
    <h3>Vista previa</h3>
    <div class="preview-box" id="preview" style="background: #2563eb;">EVASOL</div>
    <div class="output" id="output">#2563eb|candado:1|pal:pal-teal|tp:tp-01|tpl:lp-local-service</div>
  </div>

  <div class="actions">
    <button class="btn btn-secondary" onclick="copyOutput()">Copiar</button>
    <button class="btn btn-primary" onclick="applyToSheet()">Aplicar a celda</button>
  </div>

<script>
  let state = { color: '#2563eb', pal: null, tp: null, tpl: null, candado: 1 };

  function hexToRgb(hex) {
    const h = hex.replace('#','');
    const f = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
    return { r: parseInt(f.slice(0,2),16), g: parseInt(f.slice(2,4),16), b: parseInt(f.slice(4,6),16) };
  }
  function colorDist(a, b) {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    return Math.sqrt((ca.r-cb.r)**2 + (ca.g-cb.g)**2 + (ca.b-cb.b)**2);
  }

  // Render palettes
  const palettes = ${JSON.stringify(PRESETS.palettes)};
  const paletteGrid = document.getElementById('paletteGrid');
  palettes.forEach(p => {
    const card = document.createElement('div');
    card.className = 'palette-card';
    card.innerHTML = '<div class="swatch" style="background:' + p.primary + '; color: #fff;">Aa</div>' +
      '<div class="name">' + p.name + '</div><div class="id">' + p.id + '</div>';
    card.onclick = () => {
      document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.pal = p.id;
      state.color = p.primary;
      document.getElementById('colorPicker').value = p.primary;
      document.getElementById('colorHex').value = p.primary;
      updatePreview();
    };
    paletteGrid.appendChild(card);
  });

  // Render fonts
  const fonts = ${JSON.stringify(PRESETS.fontPairs)};
  const fontList = document.getElementById('fontList');
  fonts.forEach(f => {
    const card = document.createElement('div');
    card.className = 'font-card';
    card.innerHTML = '<div class="tone">' + f.id + ' - ' + f.tone + '</div>' +
      '<div class="names">' + f.heading + ' / ' + f.body + '</div>';
    card.onclick = () => {
      document.querySelectorAll('.font-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.tp = f.id;
      updatePreview();
    };
    fontList.appendChild(card);
  });

  // Render templates
  const templates = ${JSON.stringify(PRESETS.templates)};
  const tplList = document.getElementById('tplList');
  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.innerHTML = '<div class="type">' + t.id + '</div><div class="usecase">' + t.useCase + '</div>';
    card.onclick = () => {
      document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.tpl = t.id;
      updatePreview();
    };
    tplList.appendChild(card);
  });

  // Color picker sync
  document.getElementById('colorPicker').oninput = (e) => {
    state.color = e.target.value;
    document.getElementById('colorHex').value = e.target.value;
    // Auto-select closest palette
    let best = null, bestD = Infinity;
    palettes.forEach(p => { const d = colorDist(state.color, p.primary); if (d < bestD) { bestD = d; best = p; } });
    if (best && bestD < 80) {
      state.pal = best.id;
      document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'));
    }
    updatePreview();
  };
  document.getElementById('colorHex').oninput = (e) => {
    let v = e.target.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{3,6}$/.test(v)) {
      state.color = v;
      document.getElementById('colorPicker').value = v.length === 4 ? '#' + v[1]+v[1]+v[2]+v[2]+v[3]+v[3] : v;
      updatePreview();
    }
  };
  document.getElementById('candado').onchange = (e) => {
    state.candado = e.target.checked ? 1 : 0;
    updatePreview();
  };

  function buildOutput() {
    let parts = [state.color];
    parts.push('candado:' + state.candado);
    if (state.pal) parts.push('pal:' + state.pal);
    if (state.tp) parts.push('tp:' + state.tp);
    if (state.tpl) parts.push('tpl:' + state.tpl);
    return parts.join('|');
  }

  function updatePreview() {
    document.getElementById('preview').style.background = state.color;
    document.getElementById('output').textContent = buildOutput();
  }

  function copyOutput() {
    const text = buildOutput();
    navigator.clipboard.writeText(text);
    google.script.run.showToast('Copiado: ' + text);
  }

  function applyToSheet() {
    google.script.run.applyThemeToSelection(buildOutput());
  }

  updatePreview();
</script>
</body>
</html>`;
}

// ── Aplicar tema a la celda seleccionada ───────────────────────────────────
function applyThemeToSelection(themeValue) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const cell = sheet.getActiveCell();

  // Buscar la columna color_tema si estamos en la fila de encabezados
  let targetCell = cell;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colorTemaCol = headers.indexOf('color_tema');

  if (colorTemaCol >= 0 && cell.getRow() > 1) {
    targetCell = sheet.getRange(cell.getRow(), colorTemaCol + 1);
  }

  targetCell.setValue(themeValue);
  SpreadsheetApp.getUi().alert('Tema aplicado: ' + themeValue);
}

// ── Toast helper ──────────────────────────────────────────────────────────
function showToast(msg) {
  SpreadsheetApp.getUi().alert(msg);
}
