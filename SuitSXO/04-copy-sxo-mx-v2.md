# 04 — Copy Landing sxo.mx-v2 (una sola página, PAS + AIDA)

> Reemplaza el enfoque de `03-copy-sxo.md` (que era para una tienda simulada con carrito/checkout) por una landing de una sola página, sin catálogo real, orientada a captar interés pre-lanzamiento. Framework: hero en PAS, resto en AIDA. Placeholders `[PENDIENTE]` donde falta info real de negocio (procesador de pago, paquetería, catálogo, testimonios).

## 1. Hero (PAS)

- **Headline (9 palabras):** "Sin pena. Sin sorpresas. Sin que nadie se entere."
  - Cada cláusula mapea 1:1 a las 3 tarjetas de Problema (vergüenza / miedo a elegir mal / duda del envío) — refuerzo estructural intencional.
- **Subheadline (3 anclas del brief):** "Envío 100% discreto, guías para quien no sabe por dónde empezar y cero juicios — aquí no hay preguntas tontas."
- **CTA:** "Explorar catálogo" → como el catálogo real **no existe todavía** (nota explícita del brief: no inventar productos/proveedores), el CTA lleva a la sección `#catalogo`, un teaser honesto tipo "el catálogo se está preparando" con captura de correo (solo `localStorage`, sin backend real).

## 2. Problema — 3 tarjetas

| Kicker | Título | Copy |
|---|---|---|
| La vergüenza | Pagar en la caja, cruzar miradas | Hacer fila con "eso" en la mano y esperar que nadie te reconozca. |
| El miedo a elegir mal | Cien opciones, cero experiencia | ¿Y si compras algo que ni te gusta, ni es seguro para tu cuerpo? |
| La duda del paquete | ¿Se va a notar lo que pedí? | ¿Va a llegar con logos que griten qué compraste? |

## 3. Solución — 5 bullets

1. Curaduría body-safe (materiales revisados, sin ftalatos)
2. Empaque neutro, sin logos (caja + factura neutra)
3. Guías para elegir tu primer producto
4. Atención humana, sin juicios
5. Política de cambios clara (sellado vs. abierto)

Línea de cierre: *"No vendemos el juguete. Vendemos tu tranquilidad."*

## 4. Cómo funciona — 3 pasos

01 Elige con nuestra guía → 02 Compra segura → 03 Recibe sin marca

## 5. Confianza

- `[4.5★ — X reseñas]`, 2× `[testimonio]` con `[Nombre, ciudad]` — sin inventar contenido real.
- Sellos: "Envío 100% neutro" / "Pago seguro `[procesador por confirmar]`".

## 6. FAQ — 7 preguntas (las del brief, textuales)

1. ¿Qué aparece en mi estado de cuenta o factura?
2. ¿Cómo sé qué material elegir?
3. ¿Es normal no saber qué comprar?
4. ¿Cómo llega el paquete?
5. ¿Puedo devolver algo?
6. ¿Es seguro pagar aquí? → `[PENDIENTE: nombrar procesador]`
7. ¿Tienen atención por chat? → `[PENDIENTE: definir canal]`

## 7. CTA final

Urgencia suave: "Envío gratis en tu primer pedido — solo por lanzamiento."
Garantía: 30 días de cambio si el producto sigue sellado.
Botón: "Quiero elegir el mío" → vuelve a `#catalogo` (mismo teaser/waitlist).

---

## Dirección de diseño (por qué no es el mismo look que sxo.mx v1)

`sxo.mx` (v1) usa fondo oscuro + acento rosa/morado neón — es el default visual de "sitio para adultos", que es exactamente lo que un comprador primerizo avergonzado *no* necesita ver. v2 usa una paleta "apotecario cálido / wellness": crema-durazno, tinta aubergine, acentos rosa-berry y ámbar terroso — se lee como cuidado personal, no como néon nocturno. Tipografía: Fraunces (display, cálida, con personalidad) + Inter (cuerpo). Elemento de firma: un motivo lineal de "sobre/caja sin marcar" que reaparece en el age-gate, el fondo del hero y los sellos de confianza — amarra visualmente la promesa de discreción a la identidad de marca en vez de ser solo texto.
