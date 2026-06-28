# Índice de Funciones — SuitOrg
**Generado:** 2026-06-16 | **Total archivos:** 50+ JS/GS

---

## `js/modules/core.js` — Estado global, carga de datos y utilidades base

| Línea | Función | Descripción |
|-------|---------|-------------|
| 13 | `app.apiUrl` | URL base de la API |
| 69 | `app.utils.fixDriveUrl` | Normaliza URLs de Google Drive |
| 87 | `app.utils.getEffectivePrice` | Obtiene precio efectivo de un producto |
| 93 | `app.utils.playNotification` | Reproduce sonido de notificación |
| 109 | `app.utils.playBuzz` | Reproduce sonido de error/buzz |
| 127 | `app.utils.playClick` | Reproduce sonido de click |
| 143 | `app.utils.getCoId` | Obtiene id_empresa de un objeto |
| 146 | `app.utils.sanitizeString` | Sanitiza strings para comparación |
| 158 | `app.utils.getTimestamp` | Obtiene timestamp actual |
| 162 | `app.utils.getDate` | Obtiene fecha formateada |
| 235 | `app.loadData` | Carga datos de backend/supabase |
| 299 | `app.state.dbEngine` | Determina motor DB (GSHEETS/SUPABASE) |
| 306 | `app.router.handleRoute` | Dispara ruteo inicial |
| 310 | `app.checkBackendVersion` | Verifica versión del backend |
| 364+ | `app.data` | Asigna datos cargados al state |
| 479 | `app.loadGalleryFromStorage` | Carga galería desde Storage |
| 513 | `app.switchCompany` | Cambia de empresa activa |

## `js/modules/router.js` — Navegación por hash y protección de rutas (RBAC)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 13 | `app.router.init` | Inicia listener de hashchange |
| 17 | `app.router.navigate` | Navega a un hash |
| 20 | `app.router.handleRoute` | Maneja ruteo: oculta secciones, protege rutas, renderiza vista activa |
| 55 | Detección modo sitio (HUB/SINGLE) | Decide qué empresa cargar |
| 92 | Detección páginas dinámicas | Busca en Config_Paginas |
| 143+ | Renderizado por hash | `#orbit`, `#home`, `#dashboard`, `#pos`, etc. |

## `js/modules/ui.js` — Renderizado UI, temas, consola y delegación

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `app.ui.updateConsole` | Agrega mensaje al panel de logs |
| 27 | `app.ui.scrollGallery` | Scroll de galería (wrapper) |
| 29 | `app.ui.scrollGalleryBySlot` | Scroll de galería por slots visibles |
| 55 | `app.ui.toggleLogs` | Muestra/oculta panel de logs |
| 71 | `app.ui.updateEstandarBarraST` | Actualiza barra de estado estándar |
| 104 | `app.ui.updateAiStatus` | Actualiza badge de estado IA |
| 154 | `app.ui.renderAgentAuditButton` | Renderiza botón de auditoría de agente |
| 158 | `app.ui.renderMarketingStrategyButton` | Renderiza botón de estrategia marketing |
| 313 | `app.ui.applyTheme` | Aplica tema visual (colores, logo, fondo) |
| 352+ | Delegaciones a módulos | `app.ui.renderPOS`, `app.ui.renderLeads`, etc. |
| 433+ | Delegaciones a public | `renderOrbit`, `renderHome`, `renderGallery`, etc. |
| 448+ | Delegaciones varias | `openAgentsModal`, `printTicket`, etc. |
| 562 | `app.ui.showLogin` | Muestra modal de login |
| 568 | `app.ui.fileToBase64` | Convierte archivo a base64 |
| 575 | `app.ui.bindEvents` | Enlaza eventos de UI |

## `js/modules/auth.js` — Autenticación, login/logout y RBAC

| Línea | Función | Descripción |
|-------|---------|-------------|
| 6 | `app.auth.login` | Autentica usuario email+password |
| 85 | `app.auth.logout` | Cierra sesión y limpia estado |
| 95 | `app.auth.showLogin` | Muestra modal de login |
| 103 | `app.auth.setLoggedInState` | Configura estado post-login (RBAC, módulos visibles) |
| 247 | `app.auth.setLoggedOutState` | Limpia estado al cerrar sesión |

## `js/modules/events.js` — Binding de eventos

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `app.events.init` | Inicia todos los bindings |
| 18 | `app.events.bindGlobal` | Eventos globales (click, teclado) |
| 34 | `app.events.bindLogin` | Eventos de formulario login |
| 108 | `app.events.bindForms` | Eventos de formularios (leads, productos, proyectos) |
| 174 | `app.events.bindUX` | Eventos de UX (tooltips, modales) |
| 493 | `app.events.bindNav` | Eventos de navegación y menú |
| 538 | `app.events.bindCatalog` | Eventos de catálogo |

## `js/modules/public.js` — Páginas públicas (Orbit Hub, Home, Galería, SEO, Contacto)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `app.public.showAboutUs` | Muestra modal "Acerca de" |
| 44 | `app.public.showPolicies` | Muestra políticas |
| 71 | `app.public.showReviews` | Muestra reseñas |
| 97 | `app.public.showLocation` | Muestra ubicación/mapa |
| 136 | `app.public.closeInfoModal` | Cierra modal de información |
| 143 | `app.public.startInfoInactivityTimer` | Inicia timer de inactividad |
| 166 | `app.public.stopInfoInactivityTimer` | Detiene timer de inactividad |
| 172 | `app.public.renderHome` | Renderiza vista Home de una empresa |
| 853 | `app.public.renderDynamicContent` | Renderiza página dinámica desde Config_Paginas |
| 917 | `app.public.showReservationModal` | Muestra modal de reservaciones |
| 1008 | `app.public.renderSEO` | Renderiza metadata SEO |
| 1117 | `app.public.updateMetadata` | Actualiza meta tags dinámicamente |
| 1237 | `app.public.renderFoodMenu` | Renderiza menú de comida |
| 1315 | `app.public.renderOrbit` | Renderiza Orbit Hub (selector de empresas) |
| 1536 | `app.public.renderFooter` | Renderiza footer |
| 1575 | `app.public.renderPillars` | Renderiza pilares/valores |
| 1592 | `app.public.renderGallery` | Renderiza galería |
| 1729 | `app.public.renderContact` | Renderiza formulario de contacto |
| 1955 | `app.public.toggleInsuranceFields` | Toggle campos de seguros |
| 1997 | `app.public.renderSuitOnboarding` | Renderiza onboarding |
| 2105 | `app.public.autoFillOnboarding` | Auto-completa onboarding |
| 2222 | `app.public.handleGallery3DTilt` | Efecto 3D tilt en galería |
| 2235 | `app.public.showGuestUploadModal` | Modal de subida para invitados |
| 2446 | `app.public.getFileIcon` | Icono según tipo MIME |
| 2497 | `app.public.refreshVaultStats` | Refresca estadísticas del vault |

## `js/modules/pos.js` — Punto de Venta

| Línea | Función | Descripción |
|-------|---------|-------------|
| 2 | `app.pos.addToCart` | Agrega producto al carrito |
| 27 | `app.pos.removeFromCart` | Quita producto del carrito |
| 36 | `app.pos.clearCart` | Vacía el carrito |
| 54 | `app.pos.updateCartVisuals` | Actualiza vista del carrito |
| 107 | `app.pos.renderTicketContent` | Renderiza contenido del ticket |
| 192 | `app.pos.updateLastSaleDisplay` | Muestra última venta |
| 559 | `app.pos.renderCartSummary` | Renderiza resumen del carrito |
| 587 | `app.pos.handlePayMethodChange` | Cambia método de pago |
| 618 | `app.pos.openCheckout` | Abre modal de checkout |
| 629 | `app.pos.nextStep` | Avance en pasos de checkout |
| 658 | `app.pos.closeCheckout` | Cierra checkout |
| 677 | `app.pos.renderExpressTicket` | Renderiza ticket exprés |
| 719 | `app.pos.setDeliveryMethod` | Cambia método de entrega |
| 736 | `app.pos.sendWhatsApp` | Envía confirmación por WhatsApp |
| 785 | `app.pos.openStaffCheckout` | Checkout para staff |
| 884 | `app.pos.showLastSale` | Muestra última venta |
| 899 | `app.pos.togglePosFolio` | Toggle folio POS |
| 921 | `app.pos.setPosPaymentMethod` | Cambia método pago en POS |
| 934 | `app.pos.setPublicPaymentMethod` | Cambia método pago público |
| 944 | `app.pos.autoLookupCustomer` | Busca cliente automáticamente |
| 985 | `app.pos.filterPOS` | Filtra órdenes por estatus |
| 994 | `app.pos.renderPOS` | Renderiza panel POS |
| 1115 | `app.pos.getPosActionButtons` | Botones de acción por estatus |
| 1145 | `app.pos.updateExternalOrderAlert` | Alerta de órdenes externas |
| 1182 | `app.pos.renderStaffPOS` | Renderiza POS para staff |
| 1264 | `app.pos.toggleStaffNav` | Toggle navegación staff |
| 1280 | `app.pos.fileToBase64` | Convierte archivo a base64 |
| 1288 | `app.pos.showOtpEntry` | Muestra ingreso de OTP |
| 1315 | `app.pos.closeOtpModal` | Cierra modal OTP |
| 1321 | `app.pos.printTicket` | Imprime ticket |
| 1382 | `app.pos.updateStaffChange` | Calcula cambio |
| 1397 | `app.pos.saveCart` | Guarda carrito en localStorage |
| 1409 | `app.pos.loadCart` | Carga carrito desde localStorage |

## `js/modules/admin.js` — Dashboard, reportes, leads, proyectos, catálogo

| Línea | Función | Descripción |
|-------|---------|-------------|
| 6 | `app.admin.renderDashboard` | Renderiza dashboard principal |
| 21 | `app.admin._renderDailySalesChart` | Gráfico de ventas diarias |
| 42 | `app.admin._renderPaymentMethodsChart` | Gráfico métodos de pago |
| 59 | `app.admin._renderMonthlyTrendChart` | Gráfico tendencia mensual |
| 83 | `app.admin.setReportMode` | Cambia modo de reporte |
| 106 | `app.admin.renderReportTabs` | Renderiza tabs de reportes |
| 145 | `app.admin.selectReportType` | Selecciona tipo de reporte |
| 156 | `app.admin.handleReportTypeChange` | Maneja cambio de tipo reporte |
| 174 | `app.admin.renderReport` | Renderiza reporte seleccionado |
| 286 | `app.admin._renderDynamicReport` | Reporte dinámico desde config |
| 351 | `app.admin._renderGeneralReport` | Reporte general de pagos |
| 397 | `app.admin._renderPaymentsReport` | Reporte de pagos detallado |
| 416 | `app.admin._renderProfitReport` | Reporte de ganancias |
| 420 | `app.admin._renderProductsReport` | Reporte de productos |
| 424 | `app.admin.exportReport` | Exporta reporte (CSV/PDF) |
| 486 | `app.admin.calculate` | Calcula widget de dashboard |
| 502 | `app.admin.renderChart` | Renderiza chart en canvas |
| 550 | `app.admin.openLeadModal` | Abre modal de lead |
| 560 | `app.admin.editLead` | Edita lead existente |
| 619 | `app.admin.renderLeads` | Renderiza tabla de leads |
| 680 | `app.admin.openProjectModal` | Abre modal de proyecto |
| 735 | `app.admin.renderProjects` | Renderiza tabla de proyectos |
| 805 | `app.admin.openProjectDetails` | Detalle de proyecto |
| 874 | `app.admin.switchProjectTab` | Cambia de tab en proyecto |
| 903 | `app.admin.renderCatalog` | Renderiza catálogo |
| 965 | `app.admin.editProductStock` | Edita stock de producto |
| 997 | `app.admin.openProductModal` | Abre modal de producto |
| 1041 | `app.admin.renderKnowledge` | Renderiza knowledge base |
| 1075 | `app.admin.renderQuotas` | Renderiza cuotas/cupos |

## `js/modules/agents.js` — Agentes IA, chat, diagnóstico

| Línea | Función | Descripción |
|-------|---------|-------------|
| 8 | `app.agents.normalizeModelName` | Normaliza nombre de modelo IA |
| 19 | `app.agents.getVisitorId` | Obtiene ID de visitante |
| 33 | `app.agents.run` | Ejecuta un agente por key |
| 239 | `app.agents.closeChat` | Cierra sesión de chat |
| 330 | `app.agents.triggerMicroAuthRepair` | Reparación de autenticación |
| 475 | `app.agents.addMessageToUI` | Agrega mensaje al UI del chat |
| 577 | `app.agents.processIntent` | Procesa intención del mensaje |
| 952 | `app.agents.debugLead` | Debug de lead |
| 966 | `app.agents.forceSave` | Forza guardado de lead |
| 975 | `app.agents.openAgentsModal` | Abre modal de agentes |
| 1010 | `app.agents.getAgentIcon` | Icono de agente |
| 1100 | `app.agents.updateAiProgress` | Actualiza barra de progreso IA |

---

## `backend/core.js` — Orquestador maestro GAS (doGet/doPost)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 12 | `setupOpenRouterKey` | Guarda API key de OpenRouter en ScriptProperties |
| 30 | `getSS` | Obtiene Spreadsheet activo por ID |
| 42 | `ejecutarConfiguracionManual` | Configuración manual (menú editor) |
| 53 | `doGet(e)` | Endpoint GET (ping, version, diagnostics, data) |
| 74 | `doPost(e)` | Endpoint POST (dispatcher de acciones) |
| 85 | `handlePostAction` | Enruta acción POST a su handler |

## `backend/database.js` — Inicialización y mantenimiento de DB

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `initializeDatabase(ss)` | Crea hojas y encabezados si no existen |
| 51 | `runAutoPurge(ss)` | Purga automática de datos antiguos |
| 63 | `ensureSeed(ss, sheetName, idCol, idVal, dataObj)` | Asegura que semilla exista |

## `backend/utils.js` — CRUD y utilidades de base de datos

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `getSheetData(ss, sheetName, filterId)` | Obtiene datos de una hoja |
| 26 | `appendRowMapped(ss, sheetName, dataObj)` | Agrega fila mapeada |
| 36 | `updateRowMapped(ss, sheetName, idCol, idVal, dataObj)` | Actualiza fila por ID |
| 52 | `updateRowMappedExtended(ss, sheetName, filters, dataObj)` | Actualiza con filtros múltiples |
| 72 | `deleteRowMapped(ss, sheetName, idCol, idVal)` | Borrado lógico (activo=FALSE) |
| 91 | `processTransaction(ss, data, output)` | Procesa transacción completa |
| 123 | `processTransactionSupabase(ss, data, output, coId)` | Transacción vía Supabase |
| 268 | `processTransactionGSheets(ss, data, output, isBackup)` | Transacción directa a GSheets |
| 345 | `syncToSupabase(ss, coId)` | Sincroniza datos a Supabase |

## `backend/ai_engine.js` — Motor de inferencia IA

| Línea | Función | Descripción |
|-------|---------|-------------|
| 3 | `runGeminiInference(data, output)` | Ejecuta inferencia con Gemini |
| 99 | `listAiModels()` | Lista modelos de IA disponibles |
| 113 | `runNotebookLMQuery(data, output)` | Consulta NotebookLM |

## `backend/DriveManager.js` — Gestión de Google Drive

| Línea | Función | Descripción |
|-------|---------|-------------|
| 5 | `initDriveStructure(idEmpresa)` | Inicializa estructura de carpetas |
| 25 | `_getOrCreateFolder(parent, name)` | Obtiene o crea carpeta hija |

## `backend/seeds_master.js`

| Línea | Función | Descripción |
|-------|---------|-------------|
| 7 | `runMasterSeeds(ss)` | Ejecuta todas las semillas maestras |

## `drive_manager.gs` — Gestión de Drive (legacy)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 12 | `initDriveStructure(idEmpresa)` | Inicializa estructura Drive |
| 59 | `crearCarpetaCliente(lead)` | Crea carpeta para cliente |
| 99 | `_getOrCreateFolder(parent, name)` | Obtiene/crea subcarpeta |
| 107 | `obtenerDocumentosCliente(folderId)` | Lista documentos del cliente |

---

## `app.js` — Orquestador legacy (mantenimiento y monitor)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 10 | `app.maintenance.resetCompany` | Reset de datos (God Mode) |
| 16 | `app.maintenance.viewLogs` | Muestra logs en consola |
| 25 | `app.monitor.start` | Watchdog: inactividad, sincronización cada 7.5s |

---

## `server.js` — Servidor Node.js Express (puerto 3001)

| Línea | Función | Descripción |
|-------|---------|-------------|
| 1-328 | Server setup | Express + Helmet + rutas: `/api/local/save`, `/api/db/*`, `/api/supabase/*`, static files |

---

## `CampanasAi/` — CMS, generación de campañas, landing pages

### `CampanasAi/script.js`

| Línea | Función | Descripción |
|-------|---------|-------------|
| 80 | `initCategoriaLookup` | Inicializa lookup de categorías |
| 96 | `getCategoriaIndustria` | Obtiene categoría por industria |
| 99 | `getEspecializaciones` | Obtiene especializaciones |
| 102 | `updateEspecializacionSelect` | Actualiza select de especialización |
| 119 | `suggestTheme` | Sugiere tema basado en industria |
| 128 | `showCategoriaHint` | Muestra hint de categoría |
| 260 | `loadGooglePickerAPI` | Carga Google Picker API |
| 281 | `openDrivePicker` | Abre selector de Drive |
| 337 | `hideDriveModal` | Cierra modal Drive |
| 667 | `updateActiveTab` | Cambia tab activo |
| 677 | `getFormData` | Obtiene datos del formulario |
| 696 | `autoToggleMultimedia` | Auto-toggle según formato |
| 711 | `validateFormData` | Valida datos del formulario |
| 724 | `setLoading` | Estado de carga general |
| 730 | `setAiLoading` | Estado de carga IA |
| 738 | `showToast` | Muestra notificación toast |
| 842 | `tryLoadImage` | Carga imagen con fallback |
| 918 | `renderHistory` | Renderiza historial |
| 1079 | `downloadFile` | Descarga archivo |
| 1104 | `speakText` | Texto a voz |
| 1211 | `populateCompanySelect` | Pobla select de empresas |
| 1223 | `setupCompanyAutoFill` | Auto-completado de empresa |
| 1264 | `setWorkMode` | Cambia modo de trabajo |
| 1329 | `normalizeDriveUrl` | Normaliza URL de Drive |
| 1492 | `regenerateSlideImage` | Regenera imagen de slide |
| 1583 | `toggleLogPanel` | Muestra/oculta panel de logs |

### `CampanasAi/backend.gs`

| Línea | Función | Descripción |
|-------|---------|-------------|
| 9 | `doGet(e)` | Endpoint GET (proxy) |
| 51 | `doPost(e)` | Endpoint POST (procesa campañas) |
| 123 | `successResponse` | Respuesta exitosa estándar |
| 129 | `errorResponse` | Respuesta de error estándar |

### `CampanasAi/local-server-node.js`

| Línea | Función | Descripción |
|-------|---------|-------------|
| 15 | `serverLog` | Log del servidor |
| 22 | `normalizeDriveUrl` | Normaliza URL de Drive |
| 486 | `fetchFollowingRedirects` | Fetch con redirects |
| 610 | `fetchWithRedirects` | Fetch wrapper con redirects |

---

## `citas/` — Módulo de citas y reservaciones

| Archivo | Función/Línea | Descripción |
|---------|---------------|-------------|
| `handlers/actions.js:6` | `nextId(prefix, lastNum)` | Genera ID secuencial |
| `services/ai.js:6` | `buildPrompt(empresa, historial)` | Construye prompt para IA |
| `services/whatsapp.js:6` | `sendMessage(to, text, phoneId, token)` | Envía WhatsApp |
| `services/whatsapp.js:39` | `parseIncoming(payload)` | Parsea mensaje entrante |

---

## `scripts/` — Utilidades y orquestación

| Archivo | Función/Línea | Descripción |
|---------|---------------|-------------|
| `orchestrator_client.js:3` | `callByUrl(url, payload)` | Llama orquestador por URL |
| `agents/vision-audit.js` | Auditoría visual de elementos |

## `Documentacion/migracion_datos.js`

| Línea | Función | Descripción |
|-------|---------|-------------|
| 77 | `escapeSql(value)` | Escapa valores para SQL |
| 105 | `toJsonIfNeeded(value)` | Convierte a JSON si es necesario |
| 129 | `generateMigrationSQL()` | Genera script de migración SQL |

---

> **📖 Cómo usar este índice:** Busca aquí la función que necesitas para saber archivo y línea exacta. La IA leerá esto para ir directo al código sin escanear todo el proyecto.
> **🔄 Para actualizar después de cambios:** Ejecuta `node scripts/generate-index.js`
