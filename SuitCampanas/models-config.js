// Configuración de modelos LLM disponibles — Todos GRATIS vía OpenRouter

const MODELS = {
    "deepseek/deepseek-v4-flash": {
        name: "DeepSeek V4 Flash",
        emoji: "⚡",
        quality: 5, speed: 5, cost: "Gratis",
        lang: "Español/Inglés",
        best: "Código + Marketing + Análisis",
        desc: "El más rápido y mejor gratis. Excelente para contenido de marketing y código."
    },
    "qwen/qwen3.6-35b-a3b:free": {
        name: "Qwen 3.6 35B",
        emoji: "🧠",
        quality: 5, speed: 4, cost: "Gratis",
        lang: "Multilingüe (mejor español)",
        best: "Textos largos + Creatividad",
        desc: "Muy bueno para textos creativos en español. Contexto largo."
    },
    "openrouter/free": {
        name: "OpenRouter Free",
        emoji: "🔄",
        quality: 4, speed: 5, cost: "Gratis",
        lang: "Variable",
        best: "Uso general",
        desc: "Rota entre modelos gratuitos. Rápido pero inconsistente."
    },
    "meta-llama/llama-4-maverick:free": {
        name: "Llama 4 Maverick",
        emoji: "🦙",
        quality: 4, speed: 4, cost: "Gratis",
        lang: "Inglés (aceptable español)",
        best: "Razonamiento + Código",
        desc: "Meta (latest). Bueno para razonamiento lógico."
    },
    "google/gemma-3-27b-it:free": {
        name: "Gemma 3 27B",
        emoji: "💎",
        quality: 4, speed: 4, cost: "Gratis",
        lang: "Inglés",
        best: "Instrucciones precisas",
        desc: "Google's open source. Sigue instrucciones bien."
    },
    "qwen/qwen-2.5-72b-instruct:free": {
        name: "Qwen 2.5 72B",
        emoji: "👑",
        quality: 5, speed: 3, cost: "Gratis",
        lang: "Multilingüe",
        best: "Calidad máxima",
        desc: "El más potente gratis. Más lento pero calidad superior."
    },
    "mistralai/mistral-small-3.1-24b-instruct:free": {
        name: "Mistral Small",
        emoji: "💨",
        quality: 3, speed: 5, cost: "Gratis",
        lang: "Inglés",
        best: "Tareas simples rápidas",
        desc: "Ultra rápido. Para contenido corto."
    }
};

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

// Traduce las claves del dropdown (ids de OpenRouter directo) al namespace real que
// entiende el gateway OmniRoute (localhost:20128). Antes se llamaba a OmniRoute con
// ids como "deepseek/deepseek-v4-flash" o "openrouter/free", que ese gateway no
// reconoce (interpreta "deepseek"/"qwen" como proveedor directo sin credenciales,
// y devuelve 404/500) — de ahí que todo caía siempre al fallback de IA Local.
// ponytail: solo 2 modelos tienen equivalente verificado hoy porque el proveedor
// "openrouter" no tiene credenciales activas en OmniRoute (solo "oc"/OpenCode Zen
// las tiene). El resto usa auto/best-fast hasta que se agregue la API key de
// OpenRouter en el panel de OmniRoute > Providers; en ese momento se puede mapear
// cada modelo a su id real "openrouter/<vendor>/<modelo>" (ver GET /v1/models).
const OMNIROUTE_IDS = {
    "deepseek/deepseek-v4-flash": "oc/deepseek-v4-flash-free",
    "openrouter/free": "auto/best-free"
};
function toOmniRouteId(modelKey) {
    return OMNIROUTE_IDS[modelKey] || "auto/best-fast";
}

module.exports = { MODELS, DEFAULT_MODEL, toOmniRouteId };
