const supabase = require('../db/client');
const calendar = require('../services/calendar');
const { sendMessage } = require('../services/whatsapp');
const { notify } = require('../services/notifier');

function nextId(prefix, lastNum) {
  const n = (lastNum || 0) + 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

async function getLastId(prefix, table) {
  const pattern = `${prefix}-%`;
  const { data } = await supabase
    .from(table)
    .select('id')
    .ilike('id', pattern)
    .order('id', { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return null;
  const num = parseInt(data[0].id.replace(`${prefix}-`, ''), 10);
  return num || null;
}

async function findOrCreateClient(idEmpresa, telefono, nombre) {
  const { data: existing } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_empresa', idEmpresa)
    .eq('telefono', telefono)
    .limit(1);
  if (existing && existing.length > 0) return existing[0];
  const last = await getLastId('CLI', 'clientes');
  const id = nextId('CLI', last);
  const cliente = { id_cliente: id, id_empresa: idEmpresa, nombre: nombre || 'Cliente', telefono };
  await supabase.from('clientes').insert(cliente);
  return cliente;
}

async function getChatHistory(idEmpresa, idCliente) {
  const { data } = await supabase
    .from('Logs_Chat_IA')
    .select('*')
    .eq('id_empresa', idEmpresa)
    .eq('id_cliente', idCliente)
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

async function saveChatLog(idEmpresa, idCliente, rol, texto) {
  await supabase.from('Logs_Chat_IA').insert({
    id_empresa: idEmpresa,
    id_cliente: idCliente,
    rol,
    texto,
    created_at: new Date().toISOString(),
  });
}

async function scheduleAppointment(idEmpresa, cliente, intentResult, calendarId, whatsappConfig) {
  const last = await getLastId('CIT', 'Reservaciones');
  const id = nextId('CIT', last);
  const fecha = intentResult.fechaSugerida || new Date().toISOString().split('T')[0];
  const hora = intentResult.horaSugerida || '10:00';
  const start = new Date(`${fecha}T${hora}:00-06:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = `${intentResult.servicio || 'Cita'} - ${cliente.nombre}`;

  let googleEventId = null;
  if (calendarId) {
    try {
      const event = await calendar.createEvent(calendarId, {
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        description: intentResult.servicio || '',
        cliente,
      });
      googleEventId = event.id;
    } catch (e) {
      console.error('[CALENDAR_ERROR]', e.message);
    }
  }

  await supabase.from('Reservaciones').insert({
    id,
    id_empresa: idEmpresa,
    id_cliente: cliente.id_cliente,
    fecha_cita: start.toISOString(),
    duracion_min: 60,
    servicio: intentResult.servicio || 'General',
    status: 'CONFIRMADA',
    google_event_id: googleEventId,
    nombre_cliente: cliente.nombre,
    whatsapp: cliente.telefono,
  });

  await notify({
    evento: 'CITA_CREADA',
    id_empresa: idEmpresa,
    id_cliente: cliente.id_cliente,
    id_cita: id,
    fecha: start.toISOString(),
    estado: 'CONFIRMADA',
  });

  return id;
}

async function cancelAppointment(idEmpresa, cliente, calendarId) {
  const { data: citas } = await supabase
    .from('Reservaciones')
    .select('*')
    .eq('id_empresa', idEmpresa)
    .eq('id_cliente', cliente.id_cliente)
    .eq('status', 'CONFIRMADA')
    .limit(1);
  if (!citas || citas.length === 0) return null;
  const cita = citas[0];

  if (cita.google_event_id && calendarId) {
    try {
      await calendar.deleteEvent(calendarId, cita.google_event_id);
    } catch (e) {
      console.error('[CALENDAR_DELETE_ERROR]', e.message);
    }
  }

  await supabase.from('Reservaciones').update({ status: 'CANCELADA', updated_at: new Date().toISOString() })
    .eq('id', cita.id);

  await notify({
    evento: 'CITA_CANCELADA',
    id_empresa: idEmpresa,
    id_cliente: cliente.id_cliente,
    id_cita: cita.id,
    estado: 'CANCELADA',
  });

  return cita;
}

async function processCancelAndNotifyWaitlist(idEmpresa, calendarId, whatsappConfig) {
  const { data: waiting } = await supabase
    .from('lista_espera')
    .select('*, clientes(*)')
    .eq('id_empresa', idEmpresa)
    .eq('activo', true)
    .order('created_at', { ascending: true })
    .limit(1);
  if (!waiting || waiting.length === 0) return null;
  const entry = waiting[0];
  const msg = `¡Buenas noticias! Se ha liberado un turno. ¿Te gustaría confirmar tu cita? Responde "Sí" para agendarla.`;
  await sendMessage(entry.clientes.telefono, msg, whatsappConfig.phoneId, whatsappConfig.token);
  await supabase.from('lista_espera').update({ activo: false }).eq('id', entry.id);
  return entry;
}

async function rescheduleAppointment(idEmpresa, cliente, intentResult, calendarId) {
  const { data: citas } = await supabase
    .from('Reservaciones')
    .select('*')
    .eq('id_empresa', idEmpresa)
    .eq('id_cliente', cliente.id_cliente)
    .eq('status', 'CONFIRMADA')
    .limit(1);
  if (!citas || citas.length === 0) return null;
  const cita = citas[0];
  const fecha = intentResult.fechaSugerida || new Date().toISOString().split('T')[0];
  const hora = intentResult.horaSugerida || '10:00';
  const start = new Date(`${fecha}T${hora}:00-06:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  if (cita.google_event_id && calendarId) {
    try {
      await calendar.updateEvent(calendarId, cita.google_event_id, {
        title: `${cita.servicio} - ${cliente.nombre}`,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    } catch (e) {
      console.error('[CALENDAR_UPDATE_ERROR]', e.message);
    }
  }

  await supabase.from('Reservaciones').update({
    fecha_cita: start.toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', cita.id);

  await notify({
    evento: 'CITA_REPROGRAMADA',
    id_empresa: idEmpresa,
    id_cliente: cliente.id_cliente,
    id_cita: cita.id,
    fecha: start.toISOString(),
    estado: 'REPROGRAMADA',
  });

  return cita.id;
}

async function addToWaitlist(idEmpresa, cliente, servicio) {
  const last = await getLastId('WLI', 'lista_espera');
  const id = nextId('WLI', last);
  await supabase.from('lista_espera').insert({
    id_empresa: idEmpresa,
    id_cliente: cliente.id_cliente,
    servicio: servicio || 'General',
    activo: true,
  });
}

async function getEmpresaByPhone(telefono) {
  const { data } = await supabase
    .from('Config_Empresas')
    .select('*')
    .or(`telefonowhatsapp.eq.${telefono},whatsapp_negocio.eq.${telefono}`)
    .limit(1);
  return (data && data.length > 0) ? data[0] : null;
}

module.exports = {
  findOrCreateClient,
  getChatHistory,
  saveChatLog,
  scheduleAppointment,
  cancelAppointment,
  processCancelAndNotifyWaitlist,
  rescheduleAppointment,
  addToWaitlist,
  getEmpresaByPhone,
};
