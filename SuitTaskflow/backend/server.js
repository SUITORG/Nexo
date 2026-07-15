const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3030;
const DATA_FILE = path.join(__dirname, 'data', 'tareas.json');

app.use(express.json());

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(tareas) {
  const max = tareas.reduce((m, t) => {
    const n = parseInt(t.id.replace('TASK-', ''), 10);
    return n > m ? n : m;
  }, 0);
  return 'TASK-' + String(max + 1).padStart(3, '0');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/tasks', (req, res) => {
  let tareas = readData();
  const { status, categoria, q } = req.query;
  if (status && ['pendiente', 'en-progreso', 'completada'].includes(status)) {
    tareas = tareas.filter(t => t.estado === status);
  }
  if (categoria) {
    tareas = tareas.filter(t => t.categoria === categoria);
  }
  if (q) {
    const term = q.toLowerCase();
    tareas = tareas.filter(t =>
      t.titulo.toLowerCase().includes(term) ||
      t.descripcion.toLowerCase().includes(term)
    );
  }
  tareas.sort((a, b) => new Date(b.creado) - new Date(a.creado));
  res.json(tareas);
});

app.get('/api/tasks/:id', (req, res) => {
  const tarea = readData().find(t => t.id === req.params.id);
  if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(tarea);
});

app.post('/api/tasks', (req, res) => {
  const { titulo, descripcion, categoria, fecha_limite, estado } = req.body;
  if (!titulo) return res.status(400).json({ error: 'El título es requerido' });
  const tareas = readData();
  const nueva = {
    id: nextId(tareas),
    titulo: titulo.trim(),
    descripcion: (descripcion || '').trim(),
    categoria: categoria || 'Personal',
    fecha_limite: fecha_limite || '',
    estado: (estado && ['pendiente', 'en-progreso', 'completada'].includes(estado)) ? estado : 'pendiente',
    creado: new Date().toISOString(),
    actualizado: new Date().toISOString()
  };
  tareas.push(nueva);
  writeData(tareas);
  res.status(201).json(nueva);
});

app.put('/api/tasks/:id', (req, res) => {
  const tareas = readData();
  const idx = tareas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
  const { titulo, descripcion, categoria, fecha_limite, estado } = req.body;
  if (estado && !['pendiente', 'en-progreso', 'completada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  tareas[idx] = {
    ...tareas[idx],
    titulo: titulo !== undefined ? titulo.trim() : tareas[idx].titulo,
    descripcion: descripcion !== undefined ? descripcion.trim() : tareas[idx].descripcion,
    categoria: categoria !== undefined ? categoria : tareas[idx].categoria,
    fecha_limite: fecha_limite !== undefined ? fecha_limite : tareas[idx].fecha_limite,
    estado: estado !== undefined ? estado : tareas[idx].estado,
    actualizado: new Date().toISOString()
  };
  writeData(tareas);
  res.json(tareas[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  let tareas = readData();
  const idx = tareas.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tarea no encontrada' });
  tareas.splice(idx, 1);
  writeData(tareas);
  res.json({ message: 'Tarea eliminada' });
});

app.use(express.static(path.join(__dirname, '..', 'src')));

app.listen(PORT, () => {
  console.log(`TaskFlow corriendo en http://localhost:${PORT}`);
});

module.exports = app;
