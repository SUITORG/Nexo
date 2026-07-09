const express = require('express');
const { handleIncoming } = require('./handlers/webhook');
const { findOrCreateClient, scheduleAppointment } = require('./handlers/actions');
const supabase = require('./db/client');
const calendar = require('./services/calendar');

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

// POST: crear reservación desde formulario público
app.post('/api/reservaciones', async (req, res) => {
  const { id_empresa, fecha_cita, nombre_cliente, whatsapp, servicio } = req.body;
  if (!id_empresa || !fecha_cita || !nombre_cliente || !whatsapp) {
    return res.status(400).json({ error: 'Faltan campos requeridos: id_empresa, fecha_cita, nombre_cliente, whatsapp' });
  }

  const cliente = await findOrCreateClient(id_empresa, whatsapp, nombre_cliente);
  const last = await (async () => {
    const pattern = 'CIT-%';
    const { data } = await supabase.from('Reservaciones').select('id').ilike('id', pattern).order('id', { ascending: false }).limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('CIT-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `CIT-${String(n).padStart(3, '0')}`;
  const start = new Date(fecha_cita);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  let googleEventId = null;
  const { data: empresa } = await supabase.from('Config_Empresas').select('id_calendario_google, usa_reservaciones').eq('id_empresa', id_empresa).limit(1).single();
  if (empresa && parseInt(empresa.usa_reservaciones) >= 2 && empresa.id_calendario_google) {
    try {
      const event = await calendar.createEvent(empresa.id_calendario_google, {
        title: `${servicio || 'Cita'} - ${nombre_cliente}`,
        start: start.toISOString(),
        end: end.toISOString(),
        description: servicio || '',
        cliente,
      });
      googleEventId = event.id;
    } catch (e) { console.error('[CALENDAR_CREATE_ERROR]', e.message); }
  }

  const { error } = await supabase.from('Reservaciones').insert({
    id, id_empresa, id_cliente: cliente.id_cliente,
    fecha_cita: start.toISOString(), duracion_min: 60,
    servicio: servicio || 'General', status: 'PENDIENTE',
    google_event_id: googleEventId,
    nombre_cliente, whatsapp,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id_cita: id, cliente: cliente.id_cliente });
});

// PATCH: actualizar status de reservación (staff)
app.patch('/api/reservaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { status, calendario } = req.body;
  const validStatus = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];
  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Válidos: ' + validStatus.join(', ') });
  }
  const { data: cita } = await supabase.from('Reservaciones').select('*').eq('id', id).single();
  if (!cita) return res.status(404).json({ error: 'Reservación no encontrada' });

  let calendarId = null;
  if (calendario !== false && cita.google_event_id) {
    const { data: empCal } = await supabase.from('Config_Empresas').select('id_calendario_google').eq('id_empresa', cita.id_empresa).limit(1).single();
    calendarId = empCal?.id_calendario_google || null;
    try {
      if (status === 'CANCELADA') {
        await calendar.deleteEvent(calendarId, cita.google_event_id);
      }
    } catch (e) { console.error('[CALENDAR_UPDATE_ERROR]', e.message); }
  }

  const { error } = await supabase.from('Reservaciones').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id, status });
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
