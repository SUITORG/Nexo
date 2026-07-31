#!/usr/bin/env node
const blessed = require('blessed');

const MATRIZ = {
  'Reel / TikTok / Shorts': {
    redes: ['Instagram', 'Facebook', 'TikTok', 'YouTube'],
    medidas: '1080 × 1920 px (9:16)',
    duracion: '60 - 90 seg (TikTok hasta 10 min)',
    objetivo: 'Alcance masivo y viralidad'
  },
  Story: {
    redes: ['Instagram', 'Facebook', 'LinkedIn'],
    medidas: '1080 × 1920 px (9:16)',
    duracion: '15 - 60 seg por fragmento',
    objetivo: 'Venta directa y conexión diaria'
  },
  'Post Estándar': {
    redes: ['Instagram', 'Facebook', 'LinkedIn', 'X'],
    medidas: '1080 × 1350 px (4:5) o 1:1',
    duracion: '2 a 10 minutos según la red',
    objetivo: 'Contenido educativo y valor'
  },
  'Banner / Portada': {
    redes: ['Facebook', 'YouTube', 'LinkedIn', 'X'],
    medidas: 'Variable (ej. LinkedIn: 1584×396)',
    duracion: 'No aplica (Solo Imagen)',
    objetivo: 'Identidad visual e información'
  },
  'Video Largo': {
    redes: ['YouTube', 'Facebook', 'LinkedIn'],
    medidas: '1920 × 1080 px (16:9 HD)',
    duracion: 'Sin límite práctico (Horas)',
    objetivo: 'Entretenimiento profundo o tutoriales'
  }
};

const NOMBRES_FORMATOS = Object.keys(MATRIZ);
const TODAS_REDES = [...new Set(NOMBRES_FORMATOS.flatMap(f => MATRIZ[f].redes))];

const screen = blessed.screen({
  smartCSR: true,
  title: 'Configurador de Formatos - Redes Sociales',
  dockBorders: true,
  autoPadding: true,
  cursor: { artificial: true, shape: 'underline', blink: true, color: 'blue' }
});

screen.key(['C-c', 'q', 'escape'], () => process.exit(0));

const titleBox = blessed.box({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  content: ' {bold}{cyan-fg}╔══════════════════════════════════════╗{/cyan-fg}{/bold}\n {bold}{cyan-fg}║  CONFIGURADOR DE FORMATOS Y REDES     ║{/cyan-fg}{/bold}\n {bold}{cyan-fg}╚══════════════════════════════════════╝{/cyan-fg}{/bold}',
  tags: true,
  style: { bg: 'black' }
});

const formatosList = blessed.list({
  parent: screen,
  top: 4,
  left: 2,
  width: '40%',
  height: 12,
  label: ' {bold}{cyan-fg}FORMATOS{/cyan-fg}{/bold} ',
  border: { type: 'line', fg: 'cyan' },
  style: {
    fg: 'white',
    bg: 'black',
    selected: { fg: 'black', bg: 'cyan' },
    item: { fg: 'white', hover: { fg: 'cyan', bg: 'blue' } },
    focus: { border: { fg: 'green' } }
  },
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  items: NOMBRES_FORMATOS.map((f, i) => {
    const iconos = ['🎬', '📖', '📌', '🖼️', '🎥'];
    return `${iconos[i] || '📄'} ${f}`;
  })
});

const redesList = blessed.list({
  parent: screen,
  top: 4,
  left: '42%',
  width: '40%',
  height: 12,
  label: ' {bold}{yellow-fg}REDES SOCIALES{/yellow-fg}{/bold} ',
  border: { type: 'line', fg: 'yellow' },
  style: {
    fg: 'white',
    bg: 'black',
    selected: { fg: 'black', bg: 'yellow' },
    item: { fg: 'white', hover: { fg: 'yellow', bg: 'blue' } },
    focus: { border: { fg: 'green' } }
  },
  keys: true,
  vi: true,
  mouse: true,
  tags: true,
  items: TODAS_REDES.map(r => {
    const iconos = { Instagram: '📷', Facebook: '👍', TikTok: '🎵', YouTube: '▶️', LinkedIn: '💼', X: '🐦' };
    return `${iconos[r] || '🌐'} ${r}`;
  })
});

// Real mouse hover (no click): blessed.Element supports 'mouseover' natively
// on every item box, but List only exposes list-level events (select/select
// item/focus), none of which fire on plain cursor movement without a click.
// list.items is blessed's internal array of the actual item Box instances —
// setItems() recreates them, so this must be re-run after every setItems().
function attachHoverListeners(list, names, updateFn) {
  list.items.forEach((itemBox, idx) => {
    itemBox.on('mouseover', () => updateFn(names[idx]));
  });
}

function getRedesCompatibles(formato) {
  if (!formato) return TODAS_REDES;
  return MATRIZ[formato]?.redes || [];
}

function getFormatosCompatibles(red) {
  if (!red) return NOMBRES_FORMATOS;
  return NOMBRES_FORMATOS.filter(f => MATRIZ[f].redes.includes(red));
}

function aplicarFiltros(desdeFormato, desdeRed) {
  let redesHabilitadas = TODAS_REDES;
  let formatosHabilitados = NOMBRES_FORMATOS;

  if (desdeFormato && !desdeRed) {
    redesHabilitadas = MATRIZ[desdeFormato].redes;
  }
  if (desdeRed && !desdeFormato) {
    formatosHabilitados = NOMBRES_FORMATOS.filter(f => MATRIZ[f].redes.includes(desdeRed));
  }
  if (desdeFormato && desdeRed) {
    if (MATRIZ[desdeFormato].redes.includes(desdeRed)) {
      redesHabilitadas = [desdeRed];
      formatosHabilitados = [desdeFormato];
    } else {
      redesHabilitadas = [];
      formatosHabilitados = [];
    }
  }

  formatosList.setItems(NOMBRES_FORMATOS.map((f, i) => {
    const iconos = ['🎬', '📖', '📌', '🖼️', '🎥'];
    const habilitado = formatosHabilitados.includes(f);
    return habilitado
      ? `${iconos[i] || '📄'} ${f}`
      : ` {gray-fg}${iconos[i] || '📄'} ${f} (no compatible){/gray-fg}`;
  }));
  redesList.setItems(TODAS_REDES.map(r => {
    const iconos = { Instagram: '📷', Facebook: '👍', TikTok: '🎵', YouTube: '▶️', LinkedIn: '💼', X: '🐦' };
    const habilitado = redesHabilitadas.includes(r);
    return habilitado
      ? `${iconos[r] || '🌐'} ${r}`
      : ` {gray-fg}${iconos[r] || '🌐'} ${r} (no compatible){/gray-fg}`;
  }));

  attachHoverListeners(formatosList, NOMBRES_FORMATOS, actualizarInfoFormato);
  attachHoverListeners(redesList, TODAS_REDES, actualizarInfoRed);

  formatosList.select(0);
  redesList.select(0);
}

const infoBox = blessed.box({
  parent: screen,
  top: 16,
  left: 2,
  width: '96%',
  height: 8,
  label: ' {bold}{green-fg}INFORMACIÓN DEL FORMATO{/green-fg}{/bold} ',
  border: { type: 'line', fg: 'green' },
  style: { fg: 'white', bg: 'black' },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  content: ' {yellow-fg}⬆  Selecciona un formato (← columna izquierda) o una red social (→ columna derecha){/yellow-fg}\n {yellow-fg}   Los filtros cruzados se aplican automáticamente.{/yellow-fg}'
});

function actualizarInfoFormato(formato) {
  const f = MATRIZ[formato];
  if (!f) {
    infoBox.setContent(' {yellow-fg}⬆  Selecciona un formato o red social para ver sus detalles{/yellow-fg}');
    screen.render();
    return;
  }
  infoBox.setContent(
    ` {bold}{cyan-fg}📐 Medidas:{/cyan-fg}{/bold} ${f.medidas}\n` +
    ` {bold}{green-fg}🎯 Objetivo:{/green-fg}{/bold} ${f.objetivo}\n` +
    ` {bold}{yellow-fg}⏱ Duración:{/yellow-fg}{/bold} ${f.duracion}\n` +
    ` {bold}{magenta-fg}🌐 Redes compatibles:{/magenta-fg}{/bold} ${f.redes.join(', ')}`
  );
  screen.render();
}

function actualizarInfoRed(red) {
  const compatibles = getFormatosCompatibles(red);
  const detalles = compatibles.map(f => `• ${f}: ${MATRIZ[f].medidas}`).join('\n');
  infoBox.setContent(
    ` {bold}{yellow-fg}🌐 Red social:{/yellow-fg}{/bold} ${red}\n` +
    ` {bold}{green-fg}📋 Formatos compatibles ({compatibles.length}):{/green-fg}{/bold}\n` +
    `${detalles}`
  );
  screen.render();
}

let seleccionFormato = null;
let seleccionRed = null;

formatosList.on('select', (item, index) => {
  const nombre = NOMBRES_FORMATOS[index];
  if (!nombre) return;
  const compat = MATRIZ[nombre]?.redes || [];
  if (!compat.includes(seleccionRed) && seleccionRed) {
    seleccionRed = null;
  }
  seleccionFormato = nombre;
  if (seleccionRed && !compat.includes(seleccionRed)) {
    seleccionRed = null;
  }
  aplicarFiltros(seleccionFormato, seleccionRed);
  actualizarInfoFormato(seleccionFormato);
});

redesList.on('select', (item, index) => {
  const nombre = TODAS_REDES[index];
  if (!nombre) return;
  seleccionRed = nombre;
  const compat = getFormatosCompatibles(nombre);
  if (seleccionFormato && !compat.includes(seleccionFormato)) {
    seleccionFormato = null;
  }
  aplicarFiltros(seleccionFormato, seleccionRed);
  actualizarInfoRed(seleccionRed);
});

formatosList.on('focus', () => {
  const idx = formatosList.selected;
  if (idx >= 0 && idx < NOMBRES_FORMATOS.length) {
    actualizarInfoFormato(NOMBRES_FORMATOS[idx]);
  }
});

redesList.on('focus', () => {
  const idx = redesList.selected;
  if (idx >= 0 && idx < TODAS_REDES.length) {
    actualizarInfoRed(TODAS_REDES[idx]);
  }
});

// blessed's List has no 'highlight' event (verified against the installed
// library source, lib/widgets/list.js) — it was never firing, which is why
// arrow-key navigation never updated the info panel. The real event for
// "cursor moved, selection not yet confirmed" is 'select item', emitted by
// List.prototype.select() on every up/down move (and on programmatic
// .select() calls, e.g. from aplicarFiltros()).
formatosList.on('select item', (item, index) => {
  if (index >= 0 && index < NOMBRES_FORMATOS.length) {
    actualizarInfoFormato(NOMBRES_FORMATOS[index]);
  }
});

redesList.on('select item', (item, index) => {
  if (index >= 0 && index < TODAS_REDES.length) {
    actualizarInfoRed(TODAS_REDES[index]);
  }
});

const resetBtn = blessed.button({
  parent: screen,
  top: 16,
  left: '42%',
  width: 22,
  height: 3,
  content: ' {bold}⟳ RESTABLECER{/bold} ',
  align: 'center',
  valign: 'middle',
  tags: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'red',
    bold: true,
    focus: { fg: 'yellow', bg: 'darkred' },
    hover: { fg: 'white', bg: 'red', bold: true }
  }
});

resetBtn.on('press', () => {
  seleccionFormato = null;
  seleccionRed = null;
  aplicarFiltros(null, null);
  formatosList.select(0);
  redesList.select(0);
  infoBox.setContent(
    ' {yellow-fg}Filtros restablecidos. Selecciona un formato o red social.{/yellow-fg}'
  );
  screen.render();
});

const legendBox = blessed.box({
  parent: screen,
  top: 24,
  left: 2,
  width: '96%',
  height: 4,
  content:
    ' {bold}Navegación:{/bold}  {cyan-fg}⬆⬇{/cyan-fg} Navegar    {cyan-fg}⏎{/cyan-fg} Seleccionar    {cyan-fg}⇥{/cyan-fg} Cambiar columna    {cyan-fg}⟳ Rojo{/cyan-fg} Restablecer    {cyan-fg}Q{/cyan-fg} Salir',
  tags: true,
  style: { fg: 'gray', bg: 'black' }
});

// Reset button was unreachable by keyboard before: Tab only cycled between
// the two lists, so a non-mouse user could never focus/press it.
const tabOrder = [formatosList, redesList, resetBtn];
screen.key(['tab'], () => {
  const current = tabOrder.findIndex(w => w.focused);
  tabOrder[(current + 1) % tabOrder.length].focus();
});

// Initial items (set inline in the blessed.list() constructors above) never
// go through aplicarFiltros(), so they need their own hover wiring too.
attachHoverListeners(formatosList, NOMBRES_FORMATOS, actualizarInfoFormato);
attachHoverListeners(redesList, TODAS_REDES, actualizarInfoRed);

screen.render();
formatosList.focus();
