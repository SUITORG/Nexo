# CONTRATO — SuitOrg (Raíz)
Versión: 0.0.1 (borrador)

## Propósito
Monorepo de SuitOrg: sistema de orquestación de agentes (SuitOS) + motor SSG multi-tenant que genera y despliega el sitio estático de `grupoevasol.com` vía GitHub Pages. Incluye backend dual (GAS + Node.js), frontend vanilla JS SPA, y múltiples módulos independientes (CampanasAi, SuitReservaciones, SuitCotizador, ViRe, SuitServiHogar, etc.).

## Stack
- **Frontend**: Vanilla JS SPA, hash routing, sin frameworks
- **Backend**: Google Apps Script (CRUD en Google Sheets) + Node.js/Express (proxy a Supabase, Gemini, Stripe)
- **DB**: Hybrid — 5 tablas MAESTRAS siempre en Sheets; tablas PRIVADAS migran a Supabase por tenant via `db_engine`
- **Deploy**: clasp (GAS) + GitHub Actions → GitHub Pages
- **Multi-tenant**: `id_empresa` en toda query, RBAC por niveles

## Skills del proyecto
| Skill | Tipo | Dominio |
|---|---|---|
| `multi-tenant` | domain | security |
| `contrato-subproyecto` | domain | governance |
| `brief-engine` | domain | marketing |
| `design-system` | domain | design |
| `data-sync` | domain | data |
| `data-cleanup` | domain | data |
| `iteration-loop` | process | quality |
| `web-research` | tool | knowledge |
| `javascript` | language | code |
| `gas` | language | code |
| `sql` | language | code |

## Requerimientos Frontend (orden de importancia)

| # | Requerimiento | Severidad | Fuente |
|---|---|---|---|
| F1 | **Vanilla JS only** — Sin frameworks (React, Vue, Angular). Cero dependencias frontend. | error | `AGENTS.md` rule #7 |
| F2 | **Hash routing** — Navegación por `#orbit`, `#pos`, `#home`, `#leads`, `#catalog`, `#agents`. Sin router externo. | error | `AGENTS.md` |
| F3 | **Multi-visual por empresa** — Campos `usa_` en `Config_Empresas` controlan qué módulos UI están habilitados. | error | `contexto.md` |
| F4 | **Responsive / mobile-first** — CSS media queries, flexbox/grid, touch targets accesibles. | warning | `design-system` skill |
| F5 | **Formularios de leads** — Captura, validación, envío a GAS con `API_AUTH_TOKEN`. | error | `SuitCampanas/` |
| F6 | **Landing pages dinámicas** — KitPlantillaDinamica con presets de paletas, tipografías y templates. | warning | `scripts/parse-theme.js` |
| F7 | **color_tema pipe-delimited** — Formato `#hex\|candado:0\|pal:pal-teal\|tp:tp-01\|tpl:lp-local-service`. Nunca hex solo. | error | `design-system` skill |
| F8 | **Watchdog sync loop** — 7.5s interval en `app.js` para mantener sesión activa. | warning | `AGENTS.md` |

## Requerimientos Backend (orden de importancia)

| # | Requerimiento | Severidad | Fuente |
|---|---|---|---|
| B1 | **Hybrid DB: GAS + Supabase** — 5 tablas maestras en Sheets (`Config_Empresas`, `Usuarios`, `Config_Roles`, `Config_SEO`, `Prompts_IA`); tablas privadas en Supabase por tenant. | error | `AGENTS.md` |
| B2 | **Dual backend** — GAS hace CRUD en Sheets; Node.js proxy a Supabase, Gemini, Stripe. | error | `AGENTS.md` |
| B3 | **Multi-tenant: `id_empresa`** — Toda query filtra por `id_empresa`. Sin acceso cross-tenant. | error | `AGENTS.md` rule #1 |
| B4 | **Soft delete** — `activo = FALSE`, nunca DELETE físico. | error | `AGENTS.md` rule #2 |
| B5 | **Sequential IDs** — `LEAD-XXX`, `ORD-XXX`, `PROD-XX`, `CLI-XXX`. Sin UUIDs. | error | `AGENTS.md` rule #3 |
| B6 | **Token `API_AUTH_TOKEN`** — Requerido en todo POST a GAS. | error | `AGENTS.md` rule #4 |
| B7 | **`no-cors` para GAS** — GAS rechaza OPTIONS preflight. Usar `no-cors` mode. | error | `AGENTS.md` rule #5 |
| B8 | **Normalize `activo` lowercase** — Supabase retorna `"true"` (lowercase). Normalizar con `.toUpperCase().trim() === "TRUE"`. | error | `AGENTS.md` rule #6 |
| B9 | **4 servidores independientes** — `server.js` (3001), `local-server-node.js` (8000), `citas/index.js` (3002), `SuitVidGenRemotion/` (3004). | warning | `AGENTS.md` |
| B10 | **CI/CD** — clasp para GAS, GitHub Actions (push a `main` → GH Pages). | warning | `AGENTS.md` |

## Requerimientos Seguridad (orden de importancia)

| # | Requerimiento | Severidad | Fuente |
|---|---|---|---|
| S1 | **RBAC levels** — DIOS(999), ADMIN(10), STAFF(5), DELIVERY(-). Verificar en cada endpoint. | error | `AGENTS.md` |
| S2 | **No cross-tenant** — Nunca acceder datos de otra empresa. `id_empresa` en toda query. | error | `multi-tenant` skill |
| S3 | **`service_role` key en cliente** — `SuitCampanas/lib/supabase.js`, `citas/db/client.js` bypass RLS. Tratar como alto riesgo. | error | `AGENTS.md` gotcha |
| S4 | **No hardcodear API keys** — Usar `.env`. Keys conocidas: `backend/core.js:13`, `script.js:8-11`. | error | `AGENTS.md` gotcha |
| S5 | **Webhook Stripe antes de `express.json()`** — En `server.js` línea 13. Si va después, falla. | error | `AGENTS.md` gotcha |
| S6 | **`no-cors` opaque response** — Fetch a GAS con `no-cors` retorna opaque response. No se puede leer body en client side. | warning | `AGENTS.md` gotcha |
| S7 | **`syncToSupabase` empty catch** — `backend/utils.js` silencia errores de sync. Riesgo de datos desincronizados. | warning | `AGENTS.md` gotcha |
| S8 | **GAS URL hardcoded** — En `local-server-node.js`, `ssg-engine.mjs`, `orchestrator_client.js`. Actualizar en cada redeploy de GAS. | warning | `AGENTS.md` gotcha |

## Invariantes
1. Todo query filtra por `id_empresa` — sin excepciones
2. Soft delete solamente — `activo = FALSE`, nunca DELETE
3. IDs secuenciales — sin UUIDs
4. Sin frameworks frontend — vanilla JS puro
5. Sin hardcodear secrets — usar `.env`
6. Un solo sitio indexable: `grupoevasol.com` — el resto son demos `noindex, nofollow`

## Límites
- No sincronizar datos entre empresas
- No crear tablas nuevas sin documentar en CONTRATO.md
- No cambiar el formato de `color_tema` sin actualización de `design-system` skill
- No agregar dependencias npm sin aprobación explícita
- No modificar `.github/workflows/` vía git push (usar UI web de GitHub)

## Definición de terminado
- [ ] `CONTRATO.md` existe en la raíz
- [ ] Todos los invariantes verificados en VALIDACION.md
- [ ] Skills del proyecto documentadas
- [ ] Requerimientos Frontend/Backend/Seguridad clasificados
- [ ] Commit con formato `ciclo(f0/contrato)[SuitOrg]: Contrato raíz creado`
