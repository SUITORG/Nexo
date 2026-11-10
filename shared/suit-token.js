// shared/suit-token.js — guardia de mutaciones para módulos Suit* (TD-014 / Fase B)
// Uso en cada server: require('../shared/suit-token').mount(app);  (tras app.use(express.json()))
//
// Reglas para POST/PUT/PATCH/DELETE:
//   1) localhost            → pasa (dev local, scripts, pruebas)
//   2) Origin/Referer same-origin → pasa (la UI servida por el propio módulo, desde cualquier host)
//   3) header X-Suit-Token == SUIT_TOKEN (root .env) → pasa (callers no-browser remotos)
//   4) rutas /webhook*      → pasa (proveedores externos: Meta, Stripe… no pueden mandar token)
// GET siempre pasa. Rate-limit global (15min/100) si express-rate-limit está instalado.
// Nota honesta:2-3 son speed-bump contra escaneos/bots, no autenticación real de sesión.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadToken() {
  if (process.env.SUIT_TOKEN) return process.env.SUIT_TOKEN.trim();
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const m = raw.match(/^SUIT_TOKEN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function isLocal(req) {
  const ra = req.socket.remoteAddress || '';
  return ra === '127.0.0.1' || ra === '::1' || ra.endsWith('127.0.0.1');
}

function sameOrigin(req) {
  const ref = req.headers.origin || req.headers.referer;
  if (!ref) return false;
  try {
    return new URL(ref).host === req.headers.host;
  } catch {
    return false;
  }
}

function guard(req, res, next) {
  if (req.path.startsWith('/webhook')) return next();
  if (isLocal(req)) return next();
  if (sameOrigin(req)) return next();
  const tok = loadToken();
  if (tok && safeEqual(req.headers['x-suit-token'] || '', tok)) return next();
  res.status(401).json({ error: 'X-Suit-Token requerido para mutaciones remotas' });
}

function mount(app) {
  try {
    const { rateLimit } = require('express-rate-limit');
    app.use(
      rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
    );
  } catch {
    // sin express-rate-limit: solo la guardia de mutaciones
  }
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return guard(req, res, next);
    next();
  });
}

module.exports = { mount, loadToken, guard };
