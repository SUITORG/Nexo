// Lee tus pagos de Google (payments.google.com → Actividad) con Playwright y
// escribe el gasto del mes en SuitMisCtas/gastos.json (campo "google").
// Perfil: el mismo login del Playwright MCP (best-effort: si el navegador MCP está
// abierto, el perfil está bloqueado y el script se omite sin romper nada).
// Uso: node scripts/google-saldo.js   (también lo llama gastos-update.js)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PROFILE = process.env.GCP_PROFILE
  || 'C:\\Users\\rojo-\\AppData\\Local\\ms-playwright-mcp\\mcp-chrome-b241980';
const OUT = path.join(__dirname, '..', 'SuitMisCtas', 'gastos.json');
const MESES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12 };
const URL = 'https://payments.google.com/gp/w/home/activity';

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    viewport: null,
    args: ['--disable-blink-features=AutomationControlled']
  });
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // espera a que aparezca la tabla (en page o en iframe interno)
    let rows = [];
    for (let i = 0; i < 20 && !rows.length; i++) {
      await page.waitForTimeout(1000);
      for (const f of page.frames()) {
        try {
          rows = await f.evaluate(() => [...document.querySelectorAll('table tr, [role="row"]')]
            .map(tr => [...tr.querySelectorAll('td, [role="gridcell"]')].map(c => (c.innerText || '').trim()))
            .filter(c => c.length >= 2));
        } catch { /* frame cambiando */ }
        if (rows.length) break;
      }
      if (/verificaci|reauth|volver a autenticar/i.test(await page.title().catch(() => ''))) {
        throw new Error('reauth-pendiente: entra una vez a ' + URL + ' en el navegador MCP y vuelve a correr');
      }
    }
    if (!rows.length) throw new Error('sin tabla de actividad (reauth o cambio de UI)');

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();
      const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
      const FECHA_RE = /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{4}))?/i;
      let gastoMes = 0, moneda = 'USD', ultimo = null, txMes = 0, txTotal = 0;
      for (const cells of rows) {
        const detalle = norm(cells.find(c => /\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i.test(c)) || '');
        const montoCelda = norm(cells.find(c => /^[-+]?\s?(USD|MXN)\s?[\d.,]+/i.test(c)) || '');
        if (!montoCelda || !detalle) continue;
        txTotal++;
        const fm = detalle.match(FECHA_RE);
        const fechaTxt = fm ? fm[0] : '';
        const merchant = fm ? (detalle.slice(0, fm.index).replace(/[·\s]+$/, '').trim() || 'pagos Google') : 'pagos Google';
        const m = montoCelda.match(/^([-+])?\s?(USD|MXN)\s?([\d.,]+)/i);
        if (!m) continue;
        moneda = (m[2] || 'USD').toUpperCase();
        const valor = parseFloat(m[3].replace(/,/g, ''));
        const enMes = fm && MESES[fm[2].toLowerCase()] === mesActual && (!fm[3] || +fm[3] === anio);
        if (enMes) { gastoMes += (m[1] === '+' ? -valor : valor); txMes++; }
        if (!ultimo && fechaTxt) ultimo = { nombre: merchant, fecha: fechaTxt };
      }

    // merge en gastos.json (conserva lo de opencode)
    let g = {};
    try { g = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { /* nuevo */ }
    g.google = {
      monto: gastoMes.toFixed(2),
      moneda,
      nota: ultimo ? ultimo.nombre : 'pagos Google',
      ultima: ultimo ? ultimo.fecha : '',
      txMes,
      txTotal,
      fuente: 'payments.google.com',
      actualizado: new Date().toISOString()
    };
    fs.writeFileSync(OUT, JSON.stringify(g, null, 2));
    console.log('google OK -> mes $' + g.google.monto + ' ' + moneda + ' | ultima: ' + (ultimo ? ultimo.nombre + ' ' + ultimo.fecha : '—') + ' | tx: ' + txTotal);
  } finally {
    await ctx.close().catch(() => {});
  }
})().catch(e => {
  console.error('google-saldo:', String(e.message || e).slice(0, 200));
  process.exitCode = 1; // best-effort: gastos.json conserva el último valor
});
