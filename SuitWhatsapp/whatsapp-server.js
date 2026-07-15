const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('http');
const path = require('path');

const PORT = 9999;
let qrDataUrl = null;
let status = 'initializing';
let whatsappClient = null;

const server = http.createServer(async (req, res) => {
  // API: search groups
  if (req.url.startsWith('/api/search') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (!whatsappClient || status !== 'connected') {
      res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
      return;
    }
    try {
      const query = new URL(req.url, `http://localhost:${PORT}`).searchParams.get('q') || '';
      const chats = await whatsappClient.getChats();
      const groups = chats.filter(c => c.isGroup && c.name && c.name.toLowerCase().includes(query.toLowerCase()));
      res.end(JSON.stringify(groups.map(g => ({ name: g.name, id: g.id._serialized, participants: g.participants.length })), null, 2));
    } catch (err) { res.end(JSON.stringify({ error: err.message })); }
    return;
  }

  // API: send message
  if (req.url === '/api/send' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (!whatsappClient || status !== 'connected') {
      res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { chatId, message } = JSON.parse(body);
        const chat = await whatsappClient.getChatById(chatId);
        await chat.sendMessage(message);
        res.end(JSON.stringify({ success: true, chat: chat.name || chatId, message }));
      } catch (err) { res.end(JSON.stringify({ error: err.message })); }
    });
    return;
  }

  // API: list all groups
  if (req.url === '/api/groups' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (!whatsappClient || status !== 'connected') {
      res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
      return;
    }
    try {
      const chats = await whatsappClient.getChats();
      const groups = chats.filter(c => c.isGroup);
      res.end(JSON.stringify(groups.map(g => ({ name: g.name, id: g.id._serialized, participants: g.participants.length })), null, 2));
    } catch (err) { res.end(JSON.stringify({ error: err.message })); }
    return;
  }

  // API: read last messages
  if (req.url === '/api/messages' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    
    if (!whatsappClient || status !== 'connected') {
      res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
      return;
    }
    
    try {
      const chats = await whatsappClient.getChats();
      const sortedChats = chats
        .filter(c => c.lastMessage && c.lastMessage.timestamp)
        .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp)
        .slice(0, 10);
      
      const messages = [];
      for (const chat of sortedChats) {
        const lastMsg = chat.lastMessage;
        messages.push({
          chat: chat.name || chat.id._serialized,
          isGroup: chat.isGroup,
          fromMe: lastMsg.fromMe,
          body: lastMsg.body || '(media)',
          type: lastMsg.type,
          time: new Date(lastMsg.timestamp * 1000).toLocaleString('es-MX'),
          pushName: lastMsg._data?.pushName || ''
        });
      }
      
      res.end(JSON.stringify(messages, null, 2));
    } catch (err) {
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // QR page
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  
  if (status === 'connected') {
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhatsApp Connected</title>
    <style>body{font-family:Arial;text-align:center;padding:40px;background:#111;color:#fff}
    h1{color:#25D366}.status{font-size:24px;padding:15px;background:#25D366;border-radius:8px;color:#000}
    .api{background:#333;padding:20px;border-radius:8px;margin:20px;text-align:left;font-family:monospace;color:#0f0}
    a{color:#25D366}</style></head><body>
    <h1>WhatsApp Connected!</h1>
    <div class="status">Tu WhatsApp esta conectado al MCP server.</div>
    <div class="api">
      <h3>API Endpoints:</h3>
      <p><a href="/api/messages">GET /api/messages</a> - Leer ultimos 10 mensajes</p>
    </div>
    <p>Puedes cerrar esta pagina.</p></body></html>`);
  } else if (qrDataUrl) {
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhatsApp QR</title>
    <style>body{font-family:Arial;text-align:center;padding:40px;background:#111;color:#fff}
    h1{color:#25D366}img{border:4px solid #25D366;border-radius:12px;margin:20px}
    .status{font-size:24px;margin:20px;padding:15px;background:#25D366;border-radius:8px;color:#000}
    .info{font-size:16px;color:#aaa;margin-top:20px}</style></head><body>
    <h1>WhatsApp Web QR Code</h1>
    <div class="status">QR Listo! Escanealo con tu telefono.</div>
    <img src="${qrDataUrl}" width="400" height="400" />
    <div class="info"><p>1. WhatsApp > Dispositivos vinculados</p>
    <p>2. Vincular dispositivo</p><p>3. Escanea este QR</p></div>
    <p class="info">Esta pagina se actualiza cada 5 segundos</p>
    <script>setTimeout(()=>location.reload(),5000)</script></body></html>`);
  } else {
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>WhatsApp QR</title>
    <style>body{font-family:Arial;text-align:center;padding:40px;background:#111;color:#fff}
    h1{color:#25D366}.status{font-size:18px;color:#aaa}</style></head><body>
    <h1>WhatsApp Web MCP</h1>
    <div class="status">Generando QR... espera...</div>
    <script>setTimeout(()=>location.reload(),3000)</script></body></html>`);
  }
});

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API:    http://localhost:${PORT}/api/messages`);
});

whatsappClient = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

whatsappClient.on('qr', async (qr) => {
  qrDataUrl = await qrcode.toDataURL(qr, { width: 400, margin: 2 });
  status = 'ready';
  console.log('QR ready at http://localhost:9999');
});

whatsappClient.on('ready', () => {
  status = 'connected';
  console.log('WhatsApp CONNECTED!');
});

whatsappClient.on('disconnected', () => { status = 'initializing'; });

console.log('Initializing...');
whatsappClient.initialize();