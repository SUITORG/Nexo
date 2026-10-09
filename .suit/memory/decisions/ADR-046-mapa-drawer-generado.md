# ADR-046: Drawer INFO de MAPA_VISUAL generado desde MAPA.md

## Status
Accepted (2026-10-09)

## Context
`GuiaTotal/MAPA_VISUAL.html` mantenía a mano un objeto `INFO['§']` (título, pasos, skills, GAS, archivos, lista de skills ajenas) que duplicaba el contenido de `GuiaTotal/MAPA.md`. Al editar una sección del mapa, el drawer se desincronicaba silenciosamente — solo se detectaba a ojo.

## Decision
MAPA.md es la **fuente única**. El bloque `INFO` se genera con `node scripts/gen-mapa-info.js` (marcadores `// @GEN:INFO-BEGIN/END`) y `scripts/check-map-visual.js` valida el check **1c**: si `buildInfoBlock(MAPA.md)` ≠ bloque embebido → `FAIL (1) "INFO desincronizado"`. El check 1c sale de la misma función que el generador (mismo parser, cero deriva).

## Rationale
- Un solo lugar que editar (MAPA.md); el HTML es artefacto derivado
- Falla ruidosa en CI/local en vez de drift silencioso
- Sin dependencias nuevas: `node` + el parser ya existente; idempotente (`--check` no escribe)

## Consequences
- Flujo obligatorio: editar MAPA.md → `gen-mapa-info.js` → `check-map-visual.js` (documentado en MAPA.md nodo CIERRE, AGENTS.md paso 5, syncnote del HTML)
- El bloque INFO ya no se edita a mano (si se edita, el check lo detecta)
- Secciones no numeradas (APERTURA/CIERRE/dependencias) no entran al drawer (igual que antes)

## Alternatives Considered
- Parser en el cliente al cargar: re-parsing de Markdown en cada open (más lógica en runtime, sin validación en build)
- Sincronizar a mano con checklist: el drift de oct-2026 probó que no escala

## Related
- `scripts/gen-mapa-info.js`, `scripts/check-map-visual.js` (check 1c)
- Commit `4b7ad93` (ciclo f6/mapa-drawer)
