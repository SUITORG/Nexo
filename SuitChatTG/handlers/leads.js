const gas = require('../db/gas-client');

function extractLeadData(text) {
  const datos = {};

  const jsonMatch = text.match(/\[LEAD\]([\s\S]*?)\[\/LEAD\]/);
  if (jsonMatch) {
    try {
      const aiData = JSON.parse(jsonMatch[1].trim());
      if (aiData.nombre || aiData.telefono || aiData.email) {
        Object.assign(datos, aiData);
      }
    } catch {}
  }

  const nameMatch = text.match(/(?:soy|llamo|me llamo|nombre es|nombre completo es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/i);
  if (nameMatch) {
    datos.nombre = nameMatch[1].trim();
  }

  const phoneMatch = text.match(/(\d{10})/);
  if (phoneMatch) {
    datos.telefono = phoneMatch[1];
  }

  const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailMatch) {
    datos.email = emailMatch[1].toLowerCase();
  }

  return datos;
}

async function ensureLead(chatId, idEmpresa, datosExtra = {}) {
  const vid = `TG-${chatId}`;
  const res = await gas.getLeadByVisitor(vid, idEmpresa);
  let lead = null;
  let isNew = true;

  if (res && res.success && res.lead) {
    lead = res.lead;
    isNew = false;
  }

  const leadData = {
    id_empresa: idEmpresa,
    id_visitante: vid,
    fecha: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
    activo: true,
    ...lead,
    ...datosExtra
  };

  if (isNew) {
    const created = await gas.createLead(leadData);
    return { lead: leadData, isNew: true, result: created };
  } else {
    const updated = await gas.updateLead(leadData);
    return { lead: leadData, isNew: false, result: updated };
  }
}

module.exports = { extractLeadData, ensureLead };
