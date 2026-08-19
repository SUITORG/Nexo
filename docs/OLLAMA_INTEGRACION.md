# Integración de IA local con Ollama

Integra Ollama (modelos locales en CPU) como proveedor de IA para **SuitAI** y **SuitChatTG**, sin costo y sin depender de la nube.

## Qué se hizo

Se añadió el proveedor `ollama` (endpoint OpenAI-compatible `http://localhost:11434/v1`) a los dos módulos que consumen IA:

| Archivo | Cambio |
|---|---|
| `SuitAI/services/modelScanner.js` | Nuevo `scanOllama()` que auto-descubre los modelos instalados en Ollama (`GET /v1/models`). Los marca con `latency_ms: 0` (local = máxima prioridad, sin ping). Timeout de 10s añadido al fetch del scanner para que nunca cuelgue. |
| `SuitAI/services/modelRouter.js` | Soporte `source === 'ollama'` en la selección de API key y timeout extendido (120s) para generación en CPU (el primer request carga el modelo). |
| `SuitChatTG/handlers/ai.js` | Provider `ollama` añadido a `OPENAI_COMPAT_PROVIDERS` y puesto **primero** en `DEFAULT_FALLBACK` (local-first, nube de respaldo). Timeout de 120s para Ollama vía `AbortSignal.timeout`. |

## Cómo funciona

- **SuitAI**: al hacer `route()`, el scanner auto-descubre tus modelos Ollama. El router ordena por latencia → los locales siempre van primero. Si Ollama está apagado, cae a OpenRouter/OpenCode/Gemini (sin error).
- **SuitChatTG**: el bot intenta `ollama:richardyoung/qwen3-14b-abliterated:Q4_K_M` primero; si falla, rota por Groq → Cerebras → NVIDIA → Mistral → Gemini → OpenRouter.

## Modelo en uso

Tu Ollama ya tiene estos modelos locales (todos entran en tus 64 GB RAM):

- `richardyoung/qwen3-14b-abliterated:Q4_K_M` (9 GB) — **usado por el bot Telegram** (SuitChatTG)
- `hf.co/ornith-ai/Ornith-1.0-9B-GGUF:Q4_K_M` (5.6 GB) — el de menor prioridad de carga; SuitAI puede elegirlo
- `qwen3.6:latest` / `qwen3.6:35b` (23 GB) — potente pero lento en CPU (~8 núcleos)

## Requisitos

- Ollama corriendo: `ollama serve` (o app de bandeja). Puerto por defecto `11434`.
- Opcional: `OLLAMA_BASE_URL` en `.env` de SuitAI si usas otro host/puerto.

## Uso

1. Iniciar Ollama (app de bandeja o `ollama serve`).
2. Iniciar SuitAI (`node SuitAI/index.js`) o SuitChatTG (`node SuitChatTG/index.js`).
3. La IA local responde gratis. Sin Ollama, fallback automático a la nube.

## Verificación

```bash
# Endpoint OpenAI-compatible de Ollama
curl http://localhost:11434/v1/chat/completions -d '{"model":"richardyoung/qwen3-14b-abliterated:Q4_K_M","messages":[{"role":"user","content":"di OK"}]}'

# Router completo de SuitAI (desde SuitAI/)
node -e "require('./services/modelRouter').route([{role:'user',content:'di OK'}]).then(r=>console.log(r.model,r.content))"
```

Salida esperada: `MODELO: ... | RESP: "OK"`

## Notas

- **Primer request lento**: el primer request carga el modelo a RAM (puede tardar 30-60s). Los siguientes son más rápidos.
- **Elección del modelo en SuitAI**: el router usa el primer modelo local de tu lista (todos con misma prioridad). Para fijar uno, borra del `ollama list` los que no quieras o cambia su orden.
- El bot (SuitChatTG) usa explícitamente el qwen3-14b.
