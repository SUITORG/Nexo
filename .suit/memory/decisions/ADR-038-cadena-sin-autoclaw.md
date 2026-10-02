# ADR-038: Cadena de IA sin AutoClaw — entra DeepSeek

## Status
Accepted (2026-10-01)

## Context
ADR-037 definió la cadena `ollama → openrouter → gemini → autoclaw`. El eslabón `autoclaw` era el
comportamiento heredado de `\cvlo-auditor`: subir la imagen a un OSS con una firma MD5 y llamar a la
API de AutoGLM, usando un servicio local en `:18432` y una `APP_ID`/`APP_KEY` que **aún vivían en el
código de origen**.

Al correr el proyecto en real (2026-10-01) se comprobó que:

1. Ese eslabón era el único que respondió cuando Ollama y OpenRouter fallaron → dependencia práctica
   de un servicio externo que el usuario debe tener abierto.
2. `OPENROUTER_API_KEY` del entorno devolvió `401 User not found` → el eslabón 2 real estaba roto.
3. El usuario pidió explícitamente **sacar a AutoClaw de los modelos** y **buscar la API key gratis
   de DeepSeek**.

## Decisión

**Cadena nueva (4 eslabones):**

```
ollama (local, VLM) → deepseek (nube) → openrouter (nube, gratis) → gemini (nube)
```

1. **Eliminación total de AutoClaw** de `SuitCVLO-open/`:
   - `ia/switch.py`: `_autoclaw()`, su rama en `_disponible()` y su entrada en `modelos()`.
   - `motor.py`: `DIR_SKILL`, `CONFIG_DEFECTO`, `ENTORNO_CFG`, `leer_config()`, `token_local()`,
     `token_disponible()`, `subir_imagen()`, `reconocer()` y los imports muertos
     (`hashlib`, `json`, `mimetypes`, `uuid`) → **-127 líneas**.
   - `app.py`: `token` en `/api/estado`; `static/app.js` + `plantillas/index.html`: `badge-token`.
   - `.env.example`: `AUTOCALW_*`. Se conservan `PROMPT_LECTURA` y `campo()` (son del pipeline).
2. **Nuevo eslabón `deepseek`**: OpenAI-compatible contra `https://api.deepseek.com/chat/completions`,
   modelo `deepseek-flash` (DeepSeek-V4.1-Flash, con visión), imagen como `data:` URL.

## Rationale
- **DeepSeek gratis real**: `platform.deepseek.com` regala **5M tokens al registrarse, sin tarjeta**
  (caducan a los 30 días) → a ~1500 tokens/foto equivalen miles de fotos. Después del grant sigue
  siendo de los modelos más baratos ($0.15/M input off-peak).
- **Sin dependencia de software de terceros instalado**: no hace falta AutoClaw abierto ni leer su
  skill local; solo una variable en `.env`.
- **Aligera el código**: -127 líneas y cero claves de terceras partes, refuerza el invariante 5 del
  contrato ("sin secretos en el código").
- **Orden**: DeepSeek va antes que OpenRouter porque el grant es por tokens (mejor para lotes) frente
  al límite de ~50 req/día del tier gratuito de OpenRouter.

## Consequences
- `cvlo-auditor` (solo lectura) **sigue teniendo** su motor de AutoClaw: la eliminación es solo del
  fork `SuitCVLO-open`. Si algún día se necesita, está en el historial (ADR-037 + git).
- `docs/CONTRATO.md`, `readme.md`, `AGENTS.md`, `PROS_CONTRAS.md`, `MODELOS.md` y `VALIDACION.md`
  quedaron actualizados a la cadena nueva; ADR-037 **no se modificó** (append-only).
- **Pendiente**: generar la `DEEPSEEK_API_KEY` en `platform.deepseek.com` y pegarla en `.env`
  (anotado en `GuiaTotal/PENDIENTES.md`).
- Sin eslabón de respaldo "local→nube barata" si DeepSeek no tiene key: la cadena saltaría directo a
  OpenRouter/Gemini (o fallaría si tampoco hay keys).

## Files Affected
- `SuitCVLO-open/ia/switch.py`, `SuitCVLO-open/motor.py`, `SuitCVLO-open/app.py`
- `SuitCVLO-open/proceso.py` (docstring), `SuitCVLO-open/ia/__init__.py`
- `SuitCVLO-open/static/app.js`, `SuitCVLO-open/plantillas/index.html`
- `SuitCVLO-open/.env.example`, `readme.md`, `AGENTS.md`, `docs/CONTRATO.md`,
  `docs/PROS_CONTRAS.md`, `docs/MODELOS.md`, `docs/VALIDACION.md`
- `.suit/registry/projects.yaml`, `AGENTS.md` (raíz, tabla de puertos)

## Related
- ADR-037 (origen de la cadena de 4 eslabones)
- `GuiaTotal/PENDIENTES.md` (OpenRouter 401 + alta de DeepSeek)
