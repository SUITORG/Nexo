# CHECKLIST DE LANZAMIENTO - SuitServiHogar

> **Para qué sirve este checklist:** verifica antes de lanzar que funcione, esté medido, respaldado y sea operable. Basado en `GuiaTotal/GUIA.md` §14.
> **Audiencia:** quien aprueba el lanzamiento (dev + responsable del proyecto).
> **Versión:** 1.0 · **Fecha:** 2026-10-04 · **Etapa:** construcción (pre go-live)

---

## Funcionalidad

- [x] Flujo completo de punta a punta probado (41/41 requisitos, E2E Playwright)
- [ ] Datos inválidos, duplicados y spam probados (unit + E2E cubren parcial — completar con QA manual multi-sesión: admin/cliente/técnico)
- [ ] Fallos de servicios externos probados (timeout/error de API): Stripe, Fixer.io, Google Maps, Gemini

## Seguridad

- [ ] HTTPS activo y redirección HTTP → HTTPS (verificar en dominio de producción)
- [x] Secretos solo en variables de entorno (`.env` gitignored; `.env.example` como guía)
- [ ] Roles y permisos verificados **en backend**, no solo ocultos en UI (matriz RLS `docs/10-seguridad-y-permisos.md` marcada PROBABLE)
- [ ] `id_empresa` en toda query si es multiempresa → **N/A**: single-tenant, aislamiento por RLS (ADR-029)
- [ ] Validación de entrada en backend (esquema)
- [ ] Rate limiting / antispam en endpoints públicos (`express-rate-limit` presente — verificar cobertura de endpoints)

## Medición

- [ ] Conversión/evento principal medido (analytics) — KPIs del panel: 50 órdenes/semana mes 3, matching > 25%, repeat > 30%, NPS > 40
- [ ] Errores de producción monitoreados con alerta

## Riesgos críticos pre go-live (veredicto Panel Juzgador)

- [ ] Fixer.io plan pago o migración a Banxico API (el plan gratis son 100 req/mes)
- [ ] SLA y proceso de disputas/chargebacks Stripe documentados
- [ ] T&C con responsabilidad civil por daños en hogar + seguro RC técnicos
- [ ] Plan de seguridad técnicos: botón pánico, seguro accidente, zonas no-go nocturnas
- [ ] Alertas Google Maps al 80% de cuota + cache geocoding / fallback OpenStreetMap
- [ ] Budget de lanzamiento $2,000 USD/mes (Meta/Google Ads geo-targeted Reynosa + referidos) por 6 meses

## Respaldo

- [ ] Backup de datos + configuración activo (Supabase: verificar PITR/backups del plan)
- [ ] Restauración **probada** al menos una vez

## Documentación

- [x] `MANUAL_CLIENTE.md` actualizado (2026-09-26)
- [x] `MANUAL_PROVEEDOR.md` actualizado (2026-09-26)
- [x] `MANUAL_TECNICO.md` actualizado (2026-09-26)
- [x] `MANUAL_PRUEBAS.md` actualizado (2026-09-26)
- [x] `Contrato.md` al día con lo que se lanzó (v6.0, 41/41)
- [x] `IDENTIDAD_CORPORATIVA.md` revisado (2026-10-04) — pendiente sección "Datos pendientes de validar"
- [ ] `docs/VALIDACION.md` del ciclo F3 (único artefacto de etapa faltante)

## Legal (recoge datos personales)

- [ ] Política de privacidad publicada (Deep-Vetting maneja INE/biometría → consentimiento LFPDPPP)
- [ ] Términos y condiciones publicados (incluye responsabilidad civil)
- [ ] Aviso de donaciones deducibles verificado con donataria autorizada (Fundación Hogar Digno AC)

---

**Aprobado:** [nombre] · **Fecha:** [FECHA] · **Commit:** [sha]
