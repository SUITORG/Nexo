# ADR-006: SuitAI — Model Discovery + Auto-Routing + Circuit Breaker

## Status
Accepted (2026-07-09)

## Context
El campo `usa_soporte_ia` en `Config_Empresas` originalmente servía como booleano ON/OFF para IA, pero evolucionó a una lista manual de modelos separados por coma (`gemini-1.5-flash, openrouter/free`). Esto generó:

1. **5 patrones de parsing diferentes** en frontend y backend — inconsistente y propenso a bugs.
2. **Dependencia de modelos hardcodeados** — cuando un modelo se depreca, hay que actualizar el campo manualmente.
3. **Sin auto-descubrimiento** — el sistema no sabe qué modelos están disponibles, solo prueba los configurados.
4. **Sin circuit breaker** — si un modelo falla, sigue intentándolo en lugar de saltar al siguiente.
5. **Dos fuentes de modelos gratis**: OpenRouter (free models) y OpenCode Zen (free coding models).

## Decision
Crear `SuitAI/` como módulo independiente (puerto 3010) con tres servicios:

### 1. Model Scanner (`services/modelScanner.js`)
- Escanea `GET https://openrouter.ai/api/v1/models?max_price=0` en cada arranque + cada 1 hora
- Escanea `GET https://opencode.ai/zen/v1/models` si hay `OPENCODE_API_KEY`
- Filtra solo modelos con precio `0` (gratis)
- Pingea cada modelo con un mensaje ligero ("hi") para verificar conectividad y medir latencia
- Cachea resultados en memoria con TTL de 1 hora
- Fallback: `google/gemini-1.5-flash` vía API directa de Google

### 2. Circuit Breaker (`services/circuitBreaker.js`)
- Por modelo: tracking de fallas consecutivas, historial (últimas 100 llamadas)
- Si un modelo falla 3 veces seguidas → cooldown de 5 minutos
- Auto-recuperación: después del cooldown, vuelve a intentarse
- Provee `getStatus()` y `getAllStatus()` para monitoreo

### 3. Model Router (`services/modelRouter.js`)
- Orden de prioridad: modelos verificados (por latencia) → no verificados → fallback Google Gemini
- Circuit breaker check antes de cada intento
- Si todos fallan → error con lista de modelos intentados y razones
- Formato de respuesta compatible con OpenAI: `{ choices: [{ message: { content } }] }`

### Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/ai/health` | Health check con conteo de modelos cacheados |
| GET | `/api/ai/models` | Lista modelos disponibles (con estado del circuit breaker) |
| POST | `/api/ai/models/refresh` | Fuerza rescan de modelos |
| POST | `/api/ai/chat` | Envía mensaje, auto-rutea al mejor modelo |
| GET | `/api/ai/circuit` | Estado completo del circuit breaker |

### Utilidad Compartida (`app.utils.parseAiConfig`)
- `core.js`: nueva función `app.utils.parseAiConfig(biz)` que normaliza `usa_soporte_ia` + `agent_enabled`
- Devuelve `{ enabled, models[], hasAudit, raw }`
- Reemplaza los 5 patrones de parsing existentes (migración progresiva)

## Rationale
- **Auto-descubrimiento**: resuelve el problema de modelos deprecated sin intervención manual.
- **Dos fuentes**: OpenRouter tiene más variedad; OpenCode Zen tiene modelos curados para código.
- **Circuit breaker**: evita wasting time en modelos caídos.
- **Módulo independiente**: sigue el patrón SuitReservaciones/SuitProductos.
- **Retrocompatible**: `usa_soporte_ia` sigue siendo válido como override manual si el admin prefiere modelos específicos.

## Consequences
- Se requieren API keys: `OPENROUTER_API_KEY` y opcional `OPENCODE_API_KEY` en `.env`
- El endpoint `/api/ai/chat` existente en `server.js` queda obsoleto (SuitAI toma precedencia al montarse antes)
- El endpoint `/api/ai/generate` existente en `server.js` se mantiene como fallback directo a Google Gemini
- `parseAiConfig` permite migrar progresivamente los 5 patrones de parsing sin romper nada
- El módulo escanea en startup (1s delay) para no bloquear el arranque

## Files Affected
- `SuitAI/index.js` — Express server, mount points
- `SuitAI/handlers/api.js` — REST handlers
- `SuitAI/services/modelScanner.js` — OpenRouter + OpenCode Zen scanner
- `SuitAI/services/circuitBreaker.js` — failure tracking + cooldown
- `SuitAI/services/modelRouter.js` — request routing with fallback chain
- `SuitAI/db/client.js` — Supabase client
- `server.js` — SuitAI mounted before existing AI endpoints
- `js/modules/core.js` — `app.utils.parseAiConfig()` added
- `.suit/registry/projects.yaml` — suit-ai registered
- `.suit/INDEX.md` — projects + ADR-006
- `AGENTS.md` — port 3010 added to registry table
