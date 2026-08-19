const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3003;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3001';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(cors({
  origin: [ALLOWED_ORIGIN, 'http://localhost:3003', 'http://127.0.0.1:3003'],
  credentials: true
}));
app.use(express.json());

function validarGiro(data) {
  if (!data) return false;
  var giro = data.giro_especifico || '';
  if (!giro || typeof giro !== 'string') return false;
  var partes = giro.split(',');
  if (partes.length < 2) return false;
  return partes[partes.length - 1].trim() === '1';
}

function cotizadorAuth(req, res, next) {
  var coId = req.body?.id_empresa || req.query?.id_empresa;
  if (!coId) return res.status(400).json({ error: 'Falta id_empresa' });
  verificarEmpresa(coId).then(function(emp) {
    if (emp && validarGiro(emp)) return next();
    res.status(403).json({ error: 'El giro de la empresa no tiene habilitado el modulo de cotizaciones' });
  }).catch(function() {
    res.status(500).json({ error: 'Error validando giro' });
  });
}

async function fetchEmpresaDesdeGas(coId) {
  var gasUrl = process.env.GAS_URL;
  if (!gasUrl) return null;
  for (var intento = 0; intento < 2; intento++) {
    try {
      var gasRes = await fetch(gasUrl + '?action=getAll&id_empresa=' + encodeURIComponent(coId), { signal: AbortSignal.timeout(15000) });
      if (gasRes.status !== 200) continue;
      var gasData = await gasRes.json();
      var empresas = gasData.Config_Empresas || [];
      var emp = empresas.find(function(e){ return e && e.id_empresa === coId; });
      if (emp) return emp;
    } catch(e) {}
  }
  return null;
}

async function verificarEmpresa(coId) {
  var sbRes = await supabaseAdmin.from('Config_Empresas').select('giro_especifico').eq('id_empresa', coId).single();
  if (!sbRes.error && sbRes.data) return sbRes.data;
  return await fetchEmpresaDesdeGas(coId);
}

app.get('/api/empresa/listar', async function(req, res){
  try {
    var result = await supabaseAdmin.from('Config_Empresas').select('id_empresa,nomempresa,giro_especifico');
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/empresa/:id', async function(req, res){
  try {
    var id = req.params.id.toUpperCase();
    var result = await supabaseAdmin.from('Config_Empresas').select('id_empresa,nomempresa,giro_especifico').eq('id_empresa', id).single();
    if (!result.error) return res.json(result.data);
    var gasUrl = process.env.GAS_URL;
    if (gasUrl) {
      var gasRes = await fetch(gasUrl + '?action=getAll&id_empresa=' + encodeURIComponent(id));
      var gasData = await gasRes.json();
      var empresas = gasData.Config_Empresas || [];
      var emp = empresas.find(function(e){ return e && e.id_empresa === id; });
      if (emp) return res.json({ id_empresa: emp.id_empresa, nomempresa: emp.nomempresa, giro_especifico: emp.giro_especifico });
    }
    res.status(404).json({ error: 'Empresa no encontrada' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cotizador/procesos', async function(req, res){
  try {
    var coId = req.query.id_empresa;
    if (!coId) return res.status(400).json({ error: 'Falta id_empresa' });
    var result = await supabaseAdmin.from('Procesos_Cotizacion').select('*').eq('id_empresa', coId).eq('activo', true);
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cotizador/variables', async function(req, res){
  try {
    var idProceso = req.query.id_proceso;
    var coId = req.query.id_empresa;
    if (!idProceso || !coId) return res.status(400).json({ error: 'Faltan parametros' });
    var result = await supabaseAdmin.from('Variables_Cotizacion').select('*').eq('id_proceso', idProceso).eq('id_empresa', coId).eq('activo', true).order('orden', { ascending: true });
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cotizador/reglas', async function(req, res){
  try {
    var idProceso = req.query.id_proceso;
    var coId = req.query.id_empresa;
    if (!idProceso || !coId) return res.status(400).json({ error: 'Faltan parametros' });
    var result = await supabaseAdmin.from('Reglas_Precios').select('*').eq('id_proceso', idProceso).eq('id_empresa', coId).eq('activo', true).order('prioridad', { ascending: false });
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cotizador/calcular', cotizadorAuth, async function(req, res){
  try {
    var payload = req.body;
    if (!payload.id_proceso) return res.status(400).json({ error: 'Falta id_proceso' });
    var variables = payload.variables || {};
    var lineas = payload.lineas || [];
    var resultado;
    try {
      var rpc = await supabaseAdmin.rpc('calcular_cotizacion_completa', {
        p_id_empresa: payload.id_empresa,
        p_id_proceso: payload.id_proceso,
        p_variables: variables,
        p_lineas: lineas
      });
      if (rpc.error) throw rpc.error;
      resultado = rpc.data;
    } catch(rpcErr) {
      var procRes = await supabaseAdmin.from('Procesos_Cotizacion').select('config_calculadora').eq('id', payload.id_proceso).eq('id_empresa', payload.id_empresa).single();
      if (procRes.error) return res.status(404).json({ error: 'Proceso no encontrado' });
      var config = procRes.data.config_calculadora || {};
      var precioBase = Number(config.precio_base) || 0;
      var reglasRes = await supabaseAdmin.from('Reglas_Precios').select('*').eq('id_proceso', payload.id_proceso).eq('id_empresa', payload.id_empresa).eq('activo', true).order('prioridad', { ascending: false });
      var reglas = reglasRes.data || [];
      var reglasAplicadas = [];
      var subtotal = precioBase;
      var descuentos = 0;
      for (var i = 0; i < reglas.length; i++) {
        var r = reglas[i];
        if (r.tipo_aplicacion === 'descuento') descuentos += subtotal * (Number(r.valor) || 0) / 100;
        else if (r.tipo_aplicacion === 'porcentaje') subtotal *= (1 + (Number(r.valor) || 0) / 100);
        else if (r.tipo_aplicacion === 'precio_fijo') subtotal = Number(r.valor) || 0;
        reglasAplicadas.push({ id_regla: r.id, nombre: r.nombre, tipo: r.tipo_aplicacion, valor: r.valor });
      }
      var neto = subtotal - descuentos;
      var impuestos = Math.round(neto * 0.16 * 100) / 100;
      var total = Math.round((neto + impuestos) * 100) / 100;
      resultado = { subtotal: Math.round(subtotal * 100) / 100, impuestos: impuestos, descuentos: Math.round(descuentos * 100) / 100, total: total, reglas_aplicadas: reglasAplicadas };
    }
    res.json(resultado);
  } catch(e) {
    console.error('Error [COTIZADOR_CALCULAR]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cotizador/guardar', cotizadorAuth, async function(req, res){
  try {
    var d = req.body;
    if (!d.id_proceso) return res.status(400).json({ error: 'Falta id_proceso' });
    var folio;
    try {
      var folioRes = await supabaseAdmin.rpc('generar_folio_cotizacion', { p_id_empresa: d.id_empresa });
      folio = folioRes.data || ('COT-001');
    } catch(e) {
      var lastRes = await supabaseAdmin.from('Cotizaciones').select('folio').eq('id_empresa', d.id_empresa).like('folio', 'COT-%').order('creado_en', { ascending: false }).limit(1);
      var lastFolio = lastRes.data && lastRes.data[0]?.folio;
      var num = 1;
      if (lastFolio) {
        var parts = lastFolio.split('-');
        num = (parseInt(parts[parts.length-1]) || 0) + 1;
      }
      folio = 'COT-' + String(num).padStart(3, '0');
    }
    var insertData = {
      id: folio, id_empresa: d.id_empresa, id_cliente: d.id_cliente || null,
      id_lead: d.id_lead || null, id_proceso: d.id_proceso, folio: folio,
      moneda: d.moneda || 'MXN', subtotal: Number(d.subtotal) || 0,
      impuestos: Number(d.impuestos) || 0, descuentos: Number(d.descuentos) || 0,
      total: Number(d.total) || 0, estatus: d.estatus || 'borrador',
      vigencia_dias: d.vigencia_dias || 30, notas: d.notas || '',
      variables_aplicadas: d.variables_aplicadas || {},
      reglas_aplicadas: d.reglas_aplicadas || [], activo: true
    };
    var result = await supabaseAdmin.from('Cotizaciones').insert(insertData).select().single();
    if (result.error) throw result.error;
    if (d.lineas && Array.isArray(d.lineas)) {
      for (var i = 0; i < d.lineas.length; i++) {
        var linea = d.lineas[i];
        await supabaseAdmin.from('Cotizacion_Detalle').insert({
          id_cotizacion: folio, id_producto: linea.id_producto || null,
          concepto: linea.concepto || 'Concepto', cantidad: Number(linea.cantidad) || 1,
          precio_unitario: Number(linea.precio_unitario) || 0,
          descuento: Number(linea.descuento) || 0, subtotal: Number(linea.subtotal) || 0,
          variables: linea.variables || {}, orden: i + 1
        });
      }
    }
    res.json({ success: true, folio: folio, data: result.data });
  } catch(e) {
    console.error('Error [COTIZADOR_GUARDAR]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/cotizador/:id', async function(req, res){
  try {
    var id = req.params.id;
    var coId = req.query.id_empresa;
    if (!coId) return res.status(400).json({ error: 'Falta id_empresa' });
    var result = await supabaseAdmin.from('Cotizaciones').select('*, Cotizacion_Detalle(*)').eq('id', id).eq('id_empresa', coId).single();
    if (result.error) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(result.data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cotizador/convertir', cotizadorAuth, async function(req, res){
  try {
    var body = req.body;
    var idCot = body.id_cotizacion;
    var tipoDestino = body.tipo_destino || 'lead';
    var datosExtra = body.datos_extra || {};
    var cotRes = await supabaseAdmin.from('Cotizaciones').select('*').eq('id', idCot).eq('id_empresa', body.id_empresa).single();
    if (cotRes.error) return res.status(404).json({ error: 'Cotización no encontrada' });
    var cot = cotRes.data;
    var resultado = {};
    if (tipoDestino === 'lead') {
      var lastLead = await supabaseAdmin.from('Leads').select('id').eq('id_empresa', body.id_empresa).like('id', 'LEAD-%').order('creado_en', { ascending: false }).limit(1);
      var leadNum = 1;
      if (lastLead.data && lastLead.data[0]) {
        var lp = lastLead.data[0].id.split('-');
        leadNum = (parseInt(lp[lp.length-1]) || 0) + 1;
      }
      var leadId = 'LEAD-' + String(leadNum).padStart(3, '0');
      var leadInsert = await supabaseAdmin.from('Leads').insert({
        id: leadId, id_empresa: body.id_empresa, nombre: datosExtra.nombre || 'Cotizacion ' + cot.folio,
        telefono: datosExtra.telefono || '', email: datosExtra.email || '', origen: 'COTIZADOR',
        referencia_cotizacion: idCot, estatus: 'NUEVO', activo: true
      }).select().single();
      resultado = { tipo: 'lead', id: leadId, data: leadInsert.data };
      await supabaseAdmin.from('Cotizaciones').update({ id_lead: leadId, estatus: 'convertida', convertido_en: new Date().toISOString() }).eq('id', idCot);
    } else if (tipoDestino === 'proyecto') {
      var lastOrd = await supabaseAdmin.from('Proyectos').select('id').eq('id_empresa', body.id_empresa).like('id', 'ORD-%').order('creado_en', { ascending: false }).limit(1);
      var ordNum = 1;
      if (lastOrd.data && lastOrd.data[0]) {
        var op = lastOrd.data[0].id.split('-');
        ordNum = (parseInt(op[op.length-1]) || 0) + 1;
      }
      var ordId = 'ORD-' + String(ordNum).padStart(3, '0');
      var ordInsert = await supabaseAdmin.from('Proyectos').insert({
        id: ordId, id_empresa: body.id_empresa, nombre: datosExtra.nombre || 'Proyecto ' + cot.folio,
        total: cot.total, referencia_cotizacion: idCot, estatus: 'PENDIENTE', activo: true
      }).select().single();
      resultado = { tipo: 'proyecto', id: ordId, data: ordInsert.data };
      await supabaseAdmin.from('Cotizaciones').update({ id_proyecto: ordId, estatus: 'convertida', convertido_en: new Date().toISOString() }).eq('id', idCot);
    } else {
      return res.status(400).json({ error: 'Tipo de destino invalido: use lead o proyecto' });
    }
    res.json({ success: true, resultado: resultado });
  } catch(e) {
    console.error('Error [COTIZADOR_CONVERTIR]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// =====================================================================
// 📋 ADMIN COTIZADOR — CRUD para Procesos, Variables, Reglas
// =====================================================================

function generarIdProceso(coId) {
  return 'PROC-' + coId + '-' + String(Date.now()).slice(-4);
}

app.post('/api/cotizador/admin/procesos', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    if (!d.nombre) return res.status(400).json({ error: 'Falta nombre del proceso' });
    var id = d.id || generarIdProceso(d.id_empresa);
    var result = await supabaseAdmin.from('Procesos_Cotizacion').insert({
      id: id, id_empresa: d.id_empresa, nombre: d.nombre,
      descripcion: d.descripcion || '', tipo: d.tipo || 'producto',
      config_calculadora: { precio_base: Number(d.precio_base) || 0, variables: [] },
      activo: true
    }).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/cotizador/admin/procesos/:id', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    var update = {};
    if (d.nombre !== undefined) update.nombre = d.nombre;
    if (d.descripcion !== undefined) update.descripcion = d.descripcion;
    if (d.tipo !== undefined) update.tipo = d.tipo;
    if (d.precio_base !== undefined) update.config_calculadora = { precio_base: Number(d.precio_base), variables: [] };
    var result = await supabaseAdmin.from('Procesos_Cotizacion').update(update).eq('id', req.params.id).eq('id_empresa', d.id_empresa).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/cotizador/admin/procesos/:id', cotizadorAuth, async function(req, res) {
  try {
    var coId = req.body.id_empresa || req.query.id_empresa;
    var result = await supabaseAdmin.from('Procesos_Cotizacion').update({ activo: false }).eq('id', req.params.id).eq('id_empresa', coId);
    if (result.error) throw result.error;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cotizador/admin/variables', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    if (!d.id_proceso || !d.nombre) return res.status(400).json({ error: 'Faltan datos: id_proceso y nombre' });
    var varId = 'VAR-' + d.id_empresa + '-' + String(Date.now()).slice(-5);
    var lastOrd = await supabaseAdmin.from('Variables_Cotizacion').select('orden').eq('id_proceso', d.id_proceso).eq('id_empresa', d.id_empresa).order('orden', { ascending: false }).limit(1);
    var orden = 1;
    if (lastOrd.data && lastOrd.data[0]) orden = (lastOrd.data[0].orden || 0) + 1;
    var result = await supabaseAdmin.from('Variables_Cotizacion').insert({
      id: varId, id_proceso: d.id_proceso, id_empresa: d.id_empresa, nombre: d.nombre,
      etiqueta: d.etiqueta || d.nombre, tipo: d.tipo || 'texto',
      obligatorio: d.obligatorio === true || d.obligatorio === 'true', orden: orden,
      opciones: d.opciones || [], valor_default: d.valor_default || '', activo: true
    }).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/cotizador/admin/variables/:id', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    var update = {};
    if (d.nombre !== undefined) update.nombre = d.nombre;
    if (d.etiqueta !== undefined) update.etiqueta = d.etiqueta;
    if (d.tipo !== undefined) update.tipo = d.tipo;
    if (d.obligatorio !== undefined) update.obligatorio = d.obligatorio === true || d.obligatorio === 'true';
    if (d.opciones !== undefined) update.opciones = d.opciones;
    if (d.valor_default !== undefined) update.valor_default = d.valor_default;
    var result = await supabaseAdmin.from('Variables_Cotizacion').update(update).eq('id', req.params.id).eq('id_empresa', d.id_empresa).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/cotizador/admin/variables/:id', cotizadorAuth, async function(req, res) {
  try {
    var coId = req.body.id_empresa || req.query.id_empresa;
    var result = await supabaseAdmin.from('Variables_Cotizacion').update({ activo: false }).eq('id', req.params.id).eq('id_empresa', coId);
    if (result.error) throw result.error;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cotizador/admin/reglas', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    if (!d.id_proceso || !d.nombre) return res.status(400).json({ error: 'Faltan datos: id_proceso y nombre' });
    var lastPri = await supabaseAdmin.from('Reglas_Precios').select('prioridad').eq('id_proceso', d.id_proceso).eq('id_empresa', d.id_empresa).order('prioridad', { ascending: false }).limit(1);
    var pri = 1;
    if (lastPri.data && lastPri.data[0]) pri = (lastPri.data[0].prioridad || 0) + 1;
    var reglaId = 'REG-' + d.id_empresa + '-' + String(Date.now()).slice(-5);
    var result = await supabaseAdmin.from('Reglas_Precios').insert({
      id: reglaId, id_proceso: d.id_proceso, id_empresa: d.id_empresa, nombre: d.nombre,
      condicion: d.condicion || {},
      tipo_aplicacion: d.tipo_aplicacion || 'porcentaje',
      valor: Number(d.valor) || 0, prioridad: d.prioridad || pri, activo: true
    }).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/cotizador/admin/reglas/:id', cotizadorAuth, async function(req, res) {
  try {
    var d = req.body;
    var update = {};
    if (d.nombre !== undefined) update.nombre = d.nombre;
    if (d.condicion !== undefined) update.condicion = d.condicion;
    if (d.tipo_aplicacion !== undefined) update.tipo_aplicacion = d.tipo_aplicacion;
    if (d.valor !== undefined) update.valor = Number(d.valor);
    if (d.prioridad !== undefined) update.prioridad = d.prioridad;
    var result = await supabaseAdmin.from('Reglas_Precios').update(update).eq('id', req.params.id).eq('id_empresa', d.id_empresa).select().single();
    if (result.error) throw result.error;
    res.json({ success: true, data: result.data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/cotizador/admin/reglas/:id', cotizadorAuth, async function(req, res) {
  try {
    var coId = req.body.id_empresa || req.query.id_empresa;
    var result = await supabaseAdmin.from('Reglas_Precios').update({ activo: false }).eq('id', req.params.id).eq('id_empresa', coId);
    if (result.error) throw result.error;
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Endpoint no encontrado' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('\nSuitCotizador Standalone v1.0.0');
  console.log('Puerto: ' + PORT);
  console.log('URL: http://localhost:' + PORT);
  console.log('Modo: ' + (process.env.SUPABASE_URL ? 'Produccion' : 'Configurar .env primero'));
});
