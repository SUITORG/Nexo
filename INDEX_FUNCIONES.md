# Índice de Funciones — SuitOrg
**Generado:** 2026-07-08 | **Total archivos:** 65 JS/GS

## `app.js`

| Línea | Función |
|-------|---------|
| 10 | `resetCompany` |
| 16 | `viewLogs` |
| 25 | `start` |

## `Citas/handlers/actions.js`

| Línea | Función |
|-------|---------|
| 6 | `nextId` |

## `Citas/services/ai.js`

| Línea | Función |
|-------|---------|
| 6 | `buildPrompt` |

## `Citas/services/whatsapp.js`

| Línea | Función |
|-------|---------|
| 6 | `sendMessage` |
| 39 | `parseIncoming` |

## `Conecionpagos/index.js`

| Línea | Función |
|-------|---------|
| 10 | `getStripeInstance` |
| 23 | `getPublishableKey` |

## `drive_manager.gs`

| Línea | Función |
|-------|---------|
| 12 | `initDriveStructure` |
| 59 | `crearCarpetaCliente` |
| 99 | `_getOrCreateFolder` |
| 107 | `obtenerDocumentosCliente` |

## `PresentacionesVid/bdpv-generator.js`

| Línea | Función |
|-------|---------|
| 28 | `shuffleArray` |
| 37 | `getRandomPhotos` |
| 44 | `buildPrompt` |
| 147 | `openPresentation` |

## `Prospectos/prospect.js`

| Línea | Función |
|-------|---------|
| 23 | `httpGet` |
| 37 | `sleep` |
| 41 | `slugify` |
| 45 | `now` |
| 50 | `getSupabase` |
| 149 | `analyzeDigitalPresence` |
| 166 | `analyzeStrengths` |
| 200 | `detectSocialFromPlace` |
| 215 | `inferTargetAudience` |
| 249 | `getWhatsapp` |
| 256 | `formatCell` |
| 382 | `tipoNegocio` |

## `server.js`

| Línea | Función |
|-------|---------|
| 416 | `validarGiro` |
| 425 | `cotizadorAuth` |

## `backend/`

### `backend/ai_engine.js`

| Línea | Función |
|-------|---------|
| 3 | `runGeminiInference` |
| 10 | `modelsToTry` |
| 99 | `listAiModels` |
| 113 | `runNotebookLMQuery` |

### `backend/core.js`

| Línea | Función |
|-------|---------|
| 12 | `setupOpenRouterKey` |
| 32 | `getSS` |
| 44 | `ejecutarConfiguracionManual` |
| 55 | `doGet` |
| 76 | `doPost` |
| 87 | `handlePostAction` |

### `backend/database.js`

| Línea | Función |
|-------|---------|
| 7 | `initializeDatabase` |
| 72 | `runAutoPurge` |
| 84 | `ensureSeed` |

### `backend/DriveManager.js`

| Línea | Función |
|-------|---------|
| 5 | `initDriveStructure` |
| 25 | `_getOrCreateFolder` |

### `backend/seeds_master.js`

| Línea | Función |
|-------|---------|
| 7 | `runMasterSeeds` |

### `backend/utils.js`

| Línea | Función |
|-------|---------|
| 7 | `getSheetData` |
| 26 | `appendRowMapped` |
| 36 | `updateRowMapped` |
| 52 | `updateRowMappedExtended` |
| 72 | `deleteRowMapped` |
| 91 | `processTransaction` |
| 123 | `processTransactionSupabase` |
| 269 | `processTransactionGSheets` |
| 346 | `syncToSupabase` |


## `CampanasAi/`

### `CampanasAi/backend.gs`

| Línea | Función |
|-------|---------|
| 9 | `doGet` |
| 51 | `doPost` |
| 123 | `successResponse` |
| 129 | `errorResponse` |

### `CampanasAi/local-server-node.js`

| Línea | Función |
|-------|---------|
| 16 | `serverLog` |
| 23 | `normalizeDriveUrl` |
| 928 | `fetchFollowingRedirects` |
| 1061 | `fetchWithRedirects` |

### `CampanasAi/script.js`

| Línea | Función |
|-------|---------|
| 28 | `getCategoriaIndustria` |
| 31 | `getEspecializaciones` |
| 34 | `updateEspecializacionSelect` |
| 105 | `initCategoriaLookup` |
| 121 | `suggestTheme` |
| 130 | `showCategoriaHint` |
| 262 | `loadGooglePickerAPI` |
| 283 | `openDrivePicker` |
| 286 | `showDriveModalFallback` |
| 291 | `hideDriveModal` |
| 462 | `subclasificaciones` |
| 894 | `updateActiveTab` |
| 904 | `getFormData` |
| 923 | `autoToggleMultimedia` |
| 938 | `validateFormData` |
| 951 | `setLoading` |
| 957 | `setAiLoading` |
| 965 | `showToast` |
| 1069 | `tryLoadImage` |
| 1145 | `renderHistory` |
| 1178 | `resetFormErrors` |
| 1306 | `downloadFile` |
| 1331 | `speakText` |
| 1358 | `stopAll` |
| 1438 | `populateCompanySelect` |
| 1450 | `setupCompanyAutoFill` |
| 1453 | `handler` |
| 1459 | `findVal` |
| 1491 | `setWorkMode` |
| 1872 | `normalizeDriveUrl` |
| 2038 | `regenerateSlideImage` |
| 2130 | `toggleLogPanel` |


## `CampanasAi/scripts/`

### `CampanasAi/scripts/agent-tendencias.js`

| Línea | Función |
|-------|---------|
| 299 | `log` |

### `CampanasAi/scripts/sync-gas.js`

| Línea | Función |
|-------|---------|
| 9 | `postToGAS` |

### `CampanasAi/scripts/trend-research.js`

| Línea | Función |
|-------|---------|
| 14 | `getCacheKey` |
| 18 | `readCache` |
| 27 | `writeCache` |
| 47 | `extractTrends` |
| 51 | `add` |
| 81 | `extractTrendsFromIA` |


## `Documentacion/`

| Línea | Función | Archivo |
|-------|---------|--------|
| 77 | `escapeSql` | `migracion_datos.js` |
| 105 | `toJsonIfNeeded` | `migracion_datos.js` |
| 129 | `generateMigrationSQL` | `migracion_datos.js` |

## `js/modules/`

### `js/modules/admin.js`

| Línea | Función |
|-------|---------|
| 6 | `renderDashboard` |
| 21 | `_renderDailySalesChart` |
| 42 | `_renderPaymentMethodsChart` |
| 59 | `_renderMonthlyTrendChart` |
| 83 | `setReportMode` |
| 106 | `renderReportTabs` |
| 126 | `dynamicList` |
| 145 | `selectReportType` |
| 156 | `handleReportTypeChange` |
| 174 | `renderReport` |
| 189 | `allProjects` |
| 190 | `allPayments` |
| 195 | `safeParse` |
| 224 | `id_pago` |
| 277 | `config` |
| 286 | `_renderDynamicReport` |
| 287 | `cols` |
| 288 | `labels` |
| 351 | `_renderGeneralReport` |
| 397 | `_renderPaymentsReport` |
| 416 | `_renderProfitReport` |
| 420 | `_renderProductsReport` |
| 424 | `exportReport` |
| 430 | `renderBusinessDashboard` |
| 435 | `widgets` |
| 486 | `calculate` |
| 487 | `data` |
| 502 | `renderChart` |
| 506 | `rawData` |
| 550 | `openLeadModal` |
| 560 | `editLead` |
| 575 | `saveLead` |
| 590 | `fecha` |
| 591 | `fecha_actualizacion` |
| 619 | `renderLeads` |
| 627 | `list` |
| 663 | `deleteLead` |
| 680 | `openProjectModal` |
| 685 | `filteredLeads` |
| 695 | `saveProject` |
| 735 | `renderProjects` |
| 743 | `list` |
| 751 | `client` |
| 761 | `flow` |
| 792 | `deleteProject` |
| 805 | `openProjectDetails` |
| 812 | `stages` |
| 813 | `flow` |
| 820 | `logs` |
| 874 | `switchProjectTab` |
| 881 | `updateProjectStatus` |
| 903 | `renderCatalog` |
| 912 | `modules` |
| 922 | `list` |
| 965 | `editProductStock` |
| 972 | `saveProductStock` |
| 984 | `deleteProduct` |
| 997 | `openProductModal` |
| 1016 | `saveProduct` |
| 1041 | `renderKnowledge` |
| 1057 | `syncKnowledge` |
| 1075 | `renderQuotas` |
| 1084 | `quotas` |
| 1099 | `addProjectStage` |
| 1123 | `toggleStage` |
| 1126 | `etapa` |
| 1146 | `addProjectPayment` |
| 1172 | `addProjectManualLog` |
| 1179 | `internalAddLog` |

### `js/modules/agents.js`

| Línea | Función |
|-------|---------|
| 8 | `normalizeModelName` |
| 19 | `getVisitorId` |
| 33 | `run` |
| 34 | `agent` |
| 47 | `select` |
| 48 | `agt` |
| 158 | `fetchMemory` |
| 180 | `saveMemory` |
| 211 | `logInteraction` |
| 239 | `closeChat` |
| 248 | `handleFileUpload` |
| 257 | `diagnoseAi` |
| 271 | `company` |
| 330 | `triggerMicroAuthRepair` |
| 334 | `sendMessage` |
| 356 | `currentLead` |
| 439 | `seoItem` |
| 475 | `addMessageToUI` |
| 519 | `humanTyping` |
| 547 | `sendSupportTicket` |
| 577 | `processIntent` |
| 681 | `lastBotMsg` |
| 734 | `saveLead` |
| 763 | `existe` |
| 952 | `debugLead` |
| 956 | `enCache` |
| 966 | `forceSave` |
| 975 | `openAgentsModal` |
| 1010 | `getAgentIcon` |
| 1029 | `checkAiHealth` |
| 1040 | `company` |
| 1100 | `updateAiProgress` |
| 1117 | `generateMarketingPlan` |
| 1122 | `seoData` |
| 1123 | `pagesData` |
| 1124 | `notebook` |
| 1179 | `catalog` |
| 1218 | `callOpenRouterAI` |

### `js/modules/auth.js`

| Línea | Función |
|-------|---------|
| 6 | `login` |
| 9 | `getVal` |
| 13 | `user` |
| 31 | `existsAnywhere` |
| 85 | `logout` |
| 95 | `showLogin` |
| 103 | `setLoggedInState` |
| 104 | `getVal` |
| 124 | `roleConfig` |
| 247 | `setLoggedOutState` |

### `js/modules/core.js`

| Línea | Función |
|-------|---------|
| 69 | `fixDriveUrl` |
| 87 | `getEffectivePrice` |
| 93 | `playNotification` |
| 109 | `playBuzz` |
| 127 | `playClick` |
| 143 | `getCoId` |
| 146 | `sanitizeString` |
| 158 | `getTimestamp` |
| 162 | `getDate` |
| 167 | `loadEnvConfig` |
| 192 | `init` |
| 277 | `mainBiz` |
| 373 | `checkBackendVersion` |
| 391 | `loadData` |
| 408 | `currentBiz` |
| 437 | `loadFromSupabase` |
| 478 | `loadGalleryFromStorage` |
| 540 | `switchCompany` |
| 598 | `createAgentTask` |
| 628 | `saveRecord` |

### `js/modules/cotizador.js`

| Línea | Función |
|-------|---------|
| 5 | `getSupabase` |
| 17 | `tieneGiroHabilitado` |
| 31 | `soloHabilitado` |
| 39 | `calcularPrecio` |
| 73 | `evaluarCondicion` |

### `js/modules/events.js`

| Línea | Función |
|-------|---------|
| 7 | `init` |
| 18 | `bindGlobal` |
| 34 | `bindLogin` |
| 108 | `bindForms` |
| 174 | `bindUX` |
| 194 | `_handleNewLead` |
| 206 | `toTitleCase` |
| 219 | `fecha` |
| 220 | `fecha_actualizacion` |
| 260 | `_handleNewProduct` |
| 267 | `toTitleCase` |
| 308 | `_handleNewProject` |
| 315 | `toTitleCase` |
| 354 | `_handlePublicLead` |
| 363 | `toTitleCase` |
| 372 | `existingLead` |
| 493 | `bindNav` |
| 498 | `app.ui.toggleMenu` |
| 538 | `bindCatalog` |

### `js/modules/pos.js`

| Línea | Función |
|-------|---------|
| 10 | `init` |
| 13 | `app.pos.stripe._initPromise` |
| 26 | `mountStripeFields` |
| 47 | `handleChange` |
| 57 | `unmount` |
| 68 | `processPayment` |
| 92 | `isActivo` |
| 101 | `syncVisibility` |
| 124 | `addToCart` |
| 149 | `removeFromCart` |
| 158 | `clearCart` |
| 176 | `updateCartVisuals` |
| 229 | `renderTicketContent` |
| 257 | `checkoutStaff` |
| 314 | `updateLastSaleDisplay` |
| 337 | `checkout` |
| 385 | `nivel_crm` |
| 510 | `_checkoutSupabase` |
| 702 | `renderCartSummary` |
| 730 | `handlePayMethodChange` |
| 765 | `openCheckout` |
| 776 | `nextStep` |
| 805 | `closeCheckout` |
| 824 | `renderExpressTicket` |
| 866 | `setDeliveryMethod` |
| 883 | `sendWhatsApp` |
| 932 | `openStaffCheckout` |
| 943 | `updateOrderStatus` |
| 1031 | `showLastSale` |
| 1046 | `togglePosFolio` |
| 1083 | `setPosPaymentMethod` |
| 1097 | `setPublicPaymentMethod` |
| 1108 | `autoLookupCustomer` |
| 1119 | `lead` |
| 1149 | `filterPOS` |
| 1158 | `renderPOS` |
| 1175 | `allForCounters` |
| 1198 | `list` |
| 1234 | `pay` |
| 1279 | `getPosActionButtons` |
| 1309 | `updateExternalOrderAlert` |
| 1328 | `isExternal` |
| 1346 | `renderStaffPOS` |
| 1353 | `items` |
| 1428 | `toggleStaffNav` |
| 1444 | `fileToBase64` |
| 1452 | `showOtpEntry` |
| 1463 | `verifyOtp` |
| 1479 | `closeOtpModal` |
| 1485 | `printTicket` |
| 1546 | `updateStaffChange` |
| 1561 | `saveCart` |
| 1573 | `loadCart` |

### `js/modules/public.js`

| Línea | Función |
|-------|---------|
| 7 | `showAboutUs` |
| 44 | `showPolicies` |
| 71 | `showReviews` |
| 97 | `showLocation` |
| 136 | `closeInfoModal` |
| 143 | `startInfoInactivityTimer` |
| 159 | `resetFn` |
| 166 | `stopInfoInactivityTimer` |
| 172 | `renderHome` |
| 188 | `pageData` |
| 519 | `gallery` |
| 602 | `updateStory` |
| 805 | `dynamicPages` |
| 853 | `renderDynamicContent` |
| 917 | `showReservationModal` |
| 970 | `submitReservation` |
| 1008 | `renderSEO` |
| 1013 | `seoData` |
| 1056 | `keywords` |
| 1117 | `updateMetadata` |
| 1132 | `seoList` |
| 1144 | `pageData` |
| 1169 | `updateMeta` |
| 1211 | `pageDataForSchema` |
| 1237 | `renderFoodMenu` |
| 1243 | `render` |
| 1246 | `items` |
| 1315 | `renderOrbit` |
| 1327 | `companies` |
| 1433 | `vx` |
| 1434 | `vy` |
| 1464 | `update` |
| 1537 | `renderFooter` |
| 1576 | `renderPillars` |
| 1593 | `renderGallery` |
| 1611 | `imgs` |
| 1725 | `toggleMobileTicket` |
| 1730 | `renderContact` |
| 1893 | `existing` |
| 1956 | `toggleInsuranceFields` |
| 1998 | `renderSuitOnboarding` |
| 2106 | `autoFillOnboarding` |
| 2159 | `submitOnboarding` |
| 2223 | `handleGallery3DTilt` |
| 2236 | `showGuestUploadModal` |
| 2261 | `processGuestFile` |
| 2274 | `loadScript` |
| 2382 | `refresh` |
| 2399 | `userLead` |
| 2447 | `getFileIcon` |
| 2456 | `handleFiles` |
| 2498 | `refreshVaultStats` |

### `js/modules/router.js`

| Línea | Función |
|-------|---------|
| 13 | `init` |
| 17 | `navigate` |
| 20 | `handleRoute` |
| 93 | `isDynamic` |

### `js/modules/ui.js`

| Línea | Función |
|-------|---------|
| 7 | `updateConsole` |
| 27 | `scrollGallery` |
| 29 | `scrollGalleryBySlot` |
| 55 | `toggleLogs` |
| 71 | `updateEstandarBarraST` |
| 158 | `renderAgentAuditButton` |
| 194 | `renderMarketingStrategyButton` |
| 234 | `triggerMarketingStrategy` |
| 278 | `triggerAgentAudit` |
| 313 | `applyTheme` |
| 352 | `renderPOS` |
| 353 | `renderStaffPOS` |
| 354 | `filterPOS` |
| 355 | `updateExternalOrderAlert` |
| 357 | `renderLeads` |
| 358 | `openLeadModal` |
| 359 | `saveLead` |
| 360 | `deleteLead` |
| 362 | `renderProjects` |
| 363 | `openProjectModal` |
| 364 | `saveProject` |
| 365 | `openProjectDetails` |
| 366 | `deleteProject` |
| 367 | `addProjectStage` |
| 368 | `toggleStage` |
| 369 | `addProjectPayment` |
| 370 | `addProjectManualLog` |
| 372 | `renderCatalog` |
| 373 | `openProductModal` |
| 374 | `saveProduct` |
| 375 | `deleteProduct` |
| 376 | `editProductStock` |
| 378 | `renderKnowledge` |
| 379 | `saveKnowledgeManual` |
| 380 | `syncKnowledge` |
| 382 | `renderQuotas` |
| 383 | `renderDashboard` |
| 384 | `renderReport` |
| 385 | `handleReportTypeChange` |
| 386 | `setReportMode` |
| 387 | `selectReportType` |
| 388 | `exportReport` |
| 389 | `renderBusinessDashboard` |
| 391 | `renderReservations` |
| 433 | `renderOrbit` |
| 434 | `renderPillars` |
| 435 | `renderFoodMenu` |
| 436 | `renderSEO` |
| 437 | `renderHome` |
| 438 | `renderGallery` |
| 439 | `renderFooter` |
| 440 | `showAboutUs` |
| 441 | `showPolicies` |
| 442 | `showReviews` |
| 443 | `showLocation` |
| 444 | `closeInfoModal` |
| 445 | `renderContact` |
| 448 | `openAgentsModal` |
| 451 | `printTicket` |
| 452 | `setPublicPaymentMethod` |
| 453 | `setPosPaymentMethod` |
| 454 | `toggleMobileTicket` |
| 456 | `syncTopLuxDrive` |
| 478 | `syncSupabase` |
| 548 | `refreshData` |
| 562 | `showLogin` |
| 563 | `showOtpEntry` |
| 564 | `verifyOtp` |
| 565 | `closeOtpModal` |
| 568 | `fileToBase64` |
| 575 | `bindEvents` |


## `scripts/`

### `scripts/generate-index.js`

| Línea | Función |
|-------|---------|
| 26 | `categorizeFile` |
| 33 | `scanFiles` |
| 47 | `extractFunctions` |
| 95 | `buildIndex` |

### `scripts/orchestrator_client.js`

| Línea | Función |
|-------|---------|
| 3 | `callByUrl` |

### `scripts/whatsapp-test.js`

| Línea | Función |
|-------|---------|
| 31 | `send` |


---
> **Auto-generado por `scripts/generate-index.js`** — Ejecuta `node scripts/generate-index.js` para actualizar.
