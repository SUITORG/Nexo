const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

// --- ROTACIÓN MULTI-PROVEEDOR (v1.0.0) ---
// Proveedores OpenAI-compatible: mismo shape de request/response, solo cambia baseURL + key.
const OPENAI_COMPAT_PROVIDERS = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', key: () => process.env.GROQ_API_KEY },
  cerebras: { baseUrl: 'https://api.cerebras.ai/v1', key: () => process.env.CEREBRAS_API_KEY },
  nvidia: { baseUrl: 'https://integrate.api.nvidia.com/v1', key: () => process.env.NVIDIA_NIM_API_KEY },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', key: () => process.env.MISTRAL_API_KEY },
  ollama: { baseUrl: 'http://localhost:11434/v1', key: () => 'ollama' }
};

const SYSTEM_PROMPT_DEFAULT = `Eres un asistente amable y profesional de renta de cuartos. Tu objetivo es:
1. Responder preguntas sobre habitaciones disponibles, precios, ubicación y servicios.
2. Recopilar amablemente los datos del cliente: nombre, teléfono y email.
3. Preguntar sobre el motivo de su interés y cuándo planea mudarse.
4. Al final, si tienes nombre + teléfono, indica que un asesor se comunicará.

IMPORTANTE: NO inventes precios ni disponibilidad que no estén en el contexto.
Sé natural y conversacional.`;

const DEFAULT_FALLBACK = ['ollama:richardyoung/qwen3-14b-abliterated:Q4_K_M', 'groq:llama-3.3-70b-versatile', 'cerebras:llama-3.3-70b', 'nvidia:meta/llama-3.3-70b-instruct', 'mistral:mistral-small-latest', 'gemini:gemini-flash-latest', 'openrouter:meta-llama/llama-3.3-70b-instruct:free'];

function buildMessages(prompt, history, systemPrompt) {
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const msg of (history || [])) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: prompt });
  return messages;
}

async function tryGemini(model, prompt, history, systemPrompt) {
  if (!GEMINI_KEY) return { error: 'GEMINI_API_KEY no configurada' };
  try {
    const contents = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const modelName = model || 'gemini-flash-latest';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      }
    );
    const data = await res.json();
    if (data.error) return { error: data.error.message };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { answer: text };
  } catch (e) {
    return { error: e.message };
  }
}

async function tryOpenRouter(model, prompt, history, systemPrompt) {
  if (!OPENROUTER_KEY) return { error: 'OPENROUTER_API_KEY no configurada' };
  try {
    const messages = buildMessages(prompt, history, systemPrompt);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://suitorg.ai',
        'X-Title': 'SuitChatTG'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    const data = await res.json();
    if (data.error) return { error: data.error.message };
    const text = data.choices?.[0]?.message?.content || '';
    return { answer: text };
  } catch (e) {
    return { error: e.message };
  }
}

async function tryOpenAICompatible(providerKey, model, prompt, history, systemPrompt) {
  const provider = OPENAI_COMPAT_PROVIDERS[providerKey];
  const apiKey = provider.key();
  if (!apiKey) return { error: `${providerKey.toUpperCase()}_API_KEY no configurada` };
  try {
    const messages = buildMessages(prompt, history, systemPrompt);
    const timeoutMs = providerKey === 'ollama' ? 120000 : 30000;
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const data = await res.json();
    if (data.error) return { error: typeof data.error === 'string' ? data.error : data.error.message };
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) return { error: 'Respuesta vacía' };
    return { answer: text };
  } catch (e) {
    return { error: e.message };
  }
}

function isGeminiModel(model) {
  return model.toLowerCase().startsWith('gemini');
}

function isOpenRouterModel(model) {
  return model.includes('/');
}

// Soporta prefijo explícito "proveedor:modelo" (ej. "groq:llama-3.3-70b-versatile").
// Sin prefijo, cae al heurístico anterior (compatibilidad con configs existentes).
async function tryModel(model, prompt, history, systemPrompt) {
  const sepIdx = model.indexOf(':');
  if (sepIdx > -1) {
    const prefix = model.slice(0, sepIdx);
    const rest = model.slice(sepIdx + 1);
    if (prefix === 'gemini') return tryGemini(rest, prompt, history, systemPrompt);
    if (prefix === 'openrouter') return tryOpenRouter(rest, prompt, history, systemPrompt);
    if (OPENAI_COMPAT_PROVIDERS[prefix]) return tryOpenAICompatible(prefix, rest, prompt, history, systemPrompt);
  }
  if (isGeminiModel(model)) return tryGemini(model, prompt, history, systemPrompt);
  if (isOpenRouterModel(model)) return tryOpenRouter(model, prompt, history, systemPrompt);
  return tryGemini(model, prompt, history, systemPrompt);
}

async function askAI(prompt, history = [], systemPrompt = SYSTEM_PROMPT_DEFAULT, modelList = null) {
  const models = (modelList && modelList.length > 0) ? modelList : DEFAULT_FALLBACK;
  const errors = [];
  for (const model of models) {
    const result = await tryModel(model, prompt, history, systemPrompt);
    if (!result.error) return result;
    errors.push(`${model}: ${result.error}`);
  }
  return { error: errors.join(' | ') };
}

module.exports = { askAI };
