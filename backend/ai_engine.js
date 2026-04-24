/* SuitOrg Backend - AI Engine Module (v16.1.9 - INTELIGENCIA DINÁMICA) */

function runGeminiInference(data, output) {
  const geminiKey = (PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || "").trim();
  const openRouterKey = (PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY') || "").trim();
  const effectiveORKey = openRouterKey || geminiKey;
  
  // 📡 PASO 1: Obtener lista de modelos (Prioridad)
  // Viene de Config_Empresas.usa_soporte_ia
  let modelsToTry = (data.ai_config || "gemini-1.5-flash").split(',').map(m => m.trim()).filter(Boolean);
  
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
    try {
      console.log(`🤖 [IA_ENGINE] Intentando con: ${mName}...`);
      
      // Deteminar si es OpenRouter (contiene / o no empieza por gemini)
      const isOpenRouter = mName.includes("/") || !mName.toLowerCase().startsWith("gemini");
      
      let url, payload, headers;
      
      if (isOpenRouter) {
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
          model: mName,
          messages: chatMessages
        });
      } else {
        // --- CONFIG GEMINI DIRECTO ---
        if (!geminiKey) { console.warn("⏭️ Saltando Gemini: Sin API Key"); continue; }
        
        let mClean = mName.replace("models/", "");
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
        output.answer = isOpenRouter ? json.choices[0].message.content : json.candidates[0].content.parts[0].text;
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
