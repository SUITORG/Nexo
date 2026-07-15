const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3020;
const DATA_FILE = path.join(__dirname, 'data', 'contactos.json');

app.use(express.json());

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(contactos) {
  const maxNum = contactos.reduce((max, c) => {
    const num = parseInt(c.id.replace('CONT-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `CONT-${String(maxNum + 1).padStart(3, '0')}`;
}

function getTenant(req) {
  return req.headers['x-tenant-id'] || 'default';
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', (req, res) => {
  try {
    const contactos = readData();
    res.json({ status: 'ok', total: contactos.length });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/api/contactos', (req, res) => {
  const tenant = getTenant(req);
  const contactos = readData().filter(c => c.id_empresa === tenant && c.activo);
  res.json(contactos);
});

app.get('/api/contactos/:id', (req, res) => {
  const tenant = getTenant(req);
  const contacto = readData().find(c => c.id === req.params.id && c.id_empresa === tenant);
  if (!contacto) return res.status(404).json({ error: 'Contacto no encontrado' });
  res.json(contacto);
});

app.post('/api/contactos', (req, res) => {
  const { nombre, email, telefono, notas } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: 'nombre y email son requeridos' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'email inválido' });
  const contactos = readData();
  const nuevo = {
    id: nextId(contactos),
    nombre,
    email,
    telefono: telefono || '',
    notas: notas || '',
    id_empresa: getTenant(req),
    activo: true,
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString()
  };
  contactos.push(nuevo);
  writeData(contactos);
  res.status(201).json(nuevo);
});

app.put('/api/contactos/:id', (req, res) => {
  const tenant = getTenant(req);
  const contactos = readData();
  const idx = contactos.findIndex(c => c.id === req.params.id && c.id_empresa === tenant);
  if (idx === -1) return res.status(404).json({ error: 'Contacto no encontrado' });
  const { nombre, email, telefono, notas } = req.body;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'email inválido' });
  contactos[idx] = {
    ...contactos[idx],
    nombre: nombre ?? contactos[idx].nombre,
    email: email ?? contactos[idx].email,
    telefono: telefono ?? contactos[idx].telefono,
    notas: notas ?? contactos[idx].notas,
    actualizado: new Date().toISOString()
  };
  writeData(contactos);
  res.json(contactos[idx]);
});

app.delete('/api/contactos/:id', (req, res) => {
  const tenant = getTenant(req);
  const contactos = readData();
  const idx = contactos.findIndex(c => c.id === req.params.id && c.id_empresa === tenant);
  if (idx === -1) return res.status(404).json({ error: 'Contacto no encontrado' });
  contactos[idx].activo = false;
  contactos[idx].actualizado = new Date().toISOString();
  writeData(contactos);
  res.json({ message: 'Contacto desactivado' });
});

app.use(express.static(path.join(__dirname, '..', 'src')));

app.listen(PORT, () => {
  console.log(`SuitTest Contactos API corriendo en http://localhost:${PORT}`);
});

module.exports = app;
