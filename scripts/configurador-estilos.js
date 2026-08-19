#!/usr/bin/env node
// TUI de consulta de Estilos Visuales para VIDE — lee en vivo de Supabase
// (video_categorias_estilo / video_subestilos), a diferencia de
// configurador-formatos.js que usa un catálogo fijo desde GUIAFMTRRSS.MD.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const blessed = require('blessed');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

const screen = blessed.screen({
  smartCSR: true,
  title: 'Configurador de Estilos Visuales (VIDE)',
  dockBorders: true,
  autoPadding: true,
  cursor: { artificial: true, shape: 'underline', blink: true, color: 'blue' }
});
screen.key(['C-c', 'q', 'escape'], () => process.exit(0));

const titleBox = blessed.box({
  parent: screen, top: 0, left: 0, width: '100%', height: 3,
  content: ' {bold}{cyan-fg}╔══════════════════════════════════════╗{/cyan-fg}{/bold}\n {bold}{cyan-fg}║  ESTILOS VISUALES — VIDE (Supabase)   ║{/cyan-fg}{/bold}\n {bold}{cyan-fg}╚══════════════════════════════════════╝{/cyan-fg}{/bold}',
  tags: true, style: { bg: 'black' }
});

const list = blessed.list({
  parent: screen, top: 4, left: 2, width: '96%', height: 14,
  label: ' {bold}{cyan-fg}CATEGORÍAS{/cyan-fg}{/bold} ',
  border: { type: 'line', fg: 'cyan' },
  style: {
    fg: 'white', bg: 'black',
    selected: { fg: 'black', bg: 'cyan' },
    item: { fg: 'white', hover: { fg: 'cyan', bg: 'blue' } },
    focus: { border: { fg: 'green' } }
  },
  keys: true, vi: true, mouse: true, tags: true,
  items: ['Cargando desde Supabase...']
});

const infoBox = blessed.box({
  parent: screen, top: 19, left: 2, width: '96%', height: 7,
  label: ' {bold}{green-fg}INFORMACIÓN{/green-fg}{/bold} ',
  border: { type: 'line', fg: 'green' },
  style: { fg: 'white', bg: 'black' },
  tags: true, scrollable: true, alwaysScroll: true,
  content: ' {yellow-fg}Cargando...{/yellow-fg}'
});

const legendBox = blessed.box({
  parent: screen, top: 27, left: 2, width: '96%', height: 3,
  content: ' {bold}Navegación:{/bold}  {cyan-fg}⬆⬇{/cyan-fg} Navegar    {cyan-fg}⏎{/cyan-fg} Elegir / Volver    {cyan-fg}Q{/cyan-fg} Salir',
  tags: true, style: { fg: 'gray', bg: 'black' }
});

let categorias = [];
let nivel = 'categorias'; // 'categorias' | 'subestilos'
let categoriaActual = null;

// Re-run after every setItems() the same way configurador-formatos.js does —
// blessed reuses existing item boxes when the count doesn't shrink, so this
// only actually re-attaches listeners the first time a given index is created,
// but it's cheap and correct to call every time regardless.
function attachHoverListeners(names, updateFn) {
  list.items.forEach((itemBox, idx) => {
    itemBox.on('mouseover', () => updateFn(names[idx]));
  });
}

function mostrarInfoCategoria(nombre) {
  const cat = categorias.find(c => c.nombre === nombre);
  if (!cat) return;
  infoBox.setContent(
    ` {bold}{cyan-fg}${cat.icono || '📁'} ${cat.nombre}{/cyan-fg}{/bold}\n` +
    ` ${cat.descripcion || ''}\n` +
    ` {bold}{green-fg}Sub-estilos:{/green-fg}{/bold} ${(cat.subestilos || []).length}`
  );
  screen.render();
}

function mostrarInfoSub(nombreConVolver) {
  if (nombreConVolver === '← Volver a categorías') {
    infoBox.setContent(' {yellow-fg}Enter para volver a la lista de categorías{/yellow-fg}');
    screen.render();
    return;
  }
  const sub = (categoriaActual?.subestilos || []).find(s => s.nombre === nombreConVolver);
  if (!sub) return;
  infoBox.setContent(
    ` {bold}{green-fg}${sub.nombre}{/green-fg}{/bold}\n` +
    ` ${sub.descripcion || ''}\n` +
    ` {bold}{yellow-fg}Keywords IA:{/yellow-fg}{/bold} ${sub.keywords_ia || '(ninguna)'}\n` +
    ` {bold}{magenta-fg}Tendencia base:{/magenta-fg}{/bold} ${sub.tendencia_base ?? '-'}`
  );
  screen.render();
}

function renderCategorias() {
  nivel = 'categorias';
  categoriaActual = null;
  list.setLabel(' {bold}{cyan-fg}CATEGORÍAS{/cyan-fg}{/bold} ');
  const items = categorias.map(c => `${c.icono || '📁'} ${c.nombre}  (${(c.subestilos || []).length} sub-estilos)`);
  list.setItems(items.length ? items : ['(sin categorías en Supabase)']);
  attachHoverListeners(categorias.map(c => c.nombre), mostrarInfoCategoria);
  list.select(0);
  if (categorias[0]) mostrarInfoCategoria(categorias[0].nombre);
  screen.render();
}

function renderSubestilos(cat) {
  nivel = 'subestilos';
  categoriaActual = cat;
  list.setLabel(` {bold}{cyan-fg}${(cat.icono || '📁')} ${cat.nombre.toUpperCase()}{/cyan-fg}{/bold} `);
  const nombres = ['← Volver a categorías', ...(cat.subestilos || []).map(s => s.nombre)];
  list.setItems(nombres);
  attachHoverListeners(nombres, mostrarInfoSub);
  list.select(0);
  mostrarInfoSub(nombres[0]);
  screen.render();
}

list.on('select', (item, index) => {
  if (nivel === 'categorias') {
    const cat = categorias[index];
    if (cat) renderSubestilos(cat);
  } else {
    if (index === 0) {
      renderCategorias();
    }
    // selecting an actual sub-estilo: nothing further to do — this TUI is a
    // read-only browser, info panel already shows keywords_ia on 'select item'.
  }
});

// Keyboard-nav live preview — blessed.List has no 'highlight' event, the real
// one is 'select item' (see ADR-013 for how this was found the hard way).
list.on('select item', (item, index) => {
  if (nivel === 'categorias') {
    if (categorias[index]) mostrarInfoCategoria(categorias[index].nombre);
  } else {
    const nombres = ['← Volver a categorías', ...(categoriaActual?.subestilos || []).map(s => s.nombre)];
    if (nombres[index]) mostrarInfoSub(nombres[index]);
  }
});

list.on('focus', () => {
  if (nivel === 'categorias' && categorias[list.selected]) mostrarInfoCategoria(categorias[list.selected].nombre);
});

screen.render();
list.focus();

(async () => {
  try {
    const { data: cats, error: errCats } = await supabase
      .from('video_categorias_estilo')
      .select('*')
      .eq('activo', true)
      .order('id');
    if (errCats) throw errCats;
    const ids = (cats || []).map(c => c.id);
    const { data: subs, error: errSubs } = await supabase
      .from('video_subestilos')
      .select('*')
      .in('id_categoria', ids)
      .eq('activo', true)
      .order('id');
    if (errSubs) throw errSubs;
    categorias = (cats || []).map(c => ({ ...c, subestilos: (subs || []).filter(s => s.id_categoria === c.id) }));
    renderCategorias();
  } catch (e) {
    list.setItems([`❌ Error conectando a Supabase: ${e.message}`]);
    infoBox.setContent(` {red-fg}Revisa SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env{/red-fg}`);
    screen.render();
  }
})();
