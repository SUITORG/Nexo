# Plan: Posicionamiento SEO para SuitOrg (plataforma multi-tenant sobre grupoevasol.com)

## Status
Ejecutado, revisado por SuitOS y validado (2026-08-02). Fases 1-3 completas + fix de huérfanos (F1.5, ver abajo). Fase 4 (deuda de seguridad) permanece en radar, sin cambios. Fase 5 (inquilino demo → cliente real) pendiente de decisión de negocio, no ahora. Sin commit — ver sección "Revisión SuitOS".

## Contexto (clave — corregido tras aclaración del usuario)

**`grupoevasol.com` es el sitio real y comercial de EvaSol** (cliente real, dueño del dominio). Los demás inquilinos que aparecen "colgados" del mismo dominio (Top Lux, Noe Thermomix, APE, Kinder Patito Feliz, etc.) **no son producción real de esos negocios — son instancias de prueba/demo** que el usuario, como empleado de SuitOrg, usa para probar y mostrar el producto a prospectos. Sus páginas estáticas se sirven como rutas bajo `grupoevasol.com` (ej. `grupoevasol.com/pfm.html`), generadas por `scripts/ssg-engine.mjs`, por practicidad de hosting — no porque esos negocios sean clientes reales de ese dominio.

Esto cambia la prioridad del plan por completo: **el problema no es "cómo posicionar mejor a los inquilinos de prueba", es "sacar el contenido de prueba del radar de los buscadores para no diluir ni arriesgar el SEO real de EvaSol"**. Un sitemap con `Allow: /` y prioridad 0.8 tratando páginas de demo como si fueran negocios reales es exactamente lo que hay que evitar.

### Por qué esto es el problema de fondo
- **Dilución de autoridad temática** para EvaSol: un dominio de energía/baterías indexando también un kínder, una aseguradora y un revendedor de Thermomix no puede rankear bien para nada — y hoy Google SÍ los está viendo, porque nada se lo impide.
- **Confianza/legitimidad**: contenido de demo indexado públicamente puede confundir tanto a clientes de EvaSol como a los prospectos que ven las demos.
- **Riesgo compartido**: cualquier problema en una página de demo (calidad, contenido inconsistente entre pruebas) puede afectar la reputación del dominio completo, incluido EvaSol.
- Nada de esto bloquea que sigas usando `grupoevasol.com/{tenant}.html` para hacer pruebas y demos — el arreglo es de **visibilidad ante buscadores**, no de dónde vive técnicamente el archivo.

---

## Fase 1 — Urgente, hoy: sacar las páginas de prueba/demo del radar de los buscadores

Esto protege el SEO real de EvaSol inmediatamente, sin costo ni migración, y sin cambiar cómo trabajas tú.

### 1.1 `noindex` en toda página que no sea la de EvaSol
En `scripts/ssg-engine.mjs`, al generar cada página, si `coId !== 'EVASOL'` (o el identificador real de EvaSol en `Config_Empresas`), inyectar `<meta name="robots" content="noindex, nofollow">` en el `<head>`. El link sigue funcionando igual para que tú lo abras o lo mandes a un prospecto — `noindex` no bloquea el acceso directo, solo le dice a Google que no lo indexe.

### 1.2 Sacar las páginas de demo del `sitemap.xml`
El sitemap generado debe listar **solo** la(s) página(s) reales de EvaSol. Ahora mismo lista los 13 inquilinos con prioridad 0.8 cada uno — cambiar la lógica de `sitemapUrls.push(...)` para que solo agregue la entrada cuando `coId === 'EVASOL'`.

### 1.3 `Disallow` explícito en `robots.txt` para las rutas de demo
Hoy es `Allow: /` sin excepciones. Agregar `Disallow:` por cada archivo de inquilino de prueba (o un patrón, si el naming lo permite), dejando `Allow` solo para la página real de EvaSol y assets compartidos (CSS/JS/imágenes).

### 1.4 Corregir el dominio real en el generador
`CONFIG.baseUrl` genera el sitemap con `https://suitorg.com/...` — dominio que ni siquiera es el real. Cambiar a `https://grupoevasol.com` para que la única entrada del sitemap (la de EvaSol) apunte al lugar correcto.

---

## Fase 2 — Calidad de página (aplica a EvaSol siempre, y a las demos cuando las compartes con un prospecto)

`noindex` evita que Google las indexe, pero cuando TÚ compartes un link de demo por WhatsApp a un prospecto, sigue importando que se vea profesional — por eso estos puntos valen para ambos casos, no solo para EvaSol.

### 2.1 Personalizar Open Graph / Twitter Card por inquilino
El motor solo reemplaza `<title>`, `description` y `keywords` (líneas 90-93 de `ssg-engine.mjs`). `og:title`, `og:description`, `og:image`, `og:url`, `twitter:title`, `twitter:description` quedan hardcoded del template — hoy, si compartes cualquier link (real o demo), aparece "SuitOrg | Ecosistema Digital" en vez del negocio correspondiente. Extender el mismo patrón `.replace()` a esos campos.

### 2.2 Corregir `og:url` para que sea la URL real de cada página
Hoy es un valor fijo (`grupoevasol.com`, la raíz) para todas. Debe ser `https://grupoevasol.com/{slug}.html` — la URL específica de esa página.

### 2.3 `<link rel="canonical">` — solo relevante para EvaSol
Para las páginas de demo con `noindex` no aporta (Google no las va a indexar de todos modos); sí agregarlo en la página real de EvaSol.

### 2.4 Datos estructurados (JSON-LD `LocalBusiness`) — solo para EvaSol
Mismo criterio: no tiene sentido invertir en rich snippets para páginas que no se van a indexar. Cuando un inquilino de prueba se vuelva cliente real (Fase 5), ahí se le agrega su propio JSON-LD.

### 2.5 Poblar `Config_SEO` de EvaSol con datos reales y completos
Es el único que hoy debe verse perfecto ante buscadores. Los inquilinos de prueba pueden seguir con datos de ejemplo/genéricos — ya no importan para SEO real, solo para que la demo se vea coherente.

### 2.6 Quitar el "chrome" de panel interno de las páginas públicas
Chart.js, indicador de salud de IA, consola falsa ("SYSTEM READY") — pesa Core Web Vitals y resta profesionalismo, tanto en la página real de EvaSol como en cualquier demo que le muestres a un prospecto.

---

## Fase 3 — Pipeline / operación

### 3.1 Automatizar la regeneración del SSG
El build en `dist/` es de abril, ~4 meses desactualizado. Agregar un paso automático (GitHub Action o cron) que corra `scripts/ssg-engine.mjs` cuando cambie `Config_Empresas`/`Config_SEO` de EvaSol específicamente (ya no hace falta que dispare por cambios en inquilinos de prueba, dado que esos ya no se indexan).

### 3.2 Resubmitir el sitemap a Google Search Console tras cada regeneración de la página de EvaSol
Documentar el paso — un sitemap actualizado que Google no vuelve a leer no sirve de nada.

---

## Fase 4 — Endurecer el dominio compartido (protege a EvaSol de lo que corre en el mismo hosting)

Ya documentado en `contexto.md` como deuda técnica, relevante aquí porque si `grupoevasol.com` se marca alguna vez como inseguro (Google Safe Browsing), se cae el posicionamiento de EvaSol por algo ajeno a su negocio. Cerrar:
- API keys hardcodeadas visibles en devtools (`backend/core.js:13`, `CampanasAi/script.js:8-11`, `scripts/agents/vision-audit.js:14`)
- CORS abierto (`*`) en el servidor local
- Sin rate limiting en endpoints públicos
- `execSync` con `shell:true` en FFmpeg (riesgo de shell injection)

Fuera del alcance detallado de este plan (son fixes de seguridad), pero deben quedar en el radar.

---

## Fase 5 — Cuando un inquilino de prueba se vuelve cliente real (decisión de negocio, no ahora)

Solo aplica el día que una demo deja de ser demo. Ahí sí conviene decidir su propio dominio o subdominio — nunca debería quedarse indexándose desde `grupoevasol.com` a largo plazo, aunque sea temporalmente conveniente mientras es prueba. Tres caminos posibles en ese momento:

| Opción | Descripción |
|---|---|
| Subdominio de plataforma propio | `{tenant}.suitorg.com`, si `suitorg.com` existe y está activo |
| Dominio propio del cliente | El estándar real para SEO serio — cada negocio dueño de su activo |
| Mantenerlo bajo grupoevasol.com | Solo aceptable si sigue siendo prueba/no prioritario — no para un cliente pagando |

No requiere decidirse hoy — es una regla a aplicar cuando corresponda, no una migración pendiente.

---

## Validación
- Confirmar en el HTML generado de cada inquilino de prueba: `<meta name="robots" content="noindex, nofollow">` presente.
- Confirmar que `sitemap.xml` solo lista la URL de EvaSol.
- Confirmar `robots.txt` con `Disallow` en las rutas de demo.
- Página de EvaSol: título/descripción/OG/Twitter/canonical/JSON-LD correctos y específicos, sitemap apuntando a `grupoevasol.com` real.
- Herramienta de validación de rich results de Google sobre la página de EvaSol, para confirmar que el JSON-LD es válido.

## Riesgo
Muy bajo. Fase 1 es puramente aditiva (meta tags + exclusión de sitemap/robots) y no cambia ningún flujo de trabajo actual — tú sigues probando/mostrando demos exactamente igual, solo que Google deja de verlas. Fase 2-3 tampoco tocan el SPA principal ni lógica de negocio. Fase 4 es deuda de seguridad ya conocida, no nueva. Fase 5 no tiene riesgo técnico por sí sola al no ser una migración activa.

## Rollback
Fase 1-3: `git checkout -- scripts/ssg-engine.mjs` + no republicar `dist/` hasta confirmar. Sin migraciones de datos.

---

## Revisión SuitOS (2026-08-02)

Ejecución de otro CLI verificada de forma independiente, punto por punto (código real + llamada en vivo a la API GAS + `dist/` regenerado). Fases 1.1-1.4, 2.1-2.6 y 3.1-3.2 correctas tal como se reportaron. `status-bar` conservado con justificación válida (`js/modules/auth.js:112` no tiene guard, se rompería el login).

**Bug encontrado (no reportado por el CLI ejecutor)**: el fix de `noindex` (F1.1) solo se aplica a inquilinos que existen HOY en `Config_Empresas` — un inquilino renombrado/eliminado deja su `.html` viejo en `dist/` sin tocar, indexable, con SEO genérico. Confirmado en vivo: `dist/roomateanl.html` (huérfano de un rename a `ROOMMATENL`) seguía `index, follow` pese al fix. Corregido agregando limpieza de huérfanos al final de `ssg-engine.mjs` (F1.5) — ver ADR-022 y ROADMAP.md P13.13 para detalle completo. Re-verificado: `dist/` = 16 archivos (1 indexable + 15 noindex), `sitemap.xml` = 1 URL, `robots.txt` = 15 `Disallow`, todo coincide con los 17 inquilinos reales.

**Status actualizado**: Ejecutado, validado y con fix de huérfanos aplicado. Sin commit todavía — `dist/` y `scripts/ssg-engine.mjs` quedan como cambios locales pendientes de decisión del usuario (commit + push, o revisión adicional primero).
