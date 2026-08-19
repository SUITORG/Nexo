# ADR-026: Consolidación del vector de Brief en `logo_url` entre root SuitOrg y SuitCampanas

**Date:** 2026-08-10
**Status:** Accepted e implementado
**Risk:** Medium (corrige 3 bugs activos en producción/pipeline, sin cambiar el contrato de datos ya decidido en ADR-025)
**Workflow:** bugfix

---

## Context

ADR-008 (SuitCampanas, 28-jul), ADR-019 (root, `origen_politicas`, 10-ago), ADR-021 (SuitCampanas, MediaPlanner, 01-ago) y ADR-023/025 (root, landing pages + vector de Brief, 07/09-ago) tocaron el mismo campo `Config_Empresas.logo_url` en fechas distintas, desde proyectos distintos (root SuitOrg vs `SuitCampanas/`), sin que ninguna de las dos partes supiera de la otra. El usuario cargó el Brief real de **NOET** en `logo_url` siguiendo el formato final de ADR-025 (19 segmentos etiquetados, empezando en `industria:`) y pidió verificar que todo el pipeline (VIDE, ViRe, BDPV, MediaPlanner/BriefMarker) siguiera funcionando. La verificación encontró tres roturas reales, no teóricas.

## Bugs encontrados y corregidos

### 1. `parseLogoUrlField()` (SuitCampanas/script.js) — comma-split ciego a `|`
ADR-008 definió `logo_url = "logoUrl,avatarUrl"`. ADR-023/025 extendieron el mismo campo a `logo: url|hero: url|...|LAPVTFU: url,url,,,,,|...` (pipe-delimited, con comas *dentro* de varias etiquetas). `parseLogoUrlField()` no sabía de `|` — con el vector de NOET real tomaba "todo hasta la última coma" como logo, rompiendo el logo/avatar en cualquier video de VIDE (`generateVideVideo`, overlay en `local-server-node.js:/api/video-produce`) y en BDPV (mismo campo `#companyLogo`, autocompletado por `setupCompanyAutoFill()`).

**Fix**: `parseLogoUrlField()` ahora prueba primero etiquetas `logo:`/`avatar:`/`LAPVTFU:` (pipe-delimited); si no encuentra ninguna, cae al comma-split legado de ADR-008 sin cambios. Con `LAPVTFU:` presente, toma slot 1 (Logo) y slot 2 (Avatar) sin comma-split global. Verificado contra el valor real de NOET y contra los 3 casos legados de ADR-008 (logo solo, logo+avatar, `data:` URI).

### 2. `generateMediaPlan()` (SuitCampanas/local-server-node.js) leía `tipo_negocio`, no `logo_url`
`parseBrief()` se escribió (ADR-021, 01-ago) para leer el vector de 18 campos desde `tipo_negocio`. ADR-025 (09-ago) movió el vector completo a `logo_url` y revirtió `tipo_negocio` a su formato corto (`{tipo_negocio},{si_galeria|no_galeria}`) — sin que nadie actualizara la fuente que lee `generateMediaPlan()`. Resultado: para NOET (y cualquier tenant con el Brief ya migrado a `logo_url`), MediaPlanner/BriefMarker/CreatorEngine estaban recibiendo un `brief` casi vacío.

**Fix**: `generateMediaPlan()` ahora lee `empresaRow.logo_url` primero, con fallback a `tipo_negocio`/`tiponegocio` para tenants que nunca migraron. `parseBrief()` (genérico al string de entrada, no le importa el nombre del campo origen) no necesitó cambios de fondo salvo el punto 3.

### 3. `parseBrief()`: segmento 0 y slots de `LAPVTFU` desalineados
Dos bugs adicionales, encontrados al verificar `parseBrief()` con datos reales (no existían en el `tmp_test_parser.js` original porque probaba con datos sintéticos de 2 slots, previos a ADR-025):

- **Segmento 0**: el parser original asumía que el segmento 0 de `tipo_negocio` era una etiqueta suelta sin `:` (`"Autoridad en Kitchen-Tech|galeria:...|..."`) y nunca lo parseaba como `key:value`. En `logo_url`, el segmento 0 **ya es** `industria: valor` — se estaba perdiendo `industria` completo, cayendo silenciosamente a `etiqueta_legado`. Fix: el segmento 0 se intenta parsear como `key:value` igual que el resto; solo cae a `etiqueta_legado` si de verdad no tiene `:`.
- **`LAPVTFU`**: se trataba como lista genérica (`BRIEF_LIST_FIELDS`, con `.filter(Boolean)` que descarta vacíos). LAPVTFU es **posicional** (7 slots fijos: Logo, Avatar, FotoPersonal, Videos, Testimonios, Fotos, UGC) — filtrar vacíos desalinea las posiciones y hace imposible aplicar las reglas de fallback de ADR-025 (ej. "Avatar vacío → cae a Logo"). Fix: rama dedicada que preserva las 7 posiciones (rellena con `''` si faltan) y expone `brief.activos` como objeto `{logo, avatar, fotoPersonal, videos, testimonios, fotos, ugc}` en vez de array compactado.

Verificado end-to-end con el vector real de NOET (`SuitCampanas/scripts/tmp_test_parser.js`, actualizado — la versión anterior probaba etiquetas superadas `PCP`/`LAVTFU` de antes de ADR-025).

### 4. Landing pages (root) no contestaban qué hace / para quién / cuánto cuesta
El Brief vector ya trae `vendes`, `PBP` y `audiencia`, pero `renderLanding()` solo extraía `logo`/`hero`/`oferta`/`cta`. Nueva función `resolveBriefParts()` en `scripts/ssg-engine.mjs` extrae `vendes`/`pbp` ("¿qué hace?"), `audiencia` ("¿para quién?") y `PM` → solo el precio (**nunca el margen**, dato interno de negocio que jamás debe llegar a una landing pública). `SuitLandings/landing-template.html` gana 3 líneas opcionales (`.que-hace`, `.para-quien`, `.precio`), cada una removida por completo (no solo vaciada) si el Brief no trae el dato — mismo patrón ya usado para el bloque de contacto (ADR-023 #1). Verificado que el margen de `PM` nunca aparece en el HTML generado.

## Precedencia final única para `logo_url`

1. Si contiene `|` o empieza con una etiqueta reconocida (`logo:`/`avatar:`/`hero:`/`oferta:`/`cta:`/`lapvtfu:`/vector de Brief) → **formato ADR-023/025**, etiquetas en cualquier posición.
2. Si no, y contiene una coma → **formato legado ADR-008** (`logoUrl,avatarUrl`), sin cambios.
3. Si no contiene ni `|` ni `,` → URL simple de logo (comportamiento original, sin cambios).

Root SuitOrg (`js/modules/core.js`, `scripts/ssg-engine.mjs`) y SuitCampanas (`script.js`, `local-server-node.js`) implementan esta misma precedencia de forma independiente (sin módulo compartido entre los dos proyectos — decisión ya aceptada en ADR-008/023, no se introduce un paquete compartido solo por esto).

## Deuda no resuelta (fuera de alcance de esta ADR)
- `BRIEF_LIST_FIELDS.pcp`/`pbm` en `local-server-node.js` son alias muertos (la etiqueta real y documentada es `PBP`, que ya cae correctamente como texto libre por el paso genérico). No se tocan — no producen ningún bug, limpiarlos es cosmético.
- Slot 6 de `LAPVTFU` (Fotos, hasta 5 sub-fotos) sigue sin separador interno decidido — igual que dejó ADR-025, no se resuelve aquí.
- `origen_politicas: presentacion: SI` / `lp: si` (ADR-019) siguen sin consumidor — no se conectan a BDPV en esta ADR (fuera del alcance pedido; ver conversación para el siguiente paso si se quiere).

## Files
- `SuitCampanas/script.js` — `parseLogoUrlField()`
- `SuitCampanas/local-server-node.js` — `parseBrief()`, `BRIEF_LIST_FIELDS`, `generateMediaPlan()`
- `SuitCampanas/scripts/tmp_test_parser.js` — reescrito contra datos reales de NOET
- `scripts/ssg-engine.mjs` — `resolveBriefParts()` (nueva), `renderLanding()`
- `SuitLandings/landing-template.html` — bloques `.que-hace`/`.para-quien`/`.precio`

## Validation
- `node --check` limpio en los 3 archivos `.js`/`.mjs` tocados.
- `SuitCampanas/scripts/tmp_test_parser.js`: 20/20 aserciones, contra el vector real de NOET + fallback legado.
- `parseLogoUrlField()`: 5/5 casos (3 legados ADR-008 + NOET real + vector sin logo/avatar aún).
- `renderLanding()`: probado con plantilla real contra NOET (bloques presentes, margen no filtrado) y contra un tenant sin Brief tipo EVASOL/SUITORG (bloques opcionales se eliminan por completo, nada roto).

---

*Decision recorded by SuitOS agent session — 2026-08-10*
