const gas = require('../db/gas-client');
const ai = require('./ai');
const leads = require('./leads');
const memory = require('./memory');
const menu = require('./menu');

const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, {
      history: [],
      convId: null,
      agentId: null,
      agentName: '',
      agentPrompt: null,
      empresaNombre: 'ROOMMATENL',
      idEmpresa: null,
      leadData: {},
      msgCount: 0,
      aiModels: []
    });
  }
  return sessions.get(chatId);
}

async function loadAgentForEmpresa(session, idEmpresa) {
  const agent = await gas.getAgentByEmpresa(idEmpresa);
  if (agent) {
    session.agentId = agent.id_agente;
    session.agentName = agent.nombre || 'Asistente';
    session.agentPrompt = agent.prompt_base || agent.prompt || agent.prompts_ia || agent.system_prompt || null;
  } else {
    session.agentId = `AGT-${idEmpresa}`;
    session.agentName = `Asistente ${idEmpresa}`;
    session.agentPrompt = null;
  }

  const config = await gas.getEmpresaConfig(idEmpresa);
  if (config) {
    session.empresaNombre = config.nomempresa || config.nombre || idEmpresa;
    const raw = (config.usa_soporte_ia || '').toString();
    session.aiModels = raw.split(',').map(m => m.trim()).filter(m => m && !['TRUE','FALSE','NO',''].includes(m.toUpperCase()));
  } else {
    session.empresaNombre = idEmpresa;
  }
  session.idEmpresa = idEmpresa;
}

async function handleStart(bot, msg, idEmpresa) {
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  session.history = [];
  session.msgCount = 0;

  await loadAgentForEmpresa(session, idEmpresa);
  session.convId = `CHAT-TG-${chatId}-${Date.now().toString(36).toUpperCase()}`;

  const mem = await memory.loadMemory(chatId, idEmpresa, session.agentId);
  if (mem) {
    session.convId = mem.convId;
    session.history = mem.history;
    bot.sendMessage(chatId, `👋 ¡Bienvenido de nuevo! Recuerdo que hablamos sobre: "${mem.summary}"`);
  }

  menu.sendMainMenu(bot, chatId,
    `👋 ¡Hola! Soy ${session.agentName} de ${session.empresaNombre}.\n\n` +
    'Estoy aquí para ayudarte. Selecciona una opción del menú o escríbeme lo que necesites.'
  );
}

async function handleMessage(bot, msg, idEmpresa) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  if (!text) return;

  const session = getSession(chatId);
  session.msgCount++;

  const lowerText = text.toLowerCase();

  if (lowerText === '🔙 volver al menú') {
    menu.sendMainMenu(bot, chatId);
    return;
  }
  if (lowerText === '❓ ayuda') {
    bot.sendMessage(chatId,
      'Puedes preguntarme sobre:\n' +
      '• 🏠 Servicios disponibles\n' +
      '• 💰 Precios y formas de pago\n' +
      '• 📍 Ubicación\n' +
      '• 📞 Dejar tus datos para contacto\n\n' +
      'O simplemente escribe tu pregunta.'
    );
    return;
  }

  bot.sendChatAction(chatId, 'typing');

  session.history.push({ role: 'user', content: text });
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }

  const systemPrompt = session.agentPrompt || undefined;
  const aiRes = await ai.askAI(text, session.history, systemPrompt, session.aiModels);
  if (aiRes.error) {
    bot.sendMessage(chatId, `❌ Lo siento, tuve un problema: ${aiRes.error}`);
    return;
  }

  const answer = aiRes.answer || 'No entendí bien. ¿Puedes repetirlo?';
  session.history.push({ role: 'assistant', content: answer });

  bot.sendMessage(chatId, answer, { parse_mode: 'Markdown' });

  const leadData = leads.extractLeadData(text);
  if (leadData.nombre || leadData.telefono || leadData.email) {
    session.leadData = { ...session.leadData, ...leadData };
    try {
      const result = await leads.ensureLead(chatId, idEmpresa, session.leadData);
      if (result.isNew) {
        bot.sendMessage(chatId, '✅ ¡Gracias! He guardado tus datos. Un asesor se comunicará contigo pronto.');
      }
    } catch (e) {
      console.error('[LEADS] Error saving:', e.message);
    }
  }

  try {
    await memory.logInteraction(chatId, idEmpresa, session.convId, session.agentId, 'user', text);
    await memory.logInteraction(chatId, idEmpresa, session.convId, session.agentId, 'model', answer);
  } catch (e) {
    console.error('[MEMORY] Log error:', e.message);
  }

  if (session.msgCount % 3 === 0) {
    try {
      const summaryText = session.history.slice(-4).map(h => h.content).join(' | ');
      await memory.saveMemorySnapshot(
        chatId, idEmpresa, session.agentId, session.convId,
        session.history, `Resumen parcial: ${summaryText.substring(0, 400)}`,
        session.leadData
      );
    } catch (e) {
      console.error('[MEMORY] Save error:', e.message);
    }
  }
}

async function handleContact(bot, msg, idEmpresa) {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  if (!contact) return;

  const session = getSession(chatId);
  const leadData = {
    nombre: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    telefono: contact.phone_number.replace(/[^0-9]/g, '').slice(-10)
  };
  session.leadData = { ...session.leadData, ...leadData };

  try {
    await leads.ensureLead(chatId, idEmpresa, session.leadData);
    bot.sendMessage(chatId,
      `✅ ¡Gracias ${contact.first_name || ''}! He registrado tu número. Un asesor te contactará pronto.`,
      menu.MAIN_MENU
    );
  } catch (e) {
    bot.sendMessage(chatId, '❌ Tuve un problema guardando tus datos. Intenta de nuevo.');
  }
}

function setup(bot, defaultEmpresa) {
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const param = (match && match[1] && match[1].trim()) || '';
    const idEmpresa = param || defaultEmpresa;
    await handleStart(bot, msg, idEmpresa);
  });

  bot.onText(/\/ayuda/, async (msg) => {
    bot.sendMessage(msg.chat.id,
      'Comandos disponibles:\n' +
      '/start - Iniciar conversación\n' +
      '/start <EMPRESA> - Iniciar con otra empresa\n' +
      '/ayuda - Mostrar esta ayuda\n' +
      '/datos - Ver mis datos registrados\n' +
      '/contacto - Solicitar contacto'
    );
  });

  bot.onText(/\/datos/, async (msg) => {
    const chatId = msg.chat.id;
    const session = getSession(chatId);
    const ld = session.leadData;
    if (ld.nombre || ld.telefono || ld.email) {
      bot.sendMessage(chatId,
        `📋 Tus datos registrados:\n` +
        `Nombre: ${ld.nombre || '—'}\n` +
        `Teléfono: ${ld.telefono || '—'}\n` +
        `Email: ${ld.email || '—'}`
      );
    } else {
      bot.sendMessage(chatId, 'Aún no tengo datos tuyos. Comparte tu nombre y teléfono para registrarte.');
    }
  });

  bot.onText(/\/contacto/, async (msg) => {
    menu.sendContactPrompt(bot, msg.chat.id);
  });

  bot.on('contact', async (msg) => {
    const session = getSession(msg.chat.id);
    const idEmpresa = session.idEmpresa || defaultEmpresa;
    await handleContact(bot, msg, idEmpresa);
  });

  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      const session = getSession(msg.chat.id);
      const idEmpresa = session.idEmpresa || defaultEmpresa;
      await handleMessage(bot, msg, idEmpresa);
    }
  });

  bot.on('callback_query', async (query) => {
    bot.answerCallbackQuery(query.id);
  });
}

module.exports = { setup, getSession, sessions };
