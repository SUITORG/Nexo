const express = require('express');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3008;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitInventarios' });
});

app.get('/api/inventario/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { producto_id, bodega_id, activo } = req.query;
  let query = supabase
    .from('Inventario')
    .select('*')
    .eq('id_empresa', id_empresa);
  if (producto_id) query = query.eq('producto_id', producto_id);
  if (bodega_id) query = query.eq('bodega_id', bodega_id);
  if (activo !== undefined) query = query.eq('activo', activo);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/inventario/movimiento', async (req, res) => {
  const { id_empresa, producto_id, bodega_id, tipo, cantidad, referencia, observaciones } = req.body;
  if (!id_empresa || !producto_id || !tipo || !cantidad) {
    return res.status(400).json({ error: 'id_empresa, producto_id, tipo, cantidad required' });
  }
  if (!['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA'].includes(tipo)) {
    return res.status(400).json({ error: 'tipo must be ENTRADA, SALIDA, AJUSTE, or TRANSFERENCIA' });
  }
  const last = await (async () => {
    const { data } = await supabase
      .from('Movimientos_Inventario')
      .select('id')
      .ilike('id', 'MOV-%')
      .order('id', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('MOV-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `MOV-${String(n).padStart(4, '0')}`;
  const { data, error } = await supabase.from('Movimientos_Inventario').insert({
    id, id_empresa, producto_id, bodega_id, tipo, cantidad, referencia, observaciones
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/inventario/movimientos/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { limit, producto_id } = req.query;
  let query = supabase
    .from('Movimientos_Inventario')
    .select('*')
    .eq('id_empresa', id_empresa)
    .order('created_at', { ascending: false });
  if (producto_id) query = query.eq('producto_id', producto_id);
  if (limit) query = query.limit(parseInt(limit));
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`SuitInventarios running on port ${PORT}`);
});

module.exports = app;
