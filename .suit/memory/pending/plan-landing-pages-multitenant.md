# Plan: Landing Pages multi-tenant (flag en `modo`, plantilla estática vía SSG)

## Status
**Rondas 1, 2, 3 y 4 implementadas y verificadas (2026-08-07).** Ver `ADR-023-landing-pages-multitenant.md` para el detalle completo de verificación y hallazgos.

Resumen ronda 4: se verificó que NO existe hoy ninguna regla de fallback de `logo_url` a `SUITORG` (ni en código ni documentada) — lo único parecido es que `Config_SEO` sí cae a `SUITORG` cuando el tenant no tiene fila propia, pero eso no toca `logo_url`. El usuario pidió agregar ese fallback para cuando un tenant no tenga su propio logo/hero. Alcance decidido: **solo dentro de `renderLanding()`** (landing estática) — el SPA (header/POS/hub) no se toca en esta ronda; extenderlo también ahí queda pendiente de revisión posterior del usuario, no autorizado todavía. Ver sección "Fallback a `SUITORG`..." abajo.

Resumen ronda 1: código correcto y verificado en vivo (`SRTOQUES` genera landing, resto de tenants sin cambio, robots/sitemap correctos); un bug cosmético (separador huérfano cuando falta correo pero hay teléfono) y el branch `2` (sitio+landing) sin probar en vivo por falta de un tenant con ese valor — documentados como deuda en el ADR.

Resumen ronda 2: se implementó `logo_url = "{logo}|{hero}"` (2 slots, solo imágenes) + fix del separador huérfano — verificado correcto con pruebas propias. Pero al correr contra datos reales se encontró que el usuario ya había puesto en `SRTOQUES.logo_url` el formato de 4 segmentos (`"||oferta|cta|"`, sin imágenes) — que **ya estaba rompiendo el logo del SPA en vivo** (confirmado ejecutando `fixDriveUrl()` real contra ese valor: genera una URL de imagen rota). Ver ADR-023, actualización (3).

Resumen ronda 3 (diseño final, reemplaza ronda 2): en vez de forzar 2 columnas separadas, el usuario pidió evaluar empacar TODO (`logo`, `hero`, `oferta`, `cta`) en `logo_url` con `|`. Comprobado: aceptar coma como delimitador adicional NO es seguro (ofertas en español suelen llevar coma natural — "Envío gratis, solo hoy" — se cortaría mal); pipe puro SÍ es viable pero requiere endurecer `fixDriveUrl()` en `js/modules/core.js` con una línea (tomar solo el primer segmento antes del primer `|`) para que el SPA quede ciego a lo que venga después. Verificado contra las 17 empresas reales: ningún tenant depende hoy de que `fixDriveUrl` procese más allá del primer `|` (solo `NOET`/`SRTOQUES` tienen `|` ahí, ambas de este mismo feature) — cambio retrocompatible. El usuario eligió este camino: **cero columnas nuevas**, `logo_url = "{logo}|{hero}|{oferta}|{cta}"`.

## Decisiones tomadas con el usuario (2026-08-07)
1. **Campo**: el flag de landing va en `modo` (posición 8 / índice 7), **no** en `modo_sitio` — confirmado explícitamente por el usuario.
2. **Arquitectura**: estática, generada por `scripts/ssg-engine.mjs` (mismo pipeline/cron/GitHub Pages que ya existe). Sin servidor nuevo, sin puerto nuevo.
3. **Contenido**: columnas nuevas en `Config_Empresas` (Google Sheets), reusando al máximo las columnas que ya existen. Diseño FINAL (ronda 3, ver sección "`logo_url` como campo único — diseño final"): **cero columnas nuevas**. `logo_url = "{logo}|{hero}|{oferta}|{cta}"` (4 segmentos, ninguno requerido), leído en `renderLanding()` y aislado del SPA vía un fix de una línea en `fixDriveUrl()` (`js/modules/core.js`).
4. **SEO**: el usuario confirmó que **solo EVASOL se indexa** — consistente con dejar toda landing (incluida una eventual de EvaSol) en `noindex, nofollow` sin excepción, para no canibalizar el único sitio indexable.
5. **Contenido de `SRTOQUES`**: el usuario ya lo llenó él mismo como caso de ejemplo/prueba — no requiere trabajo adicional de contenido antes de implementar.
6. **Skill nueva**: autorizado crear `landing-pages` en `.suit/registry/skills.yaml` (mismo patrón que `cotizaciones-engine`/`reservations-engine`).
7. **Fallback a SUITORG (ronda 4)**: cuando un tenant no tiene logo/hero propio, la landing usa el logo de `SUITORG` como último recurso — confirmado que esta regla NO existía antes en ningún lado. Alcance autorizado: **solo la landing**, no el SPA (header/POS/hub) — esa extensión queda pendiente de revisión posterior, sin autorizar todavía.

---

## Hallazgo crítico (por qué el plan NO usa `modo_sitio`)

El usuario propuso originalmente el campo `modo_sitio` con el ejemplo `HIDDEN,0,0,0,0,0,0,1`. Verificado contra la API real de GAS (`action=getAll`, 17 empresas):

- **`modo_sitio` hoy es un string simple** (`HYBRID` / `NOHYBRID`), sin formato CSV. Lo leen `js/modules/core.js`, `public.js` y `router.js` para el modo HUB/WHITE del SPA — feature completamente distinta, no tocar.
- **El patrón CSV del ejemplo ya existe hoy, en vivo, en el campo `modo`**:
  - `SRTOQUES.modo = "HIDDEN,0,0,0,0,0,0,1"` (8 valores)
  - `PFM.modo = "HIDDEN,1,1,1,1,1,1,0"` (8 valores)
- `parseModo()` (`js/modules/core.js:169-182`) documenta el formato como `VISIBILIDAD,STRIPE,EXPRESS,POS,PRODUCTOS,INVENTARIOS,BODEGA` y **solo lee `parts[0..6]`** (7 posiciones). La posición 8 (`parts[7]`) existe en datos reales pero **nunca se lee** — es un slot libre de facto, sin migrar nada.

Conclusión: extender `modo` en la posición 8 es la opción de menor riesgo — cero migración de las 16 filas de `modo_sitio`, cero conflicto con el gate HUB/WHITE ya en producción.

### Impacto inmediato en datos reales
Del resto de 17 empresas, solo dos tienen 8 valores en `modo` hoy:

| Empresa | `modo` actual | Posición 8 | Efecto al activar el parser |
|---|---|---|---|
| `SRTOQUES` | `HIDDEN,0,0,0,0,0,0,1` | `1` | Pasa a modo landing-only (ver semántica abajo) — **es la empresa que el usuario eligió para probar**, así que este efecto es intencional/conveniente, pero debe confirmarse explícitamente antes del primer deploy. |
| `PFM` | `HIDDEN,1,1,1,1,1,1,0` | `0` | Sin cambio de comportamiento (`0` = solo sitio, igual que hoy). |

El resto (`ROBERTO_V`, `TOPLUXF`, `PRPT` = `HIDDEN,0`; el resto = valor único `HIDDEN`/`PROD`) no llegan a la posición 8 → sin cambio. Blast radius real: **una sola empresa cambia de comportamiento el día 1, y es la elegida para la prueba.**

---

## Semántica del flag (posición 8 de `modo`)

| Valor | Significado | Comportamiento en `ssg-engine.mjs` |
|---|---|---|
| `0` o ausente | Solo existe el sitio (comportamiento actual, sin cambios) | Genera `dist/{slug}.html` (SPA/template actual) como hoy. No genera landing. |
| `1` | Landing-only — el sitio NO se puede habilitar | Genera `dist/{slug}.html` **desde la plantilla de landing**, no desde el SPA. No hay sitio SPA para ese tenant. |
| `2` | Sitio + landing, ambos activos | Genera `dist/{slug}.html` (SPA, igual que hoy) **y además** `dist/{slug}-landing.html` (plantilla de landing nueva). |

---

## Arquitectura

### Carpeta nueva: `SuitLandings/`
Subproyecto sin servidor propio (no entra en `.suit/registry/projects.yaml` con `servers:` — es una plantilla consumida en build-time, no un servicio corriendo). Contiene:
- `SuitLandings/landing-template.html` — plantilla HTML de landing profesional (hero, propuesta de valor, oferta/CTA, contacto, footer), con placeholders `{{...}}` para que `ssg-engine.mjs` los reemplace con `.replace()` — mismo mecanismo que ya usa con `index.html`, sin agregar motor de templating ni dependencia nueva.

### Cambios en `scripts/ssg-engine.mjs`
1. Cargar `landing-template.html` además de `index.html` (una sola vez, fuera del loop).
2. Helper local (sin importar `js/modules/core.js` — `ssg-engine.mjs` es Node standalone, mantenerlo así):
   ```js
   function getLandingMode(company) {
       const parts = (company.modo || '').split(',');
       return parts.length > 7 ? parts[7].trim() : '';
   }
   ```
3. Dentro del loop por inquilino:
   - `landingMode = getLandingMode(company)`
   - Si `landingMode === '1'`: renderizar el archivo principal (`fileName(coId)`) desde `landing-template.html` en vez de `index.html`. **No** se agrega a `sitemapUrls` (ni siquiera si `isReal` — ver SEO abajo). Se agrega a la lista de `Disallow` de `robots.txt`.
   - Si `landingMode === '2'`: generar el sitio normal como hoy, **y además** un archivo adicional `{slug}-landing.html` desde `landing-template.html`, agregado a `generatedFiles` (para que el barrido de huérfanos de ADR-022 no lo borre) y a `Disallow`.
   - Cualquier otro valor (`0`/ausente/inválido): comportamiento actual sin cambios.
4. El barrido de huérfanos (F1.5 / ADR-022) no requiere cambios — ya borra cualquier `.html` en `dist/` que no esté en `generatedFiles`, y ambos casos nuevos agregan sus archivos ahí.

### `logo_url` como campo único — diseño final (ronda 3)

**Historial**: ronda 2 dejó `landing_oferta`/`landing_cta_texto` como columnas separadas porque empacar texto libre en `logo_url` rompía el logo del SPA cuando las imágenes venían vacías (confirmado con datos reales de `SRTOQUES` — ver ADR-023). El usuario pidió evaluar una alternativa: aceptar coma **y** `|` como divisores para no crear columnas. Evaluado y descartado lo de la coma (una oferta como "Envío gratis, solo hoy" se cortaría mal); en su lugar se validó que `|` solo, con un fix puntual al SPA, sí permite empacar todo sin columnas nuevas. El usuario eligió este camino.

**Por qué `logo_url` sigue siendo el único campo afectado**: es leído directamente por más de 10 puntos del SPA fuera de este feature (`js/modules/core.js:fixDriveUrl()` ← `public.js` L18/389/449/560/663/937/1197/1271/1719, `pos.js` L233/835, `ui.js` L330). Hoy esa función escanea el string completo buscando un patrón de Drive sin split alguno — cualquier texto libre después de un link válido puede activar su heurístico de respaldo (`core.js:82`: "sin `/` ni `.`, longitud >20 → trátalo como ID de Drive crudo") y generar una URL de imagen rota. Verificado con datos reales: el valor actual de `SRTOQUES.logo_url` (`"||Envio Gratis en tu primer pedido|No te quedes sin tu toque|"`) YA produce `https://lh3.googleusercontent.com/d/||Envio Gratis...` vía `fixDriveUrl()` — bug activo, no teórico.

**Fix requerido en `js/modules/core.js` (`fixDriveUrl`)** — una línea, al inicio de la función:
```js
fixDriveUrl: (url) => {
    if (!url) return "";
    const sUrl = url.toString().trim().split('|')[0].trim(); // ← nueva línea: ignora todo después del primer |
    // resto de la función sin cambios (idMatch, heurístico de ID crudo, etc.)
    ...
```
Verificado contra las 17 empresas reales (fetch directo a la API GAS): **ningún campo tipo URL de ningún tenant usa `,` hoy**, y solo `NOET`/`SRTOQUES` usan `|` en `logo_url` — ambas ya parte de este feature. El cambio es retrocompatible: para cualquier valor sin `|`, `.split('|')[0]` devuelve el string completo sin alterarlo.

**Formato final de `logo_url`**: `"{logo}|{hero}|{oferta}|{cta}"` (4 segmentos, ninguno requerido — vacío o ausente en cualquier posición cae al fallback correspondiente).
- Sin `|` → comportamiento idéntico a hoy (un solo logo), sin cambios.
- Con 1+ `|` → posiciones ausentes quedan `''`, no rompen nada (verificado con pruebas propias, ver ADR-023).

**Cambio de código necesario en `ssg-engine.mjs` (`renderLanding()`)** — reemplaza las líneas actuales 82-93 (resolución de `oferta`, `ctaTexto`, `logo`, `heroSrc` desde `company.landing_oferta`/`company.landing_cta_texto`/`company.logo_url`):
```js
const [logoRaw, heroRaw, ofertaRaw, ctaRaw] = (company.logo_url || '').split('|').map(s => (s || '').trim());
const slogan = company.slogan || '';
const oferta = ofertaRaw || slogan;
const ctaTexto = ctaRaw || 'Contactar por WhatsApp';
const suitorgLogoRaw = (suitorgCompany.logo_url || '').split('|')[0].trim(); // ver fallback SUITORG abajo
const logo = logoRaw || suitorgLogoRaw || '';
const heroSrc = directDriveImage(heroRaw) || directDriveImage(company.foto_agente) || directDriveImage(logoRaw) || directDriveImage(coSeo.imagen_url) || directDriveImage(suitorgLogoRaw);
const seoDesc = ofertaRaw || company.descripcion || slogan || nombre;
```
Y en el bloque de `.replace()`, cambiar `{{OFERTA}}` para usar `ofertaRaw` en vez de `company.landing_oferta`:
```js
.replace(/{{OFERTA}}/g, (ofertaRaw || slogan || company.descripcion || '').trim())
```
`landing_oferta`/`landing_cta_texto` como propiedades de `company` **ya no se leen en ningún lado** — se eliminan todas sus referencias.

### Fallback a `SUITORG` cuando falta logo/hero (nuevo — alcance: SOLO la landing, no el SPA)

**Verificado**: no existe hoy ninguna regla, en código ni documentada, que haga fallback de `logo_url`/logo a `SUITORG`. Lo único parecido es que `Config_SEO` ya cae a la fila de `SUITORG` cuando el tenant no tiene la suya propia (`ssg-engine.mjs`, líneas 171-172, patrón preexistente) — pero eso alimenta título/descripción/OG image, no `logo_url`. En el SPA (`js/modules/ui.js:330`, `pos.js:233`), si `logo_url` falta hoy simplemente no se muestra logo — sin fallback a nada.

**Decisión del usuario**: agregar el fallback a `SUITORG` **solo dentro de `renderLanding()`** (landing estática), sin tocar el SPA (header/POS/hub siguen exactamente igual que hoy, sin fallback). Opción de extenderlo también al SPA queda pendiente de revisión posterior por el usuario — no implementar todavía.

**Verificado seguro**: `SUITORG.logo_url = "https://drive.google.com/file/d/1ZJjHncVDFsXiyzoT9pPPt4ojpJfKPAMm/view?usp=sharing"` — un solo link de Drive limpio, sin `|`. Se le aplica el mismo `.split('|')[0]` defensivo que a cualquier otro campo, por si algún día también usa el formato extendido.

**Cambio de código necesario en `ssg-engine.mjs` (`build()`)** — resolver `suitorgCompany` una sola vez, fuera del loop, junto a la carga de plantillas:
```js
const companies = data.Config_Empresas.map(normalizeKeys);
const suitorgCompany = companies.find(c => (c.id_empresa || '').toString().trim().toUpperCase() === 'SUITORG') || {};
```
Y pasarlo como 5to argumento en las 2 llamadas existentes a `renderLanding(...)` (branch `landingMode === '1'` y branch `landingMode === '2'`):
```js
renderLanding(landingTemplateContent, company, coSeo, file, suitorgCompany)
```
`renderLanding()` cambia su firma a `function renderLanding(tpl, company, coSeo, file, suitorgCompany = {})` — snippet del cuerpo ya incluido arriba.

**Orden final de fallback para `heroSrc`** (de más a menos específico): `heroRaw` (hero propio, si se llenó explícitamente) → `company.foto_agente` (foto real del negocio/agente, si existe) → `logoRaw` (logo propio como hero) → `coSeo.imagen_url` (imagen SEO designada) → `suitorgLogoRaw` (logo de SUITORG, último recurso). `foto_agente` va antes que `logoRaw` porque así lo hace ya el resto de la app (`public.js` L389/560/663/1446/1491: siempre `company.foto_agente || company.logo_url`, foto_agente primero) — se sigue la misma prioridad ya establecida, no una nueva. Verificado con datos reales: las 17 empresas tienen `foto_agente` o vacío o un link de Drive válido — ninguna trae basura, seguro sin parseo defensivo adicional.

---

## SEO (regla noindex)

Decisión: **toda landing page es `noindex, nofollow`, sin excepción — incluida una eventual landing de EvaSol.**

Razonamiento (extensión razonada de lo que el usuario confirmó para tenants demo): una landing es contenido de conversión de propósito único, típicamente duplicado/parcial respecto al sitio principal — indexarla arriesga canibalización de la página real de EvaSol en buscadores. Mantener la regla simple (landing = siempre noindex) evita tener que decidir caso por caso y es coherente con la regla de negocio innegociable de `CLAUDE.md`/ADR-022 (solo `grupoevasol.com`/EvaSol es indexable, y ni siquiera todas sus páginas). **Si el usuario prefiere que la landing de EvaSol específicamente sí sea indexable, es un ajuste de una línea — se deja marcado aquí para confirmarlo antes de implementar.**

- `sitemapUrls`: nunca incluye archivos de landing.
- `robots.txt`: `Disallow` para cada archivo de landing generado (tanto el caso `1` como el `-landing.html` del caso `2`).

---

## Caso de prueba: `SRTOQUES`

`modo="HIDDEN,0,0,0,0,0,0,1"` → landing-only, confirmado intencional por el usuario. **Estado real verificado (2026-08-07)**: `SRTOQUES.logo_url = "||Envio Gratis en tu primer pedido|No te quedes sin tu toque|"` — formato de ronda 2 descartado (4 segmentos pero pensado para 2, oferta/cta en posiciones que `renderLanding()` de ronda 2 no lee), y confirmado que esto **ya rompe el logo del SPA en vivo** vía `fixDriveUrl()` (ver ADR-023). Con el diseño final de ronda 3 (`logo_url` a 4 segmentos + fix en `core.js`), este mismo valor pasaría a ser válido tal cual (`logo=''`, `hero=''`, `oferta="Envio Gratis en tu primer pedido"`, `cta="No te quedes sin tu toque"`) — pero sigue conviniendo que el usuario agregue un logo real en la posición 1 para que la landing no salga sin imagen. Paso de verificación: tras implementar ronda 3, correr `ssg-engine.mjs` localmente y confirmar que `dist/srtoques.html` sale con oferta/CTA correctos y que el logo del SPA deja de estar roto.

---

## Fases de ejecución (mapeadas a `.suit/workflows/feature.yaml`)

1. **analyze**: hecho — diseño final sin columnas nuevas, todo en `logo_url` (ver secciones de arquitectura arriba).
2. **plan** (este documento) → aprobación del usuario.
3. **implement** (ronda 1, YA HECHO por la otra CLI — ver ADR-023):
   - Crear `SuitLandings/landing-template.html`. ✅
   - Modificar `scripts/ssg-engine.mjs` (helper `getLandingMode`, branch de render, robots.txt, sitemap, generatedFiles). ✅
   - Agregar entrada `suit-landings` a `.suit/registry/projects.yaml` (sin `servers:`, tipo plantilla). ✅
   - Registrar skill `landing-pages` en `.suit/registry/skills.yaml`. ✅

   **Ronda 2 (YA HECHO — logo_url a 2 slots + fix separador — ver ADR-023):** ✅

   **Ronda 3 (YA HECHO — logo_url a 4 slots + fix core.js — diseño final):** ✅
   - En `js/modules/core.js`, `fixDriveUrl()`: `.split('|')[0]` aplicado (verificado contra valor real roto de SRTOQUES — ya no genera URL rota). ✅
   - En `renderLanding()`: split a 4 posiciones `[logoRaw, heroRaw, ofertaRaw, ctaRaw]`, referencias a `landing_oferta`/`landing_cta_texto` eliminadas. ✅
   - Cero columnas nuevas en Sheets. ✅

   **Ronda 4 (YA HECHO — fallback a SUITORG, solo landing):** ✅
   - `build()` resuelve `suitorgCompany` fuera del loop. ✅
   - `renderLanding()` recibe `suitorgCompany` como 5to arg en ambas llamadas (branch 1 y 2). ✅
   - Cadena heroSrc: `heroRaw` → `foto_agente` → `logoRaw` → `coSeo.imagen_url` → `suitorgLogoRaw`; logo: `logoRaw` → `suitorgLogoRaw`. ✅
   - SPA sin tocar (fuera de alcance). ✅
4. **validate**: `node --check` en ambos archivos (`scripts/ssg-engine.mjs` y `js/modules/core.js`); ejecución real contra la API GAS confirmando: `dist/srtoques.html` = landing con oferta/CTA/logo/hero resueltos desde `logo_url` (logo cayendo al de SUITORG si sigue vacío), resto de tenants sin cambio, `robots.txt`/`sitemap.xml` correctos, sin huérfanos. Además, confirmar en el SPA (o por lectura de código) que `fixDriveUrl(SRTOQUES.logo_url)` ya no genera una URL rota. Si existe oportunidad, crear un tenant de prueba con `modo` pos8=`2` para cerrar la validación pendiente del branch `2` (ADR-023 #3).
5. **commit**: solo tras validación en vivo y aprobación explícita del usuario (no autopublicar a `main` — recordar que cualquier push dispara `deploy.yml` a GitHub Pages).

---

## Validación
- `node --check scripts/ssg-engine.mjs` sin errores.
- Ejecución real contra la API GAS: `dist/srtoques.html` generado desde `landing-template.html`, resto de 16 tenants sin cambio de archivo/contenido.
- `robots.txt` incluye `Disallow` para el archivo de landing de `SRTOQUES`.
- `sitemap.xml` sin URLs de landing.
- Barrido de huérfanos (ADR-022) sigue funckionando: ningún archivo de landing válido se borra, ningún huérfano viejo sobrevive.

## Riesgo
Bajo-medio. La parte `ssg-engine.mjs`/`modo` sigue siendo puramente aditiva (posición 8 nunca se leía antes). La novedad de ronda 3 es el fix de una línea en `js/modules/core.js:fixDriveUrl()` — **código compartido usado por los 10+ call sites de logo en todo el SPA, no solo landing**. El cambio en sí es trivial y retrocompatible (verificado: ningún tenant depende hoy de que `fixDriveUrl` procese algo después de un `|`), pero por tocar una función central del SPA conviene una verificación visual rápida en el navegador (header/POS/hub de un par de tenants sin `|` en su `logo_url`) antes de dar por cerrada la ronda 3, no solo `node --check`. Blast radius real de día 1: una sola empresa (`SRTOQUES`, la elegida para probar).

## Rollback
`ssg-engine.mjs`/`SuitLandings/`: revertir el archivo y borrar la carpeta, sin migración de datos que deshacer. `js/modules/core.js`: revertir la línea agregada a `fixDriveUrl()` — si `SRTOQUES.logo_url` ya se actualizó al formato de 4 segmentos para entonces, seguiría rompiendo el logo del SPA hasta corregir el dato en Sheets (no hay rollback automático de datos, es responsabilidad manual del usuario).

---

## Extensión futura (opcional, NO urgente): campo `BRIEFLANDING`

**Status**: decisión de diseño documentada el 2026-08-07, sin implementar. Sin fecha objetivo — se implementa cuando el usuario defina las etiquetas concretas que necesita agregar. No bloquea nada de lo ya implementado (rondas 1-4).

### Motivo
Cuando la landing necesite más contenido del que ya cabe en `logo_url` (testimonios, urgencia, headline alterno, prueba social, etc.), hay dos caminos que se descartaron explícitamente:
- **Agregar más posiciones a `logo_url`** — descartado: ese campo ya está en su límite seguro (4 slots) y es compartido con el SPA; cada posición nueva aumenta el riesgo de romper el logo en header/POS/hub y la probabilidad de error al contar posiciones.
- **Reusar `tipo_negocio`** — descartado: ver hallazgo de riesgo abajo.

### Decisión
Nueva columna dedicada, nombre propuesto `BRIEFLANDING` (a confirmar por el usuario), con el mismo formato etiquetado que ya usa `tipo_negocio`:
```
etiqueta1:valor1|etiqueta2:valor2|etiqueta3:valor3...
```
Es una columna **nueva**, sin ningún consumidor existente en el código — a diferencia de `tipo_negocio`, nadie hace `.includes()` sobre ella hoy, así que no hay riesgo de colisión con lógica ya escrita.

**Regla de formato obligatoria**: ningún valor puede contener literalmente `:` ni `|` — rompería el parser de etiquetas (misma restricción que ya aplica a `logo_url`, que tampoco tolera `|` dentro de un valor).

**Por qué no JSON**: se evaluó como alternativa (más robusto ante caracteres especiales dentro de los valores) pero se descartó — el usuario es el único editor de la hoja y ya domina el formato etiquetado de `tipo_negocio`; JSON agrega fricción de sintaxis (comillas, escapes, un error de sintaxis tumba el parseo completo) sin beneficio real para este caso de uso de un solo editor.

### Por qué NO reusar `tipo_negocio` (hallazgo de esta sesión)
Confirmado que 7+ puntos del SPA hacen `.includes()` sobre el string **completo** de `tipo_negocio`, sin respetar ninguna estructura de etiquetas — las etiquetas ayudan a un humano a leer el campo, pero son invisibles para este código:

| Archivo | Chequeo | Efecto si coincide |
|---|---|---|
| `ui.js:321-324` | `.includes()` de comida/snack/food/alimentos/restaurante/pfm/pmp/hmp/bite | Cambia branding a "Suit.Bite" |
| `public.js:195-197` | mismo `isFood` + `.includes("MARCA PERSONAL")` | Activa layout de marca personal |
| `public.js:1130-1133` | `.includes('SERVICIOS')` | Habilita navegación de clusters |
| `public.js:1672-1675` | `=== 'MARCA PERSONAL'` (exacto) | Oculta la galería |
| `public.js:1685-1688` | `.includes('SI_GALERIA')` | Fuerza mostrar la galería |
| `public.js:1822` | `.includes('SEGUROS')` / `.includes('FINANZAS')` | Cambia el formulario de contacto |
| `admin.js:123-130`, `434-437` | match **exacto** contra `Config_Reportes`/`Config_Dashboard` | Decide qué reportes/widgets se muestran |

Cualquier texto libre de marketing agregado a `tipo_negocio` puede coincidir por accidente con estas palabras y cambiar silenciosamente el comportamiento de la app para ese tenant (branding, navegación, formularios, reportes visibles) — sin error, sin aviso. Ejemplo real y cercano ya presente en los datos actuales: `SRTOQUES.tipo_negocio` contiene `"no_galeria"`, a una letra de distancia de activar por accidente `.includes('SI_GALERIA')`.

### Alcance
No mover a `BRIEFLANDING` lo que ya funciona (`logo_url` con logo/hero/oferta/cta, verificado en producción — rondas 1-4). Es exclusivamente para contenido de landing nuevo que se agregue más adelante, cuando el usuario lo necesite.
