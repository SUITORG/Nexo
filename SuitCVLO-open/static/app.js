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
  // solo se envía la ruta del CFG si el checkbox dice que la tomamos de ahí
  fd.append('cfg_ruta', cfgEnUso() ? cfgRuta() : '');
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
  sonidoPendiente = true;                      // al terminar la barra suena el aviso
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
  fd.append('cfg_ruta', cfgEnUso() ? cfgRuta() : '');
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

// ---------- aviso sonoro al terminar la barra ----------
// Dos notas suaves (C5 -> E5) generadas con Web Audio: sin archivos ni dependencias.
// Se arma al iniciar la corrida y suena solo cuando la barra llega al 100% (estado 'listo').
let sonidoPendiente = false;

function sonarFin() {
  if (!sonidoPendiente) return;               // una sola vez por corrida
  sonidoPendiente = false;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    [[523.25, 0], [659.25, 0.18]].forEach(function (par) {
      const freq = par[0], ret = par[1];
      const osc = ctx.createOscillator();
      const gan = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gan.gain.setValueAtTime(0.0001, t0 + ret);
      gan.gain.exponentialRampToValueAtTime(0.15, t0 + ret + 0.04);   // entra suave
      gan.gain.exponentialRampToValueAtTime(0.0001, t0 + ret + 0.55); // sale suave
      osc.connect(gan).connect(ctx.destination);
      osc.start(t0 + ret);
      osc.stop(t0 + ret + 0.6);
    });
    setTimeout(function () { try { ctx.close(); } catch (e) {} }, 1500);
  } catch (e) { /* sin audio disponible: no rompe nada */ }
}


// ---------- estado final: mensaje de cierre + punto de color ----------
// verde  = no hay más que leer (todo al día)
// naranja= falta información (pendientes o excedidas)
// rojo   = información inconsistente (duplicadas en el índice o errores)
const PUNTO_COLOR = { verde: '#27ae60', naranja: '#f39c12', rojo: '#e74c3c' };

async function estadoFinal(j) {
  const r = j.resumen || {};
  const s = j.stats || {};
  const ruta = $('#ruta_local').value.trim();
  const salida = $('#salida').value.trim();
  const idx = $('#idx').value.trim();
  const partes = [];
  if (s.fuente) partes.push(s.fuente + ' fotos en la ruta');
  partes.push((j.completadas || 0) + '/' + (j.total || 0) + ' en esta corrida');
  partes.push((r.leidas || 0) + ' leídas · ' + (r.copiadas || 0) + ' copiadas');
  if (r.excedidas) partes.push(r.excedidas + ' excedidas al tope');
  partes.push((r.pines || []).length + ' PINs · ' + (r.grupos || []).length + ' grupos');

  // pendientes (solo se pueden comprobar con ruta local)
  let pendientes = null;
  if (ruta && salida) {
    try {
      const p = await fetch('/api/reprocesar/preview?' +
        new URLSearchParams({ ruta: ruta, salida: salida, idx: idx }));
      if (p.ok) pendientes = (await p.json()).objetivas;
    } catch (e) { /* sin comprobación */ }
  }
  // duplicadas (información revuelta en el índice)
  let duplicadas = null;
  try {
    const f = await fetch('/api/fuentes?' + new URLSearchParams({ idx: idx }));
    if (f.ok) duplicadas = ((await f.json()).indice || {}).duplicadas;
  } catch (e) { /* sin comprobación */ }

  if (pendientes !== null) partes.push(pendientes + ' pendientes');
  if (duplicadas !== null) partes.push(duplicadas + ' duplicadas');

  const conError = j.estado === 'error' ||
    (j.log || []).some((l) => String(l).indexOf('ERROR') >= 0);
  let color, frase;
  if (conError || duplicadas > 0) {
    color = 'rojo';
    frase = 'Información inconsistente: ' +
      (conError ? 'hubo errores durante la corrida' : '') +
      (conError && duplicadas > 0 ? ' y ' : '') +
      (duplicadas > 0 ? duplicadas + ' fotos repetidas en el índice' : '') +
      '. Revisa antes de seguir.';
  } else if (pendientes > 0 || (r.excedidas || 0) > 0) {
    color = 'naranja';
    frase = 'Aún falta información: ' +
      (pendientes > 0 ? pendientes + ' fotos sin leer' : '') +
      (pendientes > 0 && r.excedidas ? ' y ' : '') +
      (r.excedidas ? r.excedidas + ' sin copiar (tope por PIN)' : '') +
      '. Usa "Reprocesar incompletas" o inicia un proceso nuevo.';
  } else {
    color = 'verde';
    frase = 'No hay más que leer: toda la información está leída y al día. ' +
      'Solo haría falta reprocesar o iniciar un proceso nuevo si quieres volver a correr.';
  }

  const viejo = document.getElementById('estado-final');
  if (viejo) viejo.remove();
  const p = document.createElement('p');
  p.id = 'estado-final';
  p.className = 'nota';
  p.style.marginTop = '6px';
  p.textContent = partes.join(' · ') + ' — ' + frase + ' ';
  const punto = document.createElement('span');
  punto.title = 'verde: al día · naranja: falta información · rojo: información inconsistente';
  punto.style.cssText = 'display:inline-block;width:11px;height:11px;border-radius:50%;' +
    'margin-left:6px;vertical-align:middle;background:' + PUNTO_COLOR[color] +
    ';box-shadow:0 0 0 2px rgba(0,0,0,.12)';
  p.appendChild(punto);
  if (el.resumenInfo && el.resumenInfo.parentNode) {
    el.resumenInfo.insertAdjacentElement('afterend', p);
  }
  return color;
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
      if (j.estado === 'listo') sonarFin();
      terminar();
      cargarHistorial();
      estadoFinal(j);
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

// campañas del KML/mapa + sus métricas (fase 1: pines/avance · fase 2: distancia)
function fusionarCampanas(d) {
  const base = (d.campanas || []).map((c) => Object.assign({}, c));
  if (!base.length && d.kml && d.kml.capas) {                    // respaldo si no viene fase 1
    Object.keys(d.kml.capas).forEach((n) => {
      base.push({ nombre: n, pines: d.kml.capas[n], auditados: null, verificadas: null });
    });
  }
  const gps = (d.gps && d.gps.campanas) || {};
  base.forEach((c) => {
    const g = gps[c.nombre];
    if (g) {
      c.dist_prom = g.dist_prom;
      c.n = g.n;
      c.pendientes = g.pendientes;
    }
  });
  return base;
}

// ---------- cifras compartidas entre el panel y el PDF (una sola verdad) ----------
function textoAvance(d) {
  const i = d.indice;
  if (!d.fotos || !i) return 'n/d';
  if (d.hechas == null) {
    return i.verificadas != null
      ? Math.round(i.verificadas / d.fotos * 100) + '% · ' + i.verificadas + ' de ' + d.fotos + ' fotos'
      : 'n/d';
  }
  let s = Math.round(d.hechas / d.fotos * 100) + '% · hechas ' + d.hechas + ' de ' + d.fotos +
    ' · pendientes ' + d.pendientes + ' · verificadas ' + i.verificadas;
  if (!d.pendientes) s += ' · ¡no hay más que procesar!';
  return s;
}

function datosFotos(d, campanas) {
  const g = d.gps;
  const conGps = g && g.con_gps != null ? g.con_gps : null;
  const sinGps = g && g.sin_gps != null ? g.sin_gps : null;
  const asignadas = campanas.reduce((s, c) => s + (c.pendientes || 0), 0);
  const pendientes = (conGps != null && sinGps != null) ? conGps + sinGps : null;
  const fuera = conGps != null ? conGps - asignadas : null;
  let cuadra = null;
  if (d.fotos != null && d.hechas != null && pendientes != null) {
    cuadra = (d.hechas + pendientes) === d.fotos;
  }
  return { total: d.fotos, hechas: d.hechas, pendientes: pendientes, conGps: conGps,
           sinGps: sinGps, asignadas: asignadas, fuera: fuera, cuadra: cuadra };
}

function textoFotos(dd) {
  const l = ['FOTOGRAFÍAS   ' + (dd.total == null ? 'n/d (sin ruta)' : dd.total + ' en la ruta')];
  if (dd.hechas != null) {
    l.push('  ya hechas (copiadas o leídas)   ' + dd.hechas);
  }
  if (dd.pendientes == null) {
    l.push('  pendientes   n/d (falta analizar el GPS)');
    return l;
  }
  l.push('  pendientes   ' + dd.pendientes +
    '  =  ' + (dd.asignadas == null ? 'n/d' : dd.asignadas) + ' asignadas a campañas' +
    '  ·  ' + (dd.fuera == null ? 'n/d' : dd.fuera) + ' fuera de alcance' +
    '  ·  ' + (dd.sinGps == null ? 'n/d' : dd.sinGps) + ' sin GPS');
  if (dd.cuadra === true) {
    l.push('  total   ' + dd.hechas + ' + ' + dd.pendientes + ' = ' + dd.total + '   ¡cuadra!');
  } else if (dd.cuadra === false) {
    l.push('  AVISO   hechas (' + dd.hechas + ') + pendientes (' + dd.pendientes +
      ') no suman el total (' + dd.total + ')');
  }
  return l;
}


// ---------- informe en PDF (mismo contenido que la pantalla) ----------
function lineasInforme(d, campanas, avanceFotos) {
  const conGps = (d.gps && !d.gps.error)
    ? ' · ' + d.gps.con_gps + ' con GPS · ' + d.gps.sin_gps + ' sin GPS' : '';
  const aporta = (d.kml && d.kml.campos)
    ? CAMPOS_KML.filter((c) => d.kml.campos[c]).slice(0, 7)
        .map((c) => c + ' ' + d.kml.campos[c]).join(' · ') : 'n/d';
  const aviso = d.aviso_mapa ? ['  AVISO    ' + d.aviso_mapa] : [];
  const l = [];
  l.push('SALIDA     ' + ($('#salida').value.trim() || '(sin ruta)'));
  l.push(...lineasBase(d, campanas, avanceFotos, conGps, aporta, aviso));
  l.push('');
  l.push('ANALISIS POR CAMPANA');
  l.push('  ' + 'Campana'.padEnd(34) + 'Pines'.padStart(6) +
         'Dist.media(m)'.padStart(14) + '% avance'.padStart(11));
  campanas.forEach((c) => {
    const pct = pctCampana(c);
    l.push('  ' + String(c.nombre).padEnd(34) + String(c.pines).padStart(6) +
      (c.dist_prom == null ? 'n/d' : String(c.dist_prom) + ' (' + (c.n || 0) + ')').padStart(14) +
      (pct == null ? 'n/d' : pct + '%').padStart(11));
  });
  const totPines = campanas.reduce((s, c) => s + (c.pines || 0), 0);
  const totLeidos = campanas.reduce((s, c) => s + (c.leidos || 0), 0);
  l.push('  ' + 'GLOBAL'.padEnd(34) + String(totPines).padStart(6) + ''.padStart(14) +
    (totPines ? Math.round(totLeidos / totPines * 100) + '%' : 'n/d').padStart(11));
  l.push('');
  l.push(...textoFotos(datosFotos(d, campanas)));
  l.push('');
  l.push('LEYENDAS');
  l.push('  AVANCE           = fotos hechas (copiadas o leidas) / fotos en la ruta;');
  l.push('                     100% = no hay mas que procesar.');
  l.push('  % avance campana = pines con al menos 1 foto leida / pines de la campana.');
  l.push('  Dist. media (m)  = media de la distancia foto-pin de las fotos dentro del');
  l.push('                     radio, con n muestras; n/d = sin fotos que crucen.');
  l.push('  hechas           = lo que la corrida ya salto (copiada o leida).');
  l.push('  asignadas        = pendientes con match en una campana; fuera de alcance =');
  l.push('                     con GPS pero sin match; sin GPS = sin coordenadas.');
  return l;
}

function pctCampana(c) {
  return (c.leidos != null && c.pines) ? Math.round(c.leidos / c.pines * 100) : null;
}

async function descargarInforme(d, campanas, avanceFotos) {
  ocultarAviso();
  const salida = $('#salida').value.trim();
  if (!salida) { aviso('Falta la Ruta de Salida: ahí se guarda el PDF.'); return; }
  try {
    const r = await fetch('/api/fuentes/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salida: salida, lineas: lineasInforme(d, campanas, avanceFotos) })
    });
    const j = await r.json();
    if (!r.ok) { aviso(j.error || 'No pude generar el PDF.'); return; }
    aviso('PDF guardado (' + j.bytes + ' bytes): ' + j.ruta, 'ok');
  } catch (e) { aviso('Error de conexión: ' + e.message); }
}


function pintarInfo(d) {
  const k = d.kml, i = d.indice, g = d.gps;
  const conGps = (g && !g.error) ? ' · ' + g.con_gps + ' con GPS · ' + g.sin_gps + ' sin GPS' : '';
  const aporta = (k && k.campos)
    ? CAMPOS_KML.filter((c) => k.campos[c]).slice(0, 7)
        .map((c) => c + ' ' + k.campos[c]).join(' · ')
    : 'n/d';
  const avance = textoAvance(d);
  const campanas = fusionarCampanas(d);
  const lista = campanas.slice(0, 12).map((c) =>
    '  ' + c.nombre.padEnd(34, ' ') + String(c.pines).padStart(5));
  if (campanas.length > 12) {
    lista.push('  … ' + (campanas.length - 12) + ' campañas más (ver Análisis)');
  }
  const aviso = d.aviso_mapa ? ['  AVISO    ' + d.aviso_mapa] : [];
  const texto = lineasBase(d, campanas, avance, conGps, aporta, aviso).join('\n');

  el.infoFuentes.textContent = '';
  el.infoFuentes.appendChild(document.createTextNode(texto));
  if (campanas.length) {
    el.infoFuentes.appendChild(tableroCampanas(campanas, avance, g, d));
  }
  el.infoFuentes.classList.remove('oculto');
}

// texto base del panel (una sola fuente: lo usa la pantalla y el PDF)
function lineasBase(d, campanas, avance, conGps, aporta, aviso) {
  const k = d.kml, i = d.indice, g = d.gps;
  const lista = campanas.slice(0, 12).map((c) =>
    '  ' + c.nombre.padEnd(34, ' ') + String(c.pines).padStart(5));
  if (campanas.length > 12) {
    lista.push('  … ' + (campanas.length - 12) + ' campañas más (ver Análisis)');
  }
  return [
    'RUTA      ' + (d.ruta || '(sin ruta)'),
    'AVANCE    ' + avance,
    '',
    'FUENTES',
    '  FOTOS    ' + (d.fotos == null ? 'n/d (modo Web: se lista al correr)'
                     : d.fotos + ' en la ruta' + conGps),
    '  PINES    ' + (d.pines == null ? 'n/d' : d.pines + ' con coordenadas (cruzables)'),
    '  KML      ' + (k ? k.total + ' placemarks · ' + k.sin_lat + ' sin LATITUD · ' +
                     k.cara + ' con CARA' : 'n/d'),
    ...(aviso || []),
    '           aporta: ' + aporta,
    '  ÍNDICE   ' + (i && i.filas ? i.filas + ' filas · ' + i.verificadas +
                     ' verificadas · ' + i.no_gps + ' No GPS' +
                     (i.duplicadas ? ' · ' + i.duplicadas + ' DUPLICADAS' : '') : 'sin archivo'),
    '',
    'CAMPAÑAS' + ' '.repeat(25) + 'PINs',
    ...lista,
    '',
    'GPS       ' + (g ? (g.sin_ruta ? 'n/d (sin ruta local)'
      : g.error ? 'error: ' + g.error
      : g.con_gps + ' con · ' + g.sin_gps + ' sin · ' + g.fuera_radio + ' fuera de radio')
      : 'analizando…')
  ];
}

// ---------- dashboard de análisis (opción A: dentro del panel) ----------
function bloqueFotos(d, campanas) {
  const div = document.createElement('div');
  div.className = 'cuenta';
  div.textContent = textoFotos(datosFotos(d, campanas)).join('\n');
  return div;
}

function tableroCampanas(campanas, avanceFotos, g, d) {
  const det = document.createElement('details');
  det.className = 'tablero';
  const sum = document.createElement('summary');
  sum.textContent = 'Análisis por campaña — pines · distancia media · % de avance';
  det.appendChild(sum);

  const leyenda = document.createElement('p');
  leyenda.className = 'nota-tab';
  leyenda.textContent = 'avance global en fotos (AVANCE arriba): ' + avanceFotos +
    ' · % de avance = pines con ≥1 foto leída ÷ pines de la campaña · ' +
    'distancia media = media foto↔pin de las fotos dentro del radio (n = muestras)' +
    (g && g.radio ? ' · radio ' + g.radio + ' m' : '');
  det.appendChild(leyenda);

  if (d) {                                  // botón del PDF (usa los mismos datos del panel)
    const btnPdf = document.createElement('button');
    btnPdf.type = 'button';
    btnPdf.className = 'boton pequeno';
    btnPdf.textContent = 'Descargar análisis (PDF)';
    btnPdf.title = 'Se guarda en la Ruta de Salida con fecha y hora';
    btnPdf.addEventListener('click', () => descargarInforme(d, campanas, avanceFotos));
    det.appendChild(btnPdf);
  }

  const cols = [
    { k: 'nombre', t: 'Campaña' },
    { k: 'pines', t: 'Pines' },
    { k: 'dist', t: 'Dist. media (m)' },
    { k: 'avance', t: '% avance' }
  ];
  const tabla = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  cols.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c.t;
    th.dataset.k = c.k;
    th.title = 'clic para ordenar';
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tabla.appendChild(thead);

  const pctDe = (c) => (c.leidos != null && c.pines ? Math.round(c.leidos / c.pines * 100) : null);

  const celda = (txt, cls) => {
    const td = document.createElement('td');
    td.textContent = txt;
    if (cls) td.className = cls;
    return td;
  };
  const celdaBarra = (pct, titulo) => {
    const td = document.createElement('td');
    td.className = 'barra-cel';
    td.appendChild(document.createTextNode(pct == null ? 'n/d' : pct + '%'));
    const pista = document.createElement('div');
    pista.className = 'pista';
    const rell = document.createElement('div');
    rell.className = 'relleno';
    rell.style.width = (pct == null ? 0 : pct) + '%';
    pista.appendChild(rell);
    td.appendChild(pista);
    if (titulo) td.title = titulo;
    return td;
  };

  const tbody = document.createElement('tbody');
  campanas.forEach((c) => {
    const tr = document.createElement('tr');
    tr.dataset.nombre = c.nombre;
    tr.dataset.pines = c.pines;
    tr.dataset.dist = c.dist_prom == null ? '' : c.dist_prom;
    tr.dataset.avance = pctDe(c) == null ? '' : pctDe(c);
    tr.appendChild(celda(c.nombre));
    tr.appendChild(celda(String(c.pines)));
    tr.appendChild(celda(c.dist_prom == null ? 'n/d' : c.dist_prom + ' (' + (c.n || 0) + ')'));
    tr.appendChild(celdaBarra(pctDe(c),
      (c.leidos != null ? c.leidos + ' de ' + c.pines + ' pines con foto leída' : '') +
      (c.auditados != null ? ' · ' + c.auditados + ' con Verificado ✓' : '') +
      (c.pendientes ? ' · ' + c.pendientes + ' fotos pendientes con match en ' +
        (g && g.radio ? g.radio : 250) + ' m' : '')));
    tbody.appendChild(tr);
  });
  tabla.appendChild(tbody);

  // fila GLOBAL: pines leídos (cobertura) + distancia media global
  const totPines = campanas.reduce((s, c) => s + (c.pines || 0), 0);
  const totLeidos = campanas.reduce((s, c) => s + (c.leidos || 0), 0);
  const conLeidos = campanas.filter((c) => c.leidos != null);
  const cDist = campanas.filter((c) => c.dist_prom != null && c.n);
  const distGlobal = cDist.length
    ? Math.round(cDist.reduce((s, c) => s + c.dist_prom * c.n, 0) / cDist.reduce((s, c) => s + c.n, 0) * 10) / 10
    : null;
  const cobertura = conLeidos.length === campanas.length && totPines
    ? Math.round(totLeidos / totPines * 100) : null;
  const tfoot = document.createElement('tfoot');
  const trf = document.createElement('tr');
  trf.appendChild(celda('GLOBAL'));
  trf.appendChild(celda(String(totPines)));
  trf.appendChild(celda(distGlobal == null ? 'n/d' : distGlobal + ' (todas)'));
  trf.appendChild(celdaBarra(cobertura,
    totLeidos + ' de ' + totPines + ' pines con foto leída · avance en fotos: ' + avanceFotos));
  tfoot.appendChild(trf);
  tabla.appendChild(tfoot);
  det.appendChild(tabla);
  if (d) det.appendChild(bloqueFotos(d, campanas));

  // orden por clic en la cabecera (empieza: pines desc)
  let kActual = null, asc = false;
  const aplicar = (k) => {
    asc = (k === kActual) ? !asc : (k === 'nombre');
    kActual = k;
    Array.from(tbody.children)
      .sort((a, b) => {
        const va = a.dataset[k], vb = b.dataset[k];
        if (k === 'nombre') return asc ? va.localeCompare(vb, 'es') : vb.localeCompare(va, 'es');
        const na = va === '' ? -1 : parseFloat(va);
        const nb = vb === '' ? -1 : parseFloat(vb);
        return asc ? na - nb : nb - na;
      })
      .forEach((tr) => tbody.appendChild(tr));
    Array.from(trh.children).forEach((th) => {
      th.textContent = th.dataset.k === k ? (asc ? '▲ ' : '▼ ') + th.textContent.replace(/^[▲▼]\s*/, '')
        : th.textContent.replace(/^[▲▼]\s*/, '');
    });
  };
  Array.from(trh.children).forEach((th) => {
    th.addEventListener('click', () => aplicar(th.dataset.k));
  });
  aplicar('pines');
  return det;
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

// ¿Tomamos la config de la ruta del CFG? El checkbox manda (es el estado real en pantalla)
function cfgEnUso() {
  const sw = $('#cfg_auto');
  return sw ? sw.checked : cfgActiva();
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
  // pedido explícito = "lo tomamos de ahí": encendemos el checkbox si estaba apagado
  const sw = $('#cfg_auto');
  if (sw && !sw.checked) {
    sw.checked = true;
    try { localStorage.setItem(CFG_LS, '1'); } catch (e) {}
  }
  ocultarAviso();
  cargarCfg(true);
}
$('#btn-cfg').addEventListener('click', aplicarCfgRuta);
if (cfgInput) cfgInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { ev.preventDefault(); aplicarCfgRuta(); }
});

// Alimenta la lista de marcas con lo que la IA ya vio en las lecturas guardadas (sin IA nueva)
$('#btn-marcas').addEventListener('click', async () => {
  ocultarAviso();
  const fd = new FormData();
  fd.append('cfg_ruta', cfgEnUso() ? cfgRuta() : '');
  try {
    const r = await fetch('/api/marcas/actualizar', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) { aviso((d && d.error) || 'No pude actualizar las marcas.'); return; }
    const archivo = String(d.archivo || '').split(/[\\/]/).pop();
    if (!d.agregadas || !d.agregadas.length) {
      aviso('Nada nuevo: la lista de ' + archivo + ' ya tiene las ' + d.total +
            ' marcas vistas.', 'ok');
      return;
    }
    aviso('+' + d.agregadas.length + ' marcas en ' + archivo + ' (total ' + d.total + '): ' +
          d.agregadas.slice(0, 6).join(', ') + (d.agregadas.length > 6 ? '…' : '') +
          '. Se aplica en la próxima corrida o con "Reescribir info.txt y Marca".', 'ok');
  } catch (e) { aviso('Error de conexión: ' + e.message); }
});

estado();
cargarModelosIa();
cargarHistorial();
cargarCfg();
