# Plan: Botón "🎬 Generar Video" por pieza + Estilo Visual en CreatorEngine (BriefMarker → VIDE)

## Status
Ejecutado y validado (2026-08-01). Cambios aplicados y verificados end-to-end:
- Alias BriefMarker en `parseGuionScenes()` (shot/spoken/overlay/duration_seconds) — video real de 6 escenas generado desde una pieza sin conversor.
- Endpoint `GET /api/media-plan/:id/piezas` + botón por pieza en `#mediaPlanPiezas` vía `renderPlanPiezas()`.
- `generateVideVideo(overrideGuion = null)` — firma nueva, sin romper llamadas existentes.
- `estilo_visual` en `POST /api/media-plan/:id/aprobar` → `approveMediaPlan(planId, estiloVisual)`: 12/12 piezas aplican la piel visual indicada (meme/caricatura) manteniendo estrategia de copy (dolor/beneficio/CTA). Solo 1/12 hooks usa lenguaje del estilo (funcional para formato meme).
- Nota: la comparación de copy debe hacerse sobre la MISMA campaña, no entre planes distintos (cada aprobación regenera el copy completo).

### Revisión SuitOS (reviewer) — bug encontrado y corregido en el mismo turno
Verificado en código: alias de `parseGuionScenes()` correctos en los 2 branches, endpoint `/piezas` funcional en vivo (12/12 piezas reales), `estiloVisualSeleccionado` correctamente en scope global (no repite el bug de closure de `INDUSTRIAS_DATA` de ADR-017), `generateVideVideo(overrideGuion)` no rompe los 2 modos existentes.

**Bug encontrado**: `estiloTxt` se recalculaba en cada llamada a `approveMediaPlan()` usando el `estiloVisual` recién recibido — si un plan se reintenta (idempotencia de ADR-021, ej. tras un 429 a mitad del lote) con el selector de Estilo Visual cambiado entre una aprobación y otra, las piezas nuevas podían quedar con un estilo visual distinto a las ya generadas del MISMO plan — una campaña con mezcla de estilos sin que nadie lo pidiera.

**Fix**: nueva columna `planes_medios.estilo_visual` (migración `Documentacion/migrations/008_planes_medios_estilo_visual.sql`, aplicada). El estilo se persiste en la PRIMERA aprobación (`if (!plan.estilo_visual && estiloVisual) { UPDATE ... }`) y se reusa en cualquier reintento posterior (`plan.estilo_visual || estiloVisual`), garantizando estilo consistente en todas las piezas de un mismo plan sin importar cuántas rondas de aprobación hagan falta.

**Validación**: `node --check` limpio, servidor reiniciado, `GET /api/media-plan/plan_1785603243227/piezas` responde 12/12 piezas reales en vivo.

## Contexto
El pipeline Brief → MediaPlanner → BriefMarker (ADR-021) genera `creative_json` por pieza en `piezas_creativas`, pero se detiene ahí — no renderiza video. VIDE ya tiene el motor completo (`generateVideVideo()` → `POST /api/video-produce` → FFmpeg → descarga + Aceptar/Rechazar → guarda en `campanas`). Se pidió el puente lógico: un botón por pieza que dispare ESE MISMO motor, no uno nuevo.

### Hallazgo clave (evita duplicar código)
`parseGuionScenes()` (local-server-node.js:175-250), la función que ya usa `/api/video-produce`, es tolerante por diseño: acepta el guion como array plano o `{escenas:[...]}`, y para cada escena ya prueba varios alias de nombre de campo (`s.titulo || s.title || s.titulo_escena`, `s.texto || s.text || s.body || s.descripcion`, etc.). **Los nombres de campo de BriefMarker (`shot`, `spoken`, `overlay`, `duration_seconds`) no están en esos alias todavía** — agregarlos ahí (1 línea por campo, en los 2 branches de escenas) hace que el JSON de una pieza sea aceptado **tal cual**, sin necesidad de un conversor aparte en el frontend.

| BriefMarker (`creative_json.scenes[]`) | Alias a agregar en `parseGuionScenes()` |
|---|---|
| `shot` | `s.visual \|\| s.shot` |
| `spoken` | `s.texto \|\| s.text \|\| s.body \|\| s.descripcion \|\| s.spoken` |
| `overlay` | `s.texto_overlay \|\| s.titulo \|\| s.title \|\| s.overlay` |
| `duration_seconds` | `s.duracion \|\| s.duration_seconds \|\| (default calculado)` |

## Decision: reusar `generateVideVideo()`, no duplicar

En vez de un flujo paralelo, `generateVideVideo()` (script.js:2709+) se refactoriza para aceptar un **guion pre-armado opcional** (en vez de siempre leer `#videGuion`/`#videGuionJson`):

```js
async function generateVideVideo(overrideGuion = null) {
    // ...
    let guion;
    if (overrideGuion) {
        guion = JSON.stringify(overrideGuion, null, 2);
        guionParaGuardar = { tipo: 'VIDE', guion: overrideGuion, origen: 'briefmarker' };
    } else if (isJsonMode) {
        // ... (código existente sin cambios)
    } else {
        // ... (código existente sin cambios)
    }
    // resto de la función sin cambios: mismo /api/video-produce, mismo
    // #videReviewPanel de Aceptar/Rechazar, mismo guardado en `campanas`
}
```

El botón por pieza simplemente llama `generateVideVideo({ escenas: pieza.creative_json.scenes })` — **cero pipeline nuevo**, hereda automáticamente: descarga del mp4, panel de revisión, Aceptar/Rechazar, y guardado en Supabase (`campanas`, con `contenido_json` = el guion real usado, gracias al fix de ADR-021).

## Cambios necesarios

### 1. `local-server-node.js`
- Extender los alias de `parseGuionScenes()` (tabla arriba) en los 2 branches (array plano y `{escenas:[...]}`).
- **Nuevo endpoint** `GET /api/media-plan/:id/piezas` — hoy no existe forma de listar las piezas de un plan desde el frontend (`onApprove()` solo recibe un conteo). Devuelve las filas de `piezas_creativas` para ese `plan_id` (id, format, channel, goal, estado, creative_json).

### 2. `script.js`
- `generateVideVideo(overrideGuion = null)` — firma nueva, cambio mínimo descrito arriba.
- En `onApprove()` (dentro de `generateMediaPlanFromUI()`), después de mostrar el conteo: `fetch(`/api/media-plan/${planId}/piezas`)` y renderizar cada pieza en `#mediaPlanPiezas` con su formato/canal/goal + botón `🎬 Generar Video`.
- Cada botón: `onclick = () => generateVideVideo({ escenas: pieza.creative_json.scenes })`. Antes de llamar, verificar que `companyName` siga poblado con la empresa del plan (mismo campo que ya usa VIDE) — si el usuario cambió de empresa en el formulario desde que generó el plan, avisar con toast en vez de generar con datos cruzados.

### 3. Sin cambios en backend de `/api/video-produce` ni en el motor FFmpeg — ninguno de los dos se toca, solo se les da un nuevo origen de datos de entrada.

## Parte 2: Estilo Visual (Director + override del usuario) en el prompt del CreatorEngine

### Contexto
Hoy `approveMediaPlan()` solo pasa `audiencia/tono/objetivo/producto` al prompt `CAMP-BRIEFMARKER` — no usa el selector de Estilo Visual (el sistema "Director", ver ADR-014/script.js `showStyleSelector()`/`autoPickStyleByTrend()`). El usuario pidió conectarlo, con esta regla de precedencia explícita:

> El Director recomienda el estilo visual según tendencia de uso, pero si el usuario elige algo distinto a mano (ej. Director recomienda fotos/videos reales, pero el cliente quiere memes o caricaturas), **manda el usuario** — y ese cambio debe afectar SOLO la ejecución visual, nunca el copywriting (hook, dolor, beneficio, prueba, CTA, texto hablado). El fin siempre es que la campaña funcione.

### Por qué no hace falta lógica nueva de precedencia
La variable `estiloVisualSeleccionado` (script.js) **ya resuelve esta precedencia hoy**, para el guion normal de VIDE: `showStyleSelector()`'s `catSelect.onchange` la llena con la elección manual del usuario si elige una categoría real, o con el resultado de `autoPickStyleByTrend(empresa)` (el Director) si el usuario deja "🎯 Automático (recomendado por tendencias)". Por diseño, para cuando se necesita generar contenido, esa variable YA contiene "lo que manda" sin importar el origen. Solo falta **enviarla** al endpoint de aprobación, que hoy no la recibe.

### Cambios

**`script.js`** — en `onApprove()` (dentro de `generateMediaPlanFromUI()`), incluir el estilo resuelto en el POST:
```js
const res = await fetch(`/api/media-plan/${planId}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estilo_visual: estiloVisualSeleccionado || null })
});
```

**`local-server-node.js`** — `approveMediaPlan(planId, estiloVisual)` recibe el estilo y lo agrega al `userContent` de cada llamada a `CAMP-BRIEFMARKER`, con una instrucción explícita de alcance (solo visual, no copy):
```js
const estiloTxt = estiloVisual
    ? `\n\nDIRECCIÓN VISUAL A APLICAR: ${estiloVisual.cat} → ${estiloVisual.sub} (${estiloVisual.nombre}). Keywords: ${estiloVisual.keywords || 'N/A'}.
IMPORTANTE: esta dirección SOLO controla "visual_style", "editing" y "scenes[].shot" de cada escena (fotografía real, animación, meme, caricatura, ilustración, etc. — lo que indiquen las keywords). NO cambies el copy: "hook", "pain_point", "solution", "benefit", "proof", "cta", "emotion" ni "scenes[].spoken"/"scenes[].overlay" deben seguir sirviendo la misma estrategia de venta, solo con otra piel visual.`
    : '';
const userContent = `Slot a producir:\n${JSON.stringify({ ...slot, brief: {...} }, null, 2)}${estiloTxt}\n\nGenera el JSON creativo completo de esta pieza según el schema.`;
```
El endpoint `POST /api/media-plan/:id/aprobar` lee `estilo_visual` del body y lo pasa a `approveMediaPlan()`.

### Ejemplo concreto (dado por el usuario, usar como caso de prueba)
Director recomienda "Fotografía Real / Producto en Uso" (categoría existente en `estilos_visuales`), pero el usuario cambia manualmente a algo tipo "Meme / Caricatura" en el selector antes de aprobar → las 12 piezas deben describir en `scenes[].shot` y `visual_style` una ejecución de meme/caricatura, manteniendo el mismo hook/dolor/beneficio/CTA que ya se generó en el `plan_de_medios` (Fase MediaPlanner no se re-ejecuta, solo cambia cómo BriefMarker dibuja las escenas).

## Riesgo
Bajo — el único cambio de comportamiento existente es la firma de `generateVideVideo()` (parámetro opcional con default `null`, no rompe las 2 llamadas actuales sin argumento), los alias nuevos en `parseGuionScenes()` (solo agregan más formas de matchear, no quitan ninguna), y `estilo_visual` en `/aprobar` es un campo opcional del body (si no viene, `approveMediaPlan()` sigue funcionando exactamente igual que hoy — sin instrucción de estilo).

## Validación
- `node --check` en ambos archivos.
- Guion de texto plano y JSON existentes (los que ya usa VIDE) siguen funcionando igual — probar ambos modos sin regresión.
- Pieza real de `piezas_creativas` (ej. `pieza_plan_1785603243227_C1-1`) → botón → confirmar que `parseGuionScenes()` produce escenas con `body`/`visual`/`texto_overlay`/`duracion` no vacíos (antes del fix, todos quedarían vacíos porque ningún alias coincide con `shot`/`spoken`/`overlay`/`duration_seconds`).
- Aceptar el video generado → confirmar fila nueva en `campanas` con `modo:'VIDE'` y `contenido_json.origen === 'briefmarker'`.
- Aprobar un plan SIN tocar el selector de Estilo Visual (queda en "Automático") → confirmar que `estiloVisualSeleccionado` viaja con el resultado de `autoPickStyleByTrend()` (el Director), no vacío.
- Aprobar el mismo plan cambiando el selector a mano a una categoría distinta (ej. de "fotografía real" a algo tipo meme/caricatura) → confirmar en `piezas_creativas.creative_json` que `visual_style`/`scenes[].shot` reflejan la nueva dirección, pero `hook`/`pain_point`/`benefit`/`cta` se mantienen equivalentes en estrategia a una corrida sin ese cambio (mismo copy, otra piel visual) — caso de prueba del ejemplo dado por el usuario.

## Rollback
`git checkout -- local-server-node.js script.js` — sin migraciones, sin tablas nuevas.
