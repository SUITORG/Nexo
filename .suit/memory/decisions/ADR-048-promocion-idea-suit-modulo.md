# ADR-048: Promoción automática idea-saas → módulo Suit*

## Status
Accepted (2026-10-10)

## Context
La skill `ideas-saas` (ADR-047) solo scaffoldeaba un MVP Python suelto en `SuitIdeasSaaS/<slug>/`, desconectado del ecosistema Suit* (Express, puerto único, projects.yaml, manuales). El usuario pide que la idea ganadora semanal se desarrolle **automáticamente** con el estándar completo y con manual de ventas.

## Decision
1. Al aprobar (juez ≥7.5), **promover la ganadora** a `Suit<NombrePascal>/`:
   - Mover el núcleo Python a `Suit<Nombre>/python/`.
   - Envoltorio Express estándar (`index.js` exporta `app`, puerto único) que spawn al núcleo Python (`db/client.js`, `PYTHONIOENCODING=utf-8`).
   - `package.json`, `.env.example`, `handlers/`, `docs/MANUAL_*.md`.
2. **`MANUAL_VENTAS.md`** (alias `ventas.md`) pasa a ser el **5º manual canónico** de `guia-total` (Pitch 60s · ICP · Precios · Objeciones · Script · Cierre · Qué NO prometer).
3. Registro completo: `projects.yaml`, ADR, MAPA, tabla de puertos AGENTS.md.
4. Reejecución "desde cero": borrar salidas de la corrida y disparar la skill (o `/ideas`).

## Rationale
- Cero rewrite: el MVP Python probado sigue siendo la fuente; Express solo lo expone como servicio del ecosistema (patrón SuitProductos/SuitPos).
- Ventas era el manual faltante de la cadena comercial (guia-total solo tenía cliente/proveedor/técnico/pruebas).
- Manual por-corrida (is-004) se mantiene: nada de cron.

## Consequences
- Todo proyecto nacido vía guia-total ahora exige 5 manuales, no 4.
- `SuitIdeasSaaS/` queda como cantera de ideas + informes; los aprobados viven en `Suit*/`.
- Puerto 3016 consumido (tabla AGENTS.md + projects.yaml).

## Alternatives Considered
- Reescribir en Node puro: reescribe el MVP validado y se aleja del stack "Python local" del pipeline.
- Dejar solo el scaffold Python: sin integración ecosistema ni ruta de venta.

## Related
- ADR-047 (pipeline ideas-saas)
- `.agents/skills/ideas-saas/SKILL.md` Etapa 4
- `.agents/skills/guia-total/SKILL.md` modo `manuales`
- `SuitReviewPulse/docs/MANUAL_VENTAS.md`
