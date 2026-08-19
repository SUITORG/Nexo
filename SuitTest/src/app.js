const API = '/api/contactos';
let editingId = null;

const $ = id => document.getElementById(id);
const tenantInput = $('tenantInput');
const tenantTag = $('tenantTag');
const countBadge = $('countBadge');
const tablaBody = $('tablaBody');
const emptyMsg = $('emptyMsg');
const formContainer = $('formContainer');
const formTitle = $('formTitle');
const formError = $('formError');
const toast = $('toast');

let toastTimeout = null;

function getTenant() {
  return tenantInput.value.trim() || 'default';
}

function updateTenantUI() {
  const t = getTenant();
  tenantTag.textContent = t;
}

function showToast(msg, isError) {
  toast.textContent = msg;
  toast.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
  });
}

async function checkStatus() {
  const dot = $('statusDot');
  const text = $('statusText');
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      dot.className = 'status-dot';
      text.textContent = 'Conectado';
    } else {
      throw new Error('nok');
    }
  } catch {
    dot.className = 'status-dot off';
    text.textContent = 'Sin conexión';
  }
}

async function listar() {
  const tenant = getTenant();
  try {
    const res = await fetch(API, { headers: { 'X-Tenant-ID': tenant } });
    if (!res.ok) throw new Error('Error al listar');
    const contactos = await res.json();
    countBadge.textContent = contactos.length + ' contacto' + (contactos.length !== 1 ? 's' : '');
    if (!contactos.length) {
      tablaBody.innerHTML = '';
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';
    tablaBody.innerHTML = contactos.map(c => `
      <tr>
        <td style="font-weight:500;font-size:0.8rem;color:var(--text-secondary)">${c.id}</td>
        <td><strong>${esc(c.nombre)}</strong></td>
        <td><a href="mailto:${esc(c.email)}" style="color:var(--accent);text-decoration:none">${esc(c.email)}</a></td>
        <td style="color:var(--text-secondary)">${c.telefono || '—'}</td>
        <td style="color:var(--text-secondary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.notas || '—'}</td>
        <td class="actions">
          <button class="btn btn-ghost btn-icon" onclick="editar('${c.id}')" title="Editar">✎</button>
          <button class="btn btn-ghost btn-icon" onclick="eliminar('${c.id}')" title="Eliminar" style="color:var(--accent)">✕</button>
        </td>
      </tr>
    `).join('');
  } catch {
    showToast('Error de conexión con el servidor', true);
  }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function mostrarForm(contacto) {
  formContainer.style.display = 'block';
  formTitle.textContent = contacto ? 'Editar Contacto' : 'Nuevo Contacto';
  $('inputNombre').value = contacto ? contacto.nombre : '';
  $('inputEmail').value = contacto ? contacto.email : '';
  $('inputTelefono').value = contacto ? contacto.telefono : '';
  $('inputNotas').value = contacto ? contacto.notas : '';
  formError.textContent = '';
  editingId = contacto ? contacto.id : null;
  $('inputNombre').focus();
}

function ocultarForm() {
  formContainer.style.display = 'none';
  editingId = null;
}

function getFormData() {
  return {
    nombre: $('inputNombre').value.trim(),
    email: $('inputEmail').value.trim(),
    telefono: $('inputTelefono').value.trim(),
    notas: $('inputNotas').value.trim()
  };
}

async function guardar() {
  const payload = getFormData();
  if (!payload.nombre || !payload.email) {
    formError.textContent = 'Nombre y email son requeridos';
    return;
  }
  const tenant = getTenant();
  const url = editingId ? `${API}/${editingId}` : API;
  const method = editingId ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': tenant },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      formError.textContent = err.error || 'Error al guardar';
      return;
    }
    ocultarForm();
    await listar();
    showToast(editingId ? 'Contacto actualizado' : 'Contacto creado');
  } catch {
    showToast('Error de conexión', true);
  }
}

async function editar(id) {
  const tenant = getTenant();
  try {
    const res = await fetch(`${API}/${id}`, { headers: { 'X-Tenant-ID': tenant } });
    if (!res.ok) return;
    mostrarForm(await res.json());
  } catch {
    showToast('Error al obtener contacto', true);
  }
}

async function eliminar(id) {
  if (!confirm('¿Desactivar este contacto?')) return;
  const tenant = getTenant();
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'DELETE',
      headers: { 'X-Tenant-ID': tenant }
    });
    if (!res.ok) return;
    await listar();
    showToast('Contacto desactivado');
  } catch {
    showToast('Error al eliminar', true);
  }
}

tenantInput.addEventListener('input', () => {
  updateTenantUI();
  listar();
});

$('btnNuevo').addEventListener('click', () => mostrarForm(null));
$('btnGuardar').addEventListener('click', guardar);
$('btnCancelar').addEventListener('click', ocultarForm);

updateTenantUI();
checkStatus();
listar();
