# PENDIENTES.md — Fuente Única de Verdad (Guía Total)

> **Para qué sirve:** TODO lo que está pendiente en SuitOrg — guía, proyectos estandarizados, deuda técnica, roadmap de productos. **Una sola ventana.** Auto-alimentado por el cierre de `/guia-total`. Filas nunca se borran: se tachan con fecha en "Cerrados".
> **Absorbe** (2026-09-26): `ROADMAP_PENDIENTES.md` (raíz) · `roadmap.md` (raíz) · `.suit/memory/pending/tech-debt.yaml` → eliminados, contenido aquí.

## Las 4 fuentes de verdad (regla — no crear una 5ª)

| # | Vive en | Qué contiene |
|---|---|---|
| **1** | **este archivo** | todo el "qué está pendiente": guía, proyectos, deuda técnica, roadmap |
| **2** | `GuiaTotal/registro/<proyecto>.yaml → proximo_paso` | siguiente paso corto de UN proyecto |
| **3** | `<Proyecto>/docs/15-riesgos-deuda-tecnica-y-backlog.md` | deuda profunda auditable de UN proyecto (1 fila-resumen aquí) |
| **4** | `<Alcance>/CORRECCIONES.md` + `PLAN-SYNC.md` + `PLAN-DEPURA.md` | estado transitorio del ciclo en curso — **se autocierra** al terminar el ciclo |

No trackers fuera de esta lista. Documentos de plan (`plan-*.md`, ADRs, `docs/05-16`) = **referenciados, no trackers**.

---

## A. Abiertos — Guía Total y proyectos estandarizados

- [ ] **SuitServiHogar — drift SQL**: definir fuente canónica (`supabase/migrations/` recomendado) y copiar las 3 migraciones que solo existen en `migrations/` (`price_negotiation`, `antifuga_config`, `decisions_config`). *2026-09-26 · decisión de esquema, requiere visto bueno*
- [ ] **SuitServiHogar — docs de auditoría faltantes**: `09-reglas`, `11-integraciones`, `13-despliegue`, `15-riesgos` (evidencia ≥84%, pendiente aprobación). *2026-09-26*
- [ ] **SuitServiHogar — `AGENTS.md` desactualizado**: dice `screens/ (7)`, hay 13. *2026-09-26*
- [ ] **SuitDashboard — instancias faltantes**: 4 manuales, identidad, prompt origen, checklist, `docs/05+06` (tarjeta `documentos: false`). *2026-09-26*
- [ ] **Integración profunda `auditoria` ↔ `guia-total`** (hoy solo gancho en MAPA §4/§9). *2026-09-26*
- [ ] **Skills externas**: guion `MAPA.md §10` vacío — rellenar al primer pedido de instalación. *2026-09-26*
- [ ] **Registro SuitOS**: `guia-total` y `auditoria` no están en `.suit/registry/skills.yaml` (¿gobierno SuitOS? decisión del install). *2026-09-26*
- [ ] **Push a GitHub**: rama `evasol-supabase-migration` ahead 45 — pendiente de decisión. *2026-09-26*

## B. Deuda técnica SuitOS *(absorbida de `tech-debt.yaml`)*

### 🔴 Crítico / Alto (abiertos)

- [ ] **TD-014** · *crítico* · APIs de subsistemas **sin autenticación** (SuitReservaciones, SuitPedidoExpress, SuitPos, SuitProductos, SuitInventarios, SuitBodega, SuitCotizador, citas) — cualquier endpoint accesible sin token vía `/api/*`. Propuesta: middleware JWT gateway central en `server.js` o aislamiento por puerto con reverse proxy. *2026-07-09*
- [ ] **TD-015** · *alto* · `service_role` key en `db/client.js` de todos los módulos nuevos (PedidoExpress, Pos, Productos, Inventarios, Bodega) — bypass total de RLS. Extensión de TD-003. *2026-07-09*
- [ ] **TD-003** · *alto* · `service_role` en cliente (`SuitCampanas/lib/supabase.js`, `citas/db/client.js`). *2026-07-05*
- [ ] **TD-001** · *alto* · API keys hardcodeadas en `backend/core.js:13`. *2026-07-05*
- [ ] **TD-006** · *alto* · Modelo `gemini-1.5-flash` deprecado — migrar a OpenRouter free (`backend/ai_engine.js`). *2026-07-05*

### 🟠 Abiertos (resto)

- [ ] **TD-004** · medio · `syncToSupabase` catch vacío en `backend/utils.js`. *2026-07-05*
- [ ] **TD-005** · medio · GAS URL hardcodeada en `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js`. *2026-07-05*
- [ ] **TD-007** · medio · No hay tests automatizados (raíz). *2026-07-05*
- [ ] **TD-009** · medio · Sin sistema de logging centralizado. *2026-07-05*
- [ ] **TD-010** · medio · Sin rate limiting en endpoints públicos (`server.js`, `local-server-node.js`). *2026-07-05*
- [ ] **TD-012** · medio · SuitCotizador: migración Supabase pendiente de aplicar (`Documentacion/migrations/001_suit_cotizador.sql`). *2026-07-05*
- [ ] **TD-013** · medio · SuitCotizador: procesos y reglas de precio base para estándares mexicanos pendientes. *2026-07-05*
- [ ] **TD-016** · medio · Probar SuitAI en vivo (`/api/ai/models`, `/api/ai/chat`, circuit breaker, fallback Gemini) — requiere keys en `.env`. *2026-07-09*
- [ ] **TD-018** · medio · Registrar OmniRoute como servicio en `projects.yaml` (gateway IA, puerto 20128, usado por SuitCampanas). *2026-08-27*
- [ ] **TD-008** · bajo · Sin lint/typecheck en raíz. *2026-07-05*
- [ ] **TD-011** · bajo · Sin staging/pre-producción ni rollback documentado. *2026-07-05*
- [ ] **TD-017** · bajo · SuitMistral existe pero sin registrar en `projects.yaml`, sin `.bat`, sin menú. *2026-08-23*

### ⏸ Diferidos (con motivo — no olvidar)

- [ ] **FT-006** · *alto, PRIORIDAD usuario* · `opencode-claude-memory` (npm): memoria persistente compartida OpenCode↔Claude, auto-extracción post-sesión, `.claude/memory/`. Instalar lo antes posible: `npm install -g opencode-claude-memory` + shell hook. *2026-08-27*
- [ ] **FT-001** · medio · ComfyUI como motor visual/audio para VIDE (workflows text2img+ControlNet, AnimateDiff, SFX; conectar `generateVideJson()`→MCP). Solo paso 1 (registro) hecho — pausado hasta probar manualmente el pipeline VIDE mejorado. *2026-07-30*
- [ ] **FT-002** · bajo · DaVinci Resolve vía MCP (color grading, mezcla). Pendiente de que la prueba manual del pipeline VIDE muestre gaps que FFmpeg no resuelva. *2026-07-30*
- [ ] **FT-003** · medio · OpenSandbox como backend de ejecución segura para agentes (Docker/K8s, skill, registro, MCP). *2026-08-27*
- [ ] **FT-007** · medio · Headroom (proxy que comprime contexto LLM, ahorro 17-45% tokens): `pip install headroom-ai[proxy]`. *2026-08-27*
- [ ] **FT-004** · bajo · Instalar `addyosmani/agent-skills` (24 skills MIT): `npx skills add addyosmani/agent-skills`. *2026-08-27*
- [ ] **FT-005** · bajo · Instalar `msitarzewski/agency-agents` (148k★ MIT): `npx skills add msitarzewski/agency-agents`. *2026-08-27*
- [ ] **FT-009** · bajo · Imagen+Prompt con Gemini Vision (prompt automático de foto de referencia para Pollinations/SuitComfy/ViRe). *2026-09-04*

### 📡 Monitoreo

- [ ] **FT-008** · OpenCut (`OpenCut-app/OpenCut`) — esperar MCP server / Editor API (reescritura Rust). Verificar cada 2 semanas. *2026-08-30*

### ❓ Decisión pendiente

- [ ] **FT-010** · Poda de MCPs hecha en F3 (2026-09-25) sin acuerdo: `.mcp.json` quitó 10 servers de Claude, `opencode.json` puso `brief`/`neon` en `enabled:false`. **Confirmar: ¿se conserva la poda o se restaura?** (revertir vía git show del commit). *2026-09-25*

## C. Roadmap de productos *(absorbido de `ROADMAP_PENDIENTES.md`)*

- [ ] **SuitTTS**: Edge-TTS voz masculina mexicana · múltiples voces · acentos (MX, ES, AR)
- [ ] **SuitMusic**: integración Sunno AI · BPM configurable · estilos (relajante, energético, cinematográfico)
- [ ] **SuitSubtitles**: subtítulos SRT desde audio · sincronización automática
- [ ] **SuitVideoAssembly**: unir imágenes + voz + música + subtítulos · exportar MP4 final
- [ ] **SuitCampanas**: endpoint `/api/video-completo` · botón en UI para crear video desde guion
- [ ] **grupoevasol.com — hosting** *(encontrado 2026-08-18)*: decidir dónde vive (hoy 2 copias: GitHub Pages + LiteSpeed/cPanel manual → cada fix se sube 2 veces) · si LiteSpeed: automatizar subida (FTP/rsync en CI) · si GH Pages: DNS + `CNAME` · detección de tenant por hostname (hoy sin `?co=EVASOL` cae en la demo genérica)
- [ ] **Seguridad Supabase** *(2026-08-18)*: RLS con `qual: true` en UPDATE/DELETE de `Catalogo`, `Proyectos`, `Leads`, `Config_Empresas` etc. — cualquiera con la llave anon puede modificar datos de tenants · rotar token Hugging Face expuesto en `SuitCampanas/.env.test`
- [ ] **Limpieza menor**: `open-design/` como gitlink roto (sin `.gitmodules`) · `.claude/skills/browser-act` symlink roto (`SUITORGSTORE01`) → warning en `git status`

## D. Roadmap general *(absorbido de `roadmap.md`)*

- [x] Auth JWT *(completado 2026-07-21)*

## E. Documentos referenciados (el "cómo" — NO son trackers)

| Qué | Dónde |
|---|---|
| Planes de iniciativas diferidas (FT-*, planes SuitOS) | `.suit/memory/pending/plan-*.md` (9 archivos) |
| Deuda profunda por proyecto | `<Proyecto>/docs/15-riesgos-…md` (estándar `auditoria`) |
| Aprendizajes del ciclo | `<Alcance>/CORRECCIONES.md` |
| Sync/depura esperando visto bueno | `<Alcance>/PLAN-SYNC.md`, `PLAN-DEPURA.md` |
| Decisiones arquitectónicas | `.suit/memory/decisions/` (ADRs) |

## F. Cerrados (historial — no borrar)

- [x] TD-002 · API keys en `SuitCampanas/script.js` → movidas a `/api/config/client` (2026-07-10)
- [x] Instalar skill `auditoria` + routing + MAPA (2026-09-26 → `2d08a58`, `bc2790d`)
- [x] Estandar `docs/` en SuitServiHogar y SuitDashboard + fix `contractFor` (2026-09-26 → `e721f1e`)
- [x] Taxonomías por proyecto creadas (2026-09-26)
- [x] Limpieza SuitServiHogar (ruido borrado, evaluaciones a `docs/`) (2026-09-26)
- [x] Consolidación de pendientes a 4 fuentes (2026-09-26 → este archivo)
