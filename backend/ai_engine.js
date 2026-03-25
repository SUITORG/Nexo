/* SuitOrg Backend - AI Engine Module (v16.1.9 - INTELIGENCIA DINÁMICA) */

function runGeminiInference(data, output) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) { output.error = "Error: Key no configurada."; return; }

  // 📡 PASO 1: Escanear qué modelos SÍ funcionan en tu cuenta
  var validModels = listAiModels(); 
  // Filtrar solo los que soportan generación de texto (evitar embeddings)
  var modelsToTry = validModels.filter(m => m.methods && m.methods.includes("generateContent")).map(m => m.name);
  
  // Si no hay ninguno útil, probamos los clásicos por si acaso
  if (modelsToTry.length === 0) modelsToTry = ["gemini-1.5-flash", "gemini-pro"];

  const messages = [{ role: "user", parts: [{ text: "SYSTEM_INSTRUCTIONS:\n" + (data.promptBase || "Ok.") }] }, { role: "model", parts: [{ text: "Entendido." }] }];
  if (data.history) data.history.forEach(h => messages.push({ role: h.role==='user'?'user':'model', parts: [{text:h.content}] }));
  messages.push({ role: "user", parts: [{ text: data.message || "Hola" }] });

  var lastError = "";
  var apiVersions = ["v1", "v1beta"];

  // 📡 PASO 2: Intentar conexión con los modelos confirmados
  for (var v = 0; v < apiVersions.length; v++) {
    for (var i = 0; i < modelsToTry.length; i++) {
        try {
          // Normalizar nombre del modelo (asegurar que no tenga duplicado el prefijo models/)
          var mName = modelsToTry[i].replace("models/", "");
          var url = `https://generativelanguage.googleapis.com/${apiVersions[v]}/models/${mName}:generateContent?key=${apiKey}`;
          
          const res = UrlFetchApp.fetch(url, {
            method: "POST", contentType: "application/json", payload: JSON.stringify({ contents: messages }), muteHttpExceptions: true
          });

          if (res.getResponseCode() === 200) {
            output.answer = JSON.parse(res.getContentText()).candidates[0].content.parts[0].text;
            output.success = true; output.active_model = mName; return;
          }
          lastError = `Mod: ${mName} (${apiVersions[v]}) -> Cod: ${res.getResponseCode()}`;
        } catch (e) { lastError = e.message; }
    }
  }
  output.error = "Fallo de Inferencia: " + lastError;
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
