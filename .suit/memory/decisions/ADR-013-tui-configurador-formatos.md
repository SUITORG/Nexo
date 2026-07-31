# ADR-013: TUI Configurador de Formatos y Redes Sociales

## Status
Accepted (2026-07-30)

## Context
Se necesita una herramienta interactiva para consultar la compatibilidad entre formatos de contenido (Reel, Story, Post, Banner, Video Largo) y redes sociales, basada en la matriz de GUIAFMTRRSS.MD.

## Decision
Implementar una TUI (Terminal User Interface) con blessed para Node.js, registrada como comando `suit:configformatos` en opencode.json.

## Rationale
- blessed es la biblioteca estándar para TUI en Node.js
- No requiere servidor web ni navegador
- Se ejecuta directamente en la terminal del desarrollador
- Soporta mouse, teclado (vi keys), y eventos focus/hover

## Implementation
- `scripts/configurador-formatos.js`: script principal con blessed
- Dos columnas: Formatos (izquierda) y Redes Sociales (derecha)
- Filtros cruzados mutuamente excluyentes
- Panel inferior con información del formato seleccionado (medidas, objetivo, duración)
- Botón "Restablecer" para limpiar filtros
- Navegación: flechas, Tab, Enter, Q para salir

## Dependencies
- blessed (npm)

## Registry
- `.suit/registry/workflows.yaml`: configurador-formatos
- `.suit/workflows/configurador-formatos.yaml`: workflow definition
- `opencode.json`: comando suit:configformatos

## Related
- `SuitCampanas/GUIAFMTRRSS.MD` — fuente de datos de la matriz formatos×redes (ruta corregida: el archivo vive dentro de SuitCampanas, no en la raíz de SuitOrg donde corre este script)

## Corrección post-prueba real del usuario (2026-07-30)
El usuario probó la TUI y reportó que nada de lo descrito en "Navegación" funcionaba (info panel no se actualizaba al navegar, botón Restablecer inalcanzable por teclado). Verificado contra el código fuente real de `blessed` instalado (`node_modules/blessed/lib/widgets/list.js`):

1. **`'highlight'` no existe como evento de `blessed.List`** — el código original escuchaba `formatosList.on('highlight', ...)` / `redesList.on('highlight', ...)`, pero ese evento nunca se emite (blessed solo emite `'select'`, `'action'`, `'select item'`, `'cancel'`, etc.). Era código muerto: el panel de info solo se actualizaba una vez al enfocar la lista (evento `'focus'`, que sí es real), nunca al moverse con flechas. Corregido a `'select item'` (el evento real que `List.prototype.select()` emite en cada movimiento, incluyendo navegación por teclado).
2. **Botón "Restablecer" inalcanzable por teclado** — el ciclo de Tab solo alternaba entre `formatosList` y `redesList`; el botón nunca entraba en el ciclo de foco, así que solo se podía activar con mouse. Corregido: Tab ahora cicla entre las 3 (formatos → redes → botón → formatos).
3. **Hover real con mouse (2026-07-30, corregido)**: cada item de lista SÍ soporta `'mouseover'` nativo (capacidad de `blessed.Element`), pero el código original solo escuchaba eventos a nivel de la lista completa (`select`/`select item`/`focus`), ninguno de los cuales dispara con solo pasar el mouse sin click. Se agregó `attachHoverListeners(list, names, updateFn)`, que recorre `list.items` (arreglo interno de las cajas reales de blessed) y engancha `'mouseover'` a cada una — se re-llama después de cada `setItems()` (los items se recrean, así que los listeners viejos mueren con ellos) y una vez para los items iniciales.

## Nota de alcance
Esta TUI es una herramienta de referencia/consulta independiente para que un humano decida la combinación formato↔red antes de generar contenido — usa su propio catálogo de 5 formatos (fiel a `GUIAFMTRRSS.MD`, la guía real de redes sociales), que es más amplio que los 4 formatos que el pipeline de VIDE realmente soporta hoy (`Post`=1080×1080, `Reel`/`Story`=1080×1920, `Banner`=1200×628 en `FMT_DIMS`, `SuitCampanas/local-server-node.js`) — incluye "Video Largo" (1920×1080), que no existe en la app. **No está conectada** a `generateVideJson()` ni a las pestañas de Formato/Red de `index.html` — la petición original del usuario de que "el JSON generado tenga prioridad sobre la caja FMT y sobre la caja RED" sigue pendiente como paso separado si se quiere esa integración.
