# SuitOrg — Contexto del Proyecto

## ¿Qué es SuitOrg?
Sistema multi-tenant (multi-inquilino) que permite a diferentes negocios tener su propio sitio/app bajo una misma plataforma. Cada negocio es un "tenant" con su propia configuración, usuarios, catálogo y permisos.

## Arquitectura General
```
GSheets (cerebro maestro — 5 tablas MAESTRO siempre aquí)
    ↓
Google Apps Script (GAS) — backend/API
    ↓
Frontend JS (vanilla) — corre en navegador
    ↑
Supabase (base de datos en la nube) — activo por tenant según db_engine
```

## Tecnologías
| Capa | Tecnología |
|---|---|
| Base de datos principal | Google Sheets |
| API backend | Google Apps Script (.gs) |
| Frontend | JavaScript vanilla (sin framework) |
| Base de datos nube | Supabase (PostgreSQL) |
| IDE de desarrollo | Google IDX (Project IDX / Antigravity) |

## Cómo funciona el multi-tenant
1. Usuario entra al Hub Orbit — ve burbujas de negocios disponibles
2. Selecciona un negocio → `switchCompany(id_empresa)`
3. El sistema carga datos de ese negocio desde GSheets via GAS
4. Si el negocio tiene `db_engine = SUPABASE`, las tablas PRIVATE se leen desde Supabase

## Regla de sincronización por db_engine
| db_engine | Lee primero | Replica a |
|---|---|---|
| SUPABASE | Supabase | GSheets (automático) |
| GSHEETS | GSheets | Supabase (automático) |

La sincronización es automática en ambas direcciones. Las 5 tablas MAESTRO siempre se editan en GSheets — Supabase solo tiene copias de lectura de estas.

## Tablas MAESTRO — siempre en GSheets, tú las editas aquí
| Tabla | Descripción |
|---|---|
| `Config_Empresas` | Cerebro del sistema, define db_engine por tenant |
| `Config_SEO` | Configuración SEO por empresa |
| `Config_Paginas` | Configuración de páginas por empresa |
| `Usuarios` | Usuarios del sistema (copia de lectura en Supabase) |
| `Config_Roles` | Roles y permisos (copia de lectura en Supabase) |

## Tablas PRIVATE — migran a Supabase por tenant
| Tabla | Descripción | Nota |
|---|---|---|
| `Catalogo` | Productos del negocio | ✅ En Supabase PFM |
| `Proyectos` | Pedidos/Proyectos según tipo_negocio | ✅ En Supabase PFM |
| `Proyectos_Pagos` | Pagos asociados a proyectos/pedidos | ✅ En Supabase PFM |
| `Proyectos_Bitacora` | Bitácora de eventos por proyecto | ✅ En Supabase PFM |
| `Config_Roles` | Roles por empresa | ✅ En Supabase PFM |
| `Logs` | Logs de actividad | ✅ En Supabase PFM |
| `Config_Galeria` | Galería de imágenes | ✅ En Supabase PFM |

## Tabla universal: Proyectos
La tabla `Proyectos` se adapta según `tipo_negocio`:
- `tipo_negocio = Alimentos` → es un **pedido** del POS Express
- `tipo_negocio = Servicios` → es un **proyecto** con etapas y pagos

Campos clave compartidos: `id_empresa`, `id_proyecto`, `line_items`, `estado`, `fecha_inicio`

## Archivos clave del frontend
| Archivo | Función |
|---|---|
| `core.js` | Carga de datos, login, switchCompany, SUPABASE OVERRIDE |
| `auth.js` | Login, setLoggedInState, RBAC |
| `public.js` | Hub Orbit, renderFoodMenu, burbujas |
| `router.js` | Navegación por hash (#home, #pos, etc) |
| `app.js` | Monitor de sesión, loop de sincronización |
| `pos.js` | POS Express (cliente) y POS Caja (staff) |

## Archivos del GAS
| Archivo | Función |
|---|---|
| `core.gs` | doGet, getRemoteData, lógica principal |
| `database.gs` | getSheetData, conexión a hojas |
| `utils.gs` | Funciones auxiliares |

## Bugs conocidos y patrones de fix
| Bug | Fix |
|---|---|
| `activo` de Supabase llega como `"true"` minúsculas | Usar `String(p.activo).toUpperCase().trim() === "TRUE"` |
| `start is not defined` en telemetría | Declarar `const start = Date.now()` antes de `const end` |
| Campos GSheets con mayúsculas/espacios variables | Usar función `getField()` en core.js |
