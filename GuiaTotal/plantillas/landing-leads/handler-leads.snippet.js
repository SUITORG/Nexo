// POST /api/leads — pegar en index.js del módulo ANTES de express.static.
// Requiere .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (nunca commitear).
// Cambiar LEADS_TABLE por leads_<slug> del módulo.
const LEADS_TABLE = 'leads_<slug>';

app.post('/api/leads', async (req, res) => {
  const { nombre, negocio, whatsapp, email, mensaje } = req.body || {};
  if (!nombre || (!whatsapp && !email)) {
    return res.status(400).json({ error: 'nombre y whatsapp son requeridos' });
  }
  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${LEADS_TABLE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ nombre, negocio, whatsapp, email, mensaje })
    });
    if (!r.ok) return res.status(502).json({ error: 'supabase_error' });
    res.status(201).json({ ok: true });
  } catch {
    res.status(502).json({ error: 'supabase_unreachable' });
  }
});

app.use(express.static(path.join(__dirname, 'landing')));
