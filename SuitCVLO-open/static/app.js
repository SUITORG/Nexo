"use strict";
/* SuitCVLO-open — lógica de interfaz */

const $ = (s) => document.querySelector(s);
const D = window.CVLO_DEFAULTS || {};

const el = {
  aviso: $('#aviso'),
  btnIniciar: $('#btn-iniciar'),
  btnDetener: $('#btn-detener'),
  seccionProgreso: $('#seccion-progreso'),
  barra: $('#barra'),
  progresoTexto: $('#progreso-texto'),
  statsRuta: $('#stats-ruta'),
  statsCapas: $('#stats-capas'),
  listaFotos: $('#lista-fotos'),
  seccionResultados: $('#seccion-resultados'),
  stats: $('#stats'),
  resumenInfo: $('#resumen-info'),
  log: $('#log'),
  historial: $('#tabla-historial'),
  badgeMock: $('#badge-mock'),
  badgeIa: $('#badge-ia'),
  iaProveedor: $('#ia_proveedor'),
  iaModelo: $('#ia_modelo'),
  iaEstado: $('#ia-estado'),
  btnInfo: $('#btn-info'),
  btnReprocesar: $('#btn-reprocesar'),
  btnReescribir: $('#btn-reescribir'),
  infoFuentes: $('#info-fuentes'),
};

// precargar defaults
$('#salida').value = D.salida || '';
$('#pines').value = D.pines || '';
$('#kml').value = D.kml || '';
$('#idx').value = D.idx || '';
$('#drive_pics').value = D.drive || '';
$('#ruta_local').value = '';

let jobActual = null, timer = null;

function modo() {
  const r = document.querySelector('input[name=modo]:checked');
  return r ? r.value : 'web';
}

function pintarPaneles() {
  const m = modo();
  $('#panel-web').classList.toggle('oculto', m !== 'web');
  $('#panel-local').classList.toggle('oculto', m !== 'local');
  $('#panel-zip').classList.toggle('oculto', m !== 'zip');
  $('#panel-carpeta').classList.toggle('oculto', m !== 'carpeta');
}
document.querySelectorAll('input[name=modo]').forEach((r) => r.addEventListener('change', pintarPaneles));
pintarPaneles();

function aviso(msg, tipo) {
  el.aviso.textContent = msg;
  el.aviso.className = 'aviso ' + (tipo || 'error');
}
function ocultarAviso() { el.aviso.className = 'aviso oculto'; el.aviso.textContent = ''; }

async function iniciarCorrida(reproceso = false) {
  ocultarAviso();
  const fd = new FormData();
  const m = modo();
  fd.append('modo', m);
  fd.append('salida', $('#salida').value.trim());
  fd.append('pines', $('#pines').value.trim());
  fd.append('kml', $('#kml').value.trim());
  fd.append('idx', $('#idx').value.trim());
  fd.append('n_fotos', $('#n_fotos').value || '50');
  fd.append('radio', $('#radio').value || '250');
  fd.append('cap', $('#cap').value || '10');
  fd.append('pausa', $('#pausa').value || '1');
  fd.append('max_descargas', $('#max_descargas').value || '300');
  fd.append('comentario', $('#comentario').checked ? '1' : '0');
  fd.append('prioridad', $('#prioridad').value || 'kml');
  fd.append('ia_proveedor', el.iaProveedor.value || 'auto');
  fd.append('ia_modelo', el.iaModelo.value || '');
  fd.append('reproceso', reproceso ? '1' : '0');
  fd.append('cfg_ruta', cfgRuta());
  if (m === 'web') fd.append('drive_pics', $('#drive_pics').value.trim());
  if (m === 'local') fd.append('ruta_local', $('#ruta_local').value.trim());
  if (m === 'zip') {
    const f = $('#input-zip').files[0];
    if (!f) { aviso('Selecciona un archivo ZIP.'); return; }
    fd.append('archivo_zip', f, f.name);
  }
  if (m === 'carpeta') {
    const files = Array.from($('#input-carpeta').files || []);
    if (!files.length) { aviso('Selecciona una carpeta con fotos.'); return; }
    files.forEach((f) => fd.append('archivos', f, f.name));
  }

  el.btnIniciar.disabled = true;
  el.btnDetener.disabled = false;
  el.btnDetener.textContent = 'Detener';
  el.seccionProgreso.classList.remove('oculto');
  el.seccionResultados.classList.add('oculto');
  $('#lista-fotos').innerHTML = '';
  el.barra.style.width = '0%';
  el.progresoTexto.textContent = 'Iniciando…';

  try {
    const r = await fetch('/api/corridas', { method: 'POST', body: fd });
    const j = await r.json();
    if (!r.ok) { aviso(j.error || 'No se pudo iniciar.'); terminar(); return; }
    jobActual = j.id;
    sondeo();
  } catch (e) {
    aviso('Error de conexión: ' + e.message);
    terminar();
  }
}

el.btnIniciar.addEventListener('click', () => iniciarCorrida(false));

// Reprocesar: prepara (respaldo + limpia Verificado de las incompletas) y arranca sola
async function reprocesarIncompletas() {
  if (modo() !== 'local') { aviso('El reproceso necesita Modo Local (ruta) para saber qué se puede releer.'); return; }
  ocultarAviso();
  const q = new URLSearchParams({
    ruta: $('#ruta_local').value.trim(),
    salida: $('#salida').value.trim(),
    idx: $('#idx').value.trim()
  });
  let prev;
  try {
    const r = await fetch('/api/reprocesar/preview?' + q.toString());
    prev = await r.json();
    if (!r.ok) { aviso(prev.error || 'No pude analizar las fotos.'); return; }
  } catch (e) { aviso('Error de conexión: ' + e.message); return; }

  if (!prev.objetivas) { aviso('Nada que reprocesar: todo está al día.', 'ok'); return; }
  const mensaje = 'Se releerán ' + prev.objetivas + ' fotos:\n' +
    ' · ' + prev.sin_lectura + ' sin lectura\n' +
    ' · ' + prev.formato_viejo + ' con formato antiguo (sin CAMPAÑA separada)\n' +
    (prev.sin_origen ? ' · ' + prev.sin_origen + ' sin origen en la ruta → NO se tocan\n' : '') +
    '\nSe hará respaldo de idxfotos.xlsx. ¿Continuar?';
  if (!confirm(mensaje)) return;

  try {
    const r = await fetch('/api/reprocesar?' + q.toString(), { method: 'POST' });
    const d = await r.json();
    if (!r.ok) { aviso(d.error || 'No pude preparar el reproceso.'); return; }
    aviso('Respaldo ' + (d.respaldo ? 'creado' : 'no necesario') + ' · ' + d.limpiadas +
          ' filas marcadas para releer. Iniciando corrida…', 'ok');
    await iniciarCorrida(true);
  } catch (e) { aviso('Error de conexión: ' + e.message); }
}

el.btnReprocesar.addEventListener('click', reprocesarIncompletas);

// Reescribir info.txt: regenera TODOS los info.txt con las lecturas ya guardadas.
// No lee fotos con IA, no copia ni borra nada: solo rehace el texto.
async function reescribirInfo() {
  const salida = $('#salida').value.trim();
  if (!salida) { aviso('Falta la Ruta de Salida.'); return; }
  const prioridad = $('#prioridad').value || 'kml';
  const mensaje = 'Se reescribirán TODOS los info.txt de la salida y la columna\n' +
    'Marca del idxfotos.xlsx con las lecturas ya guardadas (prioridad: ' + prioridad + ').\n' +
    'No se lee ninguna foto con IA ni se borra ni se mueve ningún archivo. ¿Continuar?';
  if (!confirm(mensaje)) return;
  ocultarAviso();
  const fd = new FormData();
  fd.append('salida', salida);
  fd.append('pines', $('#pines').value.trim());
  fd.append('kml', $('#kml').value.trim());
  fd.append('idx', $('#idx').value.trim());
  fd.append('cfg_ruta', cfgRuta());
  fd.append('prioridad', prioridad);
  fd.append('comentario', $('#comentario').checked ? '1' : '0');
  try {
    const r = await fetch('/api/reescribir-info', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) { aviso(d.error || 'No pude reescribir los info.txt.'); return; }
    aviso(d.reescritas + ' info.txt y ' + (d.marcas || 0) + ' marcas reescritas (prioridad ' +
          d.prioridad + ', ' + d.reads + ' lecturas guardadas).', 'ok');
  } catch (e) { aviso('Error de conexión: ' + e.message); }
}

el.btnReescribir.addEventListener('click', reescribirInfo);

function sondeo() {
  if (timer) clearInterval(timer);
  timer = setInterval(consultar, 2000);
  consultar();
}

el.btnDetener.addEventListener('click', async () => {
  if (!jobActual) return;
  el.btnDetener.disabled = true;
  el.btnDetener.textContent = 'Deteniendo…';
  try {
    const r = await fetch('/api/corridas/' + jobActual + '/detener', { method: 'POST' });
    if (!r.ok) aviso('No se pudo detener la corrida.');
  } catch (e) { aviso('Error de conexión: ' + e.message); }
});

function terminar() {
  if (timer) { clearInterval(timer); timer = null; }
  el.btnIniciar.disabled = false;
  el.btnDetener.disabled = true;
  el.btnDetener.textContent = 'Detener';
}

async function consultar() {
  if (!jobActual) return;
  try {
    const r = await fetch('/api/corridas/' + jobActual);
    if (!r.ok) return;
    const j = await r.json();
    pintarProgreso(j);
    if (j.estado === 'listo' || j.estado === 'error') {
      pintarResultados(j);
      terminar();
      cargarHistorial();
    }
  } catch (e) { /* reintenta */ }
}

const EST = { pendiente: 'En espera', listo: 'Listo', error: 'Error', detenido: 'Detenida' };

function pintarProgreso(j) {
  const total = j.total || 0, hechas = j.completadas || 0;
  const pct = total ? Math.round(hechas / total * 100) : 0;
  el.barra.style.width = (j.estado === 'listo' ? 100 : Math.max(3, pct)) + '%';
  el.progresoTexto.textContent = 'Corrida ' + j.id + ' · ' + hechas + ' de ' + total +
    (j.actual ? ' · ' + j.actual : '') + ' · ' + j.estado;
  if (j.stats) {
    const s = j.stats;
    el.statsRuta.textContent = [
      (s.fuente || 0) + ' en la ruta',
      (s.con_gps || 0) + ' con GPS',
      (s.sin_gps || 0) + ' sin GPS',
      (s.fuera_radio || 0) + ' fuera de radio',
      (s.pines || 0) + ' PINs'
    ].join(' · ');
    el.statsRuta.classList.remove('oculto');
    if (s.capas) {
      const porCapa = Object.keys(s.capas).map((c) => c + ' ' + s.capas[c]).join(' · ');
      el.statsCapas.textContent = 'KML ' + (s.kml || 0) + ' PINs: ' + porCapa +
        ' · con CARA ' + (s.cara || 0);
      el.statsCapas.classList.remove('oculto');
    }
  }
  el.listaFotos.innerHTML = '';
  (j.fotos || []).forEach((f) => {
    const li = document.createElement('li');
    const izq = document.createElement('span');
    izq.textContent = f.nombre;
    const der = document.createElement('span');
    const pill = document.createElement('span');
    pill.className = 'pill ' + (f.estado || '');
    pill.textContent = EST[f.estado] || f.estado || '';
    der.appendChild(pill);
    if (f.error) {
      const er = document.createElement('div');
      er.style.color = '#B3261E'; er.style.fontSize = '12px'; er.textContent = f.error;
      der.appendChild(er);
    }
    li.appendChild(izq); li.appendChild(der);
    el.listaFotos.appendChild(li);
  });
  if (j.log && j.log.length) el.log.textContent = j.log.join('\n');
  if (j.deteniendo && !el.btnDetener.disabled) {
    el.btnDetener.disabled = true;
    el.btnDetener.textContent = 'Deteniendo…';
  }
}

function stat(valor, etiqueta) {
  const d = document.createElement('div');
  d.className = 'stat';
  const v = document.createElement('span'); v.className = 'valor'; v.textContent = valor;
  const e = document.createElement('span'); e.className = 'etiqueta'; e.textContent = etiqueta;
  d.appendChild(v); d.appendChild(e);
  el.stats.appendChild(d);
}

function pintarResultados(j) {
  el.seccionResultados.classList.remove('oculto');
  el.stats.innerHTML = '';
  if (j.estado === 'error') { aviso(j.error || 'La corrida terminó con error.'); }
  const r = j.resumen || {};
  stat(String(r.leidas || 0), 'Leídas');
  stat(String(r.copiadas || 0), 'Copiadas');
  stat(String(r.excedidas || 0), 'Excedidas tope');
  stat(String((r.pines || []).length), 'PINs');
  stat(String((r.grupos || []).length), 'Grupos');
  if (r.detenida) stat('Sí', 'Corrida detenida');
  if (r.detenida) aviso('Corrida detenida a mano. Lo ya leído quedó guardado.', 'ok');
  el.resumenInfo.textContent = 'Salida: ' + ($('#salida').value.trim()) + ' · idxfotos: ' + (r.idx || '—') +
    (r.grupos && r.grupos.length ? ' · grupos: ' + r.grupos.join(' | ') : '');
  if (j.log && j.log.length) el.log.textContent = j.log.join('\n');
}

$('#btn-copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#salida').value.trim());
    $('#btn-copiar').textContent = '¡Copiada!';
    setTimeout(() => { $('#btn-copiar').textContent = 'Copiar ruta de salida'; }, 1500);
  } catch (e) { aviso('No se pudo copiar: ' + e.message); }
});

async function estado() {
  try {
    const r = await fetch('/api/estado');
    const d = await r.json();
    el.badgeMock.classList.toggle('oculto', !d.mock);
    pintarEstadoIa(d.ia);
  } catch (e) { /* sin conexión */ }
}

async function cargarHistorial() {
  try {
    const r = await fetch('/api/corridas');
    const d = await r.json();
    el.historial.innerHTML = '';
    const tbody = document.createElement('tbody');
    const filas = d.corridas || [];
    if (!filas.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.className = 'suave'; td.textContent = 'Sin corridas aún.';
      tr.appendChild(td); tbody.appendChild(tr);
    } else {
      const thead = document.createElement('thead');
      const trh = document.createElement('tr');
      ['Inicio', 'Modo', 'Estado', 'Leídas', 'Total'].forEach((c) => {
        const th = document.createElement('th'); th.textContent = c; trh.appendChild(th);
      });
      thead.appendChild(trh);
      el.historial.appendChild(thead);
      filas.forEach((f) => {
        const tr = document.createElement('tr');
        [f.inicio, f.modo, f.estado, String(f.completadas || 0), String(f.total || 0)].forEach((c) => {
          const td = document.createElement('td'); td.textContent = c; tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    el.historial.appendChild(tbody);
  } catch (e) { /* sin conexión */ }
}

let IA_MODELOS = {};   // id -> proveedor
const IA_LS = 'cvlo-open-ia';

function guardarIa() {
  try {
    localStorage.setItem(IA_LS, JSON.stringify({ p: el.iaProveedor.value, m: el.iaModelo.value }));
  } catch (e) { /* modo privado */ }
}

async function cargarModelosIa() {
  try {
    const r = await fetch('/api/ia/modelos');
    const d = await r.json();
    const guardado = JSON.parse(localStorage.getItem(IA_LS) || '{}');
    const grupos = {};
    (d.modelos || []).forEach((m) => {
      IA_MODELOS[m.id] = m.proveedor;
      (grupos[m.proveedor] = grupos[m.proveedor] || []).push(m);
    });
    el.iaModelo.innerHTML = '';
    const auto = document.createElement('option');
    auto.value = ''; auto.textContent = 'auto (el primero disponible)';
    el.iaModelo.appendChild(auto);
    Object.keys(grupos).forEach((p) => {
      const og = document.createElement('optgroup');
      og.label = p + (p === 'ollama' ? ' — local' : ' — nube');
      grupos[p].forEach((m) => {
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = (m.vision ? '' : '[sin visión] ') + m.nombre;
        og.appendChild(o);
      });
      el.iaModelo.appendChild(og);
    });
    if (guardado.p) el.iaProveedor.value = guardado.p;
    if (guardado.m && Array.from(el.iaModelo.options).some((o) => o.value === guardado.m)) {
      el.iaModelo.value = guardado.m;
    }
    // corrige combinaciones guardadas inválidas (p.ej. auto + un modelo concreto)
    const pm = IA_MODELOS[el.iaModelo.value];
    if (el.iaModelo.value && pm) {
      if (el.iaProveedor.value === 'auto') el.iaProveedor.value = pm;
      else if (el.iaProveedor.value !== pm) el.iaModelo.value = '';
    }
  } catch (e) { /* sin conexión */ }
}

el.iaModelo.addEventListener('change', () => {
  const p = IA_MODELOS[el.iaModelo.value];
  if (p) el.iaProveedor.value = p;   // un modelo concreto usa su propio proveedor
  guardarIa();
});
el.iaProveedor.addEventListener('change', () => {
  const p = IA_MODELOS[el.iaModelo.value];
  if (el.iaProveedor.value !== 'auto' && p && p !== el.iaProveedor.value) el.iaModelo.value = '';
  guardarIa();
});

let IA_ESTADO = [];
function pintarEstadoIa(ia) {
  if (!ia || !ia.length) return;
  IA_ESTADO = ia;
  el.iaEstado.textContent = 'Cadena: ' + ia.map((x) =>
    x.proveedor + (x.disponible ? ' ●' : ' ○ (' + x.motivo + ')')).join('  →  ');
  const listos = ia.filter((x) => x.disponible).map((x) => x.proveedor);
  el.badgeIa.textContent = listos.length ? 'IA · ' + listos.join(', ') : 'IA · sin proveedores';
  el.badgeIa.className = 'insignia' + (listos.length ? '' : ' alerta');
}

// ---------- info de las fuentes (botón) ----------
let INFO = null;

function _paramsFuentes() {
  const q = new URLSearchParams();
  q.set('ruta', ($('#ruta_local') && $('#ruta_local').value || '').trim());
  q.set('pines', $('#pines').value.trim());
  q.set('kml', $('#kml').value.trim());
  q.set('idx', $('#idx').value.trim());
  q.set('salida', $('#salida').value.trim());   // sin esto excluye menos que la corrida
  q.set('radio', $('#radio').value || '250');
  return q;
}

// campos del KML que interesan mostrar como "aporte de la fuente"
const CAMPOS_KML = ['UBICACIÓN', 'MEDIO', 'COMENTARIOS', 'DIRECCIÓN', 'CIUDAD', 'CARA',
                    'CLIENTE', 'CODIGO MUPI', 'MARCA', 'descripcion'];

function pintarInfo(d) {
  const k = d.kml, i = d.indice, g = d.gps;
  const conGps = (g && !g.error) ? ' · ' + g.con_gps + ' con GPS · ' + g.sin_gps + ' sin GPS' : '';
  const capas = k ? Object.keys(k.capas).map((c) => c + ' ' + k.capas[c]).join(' · ') : 'n/d';
  const aporta = (k && k.campos)
    ? CAMPOS_KML.filter((c) => k.campos[c]).slice(0, 7)
        .map((c) => c + ' ' + k.campos[c]).join(' · ')
    : 'n/d';
  const avance = (d.fotos && i && i.verificadas != null)
    ? Math.round((i.verificadas / d.fotos) * 100) + '% · ' + i.verificadas + ' de ' + d.fotos + ' fotos'
    : 'n/d';
  el.infoFuentes.textContent = [
    'RUTA      ' + (d.ruta || '(sin ruta)'),
    'AVANCE    ' + avance,
    '',
    'FUENTES',
    '  FOTOS    ' + (d.fotos == null ? 'n/d (modo Web: se lista al correr)'
                     : d.fotos + ' en la ruta' + conGps),
    '  PINES    ' + (d.pines == null ? 'n/d' : d.pines + ' con coordenadas (cruzables)'),
    '  KML      ' + (k ? k.total + ' placemarks · ' + k.sin_lat + ' sin LATITUD · ' +
                     k.cara + ' con CARA' : 'n/d'),
    '           capas: ' + capas,
    '           aporta: ' + aporta,
    '  ÍNDICE   ' + (i && i.filas ? i.filas + ' filas · ' + i.verificadas +
                     ' verificadas · ' + i.no_gps + ' No GPS' : 'sin archivo'),
    '',
    'GPS       ' + (g ? (g.sin_ruta ? 'n/d (sin ruta local)'
      : g.error ? 'error: ' + g.error
      : g.con_gps + ' con · ' + g.sin_gps + ' sin · ' + g.fuera_radio + ' fuera de radio')
      : 'analizando…')
  ].join('\n');
  el.infoFuentes.classList.remove('oculto');
}

async function infoFuentes() {
  ocultarAviso();
  const q = _paramsFuentes();
  try {
    const r = await fetch('/api/fuentes?' + q.toString());
    const d = await r.json();
    if (!r.ok) { aviso(d.error || 'No pude leer las fuentes.'); return; }
    INFO = d;
    INFO.gps = null;
    pintarInfo(INFO);
  } catch (e) {
    aviso('Error de conexión: ' + e.message);
    return;
  }
  // sin ruta local (modo Web) no hay EXIF que escanear -> no se pide el desglose
  if (!q.get('ruta')) {
    INFO.gps = { sin_ruta: true };
    pintarInfo(INFO);
    return;
  }
  // segundo tiempo: desglose de GPS (lee el EXIF, 10-40 s)
  try {
    const r = await fetch('/api/fuentes/gps?' + q.toString());
    INFO.gps = await r.json();
    if (!r.ok) INFO.gps = { error: (INFO.gps && INFO.gps.error) || ('HTTP ' + r.status) };
  } catch (e) {
    INFO.gps = { error: e.message };
  }
  pintarInfo(INFO);
}

el.btnInfo.addEventListener('click', async () => {
  if (!el.infoFuentes.classList.contains('oculto')) {   // segundo clic = cerrar
    el.infoFuentes.classList.add('oculto');
    return;
  }
  await infoFuentes();
});

// cambiar la ruta/fuente invalida la info mostrada -> se oculta
['#ruta_local', '#pines', '#kml', '#idx'].forEach((sel) => {
  const e = $(sel);
  if (e) e.addEventListener('change', () => el.infoFuentes.classList.add('oculto'));
});
document.querySelectorAll('input[name=modo]').forEach((r) =>
  r.addEventListener('change', () => el.infoFuentes.classList.add('oculto')));

// ---------- CVLOCFG.txt (rutas precargadas, opcional) ----------
const CFG_LS = 'cvlo-open-cfg';
const CFG_RUTA_LS = 'cvlo-open-cfg-ruta';

function cfgActiva() {
  try { return localStorage.getItem(CFG_LS) !== '0'; } catch (e) { return true; }
}

function cfgRuta() {
  try { return localStorage.getItem(CFG_RUTA_LS) || ''; } catch (e) { return ''; }
}

// fuerza=true: carga aunque el switch esté apagado (el usuario pidió ese archivo a mano)
async function cargarCfg(fuerza) {
  if (!fuerza && !cfgActiva()) return;
  try {
    const ruta = cfgRuta();
    const r = await fetch('/api/config' + (ruta ? '?ruta=' + encodeURIComponent(ruta) : ''));
    const d = await r.json();
    const origen = ruta || d.archivo || 'CVLOCFG.txt';
    const inp = $('#cfg_ruta');
    if (inp && !inp.value) inp.value = d.archivo || ruta;   // deja ver qué archivo se está usando
    if (!r.ok || !d.existe) {
      if (fuerza) aviso('No encontré el archivo de configuración: ' + origen);
      return;
    }
    if (!d.rutas || !Object.keys(d.rutas).length) {
      if (fuerza) aviso('El archivo no tiene rutas: ' + origen);
      return;
    }
    const mapa = { fotos: '#ruta_local', salida: '#salida', pines: '#pines',
                   kml: '#kml', idx: '#idx', prioridad: '#prioridad' };
    Object.keys(mapa).forEach((k) => {
      const e = $(mapa[k]);
      if (e && d.rutas[k]) e.value = d.rutas[k];
    });
    // si el archivo no trae prioridad, el select vuelve a su defecto (KML) y no arrastra la anterior
    const selPrioridad = $('#prioridad');
    if (selPrioridad && !d.rutas.prioridad) selPrioridad.value = 'kml';
    if (d.rutas.fotos) {   // la config describe el flujo local
      const rLocal = document.querySelector('input[name=modo][value=local]');
      if (rLocal && !rLocal.checked) {
        rLocal.checked = true;
        rLocal.dispatchEvent(new Event('change'));
      }
    }
  } catch (e) { /* sin config: nada que hacer */ }
}

const cfgSwitch = $('#cfg_auto');
cfgSwitch.checked = cfgActiva();
cfgSwitch.addEventListener('change', (ev) => {
  try { localStorage.setItem(CFG_LS, ev.target.checked ? '1' : '0'); } catch (e) {}
  if (ev.target.checked) cargarCfg();
});

// elegir el archivo de configuración a mano (se recuerda en el navegador)
const cfgInput = $('#cfg_ruta');
if (cfgInput) cfgInput.value = cfgRuta();

function aplicarCfgRuta() {
  try { localStorage.setItem(CFG_RUTA_LS, (cfgInput && cfgInput.value.trim()) || ''); } catch (e) {}
  ocultarAviso();
  cargarCfg(true);   // pedido explícito: carga aunque el switch automático esté apagado
}
$('#btn-cfg').addEventListener('click', aplicarCfgRuta);
if (cfgInput) cfgInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { ev.preventDefault(); aplicarCfgRuta(); }
});

estado();
cargarModelosIa();
cargarHistorial();
cargarCfg();
