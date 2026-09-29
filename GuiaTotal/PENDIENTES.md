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

- [ ] **Higiene de Config_Paginas (hoja)**: 13 huérfanas (pág sin clúster) · 4 dups (`PAPER/home` ×2) · 1 JSON roto · 24 filas `bloques[]` sin renderizar · `id_pagina` con espacios/mayúsculas. *Lado espejo ya saneado 2026-09-28: 4 filas vacías borradas + PK `(id_empresa,id_pagina)`.* Pendiente de instrucción de limpieza de la hoja. *2026-09-28*
- [ ] **Migración futura (opcional)**: ruta `/servicios/{id_pagina}` (hoy no existe; real = hash `#{id}`) y soporte de `bloques[]` en el renderer — solo si el usuario lo pide como proyecto. *2026-09-28*
- [ ] **`updateRowExt` en GAS**: acción de match compuesto (id_empresa+id_pagina) para el modo "actualiza" de paginas-seo — hoy no existe y `updateRow` simple cruzaría empresas (`home` ×4). *2026-09-28*
- [ ] **Config_SEO — columnas extra**: decisión 2026-09-28 = escribir solo las10 del prompt; evaluar `description`/`slug`/`og_image` **después de ver resultados** de la primera generación (ssg-engine hoy cae a fallback, cero impacto). *2026-09-28*
- [ ] **Sync catch-up de 11 empresas**: el espejo tiene 12 empresas, la hoja 23 — `syncToSupabase` es **por empresa** (filtra `id_empresa` + GLOBAL). Falta correr el loop por cada id faltante para poner el espejo al día. *2026-09-28*
- [ ] **empresa-registro — fase 2**: BRIEF (`brief-engine`) + Activos (`lapvtfu`) para HMP cuando el usuario dé instrucciones. *2026-09-28*
- [ ] **HMP — listing Google Business**: 0 huella web; canal real = WhatsApp. *2026-09-27 · de Analista_Proy*
- [ ] **SuitServiHogar — drift SQL**: definir fuente canónica (`supabase/migrations/` recomendado) y copiar las 3 migraciones que solo existen en `migrations/` (`price_negotiation`, `antifuga_config`, `decisions_config`). *2026-09-26 · decisión de esquema, requiere visto bueno*
- [ ] **SuitServiHogar — docs de auditoría faltantes**: `09-reglas`, `11-integraciones`, `13-despliegue`, `15-riesgos` (evidencia ≥84%, pendiente aprobación). *2026-09-26*
- [ ] **SuitServiHogar — `AGENTS.md` desactualizado**: dice `screens/ (7)`, hay 13. *2026-09-26*
- [ ] **SuitDashboard — instancias faltantes**: 4 manuales, identidad, prompt origen, checklist, `docs/05+06` (tarjeta `documentos: false`). *2026-09-26*
- [ ] **Integración profunda `auditoria` ↔ `guia-total`** (hoy solo gancho en MAPA §4/§9). *2026-09-26*
- [ ] **Skills externas**: guion `MAPA.md §10` vacío — rellenar al primer pedido de instalación. *2026-09-26*
- [ ] **Push a GitHub**: rama `evasol-supabase-migration` ahead 45 — pendiente de decisión. *2026-09-26*
- [ ] **SuitPoke — publicar con HTTPS + gate de medición (panel-juzgador)**: hostear (itch.io/Poki u otro) y medir con 100-300 jugadores: ≥2 partidas, % rematch, D1 ≥25%, onboarding <60 s. Si falla → pivotar antes de fases 2 (condición 6 del veredicto APROBADO CONDICIONAL). *2026-09-29*
- [ ] **SuitPoke — prueba en dispositivo móvil físico**: instalación PWA real pendiente (requiere HTTPS; en localhost el SW/manifest ya verificados). *2026-09-29*
- [ ] **SuitPoke — identidad corporativa**: `IDENTIDAD_CORPORATIVA.md` no creada (etapa identidad no solicitada; requiere `Analista_Proy.md` que ya existe). *2026-09-29*

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
- [x] **TD-004 parcial**: `syncToSupabase` ahora diagnostica (key ausente/HTTP≠2xx) en vez de tragarse errores (2026-09-28 → backend/utils.js + core.js)
- [x] **Sync GAS reparado end-to-end**: `SUPABASE_KEY` fijada por el usuario + PK `(id_empresa)` + 15 columnas faltantes agregadas + filtro de headers vacíos + minúsculas/@24 — HMP sincronizado 2 veces sin duplicados (2026-09-28)
- [x] **Registro SuitOS canónico**: las4 skills (`guia-total`, `auditoria`, `empresa-registro`, `clusters-seo`) en `.suit/registry/skills.yaml` con definiciones en `.suit/skills/` (2026-09-28)
- [x] **Piloto cadena HMP COMPLETO** (2026-09-28): `empresa-registro` (5/5 gates aprobados) → `clusters-seo` (5 filas `Config_SEO` +5 fotos Drive) → `paginas-seo` (5 páginas, validación5/0/0, `Config_Paginas` hoja+espejo). PKs creados: `Config_SEO(id_empresa,id_cluster)` y `Config_Paginas(id_empresa,id_pagina)`; espejo saneado (dedupe +4 vacías)
- [x] **Instalada skill `clusters-seo`** + hooks de `empresa-registro` (alta/modificación) + GAS `appendRows`/`subirImagenCte` @25 (2026-09-28)
- [x] **Skill `empresa-mascara` + léxico-usuario + MAPA nivel 4** (2026-09-29): plantilla `GuiaTotal/plantillas/MASCARA_CONFIG_EMPRESAS.yaml` + ejemplo `registro/hmp/MASCARA.yaml` (solo campos obligatorios A + switches C auto|preguntar|skip + toggles D), routing p26, MAPA §1.8 + **§11 fichas operativas** (nivel 4, refs file:line) + **`MAPA_VISUAL.html`** (diagrama de flujo HTML autocontenido — burbujas con iconos/colores, globos de gate, líneas sólidas curvas + punteadas animadas, chips §X; sync MAPA↔HTML por `data-sec` + check `node scripts/check-map-visual.js`: cobertura 15/15 §, conexiones 29/29 OK), barra de avance por paso, AGENTS pre-flight #4 → léxico automático (`.suit/memory/patterns/lexico-usuario.md`). YAML 8/8 OK · inventario TOTAL 177 · dry-run HMP: 0 cambios A+D, 4 pendientes a preguntar.
- [x] **MAPA_VISUAL v3 + drawer de pasos internos** (2026-09-29): capa de decisión AGENTS.md (1 jerarquía→2 pre-flight/léxico→3 routing→4 loader), formas de flowchart (◇ rombo decisión, ▬ pastilla inicio/fin), badges de acción 📁✍️🔄⚡❓∥ en23 burbujas, **click en burbuja § → drawer lateral con pasos internos + acciones GAS (file:line) + skills + archivos** (16/16 secciones con INFO, verificado en DOM: click §1.8/§1.6 → abre, Esc cierra) · check ampliado: cobertura **16/16 §, drawer16/16, conexiones34/34 OK**.
- [x] **Brief HMP escrito y verificado** (2026-09-29): `brief-engine` armó vector de 21 segmentos en `Config_Empresas.logo_url` (2331 chars, validado: 21/21, sin pipes, sin vacíos silentes) con **be-010**: seg1 `Alimentos y Hospitalidad [A]` · seg2 `Restaurantes y Comida Rápida [A]` · seg3 `Comida Rápida [A]` (Analista_Proy id7 + catálogo) — research B: audiencia/dolor/objeciones/competidores MTY (Rappi/UberEats) y RLP (NOM-051 + COFEPRIS) con URLs en `registro/hmp/confianza.json`. Escritura verificada por re-GET + espejo Supabase `len=2331` ✓ · switch C `brief: skip` · artefactos `registro/hmp/{brief,confianza}.json`.
- [x] ~~**Brief HMP — Drive `_brief`**~~ **deferido por estándar** (2026-09-29): `ensureCteFolders` ya no crea `_brief/` ("sin mover por ahora"); artefactos viven en `GuiaTotal/registro/hmp/{brief,confianza}.json`. Reabrir solo si se decide migrar estructuras viejas.
- [x] **Ciclo: estándar activos LAPVTFU en `cte<id>/`** (2026-09-29, ciclo F1→F5): **archivos planos en raíz** `logo01·avatar01·fotoprs01·videos01·testimonios01·fotos01·contenido01.<ext>` (V·T·F multi `02+`, separador `;`, share ANYONE) · `ensureCteFolders` deja de crear `_brief/historial/_activos` (legacy = solo lectura, sin migrar) · lectura dual en `ensureLogo/Avatar/getBriefAssets` · `generateAsset` V·T·F→raíz con auto-increment · **acciones nuevas** `shareCteFile` (compartir lo que sube el usuario) + `setLapvtfuSlot` (slots3-7, escritor único) · SUBCONTRATO-ACTIVOS **v1.1** + skill lapvtfu **v1.1** · deploy **@26→@27** (misma URL) · validación **9/9 PASS** (smoke7/7) · **bug encontrado+fix en caliente**: `_setLapvtfuSlot_` acumulaba1 espacio/escritura → idempotencia rota → trim @27 · evidencia `VALIDACION.md` + `CORRECCIONES.md` (3 aprendizajes) + `PLAN-SYNC.md` (slot6 HMP aprobado).
- [x] ~~Pendientes del estándar~~ **resueltos** (2026-09-29): **espejo** — `syncToSupabase HMP` ejecutado y verificado (`logo_url len=2387`, slot6 ✓) · **migración legacy** — `migrarActivosCte all` ejecutado @28: 3 renombres (`TOPLUXF` avatar01/fotoprs01, `-Suit.Org` avatar01) + 23 `_activos` trashed, 0 errores, IDs/URLs de slots intactos (VALIDACION 6/6). Queda: `_brief/` legacy conservado a propósito ("sin mover") · sidebar GAS verificación manual.
- [x] **UI local de la máscara `mascara.html`** (2026-09-29): sitio web servido por server.js — `http://localhost:3001/mascara.html` (bind 0.0.0.0 → celular: `http://192.168.86.71:3001/mascara.html`). Form A (obligatorios) · B (generados, solo lectura) · C (switches leídos del YAML de la empresa) · D (toggles) · **Guardar** = updateRow/appendRows · **Sync espejo** · **Copiar orden de cadena** (arma `máscara <ID> — switches: …` para pegar en el chat). Fix: `f_id_empresa`→`f_id` en el llenado de A. Verificado en DOM: HMP carga A/B/C/D completos.
- [x] **Manual de operación SuitOrg + regla taxonomía→brief** (2026-09-29): **`GuiaTotal/MANUAL_OPERACION.md`** (11 secciones, solo Config_Empresas — datos/ciclo de vida/3 vías de edición/57 campos por bloques con nota `tipo_negocio="giro,flag"` → parte1 = taxonomía/Taxonomía y Brief/cadena switches/modificación clave-no clave/RBAC/quirks/checklist alta). Integración Guía Total: MAPA **§1.9** + nota §5 + **check de mantenimiento en §6** (brief seg1/seg2 vacíos→rellenar, valor real→jamás) · `MAPA_VISUAL` burbuja §1.9 (**check 16/16 §, 34/34 conexiones OK**) · **brief-engine be-010** + paso7 · modo `operacion` + flujo mantenimiento en guia-total (5 modos) + routing (+6 patterns p22). **Dry-run be-010** (`temp/dryrun-brief-tax.js`, 0 escrituras): HMP rellena `industria=Alimentos y Hospitalidad` / `nicho=Restaurantes y Comida Rápida` desde Analista_Proy ✓ · NOET/TOÑOTOQUES valor real → preservado ✓ · TOPLUXF rellena solo seg2 (match exacto "Seguros"=nicho) ✓ · PRPT sin match → PENDIENTE con motivo ✓. YAML 7/7 OK.
- [x] **Dedupe del espejo**: 4 filas parciales (nomempresa=null) respaldadas en `temp/backup-config-empresas-dupes-20260928.json`, rrss fusionado, filas eliminadas — 12/12 empresas únicas (2026-09-28)
- [x] **Piloto empresa-registro HMP**: estructura `cteHMP/` + `fotoagente.jpg` + slogan/mensajes/identidad + 10 campos en GS + espejo Supabase verificado (2026-09-28)
- [x] Instalar skill `auditoria` + routing + MAPA (2026-09-26 → `2d08a58`, `bc2790d`)
- [x] Estandar `docs/` en SuitServiHogar y SuitDashboard + fix `contractFor` (2026-09-26 → `e721f1e`)
- [x] Taxonomías por proyecto creadas (2026-09-26)
- [x] Limpieza SuitServiHogar (ruido borrado, evaluaciones a `docs/`) (2026-09-26)
- [x] Consolidación de pendientes a 4 fuentes (2026-09-26 → este archivo)
