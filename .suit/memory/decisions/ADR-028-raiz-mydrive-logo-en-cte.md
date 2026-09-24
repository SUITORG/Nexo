# ADR-028: Raíz de Drive = My Drive root + logo.png directo en cte<id>/

## Status
Accepted (2026-09-23)

## Context
- `core.js` hardcodeaba `DRIVE_ROOT_ID: 1mJWzX-...` y el fallback del sidebar `1BxmUT-...`.
- Verificación en campo: las carpetas `cteTOPLUXF`, `cteNOET`, etc. viven **directo en My Drive root**; `1UUtr70-...` resultó ser la propia cteTOPLUXF, no un root intermedio.
- El fallback `1BxmUT-...` devuelve **404** (carpeta borrada/inexistente) → "Historial" del sidebar fallaba.
- El usuario ya mantiene `logo.png` en la raíz de `cte<id>/`, no en `_activos/logo/`.

## Decision
1. **Root dinámico**: helper `getRootFolder_()` en `core.js` — orden: Script Property `DRIVE_ROOT_ID` (override) → `DriveApp.getRootFolder()` (My Drive real). Eliminar IDs hardcodeados de `core.js` y `brief-sidebar.js`.
2. **Ruta del logo**: `cte<id>/logo.png` (nombre fijo, overwrite = trash + recreate). Los otros 6 activos LAPVTFU siguen en `_activos/<tipo>/`.
3. **Lectura**: `getBriefAssets` lista `logo.*` desde la raíz de `cte<id>`; fallback a `_activos/logo/` para datos viejos (compat, sin migración).

## Rationale
- Un solo punto de verdad (la raíz real del usuario) elimina la discrepancia de dos IDs.
- Property override permite migrar sin redeploy si algún día se usa otra raíz.
- Sin migración de archivos existentes (decisión explícita del usuario: "solo código nuevo").

## Consequences
- `ensureCteFolders` ya no crea `_activos/logo/`.
- `generateAsset("logo", ...)` escribe siempre `cte<id>/logo.png` (viejos timestamped en `_activos/logo/` quedan como fallback de lectura).
- `DriveManager.initDriveStructure` ahora opera sobre My Drive root.
- Si en el futuro aparece una raíz distinta: setear Script Property `DRIVE_ROOT_ID`.
- **Case-insensitive**: carpetas reales usan `CteTOPLUXF` (C mayúscula) — `findCteFolder_()` compara en minúsculas (`getFoldersByName` es case-sensitive).
- **Backup automático**: `updateBriefVector` ahora llama `backupBriefVector` best-effort antes de sobrescribir (historial en `_brief/historial/`).
- **MimeType**: `MimeType.JSON` da null en este runtime → usar string `"application/json"`.
- Web Apps de GAS sirven por versión: tras cada `clasp push` ejecutar `clasp deploy -i AKfycbzlkAI... -d "..."` si no, el endpoint sigue con el código viejo (la URL no cambia).

## Alternatives Considered
- Elegir uno de los dos IDs hardcodeados: ninguno coincidía con la estructura real → descartado.
- Migrar archivos existentes: rechazado por el usuario (riesgo destructivo, innecesario).

## Related
- `.suit/memory/patterns/brief-format.md` (slot 1 LAPVTFU)
- `backend/core.js` getRootFolder_ / generateAsset / getBriefAssets / ensureCteFolders
- `backend/brief-sidebar.js` getConfigValue
