#!/usr/bin/env node
/**
 * tunel.js — Túnel cloudflared con auto-heal para el sidebar BRIEF.
 *
 * Lanza cloudflared (quick tunnel → http://localhost:3001), extrae la URL viva
 * y la registra en GAS (Script Property NODE_BASE_URL, action setNodeBaseUrl).
 * Si el túnel muere y la URL cambia, reiniciar este script re-registra sola —
 * la fuente de verdad es la property, no el fallback hardcodeado en
 * backend/brief-sidebar.js.
 *
 * Uso: node scripts/tunel.js
 * Requiere: Node 18+ (fetch global), cloudflared en PATH, .env con BRIEF_GAS_URL.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKEN = 'PROTON-77-X'; // mismo secreto compartido que orchestrate (backend/core.js)
const URL_RE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/g;

// .env manual (mismo patrón que server.js, sin dependencias)
(function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) { /* sin .env → fallback canónico */ }
})();

// Deployment canónico "EVASOL Backend" (idéntico a scripts/brief-generate.js:13)
const GAS_URL = process.env.BRIEF_GAS_URL
  || process.env.SUITCAMPANAS_GAS_URL
  || 'https://script.google.com/macros/s/AKfycbzlkAI09chbtmf3VX5jKA9N4-6Ka2pcc6P65YqCXHn9amzACDCjuJBpFm2A8tPFyDwrsA/exec';

const log = (...a) => console.log(`[tunel ${new Date().toLocaleTimeString()}]`, ...a);

async function registerUrl(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setNodeBaseUrl', url, token: TOKEN }),
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      const json = JSON.parse(await res.text()); // GAS puede devolver HTML intermitente
      if (json.success) { log(`GAS property NODE_BASE_URL ← ${url}`); return true; }
      log(`GAS rechazó (${json.error || 'sin detalle'}), intento ${attempt}/3`);
    } catch (e) {
      log(`registro falló (${e.message}), intento ${attempt}/3`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  log('⚠ GAS no aceptó la URL — la property queda con el valor anterior');
  return false;
}

function killExistingTunnels() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM cloudflared.exe', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "cloudflared tunnel"', { stdio: 'ignore' });
    }
    log('túneles cloudflared previos terminados');
  } catch (e) { /* no había ninguno */ }
}

function spawnTunnel(state) {
  killExistingTunnels();
  state.rejected = 0;
  const child = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3001', '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  state.child = child;

  const onChunk = (buf) => {
    const text = buf.toString();
    process.stderr.write(text);
    // Edge rechazó el túnel ("Tunnel not found") → el hostname ya no existe (NXDOMAIN).
    // Al 5to rechazo seguido, relanzar para obtener URL nueva y re-registrar.
    if (text.includes('Tunnel not found') && ++state.rejected >= 5) {
      log('túnel rechazado por Cloudflare (5x) — relanzando para obtener URL nueva');
      child.kill();
      return;
    }
    const urls = text.match(URL_RE);
    if (urls) {
      for (const u of urls) {
        if (!state.seen.has(u)) {
          state.seen.add(u);
          log(`URL viva detectada: ${u}`);
          registerUrl(u);
        }
      }
    }
  };
  child.stderr.on('data', onChunk);
  child.stdout.on('data', onChunk);

  child.on('exit', (code) => {
    log(`cloudflared terminó (code ${code}) — relanzando en 3 s…`);
    setTimeout(() => spawnTunnel(state), 3000);
  });

  log('cloudflared lanzado — esperando URL del túnel…');
}

async function main() {
  // 1. Origen disponible (advertencia, no bloquea)
  try {
    await fetch('http://localhost:3001', { signal: AbortSignal.timeout(2000) });
  } catch (e) {
    log('⚠ Node :3001 no responde — levántalo (node server.js) antes de usar el sidebar');
  }

  // 2. Auto-heal continuo: si cloudflared muere o es rechazado, se relanza y re-registra
  spawnTunnel({ child: null, seen: new Set(), rejected: 0 });
}

main().catch(e => { log('ERROR:', e.message); process.exit(1); });
