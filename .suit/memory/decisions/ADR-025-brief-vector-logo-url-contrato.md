# ADR-025: Vector de Brief en `logo_url` — contrato de datos para el CreatorEngine de SuitCampanas

**Date:** 2026-08-09
**Status:** Implementado (2026-08-10, ver ADR-026). NOET es el primer tenant real con el vector completo cargado en `logo_url`. Consumidores en producción: `renderLanding()` (root, qué hace/para quién/precio) y `generateMediaPlan()`/`parseBrief()` (SuitCampanas, MediaPlanner→BriefMarker). El CreatorEngine de ViRe en sí (más allá de MediaPlanner) sigue sin consumir el vector directamente.
**Risk:** Low (aditivo; nada de esto se parsea todavía en código)
**Workflow:** feature (documentación de contrato, sin código)

---

## Context

Continuación de ADR-023 (landing pages multi-tenant) y ADR-024 (fix de ViRe). El usuario quiere consolidar el Brief de marketing completo de cada inquilino (industria, nicho, audiencia, dolor, objeciones, tono, etc.) dentro del campo existente `Config_Empresas.logo_url`, con el mismo formato etiquetado `etiqueta: valor|etiqueta: valor` que `logo_url` ya usa para `logo`/`hero`/`oferta`/`cta` (ver `resolveLogoUrlParts()`, agregado hoy en `js/modules/core.js` y `scripts/ssg-engine.mjs` — busca esas 4 etiquetas en cualquier posición del string, con fallback al formato clásico posicional para tenants sin etiquetas).

Antes de esto, el usuario había roto dos veces datos en producción por confundir el contrato:
1. `tipo_negocio` (campo aparte, no `logo_url`): metió el vector completo de Brief ahí. Ese campo se lee con `.includes()`/`===` (sin parseo) en 7+ puntos del SPA — riesgo de colisión silenciosa con branding/navegación/formularios. Revertido a su formato original: **exactamente 2 valores crudos, sin etiquetas, separados por coma** — `{tipo_negocio},{si_galeria|no_galeria}`. Ejemplo NOET: `Autoridad en Kitchen-Tech,no_galeria`.
2. `logo_url`: pegó el vector sin las etiquetas `logo:`/`hero:`/`oferta:`/`cta:` — el SPA (`fixDriveUrl()`) tomaba el primer segmento del vector como si fuera la URL del logo, generando una imagen rota (mismo bug ya documentado en ADR-023, hallazgo #2, para SRTOQUES). Corregido por el propio usuario tras el fix de código.

**Alcance confirmado por el usuario**: este vector lo va a leer el **CreatorEngine de ViRe (SuitCampanas)** u otro prompt de IA para armar campañas — no es (solo) para `renderLanding()`. `renderLanding()`/`fixDriveUrl()` solo necesitan las 4 etiquetas reservadas (`logo`, `hero`, `oferta`, `cta`); el resto del vector es contenido de Brief sin consumidor de código todavía.

## Decision

### `tipo_negocio` (campo separado, sin tocar)
Exactamente 2 valores crudos separados por coma, **sin etiquetas** (el código no las necesita ni las tolera bien — cualquier texto libre ahí arriesga colisión con `.includes()`).

### `logo_url` — etiquetas reservadas (consumidas por código existente)
`logo`, `hero`, `oferta`, `cta` — deben existir como segmentos `etiqueta: valor` en cualquier posición del campo (ver `resolveLogoUrlParts()`). Si faltan, esas piezas quedan vacías (ya no rotas — comportamiento seguro, no bloqueante).

### `logo_url` — etiquetas de Brief (sin consumidor de código todavía; para el futuro CreatorEngine)
| Etiqueta | Contenido | Notas |
|---|---|---|
| `industria`, `nicho`, `especializacion`, `vendes`, `audiencia`, `dolor`, `PBP`, `lograr`, `vivir`, `PM`, `tono`, `PS`, `RLP` | Texto libre | Prosa normal, pueden llevar comas internas sin problema (nada los sub-divide). |
| `objecion` | Lista de objeciones, **separadas por coma** | Ya es el formato actual de NOET — confirmado correcto, sin cambios. |
| `competidores` | Hasta 3 enlaces, **separados por coma** | Para análisis competitivo futuro. Vacío hoy. |
| `descripcion` | Descripción de la oferta/landing | Distinta de la columna real `company.descripcion` (más corta, ya usada en SEO) — viven en lugares distintos (una dentro de `logo_url`, otra en su propia columna), sin colisión de código porque nada parsea el vector todavía. Decisión consciente del usuario de reusar el nombre pese al parecido, por preferir el nombre corto del diccionario original. |
| `LAPVTFU` | 7 slots posicionales, **separados por coma**: Logo, Avatar, Foto Personal, Videos, Testimonios, Fotos, UGC | Ver reglas de fallback abajo. Puede ir vacío entero sin romper nada. |

### Reglas de fallback de `LAPVTFU` (para cuando exista un consumidor)
1. **Logo** vacío → cae a la etiqueta `logo:` del propio vector (no duplicar la misma URL dos veces).
2. **Avatar** vacío → copia del slot 1 (Logo). No rompe si falta.
3. **Foto Personal** → opcional, puede quedar vacío sin problema.
4. **Videos** → enlace de video para análisis.
5. **Testimonios** → enlace de video para análisis (confirmado con el usuario: es Testimonios, no una repetición de Videos — coincide con el acrónimo original L-A-P-V-**T**-F-U).
6. **Fotos** → **abierto/pendiente**: podría caer al fallback de la galería (`si_galeria`/`no_galeria` en `tipo_negocio` + `Config_Galeria`), leyendo hasta 5 fotos. El usuario decidió explícitamente **no resolver el separador todavía** (candidatos: `;`, espacio) — LAPVTFU ya usa `,` para sus 7 posiciones top-level, así que las hasta-5-fotos internas del slot 6 necesitan un separador distinto para no desalinear el split de 7 posiciones. **No implementar el parseo de este slot hasta decidir el separador.**
7. **UGC** → enlace donde se vean testimonios o comentarios de usuarios.

### Campos explícitamente excluidos del vector
`enlace_oficial`, `telefonowhatsapp`, `color_tema` — el usuario los sacó del vector tras confirmarse que ya viven en sus propias columnas de `Config_Empresas`, leídas directamente por `renderLanding()` (`company.telefonowhatsapp`, `company.color_tema`). Duplicarlos en `logo_url` hubiera creado una segunda fuente de verdad con riesgo de quedar desactualizada. Quedan reservados para el proyecto de landing pages (ADR-023), no para este vector de Brief.

## Estado de NOET (verificado en vivo, API GAS)

`tipo_negocio`: `Autoridad en Kitchen-Tech,no_galeria` ✓

`logo_url` (19 segmentos, sin `logo:`/`hero:` todavía — pendiente, no bloqueante):
`industria`, `nicho`, `especializacion`, `vendes`, `audiencia`, `dolor`, `PBP`, `lograr`, `vivir`, `LAPVTFU`, `PM`, `objecion`, `competidores` (vacío), `tono`, `PS`, `RLP`, `oferta`, `descripcion`, `cta`.

## Consequences

- **Positive:** contrato de datos claro y con nombres ya decididos para cuando se construya el parser del CreatorEngine. Cero riesgo de repetir los 2 incidentes de producción ya vividos (`tipo_negocio` roto, `logo_url` roto) — ambos raíz: texto libre en un campo consumido por posición/substring sin protocolo.
- **Negative:** ninguno — es documentación pura, no cambia comportamiento.
- **Pendiente sin dueño:** separador interno del slot 6 de `LAPVTFU` (Fotos, fallback a galería) — bloqueado hasta que el usuario lo decida. El parser real del CreatorEngine que lea este vector tampoco existe todavía — trabajo futuro, sin fecha.

---

*Decision recorded by SuitOS agent session — 2026-08-09*
