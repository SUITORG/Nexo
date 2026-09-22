# ADR-034: Formato pipe-delimited para color_tema

## Status
Accepted (2026-09-20)

## Context
El campo `color_tema` en `Config_Empresas` era un hex simple (`#d32f2f`). Con la llegada de `theme.schema.json`, `presets.json` y el kit de plantillas dinámicas para landing pages, se necesitaba unificar colores, tipografías, paletas y plantillas en un solo campo sin romper compatibilidad.

## Decision
Evolucionar `color_tema` a formato pipe-delimited: `#hex|candado:0|pal:pal-teal|tp:tp-01|tpl:lp-local-service`.

| Campo | Requerido | Descripcion | Default |
|---|---|---|---|
| `color` | No | Hex primary | Se infiere de `pal` o `#2563eb` |
| `candado` | No | `1` = usar plantilla sugerida, `0` = no tocar estructura | `0` |
| `pal` | No | ID de paleta (`pal-teal`, `pal-navy`, etc.) | Auto-detecta del hex |
| `tp` | No | ID de par tipografico (`tp-01` a `tp-10`) | `tp-01` |
| `tpl` | No | ID de plantilla landing (`lp-local-service`, etc.) | `lp-local-service` |

## Rationale
- **Backwards-compatible**: un hex simple se parsea correctamente como legacy.
- **Sin migracion forzada**: los tenants existentes con hex simple funcionan igual.
- **Graceful degradation**: si un ID de presets no existe, se ignora silenciosamente.
- **Auto-detect**: si solo hay hex, se busca la paleta cuyo primary mas se acerca (distancia euclidea RGB).
- **Candado**: `candado:1` habilita la plantilla sugerida; `candado:0` (default) no toca la estructura del sitio.

## Archivos modificados
- `scripts/parse-theme.js` - parser CJS con `parseTheme()`, `resolveTheme()`, `getFontCssImport()`
- `scripts/ssg-engine.mjs` - integra parser, inyecta CSS tokens en landing template
- `SuitLandings/landing-template.html` - variables CSS extendidas (`--font-heading`, `--radius`, etc.)
- `js/modules/ui.js` - browser-compatible parser inline, aplica tema completo al SPA
- `backend/seeds_master.js` - ejemplo EVASOL actualizado al nuevo formato
- Sidebar Google Apps Script para selector dinamico en Sheets

## Alternatives Considered
- Campo nuevo separado (`config_tema`): mas limpio pero requiere migracion y sincronizacion
- JSON en el campo: mas flexible pero rompe el parsing existente de pipes
- Multiples campos (`color_primario`, `font_heading`, etc.): normalizado pero invade la hoja de calculo

## Related
- `theme.schema.json` - contrato completo del tema
- `presets.json` - catalogo de paletas, tipografias y plantillas
- `Kit de plantillas dinamicas para landing pages.md` - documentacion del sistema
- ADR-023: landing pages multitenant
