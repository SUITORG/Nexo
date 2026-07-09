const express = require('express');
const supabase = require('./db/client');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3007;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'SuitProductos' });
});

app.get('/api/productos/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { categoria, activo } = req.query;
  let query = supabase
    .from('Catalogo')
    .select('*')
    .eq('id_empresa', id_empresa);
  if (categoria) query = query.eq('categoria', categoria);
  if (activo !== undefined) query = query.eq('activo', activo);
  query = query.order('nombre', { ascending: true });
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/productos/categorias/:id_empresa', async (req, res) => {
  const { id_empresa } = req.params;
  if (!id_empresa) return res.status(400).json({ error: 'id_empresa required' });
  const { data, error } = await supabase
    .from('Catalogo')
    .select('categoria')
    .eq('id_empresa', id_empresa)
    .not('categoria', 'is', null)
    .order('categoria', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  const categorias = [...new Set(data.map(r => r.categoria).filter(Boolean))];
  res.json(categorias);
});

app.post('/api/productos', async (req, res) => {
  const { id_empresa, nombre, precio, categoria, descripcion, imagen, activo } = req.body;
  if (!id_empresa || !nombre) return res.status(400).json({ error: 'id_empresa and nombre required' });
  const last = await (async () => {
    const { data } = await supabase
      .from('Catalogo')
      .select('id')
      .ilike('id', 'PROD-%')
      .order('id', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id.replace('PROD-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id = `PROD-${String(n).padStart(2, '0')}`;
  const { data, error } = await supabase.from('Catalogo').insert({
    id, id_empresa, nombre, precio, categoria, descripcion, imagen,
    activo: activo !== undefined ? activo : 'TRUE'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  delete updates.id;
  delete updates.id_empresa;
  const { data, error } = await supabase.from('Catalogo').update(updates).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'id required' });
  const { data, error } = await supabase.from('Catalogo').update({ activo: 'FALSE' }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`SuitProductos running on port ${PORT}`);
});

module.exports = app;
