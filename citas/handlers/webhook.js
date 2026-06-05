const { parseIncoming, sendMessage } = require('../services/whatsapp');
const { detectIntent } = require('../services/ai');
const {
  findOrCreateClient, getChatHistory, saveChatLog,
  scheduleAppointment, cancelAppointment, rescheduleAppointment,
  addToWaitlist, getEmpresaByPhone, processCancelAndNotifyWaitlist,
} = require('./actions');

async function handleIncoming(payload, whatsappConfig, geminiKey) {
  const msg = parseIncoming(payload);
  if (!msg) return { ok: false, reason: 'no_message' };

  const empresa = await getEmpresaByPhone(msg.displayPhone);
  if (!empresa) return { ok: false, reason: 'empresa_not_found', phone: msg.displayPhone };

  const nombreCliente = msg.text.split(' ').slice(0, 2).join(' ') || 'Cliente';
  const cliente = await findOrCreateClient(empresa.id_empresa, msg.from, nombreCliente);

  const historial = await getChatHistory(empresa.id_empresa, cliente.id_cliente);
  await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'user', msg.text);

  historial.push({ rol: 'cliente', texto: msg.text });
  const intent = await detectIntent(empresa, historial, geminiKey);
  const calendarId = empresa.id_calendario_google || null;

  switch (intent.intent) {
    case 'SCHEDULE': {
      const citaId = await scheduleAppointment(empresa.id_empresa, cliente, intent, calendarId, whatsappConfig);
      await sendMessage(msg.from, intent.mensaje, whatsappConfig.phoneId, whatsappConfig.token);
      await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'assistant', intent.mensaje);
      return { ok: true, intent: 'SCHEDULE', citaId };
    }
    case 'RESCHEDULE': {
      const citaId = await rescheduleAppointment(empresa.id_empresa, cliente, intent, calendarId);
      if (!citaId) {
        const noCitaMsg = 'No encontré una cita previa para reprogramar. ¿Quieres agendar una nueva?';
        await sendMessage(msg.from, noCitaMsg, whatsappConfig.phoneId, whatsappConfig.token);
        return { ok: true, intent: 'RESCHEDULE', error: 'no_prior_appointment' };
      }
      await sendMessage(msg.from, intent.mensaje, whatsappConfig.phoneId, whatsappConfig.token);
      await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'assistant', intent.mensaje);
      return { ok: true, intent: 'RESCHEDULE', citaId };
    }
    case 'CANCEL': {
      const cita = await cancelAppointment(empresa.id_empresa, cliente, calendarId);
      if (!cita) {
        const noCitaMsg = 'No encontré ninguna cita pendiente para cancelar.';
        await sendMessage(msg.from, noCitaMsg, whatsappConfig.phoneId, whatsappConfig.token);
        return { ok: true, intent: 'CANCEL', error: 'no_appointment' };
      }
      await sendMessage(msg.from, intent.mensaje, whatsappConfig.phoneId, whatsappConfig.token);
      await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'assistant', intent.mensaje);
      await processCancelAndNotifyWaitlist(empresa.id_empresa, calendarId, whatsappConfig);
      return { ok: true, intent: 'CANCEL', citaId: cita.id };
    }
    case 'WAITLIST': {
      await addToWaitlist(empresa.id_empresa, cliente, intent.servicio);
      await sendMessage(msg.from, intent.mensaje, whatsappConfig.phoneId, whatsappConfig.token);
      await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'assistant', intent.mensaje);
      return { ok: true, intent: 'WAITLIST' };
    }
    default: {
      await sendMessage(msg.from, intent.mensaje, whatsappConfig.phoneId, whatsappConfig.token);
      await saveChatLog(empresa.id_empresa, cliente.id_cliente, 'assistant', intent.mensaje);
      return { ok: true, intent: intent.intent, mensaje: intent.mensaje };
    }
  }
}

module.exports = { handleIncoming };
