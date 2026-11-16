# ADR-059: SuitProspectos — Places API (New) + geolocalización de radio sin coste

## Status
Accepted (2026-11-02)

## Context
`SuitProspectos/prospect.js` era un CLI de prospección comercial que usaba la **Places API (Legacy)** (`/maps/api/place/textsearch/json` + `/place/details/json`).

Tres hechos verificados obligaron a decidir:

1. **Legacy está cerrado a proyectos nuevos.** Google: *"As of October 2026, Places API (Legacy) can no longer be enabled for new Google Cloud projects. Existing projects remain fully supported."* Como el módulo no tenía ninguna `GOOGLE_MAPS_API_KEY` configurada, la key inevitablemente vendría de un proyecto GCP **nuevo** → los endpoints Legacy no podrían habilitarse nunca.
2. **El modelo de precios cambió (1-mar-2025).** El crédito mensual de $200 se reemplazó por *free usage caps* por SKU: **Essentials 10.000, Pro 5.000, Enterprise 1.000** llamadas gratis/mes. Toda la planificación de costos anterior ($200 ≈ 11k llamadas) estaba obsoleta.
3. **Bugs funcionales previos**: `--radio` no hacía nada (`searchPlaces(searchQuery, null, radio)` → nunca se enviaba `location`/`radius`); una sola query con hasta 5 sinónimos pegados; sin `next_page_token`; sin dedupe; `formatCell` no escapaba `|` ni saltos de línea; `httpGet` sin timeout ni redirects.

## Decision

### 1. Migrar a Places API (New)
- `POST https://places.googleapis.com/v1/places:searchText` con headers `X-Goog-Api-Key` y `X-Goog-FieldMask` (el nombre correcto es `Api-Key`; con `ApiKey` Google no ve la key y responde *"unregistered callers"* — verificado en vivo 2026-11-02).
- **Field mask mínimo** (solo se factura lo que se pide): id, displayName, formattedAddress, teléfonos, websiteUri, rating, userRatingCount, types, primaryTypeDisplayName, editorialSummary, location, googleMapsUri, regularOpeningHours, priceLevel, businessStatus, reviews, nextPageToken.
- **Eliminar `getPlaceDetails`**: Text Search (New) devuelve los detalles completos → de ~21 llamadas por corrida a 1-3.
- `fromNewPlace()` normaliza el shape New → legacy, para no reescribir `analyzeStrengths` / `inferTargetAudience` / `analyzeDigitalPresence` / `getWhatsapp`.

### 2. Radio sin coste adicional (opción B)
En vez de invocar la Geocoding API, el centro se **deriva de las coordenadas que la propia respuesta ya trae** (`places.location`, incluidas gratis en el field mask) tomando la **mediana** de lat/lng, y el filtro corre en cliente con **haversine**.

- Coste: **$0 y 0 llamadas extra**.
- Alternativas descartadas: Geocoding API (gratis dentro del cap de 10.000/mes pero añade una API que habilitar), Nominatim/OSM (dependencia externa rate-limited), tabla hardcodeada de ciudades (cubre solo parte del uso), quitar `--radio` (la competencia lo da de estándar).

### 3. Resto de correcciones P0/P1
- 1 query por sinónimo + dedupe por `place_id` con `Set`.
- Paginación `nextPageToken` (espera 2 s, máx. 3 páginas).
- `formatCell` escapa `|` y saltos de línea.
- `httpGet` con timeout 10 s, hasta 3 redirects y JSON a prueba de fallos.
- Errores de Google → `stderr` + exit 1 (ya no se confunden con "0 resultados").
- `--nicho` acepta la etiqueta humana además del `valor` slug.
- `--limite N` (default 20) y contador de llamadas por corrida.
- `--selftest` con asserts de stdlib (sin red, sin key).

## Rationale
- **Sin key no hay módulo**: elegir Legacy hubiera dejado el proyecto sin poder habilitar la API.
- **Field mask = control de coste**: solo se paga lo pedido; el campo `reviews` (Atmosphere) baja el cap gratis de 5.000 (Pro) a 1.000 (Enterprise), aceptado porque el análisis de reseñas es el diferencial del módulo y el volumen interno queda muy por debajo.
- **Cero dependencias nuevas**: CSV escrito a mano, tests con `assert` de Node, radio con aritmética propia.

## Consequences
- **Positivos**: ~20× menos llamadas por corrida; `--radio` funciona de verdad; tabla Markdown ya no se rompe; proceso ya no se cuelga con webs lentas; coste $0 a volumen interno (~5.000/1.000 gratis por SKU/mes).
- **Negativos / riesgos**:
  - **R2**: no estaba100% confirmado que `reviews` llegue en Text Search (New); si no llega, `analyzeStrengths` degrada a "Sin reseñas disponibles" y habría que recuperar una llamada puntual a Place Details.
  - La mediana de las coords de los resultados es un **aproximación** del centro de la ciudad, no el centro oficial geocodificado.
  - Se elimina la posibilidad de usar `location`/`radius` server-side; el filtro es siempre client-side.
- El módulo sigue **sin key real**: la Fase 4 (validación en vivo) queda pendiente.

## Implementación y reversión
- Archivo único: `SuitProspectos/prospect.js`.
- Validación: `node --check`, `node prospect.js --selftest`.
- Reversión: `git checkout -- SuitProspectos/prospect.js` (el módulo aún no está commiteado, así que la reversión real es restaurar la copia previa).

## Validación
- [x] `node --check SuitProspectos/prospect.js`
- [x] `node SuitProspectos/prospect.js --selftest` — formatCell, csvCell, haversine, median, filterByRadius, fromNewPlace
- [x] `node SuitProspectos/prospect.js --list` — catálogo Supabase
- [x] Fallback `--nicho` por etiqueta → resuelve `restaurantes`
- [ ] Corrida real con `GOOGLE_MAPS_API_KEY` (pendiente Fase 0)
- [ ] Confirmar que `reviews` llega en Text Search (New)

## Related
- `.suit/registry/projects.yaml` → `suit-prospectos`
- `SuitProspectos/docs/11-integraciones-y-contratos.md` — contrato de la API y free caps
- `SuitProspectos/Analista_Proy.md` — análisis de viabilidad y benchmark competitivo
