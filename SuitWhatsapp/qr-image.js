const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

const client = new Client({
  authStrategy: 'local',
  puppeteer: { headless: true }
});

client.on('qr', async (qr) => {
  console.log('QR Code received, generating image...');
  const qrPath = path.join(__dirname, 'whatsapp-qr.png');
  await qrcode.toFile(qrPath, qr, { 
    width: 400,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
  console.log(`QR Code saved to: ${qrPath}`);
  console.log('Open this file with your image viewer and scan with WhatsApp.');
  
  // Keep alive for 2 minutes
  setTimeout(() => {
    console.log('Time expired. Restart to generate new QR.');
    process.exit(0);
  }, 120000);
});

client.on('ready', () => {
  console.log('WhatsApp Client is ready!');
});

client.on('authenticated', () => {
  console.log('Authenticated successfully!');
});

client.on('auth_failure', (msg) => {
  console.error('Auth failure:', msg);
  process.exit(1);
});

client.on('error', (err) => {
  console.error('Client error:', err);
});

console.log('Initializing WhatsApp Web client...');
client.initialize();