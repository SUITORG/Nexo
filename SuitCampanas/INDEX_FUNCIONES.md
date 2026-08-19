# Índice de Funciones — SuitOrg
**Generado:** 2026-07-28 | **Total archivos:** 449 JS/GS

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
| 11 | `getLastId` |
| 24 | `findOrCreateClient` |
| 39 | `getChatHistory` |
| 50 | `saveChatLog` |
| 60 | `scheduleAppointment` |
| 110 | `cancelAppointment` |
| 143 | `processCancelAndNotifyWaitlist` |
| 159 | `rescheduleAppointment` |
| 203 | `addToWaitlist` |
| 214 | `getEmpresaByPhone` |

## `Citas/handlers/webhook.js`

| Línea | Función |
|-------|---------|
| 9 | `handleIncoming` |

## `Citas/services/ai.js`

| Línea | Función |
|-------|---------|
| 6 | `buildPrompt` |
| 45 | `detectIntent` |

## `Citas/services/calendar.js`

| Línea | Función |
|-------|---------|
| 4 | `getClient` |
| 13 | `createEvent` |
| 27 | `updateEvent` |
| 42 | `deleteEvent` |

## `Citas/services/notifier.js`

| Línea | Función |
|-------|---------|
| 6 | `notify` |

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
| 27 | `createPaymentIntent` |
| 45 | `confirmPayment` |
| 56 | `handleWebhook` |

## `drive_manager.gs`

| Línea | Función |
|-------|---------|
| 12 | `initDriveStructure` |
| 59 | `crearCarpetaCliente` |
| 99 | `_getOrCreateFolder` |
| 107 | `obtenerDocumentosCliente` |

## `gas-client.js`

| Línea | Función |
|-------|---------|
| 11 | `getAuth` |
| 24 | `runFunction` |
| 39 | `getContent` |
| 48 | `updateContent` |

## `google-sheets.js`

| Línea | Función |
|-------|---------|
| 8 | `getClient` |
| 18 | `readSheet` |
| 27 | `writeSheet` |
| 38 | `appendSheet` |

## `PresentacionesVid/bdpv-generator.js`

| Línea | Función |
|-------|---------|
| 28 | `shuffleArray` |
| 37 | `getRandomPhotos` |
| 44 | `buildPrompt` |
| 106 | `generatePresentation` |
| 147 | `openPresentation` |

## `Prospectos/prospect.js`

| Línea | Función |
|-------|---------|
| 23 | `httpGet` |
| 37 | `sleep` |
| 41 | `slugify` |
| 45 | `now` |
| 50 | `getSupabase` |
| 58 | `listIndustrias` |
| 73 | `findNicho` |
| 90 | `searchPlaces` |
| 110 | `getPlaceDetails` |
| 123 | `extractSocialFromWebsite` |
| 149 | `analyzeDigitalPresence` |
| 166 | `analyzeStrengths` |
| 200 | `detectSocialFromPlace` |
| 215 | `inferTargetAudience` |
| 249 | `getWhatsapp` |
| 256 | `formatCell` |
| 262 | `main` |
| 382 | `tipoNegocio` |

## `server.js`

| Línea | Función |
|-------|---------|
| 411 | `proxyCotizador` |
| 538 | `yahooFetch` |
| 556 | `fetchQuoteV8` |

## `SuitAI/handlers/api.js`

| Línea | Función |
|-------|---------|
| 5 | `health` |
| 15 | `listModels` |
| 38 | `refreshModels` |
| 48 | `chat` |
| 65 | `circuitStatus` |

## `SuitAI/services/circuitBreaker.js`

| Línea | Función |
|-------|---------|
| 7 | `recordSuccess` |
| 16 | `recordFailure` |
| 28 | `isAvailable` |
| 35 | `getStatus` |
| 46 | `getAllStatus` |

## `SuitAI/services/modelRouter.js`

| Línea | Función |
|-------|---------|
| 8 | `buildRequest` |
| 18 | `callDirectGoogle` |
| 56 | `callModel` |
| 102 | `route` |

## `SuitAI/services/modelScanner.js`

| Línea | Función |
|-------|---------|
| 11 | `fetchJson` |
| 27 | `pingModel` |
| 64 | `parseOpenRouterModels` |
| 85 | `parseOpenCodeZenModels` |
| 104 | `parseOmniRouteModels` |
| 125 | `scanOpenRouter` |
| 136 | `scanOpenCodeZen` |
| 151 | `scanOmniRoute` |
| 162 | `verifyModels` |
| 188 | `scan` |
| 213 | `getCached` |
| 217 | `clearCache` |

## `SuitChatTG/db/gas-client.js`

| Línea | Función |
|-------|---------|
| 4 | `callGAS` |
| 14 | `getPrompt` |
| 23 | `getAgentByEmpresa` |
| 32 | `getLeadByVisitor` |
| 36 | `createLead` |
| 40 | `updateLead` |
| 44 | `saveMemory` |
| 48 | `getMemory` |
| 52 | `saveConversationLog` |
| 56 | `getEmpresaConfig` |

## `SuitChatTG/handlers/ai.js`

| Línea | Función |
|-------|---------|
| 24 | `buildMessages` |
| 33 | `tryGemini` |
| 67 | `tryOpenRouter` |
| 95 | `tryOpenAICompatible` |
| 116 | `isGeminiModel` |
| 120 | `isOpenRouterModel` |
| 126 | `tryModel` |
| 140 | `askAI` |

## `SuitChatTG/handlers/leads.js`

| Línea | Función |
|-------|---------|
| 3 | `extractLeadData` |
| 34 | `ensureLead` |

## `SuitChatTG/handlers/memory.js`

| Línea | Función |
|-------|---------|
| 3 | `getVisitorId` |
| 7 | `loadMemory` |
| 11 | `history` |
| 25 | `saveMemorySnapshot` |
| 41 | `logInteraction` |

## `SuitChatTG/handlers/menu.js`

| Línea | Función |
|-------|---------|
| 27 | `sendMainMenu` |
| 31 | `sendContactPrompt` |
| 38 | `sendBackMenu` |

## `SuitChatTG/handlers/telegram.js`

| Línea | Función |
|-------|---------|
| 9 | `getSession` |
| 27 | `loadAgentForEmpresa` |
| 50 | `handleStart` |
| 72 | `handleMessage` |
| 151 | `handleContact` |
| 174 | `setup` |

## `SuitCotizador/public/js/admin.js`

| Línea | Función |
|-------|---------|
| 4 | `adminFetch` |
| 19 | `initAdmin` |
| 39 | `cambiarTab` |
| 50 | `cargarProcesos` |
| 72 | `mostrarModalProceso` |
| 91 | `guardarProceso` |
| 104 | `eliminarProceso` |
| 114 | `cargarVariables` |
| 134 | `cargarVariablesProceso` |
| 158 | `mostrarModalVariable` |
| 178 | `guardarVariable` |
| 199 | `eliminarVariable` |
| 209 | `cargarReglas` |
| 229 | `cargarReglasProceso` |
| 254 | `mostrarModalRegla` |
| 265 | `guardarRegla` |
| 282 | `eliminarRegla` |
| 292 | `cerrarModal` |

## `SuitCotizador/public/js/cotizador.js`

| Línea | Función |
|-------|---------|
| 6 | `getParams` |
| 16 | `apiFetch` |
| 31 | `tieneGiroHabilitado` |
| 42 | `init` |
| 73 | `cargarApp` |
| 84 | `cargarEmpresa` |
| 104 | `renderizarPortal` |
| 132 | `iniciarCotizacion` |
| 171 | `calcularYMostrar` |
| 208 | `guardarYMostrar` |

## `SuitCotizador/run-migration.js`

| Línea | Función |
|-------|---------|
| 8 | `runQuery` |
| 24 | `sleep` |
| 28 | `splitTopLevel` |
| 81 | `main` |

## `SuitCotizador/seed-procesos.js`

| Línea | Función |
|-------|---------|
| 71 | `getNextId` |
| 78 | `main` |

## `SuitCotizador/server.js`

| Línea | Función |
|-------|---------|
| 22 | `validarGiro` |
| 31 | `cotizadorAuth` |
| 42 | `fetchEmpresaDesdeGas` |
| 58 | `verificarEmpresa` |
| 291 | `generarIdProceso` |

## `SuitCotizador/test-connection.js`

| Línea | Función |
|-------|---------|
| 7 | `main` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/altair/jupyter/js/index.js`

| Línea | Función |
|-------|---------|
| 9 | `render` |
| 12 | `showError` |
| 22 | `reembed` |
| 60 | `selectionHandler` |
| 79 | `paramHandler` |
| 103 | `dataHandler` |
| 115 | `signalHandler` |
| 150 | `cleanJson` |
| 154 | `getNestedRuntime` |
| 162 | `lookupSignalOp` |
| 167 | `dataRef` |
| 205 | `findOperatorHandler` |
| 211 | `addOperatorListener` |
| 221 | `trap` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/matplotlib/backends/web_backend/js/mpl.js`

| Línea | Función |
|-------|---------|
| 132 | `on_keyboard_event_closure` |
| 260 | `on_mouse_event_closure` |
| 342 | `set_focus` |
| 357 | `on_click_closure` |
| 363 | `on_mouseover_closure` |
| 480 | `drawRubberband` |
| 629 | `getModifiers` |
| 651 | `simpleKeys` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/matplotlib/backends/web_backend/js/mpl_tornado.js`

| Línea | Función |
|-------|---------|
| 6 | `mpl_ondownload` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/matplotlib/backends/web_backend/js/nbagg_mpl.js`

| Línea | Función |
|-------|---------|
| 3 | `comm_websocket_adapter` |
| 11 | `updateReadyState` |
| 54 | `ondownload` |
| 128 | `on_click_closure` |
| 134 | `on_mouseover_closure` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/pydeck/nbextension/static/extensionRequires.js`

| Línea | Función |
|-------|---------|
| 13 | `load_ipython_extension` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/chunk-FWX5IMBZ.BErP5FCA.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/DataFrame.Dkuppnh4.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/es6.DdnKCs-T.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/IFrame.CtHzGkN4.js`

| Línea | Función |
|-------|---------|
| 4 | `sendSize` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/index.D7cltBCg.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/mermaid-parser.core.BuPiplVR.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/mermaid.core.CPusNTg-.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/MermaidChart.Cl8DwviK.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/StreamlitMarkdown.Dt4WoAEs.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/swimlanes-5IMT3BWC.DR74hdSd.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/streamlit/static/static/js/util.BrnHTZD2.js`

| Línea | Función |
|-------|---------|
| 1 | `__vite__mapDeps` |

## `SuitCVLO/.venv/lib/python3.12/site-packages/torch/utils/model_dump/code.js`

| Línea | Función |
|-------|---------|
| 9 | `humanFileSize` |
| 15 | `caret` |
| 69 | `ModelSizeSection` |
| 92 | `StructuredDataSection` |
| 307 | `ZipContentsSection` |
| 333 | `CodeSection` |
| 375 | `ExtraJsonSection` |
| 412 | `ExtraPicklesSection` |
| 448 | `assertStorageAreEqual` |
| 455 | `computeTensorMemory` |
| 483 | `getTensorStorages` |
| 536 | `getTensorMemoryByDevice` |
| 578 | `TensorMemorySection` |

## `SuitCVLO/.venv/share/jupyter/nbextensions/pydeck/extensionRequires.js`

| Línea | Función |
|-------|---------|
| 13 | `load_ipython_extension` |

## `SuitCVLO/frontend/app.js`

| Línea | Función |
|-------|---------|
| 4 | `apiHeaders` |
| 58 | `handleFiles` |
| 85 | `handleFile` |
| 96 | `showPreview` |
| 111 | `uploadPhoto` |
| 129 | `uploadMultiplePhotos` |
| 162 | `uploadZip` |
| 179 | `pollJob` |
| 210 | `fetchResult` |
| 226 | `normalizeResults` |
| 262 | `renderResults` |
| 350 | `downloadPDF` |
| 362 | `downloadCSV` |
| 376 | `downloadGeoJSON` |
| 391 | `ocr_text` |
| 400 | `downloadBlob` |
| 411 | `setStatus` |
| 417 | `showError` |
| 424 | `hideAllSections` |
| 431 | `imageName` |
| 439 | `imageThumb` |
| 444 | `escapeHtml` |

## `SuitOSCore/ai-router/circuitBreaker.js`

| Línea | Función |
|-------|---------|
| 7 | `recordSuccess` |
| 16 | `recordFailure` |
| 28 | `isAvailable` |
| 35 | `getStatus` |
| 46 | `getAllStatus` |

## `SuitOSCore/ai-router/modelRouter.js`

| Línea | Función |
|-------|---------|
| 8 | `buildRequest` |
| 18 | `callDirectGoogle` |
| 56 | `callModel` |
| 102 | `route` |

## `SuitOSCore/ai-router/modelScanner.js`

| Línea | Función |
|-------|---------|
| 10 | `fetchJson` |
| 26 | `pingModel` |
| 63 | `parseOpenRouterModels` |
| 84 | `parseOpenCodeZenModels` |
| 103 | `scanOpenRouter` |
| 114 | `scanOpenCodeZen` |
| 129 | `verifyModels` |
| 150 | `scan` |
| 175 | `getCached` |
| 179 | `clearCache` |

## `SuitOSCore/cli/commands/arch-review.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |

## `SuitOSCore/cli/commands/dispatch.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |

## `SuitOSCore/cli/commands/guard.js`

| Línea | Función |
|-------|---------|
| 7 | `getState` |
| 14 | `saveState` |
| 19 | `run` |

## `SuitOSCore/cli/commands/learn.js`

| Línea | Función |
|-------|---------|
| 7 | `ensureDir` |
| 11 | `lessonsPath` |
| 15 | `loadLessons` |
| 34 | `saveLessons` |
| 42 | `run` |

## `SuitOSCore/cli/commands/load.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |

## `SuitOSCore/cli/commands/mejoras.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |
| 12 | `walk` |

## `SuitOSCore/cli/commands/plan.js`

| Línea | Función |
|-------|---------|
| 7 | `run` |

## `SuitOSCore/cli/commands/roadmap.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |

## `SuitOSCore/cli/commands/starter.js`

| Línea | Función |
|-------|---------|
| 5 | `run` |

## `SuitOSCore/cli/lib/context-loader.js`

| Línea | Función |
|-------|---------|
| 7 | `estimateTokens` |
| 11 | `scanFiles` |
| 47 | `walk` |
| 79 | `loadReport` |

## `SuitOSCore/cli/lib/dispatcher.js`

| Línea | Función |
|-------|---------|
| 5 | `resolveSuitosRoot` |
| 18 | `collectRegistry` |
| 28 | `findIntent` |
| 49 | `findWorkflow` |
| 54 | `findAgent` |
| 59 | `dispatch` |

## `SuitOSCore/cli/lib/parse-yaml.js`

| Línea | Función |
|-------|---------|
| 3 | `parseScalar` |
| 12 | `parseYaml` |
| 80 | `readYamlFile` |

## `SuitOSCore/cli/lib/plan-manager.js`

| Línea | Función |
|-------|---------|
| 7 | `ensureDirs` |
| 13 | `slugify` |
| 17 | `planId` |
| 22 | `createPlan` |
| 59 | `formatSpec` |
| 70 | `listPlans` |
| 85 | `updatePlanStatus` |

## `SuitOSCore/scaffold/create-suit-module/index.js`

| Línea | Función |
|-------|---------|
| 8 | `parseArgs` |
| 25 | `generateModule` |
| 38 | `processFile` |
| 51 | `scanDir` |
| 124 | `main` |

## `SuitOSCore/tooling/build-registry.js`

| Línea | Función |
|-------|---------|
| 17 | `SERVER_PORT` |
| 22 | `logError` |
| 24 | `warn` |
| 26 | `loadYamlSimple` |
| 61 | `normalize` |
| 81 | `dumpYamlSimple` |
| 114 | `collectArray` |
| 123 | `collectObjectArray` |
| 135 | `scanManifests` |
| 154 | `validateManifest` |
| 169 | `parseExistingEntries` |
| 182 | `mergeEntries` |
| 193 | `stripInternal` |
| 202 | `scanAndBuild` |
| 263 | `writeRegistryFiles` |
| 301 | `writeMcpJson` |
| 320 | `verifyRegistry` |
| 353 | `startMCPServer` |
| 371 | `handleList` |
| 376 | `handleCall` |
| 443 | `startWatch` |

## `SuitOSCore/tooling/generate-index.js`

| Línea | Función |
|-------|---------|
| 18 | `categorizeFile` |
| 25 | `scanFiles` |
| 39 | `extractFunctions` |
| 77 | `buildIndex` |

## `SuitReservaciones/handlers/actions.js`

| Línea | Función |
|-------|---------|
| 6 | `nextId` |
| 11 | `getLastId` |
| 24 | `findOrCreateClient` |
| 39 | `getChatHistory` |
| 50 | `saveChatLog` |
| 60 | `scheduleAppointment` |
| 110 | `cancelAppointment` |
| 143 | `processCancelAndNotifyWaitlist` |
| 159 | `rescheduleAppointment` |
| 203 | `addToWaitlist` |
| 214 | `getEmpresaByPhone` |

## `SuitReservaciones/handlers/webhook.js`

| Línea | Función |
|-------|---------|
| 9 | `handleIncoming` |

## `SuitReservaciones/services/ai.js`

| Línea | Función |
|-------|---------|
| 6 | `buildPrompt` |
| 45 | `detectIntent` |

## `SuitReservaciones/services/calendar.js`

| Línea | Función |
|-------|---------|
| 4 | `getClient` |
| 13 | `createEvent` |
| 27 | `updateEvent` |
| 42 | `deleteEvent` |

## `SuitReservaciones/services/notifier.js`

| Línea | Función |
|-------|---------|
| 6 | `notify` |

## `SuitReservaciones/services/whatsapp.js`

| Línea | Función |
|-------|---------|
| 6 | `sendMessage` |
| 39 | `parseIncoming` |

## `SuitStableDiffusion/scripts/colab-sd.js`

| Línea | Función |
|-------|---------|
| 21 | `main` |

## `SuitStableDiffusion/scripts/generate.js`

| Línea | Función |
|-------|---------|
| 6 | `SD_CODE_TEMPLATE` |
| 30 | `main` |

## `SuitTaskflow/backend/server.js`

| Línea | Función |
|-------|---------|
| 10 | `readData` |
| 18 | `writeData` |
| 22 | `nextId` |
| 67 | `descripcion` |
| 70 | `estado` |

## `SuitTaskflow/src/app.js`

| Línea | Función |
|-------|---------|
| 13 | `checkStatus` |
| 22 | `showToast` |
| 29 | `esc` |
| 35 | `formatDate` |
| 41 | `isOverdue` |
| 49 | `loadTasks` |
| 68 | `render` |
| 110 | `openForm` |
| 123 | `closeForm` |
| 128 | `saveTask` |
| 167 | `editTask` |
| 177 | `completeTask` |
| 195 | `deleteTask` |

## `SuitTest/backend/server.js`

| Línea | Función |
|-------|---------|
| 10 | `readData` |
| 19 | `writeData` |
| 23 | `nextId` |
| 31 | `getTenant` |

## `SuitTest/src/app.js`

| Línea | Función |
|-------|---------|
| 17 | `getTenant` |
| 21 | `updateTenantUI` |
| 26 | `showToast` |
| 36 | `checkStatus` |
| 53 | `listar` |
| 84 | `esc` |
| 90 | `mostrarForm` |
| 102 | `ocultarForm` |
| 107 | `getFormData` |
| 116 | `guardar` |
| 144 | `editar` |
| 155 | `eliminar` |

## `SuitVidGenRemotion/scripts/helpers/dbConnector.js`

| Línea | Función |
|-------|---------|
| 3 | `fetchFromCampanasAi` |
| 7 | `getEmpresaData` |
| 11 | `getCampanasFromDB` |

## `SuitVidGenRemotion/scripts/helpers/imageProvider.js`

| Línea | Función |
|-------|---------|
| 7 | `checkUrl` |
| 16 | `generateImage` |
| 36 | `generateAllImages` |

## `SuitVidGenRemotion/scripts/helpers/scriptLoader.js`

| Línea | Función |
|-------|---------|
| 4 | `validateScript` |
| 20 | `loadFromFile` |
| 28 | `applyDefaults` |

## `SuitVidGenRemotion/scripts/helpers/ttsProvider.js`

| Línea | Función |
|-------|---------|
| 8 | `downloadTTS` |
| 38 | `generateVoice` |
| 104 | `generateAllVoices` |

## `SuitVidGenRemotion/scripts/render.js`

| Línea | Función |
|-------|---------|
| 15 | `ensureDir` |
| 19 | `parseArgs` |
| 33 | `main` |

## `supabase.js`

| Línea | Función |
|-------|---------|
| 9 | `query` |
| 19 | `insert` |
| 25 | `update` |
| 33 | `remove` |

## `backend/`

### `backend/ai_engine.js`

| Línea | Función |
|-------|---------|
| 11 | `runGeminiInference` |
| 18 | `modelsToTry` |
| 129 | `listAiModels` |
| 143 | `runNotebookLMQuery` |

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
| 94 | `runAutoPurge` |
| 106 | `ensureSeed` |
| 130 | `autoCrearRegistrosSUDO` |
| 199 | `onEdit` |
| 222 | `onOpen` |
| 233 | `avisar` |
| 237 | `aplicarSUDOaTodas` |
| 256 | `generarSUDOparaSeleccion` |

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
| 1041 | `renderReservations` |
| 1140 | `confirmReservation` |
| 1153 | `completeReservation` |
| 1166 | `cancelReservation` |
| 1181 | `renderKnowledge` |
| 1197 | `syncKnowledge` |
| 1215 | `renderQuotas` |
| 1224 | `quotas` |
| 1239 | `addProjectStage` |
| 1263 | `toggleStage` |
| 1266 | `etapa` |
| 1286 | `addProjectPayment` |
| 1312 | `addProjectManualLog` |
| 1319 | `internalAddLog` |

### `js/modules/agents.js`

| Línea | Función |
|-------|---------|
| 8 | `normalizeModelName` |
| 19 | `getVisitorId` |
| 33 | `getAgentIdForCompany` |
| 40 | `run` |
| 41 | `agent` |
| 54 | `select` |
| 55 | `agt` |
| 165 | `fetchMemory` |
| 187 | `saveMemory` |
| 218 | `logInteraction` |
| 246 | `closeChat` |
| 255 | `handleFileUpload` |
| 264 | `diagnoseAi` |
| 278 | `company` |
| 337 | `triggerMicroAuthRepair` |
| 341 | `sendMessage` |
| 363 | `currentLead` |
| 446 | `seoItem` |
| 482 | `addMessageToUI` |
| 526 | `humanTyping` |
| 554 | `sendSupportTicket` |
| 584 | `processIntent` |
| 688 | `lastBotMsg` |
| 741 | `saveLead` |
| 770 | `existe` |
| 959 | `debugLead` |
| 963 | `enCache` |
| 973 | `forceSave` |
| 982 | `openAgentsModal` |
| 1017 | `getAgentIcon` |
| 1036 | `checkAiHealth` |
| 1043 | `company` |
| 1095 | `_checkAiModel` |
| 1097 | `company` |
| 1116 | `_checkSupabase` |
| 1126 | `_checkNodeProcess` |
| 1134 | `checkAllServices` |
| 1163 | `updateAiProgress` |
| 1180 | `generateMarketingPlan` |
| 1185 | `seoData` |
| 1186 | `pagesData` |
| 1187 | `notebook` |
| 1242 | `catalog` |
| 1281 | `callOpenRouterAI` |

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
| 165 | `emp` |
| 294 | `setLoggedOutState` |

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
| 169 | `parseModo` |
| 174 | `hub` |
| 187 | `parseAiConfig` |
| 212 | `parseSocialLinks` |
| 243 | `getSocialLinks` |
| 264 | `loadEnvConfig` |
| 289 | `init` |
| 374 | `mainBiz` |
| 470 | `checkBackendVersion` |
| 488 | `loadData` |
| 505 | `currentBiz` |
| 563 | `loadFromSupabase` |
| 604 | `loadGalleryFromStorage` |
| 666 | `switchCompany` |
| 724 | `createAgentTask` |
| 754 | `saveRecord` |

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
| 98 | `syncVisibility` |
| 121 | `addToCart` |
| 146 | `removeFromCart` |
| 155 | `clearCart` |
| 173 | `updateCartVisuals` |
| 226 | `renderTicketContent` |
| 254 | `checkoutStaff` |
| 311 | `updateLastSaleDisplay` |
| 334 | `checkout` |
| 382 | `nivel_crm` |
| 507 | `_checkoutSupabase` |
| 699 | `renderCartSummary` |
| 727 | `handlePayMethodChange` |
| 762 | `openCheckout` |
| 773 | `nextStep` |
| 802 | `closeCheckout` |
| 821 | `renderExpressTicket` |
| 863 | `setDeliveryMethod` |
| 880 | `sendWhatsApp` |
| 929 | `openStaffCheckout` |
| 940 | `updateOrderStatus` |
| 1028 | `showLastSale` |
| 1043 | `togglePosFolio` |
| 1080 | `setPosPaymentMethod` |
| 1094 | `setPublicPaymentMethod` |
| 1105 | `autoLookupCustomer` |
| 1116 | `lead` |
| 1146 | `filterPOS` |
| 1155 | `renderPOS` |
| 1172 | `allForCounters` |
| 1195 | `list` |
| 1231 | `pay` |
| 1276 | `getPosActionButtons` |
| 1306 | `updateExternalOrderAlert` |
| 1325 | `isExternal` |
| 1343 | `renderStaffPOS` |
| 1350 | `items` |
| 1425 | `toggleStaffNav` |
| 1441 | `fileToBase64` |
| 1449 | `showOtpEntry` |
| 1460 | `verifyOtp` |
| 1476 | `closeOtpModal` |
| 1482 | `printTicket` |
| 1543 | `updateStaffChange` |
| 1558 | `saveCart` |
| 1570 | `loadCart` |

### `js/modules/public.js`

| Línea | Función |
|-------|---------|
| 7 | `showAboutUs` |
| 42 | `showPolicies` |
| 69 | `showReviews` |
| 95 | `showLocation` |
| 134 | `closeInfoModal` |
| 141 | `startInfoInactivityTimer` |
| 157 | `resetFn` |
| 164 | `stopInfoInactivityTimer` |
| 170 | `renderHome` |
| 186 | `pageData` |
| 523 | `gallery` |
| 606 | `updateStory` |
| 824 | `dynamicPages` |
| 873 | `renderDynamicContent` |
| 958 | `showReservationModal` |
| 1011 | `submitReservation` |
| 1076 | `renderSEO` |
| 1081 | `seoData` |
| 1124 | `keywords` |
| 1185 | `updateMetadata` |
| 1200 | `seoList` |
| 1212 | `pageData` |
| 1237 | `updateMeta` |
| 1279 | `pageDataForSchema` |
| 1305 | `renderFoodMenu` |
| 1311 | `render` |
| 1314 | `items` |
| 1383 | `renderOrbit` |
| 1395 | `companies` |
| 1501 | `vx` |
| 1502 | `vy` |
| 1532 | `update` |
| 1605 | `renderFooter` |
| 1644 | `renderPillars` |
| 1661 | `renderGallery` |
| 1679 | `imgs` |
| 1793 | `toggleMobileTicket` |
| 1798 | `renderContact` |
| 1961 | `existing` |
| 2024 | `toggleInsuranceFields` |
| 2066 | `renderSuitOnboarding` |
| 2174 | `autoFillOnboarding` |
| 2227 | `submitOnboarding` |
| 2291 | `handleGallery3DTilt` |
| 2304 | `showGuestUploadModal` |
| 2329 | `processGuestFile` |
| 2342 | `loadScript` |
| 2450 | `refresh` |
| 2467 | `userLead` |
| 2515 | `getFileIcon` |
| 2524 | `handleFiles` |
| 2566 | `refreshVaultStats` |

### `js/modules/router.js`

| Línea | Función |
|-------|---------|
| 13 | `init` |
| 17 | `navigate` |
| 20 | `handleRoute` |
| 105 | `isDynamic` |

### `js/modules/ui.js`

| Línea | Función |
|-------|---------|
| 7 | `updateConsole` |
| 27 | `scrollGallery` |
| 29 | `scrollGalleryBySlot` |
| 55 | `toggleLogs` |
| 71 | `updateEstandarBarraST` |
| 164 | `renderAgentAuditButton` |
| 200 | `renderMarketingStrategyButton` |
| 240 | `triggerMarketingStrategy` |
| 284 | `triggerAgentAudit` |
| 319 | `applyTheme` |
| 358 | `renderPOS` |
| 359 | `renderStaffPOS` |
| 360 | `filterPOS` |
| 361 | `updateExternalOrderAlert` |
| 363 | `renderLeads` |
| 364 | `openLeadModal` |
| 365 | `saveLead` |
| 366 | `deleteLead` |
| 368 | `renderProjects` |
| 369 | `openProjectModal` |
| 370 | `saveProject` |
| 371 | `openProjectDetails` |
| 372 | `deleteProject` |
| 373 | `addProjectStage` |
| 374 | `toggleStage` |
| 375 | `addProjectPayment` |
| 376 | `addProjectManualLog` |
| 378 | `renderCatalog` |
| 379 | `openProductModal` |
| 380 | `saveProduct` |
| 381 | `deleteProduct` |
| 382 | `editProductStock` |
| 384 | `renderKnowledge` |
| 385 | `saveKnowledgeManual` |
| 386 | `syncKnowledge` |
| 388 | `renderQuotas` |
| 389 | `renderDashboard` |
| 390 | `renderReport` |
| 391 | `handleReportTypeChange` |
| 392 | `setReportMode` |
| 393 | `selectReportType` |
| 394 | `exportReport` |
| 395 | `renderBusinessDashboard` |
| 397 | `renderReservations` |
| 400 | `renderOrbit` |
| 401 | `renderPillars` |
| 402 | `renderFoodMenu` |
| 403 | `renderSEO` |
| 404 | `renderHome` |
| 405 | `renderGallery` |
| 406 | `renderFooter` |
| 407 | `showAboutUs` |
| 408 | `showPolicies` |
| 409 | `showReviews` |
| 410 | `showLocation` |
| 411 | `closeInfoModal` |
| 412 | `renderContact` |
| 415 | `openAgentsModal` |
| 418 | `printTicket` |
| 419 | `setPublicPaymentMethod` |
| 420 | `setPosPaymentMethod` |
| 421 | `toggleMobileTicket` |
| 423 | `syncTopLuxDrive` |
| 445 | `syncSupabase` |
| 515 | `refreshData` |
| 529 | `showLogin` |
| 530 | `showOtpEntry` |
| 531 | `verifyOtp` |
| 532 | `closeOtpModal` |
| 535 | `fileToBase64` |
| 542 | `bindEvents` |


## `scripts/agents/`

### `scripts/agents/probador.js`

| Línea | Función |
|-------|---------|
| 29 | `parseArgs` |
| 51 | `loadSuite` |
| 62 | `resolveUrl` |
| 72 | `buildRequestUrl` |
| 92 | `sendRequest` |
| 150 | `evaluateExpectation` |
| 199 | `runTests` |
| 234 | `printProgress` |
| 250 | `formatDuration` |
| 255 | `generateReport` |
| 298 | `main` |

### `scripts/agents/reportero.js`

| Línea | Función |
|-------|---------|
| 31 | `parseArgs` |
| 45 | `loadProfiles` |
| 167 | `getProfileChecks` |
| 177 | `scanPatterns` |
| 261 | `analyzeComplexity` |
| 278 | `code` |
| 287 | `callbackDepth` |
| 309 | `code` |
| 318 | `analyzeDuplication` |
| 358 | `analyzeRobustness` |
| 394 | `code` |
| 403 | `analyzeDeadCode` |
| 431 | `analyzeConsistency` |
| 459 | `analyzeAcoplamiento` |
| 482 | `simpleHash` |
| 492 | `generateReport` |
| 550 | `generateProposal` |
| 595 | `main` |

### `scripts/agents/vision-audit.js`

| Línea | Función |
|-------|---------|
| 17 | `runVisionAudit` |
| 80 | `listenTasks` |


## `scripts/`

### `scripts/generate-index.js`

| Línea | Función |
|-------|---------|
| 26 | `categorizeFile` |
| 33 | `scanFiles` |
| 47 | `extractFunctions` |
| 106 | `buildIndex` |

### `scripts/orchestrator_client.js`

| Línea | Función |
|-------|---------|
| 3 | `callByUrl` |
| 41 | `run` |

### `scripts/whatsapp-test.js`

| Línea | Función |
|-------|---------|
| 31 | `send` |


## `SuitCampanas/`

### `SuitCampanas/backend.gs`

| Línea | Función |
|-------|---------|
| 9 | `doGet` |
| 51 | `doPost` |
| 123 | `successResponse` |
| 129 | `errorResponse` |

### `SuitCampanas/local-server-node.js`

| Línea | Función |
|-------|---------|
| 19 | `findFFmpeg` |
| 43 | `ffmpeg` |
| 68 | `serverLog` |
| 75 | `normalizeDriveUrl` |
| 899 | `callAI` |
| 1150 | `fetchFollowingRedirects` |
| 1410 | `callOpenRouter` |
| 1445 | `callLocalLMS` |
| 1480 | `fetchWithRedirects` |

### `SuitCampanas/script.js`

| Línea | Función |
|-------|---------|
| 4 | `escapeHtml` |
| 38 | `loadPrompt` |
| 67 | `getCategoriaIndustria` |
| 70 | `getEspecializaciones` |
| 73 | `updateEspecializacionSelect` |
| 269 | `initCategoriaLookup` |
| 285 | `suggestTheme` |
| 295 | `showCategoriaHint` |
| 298 | `populateNichos` |
| 437 | `loadGooglePickerAPI` |
| 458 | `openDrivePicker` |
| 461 | `showDriveModalFallback` |
| 466 | `hideDriveModal` |
| 661 | `subclasificaciones` |
| 848 | `nombre` |
| 884 | `generateAIContent` |
| 1182 | `updateActiveTab` |
| 1192 | `getFormData` |
| 1211 | `autoToggleMultimedia` |
| 1226 | `validateFormData` |
| 1239 | `setLoading` |
| 1245 | `setAiLoading` |
| 1253 | `showToast` |
| 1259 | `renderCarouselPreview` |
| 1395 | `tryLoadImage` |
| 1450 | `fetchHistory` |
| 1492 | `renderHistory` |
| 1542 | `resetFormErrors` |
| 1544 | `downloadCampaignKit` |
| 1703 | `generateVideoFromCarousel` |
| 1794 | `downloadFile` |
| 1803 | `downloadExternalImage` |
| 1819 | `speakText` |
| 1846 | `stopAll` |
| 1912 | `loadCompanies` |
| 1926 | `populateCompanySelect` |
| 1938 | `populateVideCompanySelect` |
| 1952 | `setupCompanyAutoFill` |
| 1955 | `handler` |
| 1961 | `findVal` |
| 1993 | `setWorkMode` |
| 2292 | `loadRecetas` |
| 2312 | `generateImaginationVideo` |
| 2391 | `generateVideVideo` |
| 2449 | `updateProgress` |
| 2518 | `ejecutarAgente` |
| 2562 | `normalizeDriveUrl` |
| 2581 | `resolveLogoUrl` |
| 2593 | `renderCarouselFromJson` |
| 2726 | `loadSlideImage` |
| 2782 | `regenerateSlideImage` |
| 2798 | `downloadAnimatedVideo` |
| 2866 | `fetchLogs` |
| 2878 | `toggleLogPanel` |

### `SuitCampanas/test-system.js`

| Línea | Función |
|-------|---------|
| 16 | `runTests` |


## `SuitCampanas/scripts/`

### `SuitCampanas/scripts/agent-tendencias.js`

| Línea | Función |
|-------|---------|
| 14 | `callIA` |
| 34 | `buscarTendencias` |
| 49 | `buscarTendenciasReales` |
| 106 | `categorizarTendencia` |
| 118 | `buscarRecetaPorCategoria` |
| 140 | `crearRecetaConIA` |
| 179 | `generarVideo` |
| 227 | `guardarTendencia` |
| 243 | `ejecutarAgente` |
| 299 | `log` |

### `SuitCampanas/scripts/download-drive-media.js`

| Línea | Función |
|-------|---------|
| 10 | `main` |

### `SuitCampanas/scripts/seed-industrias.js`

| Línea | Función |
|-------|---------|
| 265 | `insertIndustries` |
| 314 | `insertExtraNiches` |

### `SuitCampanas/scripts/seed-prompts.js`

| Línea | Función |
|-------|---------|
| 138 | `seed` |

### `SuitCampanas/scripts/seed-supabase.js`

| Línea | Función |
|-------|---------|
| 13 | `seed` |
| 67 | `seedRecetas` |

### `SuitCampanas/scripts/sync-gas.js`

| Línea | Función |
|-------|---------|
| 9 | `postToGAS` |
| 27 | `syncIndustrias` |
| 49 | `syncCampanas` |

### `SuitCampanas/scripts/trend-research.js`

| Línea | Función |
|-------|---------|
| 14 | `getCacheKey` |
| 18 | `readCache` |
| 27 | `writeCache` |
| 35 | `fetchPythonTrends` |
| 47 | `extractTrends` |
| 51 | `add` |
| 81 | `extractTrendsFromIA` |
| 95 | `fetchTrends` |


---
> **Auto-generado por `scripts/generate-index.js`** — Ejecuta `node scripts/generate-index.js` para actualizar.
