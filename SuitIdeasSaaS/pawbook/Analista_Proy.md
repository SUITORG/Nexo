# Analista_Proy — PawBook

> Investigado: 2026-10-11 | Fuentes consultadas: 8 (whitelist: informes de mercado, Capterra, Reddit con engagement alto)

## Resumen ejecutivo
PawBook tiene mercado real y creciente ($130M→$221M, CAGR 8%) con dolor documentado y reciente (no-show "epidemic" 2026 en r/doggrooming). Los incumbentes existen pero se segmentan: Gingr $95/mo es premium, Revelation $39-55 es para boarding/daycare — el groomer móvil independiente queda en un hueco $19-29. Riesgo #1: MoeGo/Square escalando hacia abajo al segmento solo.

## Clasificación sugerida
- **Industria:** Software B2B / SaaS de gestión para servicios a domicilio
- **Nicho:** Groomers móviles y salones pequeños de peluquería canina (1-5 personas)
- **Especialización:** Reservas con depósito obligatorio + perfil de mascota (vacunas) — el no-show como problema núcleo
- **Hipótesis inicial vs hallazgo:** se mantuvo (nicho sub-atendido confirmado); refinada de "pet care general" a "grooming con foco no-show"

## Pilar 1 — Fundamentos expertos del sector
- Mercado global pet grooming software: $130M (2025) → $221M (2032), CAGR 8.0%; Norteamérica 42% del ingreso (QY Research 2026-03; MarketIntelo 2025-08)
- Concentración baja: top-5 ~fragmentado; tier premium (Gingr $95/mo, multi-sede) vs tier medio (MoeGo, PetLinx) vs legacy (123Pet, Groomsoft)
- Principio: el software de este nicho retiene por lock-in de datos (historial de mascota + agenda), no por features — migrar dueño+perfiles es doloroso

## Pilar 2 — Productos de éxito del sector
### Competidores (precios verificados Capterra/market reports)
| Producto | Precio | Para quién |
|---|---|---|
| Gingr | $95/mo | salones multi-sede, premium |
| Revelation Pets | $39-55/mo | boarding/daycare con QuickBooks |
| DaySmart Pet | $29/mo | multi-servicio pet |
| MoeGo | mid-market | grooming con app móvil |
| Time To Pet | ~$25/mo | paseadores/sitters (no grooming) |
| 123Pet | low-price | operaciones muy chicas |

- Patrón replicable: perfil mascota + vacunas + recordatorios (todos lo tienen); **depósito integrado al reservar es el diferenciador más pedido y menos estandarizado**
- Hueco: $19-29/mo para el groomer móvil solo — entre "gratis con Square" y "Gingr caro"

## Pilar 3 — Necesidades reales de los usuarios
### Frustraciones frecuentes (r/doggrooming, threads 2024-2026 con engagement alto)
- **No-show "epidemic"** (marzo 2026, 3 no-shows en una mañana, Dallas): huecos en agenda que no se rellenan; "nunca lo había visto tan mal en 10 años"
- Depositos: casi todos los threads de 2021-2026 los discuten; los que los implementan reportan que "shockingly, now they never miss appointments"
- Confirmaciones por texto no bastan: "responden al confirmar y aun así no aparecen"
- Booking out 8 semanas → cada no-show duele el doble (hueco grande perdido)
### Lo que piden y no existe (en los threads)
- Cobro de depósito automático en el momento de reservar (hoy lo hacen a mano por Zelle/Venmo)
- "Card on file" simple sin necesidad de Stripe completo
- Política de cancelación configurable (24h = 50%, 48h = 100% — la regla común de los foros)

## Pilar 4 — Tendencias, oportunidades y posicionamiento
### Tendencias
- Mobile-first para groomers móviles (viven del celular)
- Deposito-as-default: la práctica se normalizó en la comunidad 2024-2026
### Huecos sin cubrir
- Precio $19-29 para 1-2 personas (los 6+ incumbentes empiezan en $29 con features multi-sede que el solo no usa)
- Depósito con política de cancelación configurable como feature central, no add-on
### Perfil de usuario más interesante
- Groomer móvil solo o dúo, agendado 2-8 semanas, 30-50% de ingreso perdido por no-shows, ya pregunta por deposits en foros
### Ángulo diferencial recomendado
- "Cada reserva con depósito" — el producto SObRE el no-show, no un booking calendar más

## Evidencia desconfirmatoria
- Square Appointments / Fresha gratis cubren agenda básica; el depósito existe como feature en algunos (Fresha tiene deposits) → diferenciarse solo en precio es insuficiente; hay que ser "el de los depósitos" con política inteligente
- MoeGo ya tiene AI + app móvil y escala hacia abajo — puede copiar el ángulo depósito en 1 release
- Churn: groomers quiebran/cierran más que software buyers enterprise; LTV incierto

## Veredicto
- **Viabilidad:** alta
- **Riesgo #1:** Fast-follow de MoeGo/Square al ángulo depósito
- **Siguiente paso recomendado:** landing + 5 primeros groomers de contacto directo (el canal del nicho es offline/Instagram, no ads)
