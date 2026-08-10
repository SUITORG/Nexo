# SuitOS para Claude Code

## Contexto del proyecto
Monorepo de SuitOrg: sistema de orquestación de agentes (SuitOS) + motor SSG multi-tenant que genera y despliega el sitio estático de `grupoevasol.com` vía GitHub Pages. Stack: Node.js (scripts SSG), Google Apps Script + Google Sheets como backend de datos (`Config_Empresas`/`Config_SEO`), GitHub Actions para CI/deploy. `SuitCampanas/` es un subproyecto local aparte, fuera de este pipeline.

## Comandos clave
| Comando | Función |
|---|---|
| `/suit-registry` | Consultar registry (agents, skills, workflows, projects, routing, etc.) |
| `/suit-plan` | Crear plan de ejecución con impacto, riesgo y rollback |
| `/suit-workflow` | Cargar workflow (feature, bugfix, audit, review, deploy) |
| `/suit-validate` | Correr validaciones (quick, standard, architecture, security) |
| `/suit-memory` | Escribir Architecture Decision Record (ADR) |
| `/suit-commit` | Git commit con formato SuitOS |
| `/suit-backup` | ZIP de respaldo |

Flujo recomendado: `/suit-plan → /suit-workflow → [codificar] → /suit-validate → /suit-commit`

## Reglas y convenciones
- Todo push a `main` dispara `.github/workflows/deploy.yml` → publica **todo el repo** a GitHub Pages (`path: '.'`) — cualquier archivo del repo es potencialmente público, no solo assets web.
- `scripts/ssg-engine.mjs` es el único generador de `dist/`; se ejecuta solo vía `.github/workflows/ssg-regenerate.yml` (cron diario 03:00 UTC + `workflow_dispatch`), nunca manualmente en producción.
- **Regla de negocio innegociable**: `grupoevasol.com` es el dominio real de EvaSol (único tenant indexable). Todo el resto de `Config_Empresas` son demos internas de SuitOrg — deben quedar `noindex, nofollow` siempre. No cambiar sin decisión de negocio explícita (ver Fase 5, ADR-022).
- `SuitCampanas/` es una app local aparte (server propio, puerto 8000) — no pasa por este pipeline de deploy ni comparte código con la raíz.
- Gotcha: crear/editar archivos en `.github/workflows/` vía `git push` falla si el token no tiene scope `workflow` — usar la UI web de GitHub (Add file → Create) como alternativa.
- No hay `gh` CLI en este entorno — operaciones de PR/workflow-files vía `git` directo o UI web de GitHub.
- Antes de escribir código: `.suit/registry/`, `.suit/workflows/`, `.suit/memory/decisions/` son la fuente de verdad declarativa — consultarlas primero.

## Decisiones tomadas
- El motor SSG borra automáticamente páginas huérfanas (inquilinos renombrados/eliminados) en cada corrida — no requiere limpieza manual de `dist/`.
- `baseUrl`/`apiUrl` de `ssg-engine.mjs` corregidos a `https://grupoevasol.com` y al deployment GAS vigente (la versión anterior apuntaba a un dominio inexistente).
- Fix de SEO multi-tenant (noindex en demos, sitemap/robots correctos) + cron de regeneración ya mergeados y verificados en `main` (ver ADR-022).

## Pendientes críticos
- Verificar que la 1ra corrida del cron (o un dispatch manual) efectivamente regeneró `dist/` en `main`.
- Resubmitir `sitemap.xml` en Google Search Console tras esa corrida.
- Fase 4 de ADR-022 (hardening: API keys hardcodeadas, CORS abierto) — diferida, sin dueño asignado.

---

*Registry, workflows y ADRs completos en `.suit/`.*
