const https = require('https');

const MAIN_URL = `localhost`;
const MAIN_PORT = process.env.PORT || 3001;

async function notify(evento) {
  return new Promise((resolve) => {
    const body = JSON.stringify(evento);
    const opts = {
      hostname: MAIN_URL,
      port: MAIN_PORT,
      path: '/api/webhook/citas',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Auth-Token': process.env.API_AUTH_TOKEN || '',
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

module.exports = { notify };
