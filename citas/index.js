const express = require('express');
const { handleIncoming } = require('./handlers/webhook');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const WHATSAPP_CONFIG = {
  token: process.env.WHATSAPP_API_TOKEN || '',
  phoneId: process.env.WHATSAPP_PHONE_ID || '',
};

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// Meta webhook verification
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = process.env.WEBHOOK_VERIFY_TOKEN || 'suitorg-citas-2026';
  if (mode === 'subscribe' && token === expected) {
    return res.status(200).send(challenge);
  }
  res.status(403).send('Verification failed');
});

// Incoming WhatsApp messages
app.post('/webhook/whatsapp', async (req, res) => {
  res.status(200).send('OK');
  const result = await handleIncoming(req.body, WHATSAPP_CONFIG, GEMINI_KEY);
  console.log('[WHATSAPP]', JSON.stringify(result));
});

// GET: listar citas por empresa
app.get('/api/citas', async (req, res) => {
  const { id_empresa, status, limit } = req.query;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  let query = supabase.from('Reservaciones').select('*').eq('id_empresa', id_empresa);
  if (status) query = query.eq('status', status);
  if (limit) query = query.limit(parseInt(limit));
  query = query.order('fecha_cita', { ascending: false });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET: listar clientes por empresa
app.get('/api/clientes', async (req, res) => {
  const { id_empresa, telefono } = req.query;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  let query = supabase.from('clientes').select('*').eq('id_empresa', id_empresa);
  if (telefono) query = query.eq('telefono', telefono);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Only listen directly when run standalone (not mounted)
if (require.main === module) {
  const PORT = process.env.CITAS_PORT || 3002;
  app.listen(PORT, () => {
    console.log(`
📅 SUITORG CITAS MODULE
------------------------
Port: ${PORT}
WhatsApp: ${WHATSAPP_CONFIG.token ? 'configured' : 'MISSING TOKEN'}
Gemini: ${GEMINI_KEY ? 'configured' : 'MISSING KEY'}
------------------------
    `);
  });
}

module.exports = app;
