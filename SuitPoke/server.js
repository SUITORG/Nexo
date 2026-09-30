/* SuitPoke — servidor de salas en tiempo real (Node stdlib, cero dependencias)
 * Estático + API JSON + SSE. Estado de partida autoritativo aquí (condición panel-juzgador).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Motor = require('./js/motor.js');

const PUERTO = parseInt(process.env.PORT || '3014', 10);
const RAIZ = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8'
};

// ---------- Salas ----------
const salas = new Map(); // codigo -> { codigo, st, jugadores: Map(token -> {id, nombre, res}), creador, iniciada, bots: Set }
const TOK_chars = 'abcdefghijkmnpqrstuvwxyz23456789';
const COD_chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function token() { let t = ''; for (let i = 0; i < 16; i++) t += TOK_chars[Math.floor(Math.random() * TOK_chars.length)]; return t; }
function codigo() { let c = ''; for (let i = 0; i < 4; i++) c += COD_chars[Math.floor(Math.random() * COD_chars.length)]; if (salas.has(c)) return codigo(); return c; }
function soloNombre(s) { return String(s || 'Jugador').slice(0, 16).replace(/[<>]/g, ''); }

function salaPublica(s) {
  if (s.st) {
    return { codigo: s.codigo, iniciada: true, jugadores: s.st.jugadores.map(j => ({ id: j.id, nombre: j.nombre, hp: j.hp, fuera: j.fuera, esBot: j.esBot })) };
  }
  return {
    codigo: s.codigo, iniciada: false,
    jugadores: [...s.jugadores.values()].sort((a, b) => a.id - b.id)
      .map(p => ({ id: p.id, nombre: p.nombre, hp: Motor.HP_INICIAL, fuera: false, esBot: !!p.esBot }))
  };
}

function emitir(s) {
  for (const [tok, p] of s.jugadores) {
    if (!p.res || p.res.writableEnded) continue;
    const vista = s.st ? Motor.ver(s.st, p.id) : null;
    const datos = JSON.stringify({ tipo: 'estado', sala: salaPublica(s), vista: vista, turnoDe: s.st ? s.st.turno : null, yo: p.id });
    p.res.write('data: ' + datos + '\n\n');
  }
}

function moverBots(s) {
  if (!s.st || s.st.estado !== 'jugando') return;
  let guard = 0;
  while (guard++ < 20) {
    const j = s.st.jugadores[s.st.turno];
    if (!j || !j.esBot || j.fuera) break;
    const jugada = Motor.iaJugada(s.st, j.id);
    if (jugada) Motor.jugarCarta(s.st, j.id, jugada.idx, jugada.objId);
    else Motor.pasar(s.st, j.id);
    emitir(s);
    if (s.st.estado !== 'jugando') break;
  }
}

function leerBody(req) {
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 2e4) { rej(new Error('body muy grande')); req.destroy(); } });
    req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch (e) { rej(e); } });
    req.on('error', rej);
  });
}

function json(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(b);
}

async function api(req, res, ruta) {
  const partes = ruta.split('/').filter(Boolean); // api, ...
  const accion = partes[1];

  if (req.method === 'POST' && accion === 'crear') {
    const b = await leerBody(req);
    const cod = codigo();
    const s = { codigo: cod, st: null, jugadores: new Map(), creador: null, iniciada: false };
    const tok = token();
    s.creador = tok;
    s.jugadores.set(tok, { id: 0, nombre: soloNombre(b.nombre), res: null, token: tok });
    salas.set(cod, s);
    return json(res, 200, { codigo: cod, token: tok, yo: 0 });
  }

  if (req.method === 'POST' && accion === 'unirse') {
    const b = await leerBody(req);
    const s = salas.get(String(b.codigo || '').toUpperCase());
    if (!s) return json(res, 404, { err: 'Sala no encontrada' });
    if (s.iniciada) return json(res, 409, { err: 'La partida ya comenzó' });
    if (s.jugadores.size >= 4) return json(res, 409, { err: 'Sala llena (máx. 4)' });
    const tok = token();
    const id = Math.max(0, ...[...s.jugadores.values()].map(p => p.id)) + 1;
    s.jugadores.set(tok, { id: id, nombre: soloNombre(b.nombre), res: null, token: tok });
    for (const [, p] of s.jugadores) if (p.res && !p.res.writableEnded) p.res.write('data: ' + JSON.stringify({ tipo: 'lobby', sala: salaPublica(s) }) + '\n\n');
    return json(res, 200, { codigo: s.codigo, token: tok, yo: id });
  }

  if (req.method === 'POST' && accion === 'accion') {
    const b = await leerBody(req);
    const s = salas.get(String(b.codigo || '').toUpperCase());
    if (!s) return json(res, 404, { err: 'Sala no encontrada' });
    const p = s.jugadores.get(b.token);
    if (!p) return json(res, 403, { err: 'Token inválido' });

    if (b.tipo === 'iniciar') {
      if (b.token !== s.creador) return json(res, 403, { err: 'Solo el anfitrión inicia' });
      if (s.jugadores.size < 1) return json(res, 400, { err: 'Sin jugadores' });
      const nombres = [], bots = [];
      const lista = [...s.jugadores.values()].sort((a, c) => a.id - c.id);
      lista.forEach(pl => { nombres[pl.id] = pl.nombre; bots[pl.id] = false; });
      while (nombres.length < 2) { const i = nombres.length; nombres[i] = 'Bot ' + i; bots[i] = true; }
      s.st = Motor.crearPartida({ nombres: nombres, bots: bots });
      s.iniciada = true;
      emitir(s); moverBots(s);
      return json(res, 200, { ok: true });
    }

    if (b.tipo === 'bot') {
      if (b.token !== s.creador) return json(res, 403, { err: 'Solo el anfitrión añade bots' });
      if (s.iniciada) return json(res, 400, { err: 'Partida iniciada' });
      if (s.jugadores.size >= 4) return json(res, 400, { err: 'Sala llena' });
      const id = Math.max(0, ...[...s.jugadores.values()].map(x => x.id)) + 1;
      s.jugadores.set('bot-' + id, { id: id, nombre: 'Bot ' + id, res: null, token: 'bot-' + id, esBot: true });
      for (const [, pl] of s.jugadores) if (pl.res && !pl.res.writableEnded) pl.res.write('data: ' + JSON.stringify({ tipo: 'lobby', sala: salaPublica(s) }) + '\n\n');
      return json(res, 200, { ok: true });
    }

    if (!s.st) return json(res, 400, { err: 'Partida no iniciada' });
    let r;
    if (b.tipo === 'jugar') r = Motor.jugarCarta(s.st, p.id, b.idx, b.objId);
    else if (b.tipo === 'pasar') r = Motor.pasar(s.st, p.id);
    else return json(res, 400, { err: 'Acción desconocida' });
    if (!r.ok) return json(res, 400, { err: r.err });
    emitir(s); moverBots(s);
    return json(res, 200, { ok: true, resumen: r.resumen, efectos: r.efectos || [] });
  }

  return json(res, 404, { err: 'API no encontrada' });
}

function streamSSE(req, res, query) {
  const s = salas.get(String(query.codigo || '').toUpperCase());
  const p = s && s.jugadores.get(query.token);
  if (!s || !p) { res.writeHead(404); res.end('Sala no encontrada'); return; }
  if (p.res && !p.res.writableEnded) p.res.end();
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('retry: 2000\n\n');
  p.res = res;
  const beat = setInterval(() => { if (!res.writableEnded) res.write(': beat\n\n'); }, 15000);
  req.on('close', () => { clearInterval(beat); p.res = null; });
  // estado inicial
  const vista = s.st ? Motor.ver(s.st, p.id) : null;
  res.write('data: ' + JSON.stringify({ tipo: s.st ? 'estado' : 'lobby', sala: salaPublica(s), vista: vista, yo: p.id }) + '\n\n');
  if (s.st) moverBots(s);
}

const servidor = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  try {
    if (u.pathname.startsWith('/api/')) {
      if (u.pathname === '/api/stream') return streamSSE(req, res, u.query);
      return await api(req, res, u.pathname);
    }
    if (u.pathname === '/health') return json(res, 200, { ok: true, salas: salas.size });

    // estático
    let rel = decodeURIComponent(u.pathname);
    if (rel === '/') rel = '/index.html';
    const archivo = path.normalize(path.join(RAIZ, rel));
    if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
    fs.readFile(archivo, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  } catch (e) {
    json(res, 500, { err: 'error interno' });
  }
});

// limpieza de salas vacías con >2h de vida (ponytail: barrido simple, suficiente con pocas salas)
setInterval(() => {
  const ahora = Date.now();
  for (const [cod, s] of salas) {
    const conRes = [...s.jugadores.values()].some(p => p.res && !p.res.writableEnded);
    if (!conRes && s.st && s.st.estado === 'terminada' && Math.random() < 0.1) salas.delete(cod);
  }
}, 600000);

servidor.listen(PUERTO, () => console.log('SuitPoke listo en http://localhost:' + PUERTO));
module.exports = servidor;
