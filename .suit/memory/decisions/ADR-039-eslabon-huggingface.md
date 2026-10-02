# ADR-039: eslabón `huggingface` en la cadena de IA

## Status
Accepted (2026-10-02)

## Context
Con la cadena `ollama → deepseek → openrouter → gemini` la situación real era:

| Eslabón | Estado |
|---|---|
| `ollama` | ✅ pero **~456 s/foto** en CPU (Ryzen 7 7730U, sin GPU) |
| `deepseek` | ❌ `402 Insufficient Balance` (la key es válida, la cuenta sin saldo) |
| `openrouter` | ❌ `401 User not found` (key del sistema inválida) |
| `gemini` | ❌ sin `GEMINI_API_KEY` |

Es decir: **un solo eslabón funcional y a 7.6 minutos por foto** — un lote de 50 fotos tardaba
horas. El usuario informó que usaría una API de HuggingFace y pidió preparar el sistema.

## Decisión
Añadir **`huggingface` como eslabón 2** (después de `ollama`, antes de `deepseek`):

```
ollama (local) → huggingface (nube) → deepseek → openrouter → gemini
```

Implementación en `ia/switch.py`:

1. **Endpoint**: `POST https://router.huggingface.co/v1/chat/completions` — el router de
   Inference Providers de HuggingFace, **compatible con OpenAI**, autenticado con `HF_TOKEN`
   (imagen como `data:` URL, igual que OpenRouter).
2. **Descubrimiento**: `GET /v1/models` (TTL 1 h) filtrado por nombre
   (`vl|vision|llava|gemma-3|pixtral|internvl|ernie-4.5`) → **11 modelos con visión** en tu cuenta.
3. **Default**: `HF_VISION_MODEL` → si no, prefiere `Qwen/Qwen2.5-VL-72B-Instruct`
   (mejor OCR para letreros en español) → si no está, el primero disponible.
4. **Clave**: `HF_TOKEN` (la variable del sistema ya existía con 37 caracteres; también se puede
   fijar en `.env`). El `.env` del proyecto **manda** sobre el entorno.
5. `_pertece()` evita que un modelo HF se envíe a otro proveedor (misma protección que en ADR-038+fix).

## Rationale
- **Es lo único que hoy da velocidad y precio cero a la vez**: router gratis, sin desplegar nada.
- **Mismo patrón** que `openrouter` (OpenAI-compatible + descubrimiento + TTL): cero lógica nueva,
  solo otro `base_url`.
- Va **después** de `ollama` para conservar el principio de privacidad/local-first: las fotos no
  salen de la máquina salvo que el local falle o se elija `huggingface` a mano.

## Consequences
- **Medido en real**: `Qwen/Qwen2.5-VL-72B-Instruct` respondió en **5.3 s** (vs 456 s de Ollama,
  86×) con lectura correcta (detectó anuncio, marca, texto y hasta el patrocinador real "GNP").
- Corrida end-to-end de **5 fotos en 20 s**: `leidas=5, copiadas=5`, `idxfotos.xlsx` 183→**188 filas**.
- El orden por defecto (`auto`) sigue empezando en **Ollama**: quien quiera velocidad debe elegir
  `huggingface` en el selector (o pedir el reordenamiento, que exigiría otro ADR).
- Rate limits del tier gratuito de HF: si se agota, el circuit breaker (3 fallos → 5 min) baja a
  `deepseek` y el resto de la cadena.
- Afecta a `ORDEN` (contrato "cadena inmutable") → por eso este ADR.

## Files Affected
- `SuitCVLO-open/ia/switch.py` — `ORDEN`, `_disponible`, `_elegir`, `_pertece`, `_huggingface_modelos`, `_huggingface`
- `SuitCVLO-open/plantillas/index.html` — opción en el selector
- `SuitCVLO-open/.env.example` — `HF_TOKEN` / `HF_VISION_MODEL`
- `SuitCVLO-open/tests/test_switch.py` — 3 tests nuevos (36 en total)
- `readme.md`, `AGENTS.md`, `docs/CONTRATO.md`, `docs/PROS_CONTRAS.md`, `docs/VALIDACION.md`
- `.suit/registry/projects.yaml`, `AGENTS.md` (raíz, tabla de puertos)

## Related
- ADR-037 (cadena original de 4 eslabones)
- ADR-038 (baja de AutoClaw, entrada de DeepSeek)
