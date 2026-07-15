const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data', 'tareas.json');

const tareas = [
  { id: 'TASK-001', titulo: 'Revisar correo pendiente', descripcion: 'Responder a los 5 correos de esta semana', categoria: 'Trabajo', fecha_limite: '2026-07-16', estado: 'pendiente', creado: '2026-07-14T08:00:00Z', actualizado: '2026-07-14T08:00:00Z' },
  { id: 'TASK-002', titulo: 'Comprar despensa semanal', descripcion: 'Leche, huevos, pan, fruta, verduras', categoria: 'Personal', fecha_limite: '2026-07-15', estado: 'pendiente', creado: '2026-07-13T10:30:00Z', actualizado: '2026-07-13T10:30:00Z' },
  { id: 'TASK-003', titulo: 'Estudiar módulo de APIs REST', descripcion: 'Completar el curso de Express y terminar el ejercicio práctico', categoria: 'Estudio', fecha_limite: '2026-07-18', estado: 'en-progreso', creado: '2026-07-12T14:00:00Z', actualizado: '2026-07-14T09:00:00Z' },
  { id: 'TASK-004', titulo: 'Ir al gimnasio', descripcion: 'Rutina de pecho y tríceps', categoria: 'Salud', fecha_limite: '2026-07-14', estado: 'completada', creado: '2026-07-11T07:00:00Z', actualizado: '2026-07-14T18:00:00Z' },
  { id: 'TASK-005', titulo: 'Pagar tarjeta de crédito', descripcion: 'Vence el 20 de julio, pago mínimo $1,500', categoria: 'Finanzas', fecha_limite: '2026-07-19', estado: 'pendiente', creado: '2026-07-10T12:00:00Z', actualizado: '2026-07-10T12:00:00Z' },
  { id: 'TASK-006', titulo: 'Preparar presentación del equipo', descripcion: 'Slides para la reunión del jueves con el cliente', categoria: 'Trabajo', fecha_limite: '2026-07-17', estado: 'en-progreso', creado: '2026-07-13T16:00:00Z', actualizado: '2026-07-14T10:00:00Z' },
  { id: 'TASK-007', titulo: 'Leer libro pendiente', descripcion: 'Terminar los últimos 3 capítulos', categoria: 'Personal', fecha_limite: '2026-07-25', estado: 'pendiente', creado: '2026-07-09T20:00:00Z', actualizado: '2026-07-09T20:00:00Z' },
  { id: 'TASK-008', titulo: 'Organizar escritorio', descripcion: 'Limpiar y ordenar papeles y cables', categoria: 'Personal', fecha_limite: '', estado: 'pendiente', creado: '2026-07-14T11:00:00Z', actualizado: '2026-07-14T11:00:00Z' }
];

fs.writeFileSync(DATA_FILE, JSON.stringify(tareas, null, 2), 'utf8');
console.log(`Seed completado: ${tareas.length} tareas`);
console.log(`  Pendientes: ${tareas.filter(t => t.estado === 'pendiente').length}`);
console.log(`  En progreso: ${tareas.filter(t => t.estado === 'en-progreso').length}`);
console.log(`  Completadas: ${tareas.filter(t => t.estado === 'completada').length}`);
