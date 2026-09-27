## Evaluación de Riesgos: SuitServiHogar

### Puntuación: 7/10

### Riesgo Técnico
- Probabilidad: Media
- Impacto: Alto
- Mitigación: Tests unitarios (Vitest) y E2E (Playwright) passing; CI/CD con lint, typecheck, unit, e2e; arquitectura vanilla JS sin frameworks reduce superficie de fallos; migraciones SQL 9/9 aplicadas y versionadas.
- Nota: Stack complejo (React 19 + Vite + TS + Tailwind + Supabase + Stripe Connect + Express + GAS) aumenta superficie de fallos. Stripe Connect Express accounts requieren onboarding correcto. Webhooks de Stripe en Express (puerto 3010) deben ser idempotentes. RLS en 15+ tablas: configuración incorrecta = fuga de datos cross-tenant. Supabase Realtime para chat: escalabilidad no probada en carga real.

### Riesgo de Negocio
- Probabilidad: Media
- Impacto: Alto
- Mitigación: 115+ técnicos precargados (supply side resuelto); 13 categorías cubren demanda real; modelo bimonetario MXN/USD con tipo real (Fixer.io) reduce fricción precio; programa referidos ($150/$100) incentiva crecimiento orgánico; certificación "Técnico Certificado de Confianza" crea diferenciación dura.
- Nota: Single-tenant solo Reynosa — TAM limitado (~700k hab). Dependencia crítica de adopción técnica (técnicos no digitales). Precio 15% comisión: si mercado espera <10%, fricción alta. Deep-Vetting presencial (INE + biometría + domicilio) es CAC alto y no escalable sin operadores locales. Volume discount 10% solo aplica a 20+ servicios/mes rating >4.7 — umbral alto para inicio.

### Riesgo Operativo
- Probabilidad: Alta
- Impacto: Medio
- Mitigación: Documentación completa (4 manuales: cliente, técnico, backend, desarrollador); PWA instalable reduce soporte de app stores; modo desarrollador facilita debugging; status machine clara (draft→funded→in_progress→completed→released); reglas de cancelación definidas.
- Nota: Deep-Vetting presencial requiere operación física en Reynosa (personal, logística, agenda). Escrow Stripe Connect: disputas, chargebacks, reembolsos requieren proceso manual. Chat restringido a fotos: si técnico/cliente necesitan coordinar detalles complejos, fricción alta. Programa donaciones 1% + round-up: contabilidad y reporte a "Fundación Hogar Digno AC" requiere proceso recurrente. Soporte continuo 24/7 no definido.

### Riesgo Regulatorio
- Probabilidad: Baja
- Impacto: Alto
- Mitigación: Google OAuth via Supabase (no passwords locales); Stripe Connect maneja KYC/AML de técnicos; RLS en Supabase aisla datos; datos sensibles (INE, biometría, domicilio) en Deep-Vetting — no se almacenan en app, solo verificación presencial.
- Nota: Ley Federal de Protección de Datos Personales (LFPDPPP) México: consentimiento explícito para datos biométricos (huella/facial en Deep-Vetting). Stripe Connect Express: plataforma responsable de compliance técnico (no maneja fondos directamente). Servicio a domicilio: responsabilidad civil por daños en hogar del cliente — T&C deben cubrirlo. IVA/retenciones en comisiones: facturación CFDI 4.0 requerida. "Fundación Hogar Digno AC" debe ser donataria autorizada para deducibilidad.

### Riesgo de Dependencia
- Servicios externos:
  - Supabase (DB + Auth + Realtime + Storage): vendor lock-in alto; migración a PostgreSQL self-hosted posible pero costosa.
  - Stripe Connect: pagos, onboarding, KYC, splits — switching cost altísimo.
  - Google Maps API: GPS + ofuscación 150-250m; cuota $200/mes gratis → ~11k calls; overage costoso.
  - Fixer.io: tipo de cambio real; plan gratuito 100 req/mes — insuficiente para producción; plan pago requerido.
  - Google OAuth: auth único; si Google cambia política, migración compleja.
  - GAS (Google Apps Script): CRUD en Sheets legacy; deprecation risk.
- Plan B si fallan:
  - Supabase → migración a PostgreSQL en VPS + replicar RLS + Realtime con Socket.io.
  - Stripe → integrar Mercado Pago Connect (México) o Conekta; re-escribir splits.
  - Google Maps → Mapbox u OpenStreetMap + Nominatim; re-escribir ofuscación GPS.
  - Fixer.io → Banxico API (gratis, oficial) o exchangerate.host.
  - Google OAuth → Auth0 / Clerk / Supabase email+password fallback.
  - GAS → migrar todo a Supabase Functions/Edge Functions.
- Nota: 7 dependencias críticas externas. Stripe Connect es el mayor single point of failure — sin él, no hay escrow ni pagos. Fixer.io gratis no escala. GAS es debt técnico planificado para migración.

### Riesgo acumulado
- Score: 7/10
- Nivel: Aceptable

### Fortalezas (factores de mitigación)
- 41/41 requisitos funcionales implementados y testeados.
- CI/CD completo con gates de calidad (lint, typecheck, unit, e2e).
- PWA instalable — distribución sin app stores.
- 115+ técnicos precargados — supply side resuelto day 1.
- Arquitectura multi-tenant con RLS — aislamiento de datos probado.
- Documentación exhaustiva (4 manuales + CONTRATO.md).
- Modelo de comisión split 60/40 dueño/desarrollador alinea incentivos.
- Certificación "Técnico Certificado de Confianza" crea moat defensible.

### Riesgos críticos (los que requieren resolución antes de aprobar)
1. **Deep-Vetting presencial no escalable** — definir proceso de expansión a otras ciudades sin operación física local.
2. **Fixer.io plan gratis insuficiente** — contratar plan pago o migrar a Banxico API antes de producción.
3. **Soporte disputas/chargebacks Stripe sin definir** — documentar SLA y proceso de resolución.
4. **Responsabilidad civil daños en hogar** — T&C y seguro de responsabilidad civil para técnicos.
5. **GAS legacy** — plan de migración a Supabase Functions con fecha límite.
6. **Google Maps cuota** — monitoreo de uso y alerta en 80% de cuota gratuita.

### Recomendación
- CONDICIONAL
- Condición: Resolver los 6 riesgos críticos arriba antes de go-live productivo. Prioridad 1: Fixer.io plan pago / Banxico API; Prioridad 2: Proceso disputas Stripe y T&C responsabilidad civil; Prioridad 3: Plan migración GAS → Supabase Functions.