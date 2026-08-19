# ADR-017: Industria/Nicho/Especialización 100% desde Supabase (eliminado hardcode)

## Status
Accepted (2026-07-31)

## Context
Diagnóstico de terceros (validado con `mcp__claude_ai_Supabase__execute_sql` contra el proyecto `egyxgnlnzanxpqyuvmsg`) confirmó que `<select id="aiIndustry">` en `index.html` traía opciones hardcodeadas y `populateNichos()` usaba un mapa local `INDUSTRIAS_NICHOS`, ignorando las tablas reales `industrias`/`nichos` en Supabase (que ya tenían 22 industrias y 85 nichos, más ricas que el hardcode — incluida "Hogar y Servicios del Hogar", agregada el mismo día). Solo `ESPECIALIZACIONES` (vía `initCategoriaLookup()`) ya leía de la API real.

Corrección aplicada por sesión de CLI paralela (fuera de este chat); esta ADR documenta y verifica ese cambio contra el código actual, no lo re-implementa.

## Decision
1. `index.html:466-468` — `<select id="aiIndustry">` vaciado a un placeholder; ya no hardcodea opciones.
2. `script.js` — `populateIndustrias()` (nueva) llena el select desde `INDUSTRIAS_DATA.clasificacion` (ya cargado por el fetch existente a `/api/industrias`). `populateNichos()` reescrita para buscar el grupo en `INDUSTRIAS_DATA` en vez de en el mapa `INDUSTRIAS_NICHOS`, que fue eliminado por completo (confirmado por grep: cero referencias restantes en el repo).
3. **Valor del `<option>` de industria = `id` numérico de Supabase** (`String(grupo.id)`), no un slug — porque la tabla `industrias` no tiene columna slug, solo `id`/`categoria`/`icono`/`descripcion`. Los `<option>` de **nicho** sí siguen usando `n.valor` (slug), que es lo que consume el resto del pipeline (`ESPECIALIZACIONES`, `INDUSTRIA_CATEGORIA`, `INDUSTRY_LABELS`, matching de tendencias, prompt maestro).
4. `suggestTheme()` — el fallback de etiqueta cuando `INDUSTRY_LABELS[ind]` no matchea (ahora `ind` puede ser un id numérico) usa el texto del `<option>` seleccionado en vez de caer a `'tu sector'`.
5. Fallback offline (`config/industrias.json`, sin Supabase) no tiene `id` tampoco — mismo patrón: `populateIndustrias()` ya contempla `grupo.id !== undefined ? String(grupo.id) : grupo.categoria`, así que el fallback sigue funcionando con `categoria` como value.

## Riesgo evaluado: value=id en vez de slug para industria
Todo el código que combina industria/nicho usa el patrón `aiNicho ? aiNicho.value : aiIndustry.value` (11 sitios en `script.js`). Si el usuario selecciona industria pero **no** nicho, ese fallback pasa un id numérico (p. ej. `"33"`) donde antes pasaba un slug legible, a: búsqueda de tendencias (`/api/trends/fetch`), `getCategoriaIndustria()` (contexto del prompt maestro), y el payload de BDPV. En los tres casos el efecto es degradado (resultado menos relevante / campo vacío), nunca un crash — y es un camino de UI que el propio flujo desalienta (nicho se puebla automáticamente al elegir industria). Se acepta el riesgo: no existe columna slug a nivel industria en Supabase, e inventar una agrega una migración/mantenimiento no pedido por el usuario para un caso límite sin impacto funcional grave.

## Files
- `SuitCampanas/index.html` — select de industria vaciado
- `SuitCampanas/script.js` — `populateIndustrias()` (nueva), `populateNichos()` reescrita, `suggestTheme()` fallback, `INDUSTRIAS_NICHOS` eliminado

## Validación (esta sesión, contra el servidor real)
- `node --check script.js` y `node --check local-server-node.js` ✓ (local-server-node.js no se tocó; el endpoint `/api/industrias` ya existía)
- `grep -r INDUSTRIAS_NICHOS` → 0 resultados en todo el repo (sin código muerto ni otros consumidores rotos)
- `GET http://localhost:8000/api/industrias` en vivo → `status: success`, 22 industrias, incluye "Hogar y Servicios del Hogar" (`id: 33`) con sus 4 nichos reales (`jardineria`, `lavanderia_tintoreria`, `limpieza_hogar`, `reparaciones_hogar`)
- Revisados los 11 sitios que leen `aiIndustry.value`/`aiNicho.value` en `script.js`: todos usan el patrón de fallback nicho→industria, ninguno rompe (degradación aceptada arriba, sin excepciones no controladas)

## Consequences
- **Fase 2 (pendiente, pedida por el usuario, NO iniciada)**: exportar `industrias`/`nichos` a Google Sheets. Ambigüedad resuelta con el usuario (2026-07-31): **Opción A** — 2 hojas (Industrias, Nichos), sin hoja separada para especializaciones; en la hoja de Nichos, la columna `especializaciones` (y `sinonimos`) va en una sola celda con los valores separados por coma, igual que hoy en Supabase. No se crea una tercera hoja/tabla normalizada.
- Si en el futuro se necesita el id de industria en un contexto legible (logs, exportes), agregar una columna slug a `industrias` es la vía correcta — no reconstruirla en el frontend.
