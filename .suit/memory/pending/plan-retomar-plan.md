# Plan: Retomar un plan de medios viejo por `plan_id` (botón en VIDE)

## Status
Ejecutado y validado (2026-08-02). Backlog 9.15 del ROADMAP — completo.

## Contexto
Hoy `planId` solo vive en una variable local dentro de `generateMediaPlanFromUI()`. Si el usuario recarga o cierra la pestaña después de generar/aprobar un plan, pierde toda forma de volver a ver el panel de piezas o de reintentar piezas con error — el plan sigue completo en Supabase, pero la UI no tiene manera de "reabrirlo". Confirmado hoy en vivo: pasó exactamente eso con `plan_1785603243227`.

## Decision: reusar el panel existente, no duplicar

`generateMediaPlanFromUI()` ya arma todo lo necesario (resumen, wiring de Aprobar/Rechazar, `renderPlanPiezas()`) pero solo a partir de una respuesta de `/generate`. Se extrae esa lógica a una función compartida:

```js
function attachMediaPlanPanel(planId, plan) {
    // Todo lo que hoy vive después de `const plan = data.data;` en
    // generateMediaPlanFromUI(): construir el resumen HTML, autoSelectIndustriaFromBrief,
    // definir onApprove/onReject, engancharlos a acceptBtn/rejectBtn.onclick,
    // y si plan.estado === 'aprobado' llamar renderPlanPiezas(planId, piezasEl) de una vez.
}
```

`generateMediaPlanFromUI()` (flujo "generar nuevo") y la nueva función de abajo (flujo "retomar viejo") llaman ambas a `attachMediaPlanPanel()` — un solo lugar donde vive la lógica del panel.

## Cambios

### 1. `local-server-node.js` — 2 endpoints nuevos, mismo patrón que los existentes

- **`GET /api/media-plan/recientes`** — últimos ~10 planes (`id, empresa, estado, total_slots, created_at`), `order by created_at desc`. Para poblar la lista de selección.
- **`GET /api/media-plan/:id`** — un plan completo por id (`select('*').eq('id', planId).single()`), para recargar `plan_de_medios`/`estado`/`total_slots` al retomar.

### 2. `index.html` — botón + lista, junto a `#videMediaPlanBtn`

```html
<button type="button" id="videResumePlanBtn" class="secondary-btn" style="width:100%; margin-top:0.5rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:var(--text-dim); padding:0.6rem; font-size:0.85rem;">
    📂 Retomar Plan de Medios
</button>
<div id="resumePlanList" style="display:none; margin-top:0.5rem; padding:0.5rem; background:rgba(255,255,255,0.04); border-radius:8px; max-height:200px; overflow-y:auto;"></div>
```

### 3. `script.js`

- `generateMediaPlanFromUI()` — refactor: extraer el bloque de resumen + wiring de botones a `attachMediaPlanPanel(planId, plan)`, llamarla después de `/generate`.
- Nueva `async function listRecentPlans()` — click de `videResumePlanBtn` → `GET /api/media-plan/recientes` → renderiza `#resumePlanList` con una fila por plan (empresa · estado · fecha) y un botón "Cargar" cada una (mismo patrón visual que `renderPlanPiezas()`).
- Nueva `async function resumeMediaPlan(planId)` — `GET /api/media-plan/:id` → muestra `#mediaPlanPanel` → llama `attachMediaPlanPanel(planId, plan)`.

## Riesgo
Bajo — solo lectura nueva (2 endpoints GET) + refactor de extracción (mismo comportamiento, sin tocar la llamada a `/generate` ni a `/aprobar`/`/rechazar`).

## Validación
- `node --check` en ambos archivos.
- Retomar `plan_1785603243227` real → confirmar que muestra el resumen correcto y las 12 piezas (ya generadas) con sus botones "🎬 Generar Video" funcionando igual que en el flujo normal.
- Retomar un plan con piezas en error → confirmar que "Aprobar" sigue siendo el mismo reintento idempotente (ADR-021) sin cambios.

## Rollback
`git checkout -- local-server-node.js script.js index.html` — sin migraciones.
