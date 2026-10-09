# Veredicto de Pantallas — SuitServiHogar

## 1. Cabecera

| Campo | Valor |
|---|---|
| **Proyecto** | `SuitServiHogar/` (micro-frontend, ADR-029) |
| **Fecha** | 2026-10-08 |
| **Alcance** | Total — 14 pantallas + 5 modales + acceso/sesión |
| **Modo** | estándar (cirugía mínima) |
| **Pantallas cubiertas** | 19/19 (14 screens + 5 modales) + acceso |
| **Resultado general** | **APTO CON REPARACIONES APLICADAS** — bloque A (6 hallazgos alto/esfuerzo bajo-medio) ejecutado en esta misma pasada; bloque M queda como segunda ronda; R a backlog |

## 2. Veredicto general

La app pasa la prueba de 5 segundos en su flujo núcleo (Explorar → contratar → pagar → chat → órdenes), pero arrastraba: (a) **un bug introducido hoy** que invertía el portal por rol (cliente veía el pitch de técnico y el técnico lo perdía), (b) **precio fijo $650** compitiendo con el total real en la pantalla de pago, (c) **conteos falsos** en Explorar que contradecían a Home, (d) **4 CTAs + PIN** en el modal de éxito sin acción dominante, (e) **datos demo presentados como reales** (perfil "Ing. Antonio Reyes", liquidación "María López", reseñas 4.8), (f) **errores invisibles** y pérdida de mensaje en chat. Los seis (bloque A) quedan corregidos y validados (lint 0 · unit 18/18 · e2e 5/5 · build OK).

## 3. Causas de fondo

1. **Capas de demo acumuladas**: pantallas nacieron como mock (Settlement, ProPortal con perfil fijo) y nunca se etiquetaron como demo ni se conectaron a datos reales.
2. **El texto habla el idioma interno**: "Escrow", "Stripe Connect", "PostGIS Ring Radius", "TRANSMISIÓN BLINDADA" llegan sin traducir al usuario final (el glossario define la jerga en vez de eliminarla).
3. **Errores de UI nunca diseñados**: los servicios lanzan `console.error` y la UI no tiene estado de error (solo loading y vacío).
4. **Condiciones de rol duplicadas a mano**: cada sección re-agrupa `isTechnician` por su cuenta → el bug de inversión (A1) pasó porque el e2e no cubre contenido del Perfil de cliente.

## 4. Fichas por pantalla

| # | Pantalla | Propósito (1 frase) | Estado post-fix | Hallazgos |
|---|---|---|---|---|
| 1 | **Home** (`inicio`) | Contratar un servicio en 1 toque | ✅ CTA dominante claro; conteos reales desde DB (`HomeScreen:130`) | M1 jerga `Escrow`/`SAT` en copy; competencia secundaria con "Tabulador SAT" |
| 2 | **Explorar** (`explorar`) | Comparar y elegir técnico | ✅ **A3**: categorías ahora desde DB (antes: conteos hardcodeados `24/18/12/9`, "Ver todas (12)" con 13 items) | M1 jerga (`Escrow Stripe Connect`, `CFDI 4.0`); M3 duplica ubicación + toggle MXN/USD del Header |
| 3 | **Solicitud/Pago** (`solicitud`) | Pagar con garantía retenida | ✅ **A2**: tarifa base usa `order.basePriceMxn/Usd` (antes fija $650 junto a total real) | ~14 bloques y 7 CTAs (registro alto); jerga `PostGIS Ring Radius`, `JWT Verified`, `TRANSMISIÓN BLINDADA`; marcados OBLIGATORIO sin validación real |
| 4 | **Perfil** (`perfil`) | Según rol: cliente administra; técnico gestiona; admin controla | ✅ **A1** (inversión corregida) + **A5** pills demo | M1 jerga (`DC-3 STPS`, `SAT`); M3 botón "Agendar Visita" y SuitMargin compiten con CTA principal |
| 5 | **Mis Órdenes cliente** (`mis-ordenes`) | Ver órdenes contratadas y chatear | ✅ vacío legible (`ClientOrdersScreen:45-50`) | Error de carga solo `console.error` (:26); pantalla **en blanco si no hay sesión** (`App.tsx:410`, M2) |
| 6 | **Mis Órdenes técnico** (`tecnico`) | Mover la orden por su máquina de estados | ✅ estados vacíos + hint dev; tabs claros | 5 errores solo `console.error` (:54,70,81,93,107); jerga `Pagada (Escrow)` |
| 7 | **Chat** (`chat`) | Negociar en vivo | ✅ **A6**: texto se conserva si falla el envío + aviso visible (`ChatScreen:51-64,153`) | Errores de carga/foto solo console (:47,71) |
| 8 | **Admin Panel** (`admin`) | 4 pestañas de control | ✅ tab bar clara (Dashboard/Técnicos/Disputas/Config) | — |
| 9 | **Login** (solo sin sesión) | Entrar con Google | ✅ copy de marca + beneficios + error inline; doble salida (Google / sin sesión) | Botón persona del Header **muerto** (`Header.tsx:122`, M2) |
| 10 | **Reseña** (`review`) | Calificar tras el servicio | ✅ mínimo, 2 CTAs | — |
| 11 | **Glossario** (`glossary`) | Definir términos | ⚠️ define la jerga en vez de eliminarla de la UI | R |
| 12 | **Liquidación/Escrow** (`escrow`) | Ver desglose del corte | ✅ **A5** pill DEMO en header | Todo el contenido es canned (`SettlementEscrowScreen:4-22`); camino único desde el modal de éxito; jerga CFDI/SAT/CLABE |
| 13 | **Privacy/Terms** | Legal | ⚠️ alcanzables solo vía Login; `currentScreen 'privacy'/'terms'` **muertas** (sin setter, `App.tsx:459-465`) | R1 |
| 14 | **Margin** (`margin`) | Cotizador con IA | ✅ pestañas + error visible | desde Perfil, razonable |
| M1 | **PaymentSuccessModal** | Confirmar pago y continuar | ✅ **A4**: 1 CTA principal ("Continuar al Chat") + desglose/calificar secundarios + "Regresar al Inicio"; PIN con aviso "solo dar al terminar" | jerga `Escrow Protegido • Stripe Connect` |
| M2 | **TechnicianProfileModal** | Vista previa del técnico | ✅ 2 CTAs claros | badge `Depósito Escrow Protegido` |
| M3 | **RulesModal** | Reglas antes de pagar | ✅ 1 CTA | `Stripe Connect` en copy |
| M4 | **ColoniaSelectorModal** | Elegir colonia | ✅ limpio | — |
| M5 | **ScheduleVisitModal** | Agendar verificación | ⚠️ campos con datos demo (`Calle Praxedis Balboa`, `16 Octubre 2024`) | R2 |

## 5. Renombres (jerga → lenguaje de usuario)

| Jerga actual (ejemplo) | Propuesto | Dónde |
|---|---|---|
| "Escrow" / "Garantía Escrow" | "Garantía retenida" / "Tu pago está protegido" | Home:72, Booking:685, ClientOrders:7 |
| "Stripe Connect" | quitar del copy visible (es infraestructura) | Home:190, Rules:44, Settlement |
| "PostGIS Ring Radius" / "JWT Verified" / "TRANSMISIÓN BLINDADA" | "Cobertura de 200 m" / "Sesión segura" / "Conexión segura" | Booking:232,665,136 |
| "Retención fiscal integrada SAT (CFDI)" | "Impuestos incluidos" (detalle en Legal) | Booking:530 |
| "PIN de Liberación" | "Código de entrega" | PaymentSuccess:60 |
| "Desglose de Liquidación Escrow" | "Ver desglose de tu pago" | PaymentSuccess (ya acortado a "Ver desglose de liquidación") |
| "DC-3 STPS" | "Constancia de trabajo" (siglas en tooltip) | ProPortal:499 |

## 6. Plan A / M / R

**A — ejecutado en esta pasada (2026-10-08):**
1. ✅ A1 `ProPortalScreen:189` condición invertida → `isTechnician` (cliente ya no ve pitch de técnico; técnico recupera su portal)
2. ✅ A2 `BookingEscrowScreen:511-512` precio fijo → `order.basePriceMxn/Usd` *(nota: el "doble dólar" reportado era falso positivo del parser — `-$${}` renderiza `-$12.00` correcto)*
3. ✅ A3 `ExploreScreen` array hardcodeado → prop `categories` desde DB (como Home) + "Ver todas (N)" dinámico
4. ✅ A4 `PaymentSuccessModal` 4 CTAs → principal "Continuar al Chat" + secundarios apilados (mantiene "Regresar al Inicio" que usa el e2e)
5. ✅ A5 pills **Vista demo / datos de ejemplo / DEMO** en perfil (identidad AR, bento $22,000, reseñas) y header de Liquidación
6. ✅ A6 `ChatScreen` conserva el texto si falla el envío + aviso rojo visible

**M — segunda ronda (efecto medio):**
1. M1 Renombres de la §5 en CTAs principales (Home, Booking, PaymentSuccess)
2. M2 Botón de login del Header conectado + guard de `mis-ordenes` sin sesión → a Login
3. M3 Quitar de Explorar: ubicación y toggle MXN/USD duplicados con Header; doble botón back (Header vs Settlement/Booking)
4. M4 Errores visibles (toast) en órdenes/foto de chat (además de chat ya hecho)

**R — backlog (bajo efecto o alcance amplio):**
1. R1 Limpiar rutas muertas `'privacy'/'terms'` como `currentScreen`; ampliar camino de `escrow`
2. R2 ScheduleVisitModal con datos demo → vaciar o etiquetar
3. R3 Glossario: eliminar jerga de la UI en vez de definirla
4. R4 Pantalla de pago: reducir de ~14 bloques/7 CTAs (registro fuera de esta pasada)

## 7. Checklist "5 segundos" (post-fix)

| Pantalla | ¿Entiende en 5s? | Acción principal única |
|---|---|---|
| Home | ✅ | Solicitar un Servicio |
| Explorar | ✅ | Elegir técnico / contratar |
| Pago | ⚠️ (registro alto, ver R4) | Pagar $X MXN |
| Perfil cliente | ✅ (post-A1) | Ver Mis Órdenes / Contratar |
| Perfil técnico | ✅ (post-A1) | Ver Mis Órdenes |
| Mis Órdenes (cliente/técnico) | ✅ | Chat / Iniciar ruta |
| Chat | ✅ | Enviar mensaje |
| Admin | ✅ | Dashboard |
| Login | ✅ | Continuar con Google |
| Éxito de pago | ✅ (post-A4) | Continuar al Chat |
| Liquidación | ⚠️ (demo etiquetada) | — |

## 8. Método, fuentes y límites

- **Método**: skill `pantalla-limpia` (read-only → veredicto); inventario por exploración de `src/components/screens/` (14), `src/components/modals/` (5), ruteo en `App.tsx`, puerta de acceso (`LoginScreen`, `useDevAuth`, Req#22), evidencia `archivo:línea`.
- **Fuentes**: código fuente, `tests/e2e/flujo-dev.spec.ts` (qué botones exige), ejecución validación (lint/unit/e2e/build), DOM real en navegador.
- **Límites**: no se midió con usuarios reales (usabilidad percibida = heurística); no se auditaron accesibilidad WCAG completa ni performance; copy legal (Privacy/Terms) no revisado con lenguaje legal.
- **Supuestos**: modo estándar (sin variantes creativas); datos demo aceptables **etiquetados** en vez de eliminados (usuarios reales los verán solo en modo dev).
- **Registro**: fixes A aplicados en el mismo ciclo; bloque M/R queda aquí como única lista (no se creó tracker nuevo — ref `GuiaTotal/PENDIENTES.md`).
