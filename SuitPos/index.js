const express = require('express');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3006;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitPos' });
});

app.get('/api/orders/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  const { status, limit } = req.query;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  let query = supabase
    .from('Proyectos')
    .select('*')
    .eq('id_empresa', id_empresa)
    .in('origen', ['APP-POS-COUNTER', 'APP-ORDER']);
  if (status) query = query.eq('estatus', status);
  if (limit) query = query.limit(parseInt(limit));
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/order/status', async (req, res) => {
  const { id, estatus } = req.body;
  if (!id || !estatus) return res.status(400).json({ error: 'id and estatus required' });
  const { data, error } = await supabase
    .from('Proyectos')
    .update({ estatus })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`SuitPos running on port ${PORT}`);
});

module.exports = app;
