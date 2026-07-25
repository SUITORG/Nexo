/* SuitOrg Backend - AI Engine Module (v16.1.9 - INTELIGENCIA DINÁMICA) */

// Proveedores OpenAI-compatible adicionales (v16.2.0) - mismo shape request/response que OpenRouter
const OPENAI_COMPAT_PROVIDERS = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", keyProp: "GROQ_API_KEY" },
  cerebras: { baseUrl: "https://api.cerebras.ai/v1", keyProp: "CEREBRAS_API_KEY" },
  nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1", keyProp: "NVIDIA_NIM_API_KEY" },
  mistral: { baseUrl: "https://api.mistral.ai/v1", keyProp: "MISTRAL_API_KEY" }
};

function runGeminiInference(data, output) {
  const geminiKey = (PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || "").trim();
  const openRouterKey = (PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY') || "").trim();
  const effectiveORKey = openRouterKey || geminiKey;

  // 📡 PASO 1: Obtener lista de modelos (Prioridad)
  // Viene de Config_Empresas.usa_soporte_ia
  let modelsToTry = (data.ai_config || "gemini-1.5-flash").split(',').map(m => m.trim()).filter(m => m && !['TRUE','FALSE','NO'].includes(m.toUpperCase()));
  
  // Si no hay lista, cargamos fallback de seguridad
  if (modelsToTry.length === 0) modelsToTry = ["gemini-1.5-flash", "gemini-pro"];

  const messages = [{ role: "user", parts: [{ text: "SYSTEM_INSTRUCTIONS:\n" + (data.promptBase || "Ok.") }] }, { role: "model", parts: [{ text: "Entendido." }] }];
  if (data.history) data.history.forEach(h => messages.push({ role: h.role==='user'?'user':'model', parts: [{text:h.content}] }));
  messages.push({ role: "user", parts: [{ text: data.message || "Hola" }] });

  // Formato para OpenRouter (mensajes chat)
  const chatMessages = messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text
  }));

  var lastError = "";

  // 📡 PASO 2: Bucle de Resiliencia (Fallback secuencial)
  for (var i = 0; i < modelsToTry.length; i++) {
    var mName = modelsToTry[i];
    var mClean = mName;
    try {
      console.log(`🤖 [IA_ENGINE] Intentando con: ${mName}...`);

      // --- ROTACIÓN MULTI-PROVEEDOR (v16.2.0): prefijo explícito "proveedor:modelo" ---
      const sepIdx = mName.indexOf(":");
      const prefix = sepIdx > -1 ? mName.slice(0, sepIdx) : "";
      const rest = sepIdx > -1 ? mName.slice(sepIdx + 1) : mName;

      let mode; // 'gemini' | 'openrouter' | 'openai_compat'
      if (prefix === "gemini") { mode = "gemini"; mClean = rest; }
      else if (prefix === "openrouter") { mode = "openrouter"; mClean = rest; }
      else if (OPENAI_COMPAT_PROVIDERS[prefix]) { mode = "openai_compat"; mClean = rest; }
      else {
        // Sin prefijo reconocido: heurístico legacy (compatibilidad con configs existentes)
        const isOpenRouterLegacy = mName.includes("/") || !mName.toLowerCase().startsWith("gemini");
        mode = isOpenRouterLegacy ? "openrouter" : "gemini";
        mClean = mName;
      }

      let url, payload, headers;

      if (mode === "openai_compat") {
        // --- CONFIG PROVEEDOR OPENAI-COMPATIBLE (Groq/Cerebras/NVIDIA NIM/Mistral) ---
        const provider = OPENAI_COMPAT_PROVIDERS[prefix];
        const pKey = (PropertiesService.getScriptProperties().getProperty(provider.keyProp) || "").trim();
        if (!pKey) { console.warn(`⏭️ Saltando ${prefix}: Sin API Key (${provider.keyProp})`); continue; }
        url = provider.baseUrl + "/chat/completions";
        headers = { "Authorization": "Bearer " + pKey, "Content-Type": "application/json" };
        payload = JSON.stringify({ model: mClean, messages: chatMessages });
      } else if (mode === "openrouter") {
        // --- CONFIG OPENROUTER ---
        if (!effectiveORKey) { console.warn("⏭️ Saltando OpenRouter: Sin API Key"); continue; }
        url = "https://openrouter.ai/api/v1/chat/completions";
        headers = {
          "Authorization": "Bearer " + effectiveORKey,
          "HTTP-Referer": "https://suitorg.com", // Opcional
          "X-Title": "SuitOrg AI Engine",
          "Content-Type": "application/json"
        };
        payload = JSON.stringify({
          model: mClean,
          messages: chatMessages
        });
      } else {
        // --- CONFIG GEMINI DIRECTO ---
        if (!geminiKey) { console.warn("⏭️ Saltando Gemini: Sin API Key"); continue; }

        mClean = mClean.replace("models/", "");
        // 🧪 NORMALIZACIÓN AGRESIVA (Lo que funcionó en v16.1.4)
        if (mClean.includes("gemini-1.5-flash") && !mClean.includes("-latest")) {
          mClean = "gemini-1.5-flash-latest";
        }

        console.log(`📡 [IA_ENGINE] Invocando Gemini v1beta: ${mClean}`);
        url = `https://generativelanguage.googleapis.com/v1beta/models/${mClean}:generateContent?key=${geminiKey}`;
        headers = { "Content-Type": "application/json" };
        payload = JSON.stringify({ contents: messages });
      }

      const res = UrlFetchApp.fetch(url, {
        method: "POST", headers: headers, payload: payload, muteHttpExceptions: true
      });

      const responseCode = res.getResponseCode();
      const content = res.getContentText();

      if (responseCode === 200) {
        const json = JSON.parse(content);
        // Extraer texto según el formato del API
        output.answer = (mode === "gemini") ? json.candidates[0].content.parts[0].text : json.choices[0].message.content;
        output.success = true;
        output.active_model = mClean;
        console.log(`✅ [IA_ENGINE] Éxito con: ${mClean}`);
        return;
      }
      
      const safeUrl = url.split("?")[0];
      lastError = `Mod: ${mClean} (En: ${safeUrl}) -> Cod: ${responseCode} | ${content.substring(0,100)}`;
      console.warn(`⚠️ [IA_ENGINE] Falló ${mName}: ${lastError}`);
      
    } catch (e) { 
      lastError = e.message; 
      console.error(`❌ [IA_ENGINE] Error crítico en ${mName}: ${lastError}`);
    }
  }
  
  output.error = "Fallo de Inferencia Multimodelo: " + lastError;
}

// 🩺 DIAGNÓSTICO PROFUNDO
function listAiModels() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  try {
    const res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1/models?key=" + apiKey, {muteHttpExceptions:true});
    if (res.getResponseCode() === 200) {
      var data = JSON.parse(res.getContentText());
      return data.models.map(m => {
        return { name: m.name.replace("models/",""), methods: m.supportedGenerationMethods };
      });
    }
  } catch(e) { console.error(e); }
  return [];
}

function runNotebookLMQuery(data, output) {
  const BRIDGE_URL = PropertiesService.getScriptProperties().getProperty('MCP_BRIDGE_URL');
  if (!BRIDGE_URL) return runGeminiInference(data, output);
  try {
    const res = UrlFetchApp.fetch(BRIDGE_URL + "/notebooklm/query", {
      method: "POST", contentType: "application/json",
      payload: JSON.stringify({ notebookId: data.notebook_id, query: data.message, tenantId: data.id_empresa }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      output.answer = JSON.parse(res.getContentText()).answer;
      output.success = true;
    } else { throw new Error(); }
  } catch (e) { runGeminiInference(data, output); }
}
