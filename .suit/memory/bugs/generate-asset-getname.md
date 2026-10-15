# Bug: generateAsset multi-asset falla con "it.getName is not a function"

## Status
Known (source fixed, **GAS desplegado NO — pendiente de `clasp push`**)

## First Observed
2026-10-15 (cadena máscara LABARIES, subida de fotos)

## Symptoms
`generateAsset` con `tipo: fotos|videos|testimonios` (multi=true) devuelve:
`ASSET_ERROR: it.getName is not a function` — la subida nunca completa.

## Root Cause
`_nextAssetName_` itera el FileIterator pero no llama `.next()`:
```js
while (it.hasNext()) {
  var m = it.getName().match(re);   // ❌ `it` es FileIterator, no File
```
`backend/core.js:826` (deploy GAS @25). No se detectó antes porque los uploads
usaban `subirImagenCte_` (nombre explícito) o rutas no-multi (logo/avatar).

## Fix
`var m = it.next().getName().match(re);` — aplicado en repo (2026-10-15).
**Falta**: `clasp push && clasp deploy` para que llegue al GAS desplegado.

## Affected Files
- `backend/core.js` (`_nextAssetName_`, línea 826)
- Callers: `generateAsset` (fotos/videos/testimonios), `generateAllAssets`

## Workaround usado
Subir activos vía `subirImagenCte {fileName: "fotos0N.png"}` (nombre explícito,
no pasa por `_nextAssetName_`) — así se completó LABARIES sin redeploy.

## Related
- `.agents/skills/lapvtfu/SKILL.md` lf-005 (subida estándar)
- Flujo de deploy: `clasp push && clasp deploy` (AGENTS.md) — requiere confirmación
