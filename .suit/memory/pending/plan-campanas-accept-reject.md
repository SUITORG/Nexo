# Plan: Aceptar/Rechazar campaña generada + persistencia del JSON completo (SuitCampanas)

## Status
Propuesto (2026-07-31) — NO ejecutado. Este archivo es la especificación para que otra sesión/CLI lo implemente.

## Contexto y diagnóstico (verificado en vivo, no hipótesis)

El usuario pidió: poder "grabar" la campaña generada (guardarla) o "negarla" (rechazarla) si no le gusta — mencionado específicamente para video (VIDE) — y que se mantenga el JSON completo, entendiendo que "se graba en GS y eventualmente se sincroniza a Supabase".

Investigación de la arquitectura actual encontró **2 bugs de raíz preexistentes que bloquean cualquier guardado**, más la ausencia total de un flujo de aceptar/rechazar para VIDE:

### Bug 1 — Columnas faltantes en `campanas` (Supabase)
`information_schema.columns` para `campanas`: `id, empresa, nombre, tema, formato, fecha_creacion, estado, configuracion, created_at`.

El código en `local-server-node.js:506-521` (`POST /api/campanas`) hace upsert con `activo`, `plataforma`, `modo`, `contenido`, `metadata` — ninguna de esas columnas existe.

Prueba real:
```
curl -X POST http://localhost:8000/api/campanas -H "Content-Type: application/json" -d '{...}'
→ {"status":"error","message":"Could not find the 'activo' column of 'campanas' in the schema cache"}
```

### Bug 2 — RLS activo sin políticas en `campanas`
```sql
SELECT relrowsecurity FROM pg_class WHERE relname='campanas'; -- true
SELECT * FROM pg_policies WHERE tablename='campanas'; -- 0 filas
```
El endpoint usa el cliente `supabase` (anon key, no `supabaseAdmin`). Con RLS activo y 0 políticas, el anon key no tiene permiso ni de SELECT ni de INSERT — deny-all por default de Postgres RLS.

### Por qué nadie lo notó
`script.js:783-854` (form submit) hace `try/catch` separado para GAS (Sheets) y Supabase, y muestra el toast de éxito si **cualquiera** de las dos respondió bien (`if (gasOk || supaOk)`). El fetch a GAS usa `mode:'no-cors'`, que **nunca lanza error por HTTP fallido** (respuesta opaca) — así que `gasOk` prácticamente siempre queda `true`, enmascarando que Supabase fallaba silenciosamente en cada intento.

### Bug 3 (funcional, no técnico) — VIDE nunca guarda nada
`generateVideVideo()` (script.js:2702-2854) llama a `/api/video-produce`, recibe el mp4 en base64, y lo descarga inmediatamente (`downloadFile(...)`). No llama a `/api/campanas` ni a ningún endpoint de guardado. No existe ningún punto de decisión "aceptar/rechazar" — el video se genera y se descarga sin pausa.

### Gap adicional — no existe lugar para el JSON completo
- Tabla `campanas`: no tiene columna para el guion/slides completo, solo `configuracion` (jsonb, hoy solo guarda flags de template/slides/voice/music/video) y `contenido` (texto, pensado para el caption).
- Hoja de Google Sheets "SMMC" (`backend.gs:105-112`): columnas `[UUID, Fecha, Caption, MediaUrl, PostDate, Status]` — 6 columnas, ninguna para JSON.
- No existe ninguna variable en `script.js` que retenga el objeto completo generado (`generateAIContent()`/`generateVideJson()`) después de pintarlo en el DOM — se pierde si no se captura en el momento.

## Decisión de diseño

1. **Fase 0 es prerequisito bloqueante** — sin arreglar columnas + RLS, cualquier feature nueva de guardado hereda el mismo fallo silencioso.
2. Para Ai/BD/BDPR/BDSMT (modo carrusel/imagen): **ya existe** un gate de aceptación implícito — el botón `submitBtn` (`type="submit"`) separado de `generateBtn` (`type="button"`). No se necesita UI nueva ahí, solo que el guardado funcione de verdad y cargue el JSON completo.
3. Para VIDE: **no existe ningún gate** — se agrega un panel de revisión nuevo con Aceptar/Rechazar antes de persistir (la descarga local del mp4 se mantiene igual, es independiente del guardado del registro).
4. El archivo de video (.mp4) **no se sube a ningún storage** en este plan — sigue siendo descarga local al navegador del usuario, igual que hoy. El registro persistido es el JSON del guion + metadata, no el binario. Si más adelante se quiere un `video_url` real y accesible (Drive/Supabase Storage), es una fase aparte — no la pidió el usuario y agrega superficie nueva (subida de archivos, cuotas, limpieza) sin necesidad confirmada.
5. El ping al Director (`/api/tendencias-estilo`, script.js:2831-2837) no se toca — sigue disparándose al generar (señal de "se usó este estilo"), no al aceptar. Cambiar esa semántica a "solo contar si el usuario aceptó" es una decisión de producto aparte, no pedida.

## Pasos de implementación

### Fase 0 — Reparar persistencia existente (bloqueante)

**Archivo nuevo**: `Documentacion/migrations/006_campanas_fix_schema.sql`
```sql
ALTER TABLE campanas
  ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS plataforma text DEFAULT '',
  ADD COLUMN IF NOT EXISTS modo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS contenido text DEFAULT '',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contenido_json jsonb DEFAULT '{}'::jsonb;

CREATE POLICY campanas_select ON campanas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY campanas_insert ON campanas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY campanas_update ON campanas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
```
Aplicar vía `mcp__claude_ai_Supabase__apply_migration` (project_id `egyxgnlnzanxpqyuvmsg`), no a mano.

**Nota de riesgo de las políticas abiertas**: mismo criterio ya usado en otras tablas de catálogo de este proyecto (single-tenant interno, sin `id_empresa` en `campanas`). Si en el futuro `campanas` necesita aislar por empresa, hace falta agregar la columna `id_empresa` y una policy con `current_setting('app.id_empresa')` (mismo patrón que ya usa `video_tendencias_estilo`) — no se hace ahora porque no hay ese requisito hoy.

**Verificación**: repetir el `curl POST /api/campanas` de este documento → debe responder `status: success`.

### Fase 1 — JSON completo en el flujo existente (Ai/BD/BDPR/BDSMT)

**`script.js`**:
- Variable de módulo nueva, junto a las demás globales (~línea 86): `let lastGeneratedContent = null;`
- En `generateAIContent()`, justo donde se llama `renderCarouselFromJson(data)` (buscar todos los call sites: modo normal, BDSMT), agregar `lastGeneratedContent = data;` antes o después de renderizar.
- En `generateVideJson()` (script.js:2466), al final donde se construye el objeto del guion (buscar dónde se escribe a `#videGuionJson`/`#videGuion`), agregar `lastGeneratedContent = { tipo: 'VIDE', guion: <objeto generado> };`.
- En el handler `form.addEventListener('submit', ...)` (script.js:809-836), agregar al payload de `/api/campanas`:
  ```js
  contenido_json: lastGeneratedContent || {},
  ```

### Fase 2 — Aceptar/Rechazar para VIDE

**`index.html`**: agregar panel oculto por defecto, cerca del botón `videGenerateBtn`:
```html
<div id="videReviewPanel" style="display:none;">
  <video id="videReviewPlayer" controls style="max-width:100%;"></video>
  <button type="button" id="videAcceptBtn">✅ Aceptar y Guardar</button>
  <button type="button" id="videRejectBtn">❌ Rechazar</button>
</div>
```

**`script.js`** — en `generateVideVideo()` (línea ~2818-2837), reemplazar el bloque que arma el blob y descarga inmediatamente:
- Guardar el blob en `window.lastVideoBlob` y la URL en `window.lastVideoBlobUrl`.
- Mostrar `#videReviewPanel`, asignar `videReviewPlayer.src = lastVideoBlobUrl`.
- NO llamar a `downloadFile()` todavía — se mueve al handler de Aceptar.
- El ping a `/api/tendencias-estilo` (líneas 2831-2837) se queda donde está (se dispara al generar, no al aceptar — ver Decisión de diseño punto 5).

Nuevos listeners:
```js
document.getElementById('videAcceptBtn').addEventListener('click', async () => {
  downloadFile(window.lastVideoBlobUrl, filename); // mismo nombre de archivo ya calculado en generateVideVideo
  await fetch('/api/campanas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `camp_${Date.now()}`,
      empresa: company,
      nombre: `Video ${company}`.substring(0, 100),
      tema: document.getElementById('aiTheme')?.value?.trim() || '',
      formato: format,
      plataforma: platform,
      modo: 'VIDE',
      contenido: 'Video generado',
      estado: 'aceptado',
      configuracion: { style, duration, voice, modules },
      contenido_json: lastGeneratedContent || {}
    })
  });
  document.getElementById('videReviewPanel').style.display = 'none';
  showToast('✅ Campaña de video guardada', 'success');
});

document.getElementById('videRejectBtn').addEventListener('click', () => {
  URL.revokeObjectURL(window.lastVideoBlobUrl);
  document.getElementById('videReviewPanel').style.display = 'none';
  showToast('❌ Video rechazado, no se guardó', 'info');
  // No se limpia #videGuion/#videGuionJson — el usuario puede editar y regenerar sin perder su guion
});
```
Variables `company`, `format`, `platform`, `style`, `duration`, `voice`, `modules`, `filename` ya existen dentro de `generateVideVideo()` — deben quedar accesibles en el closure de los nuevos listeners (definir los listeners dentro de la misma función, o capturar esos valores en variables de módulo al momento de generar).

**`backend.gs`** (requiere republicar el Apps Script manualmente tras el cambio — Deploy → Manage deployments → New version; ninguna CLI puede hacer ese paso):
```js
const rowData = [
  Utilities.getUuid(),
  new Date(),
  data.caption || "",
  data.mediaUrl || "",
  data.postDate || "",
  data.status || "Pending",
  JSON.stringify(data.contenidoJson || {})   // nueva 7ma columna
];
```
No hace falta tocar `doGet` a menos que se quiera listar el JSON en el historial también (fuera de alcance de este plan).

## Archivos a modificar
- `Documentacion/migrations/006_campanas_fix_schema.sql` (nuevo, documental — aplicar vía Supabase MCP)
- `SuitCampanas/script.js` — `lastGeneratedContent`, captura en `generateAIContent()`/`generateVideJson()`, payload del submit, panel Aceptar/Rechazar en `generateVideVideo()`
- `SuitCampanas/index.html` — `#videReviewPanel` nuevo
- `SuitCampanas/backend.gs` — 7ma columna en `rowData` (+ republicar deployment manualmente)

## Validación
- `node --check local-server-node.js script.js`
- Repetir el `curl POST /api/campanas` de este documento tras la migración → `status: success`
- Prueba real: generar guion VIDE → Aceptar → confirmar fila nueva en Supabase (`SELECT * FROM campanas ORDER BY created_at DESC LIMIT 1`) con `contenido_json` no vacío y `estado='aceptado'`, y fila nueva en la hoja SMMC con la 7ma columna con JSON no vacío
- Prueba real: generar guion VIDE → Rechazar → confirmar que NO aparece fila nueva en Supabase ni en Sheets
- Confirmar que el flujo Ai/BD/BDPR/BDSMT (submit normal) sigue guardando sin error después de la migración (regresión)

## Riesgo
Medio — toca 4 archivos en 3 capas (DB, backend Node, Apps Script, frontend), pero todos los cambios son aditivos (columnas nuevas con DEFAULT, campo nuevo opcional en payloads, botones nuevos) sin eliminar ni renombrar nada existente. El único paso no automatizable es republicar el Apps Script.

## Rollback
- Migración: `ALTER TABLE campanas DROP COLUMN activo, DROP COLUMN plataforma, DROP COLUMN modo, DROP COLUMN contenido, DROP COLUMN metadata, DROP COLUMN contenido_json;` + `DROP POLICY campanas_select, campanas_insert, campanas_update ON campanas;` — sin pérdida de datos reales, ya que hoy la tabla no tiene ninguna fila guardada con éxito (todo insert fallaba).
- Código: `git checkout -- SuitCampanas/script.js SuitCampanas/index.html SuitCampanas/backend.gs` (revertir Apps Script requiere además volver a publicar el deployment anterior manualmente).
