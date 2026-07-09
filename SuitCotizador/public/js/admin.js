var adminEmpresaId = null;
var adminTab = 'procesos';

function adminFetch(path, opts) {
  opts = opts || {};
  var url = path;
  if (opts.params) {
    var qs = Object.keys(opts.params).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(opts.params[k]); }).join('&');
    url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
  }
  var fetchOpts = { headers: { 'Content-Type': 'application/json' } };
  if (opts.method && opts.method !== 'GET') {
    fetchOpts.method = opts.method;
    fetchOpts.body = JSON.stringify(opts.body || {});
  }
  return fetch(url, fetchOpts).then(function(r) { return r.json(); });
}

function initAdmin() {
  var params = {};
  var q = window.location.search.substring(1).split('&');
  for (var i = 0; i < q.length; i++) {
    var par = q[i].split('=');
    if (par[0]) params[decodeURIComponent(par[0])] = decodeURIComponent(par[1] || '');
  }
  if (params.admin !== '1') return;
  adminEmpresaId = params.empresa || null;
  if (!adminEmpresaId) {
    document.getElementById('view-cotizador').innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);">Falta parametro empresa</div>';
    return;
  }
  document.title = 'Admin Cotizador - ' + adminEmpresaId;
  document.getElementById('main-header').innerHTML = '<h2><i class="fas fa-cogs"></i> Admin Cotizador - ' + adminEmpresaId + '</h2><div class="header-actions"><a href="?empresa=' + encodeURIComponent(adminEmpresaId) + '" class="btn btn-secondary btn-sm"><i class="fas fa-calculator"></i> Ir al Cotizador</a></div>';
  document.getElementById('empresa-selector').classList.add('hidden');
  document.getElementById('view-cotizador').innerHTML = '<div class="tabs"><button class="tab active" data-tab="procesos" onclick="cambiarTab(\'procesos\')">Procesos</button><button class="tab" data-tab="variables" onclick="cambiarTab(\'variables\')">Variables</button><button class="tab" data-tab="reglas" onclick="cambiarTab(\'reglas\')">Reglas de Precio</button></div><div id="admin-content"></div>';
  cargarProcesos();
}

function cambiarTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.tabs .tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('.tabs .tab[data-tab="' + tab + '"]').classList.add('active');
  if (tab === 'procesos') cargarProcesos();
  else if (tab === 'variables') cargarVariables();
  else if (tab === 'reglas') cargarReglas();
}

// ========== PROCESOS ==========

function cargarProcesos() {
  var cont = document.getElementById('admin-content');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Cargando...</p></div>';
  adminFetch('/api/cotizador/procesos', { params: { id_empresa: adminEmpresaId } }).then(function(procesos) {
    if (!procesos || procesos.length === 0) {
      cont.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="mostrarModalProceso(null)"><i class="fas fa-plus"></i> Nuevo Proceso</button></div><div class="card" style="text-align:center;padding:30px;">No hay procesos registrados.</div>';
      return;
    }
    var html = '<div style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="mostrarModalProceso(null)"><i class="fas fa-plus"></i> Nuevo Proceso</button></div>';
    html += '<div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio Base</th><th>Acciones</th></tr></thead><tbody>';
    for (var i = 0; i < procesos.length; i++) {
      var p = procesos[i];
      var pb = (p.config_calculadora && p.config_calculadora.precio_base) || 0;
      html += '<tr><td>' + p.id + '</td><td>' + (p.nombre || '') + '</td><td><span class="badge" style="background:' + (p.tipo === 'producto' ? '#22c55e' : p.tipo === 'servicio' ? '#f59e0b' : '#3b82f6') + ';">' + p.tipo + '</span></td><td>$' + Number(pb).toLocaleString('es-MX', {minimumFractionDigits:2}) + '</td><td><button class="btn btn-sm btn-secondary" onclick="mostrarModalProceso(\'' + p.id + '\')">Editar</button> <button class="btn btn-sm btn-danger" onclick="eliminarProceso(\'' + p.id + '\')">Eliminar</button></td></tr>';
    }
    html += '</tbody></table></div>';
    cont.innerHTML = html;
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="color:var(--danger);">Error: ' + (err.message || err) + '</div>';
  });
}

function mostrarModalProceso(id) {
  var titulo = id ? 'Editar Proceso' : 'Nuevo Proceso';
  var nombre = '', descripcion = '', tipo = 'producto', precio = '', procId = id || '';
  if (id) {
    var filas = document.querySelectorAll('.admin-table tbody tr');
    for (var i = 0; i < filas.length; i++) {
      var c = filas[i].cells;
      if (c[0].textContent.trim() === id) {
        nombre = c[1].textContent.trim();
        break;
      }
    }
  }
  var html = '<div class="modal-overlay" onclick="if(event.target===this)cerrarModal()"><div class="modal"><div class="modal-header"><h3>' + titulo + '</h3><button class="modal-close" onclick="cerrarModal()">&times;</button></div><div class="modal-body"><div class="form-group"><label>Nombre</label><input id="f-nombre" class="form-control" value="' + nombre.replace(/"/g, '&quot;') + '"></div><div class="form-group"><label>Descripcion</label><input id="f-desc" class="form-control" value="' + descripcion.replace(/"/g, '&quot;') + '"></div><div class="form-group"><label>Tipo</label><select id="f-tipo" class="form-control"><option value="producto"' + (tipo === 'producto' ? ' selected' : '') + '>Producto</option><option value="servicio"' + (tipo === 'servicio' ? ' selected' : '') + '>Servicio</option><option value="proceso"' + (tipo === 'proceso' ? ' selected' : '') + '>Proceso</option></select></div><div class="form-group"><label>Precio Base ($ MXN)</label><input id="f-precio" type="number" class="form-control" value="' + precio + '"></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn btn-primary" onclick="guardarProceso(\'' + procId + '\')">' + (id ? 'Guardar Cambios' : 'Crear Proceso') + '</button></div></div></div>';
  var d = document.createElement('div');
  d.innerHTML = html;
  document.body.appendChild(d.firstElementChild);
}

function guardarProceso(id) {
  var nombre = document.getElementById('f-nombre').value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  var data = { id_empresa: adminEmpresaId, nombre: nombre, descripcion: document.getElementById('f-desc').value.trim(), tipo: document.getElementById('f-tipo').value, precio_base: Number(document.getElementById('f-precio').value) || 0 };
  var url = '/api/cotizador/admin/procesos' + (id ? '/' + id : '');
  var method = id ? 'PUT' : 'POST';
  adminFetch(url, { method: method, body: data }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cerrarModal();
    cargarProcesos();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

function eliminarProceso(id) {
  if (!confirm('Eliminar proceso ' + id + '?')) return;
  adminFetch('/api/cotizador/admin/procesos/' + id, { method: 'DELETE', body: { id_empresa: adminEmpresaId } }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cargarProcesos();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

// ========== VARIABLES ==========

function cargarVariables() {
  var cont = document.getElementById('admin-content');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Cargando procesos...</p></div>';
  adminFetch('/api/cotizador/procesos', { params: { id_empresa: adminEmpresaId } }).then(function(procesos) {
    if (!procesos || procesos.length === 0) {
      cont.innerHTML = '<div class="card" style="text-align:center;padding:30px;">Primero crea un proceso en la pestana Procesos.</div>';
      return;
    }
    var html = '<div class="form-group"><label>Seleccionar Proceso</label><select id="sel-proceso-var" class="form-control" onchange="cargarVariablesProceso()">';
    for (var i = 0; i < procesos.length; i++) {
      html += '<option value="' + procesos[i].id + '">' + (procesos[i].nombre || procesos[i].id) + '</option>';
    }
    html += '</select></div><div id="var-content"><div class="card" style="text-align:center;padding:30px;">Selecciona un proceso.</div></div>';
    cont.innerHTML = html;
    if (procesos.length > 0) cargarVariablesProceso();
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="color:var(--danger);">Error: ' + (err.message || err) + '</div>';
  });
}

function cargarVariablesProceso() {
  var sel = document.getElementById('sel-proceso-var');
  if (!sel) return;
  var idProceso = sel.value;
  var cont = document.getElementById('var-content');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Cargando...</p></div>';
  adminFetch('/api/cotizador/variables', { params: { id_proceso: idProceso, id_empresa: adminEmpresaId } }).then(function(vars) {
    var html = '<div style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="mostrarModalVariable(null)"><i class="fas fa-plus"></i> Nueva Variable</button></div>';
    if (!vars || vars.length === 0) {
      html += '<div class="card" style="text-align:center;padding:30px;">No hay variables para este proceso.</div>';
    } else {
      html += '<div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Nombre</th><th>Etiqueta</th><th>Tipo</th><th>Obligatorio</th><th>Acciones</th></tr></thead><tbody>';
      for (var i = 0; i < vars.length; i++) {
        var v = vars[i];
        html += '<tr><td>' + (v.nombre || '') + '</td><td>' + (v.etiqueta || '') + '</td><td>' + v.tipo + '</td><td>' + (v.obligatorio ? 'Si' : 'No') + '</td><td><button class="btn btn-sm btn-secondary" onclick="mostrarModalVariable(\'' + v.id + '\')">Editar</button> <button class="btn btn-sm btn-danger" onclick="eliminarVariable(\'' + v.id + '\')">Eliminar</button></td></tr>';
      }
      html += '</tbody></table></div>';
    }
    cont.innerHTML = html;
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="color:var(--danger);">Error: ' + (err.message || err) + '</div>';
  });
}

function mostrarModalVariable(id) {
  var sel = document.getElementById('sel-proceso-var');
  if (!sel) return;
  var idProceso = sel.value;
  var titulo = id ? 'Editar Variable' : 'Nueva Variable';
  var nombre = '', etiqueta = '', tipo = 'texto', obligatorio = false, valor_default = '', opciones = '';
  if (id) {
    var filas = document.querySelectorAll('#var-content .admin-table tbody tr');
    for (var i = 0; i < filas.length; i++) {
      var c = filas[i].cells;
      if (c[0].textContent.trim() === id || (c[0].textContent.trim() === '' && id)) { }
      if (c[0].textContent.trim() === id) { nombre = c[0].textContent.trim(); etiqueta = c[1].textContent.trim(); break; }
    }
  }
  var html = '<div class="modal-overlay" onclick="if(event.target===this)cerrarModal()"><div class="modal"><div class="modal-header"><h3>' + titulo + '</h3><button class="modal-close" onclick="cerrarModal()">&times;</button></div><div class="modal-body"><div class="form-group"><label>Nombre (identificador interno)</label><input id="vf-nombre" class="form-control" value="' + nombre + '"></div><div class="form-group"><label>Etiqueta (visible al usuario)</label><input id="vf-etiqueta" class="form-control" value="' + etiqueta + '"></div><div class="form-group"><label>Tipo</label><select id="vf-tipo" class="form-control" onchange="document.getElementById(\'vf-opciones-group\').style.display=this.value===\'select\'?\'block\':\'none\'"><option value="texto">Texto</option><option value="numero">Numero</option><option value="booleano">Si/No</option><option value="select">Seleccion (lista)</option></select></div><div class="form-group"><label><input type="checkbox" id="vf-obligatorio" value="true"' + (obligatorio ? ' checked' : '') + '> Obligatorio</label></div><div id="vf-opciones-group" style="display:none;" class="form-group"><label>Opciones (una por linea, formato: valor:etiqueta)</label><textarea id="vf-opciones" class="form-control" rows="3" placeholder="ej: basico:Paquete Basico&#10;premium:Paquete Premium">' + opciones + '</textarea></div><div class="form-group"><label>Valor por defecto</label><input id="vf-default" class="form-control" value="' + valor_default + '"></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn btn-primary" onclick="guardarVariable(\'' + (id || '') + '\',\'' + idProceso + '\')">' + (id ? 'Guardar Cambios' : 'Crear Variable') + '</button></div></div></div>';
  var d = document.createElement('div');
  d.innerHTML = html;
  document.body.appendChild(d.firstElementChild);
}

function guardarVariable(id, idProceso) {
  var nombre = document.getElementById('vf-nombre').value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  var opcionesRaw = document.getElementById('vf-opciones').value.trim();
  var opciones = [];
  if (opcionesRaw) {
    var lineas = opcionesRaw.split('\n');
    for (var i = 0; i < lineas.length; i++) {
      var parts = lineas[i].split(':');
      opciones.push({ value: parts[0].trim(), label: (parts[1] || parts[0]).trim() });
    }
  }
  var data = { id_empresa: adminEmpresaId, id_proceso: idProceso, nombre: nombre, etiqueta: document.getElementById('vf-etiqueta').value.trim(), tipo: document.getElementById('vf-tipo').value, obligatorio: document.getElementById('vf-obligatorio').checked, opciones: opciones, valor_default: document.getElementById('vf-default').value.trim() };
  var url = '/api/cotizador/admin/variables' + (id ? '/' + id : '');
  adminFetch(url, { method: id ? 'PUT' : 'POST', body: data }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cerrarModal();
    cargarVariablesProceso();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

function eliminarVariable(id) {
  if (!confirm('Eliminar variable ' + id + '?')) return;
  adminFetch('/api/cotizador/admin/variables/' + id, { method: 'DELETE', body: { id_empresa: adminEmpresaId } }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cargarVariablesProceso();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

// ========== REGLAS ==========

function cargarReglas() {
  var cont = document.getElementById('admin-content');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Cargando procesos...</p></div>';
  adminFetch('/api/cotizador/procesos', { params: { id_empresa: adminEmpresaId } }).then(function(procesos) {
    if (!procesos || procesos.length === 0) {
      cont.innerHTML = '<div class="card" style="text-align:center;padding:30px;">Primero crea un proceso en la pestana Procesos.</div>';
      return;
    }
    var html = '<div class="form-group"><label>Seleccionar Proceso</label><select id="sel-proceso-regla" class="form-control" onchange="cargarReglasProceso()">';
    for (var i = 0; i < procesos.length; i++) {
      html += '<option value="' + procesos[i].id + '">' + (procesos[i].nombre || procesos[i].id) + '</option>';
    }
    html += '</select></div><div id="regla-content"><div class="card" style="text-align:center;padding:30px;">Selecciona un proceso.</div></div>';
    cont.innerHTML = html;
    if (procesos.length > 0) cargarReglasProceso();
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="color:var(--danger);">Error: ' + (err.message || err) + '</div>';
  });
}

function cargarReglasProceso() {
  var sel = document.getElementById('sel-proceso-regla');
  if (!sel) return;
  var idProceso = sel.value;
  var cont = document.getElementById('regla-content');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse"></i><p>Cargando...</p></div>';
  adminFetch('/api/cotizador/reglas', { params: { id_proceso: idProceso, id_empresa: adminEmpresaId } }).then(function(reglas) {
    var html = '<div style="margin-bottom:12px;"><button class="btn btn-primary btn-sm" onclick="mostrarModalRegla(null)"><i class="fas fa-plus"></i> Nueva Regla</button></div>';
    if (!reglas || reglas.length === 0) {
      html += '<div class="card" style="text-align:center;padding:30px;">No hay reglas para este proceso.</div>';
    } else {
      html += '<div class="card" style="overflow-x:auto;"><table class="admin-table"><thead><tr><th>Nombre</th><th>Tipo Aplicacion</th><th>Valor</th><th>Prioridad</th><th>Acciones</th></tr></thead><tbody>';
      for (var i = 0; i < reglas.length; i++) {
        var r = reglas[i];
        var tipoLabel = { descuento: 'Descuento %', porcentaje: 'Incremento %', precio_fijo: 'Precio Fijo $' };
        html += '<tr><td>' + (r.nombre || '') + '</td><td>' + (tipoLabel[r.tipo_aplicacion] || r.tipo_aplicacion) + '</td><td>' + r.valor + '</td><td>' + r.prioridad + '</td><td><button class="btn btn-sm btn-secondary" onclick="mostrarModalRegla(\'' + r.id + '\')">Editar</button> <button class="btn btn-sm btn-danger" onclick="eliminarRegla(\'' + r.id + '\')">Eliminar</button></td></tr>';
      }
      html += '</tbody></table></div>';
    }
    cont.innerHTML = html;
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="color:var(--danger);">Error: ' + (err.message || err) + '</div>';
  });
}

function mostrarModalRegla(id) {
  var sel = document.getElementById('sel-proceso-regla');
  if (!sel) return;
  var titulo = id ? 'Editar Regla' : 'Nueva Regla';
  var nombre = '', tipo_aplicacion = 'porcentaje', valor = '', prioridad = 1;
  var html = '<div class="modal-overlay" onclick="if(event.target===this)cerrarModal()"><div class="modal"><div class="modal-header"><h3>' + titulo + '</h3><button class="modal-close" onclick="cerrarModal()">&times;</button></div><div class="modal-body"><div class="form-group"><label>Nombre</label><input id="rf-nombre" class="form-control" value="' + nombre + '"></div><div class="form-group"><label>Condicion (JSON, ej: {"variable":"personas","operador":"mayor","valor":10})</label><input id="rf-condicion" class="form-control" placeholder=\'{"variable":"","operador":"","valor":""}\'></div><div class="form-group"><label>Tipo de Aplicacion</label><select id="rf-tipo" class="form-control"><option value="porcentaje">Incremento Porcentual (%)</option><option value="descuento">Descuento Porcentual (%)</option><option value="precio_fijo">Precio Fijo ($)</option></select></div><div class="form-group"><label>Valor</label><input id="rf-valor" type="number" class="form-control" value="' + valor + '" step="0.01"></div><div class="form-group"><label>Prioridad (mayor numero = mayor prioridad)</label><input id="rf-prioridad" type="number" class="form-control" value="' + prioridad + '"></div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn btn-primary" onclick="guardarRegla(\'' + (id || '') + '\')">' + (id ? 'Guardar Cambios' : 'Crear Regla') + '</button></div></div></div>';
  var d = document.createElement('div');
  d.innerHTML = html;
  document.body.appendChild(d.firstElementChild);
}

function guardarRegla(id) {
  var sel = document.getElementById('sel-proceso-regla');
  if (!sel) return;
  var nombre = document.getElementById('rf-nombre').value.trim();
  if (!nombre) { alert('El nombre es obligatorio'); return; }
  var condStr = document.getElementById('rf-condicion').value.trim();
  var condicion = {};
  try { if (condStr) condicion = JSON.parse(condStr); } catch(e) { condicion = {}; }
  var data = { id_empresa: adminEmpresaId, id_proceso: sel.value, nombre: nombre, condicion: condicion, tipo_aplicacion: document.getElementById('rf-tipo').value, valor: Number(document.getElementById('rf-valor').value) || 0, prioridad: Number(document.getElementById('rf-prioridad').value) || 1 };
  var url = '/api/cotizador/admin/reglas' + (id ? '/' + id : '');
  adminFetch(url, { method: id ? 'PUT' : 'POST', body: data }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cerrarModal();
    cargarReglasProceso();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

function eliminarRegla(id) {
  if (!confirm('Eliminar regla ' + id + '?')) return;
  adminFetch('/api/cotizador/admin/reglas/' + id, { method: 'DELETE', body: { id_empresa: adminEmpresaId } }).then(function(r) {
    if (r.error) { alert('Error: ' + r.error); return; }
    cargarReglasProceso();
  }).catch(function(e) { alert('Error: ' + e.message); });
}

// ========== MODAL UTILS ==========

function cerrarModal() {
  var el = document.querySelector('.modal-overlay');
  if (el) el.remove();
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initAdmin, 100);
});
