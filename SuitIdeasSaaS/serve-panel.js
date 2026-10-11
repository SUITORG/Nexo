// serve-panel.js — sirve SuitIdeasSaaS/ en :8099 (panel.html + estado.json) sin dependencias
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = 8099;
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.js': 'text/javascript' };
http.createServer((req, res) => {
  const f = path.join(ROOT, (req.url.split('?')[0] === '/' ? 'panel.html' : req.url.split('?')[0]));
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'text/plain', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log('IdeasSaaS panel en http://localhost:' + PORT + '/panel.html'));
