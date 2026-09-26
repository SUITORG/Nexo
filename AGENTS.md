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

## Token Efficiency (mandatory)

**Regla:** Cargar SOLO el contexto necesario. No sobrecargar tokens.

| Estrategia | Tokens | Cuándo usarla |
|---|---|---|
| `minimal` | ~2K | Preguntas simples, revisiones rápidas, queries |
| `standard` | ~8K | Features, bugfixes, tareas típicas |
| `deep` | ~20K | Auditorías completas, arquitectura, migraciones |

**Proceso obligatorio:**
1. Clasificar la solicitud → determinar nivel de complejidad
2. Seleccionar estrategia en `.suit/loader/strategy.yaml`
3. Cargar SOLO archivos listados en `includes` de esa estrategía
4. Si el archivo es INDEX_FUNCIONES.md → leer solo las funciones necesarias (file:line)
5. No cargar archivos de memoria/decisions/ a menos que sea `deep`

**Archivos clave:**
- `.suit/loader/strategy.yaml` — define qué cargar por estrategia
- `INDEX_FUNCIONES.md` — ubicar funciones específicas sin leer archivos completos
- `.suit/skills/system/context-loader.yaml` — skill de carga de contexto

**Ejemplo correcto:**
```
Usuario: "¿Cuál es el puerto de SuitPos?"
→ Estrategia: minimal (2K)
→ Cargar: AGENTS.md + projects.yaml (lookup puerto)
→ Responder: 3006
```

**Ejemplo incorrecto (lo que pasó antes):**
```
Usuario: "Evalúa SuitServiHogar"
→ Se cargaron: 5 prompts completos + 60 archivos del proyecto
→ Debió ser: AGENTS.md + Contrato.md + schema.sql (standard/8K)
```

## Autocompactación (siempre activa)

Al llegar a ~60% de la ventana de contexto, **compactar antes de seguir**. No esperar al límite duro.

**Conservar:**
1. Contrato activo (ruta + reglas clave)
2. Objetivo de la sesión y lista 20/80
3. Decisiones tomadas y aprobaciones del usuario
4. Errores y aprendizajes de esta sesión
5. Rutas de archivos tocados y pendientes abiertos

**Borrar:**
1. Todo lo ajeno al alcance activo (otros subproyectos, búsquedas web, tangentes)
2. Salidas crudas largas (logs, dumps, HTML, respuestas completas de API) — dejar solo la línea concluyente
3. Exploraciones descartadas y código que ya no existe en el repo
4. Repeticiones del contrato — guardar la regla, no el archivo completo

**Después de compactar:**
1. Releer el contrato activo
2. Escribir resumen de estado de 5 líneas
3. Seguir con la tarea pendiente

*Ref: `.agents/skills/ciclo/references/compactacion.md`*

## Enfoque 20/80 (Pareto) — siempre activo

Antes de ejecutar cualquier solicitud del usuario:

1. **Identificar** el 20% de acciones que resuelve el 80% del impacto/valor
2. **Ejecutar** solo eso primero
3. **Preguntar** si se debe continuar con el resto
4. **No ejecutar** tareas de bajo impacto sin confirmación explícita

*Ref: `.agents/skills/ciclo/SKILL.md` Fase 1 (Encuadre 20/80), `.suit/skills/domain/data-cleanup.yaml`*

## Prompt pre-flight — siempre activa

Antes de responder o actuar sobre cualquier pedido, correr el pre-vuelo (skill `prompt-reviewer`, sin imprimir el checklist):
1. Revisar contexto, supuestos y 5 sesgos (ambigüedad, supuestos, acción prematura, confirmación, scope creep).
2. **Q&A / lectura / contexto** → responder directo, 0 preguntas, salida mínima.
3. **Modificación** → optimizar el pedido; si certeza <95% → ≤3 preguntas y esperar; si ≥95% → ejecutar. Tras ejecutar, dí-gigo extras en 1 línea.

## Confirmación antes de ejecutar — siempre activa

No ejecutar modificaciones hasta no estar al **95% segura**.

| Situación | Acción |
|---|---|
| Hay duda sobre el alcance | **Preguntar** |
| Hay 3+ opciones posibles | **Preguntar** |
| Cambio destructivo (DELETE, DROP, overwrite) | **SIEMPRE preguntar** |
| Solo es adición/lectura, sin riesgo | Ejecutar |
| Usuario dio instrucción explícita y clara | Ejecutar |

*Ref: `contrato-subproyecto.yaml` ct-001, `iteration-loop.yaml` il-002, `data-cleanup.yaml` dc-001*

## Registry quick reference

- `.suit/registry/agents.yaml` — agent roles
- `.suit/registry/skills.yaml` — skill definitions
- `.suit/registry/workflows.yaml` — workflow index
- `.suit/registry/projects.yaml` — subproject definitions
- `.suit/registry/models.yaml` — AI model registry
- `.suit/registry/permissions.yaml` — access control
- `.suit/registry/routing.yaml` — intent-to-workflow mapping

## Worker skills (`.suit/skills/`)

| Category | Contents |
|---|---|
| `system/` | context-loader, index-navigator, registry-query |
| `domain/` | multi-tenant, cotizaciones-engine, system-analysis, remotion-video, design-system, brief-engine |
| `language/` | javascript, gas, sql |
| `tool/` | web-search, git, web-research |
| `process/` | code-review, security-audit, deployment, pdf-generation |

## Instalar una skill nueva

1. **Ubicación**: la skill va primero a `.agents/skills/<nombre>/` (nunca directo a `.claude/skills/` ni `.opencode/skills/`) — esa es la única copia real.
2. **Paridad**: crea los 2 junctions: `.claude/skills/<nombre>` → `.agents/skills/<nombre>` y `.opencode/skills/<nombre>` → `.agents/skills/<nombre>`. Usa `node scripts/install-skill.js <nombre> [ruta-origen]` — hace los pasos 1, 2 y la revisión de colisión de nombre sola.
3. **¿Es de gobierno SuitOS?** Si la skill va a ser referenciada por un workflow o necesita reglas de negocio propias (más allá de lo que ya dice su `SKILL.md`), agrégala a `.suit/registry/skills.yaml` como `{name, path}` apuntando a su `.suit/skills/<categoría>/<nombre>.yaml` — nunca copies su `description` ahí. Si es una skill genérica, no la registres: el registry es solo para lo que SuitOS gobierna.
4. **Regenera el inventario**: `node .suit/skills/process/listado-capacidades/scripts/generate-list.js` (el script de instalación ya lo corre solo).

## Start here
- Read `.suit/ARCHITECTURE.md` first (above) for system design
- Read `INDEX_FUNCIONES.md` to locate any function (file:line) before reading source files
- Reference `contexto.md` for architecture, conventions, glossary, and known errors
- Use `.suit/loader/strategy.yaml` to determine what context to load

## Architecture (non-obvious)
- 4 independent servers: `server.js` (Express, 3001), `SuitCampanas/local-server-node.js` (http, 8000), `citas/index.js` (Express, 3002), `SuitVidGenRemotion/` (Remotion Studio, 3004)
- **ViRe** (`SuitVidGenRemotion/`): Módulo de video con Remotion. Puerto 3004.
- **SuitServiHogar** (`SuitServiHogar/`): Micro-frontend aislado (React 19, ADR-029). Puerto 3010. No integra al SPA principal.
- Dual backend: GAS (`backend/`) CRUD on Google Sheets; Node.js proxies to Supabase, Gemini, Stripe
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

## Ciclo — Mandatory Overlay (auto-wrapper)

**Fuente única**: `.agents/skills/ciclo/SKILL.md` (visible nativamente en Claude Code vía `.claude/skills/ciclo` y en OpenCode vía `.opencode/skills/ciclo` — mismo archivo, dos junctions). No restates aquí las fases, auto-chain-rules ni el detalle de modos (`contrato`, `depura`) — están ahí y en `references/fases.md`, `references/alcance.md`, `references/contrato.md`, `references/depuracion.md`, `references/db-sync.md`.

**Esta skill es AUTOMÁTICA — no la saltes por "cambios pequeños".** Antes de cualquier modificación de código: resuelve alcance y contrato leyendo `.agents/skills/ciclo/references/alcance.md`. Después de cualquier modificación: valida y comitea por fase como indica la skill.

### Keywords que disparan ciclo (ver también `.suit/registry/routing.yaml`)

`mejoras`, `cambios`, `mantenimiento`, `modificaciones`, `compactar`, `compactacion`, `depuracion`, `ciclo`, `fase`, `contrato`, `refactorizar`, `optimizar`, `limpiar codigo`.

## Brief generation cycle (CampanasAi)

When generating a Marketing Brief (workflow `brief-generation`), follow this cycle:

1. **Parse existing** — `brief.parse` MCP tool or `parseBrief()` to load current `Config_Empresas.logo_url`
2. **Fill from DB** — `brief-engine` skill reads `Config_Empresas` + Supabase catalogs (`industrias`, `nichos`)
3. **Research** — `web-research` skill runs parallel queries (audience, pain, competitors, legal)
4. **Verify assets** — check LAPVTFU completeness, mark `[PENDIENTE]` gaps
5. **Consolidate** — agent assembles vector, applies confidence semaphores (A/B/C)
6. **Confirm** — show diff to user before writing
7. **Write** — `brief.assemble` MCP tool or direct Sheets write
8. **Save metadata** — `brief.json` + `confianza.json` in workspace

**MCP server**: `SuitCampanas/mcp/brief-server.js` (stdio transport, 4 tools)
**Command**: `/brief [empresa]` (OpenCode + Claude Code)

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
    | 3010 | SuitServiHogar (micro-frontend aislado, ADR-029) |
    | 3011 | SuitChatTG |
    | 3013 | SuitDiccionario |
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
