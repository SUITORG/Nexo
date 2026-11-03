'use strict';

/*
 * SuitCompromisos - puente local con Google Calendar.
 * Corre solo en la laptop (127.0.0.1:8138). No usa OAuth: usa la cuenta de
 * servicio que ya existe en la raiz del proyecto (google-credentials.json).
 *
 * Requisito: compartir el calendario destino con el correo de la cuenta de
 * servicio, con permiso "Hacer cambios en eventos".
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const CREDENTIALS = path.join(ROOT, '..', 'google-credentials.json');
const CONFIG_PATH = path.join(ROOT, 'config.json');
const PORT = Number(process.env.SUIT_COMPROMISOS_PORT || 8138);
const HOST = '127.0.0.1';
const DEFAULT_TZ = 'America/Monterrey';
const MAX_BODY = 2 * 1024 * 1024;

let google;
try {
  google = require('googleapis').google;
} catch (err) {
  console.error('[SuitCompromisos] Falta googleapis. Ejecuta npm install en la raiz de SuitOrg.');
  console.error(err.message);
  process.exit(1);
}

const DEFAULT_CONFIG = {
  calendarId: '',
  calendarSummary: '',
  timeZone: DEFAULT_TZ,
  sharedWith: '',
  lastSync: null
};

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}

function getConfig() {
  const cfg = readJson(CONFIG_PATH, {});
  return {
    calendarId: typeof cfg.calendarId === 'string' ? cfg.calendarId : '',
    calendarSummary: typeof cfg.calendarSummary === 'string' ? cfg.calendarSummary : '',
    timeZone: typeof cfg.timeZone === 'string' && cfg.timeZone ? cfg.timeZone : DEFAULT_TZ,
    sharedWith: typeof cfg.sharedWith === 'string' ? cfg.sharedWith : '',
    lastSync: typeof cfg.lastSync === 'string' ? cfg.lastSync : null
  };
}

function getServiceAccountEmail() {
  const creds = readJson(CREDENTIALS, null);
  return creds && typeof creds.client_email === 'string' ? creds.client_email : '';
}

let calendarClient = null;
function getCalendar() {
  if (calendarClient) return calendarClient;
  if (!fs.existsSync(CREDENTIALS)) {
    throw httpError(500, 'No existe google-credentials.json en la raiz de SuitOrg.');
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });
  calendarClient = google.calendar({ version: 'v3', auth });
  return calendarClient;
}

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === 'null') return true;
  // El panel MASTER se sirve en :8137. Si cambias ese puerto, ajusta aqui.
  return /^http:\/\/(127\.0\.0\.1|localhost):8137$/.test(origin);
}

function setCors(res, origin) {
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
}

function send(res, statusCode, data, origin) {
  setCors(res, origin);
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(httpError(413, 'Solicitud demasiado grande.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(httpError(400, 'JSON invalido.'));
      }
    });
    req.on('error', reject);
  });
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmtDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function nextDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return fmtDate(d);
}

function buildEventBody(item, timeZone) {
  const title = String(item.titulo || '').trim();
  const date = String(item.fecha || '').trim();
  if (!title) throw httpError(400, 'El compromiso no tiene titulo.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw httpError(400, 'El compromiso no tiene una fecha valida.');

  const body = {
    summary: title,
    location: String(item.lugar || '').trim() || undefined,
    description: [String(item.notas || '').trim(), 'SuitCompromisos: ' + item.id].filter(Boolean).join('\n'),
    extendedProperties: {
      private: {
        suitId: String(item.id),
        suitcompromisos: '1'
      }
    },
    reminders: { useDefault: true },
    start: {},
    end: {}
  };

  if (/^\d{2}:\d{2}$/.test(String(item.hora || ''))) {
    const parts = String(item.hora).split(':').map(Number);
    const startMinutes = parts[0] * 60 + parts[1];
    const endMinutes = startMinutes + 60;
    const endDate = endMinutes >= 1440 ? nextDate(date) : date;
    const endH = Math.floor((endMinutes % 1440) / 60);
    const endM = endMinutes % 60;
    body.start = { dateTime: date + 'T' + item.hora + ':00', timeZone: timeZone };
    body.end = { dateTime: endDate + 'T' + pad(endH) + ':' + pad(endM) + ':00', timeZone: timeZone };
  } else {
    body.start = { date: date };
    body.end = { date: nextDate(date) };
  }

  return body;
}

async function findEventBySuitId(cal, calendarId, suitId) {
  const r = await cal.events.list({
    calendarId: calendarId,
    privateExtendedProperty: 'suitId=' + suitId,
    maxResults: 1,
    singleEvents: true
  });
  return (r.data.items && r.data.items[0]) || null;
}

async function deleteEvent(cal, calendarId, eventId) {
  try {
    await cal.events.delete({ calendarId: calendarId, eventId: eventId });
  } catch (err) {
    if (err && (err.code === 404 || err.code === 410)) return;
    throw err;
  }
}

async function syncOne(cal, calendarId, item, timeZone) {
  if (!item || !item.id) return { id: null, action: 'skipped', error: 'sin id' };

  if (item.hecha) {
    let eventId = item.googleEventId || null;
    if (!eventId) {
      const found = await findEventBySuitId(cal, calendarId, item.id);
      if (found) eventId = found.id;
    }
    if (eventId) {
      await deleteEvent(cal, calendarId, eventId);
      return { id: item.id, googleEventId: null, action: 'deleted' };
    }
    return { id: item.id, googleEventId: null, action: 'skipped' };
  }

  const body = buildEventBody(item, timeZone);
  let eventId = item.googleEventId || null;

  if (!eventId) {
    const found = await findEventBySuitId(cal, calendarId, item.id);
    if (found) eventId = found.id;
  }

  if (eventId) {
    try {
      await cal.events.patch({ calendarId: calendarId, eventId: eventId, requestBody: body });
      return { id: item.id, googleEventId: eventId, action: 'updated' };
    } catch (err) {
      if (err && (err.code === 404 || err.code === 410)) {
        eventId = null;
      } else {
        throw err;
      }
    }
  }

  const created = await cal.events.insert({ calendarId: calendarId, requestBody: body });
  return { id: item.id, googleEventId: created.data.id, action: 'created' };
}

async function handleStatus() {
  const cfg = getConfig();
  return {
    ok: true,
    configured: !!cfg.calendarId,
    calendarId: cfg.calendarId,
    calendarSummary: cfg.calendarSummary,
    serviceAccountEmail: getServiceAccountEmail(),
    timeZone: cfg.timeZone,
    sharedWith: cfg.sharedWith,
    lastSync: cfg.lastSync
  };
}

async function handleConfig(body) {
  const calendarId = String(body.calendarId || '').trim();
  if (!calendarId) throw httpError(400, 'Falta el ID o correo del calendario.');
  if (calendarId.toLowerCase() === 'primary') {
    throw httpError(400, 'Usa el correo de tu calendario, no "primary".');
  }

  const cal = getCalendar();
  let data;
  try {
    const r = await cal.calendars.get({ calendarId: calendarId });
    data = r.data;
  } catch (err) {
    const email = getServiceAccountEmail();
    throw httpError(400,
      'No pude abrir ese calendario. Compartelo con ' + email +
      ' con permiso "Hacer cambios en eventos". Detalle: ' + err.message
    );
  }

  const cfg = getConfig();
  cfg.calendarId = calendarId;
  cfg.calendarSummary = data.summary || calendarId;
  cfg.timeZone = data.timeZone || DEFAULT_TZ;
  cfg.sharedWith = '';
  writeJson(CONFIG_PATH, cfg);

  return {
    ok: true,
    calendarId: cfg.calendarId,
    calendarSummary: cfg.calendarSummary,
    timeZone: cfg.timeZone
  };
}

async function handleCreateCalendar(body) {
  const email = String(body.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw httpError(400, 'Escribe un correo de Google valido.');
  }

  const cal = getCalendar();
  let created;
  try {
    created = await cal.calendars.insert({
      requestBody: {
        summary: 'Compromisos',
        description: 'Calendario creado por SuitCompromisos',
        timeZone: DEFAULT_TZ
      }
    });
  } catch (err) {
    throw httpError(500, 'No pude crear el calendario: ' + err.message);
  }

  const calendarId = created.data.id;
  try {
    await cal.acl.insert({
      calendarId: calendarId,
      sendNotifications: true,
      requestBody: {
        role: 'writer',
        scope: { type: 'user', value: email }
      }
    });
  } catch (err) {
    try { await cal.calendars.delete({ calendarId: calendarId }); } catch (cleanupErr) { /* sin salida */ }
    throw httpError(400, 'Cree el calendario pero no pude compartirlo con ' + email + '. Detalle: ' + err.message);
  }

  const cfg = getConfig();
  cfg.calendarId = calendarId;
  cfg.calendarSummary = created.data.summary || 'Compromisos';
  cfg.timeZone = created.data.timeZone || DEFAULT_TZ;
  cfg.sharedWith = email;
  writeJson(CONFIG_PATH, cfg);

  return {
    ok: true,
    calendarId: cfg.calendarId,
    calendarSummary: cfg.calendarSummary,
    timeZone: cfg.timeZone,
    sharedWith: email
  };
}

let syncQueue = Promise.resolve();
function enqueue(task) {
  const run = syncQueue.then(task, task);
  syncQueue = run.catch(() => {});
  return run;
}

async function handleSync(body) {
  const cfg = getConfig();
  if (!cfg.calendarId) throw httpError(400, 'Google Calendar no esta configurado.');

  return enqueue(async () => {
    const cal = getCalendar();
    const items = Array.isArray(body.items) ? body.items : [];
    const deletedIds = Array.isArray(body.deletedIds) ? body.deletedIds : [];
    const results = [];
    const errors = [];

    for (const eventId of deletedIds) {
      if (!eventId) continue;
      try {
        await deleteEvent(cal, cfg.calendarId, eventId);
        results.push({ googleEventId: eventId, action: 'deleted' });
      } catch (err) {
        errors.push({ googleEventId: eventId, error: err.message || String(err) });
      }
    }

    for (const item of items) {
      try {
        results.push(await syncOne(cal, cfg.calendarId, item, cfg.timeZone));
      } catch (err) {
        errors.push({ id: item && item.id, error: err.message || String(err) });
      }
    }

    cfg.lastSync = new Date().toISOString();
    writeJson(CONFIG_PATH, cfg);

    return {
      ok: errors.length === 0,
      results: results,
      errors: errors,
      lastSync: cfg.lastSync
    };
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;

  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin(origin)) return send(res, 403, { ok: false, error: 'Origen no permitido' }, origin);
    setCors(res, origin);
    res.writeHead(204);
    return res.end();
  }

  if (origin && !isAllowedOrigin(origin)) {
    return send(res, 403, { ok: false, error: 'Origen no permitido' }, origin);
  }

  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true }, origin);
    }
    if (req.method === 'GET' && url.pathname === '/api/status') {
      return send(res, 200, await handleStatus(), origin);
    }
    if (req.method === 'POST' && url.pathname === '/api/config') {
      const body = await readBody(req);
      return send(res, 200, await handleConfig(body), origin);
    }
    if (req.method === 'POST' && url.pathname === '/api/create-calendar') {
      const body = await readBody(req);
      return send(res, 200, await handleCreateCalendar(body), origin);
    }
    if (req.method === 'POST' && url.pathname === '/api/sync') {
      const body = await readBody(req);
      return send(res, 200, await handleSync(body), origin);
    }
    return send(res, 404, { ok: false, error: 'No encontrado' }, origin);
  } catch (err) {
    const statusCode = err && err.statusCode ? err.statusCode : 500;
    if (statusCode >= 500) console.error('[SuitCompromisos]', err);
    return send(res, statusCode, { ok: false, error: (err && err.message) || String(err) }, origin);
  }
});

server.on('error', (err) => {
  console.error('[SuitCompromisos] No pude iniciar el servidor:', err.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const cfg = getConfig();
  console.log('[SuitCompromisos] http://' + HOST + ':' + PORT);
  console.log('[SuitCompromisos] Calendario: ' + (cfg.calendarId || 'sin configurar'));
  console.log('[SuitCompromisos] Cuenta de servicio: ' + (getServiceAccountEmail() || 'no encontrada'));
});
