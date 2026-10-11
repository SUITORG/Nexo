// serve-panel.js — sirve SuitIdeasSaaS/ en :8099 (panel + estado + solicitud + registro/pendientes) sin dependencias
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = 8099;
const REG = path.join(ROOT, '..', 'GuiaTotal', 'registro');
const PEND = path.join(ROOT, '..', 'GuiaTotal', 'PENDIENTES.md');
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'text/javascript' };

function parseCard(txt) {
  const get = k => { const m = txt.match(new RegExp('^' + k + ':\\s*"([^"\\n]+)"', 'm')) || txt.match(new RegExp('^' + k + ':\\s*([^\\n#"]+)', 'm')); return m ? m[1].trim() : ''; };
  const dm = txt.match(/documentos:\s*\n((?:[ \t]+.+\n?)*)/);
  let docsTotal = 0, docsFaltan = 0;
  if (dm) for (const line of dm[1].split('\n')) {
    const m = line.match(/^\s+\w+:\s*(true|false)/);
    if (m) { docsTotal++; if (m[1] === 'false') docsFaltan++; }
  }
  return {
    proyecto: get('proyecto'), ruta: get('ruta'), etapa: get('etapa'),
    actualizado: get('actualizado'), puerto: get('puerto'), proximo_paso: get('proximo_paso'),
    docsTotal, docsFaltan
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

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const json = data => { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (req.method === 'GET' && url === '/registro') return json(leerRegistro());
  if (req.method === 'GET' && url === '/pendientes') return json(leerPendientes());
  if (req.method === 'POST' && url === '/solicitud') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (!d.tema) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end('{"error":"tema requerido"}'); }
        const sol = { tema: String(d.tema).slice(0, 200), modo: d.modo === 'rapidas' ? 'rapidas' : 'verificadas', ts: new Date().toISOString() };
        fs.writeFileSync(path.join(ROOT, 'solicitud.json'), JSON.stringify(sol, null, 2));
        json({ ok: true, solicitud: sol });
      } catch { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end('{"error":"json invalido"}'); }
    });
    return;
  }
  const f = path.join(ROOT, url === '/' ? 'panel.html' : url);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/plain', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log('IdeasSaaS panel en http://localhost:' + PORT + '/panel.html'));
