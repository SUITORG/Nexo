---
description: Dame el nuevo mapeo completo de ui.js por clasificación, cantidad de lineas y tablas de datos.
---

# 🕵️ Workflow: 1Consulta (Mapeo de ui.js)

Este workflow realiza un análisis exhaustivo de la estructura del archivo `ui.js`, clasificando sus funciones, contando líneas y vinculándolas con las tablas de datos del backend.

## 📊 Mapeo Maestro de ui.js (v16.7.23)

| Clasificación | Modulo/Responsabilidad | Funciones Clave Activas | Tablas Mapeadas Vía Core |
| :--- | :--- | :--- | :--- |
| **Núcleo (System UI)** | Barra ST, Consola, Temas | `updateConsole`, `updateEstandarBarraST`, `applyTheme`, `toggleLogs`, `bindEvents` | `Config_Empresas`, `Logs` |
| **Catálogo & Public** | Renderizado de Vistas | `renderCatalog`, `renderOrbit`, `renderHome`, `renderSEO`, `renderGallery` | `Config_SEO`, `Catalogo` |
| **Navegación Táctica** | Carruseles y Modales | `scrollGallery`, `showAboutUs`, `showLocation`, `closeInfoModal` | N/A |
| **Inteligencia (AI)** | Interfaz de Agentes | `renderAgentAuditButton`, `renderMarketingStrategyButton`, `openAgentsModal` | `Prompts_IA` |
| **Operación POS** | Monitores y Tickets | `renderPOS`, `renderStaffPOS`, `printTicket`, `setPosPaymentMethod`, `updateExternalOrderAlert` | `Proyectos`, `Cobros` |
| **Gestión CRM** | Leads y Proyectos | `renderLeads`, `renderProjects`, `openProjectDetails`, `toggleStage`, `addProjectPayment` | `Leads`, `Proyectos` |
| **Finanzas & SaaS** | Dashboard y Cuotas | `renderDashboard`, `renderReport`, `exportReport`, `renderQuotas` | `Cuotas_Pagos` |
| **Knowledge Base** | Wiki Documental | `renderKnowledge`, `syncKnowledge` | `Empresa_Documentos` |
| **Seguridad OTP** | Auth y Webhooks | `showLogin`, `showOtpEntry`, `verifyOtp` | `Usuarios` |

## 📐 Estadísticas Generales
- **Líneas Totales:** 540 líneas (Reducción por modularización Multi-Tenant desde 2,549 líneas).
- **Clasificaciones:** 9 áreas de renderizado visual puro.
- **Tamaño del Archivo:** ~24 KB brutos (`24141 bytes`).
- **Estado de Orquestación:** Limpio y encapsulado como Capa UI Glue.

---
*Generado por Suit.Org Orchestrator v16.7.23*
