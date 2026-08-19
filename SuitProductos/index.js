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
  const {
    id_empresa, nombre, precio, categoria, descripcion, imagen_url,
    precio_oferta, unidad, es_combo, stock, min, max,
    activo, etiqueta_promo, contenido_combo, media, p_mes, p_mes_of
  } = req.body;
  if (!id_empresa || !nombre) return res.status(400).json({ error: 'id_empresa and nombre required' });
  const last = await (async () => {
    const { data } = await supabase
      .from('Catalogo')
      .select('id_producto')
      .ilike('id_producto', 'PROD-%')
      .eq('id_empresa', id_empresa)
      .order('id_producto', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    const num = parseInt(data[0].id_producto.replace('PROD-', ''), 10);
    return num || null;
  })();
  const n = (last || 0) + 1;
  const id_producto = `PROD-${String(n).padStart(2, '0')}`;
  const row = {
    id_producto, id_empresa, nombre, categoria, descripcion,
    precio: precio ?? 0,
    activo: activo !== undefined ? activo : 'TRUE'
  };
  if (precio_oferta !== undefined) row.precio_oferta = precio_oferta;
  if (unidad !== undefined) row.unidad = unidad;
  if (es_combo !== undefined) row.es_combo = es_combo;
  if (stock !== undefined) row.stock = stock;
  if (min !== undefined) row.min = min;
  if (max !== undefined) row.max = max;
  if (imagen_url !== undefined) row.imagen_url = imagen_url;
  if (etiqueta_promo !== undefined) row.etiqueta_promo = etiqueta_promo;
  if (contenido_combo !== undefined) row.contenido_combo = contenido_combo;
  if (media !== undefined) row.media = media;
  if (p_mes !== undefined) row.p_mes = p_mes;
  if (p_mes_of !== undefined) row.p_mes_of = p_mes_of;
  const { data, error } = await supabase.from('Catalogo').insert(row).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/api/productos/:id_producto', async (req, res) => {
  const { id_producto } = req.params;
  const id_empresa = req.query.id_empresa || req.body.id_empresa;
  if (!id_producto || !id_empresa) return res.status(400).json({ error: 'id_producto (path) and id_empresa (query/body) required' });
  const updates = { ...req.body };
  delete updates.id_producto;
  delete updates.id_empresa;
  const { data, error } = await supabase
    .from('Catalogo')
    .update(updates)
    .eq('id_producto', id_producto)
    .eq('id_empresa', id_empresa)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/productos/:id_producto', async (req, res) => {
  const { id_producto } = req.params;
  const id_empresa = req.query.id_empresa;
  if (!id_producto || !id_empresa) return res.status(400).json({ error: 'id_producto (path) and id_empresa (query) required' });
  const { data, error } = await supabase
    .from('Catalogo')
    .update({ activo: 'FALSE' })
    .eq('id_producto', id_producto)
    .eq('id_empresa', id_empresa)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`SuitProductos running on port ${PORT}`);
});

module.exports = app;
