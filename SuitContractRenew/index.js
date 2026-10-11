const path = require('path');
const express = require('express');
require('dotenv').config();
const { handleAdd, handleDue } = require('./handlers/contracts');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3017;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitContractRenew' });
});

app.post('/api/contracts', handleAdd);
app.get('/api/contracts/due/:dias?', handleDue);

app.post('/api/leads', async (req, res) => {
  const { nombre, negocio, whatsapp, email, contratos_aprox, mensaje } = req.body || {};
  if (!nombre || (!whatsapp && !email)) {
    return res.status(400).json({ error: 'nombre y whatsapp son requeridos' });
  }
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads_contractrenew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ nombre, negocio, whatsapp, email, contratos_aprox, mensaje })
    });
    if (!r.ok) return res.status(502).json({ error: 'supabase_error' });
    res.status(201).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'supabase_unreachable' });
  }
});

// Landing estática del producto en la raíz /
app.use(express.static(path.join(__dirname, 'landing')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`SuitContractRenew en http://localhost:${PORT}`));
}

module.exports = app;
