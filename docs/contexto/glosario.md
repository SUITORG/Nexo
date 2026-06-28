# Glosario — SuitOrg

## Términos del Dominio

| Término | Significado |
|---|---|
| **Tenant / Inquilino** | Negocio dentro de la plataforma multi-tenant. Cada uno con su propia config, usuarios y datos. |
| **Orbit Hub** | Pantalla principal con burbujas de negocios disponibles para navegar. |
| **Burbuja** | Representación visual de un tenant/negocio en Orbit Hub. |
| **Temperatura de Negocio** | Barra de progreso de un proyecto basada en fases con peso porcentual. |
| **Bóveda Digital / Vault** | Sistema de almacenamiento seguro de documentos en Google Drive por cliente. |
| **Vault Token** | Código `TX-XXXX` que da acceso a la Bóveda Digital. |
| **Modo DIARIO** | Sistema de créditos donde se descuenta 1 crédito por día calendario. |
| **RBAC** | Role-Based Access Control con niveles 0-999. |
| **SSG** | Static Site Generator (`scripts/ssg-engine.mjs`) que genera landing pages en `dist/`. |
| **Orquestador** | `backend/core.js` que maneja todas las acciones POST/GET del backend GAS. |

## Entidades Principales (Tablas)

| Tabla | Propósito |
|---|---|
| `Config_Empresas` | Configuración general de cada tenant (colores, políticas, db_engine). |
| `Usuarios` | Credenciales, roles, créditos y fechas límite por usuario. |
| `Config_Roles` | Definición de jerarquías, módulos visibles y permisos. |
| `Config_SEO` | Matriz de palabras clave y soluciones SEO por empresa. |
| `Config_Paginas` | Contenido dinámico JSON (Meta, Schema, Narrativa) por página. |
| `Prompts_IA` | Configuración de agentes Gemini (nombre, prompt base, activo). |
| `Leads` | Prospectos comerciales con origen y estado. Folios `LEAD-XXX`. |
| `Proyectos` | Órdenes/pedidos según `tipo_negocio`. Folios `ORD-XXX`. |
| `Catalogo` | Productos y servicios con control de stock. IDs `PROD-XX`. |
| `Logs` | Registro de eventos del sistema y fallos de IA. |
| `Reservaciones` | Citas vinculadas a Google Calendar. IDs `CIT-XXX`. |
| `Pagos` | Transacciones financieras vinculadas a proyectos. |
| `SMMC` | Hoja de Google Sheets donde CampanasAI guarda campañas. |

## Siglas Internas

| Sigla | Significado |
|---|---|
| **GAS** | Google Apps Script |
| **GSheets** | Google Sheets |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row Level Security (Supabase) |
| **CSP** | Content Security Policy (Helmet) |
| **SSG** | Static Site Generator |
| **RAG** | Retrieval-Augmented Generation (IA con contexto) |
| **POS** | Point of Sale |
| **OTS** | Order Tracking System |
| **OTP** | One-Time Password (entrega pedidos) |
| **PFM** | Plataforma (empresa tipo dentro del multi-tenant) |
| **PA PER** | Pensión Alimenticia / Pensión (tenant específico) |
| **CMARJAV** | Pensión Inteligente (tenant específico, branding Marina/Oro) |
| **EVASOL** | Empresa matriz / engine principal |
| **SUITORG** | SuitOrg (plataforma, también un tenant DIOS) |
| **BDPR** | Base de Datos + Print (modo CampanasAI) |
| **SMMC** | Social Media Marketing Campaign (hoja de campañas) |
| **IDX** | Project IDX / Antigravity (IDE en la nube) |

[PENDIENTE: No hay definición formal de `tipo_negocio` (Alimentos/Servicios/Financiero) ni de los tipos de tenant específicos más allá de lo que se ve en tablas.]
