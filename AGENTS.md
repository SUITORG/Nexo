# AGENTS.md — SuitOrg

## Start here
- Read `INDEX_FUNCIONES.md` to locate any function (file:line) before reading source files.
- Reference `contexto.md` for architecture, conventions, glossary, and known errors.

## Architecture (non-obvious)
- 3 independent servers: `server.js` (Express, 3001), `CampanasAi/local-server-node.js` (http, 8000), `citas/index.js` (Express, 3002)
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
node CampanasAi/local-server-node.js    # port 8000
node citas/index.js                     # port 3002

# Deploy GAS (backend/)
clasp push && clasp deploy

# Regenerate function index (run after adding/renaming functions)
node scripts/generate-index.js

# Quick backup (WSL)
zip -r "SUIT_$(date +%d%m%y)_WSL.zip" . -x "*/node_modules/*" "*/.git/*" "*.zip" "*/.agent/*"

# Prospección comercial (independiente, con GOOGLE_MAPS_API_KEY en .env)
node prospectos/prospect.js --list
node prospectos/prospect.js --ciudad Monterrey --nicho restaurantes --radio 3
```

## Known gotchas
- **Hardcoded API keys**: `backend/core.js:13`, `CampanasAi/script.js:8-11`, `scripts/agents/vision-audit.js:14` — don't add more; use `.env`
- **`service_role` key in client**: `CampanasAi/lib/supabase.js`, `citas/db/client.js` — bypasses RLS, treat as high risk
- **`syncToSupabase` empty catch**: `backend/utils.js` — sync errors silently swallowed
- **GAS URL hardcoded** in `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js` — update all on GAS redeploy
- **`reel-generator.js:103`**: duplicate `generar()` method would stack overflow if called
- **`confirmPayment`** (`conecionpagos/index.js`): only retrieves intent, does not confirm (misleading name)
- **Model `gemini-1.5-flash` deprecated** — migrate to OpenRouter free models
- **Stripe webhook** must be registered before `express.json()` in `server.js` (line 13)
- **`no-cors` fetch to GAS** returns opaque response — can't read body on client side
- No tests, lint, or typecheck exist — smoke test manually

## Workflow
1. Find function in `INDEX_FUNCIONES.md` → read only that context
2. Classify risk: touches multi-tenant, security, GAS, or Supabase? → high risk
3. Apply change → run `node scripts/generate-index.js` if functions changed → commit with format `{emoji} {tipo}: {desc} (v{X.Y.Z})`
4. Smoke test manually

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
