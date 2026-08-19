# ADR-021: Pipeline Brief → MediaPlanner → BriefMarker

## Status
Accepted (2026-08-01)

## Context
Implementación del plan `.suit/memory/pending/plan-briefmarker-mediaplanner.md`: nueva plantilla en `#aiTemplate` que, a partir del Brief estructurado en `tipo_negocio` (Config_Empresas), genera un `plan_de_medios` (MediaPlanner, 1 llamada IA) con gate de Aprobar/Rechazar, y al aprobar genera el JSON creativo completo de cada pieza (BriefMarker, hasta 12 llamadas IA, cap de seguridad).

Ejecución delegada a otra sesión/CLI. Esta ADR documenta la revisión posterior (SuitOS reviewer) y el fix aplicado en el mismo turno.

## Decision (lo implementado, verificado correcto)
- `parseBrief()` (local-server-node.js): parser tolerante de los 18 campos, no reescribe `tipo_negocio` en Sheets, no rompe el matching por substring de `js/modules/public.js` (`SI_GALERIA`).
- `fetchEmpresaRow()`, `loadPromptById()`, `callAIJson()` (fallback de modelos + limpieza de fences markdown).
- `generateMediaPlan()` / `approveMediaPlan()` + 3 endpoints (`/api/media-plan/generate`, `/:id/aprobar`, `/:id/rechazar`).
- Migración `007_planes_medios.sql`: tablas `planes_medios`/`piezas_creativas`, RLS abierta, idempotente (`IF NOT EXISTS` en tablas y políticas).
- Prompts `CAMP-MEDIAPLANNER`/`CAMP-BRIEFMARKER` sembrados en `Prompts_IA`.
- Frontend: opción "📋 Brief → Media Planner" en `#aiTemplate`, panel de resumen/aprobar/rechazar, `generateMediaPlanFromUI()`.
- Fix adicional necesario (fuera del plan original pero correcto y bien acotado): `/api/config` usaba `action=getAll`, que no existe en `backend.gs` (`doGet` solo soporta `action=config` o el default de historial) — por eso el picker de empresas llevaba tiempo indefinido sirviendo datos mock aunque el `GAS_URL` ya estuviera corregido (ADR-020). Corregido a `action=config`, y ahora incluye `tipo_negocio` en el objeto mapeado (antes se filtraba).
- Fix adicional (infraestructura, no rompe nada en Windows nativo): `OMNIROUTE_BASE` resuelve la IP del gateway cuando el proceso corre dentro de WSL2 (antes hardcodeado a `localhost:20128`, inalcanzable desde WSL2 hacia el host Windows). Verificado: no queda ningún `localhost:20128` hardcodeado suelto, y en Windows nativo el detector de WSL falla silenciosamente y cae al mismo `localhost:20128` de siempre — sin cambio de comportamiento fuera de WSL2.

## Bug encontrado en la revisión (más grave de lo reportado) y corregido en el mismo turno

La otra sesión reportó la autoselección de industria como "cosmético, no matchea el texto exacto — no bloquea". Verificado que en realidad **fallaba el 100% de las veces, no solo por variaciones menores**: `populateIndustrias()` (script.js) genera cada `<option>` con ícono + espacio (`opt.textContent = \`${grupo.icono} ${grupo.categoria}\``, ej. `"🔌 Electrodomésticos y Bienes de Consumo Premium"`), y la comparación original era `o.text.trim().toLowerCase() === value.toLowerCase()` contra el texto plano del Brief (sin ícono) — el ícono al inicio garantiza que nunca sea igual, independientemente de cualquier otra variación de redacción.

### Fix
Nueva función `matchText(input, candidates, textOf)` en `script.js` (plain function, no skill de SuitOS — corrida en tiempo de ejecución, no es una capacidad de agente/flujo de desarrollo): normaliza ambos lados (minúsculas, sin acentos vía NFD + rango de marcas combinantes construido con `String.fromCharCode` para evitar depender de caracteres invisibles literales en el archivo, `_`/`-` como espacio, símbolos/emoji al inicio removidos, plural simple con `s` final por palabra) antes de comparar. `autoSelectIndustriaFromBrief()` ahora usa `matchText()` en vez de comparación exacta.

### Validación del fix
- `node --check` limpio en ambos archivos.
- Prueba aislada con el caso real reportado (Brief: "Electrodoméstico" singular sin ícono vs. Supabase: "🔌 Electrodomésticos..." plural con ícono) → **match correcto** (antes: 0% de match posible).
- Prueba de nicho (sin ícono, solo diferencia de mayúsculas) → sigue matcheando.
- Prueba de no-match real, vacío y `undefined` → devuelve `null` limpio, sin excepción.

## Validación end-to-end (esta sesión, contra datos reales)
- Prompts `CAMP-MEDIAPLANNER`/`CAMP-BRIEFMARKER` confirmados en Supabase, habilitados.
- Plan real generado y aprobado para "Noe Thermomix" (empresa real, brief real): 16 slots propuestos, cap de 12 respetado exactamente, 12 filas en `piezas_creativas` con `estado:'generado'` y `creative_json` con las 21 keys exigidas por el schema (`objective`...`variants`).
- Prueba de rechazo confirmada: plan rechazado, sin piezas generadas.
- Datos de prueba (6 planes, 12 piezas de pruebas de esta sesión) eliminados de Supabase tras la verificación.

## Files
- `local-server-node.js` — `parseBrief()`, `fetchEmpresaRow()`, `loadPromptById()`, `callAIJson()`, `generateMediaPlan()`, `approveMediaPlan()`, 3 endpoints, fix `/api/config`, `OMNIROUTE_BASE`
- `script.js` — `generateMediaPlanFromUI()`, `matchText()` (nuevo), `autoSelectIndustriaFromBrief()` (corregido)
- `index.html` — opción de plantilla + panel de resumen/aprobar/rechazar
- `Documentacion/migrations/007_planes_medios.sql`
- `Prompts_IA` (Supabase) — `CAMP-MEDIAPLANNER`, `CAMP-BRIEFMARKER`

## Bug encontrado en prueba manual del usuario (2026-08-01, corregido en el mismo turno)

El usuario probó la UI y reportó que no encontraba la opción nueva. Investigado y confirmado: era **doble bug estructural**, no solo cosmético.

1. **Orden de la opción**: quedó como última (14/14) de `#aiTemplate` en vez de 2da (justo debajo de "Automático"), como pedía el plan. El usuario buscó justo ahí y no la encontró.
2. **Más grave — disparador y panel de resultados nunca podían verse en el mismo modo**: `#mediaPlanPanel` quedó anidado dentro de `#videSection`, que solo es visible en `mode==='VIDE'` (`setWorkMode()`). Pero `#aiTemplate` y `#generateBtn` (el disparador real de `generateMediaPlanFromUI()`, vía `generateAIContent()`) viven dentro de `#aiSection`, que **se oculta por completo en modo VIDE** (`aiSection.style.display='none'`, script.js:2407) y solo es visible en otros modos (Ai/BD/BDSMT). Resultado: en modo VIDE la opción ni siquiera es alcanzable; en cualquier otro modo donde sí se puede disparar, el panel de resultados existía en el DOM pero su contenedor ancestro seguía oculto — la llamada de IA y el guardado en Supabase funcionaban, pero nada se veía en pantalla. No había ningún modo donde ambas cosas coincidieran.

### Fix
- Opción reordenada a 2da posición en `index.html`.
- `#mediaPlanPanel` movido fuera de `#videSection`, como hermano de la fila de botones `generateBtn`/`imaginationBtn`/`clearBtn` dentro de `#aiSection` — mismo contenedor que `#aiTemplate`, visible en los mismos modos donde el flujo se puede disparar.
- Verificado en vivo contra el servidor (sirviendo el archivo directo, sin necesidad de reiniciar): una sola ocurrencia de cada ID, en la posición correcta.

## Iteración adicional (mismo día): botón movido a VIDE + fixes de rate limit

Tras la prueba manual, el usuario pidió mover el disparador de "Ai" (dropdown `#aiTemplate`) a un botón propio dentro de `#videSection`, y reportó `4 generadas / 8 con error` en una aprobación real.

### Cambios
- Opción `briefmarker` eliminada de `#aiTemplate`; nuevo botón `#videMediaPlanBtn` ("📋 Generar Plan de Medios (Brief)") dentro de `#videSection`, con su propio loader — ya no depende de `setAiLoading()` (que controlaba el botón equivocado, `generateBtn`, invisible en modo VIDE).
- `#mediaPlanPanel` movido de `#aiSection` a `#videSection` (coherente con el nuevo botón).
- `generateAIContent()`: eliminada la rama muerta `if (template === 'briefmarker')`.
- `approveMediaPlan()` (local-server-node.js) ahora es **idempotente**: antes de procesar, consulta qué `slot_id` ya tienen `estado:'generado'` en `piezas_creativas` y los excluye — reintentar solo re-procesa lo pendiente/fallido, sin duplicar ni re-pagar lo ya generado (usa `upsert` con `onConflict:'id'` en vez de `insert` plano).

### Root cause de los errores (investigado en 3 rondas, dos hipótesis descartadas antes de la correcta)
1. Primer diagnóstico (parcial): `callAIJson()` no tenía backoff específico para 429 → agregado (5s) + espaciado de 3s entre piezas.
2. Segundo diagnóstico (incorrecto, corregido en el acto): el fallback de modelos era `[activeModel, "deepseek/deepseek-v4-flash"]` — como `activeModel` ya es ese mismo modelo, tras deduplicar quedaba un solo modelo real. Se intentó sustituir por Qwen/Gemma — **estos tampoco sirven**: `models-config.js` documenta que solo `deepseek/deepseek-v4-flash` y `openrouter/free` tienen mapeo verificado en OmniRoute; cualquier otro cae a `auto/best-fast`, que devolvió `401 Model minimax-m3-free is not supported` o `Maximum combo retry limit reached`. Corregido a `[activeModel, "openrouter/free"]`.
3. **Causa real, confirmada probando directo contra OmniRoute** (`curl localhost:20128/v1/chat/completions` con `oc/deepseek-v4-flash-free`): el único modelo con credenciales reales activas en OmniRoute está en `429` en este momento, agotado por el volumen de pruebas de la sesión (VIDE + MediaPlanner + ~28 piezas generadas hoy). `openrouter/free` no es un respaldo real hoy (provider sin credenciales en OmniRoute, cae a auto-selección rota). **No es un bug de SuitCampanas** — es agotamiento de cupo gratuito, fuera del alcance de este código.

### Estado al cierre de la sesión
- 4/12 piezas del plan de prueba (`plan_1785603243227`) generadas con éxito y verificadas (guion completo, 21 campos del schema).
- 8 quedan pendientes — se regenerarán solas la próxima vez que se apruebe el mismo plan (el fix de idempotencia ya está en pie), en cuanto se recupere el cupo gratuito o se configure una API key real de OpenRouter en OmniRoute > Providers.
- Decisión del usuario: dejarlo así, reintentar más tarde.

## Iteración adicional: pieza → video real + Estilo Visual en el prompt

Extensión del pipeline: cada pieza generada ahora tiene un botón "🎬 Generar Video" que reusa el mismo motor de VIDE (`generateVideVideo(overrideGuion)` → `/api/video-produce`), y `CAMP-BRIEFMARKER` ahora recibe la dirección de Estilo Visual resuelta (Director o override manual del usuario) sin afectar el copy. Detalle completo, incluyendo un bug de consistencia encontrado y corregido en revisión (estilo podía quedar mezclado entre piezas de un mismo plan si se reintentaba con el selector cambiado — fix: `planes_medios.estilo_visual` se fija en la primera aprobación y se reusa siempre), en `.suit/memory/pending/plan-pieza-a-video.md`.

## Bug encontrado en uso real: video-produce 500 por imágenes de Pollinations corruptas

Al generar el video de la pieza C1-1 desde la UI, `/api/video-produce` devolvió 500 ("El video no pudo generarse"). Logs del servidor mostraron la causa: Pollinations respondía HTTP 200 con un JSON de error (`{"error"...`) en vez de una imagen real, y el código lo escribía tal cual a disco como si fuera un `.png` válido — sin verificar `imgRes.ok` ni el contenido. Eso rompía FFmpeg dos veces: al aplicar el overlay de logo/avatar de esa escena ("Invalid PNG signature") y, más grave, en el ensamblado final del video completo (el volumen de errores de decodificación de PNGs corruptos por escena parece ser lo que desbordaba el pipe de `spawnSync` → `ENOBUFS`).

### Fix
En el fetch de cada imagen de escena (`local-server-node.js`, generación de imágenes VIDE): valida `imgRes.ok` + magic bytes (PNG `0x89 0x50` / JPEG `0xFF 0xD8`) antes de escribir a disco. Si la respuesta no es una imagen válida, genera un fondo sólido con FFmpeg (`color=c=0x1e293b`) del tamaño correcto en su lugar — la escena sigue teniendo overlay de logo/avatar y sigue en el video, solo sin la imagen de IA.

### Validación
Reproducido con la misma llamada real que falló (3 escenas de la pieza C1-1) contra el servidor reiniciado con el fix: Pollinations devolvió 500 en las 3 escenas (saturado por el uso de hoy) — el pipeline ahora absorbe eso, cae a fondo sólido en cada una, y **el video se generó completo (HTTP 200, payload de video real ~320KB)** en vez de tronar.

## Consequences
- `matchText()` queda disponible en `script.js` para cualquier otro matching de texto libre contra catálogos (ej. si más adelante se quiere el mismo criterio para `producto`/`competidores` u otros campos) — no se aplicó retroactivamente a otros matchings existentes en el archivo (ej. `setupCompanyAutoFill()`'s `findVal()`) por no estar dentro del alcance pedido.
- Sin commits — pendiente que el usuario decida cuándo confirmar el trabajo en git.
