# Arquitectura — SuitOrg

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | HTML/CSS/JS vanilla (SPA, hash routing). v16.7.28 |
| Backend #1 | Google Apps Script (GAS) en `backend/`. v15.9.9 |
| Backend #2 | Node.js + Express (puerto 3001) con Helmet CSP |
| Backend #3 | Node.js http nativo (puerto 8000) para CampanasAI |
| DB Primaria | Google Sheets (`1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8`) |
| DB Cloud | Supabase PostgreSQL (`egyxgnlnzanxpqyuvmsg.supabase.co`) |
| AI | Gemini 1.5/2.0 Flash + OpenRouter multi-model fallback |
| Pagos | Stripe (API `2025-02-24.acacia`) |
| Video | FFmpeg vía `execSync` |
| CI/CD | clasp (GAS) + GitHub Actions (`deploy.yml`) |
| Dev | WSL 2, ripgrep, fd-find |

## Mapa de Carpetas

```
SUITORGSTORE01/
├── backend/              → GAS: core (orquestador), database, utils, ai_engine, DriveManager, seeds_master
├── CampanasAi/           → CMS marketing: frontend SPA, server Node 8000, generadores, scripts, config
├── citas/                → Módulo citas: Express 3002, webhook WhatsApp, handlers, servicios (AI/Calendar/Notifier)
├── conecionpagos/        → Módulo Stripe: multi-tenant PaymentIntents, webhooks
├── js/modules/            → Frontend SPA: core, router, auth, ui, public, pos, admin, agents, config, events
├── dist/                 → SSG output: landing pages estáticas por empresa
├── scripts/              → Utilidades: generate-index, orchestrator_client, ssg-engine, vision-audit
├── Documentacion/        → Docs, SQLs de migración, seeds
├── knowledge/            → Base RAG para agentes IA (pensiones, contabilidad)
├── .agent/               → Memoria del agente: lecciones, checkpoints, estándares, workflows (21)
├── .opencode/skills/     → Skill multi-tenant-saas
├── .claude/              → Config Claude, agentes, skills
└── _LEGACY_BACKUPS/      → Respaldos ZIP históricos
```

## Flujo de Datos

1. **Browser SPA** (hash routing) → GAS backend (Sheets CRUD) o Express proxy 3001 (Supabase, Gemini, Stripe).
2. **CampanasAI** (puerto 8000) → proxy a GAS para Sheets (hoja SMMC) + directo a Supabase para industrias/recetas/tendencias + FFmpeg para video.
3. **Citas** (puerto 3002) → webhook WhatsApp → Gemini (intent detection) → Supabase (Reservaciones) → Google Calendar → notifica al servidor principal.
4. **5 tablas MAESTRO** siempre en Google Sheets, tablas PRIVATE migran a Supabase según `db_engine` por tenant, con sincronización bidireccional automática.
5. Loop de monitoreo cada 7.5s (`app.js`) reconcilia estado local vs backend con cache en localStorage.

## Lo que NO existe

| Ausencia | Dónde debería estar |
|---|---|
| Tests automatizados (solo `test-system.js` básico) | `tests/` o `__tests__/` |
| CI/CD funcional (workflow YML existe pero sin steps reales) | `.github/workflows/deploy.yml` |
| Documentación de API Express | `docs/api.md` o similar |
| Rate limiting en endpoints públicos | `server.js` / `local-server-node.js` |
| Manejo de errores unificado | Middleware Express, sin `app.use(errorHandler)` |
| Dockerfile / docker-compose | Raíz del proyecto |
| Migración completa a Supabase (hoy híbrido) | `Documentacion/03-solucion-migracion.md` documenta el plan |
| Logs centralizados (hoy van a hoja Logs en Sheets) | [PENDIENTE: sistema de logging externo] |
| Backup automatizado (solo manual vía zip WSL) | [PENDIENTE: script/cron de backup] |

[PENDIENTE: Los endpoints de Express no están documentados formalmente. La documentación existe dispersa en ARCHITECTURE.md, SKILL.md y AGENTS.md, pero no hay un OpenAPI/Swagger.]
