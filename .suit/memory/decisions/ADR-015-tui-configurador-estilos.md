# ADR-015: TUI Configurador de Estilos Visuales (Supabase en vivo)

## Status
Accepted (2026-07-30)

## Context
El usuario esperaba ver los estilos visuales (artístico/editorial/animación/cinematográfico y sus sub-estilos) al abrir la TUI existente (`configurador-formatos.js`), pero esa TUI nunca los tuvo — se construyó solo para el catálogo Formatos×Redes, con datos fijos desde `GUIAFMTRRSS.MD` (`MATRIZ`, sin conexión a base de datos). No es una regresión: son dos datasets distintos y la TUI de formatos jamás leyó estilos. Confirmado que no existe ningún otro archivo TUI en el proyecto que lo hiciera.

## Decision
Nueva TUI **separada** `scripts/configurador-estilos.js` — no se fusiona con `configurador-formatos.js` para no romper la limpieza/minimalismo ya pedido para el selector de estilos web (mismo criterio aplica aquí: un dataset por pantalla). A diferencia de la TUI de formatos, esta sí se conecta a Supabase en vivo (`@supabase/supabase-js` + `.env`, mismo patrón que `local-server-node.js`) — refleja cualquier cambio en `video_categorias_estilo`/`video_subestilos` sin tocar código.

## Diseño
- Un solo `blessed.list` con navegación en 2 niveles: categorías → al elegir (Enter) muestra sus sub-estilos con "← Volver a categorías" como primer ítem.
- Panel de info: en categorías muestra descripción + conteo de sub-estilos; en sub-estilos muestra descripción + `keywords_ia` + `tendencia_base`.
- Reutiliza las correcciones ya aprendidas en `configurador-formatos.js` (ver ADR-013): evento `'select item'` para preview por teclado (no `'highlight'`, que no existe en blessed), `attachHoverListeners()` para hover real con mouse.
- Manejo de error si Supabase no conecta: se muestra en la lista, no crashea.

## Alcance no incluido (pendiente si se pide)
- No agrega ni edita datos (solo lectura) — no hay "Tipografía" como categoría porque no existe en Supabase hoy; el usuario decidió dejarlo para después ("lo vemos luego"), igual que efectos de texto/rotación.

## Files
- `scripts/configurador-estilos.js` (nuevo)
- `.suit/workflows/configurador-estilos.yaml` (nuevo)
- `.suit/registry/workflows.yaml` — entrada `configurador-estilos`
- `opencode.json` — comando `suit:configestilos`

## Dependencies
- `@supabase/supabase-js` (ya existente en package.json)
- `blessed` (ya existente, usado por `configurador-formatos.js`)

## Validación
- `node --check scripts/configurador-estilos.js` ✓
- Consulta real a Supabase (misma lógica que la TUI, corrida standalone): devuelve las 4 categorías con sus 3 sub-estilos cada una, keywords_ia incluidas ✓
- `node scripts/configurador-estilos.js` corrido con timeout: arranca sin crash, solicita los modos de mouse correctos (1000/1002/1003/1005), sale limpio ✓
- `opencode.json` y los YAML de registro/workflow validados sintácticamente ✓
