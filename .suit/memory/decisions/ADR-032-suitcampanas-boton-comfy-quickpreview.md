# ADR-032: SuitCampanas — Botón "Comfy" (preview rápido con datos reales de empresa)

**Date:** 2026-09-17
**Status:** Aplicado (2026-09-17)
**Risk:** Bajo (endpoint nuevo, aislado; no toca el pipeline VIDE/ViRe existente)
**Workflow:** feature

---

## Context

Sobre la base de [[ADR-031]] (ComfyUI local recuperado + funcional en `:8188`/`SuitComfy` en `:3012`), el usuario pidió llevar esa recuperación a `SuitCampanas` como un **botón nuevo llamado "Comfy"**, capaz de complementarse con los parámetros reales de la empresa (base de datos) y sin romper nada si Comfy no está disponible.

Al inspeccionar `SuitCampanas` se encontró que **ya existía integración parcial**: `generarImagenComfy()` (`local-server-node.js:136`) y la opción `🖥️ ComfyUI (local)` dentro del selector `#imageSourceSelect`, usado por los flujos completos de VIDE/ViRe (ver bullet correspondiente en `SuitCampanas/CLAUDE.md`). Eso cubre "generar el video/pieza completa con Comfy como fuente de imagen", pero no una prueba rápida y aislada por empresa.

## Decision

1. **Nuevo endpoint** `POST /api/comfy/quick-preview` (`local-server-node.js`, junto a `/api/empresa-brief`): recibe `{ empresa }`, reusa `fetchEmpresaRow()` + `parseBrief()` (ya existentes) para armar un prompt con `industria`/`nicho`/`giro_especifico`/`color_tema` reales, llama a `generarImagenComfy()` (también reusada, sin duplicar lógica) y devuelve la imagen como `data:image/png;base64,...` — mismo patrón de respuesta que otros endpoints de imagen única del archivo (`/api/vire-still`, LP screenshot).
2. **Nuevo botón** `🖥️ Comfy` en `index.html`, dentro de la sección fija "DATOS / NEGOCIO" (visible en todos los modos, no solo VIDE/ViRe) — preview de imagen inline, mismo patrón de UI que `btnExtraerColoresLogo`/`btnGenerarEstiloIA` (disable+spinner, `showToast`, try/catch/finally).
3. **"Sin romperse" verificado en 2 escenarios reales**:
   - Empresa inexistente en la BD → `fetchEmpresaRow`/`parseBrief` devuelven vacío sin excepción, el prompt cae a un default genérico ("local business"), la generación sigue funcionando.
   - Comfy/SuitComfy caídos → `generarImagenComfy()` ya devolvía `null` sin tirar excepción; el endpoint lo traduce a `503` con mensaje accionable, nunca crashea el proceso del server.

## Bug encontrado en el camino (preexistente, no introducido por este cambio)

El timeout de `generarImagenComfy()` era `150000ms` (150s), basado en el estimado "~1-2 min" de `SuitComfy/README.md`. Medido en vivo en esta sesión (ver ADR-031): una imagen 768×1024 tardó **~4 minutos reales** en esta máquina (CPU, SD1.5+LCM). El primer test end-to-end de este botón reprodujo el timeout (`AbortSignal.timeout` abortando a los 150s con ambos servicios sanos, confirmados con `curl` en paralelo). Corregido a `360000ms` (6 min) — beneficia también al selector `ComfyUI (local)` preexistente de VIDE/ViRe, que tenía el mismo techo demasiado corto.

## Alternatives Considered

1. **Meter la llamada a Comfy dentro de `/api/empresa-brief`**: descartado — mezclaría una operación de lectura (GET, rápida) con una de generación (POST, minutos) en el mismo endpoint.
2. **Reusar `/api/vire-still` en vez de un endpoint nuevo**: descartado — ese endpoint arma una pieza completa vía Remotion (guion, overlay, marca), mucho más pesado que lo que pide el botón (una foto de prueba cruda).
3. **Timeout fijo más largo solo en el endpoint nuevo, sin tocar `generarImagenComfy()`**: descartado — el bug es de la función compartida; dejarlo sin arreglar ahí habría dejado el mismo timeout roto en el flujo VIDE/ViRe existente.

## Files Modified

- `SuitCampanas/local-server-node.js`: endpoint `/api/comfy/quick-preview` (nuevo) + timeout de `generarImagenComfy()` corregido (150s → 360s).
- `SuitCampanas/index.html`: botón `#comfyPreviewBtn` + preview `#comfyPreviewImg` en la sección "DATOS / NEGOCIO".
- `SuitCampanas/script.js`: handler del botón (fetch al endpoint nuevo, manejo de error/éxito).
- `SuitCampanas/CLAUDE.md`: bullet nuevo documentando esta decisión.
- Creado: este ADR.

## Validation

- `node --check` en los 2 JS modificados.
- Servidor levantado real (`node local-server-node.js`, puerto 8000) sin errores de arranque.
- `POST /api/comfy/quick-preview` con empresa inexistente → prompt genérico, sin excepción (verificado en logs del server).
- Reproducido el timeout real a los 150s (503, servicios confirmados sanos con `curl` en paralelo) → corregido → reintentado con éxito: `200`, imagen real de 821KB devuelta y verificada visualmente.

## Consequences

- **Positive:** Forma rápida de validar que ComfyUI+datos de una empresa producen algo útil, sin comprometerse a un video completo. El fix de timeout además estabiliza el flujo VIDE/ViRe existente.
- **Negative:** Ninguna conocida — el endpoint es aislado y de solo lectura sobre la BD (no escribe nada).
- **Neutral:** El botón no guarda la imagen generada en ningún lado (ni Supabase ni disco propio) — es una prueba visual efímera, a propósito, para no ensuciar la galería de campañas con pruebas.

---

*Decision recorded by SuitOS agent session — 2026-09-17*
