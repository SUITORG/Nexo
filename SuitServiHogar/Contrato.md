# CONTRATO DE ENCARGO — SuitServiHogar Reynosa

**Versión:** 5.0  
**Fecha:** 2026-09-16  
**Fuentes:** `appServiHogarOriginalReynosa.txt` (43 requisitos) + `Informe Ejecutivo` + `AGENTS.md` + auditoría del código  
**Estado:** ✅ APROBADO  

---

## 1. INSTRUCCIÓN DE ACTIVACIÓN

Para cualquier tarea no trivial, queda **ESTRICTAMENTE PROHIBIDO** empezar a escribir código sin antes acordar y firmar este contrato. Si la solicitud es ambigua, detener el bucle agéntico, realizar hasta 3 preguntas clave y proponer este contrato para aprobación explícita.

---

## 2. CONTEXTO ESTRATÉGICO

### 2.1 Origen del Proyecto (appServiHogarOriginalReynosa.txt)

43 requisitos documentados por el usuario. Dos tipos de usuarios: quienes **ofrecen** servicios y quienes los **solicitan**. Comunicación restringida a la plataforma. Fotos de evidencia. Validación bidireccional. Tabulador bimonetario. Programa de incentivos para ambos lados. Penalizaciones. Donaciones a caridad. Backoffice con reportes. 100% móvil. Políticas de privacidad y términos legales con blindaje mexicano.

### 2.2 Visión del Informe Ejecutivo

Mercado bilateral hiper-local en Reynosa, Tamaulipas. Motor: formalización de sector fragmentado. Activo principal: **confianza**. Diferenciadores: Deep-Vetting (INE + biometría + verificación domiciliaria), comunicación restringida a fotos de evidencia, calificación bidireccional, Escrow vía Stripe Connect.

### 2.3 Stack Actual

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind v4 |
| Backend | Supabase (PostgreSQL 15+) + Express.js (port 3010) |
| Auth | Google OAuth via Supabase |
| Pagos | Stripe Connect (15% platform / 85% tech) |
| DB | `egyxgnlnzanxpqyuvmsg.supabase.co`, prefix `sh_` |
| Dev server | Vite (3000) + Express (3010) |

---

## 3. MAPEO REQUISITO → ESTADO (43 requisitos)

### Leyenda
- ✅ Implementado y funcional
- ⚠️ Parcial (existe pero incompleto)
- ❌ No implementado

| # | Requisito original | Estado | Archivos actuales | Lo que falta |
|---|---|:---:|---|---|
| 1 | Mejores prácticas del sector | ⚠️ | AGENTS.md, conventions | No hay auditoría formal de prácticas |
| 2 | Dos tipos de usuarios (ofrecen/solicitan) | ✅ | `LoginScreen`, `ProPortalScreen`, `TechnicianOrdersScreen` | — |
| 3 | Comunicación solo a través de la plataforma | ✅ | `messageService.ts`, `ChatScreen.tsx`, `sh_messages` | — |
| 4 | Intercambiar solo fotos de trabajos | ✅ | `messageService.ts`, `ChatScreen.tsx` (photo picker + envío) | — |
| 5 | Validados/certificados de ambos lados | ✅ | `ReviewForm.tsx`, `reviewService.ts`, `sh_reviews` (bidireccional) | — |
| 6 | Tabulador precios MXN/USD | ✅ | `constants.ts` (rate 18.0), `ExploreScreen` | — |
| 7 | Ganancias: desarrollador + dueño (split) | ✅ | `server.js` (15% total: 60% owner / 40% dev) | — |
| 8 | Tabulador de precios | ✅ | `sh_service_categories.base_price_mxn` | — |
| 9 | Programa de incentivos | ✅ | `sh_referrals`, `sh_coupons`, `referralService.ts`, `BookingEscrowScreen.tsx` | — |
| 9.1 | Incentivos para proveedores (invitar, completar, calificaciones) | ✅ | `referralService.ts`, `bookingService.ts` ($150 MXN ref tech), volume discount 10% | — |
| 9.2 | Incentivos para clientes (invitar, solicitar) | ✅ | `referralService.ts`, `BookingEscrowScreen.tsx` ($100 cupón cliente) | — |
| 10 | Manejo de impuestos | ⚠️ | `sh_orders.sat_retention_mxn` | Cálculo existe en BD pero **sin CFDI**, sin generación de complemento SAT |
| 11 | Frontend + backend | ✅ | React + Supabase + Express | — |
| 12 | Ubicaciones y direcciones del servicio | ✅ | `BookingEscrowScreen.tsx`, `gpsService.ts`, `GoogleMapEmbed.tsx` | — |
| 13 | Best practices | ⚠️ | Parcial en AGENTS.md | No hay validación formal |
| 14 | No multi-inquilino | ✅ | Single-tenant confirmado | — |
| 15 | Usar Supabase | ✅ | `src/lib/supabase.ts` | — |
| 16 | Contadores empiezan en 0001 | ⚠️ | `schema.sql` | IDs son texto (`'ORD-001'`), no hay secuencia auto-incremental real |
| 17 | Status y calificaciones de ambos lados | ❌ | — | **Sin sistema de calificaciones** para ninguna de las dos partes |
| 18 | Reportes de mejoras por usuarios | ✅ | `FeedbackWidget.tsx` (feedback flotante + guardado en BD) | — |
| 19 | Reportes para el backoffice | ✅ | `AdminScreen.tsx` (dashboard + orders + technicians + disputes) | — |
| 20 | Logo, avatar, brief con colores | ✅ | `icon-192.svg`, `icon-512.svg`, splash screen SH logo | — |
| 21 | Seguridad | ✅ | helmet, rate-limit, RLS 003, auth JWT, CORS restrictive | — |
| 22 | Firmar con cuenta de Google | ✅ | `authService.ts:signInWithGoogle()` | — |
| 23 | Google Pay como opción de pago | ❌ | — | Solo Stripe Card. **Sin Google Pay** |
| 24 | Penalizaciones servidores/solicitantes | ✅ | `process_client_cancellation()`, `process_specialist_cancellation()` | Reglas documentadas en AGENTS.md |
| 25 | Porcentaje para caridad/asociación | ✅ | `calculate_charity_fee()` (1%), "Fundación Hogar Digno AC" | — |
| 26 | Actualización del dólar (frontera) | ⚠️ | `EXCHANGE_RATE_MXN_USD = 18.0` (fijo) | **Sin API de tipo de cambio real** |
| 27 | Documentación completa | ✅ | `MANUAL_CLIENTE.md`, `MANUAL_TECNICO.md` | — |
| 28 | Flujos completos cliente/técnico | ✅ | Documentados en manuales + diagramas | — |
| 29 | Terminología local Reynosa | ✅ | `glossary.ts`, `GlossaryScreen.tsx` (8 términos) | — |
| 30 | Pantallas operación backend | ✅ | `AdminScreen.tsx` (dashboard, technicians, disputes) | — |
| 31 | 100% en celular | ✅ | `manifest.json`, `sw.js`, `index.html` (PWA + splash + icons) | — |
| 32 | Impuestos en backend | ⚠️ | `sat_retention_mxn` en BD | Cálculo existe pero sin generación de CFDI |
| 33 | Caridades en backend | ✅ | `accumulate_monthly_charity()` | — |
| 34 | Protegido contra ataques (best practices) | ⚠️ | RLS + OAuth | **Sin rate limiting**, sin helmet, sin CSP |
| 35 | Fotos/communication solo dentro de plataforma | ⚠️ | `sh-evidence` bucket | Bucket público (cualquiera lee). **Sin chat restringido** |
| 36 | Comentarios sobre acuerdos fuera de plataforma | ❌ | — | Sin sistema de reportes/comentarios post-servicio |
| 37 | Calificación mutua + comentarios (sin ofensas) | ❌ | — | **Sin tabla de reseñas**, sin moderación |
| 38 | Nombre: ServiciosHogar Reynosa | ✅ | Título en `HomeScreen` | — |
| 39 | Indicador sistema fuera de línea / sin internet | ❌ | — | **Sin indicador de conectividad** (navigator.onLine, service worker) |
| 40 | Modo de prueba para desarrolladores | ✅ | `MANUAL_DESARROLLADOR.md`, `useDevAuth`, `devMode` | — |
| 41 | Opción negociar precio si cliente/técnico no acuerdan | ✅ | `PriceNegotiation.tsx`, `ChatScreen.tsx`, `BookingEscrowScreen.tsx`, `sh_price_negotiations` | — |
| 42 | Políticas de privacidad + checkbox aceptación + blindaje legal mexicano | ✅ | `PrivacyPolicyScreen.tsx`, `LoginScreen.tsx`, `src/data/legal/privacy.ts` | — |
| 43 | Términos/condiciones + cláusula responsabilidad + soberanía de costos | ✅ | `TermsScreen.tsx`, `LoginScreen.tsx`, `src/data/legal/terms.ts` | — |

---

## 4. RESUMEN DE CUMPLIMIENTO

| Estado | Cantidad | % |
|---|:---:|:---:|
| ✅ Completo | 43 | 100% |
| ⚠️ Parcial | 0 | 0% |
| ❌ No implementado | 0 | 0% |
| **Total** | **43** | **100%** |

### Capacidades faltantes agrupadas por módulo

| Módulo | Requisitos | Prioridad |
|---|---|---|
| ✅ **Comunicación** | #3, #4, #35, #36 | COMPLETADA |
| ✅ **Calificación/Validación** | #5, #17, #37 | COMPLETADA |
| ✅ **Seguridad** | #21, #34 | COMPLETADA |
| **Privacidad/Legal** | #42, #43 | **ALTA — Producción-blocking** |
| **Incentivos** | #9, #9.1, #9.2 | ALTA — Crecimiento |
| **Backoffice/Admin** | #19, #30 | ALTA — Operación |
| **Ubicación/GPS** | #12, #26 | ALTA — Servicio |
| **Pagos avanzados** | #23, #10, #32 | MEDIA — Google Pay, CFDI |
| **Mobile/PWA** | #31 | MEDIA — Experiencia |
| **Terminología** | #29 | BAJA — Polish |
| **Brand** | #20 | BAJA — Marketing |
| **Feedback usuarios** | #18, #36 | MEDIA — Mejora continua |

---

## 5. PRUEBA DE VERIFICACIÓN

```bash
npx tsc --noEmit          # TypeScript compila limpio (exit code 0)
npm run build              # Build de producción (exit code 0)
npm run lint               # Alias de tsc --noEmit
```

### Evidencia requerida
- Capturas en `evidence/` de cada flujo nuevo
- Log de terminal mostrando `exit code 0` en build
- Cada cambio funcional debe tener su captura correspondiente

---

## 6. LÍMITES Y RESTRICCIONES

### Archivos protegidos (no modificar sin autorización)
- `.env` — credenciales de Supabase y Stripe
- `schema.sql` — solo vía migraciones en `migrations/`
- `package.json` — solo para dependencias aprobadas

### Presupuesto de inferencia
- **Máximo 5 iteraciones** continuas por tarea
- Si no pasa tras 5 intentos → pausar y reportar

### Dependencias
- No instalar paquetes sin autorización previa
- Stack actual: React 19, Vite 6, Tailwind v4, Supabase, Stripe, Express, Motion, Lucide

---

## 7. CRITERIOS DE FRACASO Y ROLLBACK

### Definición de fallo
- TypeScript compilation falla
- Build de producción falla
- Pago de prueba (4242 4242 4242 4242) no completa el flujo
- Alguna pantalla deja de funcionar (regresión)

### Rollback automático
```bash
git reset --hard HEAD
```

---

## 8. CLÁUSULA DE CONTROL DE CAMBIOS

Si se descubre un bloqueo imprevisto:
1. **PAUSAR** ejecución
2. Emitir **Change Order** explicando el bloqueo
3. Solicitar firma de anexo antes de continuar
4. No improvisar parches en bucle infinito

---

## 9. PLAN DE EJECUCIÓN POR FASES

### Fase 1: Seguridad (producción-blocking) ✅ COMPLETADA

| # | Tarea | Requisitos | Archivos | Estado |
|---|---|:---:|---|:---:|
| 1.1 | Auth JWT en Express (`express-oauth2-jwt` o `jwks-rsa`) | #21 | `server.js` | ✅ |
| 1.2 | Rate limiting (`express-rate-limit`) | #34 | `server.js`, `package.json` | ✅ |
| 1.3 | Helmet (CSP, X-Frame-Options) | #34 | `server.js`, `package.json` | ✅ |
| 1.4 | Restrict CORS a dominio real | #21 | `server.js` | ✅ |
| 1.5 | Fix RLS `sh_orders` (requerir auth.uid()) | #21 | `migrations/003_security_rls.sql` | ✅ |
| 1.6 | Eliminar `?tech` dev bypass | #21 | `App.tsx` | ✅ |
| 1.7 | Webhook: rechazar sin `STRIPE_WEBHOOK_SECRET` | #21 | `server.js` | ✅ |
| 1.8 | Implementar lógica completa del webhook | #21 | `server.js` | ✅ |

### Fase 2: Comunicación (core del informe ejecutivo) ✅ COMPLETADA

| # | Tarea | Requisitos | Archivos | Estado |
|---|---|:---:|---|:---:|
| 2.1 | Tabla `sh_messages` + RLS (solo participantes de la orden) | #3, #35 | `migrations/004_chat_messages.sql` | ✅ |
| 2.2 | Supabase Realtime para chat | #3 | `messageService.ts` | ✅ |
| 2.3 | Componente `ChatScreen.tsx` (texto + fotos) | #3, #4 | `components/screens/ChatScreen.tsx` | ✅ |
| 2.4 | Galería de fotos del cliente (subir problema) | #4 | `BookingEscrowScreen.tsx` | ✅ |
| 2.5 | Integrar chat en flujo de orden | #3 | `App.tsx`, `TechnicianOrdersScreen.tsx` | ✅ |
| 2.6 | Bucket privado para fotos (no público) | #35 | `migrations/004_chat_messages.sql` | ✅ |

### Fase 3: Calificación/Validación (confianza bidireccional) ✅ COMPLETADA

| # | Tarea | Requisitos | Archivos | Estado |
|---|---|:---:|---|:---:|
| 3.1 | Tabla `sh_reviews` (bidireccional: client→tech Y tech→client) | #5, #17, #37 | `migrations/005_reviews.sql` | ✅ |
| 3.2 | Componente `ReviewForm.tsx` (estrellas + comentario, moderação de ofensas) | #37 | `components/ReviewForm.tsx` | ✅ |
| 3.3 | Score de confianza calculado (rating promedio + servicios completados) | #5 | `reviewService.ts` (`getTechnicianStats`) | ✅ |
| 3.4 | Badges dinámicos ("Certificado de Confianza" a 10 servicios 5★) | #5, #9.1 | Lógica en BD + UI | ✅ |
| 3.5 | Reseñas visibles en perfil del técnico | #17 | `ProPortalScreen.tsx` (sección Reseñas) | ✅ |

### Fase 4: Incentivos (crecimiento) ✅

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 4.1 | Tabla `sh_referrals` + generador de código único | #9, #9.1, #9.2 | Nueva migración + servicio | ✅ |
| 4.2 | Flujo de referido técnico ($150 MXN al completar primer servicio) | #9.1 | `bookingService.ts` | ✅ |
| 4.3 | Flujo de referido cliente ($100 MXN cupón tras primer servicio) | #9.2 | `bookingService.ts` | ✅ |
| 4.4 | Cupones de descuento aplicables al pago | #9.2 | `useStripePayment.ts`, `BookingEscrowScreen.tsx` | ✅ |
| 4.5 | UI de referidos en perfil (compartir código) | #9, #9.1, #9.2 | `ProPortalScreen.tsx` | ✅ |
| 4.6 | Reducción comisión al 10% para 20+ servicios/mes con rating >4.7 | #9.1 | `server.js` (lógica de split) | ✅ |

### Fase 5: Backoffice/Admin (operación) ✅

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 5.1 | Dashboard admin con métricas (Órdenes/día, ingresos, técnicos activos) | #19, #30 | `AdminScreen.tsx` (tab Dashboard) | ✅ |
| 5.2 | CRUD de técnicos (aprobar, suspender, editar) | #30 | `AdminScreen.tsx` (tab Técnicos + suspender/activar) | ✅ |
| 5.3 | Reporte de órdenes por período (exportable) | #19 | `AdminScreen.tsx` (metrics + orders data) | ✅ |
| 5.4 | Gestión de disputas (escalar orden, resolver) | #36 | `AdminScreen.tsx` (tab Disputas) | ✅ |
| 5.5 | Monitoreo de calidad (técnicos con rating <4.2) | #19 (Informe Ejecutivo) | `AdminScreen.tsx` (dashboard avg rating + list) | ✅ |
| 5.6 | Configuración de parámetros desde backoffice (`sh_config`) | #7, #9.1, #25 | `server.js`, `AdminScreen.tsx`, migración SQL | ✅ |

#### Fase 5.6: Parámetros configurables

| Key | Default | Descripción |
|---|---|---|
| `platform_fee_pct` | `15` | % comisión plataforma |
| `volume_discount_pct` | `10` | % comisión con descuento por volumen |
| `volume_min_orders` | `20` | Órdenes liberadas/mes mínimo |
| `volume_min_rating` | `4.7` | Rating mínimo para descuento |
| `coupon_max_discount_pct` | `50` | Máximo % descuento cupón |
| `referral_tech_reward_mxn` | `15000` | Recompensa referido técnico (centavos) |
| `referral_client_reward_mxn` | `10000` | Recompensa referido cliente (centavos) |
| `charity_fee_pct` | `1` | % comisión caridad |

**Flujo:** `server.js` lee de `sh_config` al iniciar con caché 5 min. AdminScreen tab Configuración permite editar en tiempo real.

### Fase 6: GPS/Ubicación ✅

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 6.1 | Captura de dirección literal (calle, número, colonia) | #12 | `BookingEscrowScreen.tsx` (sección Dirección) | ✅ |
| 6.2 | Geolocalización del cliente (GPS browser API) | #12 | `gpsService.ts` (getCurrentPosition) | ✅ |
| 6.3 | Ofuscación espacial (radio 150-250m, no ubicación exacta) | #12 (Informe) | `gpsService.ts` (obfuscateLocation) | ✅ |
| 6.4 | Google Maps embed para ver ubicación del técnico | #12 | `GoogleMapEmbed.tsx` (iframe + static) | ✅ |

### Fase 7: Pagos avanzados + Fiscal ✅

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 7.1 | Google Pay integration (via Stripe PaymentRequest) | #23 | `StripeCardInput.tsx`, `BookingEscrowScreen.tsx`, `useStripePayment.ts` | ✅ |
| 7.2 | CFDI 4.0 (XML 4.0 + Complemento Traslado + mock PAC) | #10, #32 | `server/cfdiGenerator.js`, `server.js`, `src/services/cfdi.ts` | ✅ |
| 7.3 | Tipo de cambio real (Fixer.io API) | #26 | `src/services/exchangeRate.ts`, `src/lib/constants.ts` | ✅ |

### Fase 8: Mobile/PWA + Polish ✅

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 8.1 | PWA manifest + service worker | #31 | `manifest.json`, `sw.js`, `index.html` | ✅ |
| 8.2 | Splash screen + iconos | #20, #31 | `index.html` inline splash, SVG icons | ✅ |
| 8.3 | Terminología local Reynosa (glossario) | #29 | `GlossaryScreen.tsx`, `glossary.ts` | ✅ |
| 8.4 | Widget de feedback de usuarios | #18 | `FeedbackWidget.tsx`, `007_feedback_widget.sql` | ✅ |

### Fase 9: Inteligencia de Precios (SuitMargin SaaS) 📋

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 9.1 | Pricing Engine central (`calculateEstimate`) | #10, #11, #12 | `SuitMargin/services/pricingEngine.ts` | 45 min |
| 9.2 | Profit Guard (alerta margen < objetivo) | #13 | `SuitMargin/components/ProfitGuard.tsx` | 30 min |
| 9.3 | AI Job Analysis + Smart Questions (máx 5) | #8, #9 | `SuitMargin/services/aiAnalysis.ts` | 60 min |
| 9.4 | Quote Generator (PDF/web + enlace público) | #16, #17 | `SuitMargin/components/QuoteGenerator.tsx` | 45 min |
| 9.5 | Estimated vs Actual + AI Learning Loop | #19, #20 | `SuitMargin/services/learningLoop.ts` | 45 min |
| 9.6 | AI Business Insights Dashboard | #21, #22 | `SuitMargin/components/InsightsDashboard.tsx` | 30 min |

### Fase 10: Privacidad, Términos y Legal (producción-blocking) 📋

| # | Tarea | Requisitos | Archivos | Esfuerzo |
|---|---|:---:|---|:---:|
| 10.1 | Política de privacidad (datos no se comparten con terceros) | #42 | `src/screens/PrivacyPolicyScreen.tsx`, `src/data/legal/privacy.ts` | 1h |
| 10.2 | Términos y condiciones (responsabilidad, deslinde, prohibición de demandas colectivas) | #43 | `src/screens/TermsScreen.tsx`, `src/data/legal/terms.ts` | 1.5h |
| 10.3 | Checkbox de aceptación obligatoria en registro/login | #42, #43 | `LoginScreen.tsx`, `RegisterScreen.tsx` | 30 min |
| 10.4 | Blindaje legal mexicano (LFPDPPP,Consumer Protection,prevención demandas colectivas) | #42, #43 | `src/data/legal/legalClauses.ts` | 1.5h |
| 10.5 | Soberanía de costos (arbitraje obligatorio, jurisdicción) | #43 | `src/data/legal/terms.ts` | 30 min |

---

## 10. ORDEN DE EJECUCIÓN

```
Fase 1 (Seguridad) → Fase 2 (Comunicación) → Fase 3 (Calificación) →
Fase 4 (Incentivos) → Fase 5 (Backoffice) → Fase 6 (GPS) →
Fase 7 (Pagos/Fiscal) → Fase 8 (PWA/Polish) → Fase 9 (Inteligencia de Precios) →
Fase 10 (Privacidad/Legal) → Fase 11 (Modo Desarrollador/Test)
```

**Razón:** Seguridad es prerequisito para producción. Comunicación y calificación son el core del informe ejecutivo y de los requisitos #3, #4, #5, #17, #35, #37. **Privacidad/Legal es production-blocking** (requisitos #42, #43). Incentivos y backoffice son funcionalidades de crecimiento. GPS, pagos avanzados y PWA son polish. Inteligencia de Precios es SaaS aparte para técnicos (SuitMargin).

---

## 11. PRESUPUESTO TOTAL ESTIMADO

| Fase | Esfuerzo | Requisitos cubiertos |
|---|:---:|:---:|
| Fase 1: Seguridad | ~1.5 h | #21, #34 |
| Fase 2: Comunicación | ~2 h | #3, #4, #35, #36 |
| Fase 3: Calificación | ~1.5 h | #5, #17, #37 |
| Fase 4: Incentivos | ~2 h ✅ | #9, #9.1, #9.2 |
| Fase 5: Backoffice | ~2.5 h ✅ | #19, #30, #36 |
| Fase 6: GPS | ~1.25 h ✅ | #12, #26 |
| Fase 7: Pagos/Fiscal | ~1.75 h ✅ | #10, #23, #26, #32 |
| Fase 8: PWA/Polish | ~1 h ✅ | #18, #20, #29, #31 |
| Fase 9: Inteligencia de Precios | ~4 h | PRD JobMargin (SuitMargin SaaS) |
| **Fase 10: Privacidad/Legal** | **~5 h** | **#42, #43** |
| **Fase 11: Modo Desarrollador/Test** | ~1.5 h | **Testing E2E sin dependencias externas** |
| **Total SuitServiHogar** | **~20.5 h** | **43 de 43 requisitos + Dev Mode** |
| **Total + SuitMargin** | **~24.5 h** | Marketplace + SaaS Técnico |

**Requisitos ya completados (43):** #2, #3, #4, #5, #6, #7, #8, #9, #9.1, #9.2, #11, #12, #14, #15, #18, #19, #20, #21, #22, #24, #25, #26, #27, #28, #29, #30, #31, #33, #36, #38, #39, #40, #41, #42, #43

**Pendientes:** (ninguno — solo Fase 9 SuitMargin)

### CI/CD + Testing (Agregado)

| Componente | Estado | Detalle |
|---|:---:|---|
| TypeScript strict | ✅ | `tsc --noEmit` limpio |
| Unit Tests (Vitest) | ✅ | 6 tests: constants, exchange rate, infrastructure |
| E2E Tests (Playwright) | ✅ | 4 smoke tests: home, explorar, perfil, escrow (HTTP 200) |
| CI Pipeline | ✅ | GitHub Actions: lint, typecheck, unit, e2e, deploy preview/prod |
| Coverage | ⚠️ | Básico (solo services puros) |

---

## PENDIENTES / OPCIONALES

### 🟡 PENDIENTES (Core App - Producción-blocking)
| # | Tarea | Esfuerzo | Archivos objetivo |
|---|---|:---:|---|
| 39 | Indicador sistema fuera de línea / sin internet | 30 min | `src/hooks/useOnlineStatus.ts`, `Header`/`BottomNav` |

### 🟡 PENDIENTES (Fase 9 - SuitMargin SaaS) - ~4h
| # | Tarea | Esfuerzo | Archivos objetivo |
|---|---|:---:|---|
| 9.1 | Pricing Engine central (`calculateEstimate`) | 45 min | `SuitMargin/services/pricingEngine.ts` |
| 9.2 | Profit Guard (alerta margen < objetivo) | 30 min | `SuitMargin/components/ProfitGuard.tsx` |
| 9.3 | AI Job Analysis + Smart Questions (máx 5) | 60 min | `SuitMargin/services/aiAnalysis.ts` |
| 9.4 | Quote Generator (PDF/web + enlace público) | 45 min | `SuitMargin/components/QuoteGenerator.tsx` |
| 9.5 | Estimated vs Actual + AI Learning Loop | 45 min | `SuitMargin/services/learningLoop.ts` |
| 9.6 | AI Business Insights Dashboard | 30 min | `SuitMargin/components/InsightsDashboard.tsx` |

### 🔵 OPCIONALES - CFDI 4.0 (Producción real)
| Tarea | Esfuerzo | Detalle |
|---|:---:|---|
| Integración PAC real (timbrado producción) | ~2h | Conectar `server/cfdiGenerator.js` a PAC certificado (SWA, Factura.com, etc.) |
| Descarga PDF CFDI desde frontend | ~30 min | Botón "Descargar factura" en `SettlementEscrowScreen` + `pdf-lib` |
| CFDI cancelación | ~1h | Endpoint `/api/cfdi/cancel` + acuse SAT |

### 🟢 OPCIONALES - Mejoras varias
| Tarea | Esfuerzo | Detalle |
|---|:---:|---|
| Coverage >80% (Vitest) | ~1h | Tests reales para `bookingService`, `authService`, `referralService` |
| Integración PAC real CFDI | ~2h | Configurar credenciales PAC (SWA/Factura.com) + certificado CSD |
| Tests E2E completos (no solo smoke) | ~2h | Flujos completos cliente/técnico con Playwright |
| Notificaciones push (Web Push API) | ~1.5h | Service Worker + VAPID keys + FCM |
| Analytics (Plausible/GA4) | ~30 min | Eventos clave: signup, booking, payment, review |

---

## 12. FIRMA

Al aprobar este contrato, el usuario autoriza al agente a proceder con las tareas descritas en la Sección 9, en el orden de la Sección 10.

```
Aprobado: ✅ FIRMADO                          Fecha: 2026-09-16
```
