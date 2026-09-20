# Propuesta: SuitServiHogar — Marketplace de Servicios para el Hogar en Reynosa

## Nombre del Proyecto
**SuitServiHogar** — Marketplace bilateral de servicios para el hogar en Reynosa, Tamaulipas, México.

## Descripción
Plataforma digital que conecta a **clientes** que necesitan servicios para el hogar (plomería, electricidad, pintura, limpieza, HVAC, jardinería, albañilería, cerrajería, carpintería, techos, fumigación, mudanzas, gasfitería, aire acondicionado) con **técnicos verificados** y certificados. Modelo bilateral: clientes solicitan servicios, técnicos los ejecutan, plataforma cobra comisión por transacción (escrow).

## Alcance
- **MVP actual**: Marketplace funcional con 13 categorías de servicios, 115+ técnicos precargados, chat restringido a fotos de evidencia, escrow Stripe Connect (15% plataforma / 85% técnico), reseñas bidireccionales, programa de referidos ($150 MXN técnico / $100 MXN cliente), PWA instalable, modo desarrollador, panel admin.
- **Stack**: React 19 + Vite + TypeScript + Tailwind v4 (frontend vanilla JS), Supabase (PostgreSQL + Auth + Realtime + Storage), Express.js (puerto 3010) para Stripe Connect webhooks, GAS (Google Apps Script) para CRUD en Google Sheets.
- **Infra**: PWA (manifest + SW + splash), Google OAuth, Stripe Connect (15% plataforma / 85% técnico), Google Maps API para GPS, tipo de cambio real (Fixer.io).
- **Arquitectura multi-tenant**: Single-tenant por empresa (Reynosa), aislamiento por `id_empresa` en todas las queries, RLS en todas las tablas.
- **Base de datos**: Supabase (PostgreSQL) con RLS en 15+ tablas (`sh_service_categories`, `sh_technicians`, `sh_orders`, `sh_messages`, `sh_reviews`, `sh_referrals`, `sh_coupons`, `sh_feedback`, `sh_price_negotiations`, etc.), bucket `sh-evidence` para fotos.
- **Modelo de negocio**: 15% comisión total split 60% dueño (9%) / 40% desarrollador (6%). Volume discount: 10% para 20+ servicios/mes con rating >4.7. Donaciones 1% plataforma + round-up cliente → "Fundación Hogar Digno AC".

## Justificación
- **Problema**: Mercado fragmentado de servicios hogar en Reynosa sin verificación, precios opacos, sin garantías, pagos informales.
- **Solución**: Marketplace verificado con escrow, precios transparentes (tabulador bimonetario MXN/USD), certificación Deep-Vetting (INE + biometría + domicilio), protocolo antifuga (PIN de conformidad), reseñas bidireccionales.
- **Diferenciador**: Escrow real (Stripe Connect), verificación presencial (Deep-Vetting), precios regulados, chat restringido a evidencia, certificación "Técnico Certificado de Confianza" (10 servicios 5★ consecutivos).

## Stack Propuesto
- Frontend: React 19 + Vite + TypeScript + Tailwind v4 (vanilla, no frameworks)
- Backend: Express.js (puerto 3010) + Supabase Functions
- DB: Supabase (PostgreSQL 15+) + RLS + Realtime + Storage
- Auth: Google OAuth via Supabase
- Pagos: Stripe Connect (Express accounts)
- Maps: Google Maps API (GPS + ofuscación 150-250m)
- Exchange: Fixer.io API (tipo de cambio real MXN/USD)

## Puertos
- 3000: Vite dev server (frontend)
- 3010: Express Stripe server
- 8000: SuitCampanas (CMS)
- 3002: SuitReservaciones
- 3003: SuitCotizador
- 3005-3013: Otros módulos Suit*

## Estado Actual
- ✅ 41/41 requisitos funcionales implementados
- ✅ Tests unitarios (Vitest) + E2E (Playwright) passing
- ✅ CI/CD GitHub Actions (lint, typecheck, unit, e2e, deploy preview/prod)
- ✅ PWA instalable (manifest + SW + splash + icons)
- ✅ Documentación completa (MANUAL_CLIENTE.md, MANUAL_TECNICO.md, MANUAL_BACKEND.md, MANUAL_DESARROLLADOR.md)
- ✅ 41/41 requisitos del Contrato.md cumplidos
- ✅ Migraciones SQL 9/9 aplicadas (schema + 8 migraciones)
- ✅ PWA + SEO + SEO técnico (manifest, SW, splash, icons, meta tags)