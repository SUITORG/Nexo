// serve-panel.js — panel SuitIdeasSaaS en :8099
// Endpoints: /registro /pendientes /git /orden · POST /solicitud /resolver /push /orden
const http = require('http'), fs = require('fs'), path = require('path');
const { execSync } = require('child_process');
const ROOT = __dirname, REPO = path.join(ROOT, '..'), PORT = 8099;
const REG = path.join(REPO, 'GuiaTotal', 'registro');
const PEND = path.join(REPO, 'GuiaTotal', 'PENDIENTES.md');
const ORDEN = path.join(ROOT, 'orden.json');
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'text/javascript' };

function git(args) {
  return execSync('git ' + args, { cwd: REPO, encoding: 'utf8', timeout: 120000 }).trim();
}
function gitInfo() {
  try {
    const branch = git('rev-parse --abbrev-ref HEAD');
    let ahead = -1, behind = -1;
    try { const [b, a] = git(`rev-list --left-right --count origin/${branch}...HEAD`).split('\t').map(Number); behind = b; ahead = a; } catch (_) {}
    return { branch, ahead, behind };
  } catch (_) { return { branch: '?', ahead: -1, behind: -1 }; }
}

// Preguntas amigables + opciones de un clic (las respuestas se guardan contra el texto original del contrato)
const OPCIONES = [
  { match: /hosting|servidor|nube|producci|hoy solo local/i, q: '¿Dónde vive tu producto cuando esté listo para clientes?',
    ops: [
      { t: 'Solo en mi computadora por ahora', v: 'local por ahora; hosting al primer cliente', rec: true },
      { t: 'En la nube cuando llegue el primer cliente', v: 'nube al primer cliente (proveedor por definir)' }
    ] },
  { match: /alerta|notific|aviso|sms|correo|email/i, q: '¿Cómo quieres que se avise de una renovación próxima?',
    ops: [
      { t: 'Que yo entre y lo revise (más simple)', v: 'consulta manual por ahora; email/SMS después', rec: true },
      { t: 'Que llegue un correo automático', v: 'email automático (configuración extra)' },
      { t: 'Que llegue un WhatsApp automático', v: 'WhatsApp automático (proveedor pago)' }
    ] },
  { match: /stripe|cobro|pago|cobrar|factur/i, q: '¿Cobrarías por el producto?',
    ops: [
      { t: 'Sí, suscripción mensual', v: 'suscripción mensual con Stripe en el futuro', rec: true },
      { t: 'No, gratis por ahora', v: 'gratis por ahora' },
      { t: 'Aún no lo decido', v: 'pendiente de decidir' }
    ] },
  { match: /taller|multi|login|cuenta/i, q: '¿Una cuenta = un negocio, o varios negocios en una cuenta?',
    ops: [
      { t: 'Un negocio por cuenta (más simple)', v: 'un taller por cuenta en el MVP', rec: true },
      { t: 'Varios negocios en una misma cuenta', v: 'multi-taller con login en el futuro' }
    ] }
];

function amigable(pregunta) {
  for (const o of OPCIONES) if (o.match.test(pregunta)) return { pregunta: o.q, ops: o.ops };
  return { pregunta, ops: [] };
}

function leerPorConfirmar(ruta) {
  try {
    const txt = fs.readFileSync(path.join(REPO, ruta, 'docs', 'CONTRATO.md'), 'utf8');
    const m = txt.match(/## POR CONFIRMAR\n([\s\S]*?)(\n## |$)/);
    if (!m) return [];
    return m[1].split('\n').filter(l => l.trim().startsWith('- ') && !/^- \[x\]/.test(l.trim())).map(l => {
      const original = l.replace(/^\s*- /, '').trim();
      const a = amigable(original);
      return { original, pregunta: a.pregunta, ops: a.ops };
    });
  } catch (_) { return []; }
}

function resolverPorConfirmar(ruta, respuestas) {
  const f = path.join(REPO, ruta, 'docs', 'CONTRATO.md');
  const txt = fs.readFileSync(f, 'utf8');
  const m = txt.match(/(## POR CONFIRMAR\n)([\s\S]*?)(\n## |$)/);
  if (!m) return { ok: false, error: 'seccion POR CONFIRMAR no encontrada' };
  const items = m[2].split('\n').filter(l => l.trim().startsWith('- ') && !/^- \[x\]/.test(l.trim()));
  const hoy = new Date().toISOString().slice(0, 10);
  const quedan = [], resueltos = [];
  items.forEach((line, i) => {
    const pregunta = line.replace(/^\s*- /, '').trim();
    const resp = Array.isArray(respuestas) ? respuestas[i] : (respuestas || {})[pregunta];
    if (resp && String(resp).trim()) resueltos.push(`- [x] ~~${pregunta}~~ → **${String(resp).trim()}** (${hoy}, panel)`);
    else quedan.push(line);
  });
  const nueva = `## POR CONFIRMAR\n${quedan.join('\n') || '(todas resueltas)'}\n\n### Resueltos (panel)\n${resueltos.join('\n')}\n`;
  fs.writeFileSync(f, txt.slice(0, m.index) + nueva + (m[3] || ''), 'utf8');
  if (resueltos.length) {
    try {
      git(`add "${ruta.replace(/\\/g, '/')}docs/CONTRATO.md"`);
      git(`commit -m "ciclo(f0/contrato)[${ruta.replace(/\/$/, '')}]: respuestas POR CONFIRMAR desde panel (${resueltos.length} resueltas)"`);
    } catch (_) {}
  }
  return { ok: true, resueltos: resueltos.length, quedan: quedan.length };
}

function parseCard(txt) {
  const get = k => { const m = txt.match(new RegExp('^' + k + ':\\s*"([^"\\n]+)"', 'm')) || txt.match(new RegExp('^' + k + ':\\s*([^\\n#"]+)', 'm')); return m ? m[1].trim() : ''; };
  const dm = txt.match(/documentos:\s*\n((?:[ \t]+.+\n?)*)/);
  let docsTotal = 0, docsFaltan = 0;
  if (dm) for (const line of dm[1].split('\n')) {
    const m = line.match(/^\s+\w+:\s*(true|false)/);
    if (m) { docsTotal++; if (m[1] === 'false') docsFaltan++; }
  }
  const ruta = get('ruta');
  return {
    proyecto: get('proyecto'), ruta, etapa: get('etapa'),
    faseProducto: parseInt(get('fase_producto'), 10) || null,
    actualizado: get('actualizado'), puerto: get('puerto'), proximo_paso: get('proximo_paso'),
    docsTotal, docsFaltan, porConfirmar: leerPorConfirmar(ruta)
  };
}

function leerRegistro() {
  try {
    return fs.readdirSync(REG).filter(f => f.endsWith('.yaml'))
      .map(f => { try { return parseCard(fs.readFileSync(path.join(REG, f), 'utf8')); } catch (_) { return null; } })
      .filter(c => c && c.proyecto && c.etapa !== 'archivado');
  } catch (_) { return []; }
}

function leerPendientes() {
  try {
    const lines = fs.readFileSync(PEND, 'utf8').split(/\r?\n/);
    const out = []; let seccion = '';
    for (const l of lines) {
      const h = l.match(/^## ([A-F])\./);
      if (h) { seccion = h[1]; continue; }
      const m = l.match(/^- \[ \] \*\*(.+?)\*\*[:\s]*(.*)$/);
      if (m && seccion && seccion !== 'F') {
        let det = (m[2] || '').replace(/\*?\d{4}-\d{2}-\d{2}.*$/, '').trim();
        if (det.length > 140) det = det.slice(0, 137) + '…';
        out.push({ seccion, titulo: m[1].replace(/\*\*/g, ''), detalle: det });
      }
      if (out.length >= 40) break;
    }
    return out;
  } catch (_) { return []; }
}

function leerBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => { try { resolve(JSON.parse(b)); } catch { reject(new Error('json invalido')); } });
  });
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const json = data => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const err = (code, msg) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: msg })); };

  try {
    if (req.method === 'GET' && url === '/registro') return json(leerRegistro());
    if (req.method === 'GET' && url === '/pendientes') return json(leerPendientes());
    if (req.method === 'GET' && url === '/git') return json(gitInfo());
    if (req.method === 'GET' && url === '/orden') {
      try { return json(JSON.parse(fs.readFileSync(ORDEN, 'utf8'))); } catch (_) { return json({ ordenes: [] }); }
    }
    if (req.method === 'POST' && url === '/solicitud') {
      const d = await leerBody(req);
      if (!d.tema) return err(400, 'tema requerido');
      const sol = { tema: String(d.tema).slice(0, 200), modo: d.modo === 'rapidas' ? 'rapidas' : 'verificadas', ts: new Date().toISOString() };
      fs.writeFileSync(path.join(ROOT, 'solicitud.json'), JSON.stringify(sol, null, 2));
      return json({ ok: true, solicitud: sol });
    }
    if (req.method === 'POST' && url === '/resolver') {
      const d = await leerBody(req);
      if (!d.ruta) return err(400, 'ruta requerida');
      return json(resolverPorConfirmar(d.ruta, d.respuestas || {}));
    }
    if (req.method === 'POST' && url === '/push') {
      const d = await leerBody(req).catch(() => ({}));
      if (!d.confirm) return err(400, 'confirm:true requerido');
      const g = gitInfo();
      if (!g.ahead) return json({ ok: false, error: 'nada que subir (' + g.branch + ')' });
      try {
        const out = git(`push origin ${g.branch}`);
        json({ ok: true, branch: g.branch, output: (out.split('\n').slice(-3) || []).join(' | ') });
      } catch (e) { json({ ok: false, error: String(e.message || e).slice(0, 300) }); }
      return;
    }
    if (req.method === 'POST' && url === '/orden') {
      const d = await leerBody(req);
      if (!d.tipo) return err(400, 'tipo requerido');
      let o = { ordenes: [] };
      try { o = JSON.parse(fs.readFileSync(ORDEN, 'utf8')); } catch (_) {}
      o.ordenes = (o.ordenes || []).filter(x => !(x.tipo === d.tipo && x.proyecto === d.proyecto));
      o.ordenes.push({ tipo: d.tipo, proyecto: d.proyecto || '', detalle: d.detalle || '', ts: new Date().toISOString() });
      fs.writeFileSync(ORDEN, JSON.stringify(o, null, 2));
      return json({ ok: true, ordenes: o.ordenes });
    }
    if (req.method === 'POST' && url === '/resolver-pendiente') {
      const d = await leerBody(req);
      if (!d.titulo) return err(400, 'titulo requerido');
      const txt = fs.readFileSync(PEND, 'utf8');
      const hoy = new Date().toISOString().slice(0, 10);
      const lines = txt.split(/\r?\n/);
      let found = false;
      const out = lines.map(l => {
        if (!found && l.startsWith('- [ ]') && l.includes('**' + d.titulo + '**')) {
          found = true;
          return l.replace('- [ ]', '- [x]') + ` *(${hoy}, panel)*`;
        }
        return l;
      }).join('\n');
      if (!found) return err(404, 'pendiente no encontrado');
      fs.writeFileSync(PEND, out, 'utf8');
      return json({ ok: true });
    }
    if (req.method === 'POST' && url === '/orden/clear') { fs.writeFileSync(ORDEN, '{ "ordenes": [] }\n'); return json({ ok: true }); }

    const f = path.join(ROOT, url === '/' ? 'panel.html' : url);
    if (!f.startsWith(ROOT)) return err(403, 'forbidden');
    fs.readFile(f, (e, data) => {
      if (e) return err(404, '404');
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/plain', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  } catch (e) { err(500, String(e.message || e).slice(0, 200)); }
}).listen(PORT, () => console.log('IdeasSaaS panel en http://localhost:' + PORT + '/panel.html'));
