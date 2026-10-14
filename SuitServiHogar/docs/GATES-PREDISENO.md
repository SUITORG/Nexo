# Gates de pre-diseño — SuitServiHogar (prueba de las 3 skills)

> Corrida retroactiva: el proyecto ya existe (MVP 41/41). Ejecutado con
> `viabilidad-operativa` + `calidad-minima` + `durabilidad` — 2026-10-13.

---

## 1. Veredicto operativo: APTO CON CONDICIONES

| Pregunta | Respuesta (1-2 líneas) |
|---|---|
| 1. ¿Ágil? | Cliente: 9 pasos, técnico: 7 — sobre el umbral de 7, pero cada paso extra es inherente al escrow (tarjeta, PIN, comprobante); sin escrow serían ~4 y se perdería el diferencial `[supuesto: comparado contra pago directo]`. |
| 2. ¿Tiempo vale la pena? | Sí: ~4 min por orden de cliente, ~5 min de técnico; construcción ya pagada y cada orden mueve dinero real (15% comisión). |
| 3. ¿Cuánto consume? | Cero tokens de IA. Costo por uso ≈ 3% + $0.25 MXN por transacción Stripe `[supuesto: tarifas estándar MX]`; Supabase free tier cubre el piloto de Reynosa. |
| 4. ¿Riesgo de ban? | Bajo: Google OAuth y Stripe Connect son APIs oficiales; sin scraping, sin librerías no oficiales. |
| 5. ¿Dependencias frágiles? | 3 puntos únicos: Supabase (datos+auth), Stripe (pagos), Google (login). Cae Stripe → no se paga; hay webhook + reintentos. `service_role` solo en `server.js`. |

**Condiciones:**
1. Flujo cliente de 9 pasos → añadir indicador de progreso (paso X de 9) para que no se sienta largo `[recomendación de diseño]`.
2. Test semanal con tarjeta `4242…` para detectar cambios de Stripe antes que los usuarios.
3. Backup/export diario de Supabase durante el piloto (era única fuente de verdad).

**Alternativa más simple:** descartada — recortar pasos sacrifica el escrow, que es el 1% diferencial del proyecto.

---

## 2. Veredicto de calidad: PASA CON CONDICIONES

**¿Merece existir?** Sí — resuelve confianza en un sector informal (Reynosa, 115+ técnicos precargados), con Deep-Vetting presencial + PIN antifuga que nadie más da en la zona; el panel juzgador lo aprobó 6.93/10 y sus manuales/evidencia (11 capturas) existen de verdad.

**Piso de calidad para este proyecto:**
- Test de 5 segundos: cada pantalla del flujo cliente/técnico dice con un botón grande qué hacer (ya cumple: "Solicitar", "Iniciar ruta", "Marcar completado").
- Copy en español mexicano, sin jerga financiera al cliente: decir **"pago protegido"**, no "escrow".
- Estados completos en cada orden: Pagada → En progreso → Completado (esperando PIN) → Liberado (ya cubiertos por e2e Playwright).
- PIN siempre visible con advertencia "no compartas hasta que el trabajo esté bien" (ya cumple §7 MANUAL_CLIENTE).
- Comprobante con montos reales MXN y CLABE al liberar (ya cumple §8).

**Checklist de rechazo**: 1 marca →
- [x] *Jerga interna*: copy visible del cliente usa "Escrow" ("Custodia Escrow Activada", "Garantía Escrow", "Desglose de Liquidación Escrow") — MANUAL_CLIENTE §§6.2/7/8.

**Condiciones:** renombrar en UI del cliente "Escrow" → "pago protegido" (mantener "escrow" solo en docs técnicas y backoffice). Con eso pasa limpio.

---

## 3. Veredicto de durabilidad: DURA CON CONDICIONES

| Condición | Estado | Nota (1 línea) |
|---|---|---|
| 1. Conectable después | ~ | Endpoints REST en `server.js` + schema `sh_*` en Supabase = puntos naturales; pero es micro-frontend aislado (ADR-029), no sigue el patrón Suit* estándar. |
| 2. Confiable | ✔ | Validación server-side, RLS, helmet, rate-limit, webhook Stripe, e2e Playwright passing (5/5). |
| 3. Fácil de usar | ✔ | 4 manuales por rol + `qa.bat` (3 ventanas) + auto-login dev; cliente termina en 9 pasos guiados. |
| 4. Entendible | ✔ | Contrato 43 requisitos + docs 05-16 + ADR-029 + PROMPT_ORIGEN. |
| 5. Resiste el cambio | ~ | Versiones con `^` (React 19, Vite 6, Stripe 22) y servicios mantenidos; pero tasa USD/MXN vive en `constants.ts` `[supuesto: rate 18.0 hardcodeado]`. |

**Decisiones de diseño que garantizan el futuro:**
- Tasa de cambio USD/MXN moverla a config/DB (hoy en `constants.ts`), para no redeploy por tipo de cambio.
- Copy de UI ("pago protegido") en config, no en JSX — ya casi está con `constants.ts`.
- Mantener ADR-029: al crecer, registrar en `projects.yaml` con sus puertos (3000/3010) y frontend gates.
- Backup diario de Supabase (repetido del gate 1, es la misma condición).

**Test de conexión futura:** agregar "suscripciones recurrentes" o "chat extendido" = 1 endpoint nuevo en `server.js` + 1 tabla `sh_*` → **agregar 2 cosas, no rehacer**. Pasa.

**Condiciones:** tasa configurable + backup diario.

---

*Gates 1/3 y 2/3 generaron requisitos para `docs/Veredicto-Pantallas-*` y el flujo cliente. Fuente: guia-total → 3 gates de pre-diseño.*
