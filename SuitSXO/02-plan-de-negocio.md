# 02 — Plan de Negocio: Marketing, Sitio Web y Mejoras

## Objetivo

Lanzar y hacer crecer una tienda de productos para adultos (online + presencial opcional), usando como referencia los patrones observados en el Top 5 de sex shops de la Bahia de San Francisco.

---

## 1. Plan de Marketing

### 1.1 Segmentos objetivo

| Segmento | Necesidad | Mensaje |
|---|---|---|
| Compradores online (discrecion) | Privacidad absoluta | "Envio sin marca, factura neutra, paquete anonimo" |
| Primerizos / curiosos (verguenza) | Acompanamiento sin juicio | "Staff educador, ambiente sin pretexto" |
| Parejas / regalos | Sorprender sin incomodidad | "Bundles de regalo, guias por ocasion" |
| Comunidad LGBTQ+ y kink | Representacion y nicho | "Espacio inclusivo, talleres para tu comunidad" |
| B2B (hoteles, despedidas) | Paquetes para eventos | "Kits de despedida, venta por volumen" |

### 1.2 Canales

| Canal | Accion |
|---|---|
| SEO local | Yelp + Google Business optimizados (fotos, horas, categorias). Responder resenas. |
| Contenido educativo | Blog/video "como elegir tu primer juguete", "higiene de juguetes", guias por ocasion. |
| Redes sociales | TikTok/Instagram Reels (solo SFW), unboxings educativos, educadores invitados. |
| Email/SMS | Capturar en tienda + web: newsletter educativa, descuentos para suscriptores. |
| Eventos comunitarios | Talleres mensuales, fiestas del cliente, giveaways de temporada. |
| Influencers / afiliados | Educadores y creadores de nicho, codigos de afiliado. |
| Ads | Google/Meta con orientacion "salud y bienestar / intimidad" (politicas publicitarias adultas). |

### 1.3 Fases de ejecucion

| Fase | Acciones | Meta |
|---|---|---|
| 0-3 meses | Landing + catalogo web, SEO local, redes, lista email | 300 suscriptores, 10 resenas |
| 3-6 meses | Blog educativo, primeros talleres, programa de afiliados | 50 pedidos/mes |
| 6-12 meses | Eventos mensuales fijos, segmentacion email avanzada, B2B | 150+ pedidos/mes, 40% recompra |

---

## 2. Que Poner en el Sitio Web

### 2.1 Home

- Propuesta de valor: "Juguetes y educacion. Envio discreto y sin juicios."
- Pillares: productos curados (body-safe), categorias, resenas destacadas, sellos de discrecion (envio/factura), CTA de regalo.

### 2.2 Catalogo y producto

- Fotos con buena luz, seguras para redes (sin contexto sexual explicito).
- Descripciones que educan y resuelven objeciones (material body-safe, limpieza, como elegir talla).
- Badges (nuevo, top rating), resenas con texto, productos relacionados.
- Bloque "body-safety": materiales (silicone medica), libre de toxinas.

### 2.3 Discrecion (seccion propia)

- Pagina "Como enviamos": empaque neutro, sin marca en el exterior, factura con nombre neutro.
- FAQ de envio, privacidad y politica de devolucion.

### 2.4 Pago y cuenta

- Checkout de 1 paso, guest checkout, metodos de pago "adult-friendly", descriptor de cargo claro.
- SSL, verificacion de edad 18+ al entrar (checkbox + politica).

### 2.5 Contenido (el moat real)

- Blog con guias por tipo de usuario (principiante, pareja, kink, postparto, 50+).
- Guias de regalo por ocasion, FAQ de mitos.

### 2.6 Prueba social

- Resenas integradas, insignias de inclusion (LGBTQ+, trans, tallas).

### 2.7 Rendimiento

- LCP < 2.5s (gran parte de ventas es mobile).
- Age gate con localStorage.
- Analytics y retargeting con politica de privacidad.
- Recovery de carrito abandonado.

---

## 3. Mejoras Detectadas en los Competidores

| # | Hallazgo | Oportunidad | Nuestra mejora |
|---|---|---|---|
| 1 | Mr. S: gran presencial, e-commerce debil | Online limita escala | Tienda online robusta desde el dia 1 + retiro en tienda |
| 2 | La mayoria: diseno web anticuado | UX deficiente, mobile malo | UX premium, mobile-first, copy ES/EN |
| 3 | Good Vib: educacion excelente pero precio alto | No hay linea de entrada | Linea de entrada accesible + upsell premium |
| 4 | Comunidad solo local | No capturan al visitante online | Suscripcion educativa por email (alcance nacional) |
| 5 | Inclusividad solo en algunas | No es transversal | Catalogo body-positive y multiedad por defecto |
| 6 | Discrecion poco explicada | Se dice pero no se demuestra | Pantalla de "Confianza" en checkout (envio, factura, PV) |
| 7 | Sin rutas para primerizos | Compradores nuevos se pierden | Ruta de compra por perfil (quiz: primerizo / pareja / kink) |
| 8 | Precios no transparentes | Desconfianza | Precios claros, costo de envio visible desde el inicio |

### Mejoras heredables clave

1. Educacion = venta: no vendas el juguete, vendes la solucion segura con guia.
2. Privacidad como producto: demostrarla en cada pagina del checkout.
3. Comunidad = retencion: eventos y newsletter convierten compra unica en fidelidad.
4. Diversificar audiencia: la mayoria habla solo a su comunidad local; nosotros online primero.
5. Ventas cruzadas: sugerir lube con cada juguete, kits por temporada (despedidas, san valentin, pride).

---

## 4. KPIs

| KPI | Referencia |
|---|---|
| Conversion web | 2-4% |
| Ticket promedio | USD 35-60 |
| Recompra | 20-40% |
| Costo por adquisicion | SEO bajo / ads 15-25% |
| Resenas | 4.5+ |

## 5. Pasos siguientes

1. Validar regulacion local y elegir hosting/pagos adult-friendly (blocker principal).
2. Construir el MVP: landing + catalogo (30-40 SKU) + checkout con ruta de confianza.
3. Arrancar SEO local y lista de email.
4. Primer taller comunitario a los 3 meses.
5. Iterar con KPIs: recompra y ticket promedio.

> Nota: el ecosistema SuitOS ya tiene los modulos base para esto (SuitProductos catalogo, SuitPos venta, SuitAI chat) — se pueden reutilizar en lugar de construir desde cero.