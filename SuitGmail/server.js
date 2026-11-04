// SuitGmail — lector de correos (banco / pagos / luz / agua / telefono) vía Gmail API
// OAuth de USUARIO multi-cuenta: la service_account de google-credentials.json NO puede
// leer un Gmail personal. Cada buzón se autoriza una vez con /auth (consentimiento) y su
// refresh_token vive en config.json bajo cuentas[]. Setup por cuenta:
//   1) Consola GCP: cliente OAuth (Desktop) + Gmail API + pantalla de consentimiento
//      con alcance gmail.readonly y la cuenta en "usuarios de prueba".
//   2) Entrar a http://127.0.0.1:3021/auth con ESA cuenta de Google -> listo.
// Cero dependencias: node >= 18 (fetch global).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3021;
const CFG = path.join(ROOT, 'config.json');
const REGLAS = path.join(ROOT, 'reglas.json');
const REDIRECT = `http://127.0.0.1:${PORT}/auth/callback`;
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

const load = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const save = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2));

let cfg = load(CFG, {});
const tokens = {}; // email -> { access_token, expires_at }

// normaliza formato viejo {refresh_token} -> cuentas[{email,refresh_token}]
function cuentas() {
  if (!Array.isArray(cfg.cuentas)) {
    cfg.cuentas = cfg.refresh_token ? [{ email: cfg.email || 'principal', refresh_token: cfg.refresh_token }] : [];
    if (cfg.refresh_token) delete cfg.refresh_token;
    save(CFG, cfg);
  }
  return cfg.cuentas;
}

async function accessToken(c) {
  if (tokens[c.email] && Date.now() < tokens[c.email].expires_at - 60000) return tokens[c.email].access_token;
  if (!c.refresh_token || !cfg.client_id || !cfg.client_secret) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
      refresh_token: c.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  if (!r.ok) return null;
  const d = await r.json();
  tokens[c.email] = { access_token: d.access_token, expires_at: Date.now() + (d.expires_in || 3500) * 1000 };
  return tokens[c.email].access_token;
}

async function perfilEmail(access_token) {
  try {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: 'Bearer ' + access_token }
    });
    if (!r.ok) return null;
    return (await r.json()).emailAddress || null;
  } catch { return null; }
}

function clasificar(m, reglas) {
  const from = (m.from || '').toLowerCase();
  const txt = ((m.subject || '') + ' ' + (m.snippet || '')).toLowerCase();
  let cat = null, catDef = null;
  for (const [nombre, r] of Object.entries(reglas.categorias || {})) {
    if ((r.remitentes || []).some(d => from.includes(d)) || (r.palabras || []).some(p => txt.includes(p))) {
      cat = nombre; catDef = r; break;
    }
  }
  if (!cat) return null;
  const rojo = (reglas.rojo || []).some(k => txt.includes(k));
  const verde = (reglas.verde || []).some(k => txt.includes(k));
  const nivel = rojo ? 'rojo' : verde ? 'verde' : (catDef.nivel || 'amarillo');
  const mm = txt.match(/\$?\s?\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\$?\s?\d+\.\d{2}/);
  return {
    nivel,
    categoria: cat,
    remitente: m.from,
    asunto: (m.subject || '').slice(0, 140),
    fecha: m.date || '',
    monto: mm ? mm[0].trim() : null,
    snippet: (m.snippet || '').slice(0, 200),
    id: m.id
  };
}

async function resumenCuenta(c, reglas) {
  const at = await accessToken(c);
  if (!at) return { cuenta: c.email, revisados: 0, alerts: [], error: 'token invalido — re-authoriza /auth' };
  const lr = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=newer_than:2d', {
    headers: { Authorization: 'Bearer ' + at }
  });
  if (!lr.ok) return { cuenta: c.email, revisados: 0, alerts: [], error: 'gmail list HTTP ' + lr.status };
  const ids = ((await lr.json()).messages || []);
  const msgs = [];
  for (let i = 0; i < ids.length; i += 10) {
    const batch = await Promise.all(ids.slice(i, i + 10).map(async m => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: 'Bearer ' + at } }
      );
      if (!r.ok) return null;
      const d = await r.json();
      const h = {};
      ((d.payload && d.payload.headers) || []).forEach(x => { h[String(x.name).toLowerCase()] = x.value; });
      return { id: m.id, from: h.from || '', subject: h.subject || '', date: h.date || '', snippet: d.snippet || '' };
    }));
    msgs.push(...batch.filter(Boolean));
  }
  const alerts = [];
  for (const m of msgs) {
    const a = clasificar(m, reglas);
    if (a) { a.ts = Date.parse(m.date) || 0; a.cuenta = c.email; alerts.push(a); }
  }
  return { cuenta: c.email, revisados: msgs.length, alerts };
}

async function resumen() {
  const cs = cuentas();
  if (!cs.length) return { ok: false, auth: false, error: 'sin cuentas — entra a /auth una vez' };
  const reglas = load(REGLAS, {});
  const resultados = [];
  for (const c of cs) resultados.push(await resumenCuenta(c, reglas));
  const alerts = resultados.flatMap(r => r.alerts || []);
  const orden = { rojo: 0, amarillo: 1, verde: 2 };
  alerts.sort((a, b) => (orden[a.nivel] - orden[b.nivel]) || (b.ts - a.ts));
  return {
    ok: true,
    auth: true,
    ventana: '48h',
    revisados: resultados.reduce((a, r) => a + (r.revisados || 0), 0),
    cuentas: resultados.map(r => ({ cuenta: r.cuenta, revisados: r.revisados || 0, error: r.error || null })),
    alerts
  };
}

const cors = res => res.setHeader('Access-Control-Allow-Origin', '*');
const json = (res, code, o) => {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(o));
};

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  if (u.pathname === '/') return json(res, 200, { ok: true, service: 'suit-gmail', port: PORT, cuentas: cuentas().map(c => c.email), endpoints: ['/auth', '/resumen'] });

  if (u.pathname === '/auth') {
    if (!cfg.client_id || !cfg.client_secret) {
      return json(res, 500, { ok: false, error: 'falta client_id/client_secret en SuitGmail/config.json (copia config.example.json y pega tus credenciales OAuth de la consola GCP)' });
    }
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: cfg.client_id,
      redirect_uri: REDIRECT,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent'
    });
    res.writeHead(302, { Location: url });
    return res.end();
  }

  if (u.pathname === '/auth/callback') {
    try {
      const code = u.searchParams.get('code');
      const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code || '',
          client_id: cfg.client_id || '',
          client_secret: cfg.client_secret || '',
          redirect_uri: REDIRECT,
          grant_type: 'authorization_code'
        })
      });
      const d = await r.json();
      if (!d.access_token) {
        return json(res, 500, { ok: false, error: 'no vino access_token: ' + (d.error_description || d.error || 'reintenta con prompt=consent') });
      }
      // identifica el buzón autorizado y guarda/upsert por email
      const email = await perfilEmail(d.access_token) || 'cuenta-' + Date.now();
      const cs = cuentas();
      const exist = cs.find(c => c.email === email);
      if (exist) { if (d.refresh_token) exist.refresh_token = d.refresh_token; }
      else if (d.refresh_token) cs.push({ email, refresh_token: d.refresh_token });
      else return json(res, 500, { ok: false, error: 'sin refresh_token para ' + email + ' — repite /auth' });
      cfg.cuentas = cs;
      save(CFG, cfg);
      tokens[email] = { access_token: d.access_token, expires_at: Date.now() + ((d.expires_in || 3500) * 1000) };
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<meta charset="utf-8"><body style="font-family:sans-serif;background:#0a0e17;color:#e2e8f0;padding:40px"><h2>&#10003; ' + email + ' conectado</h2><p>Cierra esta pestana y ve a SuitMisCtas &rarr; &#128232; Gmail.</p></body>');
    } catch (e) {
      json(res, 500, { ok: false, error: String(e) });
    }
    return;
  }

  if (u.pathname === '/resumen') {
    try { json(res, 200, await resumen()); }
    catch (e) { json(res, 500, { ok: false, error: String(e) }); }
    return;
  }

  json(res, 404, { ok: false, error: '404' });
}).listen(PORT, '127.0.0.1', () => console.log('SuitGmail en http://127.0.0.1:' + PORT));
