# Veredicto de Pantallas — SuitServiHogar

> **Fusión de 2 auditorías** (2026-10-08): esta (skill `pantalla-limpia`, fixes aplicados) + la del **Auditor de Operación** (solo lectura, entregable previo en raíz `.md`/`.docx`) — único documento canónico resultante.

## 1. Cabecera

| Campo | Valor |
|---|---|
| **Proyecto** | `SuitServiHogar/` (micro-frontend, ADR-029) |
| **Fecha** | 2026-10-08 |
| **Alcance** | Total — 14 pantallas + 5 modales + acceso/sesión |
| **Modo** | estándar (cirugía mínima) |
| **Pantallas cubiertas** | 19/19 (14 screens + 5 modales) + acceso |
| **Resultado general** | **RECUPERABLE CON CIRUGÍA DE CLARIDAD — APTO CON REPARACIONES APLICADAS**: bloque A ejecutado y validado; bloque M pendiente (2ª ronda); R a backlog. Claridad actual 4/10 → proyectada 8/10 sin tocar arquitectura (criterio Auditor de Operación). |

## 2. Veredicto general

La app funciona: los flujos completos (contratar → pagar protegido → ejecutar → liberar con PIN → calificar) están construidos y cubiertos por pruebas. El problema **no es de funcionalidad sino de comunicación**: cada pantalla intenta decir varias cosas a la vez y habla el idioma interno del negocio ("Escrow" 90+ veces en componentes, "Protocolo Antifuga", "retención SAT") en vez del del usuario — de ahí la sensación de "todo amontonado".

En esta pasada se corrigió el bloque A (6 hallazgos alto × bajo esfuerzo), incluido el **hallazgo más grave** (perfil con condición invertida: el cliente veía el pitch del técnico y el técnico perdía su portal). Validación: lint 0 · unit 18/18 · e2e 5/5 · build OK.

Lo que ya funciona y debe ser el patrón interno: **pantalla de acceso, modal PIN, botón de pago y formulario de reseña — todos con la receta "un mensaje, una acción"**.

## 3. Causas de fondo

- **C1 · Pantallas que dicen todo a la vez**: Inicio apila 7 bloques (héroe, tipo de cambio, urgencias+catálogo, "El Blindaje", convocatoria de técnicos, privacidad, guía — `HomeScreen:50,65,85,156,224,249,267`); Explorar muestra 5 bloques antes de los técnicos; la solicitud apila fotos+horario+dirección+notas largas antes de pagar. **Regla: 1 pantalla = 1 propósito + 1 acción.**
- **C2 · Jerga como idioma principal**: "Escrow" 90+ veces (27 solo en solicitud/pago), "Protocolo Antifuga" (`BookingEscrowScreen:295`), "cadena inmutable de custodia", "peritaje de liberación de fondos", "Deep-Vetting", "SPEI/CLABE". El glosario existe pero está escondido (solo Perfil, `ProPortalScreen:599`) y **define** la jerga en vez de eliminarla.
- **C3 · Público mezclado (corregido)**: `ProPortalScreen:189` con `{!isTechnician && …}` = portal técnico visible al cliente ("85% Neto para el Técnico", "tu prestigio profesional") e invisible al técnico. **A1 corregido** (hoy: `{isTechnician && …}`).
- **C4 · Todo lleva insignia**: 5-8 chips por pantalla ("Oficial", "INE & Biometría", "Blindado", "Certificado de Confianza", "OBLIGATORIO" ×2) — cuando todo resalta, nada resalta.
- **C5 · Duplicaciones**: doble selector de moneda (Header vs `ExploreScreen:146,156`); **modal de colonia montado dos veces** (`App.tsx:311,481`); explicación de la garantía repetida en Inicio/Explorar/Pago/éxito; técnico de ejemplo fijo y reseñas 4.8 demo (A5 etiquetado).
- **C6 · Momentos clave sin acción dominante**: modal de éxito con 4 caminos (A4 corregido); botón "Iniciar sesión" del header **muerto** (`Header.tsx:122`); chat sin contexto de la orden (servicio/monto/estado) y sin entrada visible a la negociación de precio.
- **C7 · Errores invisibles** (hallazgo propio): 8 puntos con solo `console.error`; el chat perdía el texto si fallaba el envío (**A6 corregido**).

## 4. Fichas por pantalla

| # | Pantalla | Propósito (la frase del usuario) | Estado post-fix | Qué lo enturbia · Cambiar (esfuerzo) |
|---|---|---|---|---|
| 1 | **Home** (`inicio`) | "Pido un servicio de confianza" | ✅ CTA dominante + conteos reales DB | 7 bloques; convocatoria de técnicos en portada (`:224`); tipo de cambio destacado (`:85`); blindaje+privacidad repetidos → mover convocatoria a enlace "¿Eres técnico?", degradar divisa, consolidar confianza (M) |
| 2 | **Explorar** (`explorar`) | "Eligo al técnico" | ✅ **A3**: categorías desde DB | 5 bloques antes de la lista; **doble selector moneda** (`:146,156`); "Contratar Garantía"→"Contratar"; tarjeta de 10 elementos → foto/nombre/rating/precio/1 botón (M) |
| 3 | **Solicitud/Pago** (`solicitud`) | "Reviso y pago protegido" | ✅ **A2**: precio base real | "Protocolo Antifuga" (`:295`) como título de fotos; 2 chips OBLIGATORIO; ~14 bloques/7 CTAs; jerga (`PostGIS`, `JWT Verified`, `TRANSMISIÓN BLINDADA`) → renombrar "Fotos del trabajo", 1 obligatoriedad, "Pagar $X (protegido)" (M/R4) |
| 4 | **Perfil** (`perfil`) | cliente: "Mi cuenta y órdenes"; técnico: "Mi portal" | ✅ **A1** + **A5** pills demo | Cliente ve contenido de técnico (A1 ✓); reemplazar AR por usuario real, mover SuitMargin/Glosario a "Herramientas", reordenar portal por uso diario (M) |
| 5 | **Mis Órdenes cliente** | "Mi servicio va así" | ✅ vacío legible | Estados con jerga (`ClientOrdersScreen:7-10`); 6-7 datos sin jerarquía; sin activas/historial → estados simples ("Pagada/En curso/Terminada") + pestañas (M); **blanco sin sesión** (`App.tsx:410`) (M) |
| 6 | **Mis Órdenes técnico** | "Mi siguiente paso en cada trabajo" | ✅ acción por estado clara | Tarjetas 8-10 elementos; doble moneda; iconos sin etiqueta → acción del momento destacada + resto en "⋯", quitar USD (M) |
| 7 | **Chat** | "Acordamos ESTA orden" | ✅ **A6** | Encabezado solo contraparte+"#" (sin servicio/monto/estado); negociación sin entrada visible; sin mensajes de sistema de estado → header contextual + sistema (M) |
| 8 | **Admin** (`admin`) | "Opero el negocio" | ✅ 4 pestañas claras | Pestañas en inglés mezclado ("Dashboard","Config") → unificar idioma (R) |
| 9 | **Login** | "Entra con Google" | ✅ patrón "un mensaje, una acción" | Botón persona del Header **muerto** (`Header.tsx:122`) → conectar o retirar (M) |
| 10 | **Reseña** | "Califico el servicio" | ✅ limpia — sin cambios | — |
| 11 | **Glosario** | "Entiendo los términos" | ⚠️ escondido + título mal escrito **"Glossario"** (`GlossaryScreen:13`) → "Glosario"; enlazar "¿Qué es esto?" donde hay jerga (R) |
| 12 | **Liquidación** (`escrow`) | "Cuánto me depositaron" | ✅ pill **DEMO** | Densidad de sellos/fiscal; doble encabezado; dato dominante único + desglose colapsado (M/R) |
| 13 | **Privacy/Terms** | "Informar" | ⚠️ estándar OK; rutas `currentScreen` muertas (`App.tsx:459-465`) (R) |
| 14 | **Margin** | "Cotizo con IA" | ✅ error visible | Audiencia sin definir (¿técnico?) → limitar o marcar demo (R) |
| M1 | **PaymentSuccessModal** | "Pagué; esto sigue" | ✅ **A4**: 1 principal "Continuar al Chat" | Titular "¡Custodia Escrow Activada!" → "Pago protegido, listo" (M) |
| M2 | **TechnicianProfileModal** | "Veo al técnico" | ✅ 2 CTAs | badge `Depósito Escrow Protegido` |
| M3 | **RulesModal** | "Reglas antes de pagar" | ✅ 1 CTA | `Stripe Connect` en copy |
| M4 | **ColoniaSelectorModal** | "Elijo mi colonia" | ✅ limpio | **montado 2×** en App (`:311,481`) → quitar duplicado (M) |
| M5 | **ScheduleVisitModal** | "Agendo verificación" | ⚠️ datos demo (`Calle Praxedis`, `16 Oct 2024`) (R) |

*Buenas prácticas internas a conservar: modal PIN, flujo de pago, login, reseña.*

## 5. Renombres (jerga → lenguaje de usuario) — tabla unificada

| Hoy se lee | Propuesta | Dónde |
|---|---|---|
| Garantía Escrow | **Pago protegido** ("Escrow" solo en legal/ayuda) | Home:72, Booking:685, ClientOrders:7 |
| ¡Custodia Escrow Activada! | Pago protegido activado | modal éxito |
| Custodia Financiera Escrow Activa | Tu pago está protegido | formulario pago |
| Protocolo Antifuga y Registro Técnico | **Fotos del trabajo** | Booking:295 |
| cadena inmutable de custodia / peritaje de liberación | registro seguro / revisión de tu dinero si hay reclamo | nota evidencia |
| Deep-Vetting | Verificación presencial | perfil |
| Tabulador de Precios / Tarifa Oficial | Tarifa de referencia | Home:97, Explore:126 |
| Contratar Garantía | **Contratar** | Explore:366 |
| Stripe Connect / PostGIS Ring Radius / JWT Verified / TRANSMISIÓN BLINDADA | (ocultar infraestructura) → "Sesión segura" / "Conexión segura" | Home:190, Booking:232,665,136 |
| Retención fiscal integrada SAT (CFDI) | Impuestos incluidos | Booking:530 |
| PIN de Liberación | Código de entrega | PaymentSuccess:60 |
| Depósito en Garantía Escrow (técnico) | Ingresos protegidos | perfil técnico |
| Pagada (Escrow) / En ruta / Liberado | **Pagada / En curso / Liberado** | ClientOrders:7-10, TechnicianOrders:15-18 |
| DC-3 STPS | Constancia de trabajo (siglas en tooltip) | ProPortal:499 |
| Glossario | **Glosario** | GlossaryScreen:13 |

## 6. Plan A / M / R

**A — ejecutado y validado (2026-10-08)** (los A1 del Auditor de Operación coincide 1:1):

1. ✅ **A1** `ProPortalScreen:189` invertida → `isTechnician` (cliente sin pitch técnico; técnico recupera portal)
2. ✅ **A2** Pago: precio base real `order.basePriceMxn/Usd` (antes $650 fijo; el "doble $$" era falso positivo del parser)
3. ✅ **A3** Explorar: categorías/conteos desde DB (antes hardcodeados) + "Ver todas (N)" dinámico
4. ✅ **A4** Modal éxito: 1 CTA principal ("Continuar al Chat") + secundarios apilados (conserva "Regresar al Inicio" del e2e)
5. ✅ **A5** Pills **DEMO** en perfil (AR, $22,000, reseñas) y Liquidación
6. ✅ **A6** Chat conserva el texto si falla el envío + aviso visible

**M — segunda ronda** (unificación de ambos planes):

1. **M1** Renombres §5 — los 6 más visibles: "Pago protegido", "Fotos del trabajo", "Contratar", "Tarifa de referencia", estados simples, "Glosario"
2. **M2** Botón de login del Header (`Header.tsx:122`) conectado o retirado + guard `mis-ordenes` sin sesión → Login
3. **M3** Duplicados: quitar selector de moneda de Explorar (`:146,156`); **quitar montaje doble del modal de colonia** (`App:311,481`); doble back (Header vs Settlement/Booking)
4. **M4** Inicio: sacar "Convocatoria de Prestadores" de la portada (`HomeScreen:224`); degradar bloque de divisa; consolidar confianza en 1 sección
5. **M5** Órdenes cliente: estados simples + pestañas activas/historial; tarjeta con 4 datos +1 CTA
6. **M6** Chat: header con servicio/monto/estado; mensajes de sistema al cambiar estado; entrada visible a negociación
7. **M7** Portal técnico: datos reales (quitar AR demo, hoy solo etiquetado), reordenar por uso diario
8. **M8** Errores visibles (toast) en órdenes/foto de chat (chat ya hecho en A6)

**R — backlog**:

1. R1 Rutas muertas `privacy`/`terms`; camino único de `escrow`
2. R2 ScheduleVisitModal datos demo → vaciar/etiquetar
3. R3 Glosario: enlazar desde la jerga; unificar vocabulario (técnico ≠ prestador/aliado)
4. R4 Pago: reducir ~14 bloques/7 CTAs a registro manejable
5. R5 Admin: pestañas en español; SuitMargin: definir audiencia

## 7. Checklist "5 segundos" (post-fix)

| Pantalla | La persona debe decir… | Primer vistazo muestra… | NO debe aparecer en primer plano |
|---|---|---|---|
| Inicio | "pido un servicio" | categorías + CTA ✅ | reclutamiento, divisas |
| Explorar | "elijo técnico" | lista y filtros ✅ | tabuladores, ISR/IVA, doble moneda |
| Solicitud | "reviso y pago" | resumen + pagar (precio único ✅) | protocolos internos |
| Éxito | "pagué; esto sigue" | 1 acción principal ✅ | cuatro acciones (✅ corregido) |
| Órdenes cliente | "mi servicio va así" | estado simple | "Escrow" |
| Chat | "hablo de esta orden" | servicio + contraparte (falta, M6) | IDs crípticos |
| Órdenes técnico | "mi siguiente paso" | una acción por tarjeta ✅ | doble moneda |
| Perfil | "mi cuenta" / "mi portal" | lo propio del rol ✅ (A1) | contenido del otro rol (✅) |
| Admin | "opero el negocio" | KPIs + pestañas ✅ | inglés suelto |
| Liquidación | "cuánto me pagaron" | monto + destino (DEMO etiquetado ✅) | sellos múltiples |

## 8. Método, fuentes y límites

- **Método**: skill `pantalla-limpia` (read-only → veredicto) sobre inventario completo (`screens/` 14 + `modals/` 5 + ruteo `App.tsx` + acceso `LoginScreen`/`useDevAuth`/Req#22); **fusión** con la auditoría paralela del **Auditor de Operación** (entregable `.md`+`.docx` en raíz, absorbido en este documento).
- **Fuentes**: código con evidencia `archivo:línea`, `tests/e2e/flujo-dev.spec.ts` (botones exigidos), validación ejecutada (lint/unit/e2e/build), DOM real en navegador, capturas sep-oct 2026 (auditor externo).
- **Límites**: sin usuarios reales (heurística, no usabilidad medida); sin auditoría WCAG/performance completa; copy legal no revisado; los números de línea del auditor externo previos a los fixes A de hoy.
- **Supuestos**: modo estándar; datos demo **etiquetados** en vez de eliminados (solo visibles en modo dev).
- **Registro**: bloque M/R vive en este documento (sin tracker nuevo — ref `GuiaTotal/PENDIENTES.md`).
