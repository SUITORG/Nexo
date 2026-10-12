const path = require('path');
const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
require('dotenv').config();
const { handleAdd, handleDue, handleList, handleClose } = require('./handlers/contracts');
const { runPy } = require('./db/client');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3017;
const PIN = process.env.APP_PIN || '';  // sin PIN = sin login (dev)

app.get('/api/health', (req, res) => res.json({ status: 'ok', module: 'SuitContractRenew' }));

// --- Login simple (Fase 5): PIN del taller, cookie de sesión ---
app.post('/api/login', (req, res) => {
  if (!PIN) return res.json({ ok: true, auth: false });
  if (req.body.pin !== PIN) return res.status(401).json({ error: 'pin incorrecto' });
  const tok = crypto.createHash('sha256').update(PIN + '::cr').digest('hex').slice(0, 32);
  res.cookie('cr_s', tok, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 864e5 });
  res.json({ ok: true });
});
function auth(req, res, next) {
  if (!PIN) return next();
  const tok = crypto.createHash('sha256').update(PIN + '::cr').digest('hex').slice(0, 32);
  const m = (req.headers.cookie || '').match(/(?:^|;\s*)cr_s=([a-f0-9]+)/);
  if (m && m[1] === tok) return next();
  res.status(401).json({ error: 'no autorizado' });
}
app.use((req, res, next) => {
  if (req.path.startsWith('/api/contracts')) return auth(req, res, next);
  next();
});

app.post('/api/contracts', handleAdd);
app.get('/api/contracts', handleList);
app.get('/api/contracts/due/:dias?', handleDue);
app.post('/api/contracts/:id/close', handleClose);

app.post('/api/leads', async (req, res) => {
  const { nombre, negocio, whatsapp, email, contratos_aprox, mensaje } = req.body || {};
  if (!nombre || (!whatsapp && !email)) return res.status(400).json({ error: 'nombre y whatsapp son requeridos' });
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads_contractrenew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ nombre, negocio, whatsapp, email, contratos_aprox, mensaje })
    });
    if (!r.ok) return res.status(502).json({ error: 'supabase_error' });
    res.status(201).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'supabase_unreachable' });
  }
});

app.use(express.static(path.join(__dirname, 'landing')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'app', 'index.html')));

// --- Fase 6: automatización diaria (alertas + respaldo) ---
function backupDb() {
  try {
    const db = path.join(__dirname, 'python', 'contractrenew.db');
    if (!fs.existsSync(db)) return;
    const dir = path.join(__dirname, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const hoy = new Date().toISOString().slice(0, 10);
    fs.copyFileSync(db, path.join(dir, `contractrenew-${hoy}.db`));
    // conservar solo los últimos 7
    const viejos = fs.readdirSync(dir).filter(f => /^contractrenew-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
    while (viejos.length > 7) fs.unlinkSync(path.join(dir, viejos.shift()));
    console.log(`[respaldo] contractrenew-${hoy}.db`);
  } catch (e) { console.error('[respaldo] error:', e.message); }
}
async function alertar() {
  try {
    const out = await runPy(['main.py', 'alertar']);
    console.log(out.trim());
  } catch (e) { console.error('[alerta] error:', e.message); }
}
const HORAS_ALERTA = parseInt(process.env.HORAS_ALERTA, 10) || 24;
if (require.main === module) {
  alertar(); backupDb();
  setInterval(() => { alertar(); backupDb(); }, HORAS_ALERTA * 3600e3);
  app.listen(PORT, () => console.log(`SuitContractRenew en http://localhost:${PORT} (alertas cada ${HORAS_ALERTA}h)`));
}
module.exports = app;
