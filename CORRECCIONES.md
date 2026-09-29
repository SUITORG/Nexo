# CORRECCIONES — aprendizajes acumulados
Lee este archivo antes de validar. Cada entrada debe convertirse en una prueba.

## <YYYY-MM-DD> — <título corto>
- Síntoma:
- Causa raíz:
- Arreglo aplicado:
- Regla preventiva:
- Prueba que lo cubre: <ID en VALIDACION.md>

## 2026-09-29 — Estándar activos: el manifiesto nunca daba `unchanged` (idempotencia rota)
- Síntoma: V5b — la 2ª escritura de `setLapvtfuSlot` devolvía `vectorUpdated:true` siempre; storage mostraba `LAPVTFU:` con1 espacio más por escritura (acumuló5).
- Causa raíz: `_setLapvtfuSlot_` hacía `slice(colon+1)` (conservaba el espacio previo) y reconstruía con `'LAPVTFU: '` → `parts[0]` llegaba con el espacio viejo + el nuevo → `next !== current` jamás coincidía.
- Arreglo aplicado: trim de `parts[0]` en el rebuild (`ix===0 → p.replace(/^\s+/,'')`) — `backend/core.js` · deploy @27 (misma URL).
- Regla preventiva: toda reescritura de segmentos debe normalizar antes de comparar; aserciones de idempotencia prueban 2 corridas con delay ≥5 s (consistencia eventual GAS).
- Prueba que lo cubre: V5b (smoke `temp/smoke-activos.js`).

## 2026-09-29 — Aserción de URL de slot: las URLs de Drive no llevan el nombre del archivo
- Síntoma: V6 falló con el slot6 ya correcto.
- Causa raíz: aserté `url.includes('imagenurl-…')` pero la URL canónica es `https://drive.google.com/uc?export=view&id=<ID>` (sin nombre).
- Arreglo aplicado: asertar prefijo `uc?export=view&id=` + no-vacío.
- Regla preventiva: validar forma de la URL, no el nombre de archivo.
- Prueba que lo cubre: V6.

## 2026-09-29 — 404-transitorio del GAS devuelve HTML (no JSON)
- Síntoma: V2 y un GET fallaron con `Unexpected token '<', "<!DOCTYPE…"` en una vuelta; PASS en la siguiente.
- Causa raíz: quirk conocido del webapp (puede 404 y aún ejecutar).
- Arreglo aplicado: retry con delay6 s en todos los POST/GET del smoke (patrón ya documentado en AGENTS/manual §9).
- Regla preventiva: nunca asumir fallo por un404 → verificar/reintentar antes de concluir.
- Prueba que lo cubre: V2 (vuelta3 del smoke).
