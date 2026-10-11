# ADR-051: Ideas Verificadas + Go-to-Market automático (ciclo natural completo)

## Status
Accepted (2026-10-10)

## Context
Las primeras corridas de `ideas-saas` (ADR-047/048/049) generaban ideas y evaluaban con el panel, pero sin investigación web real ("ideas rápidas"). El usuario pidió elevar la automatización al máximo: mantener el modo rápido, añadir un modo **verificadas** con el ciclo natural completo (análisis → síntesis → re-juez con evidencia) y encadenar la comercialización (brief, activos "que solo hace el cliente", web/SEO, registro de datos) sin intervención manual.

## Decision
Extender `ideas-saas` con dos etapas nuevas y 2 modos:

- **Modo VERIFICADAS (default):** tras el panel, Etapa **2V** = `analista-proy` (investigación web real) → `sintesis-proyecto` → RE-JUEZ con evidencia. Gate de re-verificación = **7.5** (mismo gate; si baja, se para y se reporta qué cayó; si se mantiene, sigue sola).
- **Etapa 4G — Go-to-market automático** (tras la promoción Etapa 4):
  - BRIEF desde plantilla `GuiaTotal/plantillas/brief-cliente.md` (21 segmentos, `id_empresa: null`).
  - Decisión de datos documentada: herramienta de config → YAML/texto sin web · venta a clientes → Supabase `leads_<slug>` · multi-tenant GS → cadena `empresa-mascara`.
  - ¿Web? Si vende a clientes → landing sí (plantilla `GuiaTotal/plantillas/landing-leads/` extraída de ContractRenew: tokens + handler leads + hero Flow). SEO (clusters/paginas) solo si multi-tenant GS.
  - Activos LAPVTFU 100% automáticos con Google Flow MCP (`generate-asset.cjs`, chat vía CDP — ADR-050), sin pedirle nada al cliente.
- **Modo RÁPIDAS** (`/ideas --rapidas`): comportamiento original, sin 2V ni 4G.

## Rationale
- Reuso RUCP: 0 código nuevo donde ya existe (analista-proy, sintesis-proyecto, panel-juzgador, brief-engine, plantilla ContractRenew, Flow MCP).
- Sin investigación real, el gate de 7.5 aprueba falsos positivos; el re-juez con evidencia lo corrige antes de gastar en build.
- Sin landing/leads no hay captura; la automatización debe cerrar el ciclo hasta venta, no solo hasta MVP.

## Consequences
- Corridas en modo verificadas tardan más (investigación + doble juzgamiento + activos Flow con Chrome dedicado).
- Contrato inicial validado: ContractRenew replicado como plantilla (landing-leads + brief) — la próxima corrida verificada los reutiliza.
- Si Flow/UI cambia, 4G.5 degrada a `[PENDIENTE - Activo]` sin bloquear el resto de la cadena.

## Alternatives Considered
- Exigir confirmación humana tras el re-juez: rechazado (automatización máxima pedida; el gate 7.5 doble ya es la señal).
- Generar landing siempre (incluso herramientas de config): rechazado (YAGNI — sin clientes no hay captura).

## Related
- `.agents/skills/ideas-saas/SKILL.md` (Etapa 2V, 4G)
- `GuiaTotal/plantillas/landing-leads/`, `GuiaTotal/plantillas/brief-cliente.md`
- ADR-047 (pipeline), ADR-048 (promoción), ADR-049 (ContractRenew), ADR-050 (Flow MCP)
