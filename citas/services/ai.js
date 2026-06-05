const https = require('https');

const GEMINI_URL = 'generativelanguage.googleapis.com';
const MODEL = 'v1/models/gemini-1.5-flash:generateContent';

function buildPrompt(empresa, historial) {
  const hour = new Date().getHours();
  const saludo = hour < 12 ? 'buenos días' : hour < 18 ? 'buenas tardes' : 'buenas noches';
  return `Eres un asistente de atención al cliente y agendamiento de citas para "${empresa.nomempresa}".

DATOS DEL NEGOCIO:
- Nombre: ${empresa.nomempresa}
- Giro: ${empresa.giro_especifico || 'No especificado'}
- Descripción: ${empresa.descripcion || 'No disponible'}

HISTORIAL DEL CHAT CON ESTE CLIENTE (los más recientes primero):
${(historial || []).slice(-6).map(m => `- ${m.rol}: ${m.texto}`).join('\n')}

REGLAS:
1. Responde siempre en español, tono amable y profesional.
2. Usa el saludo "${saludo}" si es el primer mensaje del día.
3. Detecta la intención del cliente según el último mensaje.

Debes responder ÚNICAMENTE con un JSON válido en este formato exacto (sin markdown, sin texto adicional):
{
  "intent": "SCHEDULE" | "RESCHEDULE" | "CANCEL" | "WAITLIST" | "QUERY" | "UNKNOWN",
  "fecha_sugerida": "YYYY-MM-DD" o null,
  "hora_sugerida": "HH:MM" o null,
  "servicio": "nombre del servicio" o null,
  "mensaje": "tu respuesta amable al cliente",
  "confianza": 0.0-1.0
}

Intents:
- SCHEDULE: el cliente quiere agendar una cita
- RESCHEDULE: el cliente quiere cambiar una cita existente
- CANCEL: el cliente quiere cancelar
- WAITLIST: el cliente quiere estar en lista de espera
- QUERY: el cliente pregunta información general
- UNKNOWN: no puedes determinar la intención

Mensaje del cliente: "${historial?.[historial.length - 1]?.texto || ''}"`;
}

async function detectIntent(empresa, historial, apiKey) {
  const prompt = buildPrompt(empresa, historial);
  const data = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
  });

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: GEMINI_URL,
      path: `/${MODEL}?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const raw = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const cleaned = raw.replace(/```json\s*|```/g, '').trim();
          const intent = JSON.parse(cleaned);
          resolve({
            intent: ['SCHEDULE', 'RESCHEDULE', 'CANCEL', 'WAITLIST', 'QUERY', 'UNKNOWN'].includes(intent.intent) ? intent.intent : 'UNKNOWN',
            fechaSugerida: intent.fecha_sugerida || null,
            horaSugerida: intent.hora_sugerida || null,
            servicio: intent.servicio || null,
            mensaje: intent.mensaje || 'No te entendí, ¿podrías repetirlo?',
            confianza: intent.confianza || 0,
          });
        } catch (e) {
          resolve({ intent: 'UNKNOWN', mensaje: 'Disculpa, no pude procesar tu mensaje. ¿Podrías repetirlo?', confianza: 0 });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { detectIntent };
