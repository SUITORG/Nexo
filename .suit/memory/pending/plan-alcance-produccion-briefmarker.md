# Plan: Selector de alcance de producción (Completo / Semanal / Demo) para BriefMarker

## Status
Ejecutado y validado (2026-08-02).

## Contexto y motivación
El usuario pidió poder generar campañas más chicas para probar más rápido distintas combinaciones de sector + Estilo Visual + Tipo de Plantilla, sin gastar las 12 llamadas completas de BriefMarker cada vez. Propuesta original: 3 versiones del botón "Generar Plan de Medios" (completo, 7 piezas/semanal, 3-4 piezas/demo).

**Decisión de diseño (mejora sobre la propuesta original, confirmada con el usuario)**: no se crean 3 botones ni 3 flujos. El usuario explícitamente pidió que "la parte original esté libre de elegir el límite que necesite la campaña según los expertos de MediaPlanner y CreatorEngine" — es decir, el MediaPlanner (1 llamada barata) debe seguir proponiendo el plan que considere correcto, sin que se le pida un plan más chico. Lo que varía es **cuántas de esas piezas propuestas produce realmente el CreatorEngine/BriefMarker** al aprobar (la parte cara, hasta N llamadas de IA). Esa distinción ya existe en el código: `approveMediaPlan()` ya recorta a un cap fijo de 12 (`capped = slots.slice(0, 12)`), ordenado por prioridad — solo hace falta que ese número sea elegible por el usuario en vez de estar fijo.

Bonus de este enfoque: gracias a que `approveMediaPlan()` ya es idempotente (ADR-021), aprobar primero en modo Demo y después volver a aprobar en modo Completo sobre el MISMO plan solo genera las piezas que faltan — no repite ni re-paga las ya hechas. Se puede "subir de nivel" una demo sin regenerar el plan.

## Decision

### 1. `local-server-node.js`
- `approveMediaPlan(planId, estiloVisual = null, cap = 12)` — nuevo parámetro `cap`. Sanitizar: entero positivo, clamp entre 1 y 12 (12 sigue siendo el techo de seguridad ya existente, no se sube). Si viene inválido/ausente, default 12 (comportamiento actual sin cambios).
  ```js
  const capped = slots.slice(0, cap);
  ```
- `POST /api/media-plan/:id/aprobar` — leer `parsedBody.cap` del body y pasarlo a `approveMediaPlan()`:
  ```js
  const capRaw = parseInt(parsedBody.cap);
  const cap = (Number.isInteger(capRaw) && capRaw > 0) ? Math.min(capRaw, 12) : 12;
  const result = await approveMediaPlan(aprobarMatch[1], parsedBody.estilo_visual || null, cap);
  ```

### 2. `index.html`
En `#mediaPlanPanel`, antes de los botones Aprobar/Rechazar, agregar un selector:
```html
<div class="input-wrapper" style="margin-bottom:0.5rem;">
    <label for="mediaPlanScope" style="font-size:0.7rem;">Alcance de producción</label>
    <select id="mediaPlanScope" style="width:100%; padding:0.4rem; font-size:0.8rem; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; border-radius:6px;">
        <option value="12" selected>🎯 Completo (hasta 12, según MediaPlanner)</option>
        <option value="7">📅 Semanal (7 piezas)</option>
        <option value="4">🧪 Demo (4 piezas)</option>
    </select>
</div>
```

### 3. `script.js`
En `onApprove()` (dentro de `attachMediaPlanPanel()`), leer el selector y mandarlo en el body:
```js
const scopeSel = document.getElementById('mediaPlanScope');
const cap = scopeSel ? parseInt(scopeSel.value) || 12 : 12;
const res = await fetch(`/api/media-plan/${planId}/aprobar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estilo_visual: estiloVisualSeleccionado || null, cap })
});
```

## Fuera de alcance (a propósito)
- `generateMediaPlan()`/el prompt de `CAMP-MEDIAPLANNER` no se tocan — el plan estratégico siempre sale completo, tal como el usuario pidió.
- No se sube el techo de seguridad de 12 — el selector solo permite valores iguales o menores, nunca mayores.

## Riesgo
Bajo. Cambio aditivo: parámetro opcional con default igual al comportamiento actual (`cap=12`), no rompe ninguna llamada existente al endpoint ni al panel.

## Validación
- `node --check` en `local-server-node.js` y `script.js`.
- Aprobar un plan real en modo Demo (4) → confirmar exactamente 4 `piezas_creativas` generadas (o menos si el plan propuesto tiene menos slots), `sin_procesar` reflejando el resto.
- Sobre el mismo plan, cambiar el selector a Completo y volver a Aprobar → confirmar que solo se generan las piezas faltantes (hasta 12), sin duplicar ni re-generar las 4 de la corrida Demo.
- Aprobar sin tocar el selector (default) → mismo comportamiento de hoy (cap 12).

## Rollback
`git checkout -- local-server-node.js index.html script.js` — sin migraciones.
