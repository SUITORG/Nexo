var API = '';
var empresaId = null;
var empresaData = null;
var resultadoActual = null;

function getParams() {
  var p = {};
  var q = window.location.search.substring(1).split('&');
  for (var i = 0; i < q.length; i++) {
    var par = q[i].split('=');
    if (par[0]) p[decodeURIComponent(par[0])] = decodeURIComponent(par[1] || '');
  }
  return p;
}

function apiFetch(path, opts) {
  opts = opts || {};
  var url = API + path;
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

function tieneGiroHabilitado(emp) {
  if (!emp) return false;
  var giro = emp.giro_especifico || '';
  if (!giro || typeof giro !== 'string') return false;
  var partes = giro.split(',');
  if (partes.length < 2) return false;
  return partes[partes.length - 1].trim() === '1';
}

// ====== CARGA INICIAL ======

function init() {
  var params = getParams();
  if (params.admin === '1') return;
  empresaId = params.empresa || null;

  var sel = document.getElementById('select-empresa');
  var cont = document.getElementById('view-cotizador');

  if (empresaId) {
    document.getElementById('empresa-selector').classList.add('hidden');
    cargarEmpresa(empresaId);
  } else {
    document.getElementById('empresa-selector').classList.remove('hidden');
    cont.innerHTML = '<div class="loading"><i class="fas fa-calculator fa-pulse"></i><p>Cargando empresas...</p></div>';
    fetch('/api/empresa/listar').then(function(r) { return r.json(); }).then(function(empresas) {
      if (!empresas || empresas.length === 0) {
        cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;"><i class="fas fa-building" style="font-size:48px;color:#94a3b8;margin-bottom:16px;"></i><p>No hay empresas disponibles.</p></div>';
        return;
      }
      sel.innerHTML = '<option value="">Seleccionar empresa...</option>';
      for (var i = 0; i < empresas.length; i++) {
        var e = empresas[i];
        sel.innerHTML += '<option value="' + e.id_empresa + '">' + (e.nomempresa || e.id_empresa) + '</option>';
      }
      cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;"><i class="fas fa-hand-pointer" style="font-size:48px;color:var(--primary-color);margin-bottom:16px;"></i><h3>Selecciona una empresa</h3><p>Elige una empresa del selector superior para comenzar.</p></div>';
    }).catch(function(err) {
      cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i><p>Error al cargar empresas: ' + err.message + '</p></div>';
    });
  }
}

function cargarApp() {
  var sel = document.getElementById('select-empresa');
  var id = sel.value;
  if (!id) return;
  window.history.replaceState(null, '', '?empresa=' + encodeURIComponent(id));
  empresaId = id;
  cargarEmpresa(id);
}

// ====== CARGA EMPRESA ======

function cargarEmpresa(id) {
  var cont = document.getElementById('view-cotizador');
  cont.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-pulse" style="font-size:2rem;"></i><p>Cargando empresa...</p></div>';
  apiFetch('/api/empresa/' + encodeURIComponent(id)).then(function(emp) {
    if (emp.error) {
      cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i><p>Error: ' + emp.error + '</p></div>';
      return;
    }
    if (!tieneGiroHabilitado(emp)) {
      cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;"><i class="fas fa-lock" style="font-size:48px;color:var(--danger);margin-bottom:20px;"></i><h3>Modulo de Cotizaciones No Habilitado</h3><p>El giro de tu empresa no tiene acceso al portal de cotizaciones.</p></div>';
      return;
    }
    renderizarPortal(emp);
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i><p>Error: ' + err.message + '</p></div>';
  });
}

// ====== RENDER PORTAL ======

function renderizarPortal(emp) {
  empresaData = emp;
  var cont = document.getElementById('view-cotizador');
  cont.innerHTML = '<div class="section-header"><h3><i class="fas fa-calculator"></i> Portal de Cotizacion - ' + (emp.nomempresa || empresaId) + '</h3><div class="header-actions"><button class="btn btn-secondary btn-sm" onclick="cargarApp()"><i class="fas fa-building"></i> Cambiar Empresa</button></div></div><div class="card" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse" style="font-size:2rem;"></i><p>Cargando procesos...</p></div>';

  apiFetch('/api/cotizador/procesos', { params: { id_empresa: empresaId } }).then(function(procesos) {
    if (!procesos || procesos.length === 0) {
      cont.innerHTML = '<div class="section-header"><h3><i class="fas fa-calculator"></i> Portal de Cotizacion</h3></div><div class="card" style="text-align:center;padding:40px;"><i class="fas fa-box-open" style="font-size:48px;color:#94a3a8;margin-bottom:16px;"></i><h4>No hay procesos disponibles</h4><p>El administrador debe configurar procesos de cotizacion primero.</p></div>';
      return;
    }
    var html = '<div class="section-header"><h3><i class="fas fa-calculator"></i> Portal de Cotizacion</h3></div><div class="card"><div id="cotizador-procesos">';
    for (var i = 0; i < procesos.length; i++) {
      var p = procesos[i];
      html += '<div class="proceso-item" data-id="' + p.id + '" onclick="iniciarCotizacion(\'' + p.id + '\')">';
      html += '<h4>' + (p.nombre || p.id) + '</h4>';
      if (p.descripcion) html += '<p style="color:var(--text-muted);font-size:0.9em;">' + p.descripcion + '</p>';
      html += '<span class="badge" style="background:' + (p.tipo === 'producto' ? '#22c55e' : p.tipo === 'servicio' ? '#f59e0b' : '#3b82f6') + ';">' + p.tipo + '</span>';
      html += '</div>';
    }
    html += '</div></div>';
    cont.innerHTML = html;
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i><p>Error al cargar procesos: ' + (err.message || err) + '</p></div>';
  });
}

// ====== INICIAR COTIZACION ======

function iniciarCotizacion(idProceso) {
  var cont = document.getElementById('view-cotizador');
  cont.innerHTML = '<div class="section-header"><h3><i class="fas fa-calculator"></i> Nueva Cotizacion</h3><div class="header-actions"><button class="btn btn-secondary btn-sm" onclick="cargarEmpresa(empresaId)"><i class="fas fa-arrow-left"></i> Volver</button></div></div><div class="card" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse" style="font-size:2rem;"></i><p>Cargando formulario...</p></div>';

  var promVars = apiFetch('/api/cotizador/variables', { params: { id_proceso: idProceso, id_empresa: empresaId } });
  var promReglas = apiFetch('/api/cotizador/reglas', { params: { id_proceso: idProceso, id_empresa: empresaId } });

  Promise.all([promVars, promReglas]).then(function(resultados) {
    var variables = resultados[0] || [];
    var reglas = resultados[1] || [];
    var html = '<div class="card"><h4>Variables de Cotizacion</h4><div id="cotizador-form" style="margin-top:16px;">';
    for (var i = 0; i < variables.length; i++) {
      var v = variables[i];
      html += '<div class="form-group">';
      html += '<label>' + (v.etiqueta || v.nombre) + (v.obligatorio ? ' <span style="color:var(--danger);">*</span>' : '') + '</label>';
      if (v.tipo === 'select') {
        html += '<select id="var-' + v.nombre + '" class="form-control"' + (v.obligatorio ? ' required' : '') + '>';
        var opts = v.opciones || [];
        for (var j = 0; j < opts.length; j++) {
          html += '<option value="' + opts[j].value + '"' + (v.valor_default === opts[j].value ? ' selected' : '') + '>' + opts[j].label + '</option>';
        }
        html += '</select>';
      } else if (v.tipo === 'booleano') {
        html += '<label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="var-' + v.nombre + '" value="true"' + (v.valor_default === 'true' ? ' checked' : '') + '> ' + (v.etiqueta || v.nombre) + '</label>';
      } else if (v.tipo === 'numero') {
        html += '<input type="number" id="var-' + v.nombre + '" class="form-control" value="' + (v.valor_default || '') + '"' + (v.obligatorio ? ' required' : '') + '>';
      } else {
        html += '<input type="text" id="var-' + v.nombre + '" class="form-control" value="' + (v.valor_default || '') + '"' + (v.obligatorio ? ' required' : '') + '>';
      }
      html += '</div>';
    }
    html += '<button class="btn btn-primary" onclick="calcularYMostrar(\'' + idProceso + '\')"><i class="fas fa-calculator"></i> Calcular Cotizacion</button>';
    html += '</div></div><div id="cotizador-resultado" style="margin-top:20px;"></div>';
    cont.innerHTML = cont.innerHTML.replace('<div class="card" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-pulse" style="font-size:2rem;"></i><p>Cargando formulario...</p></div>', html);
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:16px;"></i><p>Error al cargar: ' + (err.message || err) + '</p></div>';
  });
}

function calcularYMostrar(idProceso) {
  var cont = document.getElementById('cotizador-resultado');
  if (!cont) return;
  cont.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-pulse"></i> Calculando...</div>';

  var variables = {};
  var inputs = document.querySelectorAll('#cotizador-form [id^="var-"]');
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    var nombre = inp.id.replace('var-', '');
    if (inp.type === 'checkbox') variables[nombre] = inp.checked ? 'true' : 'false';
    else variables[nombre] = inp.value;
  }

  apiFetch('/api/cotizador/calcular', {
    method: 'POST',
    body: { id_empresa: empresaId, id_proceso: idProceso, variables: variables, lineas: [] }
  }).then(function(res) {
    if (res.error) {
      cont.innerHTML = '<div class="card" style="border:1px solid var(--danger);color:var(--danger);"><i class="fas fa-exclamation-circle"></i> ' + res.error + '</div>';
      return;
    }
    resultadoActual = { idProceso: idProceso, variables: variables, res: res };
    var d = res;
    var html = '<div class="card" style="border:1px solid var(--success);"><h4 style="color:var(--success);"><i class="fas fa-check-circle"></i> Cotizacion Calculada</h4>';
    html += '<table style="width:100%;margin-top:12px;">';
    html += '<tr><td style="padding:8px;border-bottom:1px solid var(--border);">Subtotal</td><td style="padding:8px;border-bottom:1px solid var(--border);text-align:right;"><strong>$' + (d.subtotal || 0).toLocaleString('es-MX', {minimumFractionDigits:2}) + '</strong></td></tr>';
    if (d.descuentos > 0) html += '<tr><td style="padding:8px;border-bottom:1px solid var(--border);color:var(--danger);">Descuentos</td><td style="padding:8px;border-bottom:1px solid var(--border);text-align:right;color:var(--danger);">-$' + d.descuentos.toLocaleString('es-MX', {minimumFractionDigits:2}) + '</td></tr>';
    if (d.impuestos > 0) html += '<tr><td style="padding:8px;border-bottom:1px solid var(--border);">IVA (16%)</td><td style="padding:8px;border-bottom:1px solid var(--border);text-align:right;">$' + d.impuestos.toLocaleString('es-MX', {minimumFractionDigits:2}) + '</td></tr>';
    html += '<tr><td style="padding:8px;font-size:1.2em;"><strong>TOTAL</strong></td><td style="padding:8px;text-align:right;font-size:1.2em;"><strong class="resultado-total">$' + (d.total || 0).toLocaleString('es-MX', {minimumFractionDigits:2}) + '</strong></td></tr></table>';
    html += '<div style="margin-top:16px;"><button class="btn btn-primary" onclick="guardarYMostrar()"><i class="fas fa-save"></i> Guardar Cotizacion</button></div></div>';
    cont.innerHTML = html;
  }).catch(function(err) {
    cont.innerHTML = '<div class="card" style="border:1px solid var(--danger);color:var(--danger);"><i class="fas fa-exclamation-circle"></i> ' + (err.message || err) + '</div>';
  });
}

function guardarYMostrar() {
  if (!resultadoActual) return;
  var variables = resultadoActual.variables || {};
  var d = resultadoActual.res || {};
  var datos = {
    id_empresa: empresaId, id_proceso: resultadoActual.idProceso, id_cliente: null,
    moneda: 'MXN', subtotal: d.subtotal || 0, impuestos: d.impuestos || 0,
    descuentos: d.descuentos || 0, total: d.total || 0, estatus: 'borrador',
    vigencia_dias: 30, variables_aplicadas: variables,
    reglas_aplicadas: [], notas: ''
  };
  apiFetch('/api/cotizador/guardar', { method: 'POST', body: datos }).then(function(res) {
    if (res.error) { alert('Error: ' + res.error); return; }
    var cont = document.getElementById('cotizador-resultado');
    if (cont) cont.innerHTML = '<div class="card" style="border:1px solid var(--success);text-align:center;"><i class="fas fa-check-circle" style="font-size:48px;color:var(--success);margin-bottom:12px;"></i><h4>Cotizacion Guardada</h4><p>Folio: <strong>' + (res.folio || '') + '</strong></p><div style="margin-top:12px;"><button class="btn btn-secondary" onclick="cargarEmpresa(empresaId)"><i class="fas fa-list"></i> Nueva Cotizacion</button></div></div>';
  }).catch(function(err) {
    alert('Error al guardar: ' + (err.message || err));
  });
}

// Init on load
init();
