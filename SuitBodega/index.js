const express = require('express');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3009;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitBodega' });
});

app.get('/api/bodegas/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { data, error } = await supabase
    .from('Bodegas')
    .select('*')
    .eq('id_empresa', id_empresa)
    .eq('activo', 'TRUE')
    .order('nombre', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/bodegas', async (req, res) => {
  const { id_empresa, nombre, direccion, encargado } = req.body;
  if (!id_empresa || !nombre) return res.status(400).json({ error: 'id_empresa and nombre required' });
  const last = await (async () => {
    const { data } = await supabase
      .from('Bodegas')
      .select('id')
      .ilike('id', 'BOD-%')
      .order('id', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('BOD-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `BOD-${String(n).padStart(2, '0')}`;
  const { data, error } = await supabase.from('Bodegas').insert({
    id, id_empresa, nombre, direccion, encargado, activo: 'TRUE'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.post('/api/bodegas/transferencia', async (req, res) => {
  const { id_empresa, producto_id, bodega_origen_id, bodega_destino_id, cantidad, observaciones } = req.body;
  if (!id_empresa || !producto_id || !bodega_origen_id || !bodega_destino_id || !cantidad) {
    return res.status(400).json({ error: 'id_empresa, producto_id, bodega_origen_id, bodega_destino_id, cantidad required' });
  }
  const last = await (async () => {
    const { data } = await supabase
      .from('Transferencias')
      .select('id')
      .ilike('id', 'TRN-%')
      .order('id', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('TRN-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `TRN-${String(n).padStart(4, '0')}`;
  const { data, error } = await supabase.from('Transferencias').insert({
    id, id_empresa, producto_id, bodega_origen_id, bodega_destino_id, cantidad,
    estatus: 'PENDIENTE', observaciones
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/bodegas/transferencias/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { limit, estatus } = req.query;
  let query = supabase
    .from('Transferencias')
    .select('*')
    .eq('id_empresa', id_empresa)
    .order('created_at', { ascending: false });
  if (estatus) query = query.eq('estatus', estatus);
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`SuitBodega running on port ${PORT}`);
});

module.exports = app;
