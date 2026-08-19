const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: { 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('ready', async () => {
  console.log('Connected! Reading last messages...\n');
  
  try {
    const chats = await client.getChats();
    
    // Sort by last message timestamp
    const sortedChats = chats
      .filter(c => c.lastMessage && c.lastMessage.timestamp)
      .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    
    // Show top 5 recent chats
    const top5 = sortedChats.slice(0, 5);
    
    for (const chat of top5) {
      const name = chat.name || chat.id._serialized;
      const isGroup = chat.isGroup;
      const lastMsg = chat.lastMessage;
      const fromMe = lastMsg.fromMe;
      const body = lastMsg.body || '(media/sin texto)';
      const time = new Date(lastMsg.timestamp * 1000).toLocaleString('es-MX');
      const type = lastMsg.type;
      
      console.log(`--- ${isGroup ? '👥 GRUPO' : '👤'}: ${name} ---`);
      console.log(`  Hora: ${time}`);
      console.log(`  Tipo: ${type}`);
      console.log(`  ${fromMe ? '📤 YO' : '📥 ' + (lastMsg._data?.pushName || 'Otro')}: ${body}`);
      console.log('');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  setTimeout(() => process.exit(0), 2000);
});

client.on('auth_failure', (msg) => {
  console.error('Auth failure:', msg);
  process.exit(1);
});

client.initialize();