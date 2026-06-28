> **Contexto del proyecto SuitOrg.** Generado a partir de `docs/contexto/`.
> Referencia este archivo al inicio de cada sesión para que el agente conozca la arquitectura, convenciones, decisiones, glosario, flujo de trabajo y errores conocidos.

---

# 1. ARQUITECTURA

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
├── js/modules/           → Frontend SPA: core, router, auth, ui, public, pos, admin, agents, config, events
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
| Documentación formal de endpoints Express (OpenAPI/Swagger) | [PENDIENTE] |

---

# 2. CONVENCIONES

## Naming

| Contexto | Convención | Ejemplos |
|---|---|---|
| Funciones JS/GS | `camelCase` | `getSS`, `handlePostAction`, `setWorkMode` |
| Clases | `PascalCase` | `ImageProcessor`, `ReelGenerator` |
| Constantes | `UPPER_SNAKE_CASE` | `SECRET_TOKEN`, `CONFIG`, `DB_ID` |
| Columnas DB | `snake_case` | `id_empresa`, `fecha_estatus` |
| Tablas DB | `PascalCase_With_Underscores` | `Config_Empresas`, `Proyectos_Bitacora` |
| IDs de negocio | `PREFIX-NNN` | `LEAD-001`, `ORD-123`, `CLI-042` |
| Variables de entorno | `UPPER_SNAKE_CASE` | `GEMINI_API_KEY`, `SUPABASE_URL` |
| Endpoints API | kebab-case | `/api/video-imaginacion`, `/api/db/:table` |
| Archivos JS/GS | kebab-case | `core.js`, `ai_engine.js`, `local-server-node.js` |

## Estilo de Código

- **Funciones**: `function name() {}` en GAS; arrow functions `const name = () => {}` en Node moderno
- **Async**: `async/await` preferido sobre promesas `.then()`
- **Errores**: Patrón `{ status: "success"/"error", message, data }` en todas las respuestas API
- **Logs**: Emoji-prefix (`🤖 [IA_ENGINE]`, `📦 [BACKEND]`) en GAS y Node
- **Versiones**: String `vX.Y.Z` en header de cada módulo
- **Comentarios**: Ninguno (código auto-documentado); solo version headers
- **Módulos GAS**: Objeto literal namespace (`DriveManager = {}`), no clases ES6
- **Módulos Node**: `require` (CommonJS), no `import` ESM (excepto `ssg-engine.mjs`)

## Patrones Usados

- Switch-case de acciones en `handlePostAction` (GAS centraliza por `action`)
- Dual-write: escribe primero a Supabase, replica a GSheets
- Fallback chain: AI multi-modelo → Gemini → OpenRouter → LM Studio local
- Find-or-create: clientes por teléfono, recetas por nombre
- Soft-delete: columna `activo` (TRUE/FALSE), nunca DELETE
- Proxy pattern: Node.js proxifica a GAS para evitar CORS
- Idempotent seed: `ensureSeed()` verifica existencia antes de insertar

## Patrones Prohibidos

- UUIDs aleatorios como IDs de negocio (solo secuenciales `PREFIX-NNN`)
- Borrado físico de registros (usar `activo = FALSE`)
- `mode: 'cors'` en fetch hacia GAS (GAS rechaza preflight OPTIONS)
- Framework frontend (React/Vue/etc.) — mantener vanilla
- Nombres de archivo con espacios o acentos

## Tests

- Solo existe: `CampanasAi/test-system.js` (80 líneas, axios), `test-backend.html`, `test.html`, `test-simple.html`
- No hay framework de testing (ni Jest, ni Mocha, ni Vitest)
- [PENDIENTE: No hay convención definida para escribir tests nuevos]

## Commits

- Prefijo emoji + tipo: `📦 Refactor:`, `🚀 Release:`, `🔒 Security:`, `🎨 UI:`, `✨ Feat/Fix:`
- Formato: `{emoji} {tipo}: {descripción} (v{X.Y.Z})`
- Commits frecuentes, mensajes descriptivos en español
- [PENDIENTE: No hay convención de ramas (git flow, trunk-based, etc.) visible]

---

# 3. DECISIONES TÉCNICAS

## Arquitectura

| Decisión | Por qué | Descartado |
|---|---|---|
| Vanilla JS sin frameworks | Simplicidad, sin dependencias, GH Pages directo | React/Vue (overhead) |
| GAS + Sheets como DB primaria | Cero costo, edición Excel directa, simple | DB tradicional (costo, complejidad) |
| Supabase como migración | PostgreSQL nativo, RLS, tiempo real | Firebase (vendor lock-in) |
| Híbrido GSheets ↔ Supabase | Migración gradual sin downtime | Migración directa (riesgo pérdida datos) |
| Dual backend: GAS + Node | GAS para core lógico (bajo costo), Node para AI/Stripe | Solo GAS (no soporta Stripe), solo Node (costo) |
| IDs secuenciales PREFIX-NNN | Legibles, soporte Sheets, debugging fácil | UUIDs (ilegibles, malos en Sheets) |
| Soft-delete con activo | Auditoría histórica, recuperación | DELETE físico (pérdida irrecuperable) |
| Token estático para GAS | Simple, sin OAuth, funciona con no-cors | JWT/OAuth (complejidad innecesaria) |
| GAS ANYONE_ANONYMOUS | Acceso público sin login (proxy pattern) | Auth Google (requiere login) |

## AI

| Decisión | Por qué | Descartado |
|---|---|---|
| Gemini como AI principal | API key gratuita, integración GAS nativa | OpenAI (costo, sin integración GAS) |
| OpenRouter como fallback | Multi-modelo sin vendor lock-in | Proveedor único (riesgo caída) |
| Multi-model fallback loop | Resiliencia automática | Modelo único (caída = sistema caído) |
| Prompts en DB (parcial) | Editar sin desplegar | Hardcodeados (deuda técnica, migrando) |

## Frontend

| Decisión | Por qué | Descartado |
|---|---|---|
| Hash routing (#orbit) | Funciona sin servidor, ideal GH Pages | History API (requiere servidor) |
| Módulos en js/modules/ | Separación responsabilidades | Monolito (difícil mantener) |
| Toast notifications | Feedback no intrusivo | Alert/confirm (feos, bloqueantes) |

## Infraestructura

| Decisión | Por qué | Descartado |
|---|---|---|
| WSL 2 como entorno dev | Rendimiento Unix, ripgrep/fd | PowerShell/CMD (lento) |
| FFmpeg vía execSync | Sin deps npm, control total | fluent-ffmpeg (dependencia) |
| Base64 para media | Simple, sin servidor archivos | CDN (costo, complejidad) |
| Stripe multi-tenant por env var | STRIPE_SECRET_KEY_{id} aísla pagos | Stripe Connect (más complejo) |

[PENDIENTE: No hay docs de por qué se usa service_role key en vez de RLS + anon key. Deuda técnica.]

---

# 4. GLOSARIO

## Términos del Dominio

| Término | Significado |
|---|---|
| **Tenant / Inquilino** | Negocio dentro del multi-tenant con su propia config, usuarios y datos |
| **Orbit Hub** | Pantalla principal con burbujas de negocios |
| **Burbuja** | Representación visual de un tenant en Orbit Hub |
| **Temperatura de Negocio** | Barra de progreso por fases con peso porcentual |
| **Bóveda Digital / Vault** | Almacenamiento seguro de docs en Google Drive por cliente |
| **Vault Token** | Código `TX-XXXX` de acceso a la Bóveda |
| **Modo DIARIO** | Créditos: descuenta 1 por día calendario |
| **RBAC** | Role-Based Access Control (niveles 0-999) |
| **SSG** | Static Site Generator (`scripts/ssg-engine.mjs`) |
| **Orquestador** | `backend/core.js` que maneja acciones POST/GET del backend GAS |

## Entidades Principales (Tablas)

| Tabla | Propósito |
|---|---|
| `Config_Empresas` | Config general de cada tenant (colores, db_engine, políticas) |
| `Usuarios` | Credenciales, roles, créditos, fechas límite |
| `Config_Roles` | Jerarquías, módulos visibles y permisos |
| `Config_SEO` | Palabras clave y soluciones SEO por empresa |
| `Config_Paginas` | Contenido dinámico JSON (Meta, Schema, Narrativa) |
| `Prompts_IA` | Config de agentes Gemini |
| `Leads` | Prospectos (folios `LEAD-XXX`) |
| `Proyectos` | Órdenes/pedidos (folios `ORD-XXX`) |
| `Catalogo` | Productos/servicios con stock (IDs `PROD-XX`) |
| `Logs` | Eventos del sistema y fallos de IA |
| `Reservaciones` | Citas con Google Calendar (IDs `CIT-XXX`) |
| `Pagos` | Transacciones financieras |
| `SMMC` | Hoja de Sheets donde CampanasAI guarda campañas |

## Siglas Internas

| Sigla | Significado |
|---|---|
| **GAS** | Google Apps Script |
| **GSheets** | Google Sheets |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row Level Security (Supabase) |
| **CSP** | Content Security Policy (Helmet) |
| **SSG** | Static Site Generator |
| **RAG** | Retrieval-Augmented Generation |
| **POS** | Point of Sale |
| **OTS** | Order Tracking System |
| **OTP** | One-Time Password (entrega) |
| **PFM** | Plataforma (tipo de empresa) |
| **PA PER** | Pensión Alimenticia (tenant) |
| **CMARJAV** | Pensión Inteligente (tenant) |
| **EVASOL** | Empresa matriz / engine |
| **SUITORG** | Plataforma (también tenant DIOS) |
| **BDPR** | Base Datos + Print (modo CampanasAI) |
| **SMMC** | Social Media Marketing Campaign |
| **IDX** | Project IDX / Antigravity (IDE) |

[PENDIENTE: No hay definición formal de `tipo_negocio` (Alimentos/Servicios/Financiero).]

---

# 5. FLUJO DE TRABAJO

## Cómo hacer un cambio

```
1. Leer INDEX_FUNCIONES.md → localizar función exacta (archivo:línea)
2. Leer solo el contexto de la función (ahorra tokens)
3. Identificar si el cambio toca: multi-tenant, seguridad, persistencia, GAS o Supabase
4. Clasificar riesgo: bajo / medio / alto
5. Ejecutar cambio
6. Correr validaciones disponibles
7. Regenerar INDEX_FUNCIONES.md si se agregaron/renombraron funciones
8. Commit con formato: {emoji} {tipo}: {descripción} (v{X.Y.Z})
```

## Checklist de "Terminado"

- [ ] El cambio respeta las reglas de AGENTS.md (especialmente multi-tenant isolation)
- [ ] No hay secrets expuestos en código
- [ ] `id_empresa` está filtrado en toda nueva query
- [ ] No se usa borrado físico (solo `activo = FALSE`)
- [ ] IDs secuenciales, no UUIDs
- [ ] Si es POST a GAS: incluye token de seguridad
- [ ] INDEX_FUNCIONES.md actualizado (`node scripts/generate-index.js`)
- [ ] Smoke check manual: flujo feliz y caso error
- [ ] [PENDIENTE: No hay tests automatizados que correr]
- [ ] [PENDIENTE: No hay lint/typecheck que ejecutar]

## Deploy

- **GAS**: `clasp push` → `clasp deploy`
- **Frontend GH Pages**: push a `main` → GitHub Actions deploy automático
- **Node server**: `npm start` o `node server.js` (3001), `node CampanasAi/local-server-node.js` (8000), `node citas/index.js` (3002)
- **WSL backup**: `zip -r "SUIT_${DATE}_WSL.zip" . -x "*/node_modules/*" "*/.git/*" "*.zip" "*/.agent/*"`

## Entornos

| Entorno | Propósito | Ubicación |
|---|---|---|
| Desarrollo local | WSL 2 | `C:\Users\rojo-\Downloads\SUITORGSTORE01` |
| Producción GAS | Script runtime | `script.google.com` (ID: `1pSFYiYl_blIOzZ_kBSYDB...`) |
| Producción Frontend | GitHub Pages | `suitorgstore01.github.io` (asumido) |

[PENDIENTE: No hay staging/pre-producción. No hay proceso de rollback documentado.]

---

# 6. ERRORES CONOCIDOS

## Seguridad

| Error | Dónde | Impacto |
|---|---|---|
| API key hardcodeada en `setupOpenRouterKey()` | `backend/core.js:13` | Exposición credenciales |
| API keys hardcodeadas en `CONFIG` | `CampanasAi/script.js:8-11` | Visible en devtools |
| Supabase anon key hardcodeada | `scripts/agents/vision-audit.js:14` | Exposición en script |
| `service_role` key en vez de RLS | `CampanasAi/lib/supabase.js`, `citas/db/client.js` | Bypass RLS |
| CORS `*` en local-server | `CampanasAi/local-server-node.js` | Cualquier origen llama la API |
| `execSync` con `shell: true` | `local-server-node.js` (FFmpeg) | Shell injection si input de usuario llega a rutas |

## Datos y Consistencia

| Error | Dónde | Comportamiento |
|---|---|---|
| `activo` de Supabase llega como `"true"` minúsculas | Frontend (varios) | Normalizar con `String(p.activo).toUpperCase().trim() === "TRUE"` |
| `syncToSupabase` catch vacío | `backend/utils.js` | Errores de sync no se reportan |
| `process.exit(1)` en librería | `CampanasAi/lib/supabase.js` | Crash si falta `.env` |
| Cache trends compartido | `CampanasAi/cache_trends.json` | Un usuario ve trends de otro |
| FFmpeg temp files no limpiados | `local-server-node.js` | Se acumulan `/tmp_slideshow_*/` |
| Base64 para video largo | `local-server-node.js` | Payload enorme, posible memory limit |

## Código

| Error | Dónde | Detalle |
|---|---|---|
| `generar()` typo (debería ser `generarTitulo`) | `CampanasAi/generators/reel-generator.js:103` | Stack overflow si se invoca |
| `normalizeDriveUrl` duplicada | `script.js` y `local-server-node.js` | Código repetido |
| GAS URL hardcodeada múltiples archivos | `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js` | Cada deploy GAS requiere actualizar N URLs |
| Dos proyectos Supabase distintos | Backend: `egyxgnlnzanxpqyuvmsg`, vision-audit: `hmrpotibipxhsnowgjvq` | Datos inconsistentes |
| `no-cors` en fetch GAS | Frontend | Respuesta opaca |
| `start is not defined` | `js/modules/core.js` | Declarar `const start = Date.now()` antes |
| Campos GSheets mayúsculas/espacios | Varios | Usar `getField()` |
| `anyOf` como filtro WHERE | `js/modules/core.js` | No escala con miles registros |
| `confirmPayment` no confirma | `conecionpagos/index.js` | Solo hace retrieve |

## Gemini / AI

| Error | Dónde | Detalle |
|---|---|---|
| Modelo `gemini-1.5-flash` deprecated | `backend/ai_engine.js` | Migrar a OpenRouter free |
| Fallback LM Studio localhost:1234 | `ai_engine.js`, `local-server-node.js` | Solo en máquina dev |
| Prompt hardcodeado script.js:760 | `CampanasAi/script.js` | No configurable desde DB |
| Sin rate limiting en AI | `server.js`, `local-server-node.js` | Abuso/costo inesperado |

[PENDIENTE: No hay issues de GitHub ni registro formal de bugs fuera de Documentacion/05-debug-referencia.md y soluciones_documentadas.md.]
