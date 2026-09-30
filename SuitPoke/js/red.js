/* SuitPoke — cliente de red (salas online por SSE) */
(function () {
  'use strict';

  async function post(ruta, body) {
    const r = await fetch(ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.err || 'Error de red');
    return j;
  }

  window.Red = {
    crear: nombre => post('/api/crear', { nombre: nombre }),
    unirse: (codigo, nombre) => post('/api/unirse', { codigo: codigo, nombre: nombre }),
    accion: body => post('/api/accion', body),
    // onMsg: callback({tipo:'lobby'|'estado', ...}); devuelve el EventSource
    stream(codigo, token, onMsg) {
      const es = new EventSource('/api/stream?codigo=' + encodeURIComponent(codigo) + '&token=' + encodeURIComponent(token));
      es.onmessage = e => { try { onMsg(JSON.parse(e.data)); } catch (err) { /* skip */ } };
      es.onerror = () => { /* EventSource reintenta solo (retry: 2000 del servidor) */ };
      return es;
    }
  };
})();
