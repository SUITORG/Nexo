# GeneralToolsRP — Skills, MCPs & Agentes

> Mantenimiento: este archivo se actualiza manualmente al agregar/quitar herramientas.
> Skills instaladas via `npx skills add`, MCPs en `opencode.json`, agentes en `.suit/registry/agents.yaml`.

---

## Resumen por herramienta

### OpenCode (18+15 herramientas)

| Tipo | Herramientas |
|---|---|
| Skills exclusivas (2) | `google-places-business-finder`, `multi-tenant-saas` |
| Skills universales (15) | Todas las demás (compartidas con Claude y otros) |
| MCPs (6) | higgsfield, supabase, google-sheets, playwright, chrome-devtools, github |
| Comandos (8) | suit, suit:registry, suit:workflow, suit:validate, suit:memory, suit:plan, suit:commit, suit:backup |
| Agentes (1) | vision-audit (`scripts/agents/vision-audit.js`) |

### Claude Code (15 skills)

Todas las universales (15) + `self-learning`. Las mismas 15 también disponibles en OpenCode.

| Skill | Descripción |
|---|---|
| `apify-easy-competitive-intelligence` | Análisis competitivo, battlecards, SWOT |
| `code-index` | Genera índice de funciones/clases/endpoints |
| `correctness-and-error-handling` | Corrige bugs, null/undefined, async errors |
| `frontend-design` | Guía de diseño visual intencional |
| `frontend-slides` | Presentaciones HTML animadas desde PPT |
| `last30days` | Research engine multi-plataforma (últimos 30 días) |
| `optimize-prompt-token-efficiency` | Comprime prompts maximizando densidad |
| `project-audit` | Auditoría read-only de arquitectura/seguridad |
| `prospeccion-ia-monterrey` | Detecta oportunidades de automatización en Mty |
| `remotion-best-practices` | Best practices para video en React |
| `self-learning` | Generador de skills vía web search |
| `social-media-trends-research` | Research de tendencias (pytrends, yars) |
| `sync-gs-supabase` | Sincroniza Google Sheets → Supabase |
| `viral-short-form` | Crea contenido viral (TikTok, Reels, Shorts) |
| `browser-act` | Automatización de navegador CLI |

### Universales (`.agents/skills/` — disponibles en cualquier tool)

15 skills que cualquier agente (OpenCode, Claude, Codex, Gemini CLI, etc.) puede usar.

---

## Skills — detalle

| Skill | Descripción | Universal | Exclusiva de |
|---|---|---|---|---|
| **apify-easy-competitive-intelligence** | Análisis competitivo: precios, landscape, sentimiento, battlecards, SWOT | ✅ | — |
| **browser-act** | Automatización navegador: fetch, forms, screenshots, HAR, sesiones | ✅ | — |
| **code-index** | Índice de funciones, clases, endpoints de un proyecto | ✅ | — |
| **correctness-and-error-handling** | Corrige bugs, null/undefined, empty states, async errors | ✅ | — |
| **frontend-design** | Guía de diseño visual intencional | ✅ | — |
| **frontend-slides** | Presentaciones HTML animadas desde PPT/PPTX | ✅ | — |
| **google-places-business-finder** | Busca negocios por nicho/localidad vía Google Places API | ❌ | OpenCode |
| **last30days** | Research engine: 15+ plataformas, últimos 30 días, brief con citas | ✅ | — |
| **multi-tenant-saas** | Skill de SuitOrg: multi-tenant, RBAC, GAS, Supabase, vanilla JS | ❌ | OpenCode |
| **optimize-prompt-token-efficiency** | Comprime prompts, máxima densidad de información | ✅ | — |
| **project-audit** | Auditoría completa de arquitectura, procesos, seguridad (read-only) | ✅ | — |
| **prospeccion-ia-monterrey** | Detecta oportunidades de automatización en área metropolitana de Mty | ✅ | — |
| **remotion-best-practices** | Best practices Remotion: setup, animaciones, audio, 3D, captions | ✅ | — |
| **self-learning** | Genera skills autónomamente investigando desde la web | ✅ | — |
| **social-media-trends-research** | Research programático: pytrends, yars, Perplexity MCP | ✅ | — |
| **sync-gs-supabase** | Sincroniza Google Sheets → Supabase con merge-duplicates | ✅ | — |
| **viral-short-form** | Crea hooks, scripts, carruseles para TikTok/Reels/Shorts | ✅ | — |

---

## MCPs (Model Context Protocol)

Definidos en `opencode.json` y `~\.claude\settings.json` — disponibles en **ambas herramientas**.

| MCP | Tipo | Descripción |
|---|---|---|
| **higgsfield** | Remote | Generación de video AI (`https://mcp.higgsfield.ai/mcp`) |
| **supabase** | Local | Conexión a Supabase vía `scripts/mcp-supabase.js` |
| **google-sheets** | Local | Google Sheets vía `mcp-gsheets` (proyecto `suitorg00`) |
| **playwright** | Local | Automatización de navegador vía `@playwright/mcp` |
| **chrome-devtools** | Local | DevTools MCP para debugging e inspección |
| **github** | Local | API de GitHub vía `@modelcontextprotocol/server-github` |

---

## Agentes

### SuitOS Agents (`.suit/registry/agents.yaml`)

| Agente | Rol | Risk | Skills requeridas |
|---|---|---|---|
| **architect** | Análisis y diseño de arquitectura | high | system-analysis, multi-tenant |
| **developer** | Implementación y refactorización de código | medium | javascript, gas |
| **researcher** | Recolección y análisis de información | low | web-search, trend-analysis |
| **reviewer** | Revisión de código y arquitectura | low | code-review, security-audit |
| **cotizador** | Especialista en motor de cotizaciones | — | — |

### Script agents (`scripts/agents/`)

| Agente | Descripción | Disponible en |
|---|---|---|
| **reportero** | Revisor read-only de código (genera reportes) | Claude / OpenCode |
| **probador** | Smoke tester read-only (corre tests) | Claude / OpenCode |
| **vision-audit** | Auditoría de visión / imagen | OpenCode |

### Comandos personalizados (OpenCode)

| Comando | Descripción |
|---|---|
| `suit` | SuitOS — consultar registry, cargar workflows, validar |
| `suit:registry` | Consultar el registry de SuitOS |
| `suit:workflow` | Cargar un workflow de SuitOS |
| `suit:validate` | Correr perfil de revisión de SuitOS |
| `suit:memory` | Escribir un ADR a la memoria de SuitOS |
| `suit:plan` | Crear plan de ejecución SuitOS |
| `suit:commit` | Hacer commit con formato SuitOS desde WSL |
| `suit:backup` | Crear respaldo ZIP desde WSL |

---

## Utilidades de workflow (feature.yaml)

Agregadas para cubrir 3 huecos: detección de archivos sueltos, decisión frontend/backend, launcher por proyecto.

| Utilidad | Dónde vive | Qué hace |
|---|---|---|
| **Detección de archivos sueltos** | `scripts/find-loose-files.js` (tool `SuitLooseFiles` en `tools.yaml`) | Escanea un directorio y reporta archivos cuyo nombre no aparece referenciado en ningún otro archivo del proyecto (logs, temporales, docs huérfanos). Read-only. Generaliza la limpieza de páginas huérfanas de `ssg-engine.mjs` (ADR-022) a cualquier proyecto. Se corre en el step `validate` de `.suit/workflows/feature.yaml`. |
| **Decisión frontend/backend** | `.suit/workflows/feature.yaml` → step `analyze` | Regla agregada a `validation`: determinar si la tarea requiere frontend, backend o ambos, e implementar solo lo necesario — no se scaffoldea el lado que no aplica. |
| **Launcher .bat por proyecto** | `.suit/templates/start.bat.template` + step `scaffold-launcher` en `feature.yaml` | Si el feature crea un proyecto standalone nuevo (con su propio `server.js`/`package.json` y sin `start.bat`), se genera un `start.bat` desde el template (abre el navegador en `localhost:{{PORT}}` y corre `node {{ENTRY}}`). No se regenera si el proyecto ya tiene launcher. |

---

## Ubicaciones de instalación

| Ruta | Propósito | Tool |
|---|---|---|
| `~\.agents\skills\` | Skills universales (compartidas) | Cualquier agente |
| `~\.claude\skills\` | Skills para Claude Code | Claude |
| `~\.config\opencode\skills\` | Skills de OpenCode | OpenCode |
| `.\opencode\skills\` | Skills del proyecto SuitOrg | OpenCode |
| `.\opencode.json` | Config MCPs + comandos personalizados | OpenCode |
| `.suit\registry\agents.yaml` | Registro de agentes SuitOS | Ambos |
| `scripts\agents\` | Scripts de agente ejecutables | Ambos |
