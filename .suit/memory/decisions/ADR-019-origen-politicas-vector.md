# ADR-019: origen_politicas como vector etiqueta:valor multifuncional

## Status
Accepted (2026-08-10)

## Context
`origen_politicas` era un campo simple (`ROL` o `USUARIO`) que decidía de dónde toma el usuario sus permisos al hacer login. Se necesita reutilizar el mismo campo para activar flags adicionales (`presentacion`, `lp`) sin cambiar el nombre ni romper el comportamiento existente.

## Decision
Convertir `origen_politicas` en un vector delimitado por `|` con formato `etiqueta: valor`:

- `op`: ROL o USUARIO (único valor en producción, obligatorio por convención)
- `presentacion: SI`: activa modo presentación
- `lp: si`: activa landing page

Se añade `parseOrigenPoliticas(raw)` en `js/modules/core.js` (patrón heredado de `resolveLogoUrlParts`) que devuelve `{op, presentacion, lp}`.

## Rationale
- Mismo campo = mismo origen de datos, sin migración de schema
- Backward compatible: `ROL`/`USUARIO` sin etiqueta se siguen leyendo como `op`
- Si `op`, `presentacion` o `lp` faltan, el código no se rompe (`op` cae a default `ROL`)
- Reusa el patrón de vector `label:value` ya establecido en `core.js`

## Consequences
- El login (`js/modules/auth.js`) ahora lee `parseOrigenPoliticas(...).op` en lugar del valor crudo
- `presentacion`/`lp` aún no tienen consumidores; el parser ya los expone para uso futuro
- Documentado en `Documentacion/02-tablas-campos.md`

## Alternatives Considered
- Crear campos nuevos (`usa_presentacion`, `usa_lp`): más columnas, no aprovecha nombre existente
- JSON en el campo: menos legible para edición manual en GSheets/Supabase

## Related
- AGENTS.md: Immutable rules
- `js/modules/core.js:15` (`resolveLogoUrlParts` — patrón base)
- `js/modules/auth.js:58` (consumidor de `op`)