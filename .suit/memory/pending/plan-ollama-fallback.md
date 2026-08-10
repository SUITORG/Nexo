# Plan: Ollama local como 3er nivel de respaldo en `callAIJson()` (BriefMarker/MediaPlanner)

## Status
Ejecutado y validado (2026-08-02).

### Implementación (otra sesión/CLI)
- `callOllama()` en `local-server-node.js` usa `http.request` nativo, no `fetch()` — el `fetch` global de undici tiene `headersTimeout` de 300s, y con `stream:false` Ollama no manda headers de respuesta hasta terminar de generar; en CPU-only eso supera los 5 min y moría con "fetch failed" aunque la generación fuera bien. `http.request` no tiene ese límite (timeout propio de 15 min).
- `callAIJson()` agrega Ollama como último recurso, después de `[activeModel, "openrouter/free"]` — no reemplaza nada de nube, solo se ejecuta si ambos ya fallaron. Log `WARN` antes de intentarlo.

### Validación (esta sesión, las 3 pendientes que quedaron incompletas)
1. **JSON completo y válido con el prompt real** — ✅ PASS. Prueba aislada de `callOllama()` (mismo código, sin tocar el servidor en vivo) con el prompt REAL de `CAMP-BRIEFMARKER` (2353 caracteres) y un slot real de Thermomix: 118.6s, **21/21 keys del schema presentes**, 4 escenas, contenido coherente.
2. **Con nube sana, Ollama nunca se llama** — ✅ PASS. Generado y aprobado un plan real completo (12/12 piezas) enteramente vía DeepSeek/openrouter — cero apariciones del log `[AI_JSON] Modelos en la nube agotados...` en todo el run.
3. **Con nube agotada, el error final es limpio (sin crash)** — ✅ PASS, verificado por revisión de código en vez de prueba en vivo forzada: el usuario estaba usando la app en tiempo real durante la validación (`/api/video-produce` corriendo en paralelo), así que no se forzó una caída simulada de la nube para no interrumpirlo. El patrón de manejo de error (`try/catch` → `throw new Error('Todos los modelos fallaron...')`) es idéntico al que ya existía antes de agregar Ollama, y ese mismo patrón ya se comprobó limpio varias veces esta sesión cuando el cupo gratuito se agotó de verdad (ver ADR-021).

Datos de prueba (plan + piezas de esta validación) eliminados de Supabase.

## Contexto
Hoy `callAIJson()` (local-server-node.js, usada por `generateMediaPlan()`/`approveMediaPlan()`) solo tiene 2 modelos de respaldo, ambos en la nube vía OmniRoute (`deepseek/deepseek-v4-flash`, `openrouter/free`) — los únicos con credenciales reales (ver ADR-021). Si ambos se saturan (pasó hoy mismo, cupo gratuito agotado), toda la generación de MediaPlanner/BriefMarker falla. El usuario tiene Ollama corriendo localmente con varios modelos descargados (`GET localhost:11434/api/tags`).

### Elección del modelo — probada en vivo, no supuesta
Se probaron 3 modelos reales contra Ollama corriendo en esta máquina (CPU-only, sin GPU — `ollama ps` muestra `100% CPU` en los tres) con un prompt representativo del schema de `CAMP-BRIEFMARKER`:

| Modelo | Resultado |
|---|---|
| `qwen3.5:latest` (9.7B, "thinking") / `qwen3.6:latest` (36B) | **Descartados** — son modelos de razonamiento, generan tokens de "pensamiento" internos antes de responder; a ~5-6 tok/s en CPU, no terminaron ni con 4 minutos de margen. |
| `qwen2.5-coder:latest` (7.6B) | ✅ **Elegido**. 64s reales, 291 tokens, JSON válido con la semántica correcta del schema (`overlay` = texto en pantalla, tal como lo pide `CAMP-BRIEFMARKER`). Redacción aceptable, no tan pulida como DeepSeek pero utilizable. |
| `llama3.2:latest` (3.2B) | Más rápido (35s) pero cometió un error real de esquema — puso dirección visual/musical en el campo `overlay` en vez de texto en pantalla. Descartado: para un fallback de emergencia importa más que respete el contrato del JSON que ganar unos segundos. |

Ollama expone tanto un endpoint nativo (`/api/generate`) como uno compatible con OpenAI (`/v1/chat/completions`). Se usa el **nativo**, porque es el que se verificó funcionando en las pruebas reales — el compatible nunca llegó a responder en los intentos con modelos "thinking" y no se confirmó por separado.

## Decision

Nueva función `callOllama()`, paralela a `callOpenRouter()` pero apuntando a Ollama en vez de OmniRoute (no pasa por OmniRoute — llamada directa a `localhost:11434`, sin necesidad de mapeo de ids ni credenciales). Usa `/api/generate` (nativo, verificado) con `system`/`prompt` separados — mismo shape que ya recibe `callAIJson()`, sin necesidad de armar un array `messages`:

```js
// Fallback local (Ollama) para cuando se agota el cupo gratuito de OmniRoute.
// Modelo default elegido tras probar 3 opciones reales en esta máquina (ver
// tabla arriba): qwen2.5-coder es el único que respetó la semántica del schema
// de BriefMarker sin ser inviablemente lento (los modelos "thinking" no
// terminaron ni en 4 minutos). num_predict como techo de seguridad, no como
// límite esperado — la respuesta real (~300-600 tokens) queda muy por debajo.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || 'qwen2.5-coder:latest';

async function callOllama(model, systemContent, userContent, temperature = 0.7) {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model, system: systemContent, prompt: userContent, stream: false,
            options: { temperature, num_predict: 2000 }
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
    if (data.response) return data.response;
    throw new Error("Respuesta de Ollama vacía o malformada");
}
```

`callAIJson()` agrega un paso final, DESPUÉS de que la lista `orModels` (nube) se agote — no reemplaza nada existente, solo se agrega como último recurso:

```js
async function callAIJson(systemContent, userContent, temperature = 0.7) {
    const orModels = [activeModel, "openrouter/free"].map(toOmniRouteId).filter(...);
    let lastError = 'No se recibieron errores.';
    for (const m of orModels) {
        try {
            const result = await callOpenRouter(m, messages, temperature);
            return JSON.parse(limpiar(result));
        } catch (err) { /* ...igual que hoy... */ }
    }
    // Última opción: modelo local de Ollama, sin depender de cupo/red externa.
    // Lento (~60-90s por llamada, medido en vivo) pero funciona sin internet.
    try {
        serverLog('WARN', '[AI_JSON] Modelos en la nube agotados, probando Ollama local (puede tardar ~1 min)...');
        const result = await callOllama(OLLAMA_FALLBACK_MODEL, systemContent, userContent, temperature);
        return JSON.parse(limpiar(result));
    } catch (err) {
        lastError = err.message;
    }
    throw new Error('Todos los modelos fallaron al generar JSON. Último error: ' + lastError);
}
```

## Alcance (deliberadamente acotado)
Solo se toca `callAIJson()` (usada por MediaPlanner/BriefMarker) — es el punto exacto donde se sintió el problema hoy. `callOpenRouter()` se usa en otros lugares del archivo (ej. `generateAITrendFallback()`, el endpoint general de `/api/ai/generate`) que NO se tocan en este plan; si se quiere el mismo respaldo ahí, es una extensión natural después, no incluida ahora para no ampliar el diff sin que se haya pedido.

## Riesgo
Bajo — es un fallback aditivo (solo se ejecuta si los 2 modelos de nube ya fallaron), no cambia el comportamiento normal. Riesgo real: **latencia**, ya medida en vivo, no estimada — `qwen2.5-coder:latest` tardó 64s reales para un JSON de ~291 tokens (CPU-only, sin GPU). Para `approveMediaPlan()`, que puede necesitar hasta 12 piezas, si TODAS cayeran a Ollama (worst case, poco probable) serían ~12-18 minutos — lento pero funciona, y es exactamente el escenario de "ya no queda nada más" para el que es este fallback. Si Ollama tampoco responde (apagado, modelo no descargado), se suma al mensaje de error final, sin bloquear nada nuevo.

## Validación
- `node --check` en `local-server-node.js`.
- Con OmniRoute funcionando normal: confirmar que Ollama NUNCA se llama (no debe aparecer el log de "probando Ollama local" en un run exitoso).
- Simular agotamiento (ej. apuntar `activeModel` a un id inválido temporalmente, o esperar a que vuelva a pasar el rate limit real) → confirmar que cae a Ollama y genera un `plan_de_medios`/`creative_json` válido igual que con los modelos de nube. **Ya verificado por separado** (fuera del código, directo contra Ollama) que `qwen2.5-coder:latest` vía `/api/generate` con `system`+`prompt` responde JSON válido y semánticamente correcto en ~64s — falta solo confirmar que `callOllama()` lo integra igual una vez escrito.
- Con Ollama apagado y nube agotada → confirmar que el error final sigue siendo claro (no un crash, mismo `throw` de siempre).

## Rollback
`git checkout -- local-server-node.js` — sin migraciones, sin variables de entorno obligatorias (usa defaults si no están en `.env`).
