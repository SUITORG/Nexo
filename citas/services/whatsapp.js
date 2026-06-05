const https = require('https');

const API_VERSION = 'v21.0';
const BASE_URL = 'graph.facebook.com';

function sendMessage(to, text, phoneId, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    });
    const opts = {
      hostname: BASE_URL,
      path: `/${API_VERSION}/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseIncoming(payload) {
  const entry = payload?.entry?.[0];
  const change = entry?.changes?.[0];
  const msg = change?.value?.messages?.[0];
  if (!msg) return null;
  const meta = change.value.metadata;
  return {
    from: msg.from,
    text: (msg.text?.body || '').trim(),
    msgId: msg.id,
    timestamp: msg.timestamp,
    phoneNumberId: meta?.phone_number_id,
    displayPhone: meta?.display_phone_number,
  };
}

module.exports = { sendMessage, parseIncoming };
