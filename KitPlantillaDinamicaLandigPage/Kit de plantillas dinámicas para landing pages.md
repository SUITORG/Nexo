# Kit de plantillas dinámicas para landing pages

Tres archivos: `theme.schema.json` (contrato), `presets.json` (catálogo de plantillas, tipografías y paletas), `ejemplo-cliente.json` (un tema completo listo para renderizar).

---

## 1. Tipos de landing page (el campo `type`)

| Tipo | Objetivo | Secciones mínimas | Nota de diseño |
|---|---|---|---|
| `squeeze` | Solo email | hero-form + prueba social | Sin navbar ni links de salida; 1-2 campos ([Unbounce](https://unbounce.com/lead-generation/what-is-a-squeeze-page-anyways-with-examples/)) |
| `lead-capture` | Lead con datos | hero-split, value-props, lead-form | Formulario repetido arriba y abajo |
| `click-through` | Calentar antes de la compra | hero, beneficios, cta-band | Un solo CTA que lleva al checkout |
| `sales-long-form` | Venta directa | oferta, bonos, garantía, precios, FAQ | Medida de línea 700-820px |
| `vsl` | Venta por video | hero-video, cta-band | CTA revelado al minuto X |
| `product-detail` | Ecommerce | galería, especificaciones, comparativa | Imagen a la derecha en desktop |
| `saas-trial` | Registro/trial | logos, features, pricing | Logos de clientes sobre el pliegue |
| `webinar` / `event` | Registro con fecha | countdown, ponentes | Urgencia real, no falsa |
| `booking` | Agenda | calendar-embed alto | Cero distracciones |
| `local-service` | Llamada/visita | map-hours, teléfono sticky | Móvil primero, clic-a-llamar |
| `course` / `ebook-lead-magnet` | Infoproducto | temario, bonos | Portada mockup |
| `waitlist-coming-soon` | Lista de espera | hero-form | Una promesa, un campo |
| `pricing` / `comparison` | Decisión | tabla, FAQ | Tabla accesible, no solo color |
| `app-download` | Instalación | badges de tiendas, capturas | Detectar sistema operativo |
| `thank-you` | Post conversión | siguiente paso, upsell | Donde vive el píxel de conversión |
| `link-in-bio` / `microsite-brand` | Hub / marca | bloques verticales | Ancho 520px |

## 2. Tipografías (10 pares) y paletas (6)

Están en `presets.json` → `fontPairs` y `palettes`. Reglas que tu renderizador debe imponer: máximo 2 familias y 3 pesos, cuerpo ≥16px, display ≥24px, interlineado 1.5-1.6 en cuerpo y 1.15-1.25 en títulos, medida 45-75 caracteres, y contraste WCAG AA (4.5:1 cuerpo, 3:1 texto grande). Evita fuentes quemadas (Roboto, Montserrat, Poppins, Open Sans, Lato) como principal: usa [Fontshare](https://www.fontshare.com/) o [Google Fonts](https://fonts.google.com/) vía CDN con fallback de sistema.

Combinaciones seguras par + paleta: `tp-01`+`pal-violet` (SaaS), `tp-02`+`pal-teal` (editorial/producto), `tp-05`+`pal-terra` (lujo/infoproducto), `tp-06`+`pal-teal` (salud), `tp-09`+`pal-navy` (finanzas), `tp-07`+`pal-mono` (respuesta directa).

## 3. Cómo lo interpreta tu código

Flujo: **entrada (URL o JSON pegado) → fetch → validar → normalizar → tokens CSS → render de bloques → publicar**.

1. **Entrada**. Si es URL: `fetch` con timeout, límite de tamaño (p. ej. 512 KB), solo `https`, lista blanca de dominios o proxy propio para evitar SSRF. Si es texto: acepta JSON, YAML o TOML y conviértelo a JSON.
2. **Validar** contra `theme.schema.json` con **Ajv** (`ajv` + `ajv-formats`) o **Zod** si prefieres tipos en TypeScript (`zod-to-json-schema` genera el schema desde el tipo). Devuelve errores por ruta al cliente.
3. **Normalizar**: fusiona `preset → overrides del cliente → defaults`. Resuelve `fontPair`/`palette` por id. Calcula la escala tipográfica con la razón (`base * ratio^n`). Verifica contraste con **culori** o **colorjs.io** y auto-ajusta la luminosidad del primario si falla AA.
4. **Tokens**: emite variables CSS en `:root` (`--color-primary`, `--font-heading`, `--space-4`, `--radius-md`) y, si usas Tailwind v4, mapéalas en `@theme` para que las clases usen los tokens sin recompilar.
5. **Render**: un registro `{ nombre de bloque → componente }` y recorres `sections` en orden. Bloque desconocido = se omite con aviso, nunca rompe la página. Sanitiza `custom-html` y todo copy con **DOMPurify** (`isomorphic-dompurify` en servidor).
6. **Salida**: Next.js con ruta dinámica `/[cliente]` leyendo el tema desde Supabase, o generación estática a HTML con **Eta/Nunjucks** si quieres exportar archivos.

## 4. Herramientas recomendadas

| Necesidad | Herramienta |
|---|---|
| Validación de schema | `ajv` + `ajv-formats`, o `zod` |
| Tipos desde schema | `json-schema-to-typescript` |
| Color, contraste, oklch | `culori`, `colorjs.io` |
| Tokens multiplataforma | `style-dictionary` (formato [Design Tokens del W3C](https://tr.designtokens.org/format/)) |
| CSS con variables | Tailwind v4 `@theme`, o CSS puro |
| Componentes base | shadcn/ui + Radix (accesibles) |
| Fuentes | `next/font`, Fontshare CDN, Bunny Fonts (sin cookies) |
| Sanitización | `isomorphic-dompurify` |
| Plantillas HTML | Eta, Nunjucks, o React server components |
| Editor visual opcional | [GrapesJS](https://grapesjs.com/) o [Puck](https://puckeditor.com/) para que el cliente arrastre bloques y exporte el mismo JSON |
| Persistencia y formularios | Supabase (tabla `themes` + `leads`) |
| Imágenes | `sharp`, `next/image`, Cloudinary |
| QA visual | Playwright screenshots, Lighthouse CI, axe-core |
| Migración de versiones | campo `version` + funciones `migrate_1_0_to_1_1` |

## 5. Contrato mínimo de un bloque

Cada componente recibe `{ content, variant, background, tokens }` y nada más. Así cualquier tema nuevo funciona sin tocar el componente. Define para cada bloque su `content` esperado (por ejemplo `hero-form`: `title`, `subtitle`, `bullets[]`, `form.fields[]`, `form.submitLabel`, `media`). Documenta esos contratos en un `blocks.md` y tu app podrá incluso pedirle a un modelo que genere temas válidos automáticamente.
