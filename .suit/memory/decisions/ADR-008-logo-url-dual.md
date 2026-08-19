# ADR-008: Formato dual en logo_url (logo + avatar)

## Status
Accepted (2026-07-28)

## Context
El campo `logo_url` en `Config_Empresas` (GS) y Supabase almacena tradicionalmente una sola URL para el logo de la empresa. Se necesita un segundo enlace para el avatar (foto de la persona) que se superpone en los videos e imágenes generados por SuitCampanas.

## Decision
El campo `logo_url` almacenará dos URLs separadas por coma: `logo_url,avatar_url`.

## Parsing rules
- Si no hay coma: el valor completo es el logo, avatar vacío
- Si una de las URLs es `data:` (base64): la primera coma pertenece al prefijo data, se busca la segunda coma como separador
- Caso general: se usa la última coma como separador entre las dos URLs
- `parseLogoUrlField()` devuelve `{ logoUrl, avatarUrl }` — siempre seguro, avatar vacío si no existe segundo enlace

## Donde se usa

| Ubicación | Uso |
|---|---|
| `script.js:setupCompanyAutoFill` | Normaliza cada URL individualmente con `normalizeDriveUrl` y las recombina |
| `script.js:generateVideVideo` | Envía `logo_url` (solo logo) y `avatar_url` al servidor VIDE |
| `script.js:generateVideJson` | Pasa ambas URLs en el prompt para que la IA las considere |
| `script.js:renderCarouselFromJson` | Muestra logo (top-left) y avatar (bottom-right, circular) en preview |
| `local-server-node.js:/api/video-produce` | Descarga logo y avatar por separado, los superpone en imágenes generadas |
| `local-server-node.js:video assembly` | Superpone avatar (círculo 100px) en esquin inferior derecha del video final |

## Overlay positions
- **Logo**: top-left (20x20), escalado a 120px de ancho manteniendo aspecto
- **Avatar**: bottom-right (20x20), circular (radio 60px con `geq` filter), escalado a 120x120

## Backward compatibility
- Sin segundo enlace: todo funciona exactamente como antes, solo el logo
- Sin ningún enlace: sin cambios, sin errores

## Consequences
- `normalizeDriveUrl` en `setupCompanyAutoFill` ahora procesa cada parte individualmente
- No se rompe ningún código existente que lea `#companyLogo` — simplemente obtiene el valor completo

## Related
- `SuitCampanas/script.js` — `parseLogoUrlField()`, `generateVideVideo()`, `renderCarouselFromJson()`
- `SuitCampanas/local-server-node.js` — `/api/video-produce` endpoint
