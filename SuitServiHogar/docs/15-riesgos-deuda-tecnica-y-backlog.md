# 15 — Riesgos, deuda técnica y backlog · SuitServiHogar

> **Para qué sirve este documento:** riesgos/deuda priorizados con evidencia, impacto, probabilidad, mitigación y responsable.
> **Última revisión:** 2026-10-04 · **Generado por:** skill `auditoria` (llamada por `guia-total`)
> **Fuentes:** `docs/veredicto.md` (6.93/10 APROBADO CONDICIONAL), `05-arquitectura`, `10-seguridad`, `11-integraciones`, `13-despliegue`, `GuiaTotal/PENDIENTES.md` L28-30.

## Prioridad

`Prioridad = impacto × riesgo × urgencia ÷ esfuerzo` (orden de magnitud, no número exacto).

## Riesgos críticos (condiciones del Panel Juzgador — bloquean go-live)

| ID | Riesgo | Evidencia | Impacto | Prob. | Prioridad | Mitigación | Responsable | Revisión |
|---|---|---|---|---|---|---|---|---|
| R-01 | **Sin proceso de disputas/chargebacks ni SLA Stripe** | `veredicto.md` | Alto | Alta | **crítico** | Definir SLA + flujo de disputa + cláusula en T&C | dueño + legal | pre go-live |
| R-02 | **Fixer.io plan gratis = 100 req/mes** → FX se rompe | `exchangeRate.ts`, `veredicto.md` | Alto | Alta | **crítico** | Plan pago o migrar a API Banxico (gratuita) | dev | pre go-live |
| R-03 | **T&C sin responsabilidad civil por daños en hogar + seguro RC técnicos** | `veredicto.md` | Alto | Alta | **crítico** | Asesoría legal: RC + seguro RC/accidentes | dueño + legal | pre go-live |
| R-04 | **Plan de seguridad técnicos ausente** (botón pánico, seguro accidente, zonas no-go nocturnas) | `veredicto.md` | Alto | Media | **crítico** | Diseñar protocolo de seguridad operativa | dueño | pre go-live |
| R-05 | **Google Maps sin alerta de cuota al 80%** → mapa muere en silencio | `gpsService.ts`, `veredicto.md` | Medio | Media | alto | Alerta cuota + cache geocoding + fallback OSM | dev | pre go-live |
| R-06 | **Sin presupuesto de lanzamiento confirmado** ($2,000 USD/mes × 6 meses, Meta/Google ads geo-targeted + referidos) | `veredicto.md` | Alto | Media | **crítico** | Validar presupuesto con dueño | dueño | go/no-go |

## Riesgos de seguridad (heredados de `10-seguridad`)

| ID | Riesgo | Evidencia | Impacto | Prob. | Prioridad | Mitigación | Revisión |
|---|---|---|---|---|---|---|---|
| R-07 | `SUPABASE_SERVICE_ROLE_KEY` en `server.js` bypassa RLS → fallo de validación = acceso total | `server.js:12` | Crítico | Media | **crítico** | Validación SIEMPRE en backend; revisar inputs de todos los endpoints | pre go-live |
| R-08 | Secretos stale en entorno Windows ganan por `dotenv.config({ override: true })` | `server.js:5` | Medio | Alta | alto | Rotar/limpiar vars stale del entorno | inmediato |
| R-09 | Webhook Stripe: firma `constructEvent` no verificada línea a línea | `server.js:261` | Crítico | Baja | **crítico** | Auditoría manual del webhook | pre go-live |
| R-10 | Sin tabla de auditoría de acciones (login, cambios, pagos) | `10-seguridad` | Medio | Alta | alto | Tabla `sh_audit_log` + eventos críticos | backlog |
| R-11 | Matriz de permisos por endpoint `PROBABLE` (no existe documento formal) | `10-seguridad` | Medio | Media | medio | Completar matriz → sube a `VERIFICADO` | backlog |
| R-12 | Sin retención/eliminación de datos personales (ADR-030) — INE/biometría del Deep-Vetting | `10-seguridad`, ADR-030 | Alto | Media | **crítico** | Proceso técnico de supresión + política legal | pre go-live |

## Deuda técnica (evidencia directa del código)

| ID | Deuda | Evidencia | Impacto | Prioridad | Mitigación | Revisión |
|---|---|---|---|---|---|---|
| D-01 | ~~**SQL en 4 ubicaciones sin fuente canónica + drift**~~ **RESUELTO 2026-10-07**: las 3 migraciones consolidadas idempotentes en `supabase/migrations/` + `migrations/` archivado con ZIP (`_archivadas/`) | `migrations/README.md` | Alto | **resuelto** | hecho | 2026-10-07 |
| D-02 | ~~`AGENTS.md` desactualizado: dice `screens/ (7)`, hay 13~~ **RESUELTO 2026-10-04** | `05-arquitectura` L52 | Bajo | **resuelto** | hecho | 2026-10-04 |
| D-03 | ~~`README.md` es template de AI Studio~~ **RESUELTO 2026-10-07** — README real del proyecto | `README.md` | Medio | **resuelto** | hecho | 2026-10-07 |
| D-04 | ~~`package.json` name = `react-example`~~ **RESUELTO 2026-10-07** → `suit-servihogar` | `package.json:2` | Bajo | **resuelto** | hecho | 2026-10-07 |
| D-05 | ~~`@google/genai` sin uso (dependencia muerta)~~ **RESUELTO 2026-10-07** — `npm uninstall` | `package.json` | Bajo | **resuelto** | hecho | 2026-10-07 |
| D-06 | Backend **sin pipeline de deploy** — `ci.yml` solo publica `dist/` a Pages | `13-despliegue` | Alto | **alta** | Runbook de deploy de `server.js` → `docs/runbooks/despliegue.md` (host = [PENDIENTE]) | pre go-live |
| D-07 | Runbooks: ~~ausentes~~ **parcial 2026-10-07** — `despliegue.md` + `rollback.md` creados; faltan `incidentes`, `backups-y-restauracion`, `rotacion-de-secretos` | `docs/runbooks/` | Medio | media | Completar los 3 restantes | backlog |
| D-08 | Sin monitoreo/errores producción (Sentry etc.) + sin dead man switch | `veredicto`, `13-despliegue` | Alto | alta | Agregar error tracking + alerta | pre go-live |
| D-09 | `.env.example` incompleto: faltan `FIXER_KEY` y Google Maps key | `11-integraciones`, `13` | Medio | media | Completar `.env.example` | backlog |
| D-10 | `VALIDACION.md` del ciclo F3 no existe → etapa sigue "construcción" | registro, ciclo F3 | Medio | media | Ciclo F3 | próxima sesión |
| D-11 | RN-09 (certificación "Técnico Certificado") y cupones/referidos sin automatizar — solo en manuales | `09-reglas` | Medio | media | Implementar reglas en backend | backlog |
| D-12 | `schema.sql` + `migration_v2.sql` en raíz del proyecto (duplicados históricos, fuera de `migrations/`) | raíz SuitServiHogar | Bajo | baja | Revisar si siguen vigentes o archivar | backlog |

## Backlog (orden sugerido)

1. **Pre go-live (bloqueantes):** R-01, R-02, R-03, R-04, R-06, R-07, R-09, R-12, D-06, D-08.
2. **Próxima sesión:** D-10 (ciclo F3 → VALIDACION.md).
3. **Backlog:** R-05, R-08, R-10, R-11, D-07 (parcial: faltan 3 runbooks), D-09, D-11, D-12.
4. **Resueltos (2026-10-04/07):** D-01 (drift SQL consolidado), D-02, D-03, D-04, D-05.

---
*Evidencia del veredicto registrado en `GuiaTotal/PENDIENTES.md` (≥84%). R-02 requiere decisión explícita del dueño.*
