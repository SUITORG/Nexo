# ADR-004: Modo Flags 4-Partes + Nuevos Módulos SuitPedidoExpress/SuitPos

## Status
Accepted (2026-07-09)

## Context
El campo `modo` en `Config_Empresas` originalmente controlaba dos aspectos: visibilidad en Orbit Hub (`PROD`/`HIDDEN`) y activación de Stripe (segunda parte `,1`). Se necesitaba control granular sobre la visibilidad de Pedido Express y POS sin depender exclusivamente de `tipo_negocio` o RBAC.

## Decision
Expandir `modo` a formato `VISIBILIDAD,STRIPE,EXPRESS,POS` (4 partes):

| Parte | Posición | Default | Control |
|---|---|---|---|
| VISIBILIDAD | 0 | PROD | Orbit Hub: PROD=visible, HIDDEN=oculto |
| STRIPE | 1 | 0 | Tarjeta (Stripe): 1=activado |
| EXPRESS | 2 | 1 | Pedido Express: 1=visible |
| POS | 3 | 1 | POS Staff: 1=visible en menú staff |

1. **Parser centralizado**: `app.utils.parseModo()` en `core.js` — accesible desde cualquier módulo.
2. **Gates en router.js**: `#food-app-area`, `#staff-pos`, `#pos` redirigen a `#home` si su flag es 0.
3. **Gates en UI**: Nav público, hero button, menú staff y dashboard cards se ocultan según flags.
4. **Retrocompatible**: Partes faltantes default a 1 (excepto STRIPE que default a 0 por compatibilidad con formato `PROD` sin coma).
5. **Nuevos módulos**: `SuitPedidoExpress/` (puerto 3005) y `SuitPos/` (puerto 3006) como scaffolds independientes montados en `server.js`.

## Rationale
- Centralizar el parser en `app.utils` sigue la convención existente del proyecto.
- Defaults a 1 para partes faltantes evita regresiones en empresas existentes.
- Los gates en router.js son la capa de seguridad; los gates en UI son UX.
- Los nuevos módulos siguen el patrón `SuitReservaciones/` (Express server + `module.exports`).

## Consequences
- El parser anterior `parts[parts.length-1]` en `pos.js:isActivo()` queda reemplazado (ya no es compatible con formato 4-partes porque leería el flag de POS en lugar de STRIPE).
- Cualquier nuevo flag futuro requiere: (a) agregar al parser en `app.utils.parseModo`, (b) definir default, (c) agregar gates donde corresponda.
- Los scaffolds nuevos requieren desarrollo adicional para ser funcionales.

## Files Affected
- `js/modules/core.js` — parser agregado en `app.utils`
- `js/modules/router.js` — gates de ruta
- `js/modules/public.js` — gates de nav público
- `js/modules/auth.js` — gates de menú staff
- `js/modules/pos.js` — `isActivo()` refactorizado
- `server.js` — montados SuitPedidoExpress y SuitPos
- `SuitPedidoExpress/index.js` — scaffold funcional
- `SuitPos/index.js` — scaffold funcional
- `Documentacion/02-tablas-campos.md` — documentación actualizada

## Standard for New Modules
1. Crear carpeta con `package.json`, `index.js`, `db/client.js`, `handlers/`, `services/`
2. `index.js` debe tener `module.exports = app;` al final
3. Agregar `require` + `app.use()` en `server.js`
4. Elegir puerto único (ver registry de puertos en ADR-005 o projects.yaml)
5. Registrar en `.suit/registry/projects.yaml`
6. Si tiene gate de UI, documentar en `frontend:` del projects.yaml
