# AGENTS.md — SuitOrg

## SuitOS Integration (activated)

This project runs on **SuitOS** — an Agent Operating System defined in `.suit/`. Every agent session must respect this hierarchy.

### Knowledge Hierarchy (enforced)

```
.suit/ARCHITECTURE.md     ← System architecture (read first)
     ↓
AGENTS.md (root)          ← This file — immutable project rules
     ↓
AGENTS.md (subproject)    ← Project-specific rules (if exists)
     ↓
.suit/workflows/          ← Declarative process definitions (YAML)
     ↓
.suit/skills/             ← Reusable capability modules (YAML)
     ↓
Code                      ← Actual implementation files
```

No component may skip a level. Always load from top to bottom.

## Activation Protocol (mandatory at session start)

Before any operation, the agent MUST:

1. Read `.suit/config/kernel.yaml` — system configuration and model preferences
2. Read `.suit/ARCHITECTURE.md` — full SuitOS architecture (2384 lines)
3. Read this file (AGENTS.md) — project rules below
4. Read `.suit/INDEX.md` — to navigate SuitOS subsystems

## Runtime Integration

| Phase | What to do | Reference |
|---|---|---|
| **Classify request** | Query `.suit/registry/routing.yaml` for intent→workflow mapping | `routing.yaml` |
| **Load context** | Use `.suit/loader/strategy.yaml` — pick minimal/standard/deep by task | `strategy.yaml` |
| **Plan** | Use `.suit/planner/template.yaml` before writing code | `template.yaml` |
| **Follow process** | Use workflow from `.suit/workflows/` matching the task | `workflows/` |
| **Validate** | Run `.suit/reviewer/` checks (quick/standard/architecture/security) before commit | `profiles.yaml` |
| **Record decisions** | Write ADR to `.suit/memory/decisions/` for architectural choices | `memory/` |
| **Log** | Record execution in `.suit/telemetry/` following `schema.yaml` | `telemetry/` |

## Registry quick reference

- `.suit/registry/agents.yaml` — agent roles (architect, developer, reviewer, cotizador)
- `.suit/registry/skills.yaml` — skill definitions (domain, language, process, tool)
- `.suit/registry/workflows.yaml` — workflow index
- `.suit/registry/projects.yaml` — subproject definitions and overrides
- `.suit/registry/models.yaml` — AI model registry
- `.suit/registry/permissions.yaml` — access control rules
- `.suit/registry/routing.yaml` — intent-to-workflow mapping

## Worker skills (`.suit/skills/`)

| Category | Contents |
|---|---|
| `system/` | context-loader, index-navigator, registry-query |
| `domain/` | multi-tenant, cotizaciones-engine, system-analysis, remotion-video |
| `language/` | javascript, gas, sql |
| `tool/` | web-search, git |
| `process/` | code-review, security-audit, deployment, pdf-generation |

## Start here
- Read `.suit/ARCHITECTURE.md` first (above) for system design
- Read `INDEX_FUNCIONES.md` to locate any function (file:line) before reading source files
- Reference `contexto.md` for architecture, conventions, glossary, and known errors
- Use `.suit/loader/strategy.yaml` to determine what context to load

## Architecture (non-obvious)
- 4 independent servers: `server.js` (Express, 3001), `SuitCampanas/local-server-node.js` (http, 8000), `citas/index.js` (Express, 3002), `SuitVidGenRemotion/` (Remotion Studio, 3004)
- **ViRe** (`SuitVidGenRemotion/`): Módulo de video con Remotion. Usa `npm run dev` para abrir el estudio en puerto 3004.
- Dual backend: GAS (`backend/`) does core CRUD on Google Sheets; Node.js proxies to Supabase, Gemini, Stripe
- Hybrid DB: 5 MASTER tables always in Sheets (`Config_Empresas`, `Usuarios`, `Config_Roles`, `Config_SEO`, `Prompts_IA`); PRIVATE tables migrate to Supabase per-tenant via `db_engine`
- Two Supabase projects: backend `egyxgnlnzanxpqyuvmsg`, vision-audit `hmrpotibipxhsnowgjvq`
- Frontend: vanilla JS SPA, hash routing (`#orbit`, `#pos`, `#home`, `#leads`, `#catalog`, `#agents`)
- RBAC levels: DIOS(999), ADMIN(10), STAFF(5), DELIVERY(-)
- Watchdog sync loop every 7.5s (`app.js`); inactivity timeout: visitors 5min, staff 8h, others 120s
- CI/CD: clasp for GAS, GitHub Actions (push to `main` → GH Pages)

## Immutable rules
1. All queries filter by `id_empresa` — no cross-tenant data
2. Soft delete only: `activo = FALSE`, never physical DELETE
3. Sequential IDs: `LEAD-XXX`, `ORD-XXX`, `PROD-XX`, `CLI-XXX` — no UUIDs
4. Token `API_AUTH_TOKEN` required on all POST to GAS
5. Use `no-cors` for GAS fetch (GAS rejects OPTIONS preflight)
6. `activo` from Supabase arrives as lowercase `"true"` — normalize with `.toUpperCase().trim() === "TRUE"`
7. No frontend frameworks — vanilla JS only

## Exact commands
```bash
# Start dev servers (each in its own terminal)
node server.js                          # port 3001
node SuitCampanas/local-server-node.js    # port 8000
node citas/index.js                     # port 3002
cd SuitVidGenRemotion && npm run dev    # port 3004 (Remotion Studio / ViRe)

# Deploy GAS (backend/)
clasp push && clasp deploy

# Regenerate function index (run after adding/renaming functions)
node scripts/generate-index.js

# Backup rápido (WSL) — excluye node_modules de subproyectos, .venv, etc.
bash scripts/backup.sh

# Prospección comercial (independiente, con GOOGLE_MAPS_API_KEY en .env)
node prospectos/prospect.js --list
node prospectos/prospect.js --ciudad Monterrey --nicho restaurantes --radio 3
```

## Known gotchas
- **Hardcoded API keys**: `backend/core.js:13`, `SuitCampanas/script.js:8-11`, `scripts/agents/vision-audit.js:14` — don't add more; use `.env`
- **`service_role` key in client**: `SuitCampanas/lib/supabase.js`, `citas/db/client.js` — bypasses RLS, treat as high risk
- **`syncToSupabase` empty catch**: `backend/utils.js` — sync errors silently swallowed
- **GAS URL hardcoded** in `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js` — update all on GAS redeploy
- **`reel-generator.js:103`**: duplicate `generar()` method would stack overflow if called
- **`confirmPayment`** (`conecionpagos/index.js`): only retrieves intent, does not confirm (misleading name)
- **Model `gemini-1.5-flash` deprecated** — migrate to OpenRouter free models
- **Stripe webhook** must be registered before `express.json()` in `server.js` (line 13)
- **`no-cors` fetch to GAS** returns opaque response — can't read body on client side
- No tests, lint, or typecheck exist — smoke test manually

## Workflow (SuitOS-aware)

1. **Classify request** — query `.suit/registry/routing.yaml` for intent→workflow mapping
2. **Load strategy** — use `.suit/loader/strategy.yaml` to load minimal context for the task
3. **Plan** — use `.suit/planner/template.yaml` before writing code (skip for low-risk tasks)
4. **Apply change** — follow workflow steps from `.suit/workflows/<workflow>.yaml`
5. **Index** — run `node scripts/generate-index.js` if functions changed
6. **Validate** — run `.suit/reviewer/profiles.yaml` checks matching risk level
7. **Record** — write ADR to `.suit/memory/decisions/` for architectural choices
8. **Commit** — format `{emoji} {tipo}: {desc} (v{X.Y.Z})`
9. **Log** — record execution in `.suit/logs/` following telemetry schema
10. **Smoke test manually**

## Standard for new modules (SuitReservaciones pattern)

Al crear un nuevo módulo independiente, seguir este procedimiento:

1. Crear carpeta con `package.json`, `index.js` (Express server), `db/client.js`, `handlers/`, `services/`
2. `index.js` debe exportar la app: `module.exports = app;` al final del archivo
3. Montar en `server.js` vía `require` + `app.use()`
4. Elegir puerto único — registry actual:
   | Puerto | Módulo |
   |---|---|
   | 3001 | Main server.js |
   | 3002 | SuitReservaciones |
   | 3003 | SuitCotizador |
   | 3004 | SuitVidGenRemotion (ViRe) |
    | 3005 | SuitPedidoExpress |
    | 3006 | SuitPos |
    | 3007 | SuitProductos |
    | 3008 | SuitInventarios |
    | 3009 | SuitBodega |
    | 3010 | SuitAI |
    | 8000 | CampanasAi |
5. Registrar en `.suit/registry/projects.yaml` con frontend gates, puertos y tablas
6. Si el módulo tiene gate de UI (como `modo` flags o `usa_reservaciones`), documentarlo en `projects.yaml` bajo `frontend:`
7. Escribir ADR en `.suit/memory/decisions/` explicando la decisión arquitectónica

## High-risk changes (always report before acting)
- **Environment**: WSL / GitHub / Windows
- **Files affected**
- **Brief plan**
- **Validation proposed**
- **Risk level**: low / medium / high
- **Confirmation required**: yes / no

## Environment preference
- **WSL** for: npm, node, git, bash scripts, grep, zip backups, clasp
- **GitHub** for: remotes, PRs, Actions, releases
- **Windows** only for: host-only tasks (browsers, Explorer, Windows-only tools)

## Syntax validation (mandatory after every JS edit)

After editing any `.js` file, the agent MUST run:
```
node --check <file>
```
This catches syntax errors (unclosed braces, dangling commas, missing brackets) before they reach the browser. Run it for every JS file modified. If the file is part of a module (`type:"module"` in package.json) or uses ES module syntax, use the appropriate check. For vanilla JS (no imports/exports), `node --check` works directly.

Ignore this rule for `.json`, `.css`, `.html`, `.yaml`, `.md` files.
