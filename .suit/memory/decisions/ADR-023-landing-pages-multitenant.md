# ADR-023 — Landing pages multi-tenant vía flag en `modo` (posición 8)

**Fecha**: 2026-08-07
**Estado**: Implementado por otra CLI, revisado y verificado por SuitOS. Un hallazgo cosmético sin corregir (ver abajo) + validación end-to-end de branch 2 (`modo` pos8=`2`) pendiente por falta de tenant real con ese valor.
**Contexto**: Plan `.suit/memory/pending/plan-landing-pages-multitenant.md`. Ver también ADR-022 (limpieza de huérfanos) y el plan `plan-posicionamiento-seo-multitenant.md`, cuya infraestructura (`ssg-engine.mjs`, cron, `dist/`) reutiliza este feature sin cambios de arquitectura.

## Decisión

Agregar landing pages de conversión por inquilino, generadas estáticamente por `scripts/ssg-engine.mjs`, activadas por un flag nuevo en la **posición 8 (índice 7)** del campo `modo` de `Config_Empresas` — no en `modo_sitio` (campo distinto, ya usado por `core.js`/`public.js`/`router.js` para el gate HUB/WHITE del SPA).

Se eligió `modo` porque el patrón CSV del ejemplo original del usuario ya existía en vivo en ese campo (`SRTOQUES.modo = "HIDDEN,0,0,0,0,0,0,1"`, `PFM.modo = "HIDDEN,1,1,1,1,1,1,0"`), y `parseModo()` (`js/modules/core.js:169-182`) solo lee las posiciones 0-6 — la posición 8 era un slot libre de facto, sin necesidad de migrar ninguna fila.

### Semántica
| `modo` pos 8 | Efecto |
|---|---|
| `0` / ausente | Solo sitio (sin cambios) |
| `1` | Landing-only: `dist/{slug}.html` se genera desde `SuitLandings/landing-template.html` en vez del SPA. No hay sitio para ese tenant. |
| `2` | Sitio + landing: `dist/{slug}.html` (SPA, sin cambios) + `dist/{slug}-landing.html` (landing) |

Toda landing es **`noindex, nofollow` siempre**, sin excepción (ni para EvaSol) — decisión de negocio explícita del usuario para no canibalizar el único sitio indexable (`evasol.html`).

### Archivos
- `SuitLandings/landing-template.html` — plantilla nueva (hero, oferta, CTA, contacto), placeholders `{{...}}`, sin dependencias nuevas.
- `scripts/ssg-engine.mjs` — `getLandingMode()`, `renderLanding()`, branch por `landingMode` dentro del loop existente; reutiliza `generatedFiles`/`demoFiles` (por lo que el barrido de huérfanos de ADR-022 sigue funcionando sin cambios).
- `.suit/registry/projects.yaml` — entrada `suit-landings` (`type: template`, sin `servers:` — no es un servicio corriendo).
- `.suit/registry/skills.yaml` — skill nueva `landing-pages` (domain: marketing), autorizada explícitamente por el usuario.
- Columnas nuevas en `Config_Empresas` (Sheets): `landing_oferta`, `landing_cta_texto`, `landing_imagen_hero` — con fallback a `slogan`/`logo_url`/`descripcion` si vienen vacías.

## Verificación en vivo (SuitOS, 2026-08-07)

- `node --check scripts/ssg-engine.mjs` → OK.
- `dist/` regenerado (por la otra CLI) contra la API GAS real: 17 inquilinos → `dist/srtoques.html` sale de la plantilla de landing (branch `1`), 15 restantes sin cambio de comportamiento, `evasol.html` intacto.
- `robots.txt`: `Disallow: /srtoques.html` presente. `sitemap.xml`: solo `evasol.html`. Correcto.
- Registro (`projects.yaml`, `skills.yaml`) coincide con el plan.

## Hallazgos de la revisión (no reportados por el CLI ejecutor)

### 1. Bug cosmético: separador huérfano cuando falta `correo` pero hay `telefono`
En `renderLanding()` (`scripts/ssg-engine.mjs`), la limpieza condicional de la sección de contacto es asimétrica:
```js
if (!telefono) h = h.replace(/\s*<span data-tel>[\s\S]*?<\/span>\s*<span class="sep" data-tel-sep>\s*·\s*<\/span>/, '');
if (!correo) h = h.replace(/\s*<a href="mailto:"[\s\S]*?<\/a>/, '');
```
Si falta `telefono`, se borra el teléfono **y** el separador `·` junto con él (correcto). Si falta `correo` pero SÍ hay `telefono`, solo se borra el `<a mailto>` — el separador `·` queda huérfano, colgando después del teléfono (ej. `"555-123-4567 ·"`). No afecta el caso ya probado en vivo (SRTOQUES tiene ambos vacíos, cae en la limpieza del `<div class="info">` completo), pero sí afectará al primer tenant real que tenga WhatsApp sin correo. Fix de una línea (mover el `·` a que se limpie junto con cualquiera de los dos que falte, o limpiarlo en un paso aparte) — no aplicado todavía, queda para cuando se toque el archivo de nuevo.

### 2. Discrepancia de datos: `dist/srtoques.html` actual no refleja contenido "ya llenado"
El usuario indicó que ya había llenado la información de ejemplo para `SRTOQUES`. El `dist/srtoques.html` generado por la corrida de validación de la otra CLI, sin embargo, muestra la landing prácticamente vacía: sin logo, sin slogan, sin botón CTA, sin bloque de contacto — `oferta`/`descripcion` caen ambas al campo genérico `descripcion="Alta Calidad"`. Verificado además contra un fetch directo a la API GAS: la fila de `SRTOQUES` no tiene las claves `landing_oferta`/`landing_cta_texto`/`landing_imagen_hero` en absoluto, y `slogan`/`logo_url`/`telefonowhatsapp`/`correoempresarial` siguen vacíos.
Esto no es un bug de código — el motor lee exactamente lo que hay en la hoja. Posibles explicaciones: (a) el usuario llenó los datos **después** de esta corrida de validación, (b) las 3 columnas nuevas todavía no existen en la hoja de `Config_Empresas` (ninguna CLI tiene acceso de escritura a Google Sheets — es un paso manual). Antes de mostrar la demo, **volver a correr `ssg-engine.mjs` y confirmar** que `dist/srtoques.html` ya trae los datos reales.

### 3. Branch `2` (sitio + landing) no probado en vivo
Correctamente señalado por el CLI ejecutor. Revisado por código: la ruta de escritura del segundo archivo (`{slug}-landing.html`), su inclusión en `generatedFiles` (protegido del barrido de huérfanos) y en `demoFiles` (Disallow, nunca sitemap) es simétrica y correcta a la de branch `1`. Sin un tenant real con `modo` pos8=`2` no hay verificación end-to-end — pendiente para cuando exista uno.

### 4. Nit menor
`renderLanding(tpl, company, coSeo, file, sitemapUsed)` — el 5to parámetro `sitemapUsed` nunca se pasa ni se usa. Código muerto, sin impacto funcional.

## Consecuencias
- Ningún tenant existente cambia de comportamiento salvo `SRTOQUES` (el elegido para la prueba) — `PFM` tiene `0` en la posición 8, no-op.
- El feature es aditivo y de bajo riesgo: la posición 8 de `modo` nunca se leía antes de este cambio.
- Deuda registrada: fix del separador huérfano (#1) y validación de branch 2 (#3) quedan pendientes, sin dueño asignado todavía.

---

## Actualización 2026-08-07 — rediseño de `logo_url` (ronda 2, pendiente de pasar a la otra CLI)

El usuario pidió empacar las 3 columnas nuevas (`landing_oferta`, `landing_cta_texto`, `landing_imagen_hero`) dentro del campo `logo_url` existente, separadas por `|`, para no agregar tantas columnas en Sheets.

**Verificación**: `logo_url` es leído directamente por más de 10 puntos del SPA fuera de este feature (`js/modules/core.js:fixDriveUrl()`, invocado desde `public.js` L18/389/449/560/663/937/1197/1271/1719, `pos.js` L233/835, `ui.js` L330) para el logo del header, ticket de POS, burbuja del hub y JSON-LD — ninguno de esos sitios tiene noción de "modo landing".

- `fixDriveUrl()`/`directDriveImage()` usan un regex que busca el patrón de Drive en cualquier parte del string y toma el primer match encontrado → **empacar solo URLs (`"{logo}|{hero}"`) es seguro**, con cualquiera de los 2 slots vacío o lleno, sin tocar el SPA.
- El heurístico de respaldo de `fixDriveUrl()` (`js/modules/core.js:82`: string sin `/` ni `.`, longitud > 20 → se trata como ID de Drive crudo) es débil: si `logo_url` quedara como texto libre (`landing_oferta`/`landing_cta_texto` empacados ahí, con imágenes vacías — el caso del "ejemplo 2" del usuario), ese heurístico podría interpretar el texto como un ID válido y generar una URL de imagen rota en el header/POS/hub/JSON-LD de ese tenant → **empacar texto libre en `logo_url` NO es seguro**.

**Decisión final**: `logo_url` se extiende a `"{logo}|{hero}"` (2 slots, ninguno requerido; sin `|` = comportamiento idéntico al actual). `landing_oferta` y `landing_cta_texto` se mantienen como columnas dedicadas — la reducción de "3 columnas nuevas" a "2 columnas nuevas" fue el máximo margen seguro sin arriesgar el logo de toda la app. `landing_imagen_hero` se retira del plan como columna independiente.

**Cambio de código pendiente** (aún no implementado por ninguna CLI): en `renderLanding()` (`scripts/ssg-engine.mjs`), reemplazar la resolución actual de `logo`/`heroSrc` (líneas 88-89) por un split de `company.logo_url` en `|`. Detalle completo y snippet en `plan-landing-pages-multitenant.md`, sección "Rediseño de `logo_url`". No requiere tocar `js/modules/core.js` ni ningún archivo del SPA.

---

## Actualización 2026-08-07 (2) — ronda 2 implementada, verificada de forma independiente por SuitOS

La otra CLI implementó el split de `logo_url` (líneas 88-93 de `renderLanding()`) y el fix del separador huérfano (hallazgo #1 de este ADR). Verificación propia, sin depender solo del reporte de la otra CLI:

- `node --check scripts/ssg-engine.mjs` → OK.
- Código leído línea por línea: `const [logoRaw, heroRaw] = (company.logo_url || '').split('|').map(s => (s || '').trim());` + `heroSrc = directDriveImage(heroRaw) || directDriveImage(logoRaw) || directDriveImage(coSeo.imagen_url)` — coincide exactamente con el diseño acordado en el plan.
- **Test aislado propio** (réplica exacta de la función, no el test de la otra CLI) contra los 5 casos de `logo_url` (`solo-logo`, `logo|hero`, `vacío|hero`, `texto-libre`, `vacío`) y los 4 casos de contacto (`ambos`, `solo-tel`, `solo-mail`, `ninguno`): **todos correctos**, incluido el caso que antes fallaba (`solo-tel` → ya no deja `·` huérfano).
- Confirmado que `SuitLandings/landing-template.html` no fue tocado — la estructura `data-tel`/`data-tel-sep`/`mailto:` sigue siendo la que asumen los regex de limpieza.
- Resto de `ssg-engine.mjs` (branch `2`, robots.txt, sitemap, barrido de huérfanos) sin cambios respecto a la ronda 1 ya verificada — confirmado por lectura completa del archivo.

**Hallazgo #1 (separador huérfano): CERRADO — corregido y verificado.**

**Pendiente aún**: hallazgo #2 (contenido real de `SRTOQUES` en Sheets) y #3 (branch `2` sin probar en vivo) — ver siguiente actualización para el resultado de la corrida en vivo post-ronda-2.

---

## Actualización 2026-08-07 (3) — hallazgo #2 resuelto: bug real y activo en datos de producción

Corrida en vivo post-ronda-2 contra la API GAS real: `dist/srtoques.html` sigue vacío (sin logo, sin oferta, sin CTA, sin contacto). Investigado el porqué con un fetch directo: el valor **actual en la hoja** de `SRTOQUES.logo_url` es:

```
"||Envio Gratis en tu primer pedido|No te quedes sin tu toque|"
```

Esto es el formato del **"ejemplo 2" original del usuario** (4 slots pipe-delimitados: logo vacío, hero vacío, oferta, cta) — **no** el formato final acordado (`"{logo}|{hero}"`, solo 2 slots de imagen, oferta/cta en columnas propias). `renderLanding()` solo destructura los primeros 2 segmentos del split (`[logoRaw, heroRaw]`), así que la oferta/CTA en las posiciones 2 y 3 quedan invisibles para la landing — de ahí el vacío en `dist/srtoques.html`.

**Más grave**: este valor **ya está rompiendo el logo en el resto de la app en vivo, ahora mismo**, no como riesgo teórico. Verificado con la implementación real de `fixDriveUrl()`:
```
fixDriveUrl("||Envio Gratis en tu primer pedido|No te quedes sin tu toque|")
→ "https://lh3.googleusercontent.com/d/||Envio Gratis en tu primer pedido|No te quedes sin tu toque|"
```
Una URL de imagen rota, servida en cualquier punto del SPA que muestre el logo de `SRTOQUES` (header, ticket de POS, burbuja del hub, JSON-LD — los mismos 10+ call sites listados en la actualización del rediseño de `logo_url`). Esto confirma en datos reales exactamente el riesgo que motivó excluir `landing_oferta`/`landing_cta_texto` de `logo_url` en el diseño final.

**Acción requerida del usuario (manual, en Sheets)**:
1. Corregir `SRTOQUES.logo_url` a formato válido: vacío, una sola URL de logo, o `"{logo}|{hero}"` (2 slots de imagen únicamente).
2. Crear las columnas `landing_oferta` y `landing_cta_texto` (todavía no existen en la hoja) y mover ahí el texto "Envio Gratis en tu primer pedido" / "No te quedes sin tu toque".
3. Volver a correr `ssg-engine.mjs` para confirmar que `dist/srtoques.html` sale completo y que el logo del SPA deja de estar roto.

**Hallazgo #2: causa raíz identificada — no es bug de código, es un dato en la hoja con el formato descartado en el diseño final. Corrección pendiente del usuario.**

---

## Actualización 2026-08-07 (4) — ronda 3: diseño final, `logo_url` a 4 segmentos + fix en `core.js`

El usuario preguntó si aceptar coma **y** `|` como divisores resolvería el problema del hallazgo #2, para poder empacar todo en `logo_url` sin agregar columnas. Análisis:

- **Coma: descartada.** No es un problema de "qué carácter usar" — el problema de fondo es que `fixDriveUrl()` (SPA) no separa el campo por ningún delimitador, solo escanea el string completo. Aceptar coma además introduce un riesgo nuevo y real: ofertas en español casi siempre llevan coma natural ("Envío gratis, solo hoy"), así que dividir por coma cortaría esa clase de textos a la mitad.
- **Pipe puro: viable, con una condición.** Como todos los 10+ call sites del SPA que leen `logo_url` pasan por la misma función compartida (`fixDriveUrl()` en `js/modules/core.js`), un fix de una sola línea ahí (tomar solo el primer segmento antes del primer `|`, antes de cualquier otro procesamiento) hace que el SPA quede ciego a cualquier cosa después del primer `|`, sin importar cuántos segmentos se empaquen. Verificado contra las 17 empresas reales: ningún tenant usa `,` en campos tipo URL hoy, y solo `NOET`/`SRTOQUES` usan `|` en `logo_url` (ambas de este mismo feature) — el fix es retrocompatible al 100%.

**Decisión del usuario**: proceder con el pipe puro + fix en `core.js`. Diseño final: **cero columnas nuevas** en `Config_Empresas`. `logo_url = "{logo}|{hero}|{oferta}|{cta}"` (4 segmentos, ninguno requerido). `landing_oferta`/`landing_cta_texto` (columnas propuestas en ronda 2) quedan descartadas — no se crean.

**Cambios de código pendientes** (aún no implementados por ninguna CLI, listos en el plan para la siguiente ronda):
1. `js/modules/core.js` → `fixDriveUrl()`: agregar `.split('|')[0]` a la normalización del string de entrada, antes de cualquier detección de patrón Drive. Único cambio a código compartido de todo este feature — verificar visualmente en el navegador tras aplicarlo (no solo `node --check`), dado que afecta a los 10+ call sites de logo del SPA.
2. `scripts/ssg-engine.mjs` → `renderLanding()`: split de `company.logo_url` a 4 posiciones en vez de 2; eliminar toda referencia a `company.landing_oferta`/`company.landing_cta_texto`.

Detalle completo, snippets exactos y verificación de los 17 tenants en `plan-landing-pages-multitenant.md`, sección "`logo_url` como campo único — diseño final".

---

## Actualización 2026-08-07 (5) — ronda 4: fallback a SUITORG (solo landing)

El usuario preguntó si existía una regla previa de que, si a un tenant le falta información de logo, se toma de `id_empresa=SUITORG`. Búsqueda exhaustiva (código: `js/modules/ui.js`, `pos.js`, `public.js`, `ssg-engine.mjs`; documentación: `reglas-negocio.md`, `ARCHITECTURE.md`, `docs/contexto/glosario.md`, `.suit/memory/patterns/estandares-inmutables.md`, `Documentacion/02-tablas-campos.md`): **no existe tal regla, ni en código ni documentada.** Lo único parecido: `Config_SEO` (no `Config_Empresas`) ya cae a la fila de `SUITORG` cuando el tenant no tiene la suya (`ssg-engine.mjs` líneas 171-172, patrón preexistente) — alimenta título/descripción/OG image, no `logo_url`. En el SPA, si `logo_url` falta, hoy simplemente no se muestra logo (`ui.js:330`, sin fallback).

**Decisión**: agregar el fallback a `SUITORG` como regla NUEVA, pero con alcance acotado — el usuario eligió explícitamente que aplique **solo dentro de `renderLanding()`** (la landing estática), no en el SPA. La opción de extenderlo también al header/POS/hub del SPA queda pendiente de que el usuario la revise por separado; no está autorizada todavía.

**Verificado**: `SUITORG.logo_url = "https://drive.google.com/file/d/1ZJjHncVDFsXiyzoT9pPPt4ojpJfKPAMm/view?usp=sharing"` — un solo link de Drive limpio, sin `|`, seguro para usar directamente como fallback.

**Cambio de código pendiente**: `build()` resuelve `suitorgCompany` una vez fuera del loop; `renderLanding()` recibe un 5to parámetro `suitorgCompany` y lo usa como último eslabón en las cadenas de fallback de `logo` y `heroSrc`. Snippet completo en el plan, sección "Fallback a `SUITORG`...".

---

## Actualización 2026-08-07 (6) — ronda 4b: `foto_agente` agregado a la cadena de fallback de `heroSrc`

El usuario pidió que, si existe `foto_agente`, la imagen hero la tome de ahí. Verificado contra las 17 empresas reales: **todos los valores de `foto_agente` son un link de Drive válido o vacío** — ninguno trae basura (una lectura previa de `SRTOQUES.foto_agente = "openrouter/free"` correspondía a un fetch más antiguo; el dato ya cambió a vacío). Seguro para usar sin parseo defensivo adicional.

**Posición en la cadena**: antes de `logoRaw`, siguiendo el mismo orden de prioridad que ya usa el resto de la app (`js/modules/public.js` líneas 389, 560, 663, 1446, 1491 — siempre `company.foto_agente || company.logo_url`, foto_agente primero). No es una prioridad nueva inventada para este feature, es la que ya existe.

**Cadena final de `heroSrc`**: `heroRaw` → `company.foto_agente` → `logoRaw` → `coSeo.imagen_url` → `suitorgLogoRaw`. Snippet actualizado en el plan.

---

## Actualización 2026-08-07 (7) — decisión futura (no urgente): campo `BRIEFLANDING`, no reusar `tipo_negocio`

El usuario preguntó si podía consolidar contenido futuro de landing en el campo `tipo_negocio` (donde ya vive el BRIEF de marketing: audiencia, dolor, objeciones, tono), reutilizando el mismo formato etiquetado `etiqueta:valor|etiqueta:valor` que ese campo ya usa.

**Verificado y descartado**: `tipo_negocio` es leído con `.includes()` (búsqueda de subcadena sobre el string completo, sin respetar ninguna etiqueta) en 7+ puntos del SPA: `ui.js:321-324` e `public.js:195-197` (branding "Suit.Bite"), `public.js:1130-1133` ("SERVICIOS" → navegación), `public.js:1672-1675` (="MARCA PERSONAL" → oculta galería), `public.js:1685-1688` ("SI_GALERIA" → fuerza galería), `public.js:1822` ("SEGUROS"/"FINANZAS" → formulario), `admin.js:123-130` y `434-437` (match exacto contra `Config_Reportes`/`Config_Dashboard`). Agregar texto libre de marketing a ese campo arriesga colisiones silenciosas (sin error, sin aviso) que cambian branding/navegación/formularios/reportes de ese tenant. Ejemplo cercano ya presente en datos reales: `SRTOQUES.tipo_negocio` contiene `"no_galeria"`, a una letra de `.includes('SI_GALERIA')`.

**Decisión final**: nueva columna dedicada `BRIEFLANDING` (nombre a confirmar), mismo formato etiquetado que `tipo_negocio` pero en un campo **sin consumidores existentes** — cero riesgo de colisión. Regla: ningún valor puede contener `:` ni `|` literal. JSON se evaluó y se descartó (fricción de sintaxis sin beneficio, dado que el usuario es el único editor).

**Alcance**: no mover ahí lo que ya funciona (`logo_url` con logo/hero/oferta/cta, verificado en producción). Solo para contenido de landing futuro, sin fecha objetivo — se implementa cuando el usuario defina las etiquetas concretas. Detalle completo en `plan-landing-pages-multitenant.md`, sección "Extensión futura (opcional, NO urgente): campo `BRIEFLANDING`".

---

## Actualización 2026-08-07 (7) — rondas 3 y 4 implementadas y verificadas (cierre)

Implementadas por SuitOS según el plan (`plan-landing-pages-multitenant.md`, diseño final):

**Ronda 3**:
- `js/modules/core.js:fixDriveUrl()`: `const sUrl = url.toString().trim().split('|')[0].trim();` — el SPA queda ciego a todo lo que siga al primer `|`. Verificado con la implementación real contra el valor roto de producción `SRTOQUES.logo_url = "||Envio Gratis en tu primer pedido|No te quedes sin tu toque|"` → ya **no** genera `https://lh3.googleusercontent.com/d/||...` (ahora devuelve `''` limpio). Confirmado por lectura de los 23 call sites de `fixDriveUrl` en el SPA (`admin.js`, `core.js`, `ui.js`, `pos.js`, `public.js`) — todos pasan por la misma función compartida, el fix aplica uniformemente sin tocar cada call site.
- `scripts/ssg-engine.mjs:renderLanding()`: split a 4 posiciones `[logoRaw, heroRaw, ofertaRaw, ctaRaw]`; `{{OFERTA}}` usa `ofertaRaw`; eliminadas todas las referencias a `company.landing_oferta`/`company.landing_cta_texto`.

**Ronda 4**:
- `build()`: `const suitorgCompany = companies.find(c => (c.id_empresa || '').toString().trim().toUpperCase() === 'SUITORG') || {};` — resuelto una vez fuera del loop.
- `renderLanding(tpl, company, coSeo, file, suitorgCompany = {})`: logo = `logoRaw || suitorgLogoRaw`; heroSrc chain = `heroRaw → foto_agente → logoRaw → coSeo.imagen_url → suitorgLogoRaw`. Ambos branches (`landingMode==='1'` y `==='2'`) pasan `suitorgCompany`.
- SPA (`ui.js`/`pos.js`/`public.js`) sin tocar — fuera de alcance (fallback solo en landing).

**Verificación en vivo contra API GAS real**:
- `node --check` de ambos archivos → OK.
- Corrida real (18 inquilinos): `dist/srtoques.html` sale de plantilla landing con **oferta="Envio Gratis en tu primer pedido"** (segmento 3 del `logo_url` real) y **logo/hero cayendo al de SUITORG** (`id=1ZJjHncVDFsXiyzoT9pPPt4ojpJfKPAMm`, último eslabón de la cadena — SRTOQUES tiene vacíos heroRaw/foto_agente/logoRaw/imagen_url). Sin placeholders `{{...}}` sin resolver. Sin CTA (no hay teléfono/correo en la hoja — regla condicional correcta).
- `robots.txt`: `Disallow: /srtoques.html`. `sitemap.xml`: solo `evasol.html`.
- Resto de tenants sin cambio de comportamiento.

**Pendientes restantes (deuda)**:
- Hallazgo #2 (datos de SRTOQUES en Sheets): el usuario debe completar `logo_url` con un logo real en el slot 1 (hoy `"||Envio...|No te quedes...|"` — válido ya, pero sin imagen). Paso manual en Sheets.
- Hallazgo #3: branch `2` (sitio+landing) sigue sin probarse end-to-end — no existe tenant con `modo` pos8=`2`. Revisado por código, ruta simétrica y correcta.
- Nit #4: `sitemapUsed` como 5to param de `renderLanding` fue reemplazado por `suitorgCompany` — nit resuelto de paso.
- Extensión del fallback a SUITORG al SPA (header/POS/hub): pendiente de decisión del usuario, no autorizada.
