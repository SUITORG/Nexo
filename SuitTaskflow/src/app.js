const API = '/api/tasks';
let editingId = null;
let searchTimer = null;

const $ = id => document.getElementById(id);
const taskList = $('taskList');
const emptyMsg = $('emptyMsg');
const taskCounter = $('taskCounter');
const modalOverlay = $('modalOverlay');
const modalTitle = $('modalTitle');
const modalError = $('modalError');

async function checkStatus() {
  try {
    const res = await fetch('/api/health');
    $('statusDot').className = 'status-dot' + (res.ok ? '' : ' off');
  } catch {
    $('statusDot').className = 'status-dot off';
  }
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

function isOverdue(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

async function loadTasks() {
  const params = new URLSearchParams();
  const q = $('searchInput').value.trim();
  const status = $('statusFilter').value;
  const cat = $('catFilter').value;
  if (q) params.set('q', q);
  if (status) params.set('status', status);
  if (cat) params.set('categoria', cat);

  try {
    const res = await fetch(API + '?' + params.toString());
    if (!res.ok) throw new Error();
    const tareas = await res.json();
    render(tareas);
  } catch {
    taskList.innerHTML = '<div class="empty-state"><p style="color:#ef4444">Error de conexión</p></div>';
  }
}

function render(tareas) {
  const total = tareas.length;
  const pendientes = tareas.filter(t => t.estado === 'pendiente');
  const progreso = tareas.filter(t => t.estado === 'en-progreso');
  const completadas = tareas.filter(t => t.estado === 'completada');

  $('countPending').textContent = pendientes.length + progreso.length;
  $('countProgress').textContent = completadas.length;
  $('countDone').textContent = tareas.length;

  taskCounter.textContent = total + ' tarea' + (total !== 1 ? 's' : '');

  if (!total) {
    taskList.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  taskList.innerHTML = tareas.map(t => {
    const overdue = t.estado !== 'completada' && isOverdue(t.fecha_limite);
    return `
      <div class="task-card">
        <div class="task-header">
          <div class="task-title">${esc(t.titulo)}</div>
          <span class="status-pill ${t.estado}">${t.estado.replace('-', ' ')}</span>
        </div>
        ${t.descripcion ? `<div class="task-desc">${esc(t.descripcion)}</div>` : ''}
        <div class="task-meta">
          <span class="cat-badge ${t.categoria}">${t.categoria}</span>
          ${t.fecha_limite ? `<span class="due-date${overdue ? ' overdue' : ''}">${overdue ? '🔴 ' : ''}${formatDate(t.fecha_limite)}</span>` : ''}
        </div>
        <div class="task-actions">
          <button class="btn-edit" onclick="editTask('${t.id}')">✎ Editar</button>
          ${t.estado !== 'completada' ? `<button class="btn-done" onclick="completeTask('${t.id}')">✓ Completar</button>` : ''}
          <button class="btn-delete" onclick="deleteTask('${t.id}')">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function openForm(task) {
  editingId = task ? task.id : null;
  modalTitle.textContent = task ? 'Editar Tarea' : 'Nueva Tarea';
  $('inputTitulo').value = task ? task.titulo : '';
  $('inputDesc').value = task ? task.descripcion : '';
  $('inputCat').value = task ? task.categoria : 'Personal';
  $('inputDate').value = task ? task.fecha_limite : '';
  $('inputStatus').value = task ? task.estado : 'pendiente';
  modalError.classList.remove('show');
  modalOverlay.classList.add('open');
  setTimeout(() => $('inputTitulo').focus(), 100);
}

function closeForm() {
  modalOverlay.classList.remove('open');
  editingId = null;
}

async function saveTask() {
  const payload = {
    titulo: $('inputTitulo').value.trim(),
    descripcion: $('inputDesc').value.trim(),
    categoria: $('inputCat').value,
    fecha_limite: $('inputDate').value,
    estado: $('inputStatus').value
  };
  if (!payload.titulo) {
    modalError.textContent = 'El título es obligatorio';
    modalError.classList.add('show');
    return;
  }
  modalError.classList.remove('show');

  const url = editingId ? API + '/' + editingId : API;
  const method = editingId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      modalError.textContent = err.error || 'Error al guardar';
      modalError.classList.add('show');
      return;
    }
    closeForm();
    await loadTasks();
    showToast(editingId ? 'Tarea actualizada' : 'Tarea creada');
  } catch {
    modalError.textContent = 'Error de conexión';
    modalError.classList.add('show');
  }
}

async function editTask(id) {
  try {
    const res = await fetch(API + '/' + id);
    if (!res.ok) return;
    openForm(await res.json());
  } catch {
    showToast('Error al cargar tarea');
  }
}

async function completeTask(id) {
  try {
    const res = await fetch(API + '/' + id);
    if (!res.ok) return;
    const tarea = await res.json();
    const upd = await fetch(API + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...tarea, estado: 'completada' })
    });
    if (!upd.ok) return;
    await loadTasks();
    showToast('Tarea completada ✓');
  } catch {
    showToast('Error al completar tarea');
  }
}

async function deleteTask(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  try {
    const res = await fetch(API + '/' + id, { method: 'DELETE' });
    if (!res.ok) return;
    await loadTasks();
    showToast('Tarea eliminada');
  } catch {
    showToast('Error al eliminar');
  }
}

$('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadTasks, 250);
});
$('statusFilter').addEventListener('change', loadTasks);
$('catFilter').addEventListener('change', loadTasks);
$('fabAdd').addEventListener('click', () => openForm(null));
$('btnSave').addEventListener('click', saveTask);
$('btnCancel').addEventListener('click', closeForm);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeForm(); });

$('inputTitulo').addEventListener('keydown', e => { if (e.key === 'Enter') saveTask(); });

checkStatus();
loadTasks();
