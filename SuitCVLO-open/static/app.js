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

el.btnIniciar.addEventListener('click', async () => {
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
  fd.append('ia_proveedor', el.iaProveedor.value || 'auto');
  fd.append('ia_modelo', el.iaModelo.value || '');
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
});

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
  } catch (e) { /* sin conexión */ }
}

el.iaModelo.addEventListener('change', () => {
  const p = IA_MODELOS[el.iaModelo.value];
  if (p) el.iaProveedor.value = 'auto';
  guardarIa();
});
el.iaProveedor.addEventListener('change', guardarIa);

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

estado();
cargarModelosIa();
cargarHistorial();
