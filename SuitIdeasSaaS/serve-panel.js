// serve-panel.js — sirve SuitIdeasSaaS/ en :8099 (panel + estado + solicitud POST) sin dependencias
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = 8099;
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'text/javascript' };
http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'POST' && url === '/solicitud') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (!d.tema) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end('{"error":"tema requerido"}'); }
        const sol = { tema: String(d.tema).slice(0, 200), modo: d.modo === 'rapidas' ? 'rapidas' : 'verificadas', ts: new Date().toISOString() };
        fs.writeFileSync(path.join(ROOT, 'solicitud.json'), JSON.stringify(sol, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, solicitud: sol }));
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
