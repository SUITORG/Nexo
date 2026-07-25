const gas = require('../db/gas-client');

function getVisitorId(chatId) {
  return `TG-${chatId}`;
}

async function loadMemory(chatId, idEmpresa, agentId) {
  const vid = getVisitorId(chatId);
  const res = await gas.getMemory(vid, idEmpresa);
  if (res && res.success && res.memory) {
    const history = (res.history || []).map(h => ({
      role: h.role === 'model' ? 'assistant' : h.role,
      content: h.content
    }));
    return {
      convId: res.memory.id_conversacion,
      history,
      summary: res.memory.resumen_semantico || '',
      contextData: res.memory.contexto_datos || null
    };
  }
  return null;
}

async function saveMemorySnapshot(chatId, idEmpresa, agentId, convId, history, summary, contextData = {}) {
  const vid = getVisitorId(chatId);
  const recentHistory = history.slice(-6).map(h => h.content).join(' | ');
  const resumen = summary || `Resumen parcial: ${recentHistory.substring(0, 400)}`;

  await gas.saveMemory({
    id_conversacion: convId,
    id_visitante: vid,
    id_empresa: idEmpresa,
    resumen: resumen,
    contexto: typeof contextData === 'object' ? JSON.stringify(contextData) : contextData,
    agente_id: agentId,
    estado: 'ACTIVA'
  });
}

async function logInteraction(chatId, idEmpresa, convId, agentId, role, content) {
  const vid = getVisitorId(chatId);
  await gas.saveConversationLog({
    id_conversacion: convId,
    id_visitante: vid,
    id_empresa: idEmpresa,
    agente_id: agentId,
    role: role,
    content: content
  });
}

module.exports = { loadMemory, saveMemorySnapshot, logInteraction, getVisitorId };
