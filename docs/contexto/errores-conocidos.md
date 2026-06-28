# Errores Conocidos — SuitOrg

## Seguridad

| Error | Dónde | Impacto |
|---|---|---|
| API key hardcodeada en `setupOpenRouterKey()` | `backend/core.js:13` | Exposición de credenciales en código fuente |
| API keys hardcodeadas en `CONFIG` | `CampanasAi/script.js:8-11` | Exposición en frontend (visible en devtools) |
| Supabase anon key hardcodeada | `scripts/agents/vision-audit.js:14` | Exposición en script compartido |
| `service_role` key usada en lugar de RLS | `CampanasAi/lib/supabase.js`, `citas/db/client.js` | Bypass completo de Row Level Security |
| CORS `*` en local-server | `CampanasAi/local-server-node.js` | Cualquier origen puede llamar la API |
| `execSync` con `shell: true` | `local-server-node.js` (FFmpeg endpoints) | Riesgo de shell injection si llega input de usuario a rutas |

## Datos y Consistencia

| Error | Dónde | Comportamiento |
|---|---|---|
| `activo` de Supabase llega como `"true"` minúsculas | Frontend (múltiples módulos) | Usar `String(p.activo).toUpperCase().trim() === "TRUE"` para normalizar |
| `syncToSupabase` tiene catch vacío | `backend/utils.js` | Falla silenciosa — errores de sync no se reportan |
| `process.exit(1)` en librería | `CampanasAi/lib/supabase.js` | Si falta `.env` al importar, CRASHEA todo el proceso que lo requiera |
| Cache trends compartido entre usuarios | `CampanasAi/cache_trends.json` | Un usuario ve trends cacheados de otro |
| FFmpeg temp files no se limpian en error | `local-server-node.js` | `/tmp_slideshow_*/` se acumulan si hay crash |
| Base64 para video largo | `local-server-node.js` | Payload enorme en requests POST; puede llegar a memory limit |

## Código

| Error | Dónde | Detalle |
|---|---|---|
| `generar()` método con typo (debería ser `generarTitulo`) | `CampanasAi/generators/reel-generator.js:103` | Causa stack overflow si se invoca (nombre duplicado) |
| `normalizeDriveUrl` duplicada | `script.js` y `local-server-node.js` | Código repetido, mantener sincronizado |
| GAS URL hardcodeada en múltiples archivos | `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js` | Cada deploy de GAS requiere actualizar N URLs |
| Dos proyectos Supabase diferentes | Backend usa `egyxgnlnzanxpqyuvmsg`, vision-audit usa `hmrpotibipxhsnowgjvq` | Pueden apuntar a datos inconsistentes |
| `no-cors` mode en fetch GAS | Frontend | Respuesta opaca — no se puede leer errores HTTP |
| `start is not defined` en telemetría | `js/modules/core.js` | Declarar `const start = Date.now()` antes de `end` |
| Campos GSheets con mayúsculas/espacios variables | Varios | Usar `getField()` que normaliza headers |
| GAS LockService timeout 30s | `backend/core.js` | Si hay contención, la segunda operación espera hasta 30s |
| `anyOf` usado como filtro WHERE en Supabase | `js/modules/core.js` | No escala con miles de registros |
| `confirmPayment` no confirma realmente | `conecionpagos/index.js` | Solo hace retrieve del intent, nombre engañoso |

## Gemini / AI

| Error | Dónde | Detalle |
|---|---|---|
| Modelo `gemini-1.5-flash` deprecated por Google | `backend/ai_engine.js` | OpenRouter dejó de servirlo; migrar a modelos gratuitos de OpenRouter |
| Fallback a LM Studio local (`localhost:1234`) | `ai_engine.js`, `local-server-node.js` | Solo funciona en máquina del desarrollador |
| Prompt principal hardcodeado en `script.js:760` | `CampanasAi/script.js` | No configurable desde DB (la tabla `Prompts_IA` existe pero no se usa aquí) |
| No hay rate limiting en llamadas AI | `server.js`, `local-server-node.js` | Posible abuso o costo inesperado |

[PENDIENTE: No se encontraron issues de GitHub ni registro formal de bugs fuera de Documentacion/05-debug-referencia.md y soluciones_documentadas.md.]
