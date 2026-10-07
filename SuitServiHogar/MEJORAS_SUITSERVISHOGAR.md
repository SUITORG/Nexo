# Mejoras SuitServiHogar — Revisión de arquitectura (ligera)

**Fecha**: 2026-10-07
**Tipo**: Revisión de arquitectura, solo lectura — no se modificó ningún archivo del proyecto (el único archivo agregado es este reporte)
**Alcance**: revisión ligera basada en documentación + verificaciones puntuales; sin agentes de exploración ni lectura completa de código
**Fuentes usadas**:
- `docs/05-arquitectura-del-sistema.md`, `docs/06-diagramas-c4.md`, `docs/11-integraciones-y-contratos.md`, `docs/13-despliegue-y-operacion.md`, `docs/15-riesgos-deuda-tecnica-y-backlog.md`
- `docs/veredicto.md`, `docs/eval_tecnico.md`, `docs/Analista_Proy.md`
- `INDEX_FUNCIONES.md`, `AGENTS.md`, `package.json`
- Carpetas `migrations/` y `supabase/migrations/`, `.github/workflows/ci.yml`, `scripts/`
- `AGENTS.md` (raíz), `.suit/registry/projects.yaml`
- `git log` (solo lectura): último commit del módulo `e721f1e` (2026-09-27)

**Este reporte queda obsoleto si cambia**: `AGENTS.md`, `INDEX_FUNCIONES.md`, `package.json`, `server.js`, `migrations/`, `supabase/migrations/`, `.github/workflows/ci.yml`, `.suit/registry/projects.yaml`

---

## Resumen ejecutivo

Arquitectura sólida y correctamente aislada (ADR-029): React 19 + Vite → Express (3010) → Supabase (RLS) + Stripe Connect. Está bien registrada en la gobernanza del monorepo (`AGENTS.md` raíz y `projects.yaml`) y cuenta con tests + CI. Pendientes principales: consolidar el SQL (drift entre carpetas), refrescar índice/docs y definir el despliegue del backend. **Nota de arquitectura: 7/10** (técnico previo del Panel: 6/10; global del Panel Juzgador: 6.93/10).

## Hallazgos

| # | Hallazgo | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | Drift SQL: `price_negotiation`, `antifuga_config`, `decisions_config` (+ `APLICAR_EN_SUPABASE.sql`) están en `migrations/` pero no en `supabase/migrations/`; además `schema.sql` y `migration_v2.sql` duplicados en raíz | Abierto (D-01) | Listado de carpetas + búsqueda de contenido |
| 2 | `INDEX_FUNCIONES.md` (2026-09-15) desactualizado: documenta 7 de 13 pantallas (faltan chat, admin, reseñas, glosario, legales); existe `scripts/generate-index.js` | Nuevo — abierto | `src/components/screens/` vs. índice |
| 3 | Backend sin pipeline ni runbook de deploy (el CI solo publica el frontend a Pages) | Abierto (D-06) | `.github/workflows/ci.yml`, `docs/13` |
| 4 | Menores: `README.md` es plantilla de AI Studio; `package.json` name `react-example`; `@google/genai` sin uso | Abierto (D-03, D-04, D-05) | Archivos raíz |
| 5 | `AGENTS.md` del módulo actualizado: `screens/ (13) + modals/ (5)` | Resuelto (D-02) | `AGENTS.md:20` |

## Alineación con el Core

| Documento | Estado |
|-----------|--------|
| `AGENTS.md` (raíz) | OK — registra el módulo, puerto 3010 y la excepción ADR-029 |
| `.suit/registry/projects.yaml` | OK — entrada `suit-servihogar` (path, PORT 3010, servicio `servihogar-api`) |
| `ARCHITECTURE.md` (raíz) | Nota — sin menciones al módulo (la excepción vive en ADR-029 + AGENTS.md; omisión menor) |
| `.suit/registry/routing.yaml` | Sin menciones (no requerido) |

## Mejoras priorizadas

1. Consolidar migraciones en `supabase/migrations/` y archivar duplicados — 1–2 h.
2. Regenerar `INDEX_FUNCIONES.md` (`node scripts/generate-index.js`) y actualizar README/package — 30 min.
3. Runbook de deploy del backend + healthcheck — 2–4 h.

## No verificado en esta sesión / fuera de alcance

- Ejecutar builds, tests o `generate-index` (revisión solo lectura).
- Lectura línea a línea de `server.js`, webhook Stripe y CFDI.
- Riesgos de go-live (Fixer.io, disputas Stripe, seguridad de técnicos): ver `docs/15`.
