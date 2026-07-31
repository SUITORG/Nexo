# Índice de Código — SuitCampanas

**Fecha**: 2026-07-19
**Archivos analizados**: 20
**Funciones/Clases encontradas**: ~170

---

## Resumen

| Categoría | Cantidad |
|-----------|----------|
| API Endpoints (servidor) | 27 |
| API Endpoints (GAS) | 4 |
| Funciones del servidor | 7 |
| Funciones frontend (script.js) | 45 |
| Clases (generators) | 2 clases, 18 métodos |
| Scripts (functions) | 26 |
| Variables globales frontend | 28 |
| Constantes de configuración | 8 |
| Event listeners | 38 |
| Clases CSS principales | ~60 |

---

## API Endpoints — Servidor (`local-server-node.js`)

| Método | Ruta | Línea | Parámetros | Descripción |
|--------|------|-------|------------|-------------|
| GET | `/api/history` | 77 | — | Proxy historial GAS |
| GET | `/api/config/client` | 88 | — | Config pública (API keys Drive) |
| GET | `/api/config` | 99 | — | Proxy config empresas GAS |
| POST | `/api/save` | 110 | `{caption, mediaUrl, ...}` | Guarda contenido en GAS |
| GET | `/api/models` | 134 | — | Lista modelos LLM disponibles |
| POST | `/api/models/select` | 144 | `{modelId}` | Cambia modelo activo |
| GET | `/api/industrias` | 170 | — | Lista industrias+nichos (Supabase) |
| POST | `/api/industrias` | 192 | `{categoria, icono, nichos}` | Crea industria+nichos |
| PUT | `/api/industrias/:id` | 227 | `{...updates}` | Edita industria |
| GET | `/api/campanas` | 254 | — | Lista campañas (Supabase) |
| POST | `/api/campanas` | 276 | `{...campana}` | Guarda/actualiza campaña |
| GET | `/api/recetas` | 315 | — | Lista recetas de video |
| POST | `/api/video-imaginacion` | 336 | `{texto, receta_id, logo, formato}` | Genera video FFmpeg+receta |
| POST | `/api/agent/tendencias` | 528 | — | Ejecuta agente de tendencias |
| GET | `/api/prompts/:id` | 547 | `:id` | Obtiene prompt por id_agente |
| POST | `/api/sync/prompts` | 582 | — | Sync Prompts_IA GAS→Supabase |
| POST | `/api/trends/fetch` | 630 | `{niche, subNiche, region}` | Busca tendencias externas |
| POST | `/api/trends/generate` | 650 | `{trend, niche, slides}` | Genera campaña desde tendencia |
| POST | `/api/ai` | 733 | `{messages, temperature, model}` | Proxy IA multi-modelo |
| POST | `/api/ai/image` | 796 | `{prompt}` | Genera imagen (Google Imagen 3) |
| POST | `/api/bdpv/generate` | 851 | `{company, ...}` | Genera presentación HTML |
| POST | `/api/bdpv/open` | 912 | `{filePath}` | Abre presentación HTML |
| POST | `/api/animate` | 938 | `{image, effect, duration, vertical}` | Video animado desde imagen |
| POST | `/api/slideshow` | 1006 | `{images, effect, duration}` | Slideshow con transiciones |
| GET | `/api/proxy-image` | 1089 | `?url=` | Proxy imagen externa a base64 |
| POST | `/api/video-produce` | 1132 | `{empresa, guion, style}` | Suite completa producción video |
| GET | `/api/logs` | 1289 | — | Buffer de logs del servidor |

---

## API Endpoints — GAS (`backend.gs`)

| Método | Acción | Línea | Descripción |
|--------|--------|-------|-------------|
| GET | `action=config` | 14 | Lee Config_Empresas desde Sheets |
| GET | `action=history` | 28 | Lee SMMC (últimas 20 entradas) |
| POST | `save` (default) | 51 | Guarda caption en SMMC |
| POST | `sync_industrias` | 63 | Sincroniza industrias a Sheets |

---

## Funciones del Servidor (`local-server-node.js`)

| Función | Línea | Parámetros | Retorno | Descripción |
|---------|-------|-------------|---------|-------------|
| `findFFmpeg()` | 15 | `()` | `string` | Auto-detecta ruta de FFmpeg |
| `serverLog(level, ...args)` | 48 | `(level, ...args)` | `void` | Log con timestamp y buffer |
| `normalizeDriveUrl(url)` | 55 | `(url)` | `string` | Convierte URL Drive a export |
| `callOpenRouter(model, messages, temp)` | 1336 | `(model, messages, temperature)` | `string` | Llama OpenRouter con fallbacks |
| `callLocalLMS(prompt)` | 1371 | `(prompt)` | `string` | Llama LM Studio local (1234) |
| `fetchWithRedirects(url, callback)` | 1406 | `(url, callback)` | `void` | Fetch con follow redirects |
| `callAI(messages, temperature)` | 860 | `(messages, temperature)` | `string` | Wrapper AI para BDPV |

---

## Frontend — Constantes de Configuración (`script.js`)

| Constante | Línea | Descripción |
|-----------|-------|-------------|
| `CONFIG` | 4 | Objeto rutas API (AI, History, Campañas, Prompts, Drive) |
| `promptCache` | 30 | Cache de prompts cargados |
| `INDUSTRIA_CATEGORIA` | 58 | Mapa valor→categoría de industria |
| `ESPECIALIZACIONES` | 59 | Mapa valor→especializaciones |
| `INDUSTRY_LABELS` | 124 | Mapa industria→etiqueta textual |
| `INDUSTRIAS_NICHOS` | 165 | Mapa industria→array de nichos |
| `CONCIENCIA_SUGGEST` | 266 | Frases predefinidas por nivel de conciencia |
| `modelDescriptions` | 691 | Descripciones de modelos IA |

---

## Frontend — Variables Globales (`script.js`)

| Variable | Línea | Valor inicial | Descripción |
|----------|-------|---------------|-------------|
| `form` | 46 | `undefined` | Formulario `#cmsForm` |
| `submitBtn` | 46 | `undefined` | Botón `#submitBtn` |
| `generateBtn` | 46 | `undefined` | Botón `#generateBtn` |
| `loader` | 46 | `undefined` | Loader del submit |
| `btnText` | 46 | `undefined` | Texto del botón |
| `toast` | 46 | `undefined` | Notificación `#toast` |
| `toastMessage` | 46 | `undefined` | Mensaje del toast |
| `aiIndustry` | 47 | `undefined` | Select `#aiIndustry` |
| `aiSlides` | 47 | `undefined` | Input `#aiSlides` |
| `aiTheme` | 47 | `undefined` | Input `#aiTheme` |
| `captionField` | 47 | `undefined` | Textarea `#caption` |
| `aiTemplate` | 48 | `undefined` | Select `#aiTemplate` |
| `aiEspecializacion` | 48 | `undefined` | Select `#aiEspecializacion` |
| `aiNicho` | 48 | `undefined` | Select `#aiNicho` |
| `formatTabs` | 49 | `undefined` | NodeList `.format-tab` |
| `platformTabs` | 49 | `undefined` | NodeList `.platform-tab` |
| `historyContainer` | 49 | `undefined` | `#historyContainer` |
| `refreshHistoryBtn` | 49 | `undefined` | `#refreshHistoryBtn` |
| `downloadBtn` | 49 | `undefined` | `#downloadBtn` |
| `previewSection` | 50 | `undefined` | `#previewSection` |
| `carouselContainer` | 50 | `undefined` | `#carouselContainer` |
| `enableVoice` | 51 | `undefined` | Checkbox `#enableVoice` |
| `enableMusic` | 51 | `undefined` | Checkbox `#enableMusic` |
| `enableVideo` | 51 | `undefined` | Checkbox `#enableVideo` |
| `currentMode` | 52 | `'Ai'` | Modo activo |
| `uploadedLogoDataUrl` | 53 | `null` | Data URL del logo |
| `companyConfigs` | 54 | `[]` | Configs de empresas |
| `bdUploadedPhotos` | 55 | `[]` | Data URLs de fotos BD |

---

## Frontend — Funciones (`script.js`)

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `loadClientConfig()` | 15 | — | Carga config pública del servidor |
| `loadPrompt(id)` | 31 | `(id)` | Carga prompt con cache |
| `getCategoriaIndustria(valor)` | 60 | `(valor)` | Retorna categoría industria |
| `getEspecializaciones(valor)` | 63 | `(valor)` | Retorna especializaciones |
| `updateEspecializacionSelect()` | 66 | — | Llena select especialización |
| `suggestTheme()` | 273 | — | Sugiere tema según conciencia+industria |
| `showCategoriaHint()` | 283 | — | Hint de categoría (actualmente vacía) |
| `populateNichos()` | 286 | — | Pobla select nichos según industria |
| `loadGooglePickerAPI(callback)` | 425 | `(callback)` | Carga Google Picker API |
| `openDrivePicker()` | 446 | — | Abre selector Drive |
| `showDriveModalFallback()` | 449 | — | Muestra modal manual Drive |
| `hideDriveModal()` | 454 | — | Oculta modal Drive |
| `generateAIContent()` | 822 | — | Genera contenido IA según modo |
| `updateActiveTab(format)` | 1108 | `(format)` | Activa tab de formato |
| `getFormData()` | 1118 | — | Recolecta datos del formulario |
| `autoToggleMultimedia(format)` | 1137 | `(format)` | Auto-activa toggles según formato |
| `validateFormData(data)` | 1152 | `(data)` | Valida datos del formulario |
| `setLoading(isLoading)` | 1165 | `(isLoading)` | Controla loading de submit |
| `setAiLoading(isLoading)` | 1171 | `(isLoading)` | Controla loading de IA |
| `showToast(message, type)` | 1179 | `(message, type)` | Muestra notificación toast |
| `renderCarouselPreview(text)` | 1185 | `(text)` | Renderiza preview carrusel |
| `tryLoadImage(elementId, sources, i)` | 1283 | `(id, sources, index)` | Carga imágenes con fallback |
| `fetchHistory()` | 1338 | — | Obtiene historial (Supabase→GAS) |
| `renderHistory(items)` | 1380 | `(items)` | Renderiza tarjetas de historial |
| `resetFormErrors()` | 1413 | — | Resetea errores de formulario |
| `downloadCampaignKit()` | 1415 | — | Descarga kit: caption+slides+video |
| `downloadFile(url, filename)` | 1574 | `(url, filename)` | Dispara descarga de archivo |
| `downloadExternalImage(url, filename)` | 1583 | `(url, filename)` | Descarga imagen remota |
| `speakText(text, btn)` | 1599 | `(text, btn)` | TTS + música de fondo |
| `loadCompanies()` | 1692 | — | Carga empresas desde API |
| `populateCompanySelect()` | 1706 | — | Llena select de empresas |
| `setupCompanyAutoFill()` | 1718 | — | Autocompleta logo/tel/web |
| `setWorkMode(mode)` | 1759 | `(mode)` | Cambia modo de trabajo |
| `loadRecetas()` | 2068 | — | Carga recetas desde API |
| `generateImaginationVideo()` | 2088 | — | Genera video de imaginación |
| `generateVideVideo()` | 2167 | — | Genera video completo VIDE |
| `ejecutarAgente()` | 2270 | — | Ejecuta agente de tendencias |
| `normalizeDriveUrl(url)` | 2314 | `(url)` | Normaliza URL Google Drive |
| `resolveLogoUrl(rawUrl)` | 2333 | `(rawUrl)` | Resuelve URL de logo |
| `renderCarouselFromJson(data)` | 2345 | `(data)` | Renderiza carrusel desde JSON IA |
| `loadSlideImage(slideId, visual, ind, theme, seed)` | 2424 | `(5 params)` | Carga imagen con fallbacks |
| `regenerateSlideImage(slideId, visual, ind, theme)` | 2480 | `(4 params)` | Re-genera imagen de un slide |
| `downloadAnimatedVideo(slideId, index)` | 2496 | `(slideId, index)` | Descarga video animado |
| `fetchLogs()` | 2564 | — | Obtiene logs del servidor |
| `toggleLogPanel()` | 2576 | — | Muestra/oculta panel de logs |

---

## Frontend — Event Listeners (`script.js`)

| Elemento | Evento | Handler | Línea | Descripción |
|----------|--------|---------|-------|-------------|
| `enableAnimation` | change | toggle `animationOptions` | 118 | Muestra opciones animación |
| `aiConciencia` | change | `suggestTheme` | 298 | Sugiere tema |
| `aiIndustry` | change | `populateNichos() + updateEspecializacionSelect() + suggestTheme()` | 299 | Recarga nichos y tema |
| `aiNicho` | change | `updateEspecializacionSelect() + suggestTheme()` | 300 | Actualiza especialización |
| `aiEspecializacion` | change | `suggestTheme` | 301 | Sugiere tema |
| `aiTemplate` | change | `suggestTheme` | 302 | Sugiere tema |
| `aiSlides` | input | `updateBdPhotosLabel()` | 322 | Actualiza label fotos |
| `bdPhotosInput` | change | Lee y previsualiza fotos | 331 | Sube fotos locales |
| `clearBdPhotosBtn` | click | Limpia `bdUploadedPhotos` | 388 | Limpia fotos |
| `companyLogoFile` | change | Lee logo desde archivo | 399 | Sube logo |
| `driveBtn` | click | `openDrivePicker` | 458 | Abre selector Drive |
| `driveCancel` | click | `hideDriveModal` | 459 | Cierra modal |
| `driveModal` | click | Cierra si click fuera | 460 | Cierra modal externo |
| `driveInput` | input | Previsualiza URL | 463 | Preview URL Drive |
| `driveConfirm` | click | Confirma URL | 483 | Confirma logo Drive |
| `.format-tab` (cada) | click | `updateActiveTab + autoToggleMultimedia` | 495 | Cambia formato |
| `.platform-tab` (cada) | click | Activa tab red social | 504 | Activa plataforma |
| `#btnModeAi` | click | `setWorkMode('Ai')` | 511 | Modo IA |
| `#btnModeBd` | click | `setWorkMode('BD')` | 512 | Modo BD |
| `#btnModeBdpr` | click | `setWorkMode('BDPR')` | 513 | Modo BDPR |
| `#btnModeImg` | click | `setWorkMode('IMG')` | 515 | Modo IMG |
| `#btnModeBdsmt` | click | `setWorkMode('BDSMT')` | 517 | Modo BDSMT |
| `#btnModeBdpv` | click | `setWorkMode('BDPV')` | 519 | Modo BDPV |
| `#btnModeViRe` | click | `setWorkMode('ViRe')` | 521 | Modo ViRe |
| `#btnModeVide` | click | `setWorkMode('VIDE')` | 523 | Modo VIDE |
| `#openVireStudioBtn` | click | Abre `localhost:3004` | 526 | Abre Remotion Studio |
| `#fetchTrendsBtn` | click | Busca tendencias | 534 | Fetch trends BDSMT |
| `#refreshHistoryBtn` | click | `fetchHistory` | 659 | Refresca historial |
| `#recipeSelect` | change | Llena detalles receta | 664 | Carga receta |
| `#downloadBtn` | click | `downloadCampaignKit` | 683 | Descarga kit |
| `#generateBtn` | click | `generateAIContent` | 686 | Genera contenido |
| `#modelSelect` | change | Cambia modelo IA | 701 | Select modelo |
| `#imaginationBtn` | click | `generateImaginationVideo` | 717 | Video imaginación |
| `#agentBtn` | click | `ejecutarAgente` | 721 | Agente tendencias |
| `#videGenerateBtn` | click | `generateVideVideo` | 725 | Video VIDE |
| `#clearBtn` | click | Limpia formulario | 733 | Reset form |
| `#cmsForm` | submit | Guarda (GAS + Supabase) | 748 | Submit dual |
| `document` | change | Delegado `enableAnimation` | 2552 | Toggle animación global |
| `document` | keydown | `Ctrl+Shift+L` abre logs | 2590 | Atajo teclado logs |
| `#toggleLogBtn` | click | Toggle auto-refresh | 2597 | Toggle logs |

---

## Clases (Generators)

### `ReelGenerator` (`generators/reel-generator.js`)

| Método | Línea | Parámetros | Descripción |
|--------|-------|-------------|-------------|
| `constructor()` | 5 | — | Inicia rutas config/database/output |
| `loadData()` | 12 | — | Carga config y campañas desde JSON |
| `replaceVariables(prompt, variables)` | 28 | `(prompt, variables)` | Reemplaza placeholders |
| `generarScript(campañaId)` | 46 | `(campañaId)` | Genera guión JSON para campaña |
| `generarEjemploLaminas(numero)` | 86 | `(numero)` | Genera N láminas de ejemplo |
| `generar(numero)` | 103 | `(numero)` | Genera título para lámina |
| `generarContenido(numero)` | 112 | `(numero)` | Genera contenido para lámina |
| `generarSugerenciaVisual(numero)` | 127 | `(numero)` | Genera sugerencia visual |
| `actualizarEstado(campañaId, estado)` | 136 | `(id, estado)` | Actualiza estado en JSON |

### `ImageProcessor` (`generators/image-processor.js`)

| Método | Línea | Parámetros | Descripción |
|--------|-------|-------------|-------------|
| `constructor()` | 5 | — | Define ruta de output |
| `procesarFormato(formato, config)` | 10 | `(formato, config)` | Enruta según formato |
| `procesarReel(config)` | 27 | `(config)` | Procesa assets para reel |
| `procesarPost(config)` | 45 | `(config)` | Procesa assets para post |
| `procesarStory(config)` | 59 | `(config)` | Procesa assets para story |
| `procesarBanner(config)` | 73 | `(config)` | Procesa assets para banner |
| `generarAsset(tipo, config)` | 87 | `(tipo, config)` | Genera metadata de asset |
| `getExtension(tipo)` | 108 | `(tipo)` | Extensión según tipo asset |
| `saveMetadata(formato, assets, config)` | 125 | `(formato, assets, config)` | Guarda metadata a JSON |
| `optimizarImagen(ruta, opciones)` | 144 | `(ruta, opciones)` | Simula optimización |
| `generarMiniaturas(assets)` | 165 | `(assets)` | Genera miniaturas |

---

## Scripts — Funciones

### `scripts/agent-tendencias.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `callIA(prompt, temp)` | 14 | `(prompt, temperature)` | Llama OpenRouter para agente |
| `buscarTendencias(limite)` | 34 | `(limite)` | Genera tendencias con IA |
| `buscarTendenciasReales(serverLog, limite)` | 49 | `(serverLog, limite)` | Extrae tendencias reales |
| `categorizarTendencia(titulo, desc)` | 106 | `(titulo, descripcion)` | Clasifica tendencia |
| `buscarRecetaPorCategoria(supabase, cat)` | 118 | `(supabase, categoria)` | Busca receta por categoría |
| `crearRecetaConIA(supabase, titulo, cat)` | 140 | `(supabase, titulo, categoria)` | Crea receta con IA |
| `generarVideo(titulo, recetaId, serverLog)` | 179 | `(titulo, recetaId, serverLog)` | Genera video FFmpeg |
| `guardarTendencia(supabase, ten, recId, vid, fuente)` | 227 | `(5 params)` | Guarda en Supabase |
| `ejecutarAgente(serverLog)` | 243 | `(serverLog)` | Orquestador: busca→crea→genera |

### `scripts/trend-research.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `getCacheKey(niche, region)` | 14 | `(niche, region)` | Key única para caché |
| `readCache(niche, region)` | 18 | `(niche, region)` | Lee caché de tendencias |
| `writeCache(niche, region, data)` | 27 | `(niche, region, data)` | Escribe caché |
| `fetchPythonTrends(niche, region)` | 35 | `(niche, region)` | Ejecuta pytrends Python |
| `extractTrends(raw, niche)` | 47 | `(raw, niche)` | Extrae tendencias de raw |
| `extractTrendsFromIA(niche, sub, region)` | 81 | `(3 params)` | Tendencias IA por defecto |
| `fetchTrends(niche, subNiche, region)` | 95 | `(3 params)` | Obtiene con caché+fallback |

### `scripts/seed-supabase.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `seed()` | 8 | — | Migra industrias config→Supabase |
| `seedRecetas()` | 61 | — | Inserta 5 recetas precargadas |

### `scripts/seed-prompts.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `seed()` | 138 | — | Inserta 5 prompts en Prompts_IA |

### `scripts/seed-industrias.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `insertIndustries()` | 265 | — | Inserta 5 industrias+ nichos |
| `insertExtraNiches()` | 314 | — | Inserta nichos extra |

### `scripts/sync-gas.js`

| Función | Línea | Parámetros | Descripción |
|---------|-------|-------------|-------------|
| `postToGAS(payload)` | 9 | `(payload)` | POST a GAS |
| `syncIndustrias()` | 27 | — | Sync industrias Supabase→GAS |
| `syncCampanas()` | 49 | — | Sync campañas Supabase→GAS |

### Otros scripts

| Archivo | Función | Línea | Descripción |
|---------|---------|-------|-------------|
| `test-system.js` | `runTests()` | 16 | Tests de sistema (servidor, Supabase, GAS, FFmpeg) |
| `download-drive-media.js` | `main()` | 10 | Descarga media de Google Drive |
| `insert-prompt.js` | IIFE | 54 | Inserta/actualiza CAMP-AI-MASTER |
| `insert-prompts.js` | IIFE | 60 | Inserta/actualiza CAMP-BDSMT-TREND |

---

## Configuraciones

| Archivo | Exporta | Línea | Descripción |
|---------|---------|-------|-------------|
| `models-config.js` | `MODELS` | 3 | 7 modelos LLM gratuitos (DeepSeek, Qwen, Llama, etc.) |
| `models-config.js` | `DEFAULT_MODEL` | 62 | Default: `deepseek/deepseek-v4-flash` |
| `lib/supabase.js` | `supabase` client | 13 | Cliente Supabase con service_role key |
| `config/prompts.json` | 3 templates | — | Templates: reel, post, story |
| `config/formatos.json` | Formatos | — | Config de formatos de salida |
| `config/industrias.json` | Clasificación | — | Clasificación de industrias |

---

## Variables y Clases CSS (`style.css`)

### Variables CSS

| Variable | Valor | Línea |
|----------|-------|-------|
| `--primary` | `#6366f1` | 2 |
| `--primary-hover` | `#4f46e5` | 3 |
| `--accent-color` | `#f59e0b` | 4 |
| `--bg-dark` | `#0f172a` | 5 |
| `--text-main` | `#f8fafc` | 6 |
| `--text-dim` | `#94a3b8` | 7 |
| `--glass-bg` | `rgba(30,41,59,0.7)` | 8 |
| `--glass-border` | `rgba(255,255,255,0.1)` | 9 |
| `--error` | `#ef4444` | 10 |
| `--success` | `#22c55e` | 11 |

### Clases principales

| Clase | Línea | Propósito |
|-------|-------|-----------|
| `.background-blobs` | 32 | Fondos animados decorativos |
| `.app-container` | 81 | Contenedor principal |
| `.glass-card` | 202 | Tarjeta efecto vidrio |
| `.mode-btn` | 233 | Botón modo de trabajo |
| `.mode-btn.active` | 246 | Modo activo |
| `.format-tab` | 131 | Botón formato |
| `.format-tab.active` | 149 | Formato activo |
| `.carousel-slide` | 607 | Slide individual |
| `.carousel-slide.reel-mode` | 618 | Modo vertical (9:16) |
| `.slide-image` | 622 | Imagen de fondo |
| `.slide-overlay` | 634 | Overlay de texto |
| `.slide-logo` | 694 | Logo en slide |
| `.switch` | 783 | Switch premium |
| `.toast` | 542 | Notificación |
| `.history-card` | 928 | Tarjeta de historial |
| `.voice-btn` | 270 | Botón de voz |
| `.voice-btn.speaking` | 291 | Estado reproduciendo |

---

## Archivos sin funciones

Solo config, assets o documentación:
- `README.md`, `CLAUDE.md`, `ROADMAP_CampanasAI.md`
- `appsscript.json`, `.clasp.json`, `.claspignore`, `skills-lock.json`
- `config/formatos.json`, `config/industrias.json`, `config/prompts.json`
- `database/campañas.json`, `database/plantillas.json`
- `media/*.png`
- `Gemini.png`
- `cache_trends.json`
- `iniciar.bat`
- `package.json`, `package-lock.json`
- `style.css`
- `local-server.py`
- `test.html`, `test-simple.html`
