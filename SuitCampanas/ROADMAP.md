# Roadmap — SuitCampanas Improvements

**Inicio**: 2026-07-19
**Fuente**: `MEJORAS_SUITCAMPANAS.md`

---

## Estado General

| Fase | Avance |
|------|--------|
| P0 — Verificación de fuga | █████░░░░░ 50% |
| P1 — Seguridad activa | ██████████ 100% |
| P2 — Cerrar ciclo de fix | ████████░░ 80% |
| P3 — Actualizar Core | ████████░░ 80% |
| P4 — Mantenibilidad | ░░░░░░░░░░ 0% |
| P5 — Calidad de video VIDE | ██████████ 100% (pendiente de prueba manual del usuario) |
| P6 — Industria/Nicho desde Supabase | ████████░░ 80% (Fase 2 pendiente) |
| P7 — Aceptar/Rechazar campaña + JSON completo | ██████████ 100% |
| P8 — Fix deployment GAS + crash en /api/save | █████████░ 90% (falta limpiar fila de prueba) |
| P9 — Brief → MediaPlanner → BriefMarker | ██████████ 100% |
| P10 — Ollama local como 3er respaldo de IA | ██████████ 100% |
| P11 — Selector de alcance de producción (Completo/Semanal/Demo) | ██████████ 100% |
| P12 — Reorganización visual de VIDE (3 bloques claros) | ██████████ 100% |

---

## P0 — Verificación de fuga

- [x] Confirmar si `._backup/` está en historial git
- [ ] Rotar credenciales Google Cloud (Drive API Key, Client ID, App ID) — **requiere acción manual**

## P1 — Seguridad activa

- [x] 1.1 Reemplazar `service_role` por anon key + RLS en `lib/supabase.js`
- [x] 1.2 Reemplazar `execSync(cmd, {shell:true})` por `spawnSync`/`ffmpeg()` helper
- [x] 1.3 Sanitizar ~15 sitios críticos de `innerHTML` en `script.js` (escapeHtml helper + DOM API)
- [x] 1.4 Restringir `/api/proxy-image` a lista blanca de dominios conocidos
- [x] 1.5 Restaurar token en endpoints Supabase (RLS + anon key cubre la función)
- [x] 1.6 Restringir CORS a orígenes conocidos

## P2 — Cerrar ciclo del proceso de fix

- [x] 2.1 Eliminar `._backup/` del working tree
- [x] 2.2 Agregar `._backup/` a `.gitignore`
- [x] 2.3 Corregir `package.json` start → `local-server-node.js`
- [x] 2.4 Agregar columna `activo` a tabla `campanas` (TRUE en upsert)

## P3 — Actualizar Core

- [x] 3.1 Corregir `path: CampanasAi/` → `SuitCampanas/` en `projects.yaml`
- [x] 3.2 Corregir rutas en `AGENTS.md`
- [x] 3.3 Actualizar `ARCHITECTURE.md` §16 (~15 referencias corregidas: skill context, project registry, workflow context, loader/planner/telemetry examples)
- [x] 3.4 Renombrar `generar()` → `generarTitulo()` en `reel-generator.js:103` (typo corregido)

## P4 — Mantenibilidad

- [ ] 4.1 Fragmentar `script.js` en módulos
- [ ] 4.2 Fragmentar `local-server-node.js` en módulos
- [ ] 4.3 DAO centralizado para Supabase
- [ ] 4.4 Agregar lint + typecheck
- [ ] 4.5 Agregar tests

## P5 — Calidad de video VIDE (sesión 2026-07-29/30)

Detalle completo y verificación de cada punto en `.suit/memory/bugs/videos-multiples-fallas.md` (B1-B17 + 2 mejoras de calidad).

- [x] 5.1 VIDE/ViRe separados como motores independientes (ADR-012)
- [x] 5.2 Crash `avatarPath is not defined` — abortaba audio/música/subtítulos en todo render
- [x] 5.3 Auto-sync GAS rompía por redirect 302 no seguido (`fetchWithRedirects`)
- [x] 5.4 Video se truncaba a la duración de la voz en vez de la del guion
- [x] 5.5 Logo/avatar aparecían como slides extra en vez de overlay
- [x] 5.6 Autofill de empresa: match case-insensitive + normalización de URL sin protocolo
- [x] 5.7 Overlay de teléfono/sitio web (nuevo, arriba-derecha, todas las escenas)
- [x] 5.8 Texto de overlay (título/contacto) se salía del cuadro — wrap + shrink + elipsis
- [x] 5.9 Prompt de `generateVideJson()`: alineación psicológica + plantilla derivada de conciencia + fields cinematográficos (`camara`/`pattern_interrupt`/`sfx`)
- [x] 5.10 Voz: gTTS → Edge TTS neuronal (Python, MIT/LGPL — no la versión npm, que es no-comercial)
- [x] 5.11 Imágenes: dimensiones correctas por formato (antes fijas a 1080x1920) + modelo `flux` + dirección de cámara en el prompt
- [x] 5.12 Chip del logo: contraste blanco en vez de negro (logos oscuros se perdían)
- [ ] 5.13 **Pendiente: prueba manual del usuario en el navegador real** — todo lo anterior verificado contra el servidor directo, no desde la UI en vivo

### Backlog evaluado y diferido (no bloqueante)
- **FT-001** (`.suit/memory/pending/tech-debt.yaml`): integrar ComfyUI como motor visual/audio para VIDE — solo el registro MCP está hecho, resto diferido.
- **FT-002** (`.suit/memory/pending/tech-debt.yaml`): automatizar edición vía DaVinci Resolve + MCP desde SuitCampanas — diferido hasta que la prueba manual (5.13) confirme si hace falta algo que FFmpeg no pueda resolver (color grading, mezcla compleja). Rompería la automatización 100%-servidor actual.

## P6 — Industria/Nicho/Especialización desde Supabase (sesión 2026-07-31)

Detalle completo en `.suit/memory/decisions/ADR-017-industria-nicho-supabase.md`.

- [x] 6.1 `<select id="aiIndustry">` hardcodeado + mapa local `INDUSTRIAS_NICHOS` → eliminados; ahora 100% Supabase (`populateIndustrias()`/`populateNichos()` leen `/api/industrias`, 22 industrias / 85 nichos reales)
- [x] 6.2 Verificado en vivo contra el servidor: 0 referencias a `INDUSTRIAS_NICHOS` en el repo, `node --check` limpio, `GET /api/industrias` responde con datos reales incluida "Hogar y Servicios del Hogar" (id 33)
- [ ] 6.3 **Fase 2 (NO iniciada)**: exportar `industrias`/`nichos` a Google Sheets. Decisión tomada (2026-07-31): **Opción A** — 2 hojas (Industrias, Nichos), sin hoja separada para especializaciones; en Nichos, la columna `especializaciones` (y `sinonimos`) va en una sola celda con valores separados por coma.

## P7 — Aceptar/Rechazar campaña generada + JSON completo (sesión 2026-08-01)

Detalle completo en `.suit/memory/decisions/ADR-019-campanas-aceptar-rechazar.md`.

- [x] 7.1 Reparados 2 bugs de raíz preexistentes que hacían fallar TODO guardado en `campanas` en silencio: columnas faltantes (`activo`/`plataforma`/`modo`/`contenido`/`metadata`) + RLS activo sin políticas. Migración `Documentacion/migrations/006_campanas_fix_schema.sql` aplicada y verificada en vivo.
- [x] 7.2 Nueva columna `contenido_json` (jsonb) — el JSON completo del guion/slides ahora se persiste, no solo el caption.
- [x] 7.3 Panel Aceptar/Rechazar en VIDE (`#videReviewPanel`): el video ya no se descarga automático, el usuario decide.
- [x] 7.4 Revisión SuitOS (reviewer) tras la ejecución encontró 2 bugs de correctitud (JSON viejo/vacío persistido en VIDE modo-texto y en BDPR texto libre) — corregidos y verificados en vivo el mismo día.
- [x] 7.5 Apps Script republicado por el usuario/otra CLI, columna JSON activa — confirmado en vivo.

## P8 — Fix deployment GAS + bug crítico en `/api/save` (sesión 2026-08-01)

Detalle completo en `.suit/memory/decisions/ADR-020-fix-gas-deploy-y-api-save-crash.md`.

- [x] 8.1 `GAS_URL` restaurado al deployment correcto en 4 archivos (root cause: commit `949879e` lo había cambiado al deployment de otro proyecto)
- [x] 8.2 **Bug crítico encontrado en revisión**: `POST /api/save` crasheaba el servidor completo (excepción sin capturar por mal uso de `fetchWithRedirects`, que es GET-only) — cualquier intento de guardado real a Sheets tumbaba todo SuitCampanas. Corregido usando `fetch()` nativo.
- [x] 8.3 **Bug adicional encontrado**: el submit real del formulario apuntaba a `/api/history` (solo lectura, descarta el body) en vez de `/api/save` — el guardado a Sheets del flujo principal era un no-op silencioso desde siempre, enmascarado por `mode:'no-cors'`. Corregido: nuevo `CONFIG.SAVE_URL`, respuesta leída de verdad para fijar `gasOk`.
- [x] 8.4 Verificado en vivo end-to-end: guardado real crea fila en SMMC sin tumbar el servidor.
- [ ] 8.5 **Pendiente manual del usuario**: borrar la fila de prueba `REVIEW_PROBE_FIXED_SAVE_445566` de la hoja SMMC (no hay endpoint de borrado). También pendiente: decidir cómo pre-poblar `#token` en `index.html` (hoy vacío por defecto — sin llenarlo a mano, `doPost` sigue rechazando con 401).

## P9 — Brief → MediaPlanner → BriefMarker (sesión 2026-08-01)

Detalle completo en `.suit/memory/decisions/ADR-021-briefmarker-mediaplanner.md`.

- [x] 9.1 Parser tolerante de los 18 campos de `tipo_negocio` (Brief), sin romper el matching por substring del generador de sitios web
- [x] 9.2 `MediaPlanner` (1 llamada IA → `plan_de_medios`) con gate Aprobar/Rechazar antes de generar piezas
- [x] 9.3 `BriefMarker` (hasta 12 llamadas IA → `piezas_creativas`, JSON creativo completo de 21 campos por pieza)
- [x] 9.4 2 tablas nuevas en Supabase (`planes_medios`, `piezas_creativas`), migración idempotente
- [x] 9.5 Fix adicional necesario: `/api/config` apuntaba a una acción GAS que no existe (`getAll`) — el picker de empresas llevaba tiempo sirviendo datos mock; corregido a `action=config` + expone `tipo_negocio`
- [x] 9.6 **Bug encontrado en revisión**: autoselección de industria/nicho fallaba 100% de las veces (no solo "cosmético" como se reportó) — los `<option>` de industria llevan ícono+espacio, comparación exacta nunca podía matchear. Corregido con `matchText()` (normalización tolerante a acentos/mayúsculas/plural/símbolos), verificado con el caso real.
- [x] 9.7 Verificado end-to-end con datos reales (Noe Thermomix): plan de 16 slots, cap de 12 respetado, 12 piezas con schema completo; rechazo confirmado sin persistencia. Datos de prueba limpiados.
- [x] 9.8 **Bug encontrado en prueba manual del usuario**: opción quedó última (14/14) de `#aiTemplate` en vez de 2da. Corregido: reordenada justo debajo de "Automático".
- [x] 9.9 **Bug más grave, mismo hallazgo**: `#mediaPlanPanel` vivía dentro de `#videSection` (solo visible en modo VIDE), pero el disparador (`#aiTemplate`/`#generateBtn`) vive en `#aiSection` (oculta por completo en modo VIDE) — no existía ningún modo donde disparador y panel de resultados fueran visibles a la vez. La IA y el guardado en Supabase sí funcionaban, pero nada se veía en pantalla. Corregido: panel movido a `#aiSection`, junto al botón "Generar con IA".
- [ ] 9.10 **Pendiente aclaración del usuario**: si al escoger empresa también deben auto-seleccionarse Formato/Plataforma (Reel/Story/Post + Instagram/TikTok/etc.) según el campo `vivir` del Brief — no estaba en el plan original ni se implementó. El Brief no trae un campo equivalente a "formato" (solo a plataforma/canal).
- [x] 9.11 Disparador movido de `#aiTemplate` (modo Ai) a botón propio `#videMediaPlanBtn` en modo VIDE, a pedido del usuario. `#mediaPlanPanel` movido junto con él.
- [x] 9.12 `approveMediaPlan()` ahora es idempotente — reintentar solo procesa piezas pendientes/fallidas, sin duplicar ni re-pagar las ya generadas.
- [x] 9.13 Fix de fallback de modelos IA: `[activeModel, "deepseek/deepseek-v4-flash"]` deduplicaba a un solo modelo real; corregido a `[activeModel, "openrouter/free"]` (los únicos 2 con mapeo verificado en OmniRoute) + backoff de 5s en 429 + espaciado de 3s entre piezas.
- [x] 9.14 Bloqueo por cupo gratuito resuelto solo — reintentado más tarde, plan de prueba confirmado en 12/12 piezas generadas.
- [x] 9.15 Botón "📂 Retomar Plan de Medios" en VIDE — lista los últimos 10 planes (`GET /api/media-plan/recientes`), carga uno completo (`GET /api/media-plan/:id`) y reabre el panel vía `attachMediaPlanPanel()` (refactor compartido con "generar nuevo"). Verificado en vivo, sin bugs. Detalle en `.suit/memory/pending/plan-retomar-plan.md`.
- [x] 9.16 Botón "🎬 Generar Video" por pieza — reusa el mismo motor de VIDE (`generateVideVideo(overrideGuion)`), sin pipeline nuevo. Detalle en `.suit/memory/pending/plan-pieza-a-video.md`.
- [x] 9.17 Estilo Visual (Director + override manual) conectado al prompt `CAMP-BRIEFMARKER` — solo afecta la piel visual, nunca el copy. Verificado con caso real meme/caricatura: copy estratégico intacto en 12/12 piezas.
- [x] 9.18 **Bug encontrado en revisión**: el estilo visual no se fijaba por plan — un reintento (idempotente, 9.12) con el selector cambiado podía dejar piezas del mismo plan con estilos distintos. Corregido: `planes_medios.estilo_visual` (migración 008) se fija en la primera aprobación y se reusa en cualquier reintento posterior.

## P10 — Ollama local como 3er respaldo de IA (sesión 2026-08-02)

Detalle completo en `.suit/memory/pending/plan-ollama-fallback.md`.

- [x] 10.1 `callOllama()` — llama a Ollama local (`qwen2.5-coder:latest`, elegido tras probar 3 modelos reales en la máquina) vía `http.request` nativo, no `fetch()` (el `fetch` de undici tiene `headersTimeout` de 300s que mataba la respuesta en generación CPU-only de varios minutos).
- [x] 10.2 `callAIJson()` (MediaPlanner/BriefMarker) prueba Ollama como último recurso, solo si `[activeModel, "openrouter/free"]` ya fallaron ambos — no cambia el comportamiento normal.
- [x] 10.3 Validado con el prompt REAL de `CAMP-BRIEFMARKER` completo (no un prompt de prueba): 118.6s, 21/21 keys del schema, JSON válido.
- [x] 10.4 Validado en vivo: con la nube sana, Ollama nunca se invoca (plan real de 12 piezas, cero logs de fallback).
- [x] 10.5 Manejo de error sin nube ni Ollama disponibles validado por revisión de código (mismo patrón `try/catch` ya probado limpio varias veces esta sesión) — no se forzó una prueba en vivo disruptiva porque el usuario estaba usando la app en tiempo real durante la validación.

## P11 — Selector de alcance de producción (Completo/Semanal/Demo) (sesión 2026-08-02)

Detalle completo en `.suit/memory/pending/plan-alcance-produccion-briefmarker.md`.

- [x] 11.1 `approveMediaPlan(planId, estiloVisual, cap = 12)` — nuevo parámetro `cap` sanitizado (entero positivo, clamp 1–12, default 12 = comportamiento actual).
- [x] 11.2 `POST /api/media-plan/:id/aprobar` lee `cap` del body (sanitización idéntica a la función).
- [x] 11.3 Selector `#mediaPlanScope` (Completo 12 / Semanal 7 / Demo 4) en `#mediaPlanPanel`, antes de Aprobar/Rechazar; `onApprove()` lo lee y lo manda en el body.
- [x] 11.4 Validado en vivo con `plan_1785691044578` (8 slots, Noe Thermomix): aprobar en Demo(4) → exactamente 4 piezas, 4 sin procesar; volver a aprobar en Completo(12) → solo los 4 faltantes (8 total, 0 sin procesar), sin duplicar ni re-generar; aprobar sin cap → mismo comportamiento de hoy (0 nuevas).

## P12 — Reorganización visual de VIDE (sesión 2026-08-02)

El usuario reportó dificultad recurrente para encontrar botones y seguir la secuencia correcta en modo VIDE (varios flujos apilados sin separación visual). Reorganizado en 3 bloques con etiqueta y descripción de una línea cada uno, sin cambiar ningún ID ni lógica:

- [x] 12.1 **OPCIÓN A** — Video suelto desde guion (lo que ya existía: guion, Generar Video Completo, panel de revisión).
- [x] 12.2 **OPCIÓN B** — Campaña completa desde el Brief (Generar Plan de Medios, con los 4 pasos numerados en la descripción: generar → revisar/elegir alcance → aprobar → generar video por pieza).
- [x] 12.3 **RETOMAR** — Continuar un plan anterior.
- [x] 12.4 Verificado: balance de `<div>` correcto (162 abiertos = 162 cerrados), servidor sirviendo el HTML actualizado en vivo, ningún ID tocado (cero riesgo para `script.js`).

## P13 — Posicionamiento SEO multi-tenant (sesión 2026-08-02)

Detalle completo en `.suit/memory/pending/plan-posicionamiento-seo-multitenant.md`. Contexto clave: `grupoevasol.com` es el sitio real de EvaSol; los demás inquilinos son demos de prueba que NO deben indexarse para no diluir el SEO real.

- [x] 13.1 **F1.1** `noindex, nofollow` en toda página generada que no sea `EVASOL` (única `es_principal=true`). El link de demo sigue funcionando para abrir/mostrar a prospectos.
- [x] 13.2 **F1.2** `sitemap.xml` ahora lista solo `https://grupoevasol.com/evasol.html` (antes: 13 inquilinos con prioridad 0.8).
- [x] 13.3 **F1.3** `robots.txt` con `Disallow:` explícito por cada archivo de demo (14 rutas), `Allow: /` conservado para EvaSol + assets compartidos.
- [x] 13.4 **F1.4** `baseUrl` corregido de `suitorg.com` (dominio inexistente) a `https://grupoevasol.com`.
- [x] 13.5 **F2.1-2.2** OG/Twitter personalizados por inquilino (`og:title/description/image/url`, `twitter:*`), `og:url` apunta a la URL específica de cada página.
- [x] 13.6 **F2.3-2.4** `rel=canonical` + JSON-LD `LocalBusiness` solo en la página real de EvaSol (con datos reales: Evasol — Energía Solar, +528112710091, sirisenergiasolar@grupoevasol.com).
- [x] 13.7 **F2.5** Descripción/keywords reales para EvaSol derivadas de campos existentes (`giro_especifico`, `slogan`, `keywords_coma`) — sin migración de datos.
- [x] 13.8 **F2.6** Chrome de panel interno retirado de páginas públicas: Chart.js, consola "SYSTEM READY", indicador de salud de IA. `status-bar` se conserva (auth.js:112 lo requiere sin guard).
- [x] 13.9 **F3.1** Workflow `.github/workflows/ssg-regenerate.yml` (cron diario 03:00 UTC + dispatch) que corre `ssg-engine.mjs` y commitea `dist/` si cambió.
- [x] 13.10 **F3.2** Documentado: tras cada regeneración publicada hay que **resubmitir `https://grupoevasol.com/sitemap.xml` en Google Search Console** (Sitemaps → Enviar) — un sitemap actualizado que Google no vuelve a leer no sirve. También conviene pedir indexación de `evasol.html`.
- [ ] 13.11 **Fase 4 (radar, sin cambios)**: API keys hardcodeadas (`backend/core.js:13`, `SuitCampanas/script.js:8-11`, `scripts/agents/vision-audit.js:14`), CORS `*` en servidor local, sin rate limiting en endpoints públicos, `execSync` con `shell:true`. Deuda ya documentada.
- [ ] 13.12 **Fase 5 (cuando un inquilino de prueba se vuelva cliente real)**: decidir dominio/subdominio propio (`{tenant}.suitorg.com` o dominio del cliente) — no indexarse desde grupoevasol.com a largo plazo. Decisión de negocio, no ahora.
- [x] 13.13 **F1.5 (revisión SuitOS)** Bug encontrado en verificación independiente: `ssg-engine.mjs` nunca borraba páginas de inquilinos renombrados/eliminados de `Config_Empresas` — quedaban en `dist/` indexables (`index, follow`) con SEO genérico. Evidencia real: `roomateanl.html` (huérfano de un rename a `ROOMMATENL`), aún indexable pese al fix 13.1. Fix: `generatedFiles` Set + limpieza post-loop de cualquier `.html` en `dist/` que no esté en ese set. Re-ejecutado en vivo: eliminó `roomateanl.html` y un segundo huérfano (`.html`, de una fila vieja con `id_empresa` vacío, de antes de existir el guard `if (!coId) continue`). Ver ADR-022. `dist/` verificado post-fix: 16 archivos (1 indexable + 15 noindex), coincide exacto con los 17 inquilinos reales (SUITORG → `index.html`).
