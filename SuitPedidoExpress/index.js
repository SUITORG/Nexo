const express = require('express');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitPedidoExpress' });
});

app.get('/api/menu/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { data, error } = await supabase
    .from('Catalogo')
    .select('*')
    .eq('id_empresa', id_empresa)
    .eq('activo', 'TRUE');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/order', async (req, res) => {
  const { id_empresa, items, cliente, total, metodo_pago } = req.body;
  if (!id_empresa || !items || !cliente) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  const last = await (async () => {
    const { data } = await supabase
      .from('Proyectos')
      .select('id')
      .ilike('id', 'PED-%')
      .order('id', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('PED-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `PED-${String(n).padStart(3, '0')}`;
  const { data, error } = await supabase.from('Proyectos').insert({
    id,
    id_empresa,
    nombre_proyecto: `Pedido ${cliente.nombre || 'Express'}`,
    items: JSON.stringify(items),
    cliente,
    total,
    metodo_pago,
    estatus: 'PEDIDO-RECIBIDO',
    origen: 'APP-ORDER'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.listen(PORT, () => {
  console.log(`SuitPedidoExpress running on port ${PORT}`);
});

module.exports = app;
