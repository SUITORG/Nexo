// Gastos de herramientas: corre `opencode stats` y escribe SuitMisCtas/gastos.json
// Uso: node scripts/gastos-update.js   (también lo corre MASTER.bat al arrancar)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'SuitMisCtas', 'gastos.json');

function stats(flags) {
  return execSync('opencode stats ' + flags, {
    encoding: 'utf8',
    timeout: 180000,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}
const num = (t, re) => { const m = t.match(re); return m ? m[1].replace(/,/g, '') : null; };

try {
  const all = stats('');
  const mes = stats('--days 30');
  const g = {
    actualizado: new Date().toISOString(),
    total: num(all, /Total Cost\s+\$([\d.,]+)/),
    promDia: num(all, /Avg Cost\/Day\s+\$([\d.,]+)/),
    sesiones: num(all, /Sessions\s+([\d,]+)/),
    dias: num(all, /Days\s+([\d,]+)/),
    tokensIn: num(all, /Input\s+([\d.,]+[MK]?)/),
    mes30: {
      costo: num(mes, /Total Cost\s+\$([\d.,]+)/),
      sesiones: num(mes, /Sessions\s+([\d,]+)/)
    }
  };
  fs.writeFileSync(OUT, JSON.stringify(g, null, 2));
  console.log('gastos.json OK -> total $' + g.total + ' | mes30 $' + g.mes30.costo + ' | ' + g.sesiones + ' sesiones');
} catch (e) {
  console.error('fallo opencode stats:', String(e.message || e).slice(0, 300));
  process.exitCode = 1;
}

// Google (payments.google.com vía Playwright) — best-effort: si falla (perfil
// bloqueado / reauth), gastos.json conserva el último valor de google.
try {
  execSync('node "' + path.join(__dirname, 'google-saldo.js') + '"', {
    encoding: 'utf8',
    timeout: 90000,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  console.log('google-saldo OK');
} catch (e) {
  console.error('google-saldo omitido:', String(e.message || e).slice(0, 200));
}
