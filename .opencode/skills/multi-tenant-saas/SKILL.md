---
name: multi-tenant-saas
description: "Use when developing or maintaining the SuitOrg multi-tenant SaaS project. Covers full architecture (HTML/CSS/JS SPA, GAS backend + Supabase, Express server), multi-tenant isolation, RBAC, responsive UI, data flow, security, and sub-projects (CampanasAi, citas, Stripe). Refer to AGENTS.md for immutable rules."
---

# Multi-Tenant SaaS Development Guide — SuitOrg

Basado en el ecosistema digital multi-inquilino **SuitOrg** (v16.7.28 frontend, v15.9.9 backend GAS).

> **IMPORTANTE**: Este proyecto tiene un `AGENTS.md` en la raíz con 50 reglas inmutables. Siempre leer AGENTS.md primero; esta skill lo complementa pero no lo reemplaza.

---

## 1. Arquitectura General

- **Frontend**: HTML/CSS/JS puro (SPA, vanilla JS). Sin frameworks. v16.7.28
- **Backend primario**: Google Apps Script (GAS) modular en `backend/`. v15.9.9. Desplegado via `clasp`
- **Backend secundario**: Node.js + Express (puerto 3001) con Helmet CSP
- **Base de datos**: Híbrida — Google Sheets (primaria, ID: `1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8`) + Supabase/PostgreSQL (en migración)
- **Motor de IA**: Gemini API (`gemini-1.5-flash`) via Node.js proxy + OpenRouter como fallback multi-modelo
- **Pagos**: Stripe (módulo `conecionpagos/`)
- **CI/CD**: `clasp` para GAS, GitHub Actions
- **Versión**: Backend GAS v15.9.9, Frontend v16.7.28

### Archivos clave del proyecto

```
├── AGENTS.md                    # 50 reglas inmutables (LEER SIEMPRE)
├── INDEX_FUNCIONES.md           # Índice función → archivo:línea (auto-generado)
├── reglas-negocio.md            # Reglas de negocio
├── backend_schema.md            # Esquema del backend GAS
├── tech_manual.md               # Manual técnico completo
├── roadmap.md                   # Roadmap del proyecto
├── server.js                    # Servidor Express (puerto 3001)
├── app.js                       # Orquestador frontend
├── index.html                   # SPA principal
├── style.css / RESPONSIVE-UI.css
├── backend/                     # Google Apps Script
│   ├── core.js                  # Orquestador maestro (doGet/doPost)
│   ├── database.js              # Inicialización DB, auto-purga
│   ├── utils.js                 # CRUD helpers (getSheetData, appendRowMapped, etc.)
│   ├── ai_engine.js             # Motor Gemini + NotebookLM
│   └── DriveManager.js          # Gestión Google Drive por tenant
├── js/modules/
│   ├── core.js                  # Estado global `app`, carga de datos, switchCompany
│   ├── router.js                # Enrutador hash-based
│   ├── auth.js                  # Autenticación y RBAC
│   ├── ui.js                    # Renderizado, temas, consola, módulos delegados
│   ├── public.js                # Orbit Hub, Landing, Galería, SEO, Contacto
│   ├── pos.js                   # Punto de venta
│   ├── admin.js                 # Dashboard, reportes, leads, proyectos, catálogo
│   ├── agents.js                # Agentes IA, chat, diagnóstico
│   ├── events.js                # Binding de eventos globales
│   └── config.js                # Config local (NO compartir)
├── citas/                       # Módulo de citas (Express sub-app)
│   ├── index.js                 # Router: WhatsApp webhook + API
│   ├── handlers/                # Manejadores de webhook
│   └── services/                # WhatsApp, AI, Supabase
├── conecionpagos/               # Stripe payments
│   └── index.js                 # PaymentIntents, webhooks
├── CampanasAi/                  # Sub-proyecto CMS (puerto 8000)
│   ├── index.html / script.js / style.css
│   ├── backend.gs               # Backend GAS propio
│   ├── local-server-node.js     # Servidor local (puerto 8000)
│   ├── generators/              # Generadores de contenido
│   └── config/                  # Prompts, formatos, industrias
├── scripts/
│   ├── generate-index.js        # Genera INDEX_FUNCIONES.md
│   ├── orchestrator_client.js   # Orquestador de llamadas GAS
│   └── ssg-engine.mjs           # Motor SSG
├── .opencode/skills/multi-tenant-saas/SKILL.md  # Esta skill
├── .claude/                     # Configuración Claude
├── Documentacion/               # Documentación técnica
└── knowledge/                   # Conocimiento de negocio
```

---

## 2. Multi-Tenant — Motor Híbrido por Inquilino

### Identidad del inquilino
- Cada negocio tiene un `id_empresa` único (ej: `"PFM"`, `"CMARJAV"`, `"TOPLUX"`, `"PAPER"`)
- Registro maestro en `Config_Empresas`
- El usuario selecciona empresa desde Orbit Hub (`#orbit`) vía `app.switchCompany(id_empresa)`

### Reglas inmutables de aislamiento
1. **Toda query filtra por `id_empresa`** — ningún negocio ve datos de otro
2. **Tablas globales** (`Config_Empresas`, `Config_Roles`, `Config_SEO`, `Config_Paginas`, `Prompts_IA`, `Usuarios`): solo lectura para inquilinos, solo escribe DIOS
3. **Tablas privadas** (`Leads`, `Proyectos`, `Catalogo`, `Reservaciones`, `Pagos`, `Logs`): filtradas estrictamente por `id_empresa`
4. **No borrado físico**: columna `activo` (TRUE/FALSE)
5. **IDs secuenciales por empresa**: `LEAD-XXX`, `ORD-XXX`, `PROD-XX` (no UUIDs)

### Motor híbrido por tenant
Cada tenant puede tener configurado `db_engine` en `Config_Empresas`:
- **`GSHEETS`** (default) — lee/escribe en Google Sheets via GAS
- **`SUPABASE`** — lee/escribe en Supabase PostgreSQL via `/api/db/*`
- El sistema detecta automáticamente: `app.state.dbEngine`
- Las tablas maestras siempre están en Google Sheets; Supabase tiene copias de solo lectura

### Estados del ciclo de vida del inquilino
- `habilitado` (TRUE/FALSE) en `Config_Empresas` controla si el negocio opera
- Landing público **siempre visible** aunque la cuota haya expirado
- `Cuotas_Pagos` son administrativas; no bloquean el front-end

---

## 3. RBAC (Roles y Permisos)

| Rol       | Nivel | Alcance |
|-----------|-------|---------|
| DIOS      | 999   | Control total, visión consolidada multi-tenant |
| ADMIN     | 10    | Gestión total de su empresa, catálogo, reportes |
| STAFF     | 5     | POS, monitor de pedidos, atención al cliente |
| DELIVERY  | -     | Solo entregas. OTP difuminado (debe pedirlo al cliente) |

- `app.state.userLevel` controla visibilidad de UI
- Inactividad: visitantes → 5min (reset a Orbit). Staff con crédito DIARIO/GLOBAL → 8h, otros → 120s
- OTP: visible para ADMIN/STAFF en todas las etapas; DELIVERY lo ve con blur
- Módulos visibles controlados por `modulos_visibles` en roles/usuarios

---

## 4. Catálogo de Tablas

### Globales (solo lectura para inquilinos)
`Config_Empresas`, `Config_Roles`, `Config_SEO`, `Config_Paginas`, `Prompts_IA`, `Usuarios`

### Privadas (filtradas por `id_empresa`)
`Leads`, `Proyectos`, `Catalogo`, `Reservaciones`, `Pagos`, `Logs`

### Seguridad
- Backend GAS: `doGet?action=getAll&id_empresa=X` — tablas privadas filtradas server-side
- Supabase RLS: políticas por `id_empresa` via `current_setting('app.settings.id_empresa')`
- Node.js proxy: `/api/db/*` usa `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS), solo llamadas internas
- Token `API_AUTH_TOKEN=PROTON-77-X` requerido en POST a GAS

---

## 5. Módulos del Producto SaaS

### Todos los módulos (hash-based)

| Hash            | Módulo             | Descripción |
|-----------------|--------------------|-------------|
| `#orbit`        | Orbit Hub          | Selector de empresas (burbujas) |
| `#home`         | Landing público    | Hero, SEO, galería, story, onboarding |
| `#pos`          | POS                | Punto de venta con monitor |
| `#express`      | Pedido Express     | Menú público, carrito flotante, checkout 3 pasos |
| `#catalog`      | Catálogo           | CRUD productos/servicios, stock |
| `#leads`        | Leads CRM          | Captación, seguimiento, auto-asignación |
| `#projects`     | Proyectos          | Órdenes por etapas, pagos |
| `#reservations` | Citas              | Calendario, Google Calendar, WhatsApp |
| `#reports`      | Reportes           | Dashboard Chart.js, KPIs |
| `#admin`        | Admin              | Configuración empresa |
| `#vault`        | Bóveda             | Documentos seguros en Google Drive |
| `#agents`       | Agentes IA         | Chat, diagnóstico, writer, analyst |
| `#contact`      | Contacto           | Formulario público, captura de leads |
| `#dashboard`    | Dashboard          | Reportes y análisis |

### POS
- Monitor en tiempo real: **Nuevos → Cocina → Listo → Entregado**
- OTP por orden. Delivery lo ve con blur
- Carrito flotante food-tech con contador y total
- Checkout 3 pasos con método de pago y envío
- Staff POS, monitor, delivery view

### Landing multi-inquilino
- Hero con slogan dinámico por empresa
- SEO con soluciones desde `Config_SEO`
- Galería con slider horizontal
- Historia/narrativa dinámica (imagen + texto + CTAs)
- Onboarding (formulario para lanzar sitio rápido)
- Modo "Comida": menú, categorías, carrito; oculta secciones estándar

---

## 6. Endpoints del Servidor Express (server.js, puerto 3001)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/config` | GET | Expone `SUPABASE_URL` + `SUPABASE_ANON_KEY` |
| `/api/db/:table` | GET/POST | CRUD proxy a Supabase |
| `/api/ai/generate` | POST | Proxy Gemini |
| `/api/ai/chat` | POST | Chat Gemini |
| `/api/storage/upload` | POST | Subida a Supabase Storage |
| `/api/storage/list/:bucket` | GET | Listar archivos |
| `/api/sheets/prompts` | GET | Proxy Google Sheets (CORS) |
| `/api/stripe/*` | POST | Stripe PaymentIntents |
| `/api/webhook/citas` | POST | Webhook WhatsApp citas |
| `/api/local/save` | POST | Guardado local |

### Endpoints GAS
- `doGet(e)`: `?action=getAll&id_empresa=X` — lectura completa (globales + privadas)
- `doPost(e)`: payload `{action, data, id_empresa}` — escritura atómica con LockService

---

## 7. Watchdog y ciclo de sincronización

El sistema tiene un watchdog que asegura actividad del usuario:

```
app.monitor.start()
  └── Ciclo cada 2.5s
       └── Sync cada 7.5s (3 ciclos)
       └── Reset por inactividad:
            ├── Visitante: 5min → Orbit
            ├── Staff con crédito DIARIO/GLOBAL: 8h
            └── Otros: 120s
```

- Auto-refresca datos del POS periódicamente
- `app.ui.updateConsole()` para mensajes del sistema

---

## 8. Patrones de Código Clave

### Estado global
```js
app.state.companyId   // id_empresa activo
app.state.currentUser // usuario logueado
app.state.userLevel   // nivel RBAC
app.state.dbEngine    // "GSHEETS" | "SUPABASE"
```

### Navegación
```js
app.router.navigate('#seccion')
// hashchange event → app.router.init()
```

### Carga de datos
```js
app.loadData() → GAS (doGet) o Supabase (/api/db/) según dbEngine
```

### IDs secuenciales
`LEAD-{n}`, `ORD-{n}`, `PROD-{n}` — auto-incrementales por empresa

### Soft delete
Columna `activo: TRUE|FALSE` en todas las tablas

---

## 9. Seguridad

- **Helmet** con CSP estricta (script-src, connect-src, img-src con dominios autorizados)
- **Token `API_AUTH_TOKEN`** en todo POST a GAS
- **Service Role Key** en `/api/db/*` (bypass RLS, solo interno)
- **`.env`** con secrets: `API_AUTH_TOKEN`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`
- **`config.js`** no se comparte (API keys frontend)
- **Google Service Account** para llamadas GAS via `googleapis`

---

## 10. Sub-proyectos

### CampanasAi (CMS de campañas, puerto 8000)
- 4 modos: **Ai** (IA genera), **BD** (base datos + IA), **BDPR** (base datos + preview manual), **IMG** (generación de video/imaginación)
- Backend GAS propio en `CampanasAi/backend.gs`
- Servidor Node + Express en `local-server-node.js` (puerto 8000)
- FFmpeg para generación de video
- Prompts hardcodeados en `script.js:449-486`
- Guardado a hoja `SMMC` en Google Sheets

### Citas (WhatsApp + Supabase)
- Express sub-app en `citas/index.js`
- Webhook de WhatsApp (Meta)
- Supabase para almacenamiento
- Gemini AI para conversación

### Stripe (Pagos)
- Express sub-app en `conecionpagos/index.js`
- PaymentIntents + webhooks
- Multi-tenant key strategy

---

## 11. Function Index

El archivo `INDEX_FUNCIONES.md` mapea toda función → `archivo:línea`. Se genera con:
```bash
node scripts/generate-index.js
```

**Regla**: después de agregar, renombrar o eliminar funciones, regenerar el índice.

---

## 12. Flujo de Datos

```
Lectura:
Browser (SPA) → app.loadData()
  ├── GSHEETS: doGet?action=getAll&id_empresa=X → Google Sheets → JSON
  └── SUPABASE: GET /api/db/:table → PostgreSQL → JSON

Escritura:
  app → POST GAS (doPost) → LockService → write Sheet → response
  app → POST /api/db/:table → Supabase → response

Pagos:
  Frontend → Stripe Elements → PaymentIntent → Webhook → Confirmación
```

---

## 13. Buenas Prácticas

1. **Mobile first**: diseñar para 320px, escalar con `min-width` media queries
2. **Fluid typography**: usar `clamp()` para tamaños de fuente
3. **No frameworks JS**: vanilla JS, módulos en `js/modules/`
4. **RBAC desde inicio**: ocultar/mostrar secciones por `userLevel`
5. **Estado global en `app`**: `app.state`, `app.data`, `app.ui`, `app.router`
6. **Navegación por hash**: `app.router.navigate('#seccion')`
7. **Watchdog activo**: sincronización cada 7.5s con reset de inactividad
8. **API keys desde `config.js`** o `.env`, no hardcodeadas
9. **Usar `INDEX_FUNCIONES.md`** para localizar funciones antes de escanear archivos
10. **Regenerar índice** tras cambios: `node scripts/generate-index.js`
11. **Cambios de alto riesgo** (RBAC, id_empresa, GAS, Supabase, CSP): requerir confirmación explícita
12. **WSL como entorno principal** de desarrollo (según AGENTS.md regla 24-29)
