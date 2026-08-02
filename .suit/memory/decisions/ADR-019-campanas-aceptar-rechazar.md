# ADR-019: Aceptar/Rechazar campaña generada + persistencia del JSON completo

## Status
Accepted (2026-08-01)

## Context
El usuario pidió poder "grabar" (guardar) o "negar" (rechazar) una campaña generada — específicamente para video (VIDE), donde hoy el mp4 se descarga automático sin ningún punto de decisión — y que se mantenga el JSON completo del guion, no solo un caption. Plan previo: `.suit/memory/pending/plan-campanas-accept-reject.md`.

Investigación previa a implementar encontró 2 bugs de raíz preexistentes que bloqueaban CUALQUIER guardado:
1. Tabla `campanas` en Supabase no tenía las columnas que el código ya intentaba escribir (`activo`, `plataforma`, `modo`, `contenido`, `metadata`) — cada POST fallaba con error de Postgrest, enmascarado porque el frontend consideraba "éxito" si Sheets (vía `no-cors`, que nunca lanza error) respondía, aunque Supabase fallara.
2. RLS activo en `campanas` con 0 políticas → deny-all para el cliente anon, incluso después de arreglar columnas.

## Decision

### Fase 0 — Reparar persistencia (prerequisito)
`Documentacion/migrations/006_campanas_fix_schema.sql`: agrega columnas faltantes + `contenido_json jsonb` (nueva, para el guion/slides completo) + políticas RLS abiertas (`anon`/`authenticated`, SELECT/INSERT/UPDATE) — mismo criterio que el resto de tablas de catálogo de este proyecto de un solo tenant.

### Fase 1 — JSON completo en el flujo Ai/BD/BDPR/BDSMT existente
Variable de módulo `lastGeneratedContent` capturada en cada punto donde se genera contenido (`generateAIContent()` normal y BDSMT, `generateVideJson()`, `renderCarouselPreview()` en sus dos rutas) y enviada como `contenido_json` en el submit normal (`form submit` → `/api/campanas`) y como `contenidoJson` a GAS (`backend.gs`, 7ma columna en la hoja SMMC).

### Fase 2 — Aceptar/Rechazar explícito para VIDE
Panel `#videReviewPanel` (index.html) con `<video controls>` + botones ✅ Aceptar y Guardar / ❌ Rechazar. `generateVideVideo()` ya no descarga automático: muestra el panel con el blob generado. Aceptar → descarga + `POST /api/campanas` (`modo:'VIDE'`, `estado:'aceptado'`). Rechazar → libera el blob (`URL.revokeObjectURL`), no persiste nada.

## Bugs encontrados en revisión (SuitOS reviewer) y corregidos en el mismo turno

Ejecución inicial delegada a otra sesión/CLI siguiendo el plan. Revisión posterior (yo, como reviewer) encontró 2 bugs de correctitud reales, ambos con el mismo patrón de causa raíz: `lastGeneratedContent` se actualizaba en algunos puntos de entrada pero no en todos los que terminan en un guardado, dejando JSON viejo o vacío persistido sin ningún error visible.

1. **VIDE modo texto** (script.js, handler de Aceptar en `generateVideVideo()`): si el usuario escribe el guion directo en `#videGuion` (sin pasar por "Generar JSON"), `generateVideJson()` nunca se ejecuta, así que `lastGeneratedContent` quedaba con lo de una generación anterior no relacionada (o vacío). **Fix**: se dejó de depender de `lastGeneratedContent` en este handler; ahora se construye `guionParaGuardar` en el mismo bloque que resuelve `guion` (la variable que de verdad se envía a `/api/video-produce`), con forma `{tipo:'VIDE', guion: <objeto>}` en modo JSON o `{tipo:'VIDE', guion_texto: <string>}` en modo texto — garantiza que lo guardado sea exactamente lo generado, sin importar el modo.
2. **BDPR texto libre** (`renderCarouselPreview()`, ruta de fallback por regex cuando el texto pegado no es JSON): nunca asignaba `lastGeneratedContent`. **Fix**: se agregó `parsedSlidesForSave` poblado dentro del mismo `forEach` que ya extrae `title`/`body`/`visual` por slide, y se asigna `lastGeneratedContent = { slides: parsedSlidesForSave }` al terminar el loop.

## Validación
- `node --check script.js local-server-node.js` ✓
- Migración verificada en vivo: columnas + 3 políticas RLS confirmadas por `information_schema`/`pg_policies` directo contra Supabase (`egyxgnlnzanxpqyuvmsg`)
- `curl POST /api/campanas` (antes roto) → `status: success`, verificado 2 veces (antes y después del fix de los bugs de revisión)
- Prueba específica del fix #1: `POST /api/campanas` con `contenido_json:{tipo:'VIDE', guion_texto:...}` simulando el flujo de modo texto → confirmado vía `GET /api/campanas` que persiste el guion real, no vacío
- Sin datos de prueba huérfanos en `campanas` (limpiados tras cada verificación)

## Files
- `Documentacion/migrations/006_campanas_fix_schema.sql` (nuevo)
- `SuitCampanas/local-server-node.js` — `contenido_json` en upsert de `/api/campanas`
- `SuitCampanas/script.js` — `lastGeneratedContent`, `guionParaGuardar`, panel de revisión VIDE, fix de los 2 bugs de esta ADR
- `SuitCampanas/index.html` — `#videReviewPanel`
- `SuitCampanas/backend.gs` — 7ma columna JSON en hoja SMMC (**pendiente republicar el Apps Script manualmente** — clasp push quedó colgado esperando auth interactiva, ninguna CLI puede completarlo)

## Consequences
- El archivo .mp4 sigue sin subirse a ningún storage — el registro persistido es el JSON del guion, no el binario (decisión de alcance original, no cambió).
- Pendiente acción manual del usuario: republicar el deployment de `backend.gs` en Google Apps Script para que la 7ma columna de la hoja SMMC quede activa (sin esto, Sheets sigue recibiendo el POST pero ignora el campo JSON extra hasta republicar).
