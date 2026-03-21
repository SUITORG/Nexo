---
description: Dame el nuevo mapeo completo de ui.js por clasificación, cantidad de lineas y tablas de datos.
---

# 🕵️ Workflow: 1Consulta (Mapeo de ui.js)

Este workflow realiza un análisis exhaustivo de la estructura del archivo `ui.js`, clasificando sus funciones, contando líneas y vinculándolas con las tablas de datos del backend.

## 📊 Mapeo Maestro de ui.js (v4.6.9)

| Clasificación | Módulo Aplicable | Total Líneas | Funciones Clave | Tablas de Datos Vinculadas |
| :--- | :--- | :--- | :--- | :--- |
| **Core & Auth** | `config` | **226** | `applyTheme`, `setLoggedInState`, `showLogin` | `Config_Empresas`, `Config_Roles`, `Usuarios` |
| **Puntales de Public (API)** | `config` | **12** | `renderHome`, `renderSEO`, `renderOrbit` | `Config_SEO`, `Config_Empresas` |
| **Monitor POS & Ventas** | `pos`, `staff-pos` | **601** | `renderPOS`, `filterPOS`, `renderStaffPOS` | `Proyectos`, `Leads`, `Catalogo` |
| **Motor de Reportes** | `dashboard`, `reports` | **505** | `renderReport`, `renderDashboard` | `Proyectos_Pagos`, `Proyectos` |
| **Gestión CRM** | `leads`, `projects` | **355** | `renderLeads`, `renderProjects` | `Leads`, `Proyectos` |
| **Base de Conocimientos** | `knowledge` | **154** | `renderKnowledge`, `syncKnowledge` | `Empresa_Documentos` |
| **Catálogo CRUD** | `catalog`, `catalog_add`, `catalog_edit`, `catalog_delete`, `catalog_stock` | **291** | `renderCatalog`, `saveProduct`, `deleteProduct` | `Catalogo` |
| **Sistema & Admin** | `config` | **260** | `updateConsole`, `toggleLogs`, `repairDatabase` | `Logs`, `Config_Empresas` |
| **Seguridad Delivery (OTP)** | `pos` | **72** | `showOtpEntry`, `verifyOtp` | `Proyectos` |
| **Gestión de Cuotas SaaS** | `quotas` | **59** | `renderQuotas` | `Cuotas_Pagos` |
| **IA Agentes** | `agents` | **112** | `openAgentsModal`, `getAgentIcon` | `Prompts_IA` |

## 📐 Estadísticas Generales
- **Líneas Totales:** ~2,549 líneas.
- **Clasificaciones:** 11 áreas funcionales.
- **Tablas Mapeadas:** +14 tablas de Google Sheets.

---
*Generado por Suit.Org Orchestrator v4.7.0*
