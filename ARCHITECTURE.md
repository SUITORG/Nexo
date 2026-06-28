# SuitOrg — Architecture Reference

> **Identidad Principal:** SuitOrg (Powered by EVASOL Engine)
> **Última Versión Estable:** v15.8.8 (PROD - Seed Fix)
> **Total de Líneas Consolidadas:** 14,673
> **Documento generado:** Consolidación de `x_01-proyecto-suitorg.md`, `x_tech_manual.md`, `x_backend_schema.md` + secciones adicionales.

---

## 1. ¿Qué es SuitOrg?

Sistema multi-tenant (multi-inquilino) que permite a diferentes negocios tener su propio sitio/app bajo una misma plataforma. Cada negocio es un "tenant" con su propia configuración, usuarios, catálogo y permisos.

Es un ecosistema multi-capa diseñado para la gestión integral de negocios alimenticios, optimizado para velocidad en punto de venta (POS) y pedidos express. El sistema está preparado para ramificarse en soluciones específicas según el inquilino:

- **Módulo POS:** Para negocios de retail o comida (Burbuja "Pollo").
- **Módulo Pedidos/Logística:** Para distribución.
- **Módulo Contable/Seguimiento:** Para consultorías o servicios profesionales.
- **Interfaz Orbit:** Navegación disruptiva mediante burbujas interactivas.

**CampanasAI** es un sub-proyecto CMS para generación de contenido de marketing en redes sociales (posts, reels, stories) usando inteligencia artificial, alojado en `CampanasAi/` y servido en puerto 8000.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | HTML/CSS/JS vanilla (SPA, hash routing, sin frameworks). v16.7.28 |
| **Backend #1** | Google Apps Script (GAS) modular en `backend/`. v15.9.9 |
| **Backend #2** | Node.js + Express (puerto 3001) con Helmet CSP |
| **Backend #3** | Node.js (puerto 8000) para CampanasAI CMS |
| **DB Primaria** | Google Sheets (ID: `1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8`) |
| **DB Cloud** | Supabase PostgreSQL (en migración desde Google Sheets) |
| **AI Engine** | Gemini 1.5 Flash / 2.0 Flash (v1beta) + OpenRouter multi-model fallback |
| **Pagos** | Stripe (`conecionpagos/` module) |
| **Video** | FFmpeg (generación local de reels/slideshows) |
| **Imágenes** | Pollinations.ai, LoremFlickr, Picsum (fallback chain) |
| **Audio** | Web Speech API (browser TTS, sin costo servidor) |
| **CI/CD** | clasp (GAS deploy) + GitHub Actions (configurado) |
| **IDE** | Google IDX (Project IDX / Antigravity) |
| **Dev Env** | WSL 2 con ripgrep, fd-find, zip |

---

## 3. Mapa de Carpetas

```
SUITORGSTORE01/
│
├── backend/                      → Google Apps Script (GAS) backend principal
│   ├── core.js                   → Orquestador maestro (doGet/doPost)
│   ├── database.js               → Inicialización DB, seeds, auto-purga
│   ├── utils.js                  → Helpers CRUD (getSheetData, appendRowMapped, updateRowMapped)
│   ├── ai_engine.js              → Motor IA (Gemini + OpenRouter fallback multi-modelo)
│   ├── DriveManager.js           → Gestión estructura Google Drive por tenant
│   └── appsscript.json           → Manifiesto GAS (V8 runtime, scopes Drive/Sheets/Calendar)
│
├── CampanasAi/                   → CMS de Campañas de Marketing (sub-proyecto)
│   ├── index.html                → Frontend CMS SPA (498 líneas)
│   ├── script.js                 → Lógica frontend CMS (2048+ líneas)
│   ├── style.css                 → Estilos CMS
│   ├── backend.gs                → Backend GAS del CMS (133 líneas)
│   ├── local-server-node.js      → Servidor Node.js puerto 8000 (1015 líneas)
│   ├── mock-server.js            → Mock server para pruebas offline
│   ├── config/                   → Prompts IA, formatos de salida, industrias
│   ├── generators/               → Procesamiento de imágenes y generación de reels
│   ├── scripts/                  → Agent-tendencias, pytrends (Python), seeds, sync
│   └── database/                 → Datos de campañas y plantillas JSON
│
├── citas/                        → Módulo de Citas/Reservaciones
│   ├── index.js                  → Express router: webhook WhatsApp + REST API
│   ├── db/                       → Cliente Supabase
│   ├── handlers/                 → Webhook handlers
│   └── services/                 → Lógica de negocio
│
├── conecionpagos/                → Módulo de Pagos Stripe
│   ├── index.js                  → PaymentIntents, webhooks, multi-tenant Stripe
│   └── package.json
│
├── js/modules/                   → Frontend SPA (JavaScript vanilla modular)
│   ├── core.js                   → Estado global, carga de datos, login, switchCompany, SUPABASE OVERRIDE
│   ├── router.js                 → Router SPA por hash (#orbit, #pos, #home, etc.)
│   ├── auth.js                   → Login, setLoggedInState, RBAC, session management
│   ├── ui.js                     → Renderizado UI, temas, consola del sistema
│   ├── public.js                 → Orbit Hub, Landing, Galería, SEO, Contacto (2500 líneas)
│   ├── pos.js                    → Punto de Venta (cliente) y POS Caja (staff), Stripe frontend
│   ├── admin.js                  → CRM, Dashboard, Reportes, Gráficas (1188 líneas)
│   ├── agents.js                 → Control de Agentes IA (1259 líneas)
│   ├── config.js                 → Configuración de despliegue (URLs API, tokens)
│   └── events.js                 → Manejo de eventos
│
├── dist/                         → Static Site Generator output
│   ├── index.html                → Landing page principal
│   ├── ape.html, evasol.html, paper.html  → Landing pages por empresa
│   ├── robots.txt                → Configuración SEO
│   └── sitemap.xml               → Sitemap multi-inquilino
│
├── knowledge/                    → Base de conocimiento para agentes IA (RAG)
│   ├── Pension_Inteligente_Marketing.md
│   ├── Pension_Inteligente_SOP.md
│   ├── Modalidad40 Primera Sesion.md
│   ├── M40 Expediente.md
│   ├── GananciasyPerdidasMod40.md
│   ├── reglas-negocio-servicios.md
│   ├── reglasnegocioPI40.md
│   ├── pasosaseguir.md
│   └── DocumentacionLegal.md
│
├── scripts/                      → Utilidades y herramientas
│   ├── generate-index.js         → Generador de INDEX_FUNCIONES.md
│   ├── orchestrator_client.js    → Cliente del orquestador GAS
│   ├── ssg-engine.mjs            → Static Site Generator
│   ├── supabase_create_missing_tables.sql
│   └── agents/
│       └── vision-audit.js       → Agente de auditoría visual
│
├── Documentacion/                → Documentación del proyecto
│   ├── x_01-proyecto-suitorg.md  → (original renombrado)
│   ├── 02-tablas-campos.md
│   ├── 03-solucion-migracion.md
│   ├── 04-agentes-recomendados.md
│   ├── 05-debug-referencia.md
│   ├── 06-estatus-roadmap.md
│   ├── 10-fix-modelos-openrouter.md
│   ├── MIGRACION_SUPABASE_INSTRUCCIONES.md
│   └── SuitOrg-Contexto del Proyecto-260401.txt
│
├── .opencode/                    → Configuración OpenCode
│   └── skills/multi-tenant-saas/SKILL.md
│
├── .github/                      → GitHub Actions (workflows)
├── node_modules/                 → Dependencias Node.js
├── media/                        → (vacío) subida de media
├── tmp/                          → Archivos temporales
├── _LEGACY_BACKUPS/              → Respaldos ZIP históricos
│
├── app.js                        → Monitor/sync loop (72 líneas), legacy adapter
├── server.js                     → Servidor Express principal (397 líneas, puerto 3001)
├── supabase.js                   → Cliente Supabase CRUD (41 líneas)
├── index.html                    → SPA principal (1875 líneas)
├── style.css                     → Estilos globales (3829 líneas)
├── RESPONSIVE-UI.css             → Estilos responsivos adicionales
├── package.json                  → Dependencias Node.js
├── AGENTS.md                     → Reglas inmutables para el agente OpenCode
├── INDEX_FUNCIONES.md            → Índice de funciones (auto-generado)
├── x_tech_manual.md              → (original renombrado)
├── x_backend_schema.md           → (original renombrado)
├── .clasp.json                   → Configuración clasp para GAS
├── .env.example                  → Template de variables de entorno
├── .gitignore
├── .htaccess                     → Configuración Apache
└── .mcp.json                     → Configuración MCP
```

---

## 4. Flujo de Datos

1. El usuario navega la SPA vanilla (hash routing: `#orbit`, `#pos`, `#leads`, etc.) que se comunica con **dos backends**: Google Apps Script (GAS) para operaciones CRUD legacy sobre Google Sheets, y Express (puerto 3001) como proxy seguro a Supabase, Gemini AI y Stripe.

2. **CampanasAI** (puerto 8000) opera como CMS de marketing, usando el mismo proxy Express para llamadas a Gemini, y GAS para leer/escribir en Google Sheets (hoja SMMC), más acceso directo a Supabase para industrias, recetas y tendencias.

3. Las **5 tablas MAESTRO** (`Config_Empresas`, `Usuarios`, `Config_Roles`, `Config_SEO`, `Prompts_IA`) viven siempre en Google Sheets y se editan allí; Supabase mantiene copias de solo lectura. Las **tablas PRIVATE** (`Leads`, `Proyectos`, `Catalogo`, etc.) migran gradualmente a Supabase PostgreSQL con sincronización bidireccional automática controlada por el campo `db_engine` por tenant.

4. El motor **Gemini 1.5 Flash** genera contenido IA con OpenRouter como fallback multi-modelo; los agentes autónomos (tendencias, marketing) operan en loops programados. Stripe procesa pagos, FFmpeg genera videos localmente, y Google Drive almacena documentos de clientes con estructura jerárquica por tenant.

5. El frontend ejecuta un loop de monitoreo/sincronización cada 7.5s (`app.js`) que reconcilia estado local vs backend, con cache en localStorage y protocolo de persistencia para evitar regresiones por latencia de Google Sheets.

---

## 5. Arquitectura General

```
GSheets (cerebro maestro — 5 tablas MAESTRO siempre aquí)
    ↓
Google Apps Script (GAS) — backend/API (core.js, database.js, ai_engine.js)
    ↓
Frontend JS (vanilla) — SPA en navegador (js/modules/)
    ↑
Supabase (PostgreSQL en la nube) — activo por tenant según db_engine
    ↑
Node.js Express (server.js, puerto 3001) — proxy seguro a Supabase, Gemini, Stripe
```

**Arquitectura híbrida:**
- GAS maneja la lógica de negocio core y CRUD sobre Google Sheets
- Node.js Express actúa como API proxy para: Supabase (PostgreSQL), Gemini AI, Stripe, Storage
- CampanasAI tiene su propio servidor Node (puerto 8000) que proxifica GAS y accede directo a Supabase

**Regla de sincronización por db_engine:**

| db_engine | Lee primero | Replica a |
|---|---|---|
| SUPABASE | Supabase | GSheets (automático) |
| GSHEETS | GSheets | Supabase (automático) |

La sincronización es automática en ambas direcciones. Las 5 tablas MAESTRO siempre se editan en GSheets — Supabase solo tiene copias de lectura de estas.

---

## 6. Multi-Tenant

### Cómo funciona
1. Usuario entra al Hub Orbit — ve burbujas de negocios disponibles.
2. Selecciona un negocio → `switchCompany(id_empresa)`.
3. El sistema carga datos de ese negocio desde GSheets via GAS.
4. Si el negocio tiene `db_engine = SUPABASE`, las tablas PRIVATE se leen desde Supabase.

### Aislamiento Multi-Inquilino Absoluto
- **Privacidad de Datos:** Pese a compartir la misma base de datos física, ninguna empresa puede acceder a la información, reportes o configuración de otra.
- **Validación de Token:** Cada consulta debe portar el `id_empresa` y el backend filtra los resultados de forma estricta.
- **Regla Inmutable:** Toda query debe filtrar por `id_empresa`. Ningún negocio ve datos de otro.
- Tablas globales son solo lectura para inquilinos. Tablas privadas se filtran estrictamente por `id_empresa`.

---

## 7. Roles y Permisos (RBAC)

### Niveles de Acceso

| Rol | Nivel | Descripción |
|---|---|---|
| **DIOS** | 999 | Acceso total a configuraciones, mantenimiento y todos los datos. Inmune a filtros. Créditos infinitos. |
| **ADMIN** | 10 | Acceso total a la empresa asignada. Gestiona Catálogo, sincroniza Drive, borra registros. |
| **SUPERVISOR** | 8 | Acceso operativo extendido. Añade logs, gestiona flujo de proyectos. No borra ni edita Catálogo. |
| **VENTAS** | 4-6 | Acceso a prospección. Crea Leads, consulta Catálogo (solo lectura), usa Agentes IA si nivel 5+. |
| **STAFF** | 5 | Acceso operativo base. Consume créditos por login. |
| **PUBLIC** | 0 | Acceso solo a Landing Page y formularios de contacto. |

### Reglas de Activación de Módulos
Los IDs de módulos deben escribirse en minúsculas, separados por comas o espacios. No usar `#`. Si un ID es incorrecto, el módulo permanece oculto.

### Seguridad Granular
- **Nivel < 10:** Botones "Agregar Producto", "Sincronizar Drive" y "Borrar" ocultos.
- **Nivel >= 10:** Acceso total a botones de creación y depuración.
- **Timeout:** 120 segundos de inactividad redirigen al Landing.
- Visitantes 5min → reset a Orbit. Staff con crédito DIARIO/GLOBAL → 8h, otros → 120s.

---

## 8. Sistema de Créditos

El sistema soporta dos modos de gestión de políticas configurables en `Config_Empresas`:

1. **Modo USUARIO:** Las reglas se leen directamente de la fila del usuario en la tabla `Usuarios`.
2. **Modo ROL:** Las reglas se centralizan en la tabla `Config_Roles`. El sistema busca el `id_rol` del usuario y aplica automáticamente sus permisos.
3. **Modo DIARIO:** Ideal para suscripciones por día. Descunta **1 crédito** la primera vez que el usuario accede en el día. Ingresos subsecuentes no consumen créditos adicionales.

**Prioridad de Restricción:**
- **Fecha de Corte:** Prioridad absoluta. Se calcula sumando `vigencia_dias` (desde creación del usuario) o usando fecha fija de la empresa.
- **Créditos:** Se descuenta **1 crédito** (Global o Individual) por acceso exitoso.
- **Módulos Visibles:** El menú y dashboard se filtran dinámicamente según la configuración del rol.

**Alertas:**
- Si el saldo es **<= 5**, alerta persistente.
- Si el saldo llega a **0**, el sistema bloquea el acceso.
- Existe una **Fecha de Vencimiento** independiente.

---

## 9. Estructura de Datos (Tablas)

### Tablas MAESTRO (GLOBAL_TABLES) — siempre en GSheets
Compartidas entre todas las empresas para configuración del Hub y autenticación.

| Tabla | Descripción |
|---|---|
| `Config_Empresas` | Metadata de inquilinos, colores, temas, db_engine, políticas. Soporte para `alias_seo` (Shortlinks). |
| `Config_Roles` | Definición de jerarquías, módulos visibles y vigencia por rol. |
| `Config_Flujo_Proyecto` | Definición de etapas comerciales con pesos porcentuales y colores. |
| `Usuarios` | Credenciales, roles, créditos, fechas límite. Soporta login mediante Token de Bóveda. |
| `Prompts_IA` | Configuración de Agentes (Nombre, Prompt Base, Activo). |
| `Config_SEO` | Matriz de palabras clave y soluciones para la Landing Page. |
| `Config_Paginas` | Motor de contenido dinámico. Almacena JSON de Meta, Schema y Narrativa. |
| `Config_Galeria` | Gestión de imágenes, logos y visuales por empresa. |

### Tablas PRIVATE (PRIVATE_TABLES) — migran a Supabase por tenant
Datos aislados por `id_empresa`. Acceso filtrado estrictamente en el servidor.

| Tabla | Descripción |
|---|---|
| `Catalogo` | Productos del negocio (IDs `PROD-XX`). |
| `Proyectos` | Pedidos/Proyectos según `tipo_negocio` (folios `ORD-XXX`). |
| `Proyectos_Pagos` | Pagos asociados a proyectos/pedidos. |
| `Proyectos_Bitacora` | Bitácora de eventos por proyecto. |
| `Leads` | Prospectos comerciales (folios `LEAD-XXX`). |
| `Logs` | Registro de auditoría y fallos de IA. |
| `Pagos` | Transacciones financieras vinculadas a empresas y proyectos. |
| `Config_Galeria` | Galería de imágenes por empresa. |
| `Reservaciones` | Citas y reservas vinculadas a Google Calendar. |

### Tabla universal: Proyectos
La tabla `Proyectos` se adapta según `tipo_negocio`:
- `tipo_negocio = Alimentos` → es un **pedido** del POS Express.
- `tipo_negocio = Servicios` → es un **proyecto** con etapas y pagos.

Campos clave compartidos: `id_empresa`, `id_proyecto`, `line_items`, `estado`, `fecha_inicio`.

---

## 10. Backend GAS — Acciones de API (POST Protocol)

| Acción | Descripción | Reglas de Negocio |
|---|---|---|
| `createLead` | Crea un prospecto nuevo. | Si es TopLux, auto-crea Usuario y Token de Bóveda. |
| `syncDrive` | Inicializa estructura de Drive. | Crea carpetas Maestras y `00_BIBLIOTECA_IA`. |
| `uploadToVault` | Sube archivos a Drive. | Convierte Base64 a Blob y lo guarda en carpeta del Cliente. |
| `getCustomerDocs` | Lista archivos privados. | Filtra archivos en la carpeta de Drive del usuario logueado. |
| `processFullOrder` | Transacción atómica de POS. | Registra Lead, Venta y descuenta Stock en un solo paso. |

### Archivos del Backend GAS

| Archivo | Función |
|---|---|
| `backend/core.js` | Orquestador maestro: doGet/doPost, getRemoteData, lógica principal. |
| `backend/database.js` | getSheetData, inicialización DB, seeds, auto-purga. |
| `backend/utils.js` | Funciones auxiliares CRUD (getSheetData, appendRowMapped, updateRowMapped). |
| `backend/ai_engine.js` | Motor IA: Gemini + OpenRouter multi-model fallback. |
| `backend/DriveManager.js` | Gestión de estructura de Google Drive por tenant. |
| `CampanasAi/backend.gs` | Backend GAS del CMS (133 líneas). |

### Reglas del Backend GAS
- Backend dual: `backend/core.js` (orquestador maestro) y `CampanasAi/backend.gs` (CMS simple).
- Usar `LockService` para operaciones concurrentes (timeout 30s).
- No borrado físico — usar columna `activo` (TRUE/FALSE).
- IDs secuenciales: `LEAD-XXX`, `ORD-XXX`, `PROD-XX`. No UUIDs aleatorios.
- Token de seguridad requerido en todo POST al backend.

---

## 11. Vault Engine (Bóveda Digital, v6.1.8)

1. **Gatillo:** Al detectar un `createLead` de una empresa financiera, el sistema genera un `vaultToken` de 6 dígitos (`TX-XXXX`).
2. **Identidad:** Se crea una fila en la tabla `Usuarios` con `nivel_acceso: 1` y el token como password.
3. **Drive Hierarchy:** El sistema organiza los archivos en:
   - `01_EXPEDIENTES_CLIENTES` / `[Nombre Cliente]` / `01_IDENTIDAD`, `02_SOLICITUDES`, etc.

---

## 12. Frontend — Archivos Clave

| Archivo | Función |
|---|---|
| `index.html` | SPA principal (1875 líneas). |
| `app.js` | Monitor de sesión, loop de sincronización cada 7.5s, legacy adapter (72 líneas). |
| `js/modules/core.js` | Carga de datos, login, switchCompany, SUPABASE OVERRIDE (603 líneas). |
| `js/modules/router.js` | Navegación por hash (164 líneas). |
| `js/modules/auth.js` | Login, setLoggedInState, RBAC, session. Inactividad y timeouts (260 líneas). |
| `js/modules/ui.js` | Renderizado UI, temas, consola del sistema (578 líneas). |
| `js/modules/public.js` | Orbit Hub, Landing, Galería, SEO, Contacto (2500 líneas). |
| `js/modules/pos.js` | POS Express (cliente) y POS Caja (staff), Stripe frontend (1537 líneas). |
| `js/modules/admin.js` | CRM, Dashboard, Reportes, Gráficas (1188 líneas). |
| `js/modules/agents.js` | Control de Agentes IA (1259 líneas). |
| `js/modules/config.js` | Configuración de despliegue (URLs API, tokens). |
| `js/modules/events.js` | Manejo de eventos. |
| `style.css` | Estilos globales (3829 líneas). |
| `RESPONSIVE-UI.css` | Estilos responsivos adicionales. |

### Reglas del Frontend
- Navegación por hash (`#orbit`, `#pos`, `#home`, `#leads`, `#catalog`, `#agents`, etc.).
- Roles RBAC: DIOS (999), ADMIN (10), STAFF (5), DELIVERY, PUBLIC (0).
- Modales seguros con botón "Cancelar / Volver" siempre visible.
- Gestión de Temperatura (Avance): progreso medido por fases con peso porcentual.
- Estética: bordes redondeados (50px), colores corporativos, tipografía legible.

---

## 13. Agentes de Inteligencia Artificial (Gemini)

### Acceso y Uso
- **Nivel Requerido:** Nivel 5 (Staff) en adelante o rol DIOS.
- **Ubicación:** Dashboard principal bajo sección **"HERRAMIENTAS IA"**.
- **Funcionamiento:** Selecciona un agente (Escritor, Analista, etc.) y el sistema envía el contexto de la empresa y documentos sincronizados.

### Conocimiento (RAG)
- Los agentes "leen" archivos subidos a la carpeta de Google Drive configurada.
- Usar botón **"Sincronizar"** en módulo de Conocimiento para indexar textos de PDFs.

### Configuración Técnica
- **Modelos:** `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-flash-latest` (v1beta).
- **Personalización:** Tabla `Prompts_IA` en Google Sheets — editar `prompt_base` para cambiar personalidad.
- **Autodiagnóstico y Resiliencia:** Loop de Fallback Multi-modelo. Si el modelo configurado no está disponible, intenta alternativas automáticamente.
- **Log de Recuperación:** Cada intento fallido queda registrado en hoja `Logs` bajo evento `AI_FALLBACK`.

---

## 14. Módulos del Sistema (Glosario de IDs Técnicos)

| ID Técnico | Nombre en Interfaz | Función Principal |
|---|---|---|
| `dashboard` | Panel de Control | Resumen de créditos, accesos directos y estadísticas. |
| `staff-pos` | Venta (POS) / Caja | Interfaz de cobro directo. |
| `pos` | Monitor de Pedidos | Control de estatus de órdenes (Nuevos, Cocina, Listos). |
| `projects` | Proyectos | Gestión de avance y temperatura de negocio. |
| `reservations` | Citas | Control de reservaciones vinculadas a Google Calendar. |
| `leads` | Gestión de Leads | Registro y seguimiento de clientes potenciales. |
| `catalog` | Catálogo | Gestión de productos, stock y precios. |
| `catalog_add` | (Permiso) Agregar | Crear nuevos productos. |
| `catalog_edit` | (Permiso) Editar | Modificar cualquier campo del producto. |
| `catalog_delete` | (Permiso) Borrar | Borrado lógico (Ocultar). |
| `catalog_stock` | (Permiso) Stock | Ajustar niveles de inventario. |
| `agents` | Agentes IA | Panel de Agentes inteligentes (Gemini). |
| `home` | Inicio / Landing | Vista principal pública de la empresa. |
| `orbit` | Orbit Hub | Navegación entre divisiones (Burbujas). |
| `contact` | Contacto | Formulario público de captura de leads. |

---

## 15. Reglas Inmutables de Integridad

1. **Aislamiento:** Ninguna petición puede recuperar datos que no pertenezcan al `id_empresa` autenticado (excepto tablas globales).
2. **Seguridad Drive:** El acceso a archivos externos solo se permite mediante `getCustomerDocs` validado por token de sesión.
3. **Identificadores:** Los IDs técnicos son secuenciales y no aleatorios (LEAD-101, ORD-501, PROD-XX).
4. **Borrado Lógico:** No se eliminan filas físicamente; se usa columna `activo` (TRUE/FALSE) para persistencia histórica.
5. **Token de Seguridad:** Requerido en todo POST al backend GAS.
6. **Helmet CSP:** Activo con CSP estricta en Express server. Bloquea recursos no autorizados.
7. **Service Role:** Endpoints `/api/db/*` usan service_role key (bypass RLS), solo llamadas internas.
8. **Doble Escritura:** Pagos se escriben en `Pagos` y `Proyectos_Pagos` simultáneamente.

---

## 16. CampanasAI (Sub-proyecto CMS Marketing)

### Modos de Operación
- **Ai:** IA genera todo (via Gemini).
- **BD:** Carga desde Google Sheets + IA enhancement.
- **BDPR:** Base datos + manual/preview (sin IA).
- **IMG:** Imagination Video desde carpeta local + receta (FFmpeg).

### Flujo CampanasAI
```
[Browser port 8000]
  → local-server-node.js
    → /api/history → GAS (Google Sheets SMMC)
    → /api/config → GAS (Config_Empresas)
    → /api/save → GAS (POST a SMMC)
    → /api/industrias → Supabase
    → /api/recetas → Supabase
    → /api/video-imaginacion → FFmpeg
    → /api/agent/tendencias → agente autónomo
  → /api/ai/generate → Gemini (via Express port 3001)
```

### Reglas Específicas
- 3 modos: Ai, BD, BDPR + IMG.
- Prompts de IA hardcodeados en `script.js:449-486` (aún no vienen de DB).
- Guardado a hoja `SMMC` en Google Sheets ID `1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8`.
- Proyecto al 75% hacia auto-publicación completa.

---

## 17. Bugs Conocidos y Patrones de Fix

| Bug | Fix |
|---|---|
| `activo` de Supabase llega como `"true"` minúsculas | Usar `String(p.activo).toUpperCase().trim() === "TRUE"` |
| `start is not defined` en telemetría | Declarar `const start = Date.now()` antes de `const end` |
| Campos GSheets con mayúsculas/espacios variables | Usar función `getField()` en core.js |
| Google Apps Script rechaza peticiones con preflight (OPTIONS) | Eliminar `mode: 'cors'` del fetch frontal, usar GET nativo |
| Seeds no se creaban si tabla existía pero incompleta | Implementar lógica de Upsert, verificar registro por registro |
| Verificación de seeds fallaba por depender de índices fijos | Refactorizar a función `ensureSeed` con búsqueda dinámica por 'id' |
| Error de variable no definida (`dailyOrders`) en POS | Cache en localStorage con protocolo de persistencia |
| Fechas en UTC causaban desfase en reportes | Normalización a YYYY-MM-DD local |

---

## 18. Estrategias SEO Implementadas

- **Metadatos Dinámicos:** Título y descripción configurados por empresa.
- **Micro-Copy de Divisiones:** 8 divisiones con atributos `alt` y `title` enriquecidos.
- **Clusters de Cola Larga:** Sección de "Soluciones Especializadas" con 24 frases clave.
- **Pilares Estratégicos:** Misión, Visión, Impacto y Valores en Landing Page.
- **JSON-LD (Schema.org):** Inyección dinámica según contexto de página.
- **Sitemap XML:** Multi-inquilino (`sitemap.xml`).
- **Robots.txt:** Configurado.
- **Deep Linking:** Parámetro `id` en URL.
- **Cache Busting:** Versión en querystring (`?v=4.9.1`).

---

## 19. Servidores Node.js

### server.js (Raíz, puerto 3001)
Sirve el frontend multi-inquilino con Express + Helmet CSP.

Endpoints:
- `/api/db/:table` → CRUD sobre Supabase (service_role, solo interno)
- `/api/ai/generate` → Proxy a Gemini
- `/api/ai/chat` → Proxy a Gemini
- `/api/stripe/*` → Stripe API
- `/api/storage/*` → Supabase Storage
- `/api/sheets/prompts` → Google Sheets (CORS proxy)
- `/api/local/save` → Filesystem local
- `/api/webhook/citas` → Módulo de citas

### CampanasAi/local-server-node.js (Puerto 8000)
Sirve el CMS de Campañas.

Endpoints:
- `/api/history` → GAS proxy
- `/api/config` → GAS proxy
- `/api/save` → GAS proxy (POST)
- `/api/industrias` → Supabase
- `/api/recetas` → Supabase
- `/api/video-imaginacion` → FFmpeg
- `/api/agent/tendencias` → Agente autónomo

---

## 20. Changelog Histórico (v2.7.0 → v15.8.8)

- **v15.8.8** — Seed Fix (PROD estable).
- **v14.1.0** — Multi-Tenant Business & Pareto Vault. Pensión Inteligente CMARJAV.
- **v14.0.3** — Gallery Precision & Identity Coordinates.
- **v6.2.0** — Dynamic Content Engine (Narrativa IA). Tabla `Config_Paginas`.
- **v6.1.8** — Secure Drive Vault & Private Token. Vault Engine.
- **v6.1.0** — Calendar & Reservations Engine. Google Calendar API.
- **v6.0.7** — Dynamic Identity & QR Engine. SEO Matrix.
- **v5.8.9** — Orbit Hub responsivo (-60% móvil). SEO Proxy WhatsApp.
- **v5.7.0** — Suit BI Matrix. Dashboard dinámico desde Excel.
- **v5.5.0** — Motor de Reportes Dinámicos.
- **v5.4.0** — Fábrica de Negocios (Onboarding IA).
- **v5.3.6** — Brand Hierarchy & Identity Reset.
- **v5.2.5** — Lead Sync & Timestamps.
- **v5.2.4** — Smart ID & Project Traceability. Creación de `backend_schema.md`.
- **v5.2.2** — CRM Intelligence & Robust Billing.
- **v4.9.2** — Health System & Auto-Purge.
- **v4.9.1** — SEO Infrastructure Update (sitemap, robots.txt).
- **v4.9.0** — Visual Color Refinement.
- **v4.8.9** — UX Refinement & Mobile Fixes.
- **v4.8.8** — Premium Mobile UX for Staff POS.
- **v4.8.6** — Accounting Integrity Restoration.
- **v4.8.5** — Report Consolidation & Payment Fix.
- **v4.7.5** — POS Integrity & RBAC Omnidirectional.
- **v4.7.0** — WSL & High-Perf Sync. Integración WSL 2.
- **v4.7.0** — Catalog CRUD & Sequential IDs.
- **v4.6.9** — Premium Branding & UX Guard.
- **v4.6.7** — Public Module Consolidation.
- **v4.6.6** — Authoritative Persistent Shield Protocol (Shield 2min).
- **v4.6.5** — Table-based Persistent Shield Protocol.
- **v4.6.2** — Stability Fix. Restauración ui.js.
- **v4.6.0** — Delivery Flow V2 (3 estados: Recibido → Cocina → Listo → En Camino → Entregado).
- **v4.5.10** — Monitor POS Refinado.
- **v4.5.2** — Dual Alert & Delivery Fix.
- **v4.5.1** — POS Frozen.
- **v4.4.9** — Sincronización Crítica & SaaS.
- **v4.4.5** — Excepción de SLA.
- **v4.4.4** — Filtro de Fecha Robusto.
- **v4.4.3** — RBAC Estricto.
- **v4.4.2** — Cajero Access Fix.
- **v4.4.1** — Estabilidad Operativa POS + Seguridad DELIVERY.
- **v4.4.0** — Estabilidad Operativa POS. Folios secuenciales, descuento stock.
- **v4.3.5** — Giro Gourmet Final.
- **v4.3.0** — Giro Gourmet. Agente Chef.
- **v4.2.1** — Sincronización POS & Escritura.
- **v4.2.0** — Privacidad e Integridad. Multi-inquilino absoluto.
- **v4.1.0** — IA Resiliente. Restauración seeds y RBAC. Gemini API con fallback.
- **v3.5.0** — Total Staff Focus.
- **v3.4.9** — Staff UI Focus.
- **v3.4.8** — AI Chat Auto-Close.
- **v3.4.7** — Ai Fix & SEO Refine. Upgrade Gemini v1beta.
- **v3.4.6** — Support Agent Activation.
- **v3.4.5** — Dashboard Granular (Blindaje).
- **v3.4.4** — Fix Transición Inquilino.
- **v3.4.3** — Mapeo de Cabeceras Robusto.
- **v3.4.2** — Synchronized Payments.
- **v3.4.0** — Delivery Engine Stage.
- **v3.3.9** — Modo Turbo en Workflows.
- **v3.3.8** — Blindaje de Tokens.
- **v3.3.7** — Protocolo de Semillas ensureSeed.
- **v3.3.6** — Verificación de Semillas (Upsert).
- **v3.3.5** — Módulo Atención al Cliente.
- **v3.3.4** — Orquestador inteligente.
- **v3.3.3** — Fix renderizado HTML en chat IA.
- **v3.3.1** — Footer Dinámico y Redes Sociales.
- **v3.3.0** — Migración SEO a matriz dinámica `Config_SEO`.
- **v3.2.1** — Fix persistencia Barra de Estado.
- **v3.2.0** — RBAC Granular. Niveles 7 y 8.
- **v3.1.9** — Protección God Tools.
- **v3.1.3** — Synchronized Search, Sort, UI Polish.
- **v3.1.2** — Búsqueda dinámica, ordenamiento leads.
- **v2.8.1** — Modo DIARIO de créditos.
- **v2.8.0** — Temperatura de Negocio y Consola de Sistema.
- **v2.7.5** — Transición identidad a SuitOrg.
- **v2.7.0** — Temperatura de Negocio (Flujo Dinámico).

---

## 21. Estadísticas del Proyecto (Auditoría de Código)

| Archivo / Carpeta | Líneas |
|---|---|
| index.html | 1803 |
| style.css | 3829 |
| js/modules/ | 7808 |
| app.js | 70 |
| backend/ (GAS) | 1163 |
| **TOTAL** | **14673** |

---

## 22. Mejoras Posibles

1. **Unificar servidores Node** (3001 y 8000) en uno solo — reduce complejidad operativa y puertos.
2. **Migrar GAS a Supabase por completo** — elimina el híbrido con Sheets, ganas velocidad, escalabilidad y consistencia transaccional.
3. **Frontend moderno** (React/Vue/Svelte) — aunque el vanilla JS funciona, un framework facilitaría el mantenimiento a largo plazo.
4. **RLS en Supabase en vez de service_role key** — hoy se está bypassing Row Level Security, lo que es un riesgo de seguridad.
5. **Containerizar con Docker** — para despliegues reproducibles en cualquier entorno.
6. **Separar CampanasAI en su propio repo o integrarlo al mismo servidor** — hoy tiene su propio server.js, lo duplica.
7. **Mover prompts hardcodeados** de `script.js:449-486` a base de datos (ya hay tabla `Prompts_IA`).

---

## 23. Lo que No Existe y Hay que Crear

| Carencia | Prioridad | Nota |
|---|---|---|
| **Tests automatizados** | Alta | Solo existe `test-system.js` básico. No hay unit tests, integration tests ni e2e. |
| **CI/CD funcional** | Alta | GitHub Actions configurado pero vacío. No hay pipeline de build/test/deploy. |
| **Manejo de errores unificado** | Media | Hoy disperso entre GAS (try/catch), Express (middleware) y frontend (console.log). |
| **Documentación de API** | Media | Los endpoints de Express no tienen documentación (OpenAPI/Swagger). |
| **Rate limiting** | Media | Los endpoints públicos no tienen límite de peticiones. |
| **Migración completa a Supabase** | Alta | Hoy es híbrido: 5 tablas en Sheets, el resto migrando. Sin fecha de corte. |
| **Logs centralizados** | Baja | Hoy van a Google Sheets (hoja Logs) con auto-purga a 2 meses. |
| ** Backup automatizado** | Media | Solo existe backup manual vía zip en WSL. |
