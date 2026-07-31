# Revisión de Arquitectura — SuitCampanas

**Fecha**: 2026-07-19
**Proyecto**: `suitorg/SuitCampanas/`
**Tipo**: Análisis de arquitectura, procesos y seguridad (solo lectura)
**Stack**: Node.js HTTP puro + Google Apps Script + Supabase/PostgreSQL + Vanilla JS Frontend + FFmpeg + Python
**Puerto**: 8000

---

## 1. ESTRUCTURA ACTUAL

```
SuitCampanas/
├── ._backup/                       ← Backup de archivos con credenciales reales 🔴
│   ├── index.html / local-server-node.js / models-config.js / script.js
├── .claude/skills/google-sheets/   ← Skill de asistente IA
├── config/
│   ├── formatos.json               ← Formatos de salida (Reel/Post/Story/Banner)
│   ├── industrias.json             ← Clasificación de industrias
│   └── prompts.json                ← Templates de prompts
├── database/
│   ├── campañas.json               ← Almacén local de campañas
│   └── plantillas.json             ← Plantillas de ejemplo
├── generators/
│   ├── image-processor.js (150 lns)← Procesamiento de imágenes por formato
│   └── reel-generator.js (133 lns) ← Generación de reels
├── lib/
│   └── supabase.js (17 lns)        ← Cliente Supabase (service_role) 🔴
├── media/                          ← Imágenes generadas por IA
├── scripts/
│   ├── agent-tendencias.js (309)   ← Agente autónomo de tendencias
│   ├── download-drive-media.js (74)← Descarga desde Google Drive
│   ├── insert-prompt.js (86)       ← Inserta prompt individual
│   ├── insert-prompts.js (86)      ← Inserta prompts múltiples
│   ├── pytrends_fetch.py (91)      ← Scraper Google Trends (Python)
│   ├── seed-industrias.js (351)    ← Seed de industrias a Supabase
│   ├── seed-prompts.js (160)       ← Seed de prompts IA
│   ├── seed-supabase.js (101)      ← Seed inicial a Supabase
│   ├── sync-gas.js (81)            ← Sincroniza Supabase → GAS
│   └── trend-research.js (117)     ← Motor de investigación de tendencias
│
├── index.html (650 lns)            ← SPA frontend
├── script.js (2605 lns)            ← Lógica frontend completa 🔴
├── style.css (~500 lns)
├── local-server-node.js (1495 lns) ← Servidor HTTP (27 endpoints) 🔴
├── backend.gs (133 lns)            ← Backend Google Apps Script
├── models-config.js (64 lns)       ← 8 modelos IA configurables
├── mock-server.js (70 lns)         ← Mock para pruebas
├── test-system.js (67 lns)         ← Suite de tests básicos
├── CLAUDE.md / README.md / ROADMAP_CampanasAI.md
└── iniciar.bat                     ← Script de inicio
```

**Total**: 51 archivos, ~20 archivos fuente JS/GS, 7 modos de operación.

---

## 2. HALLAZGOS CRÍTICOS

### 🔴 CRÍTICO — Secrets hardcodeados

| Archivo | Línea | Hallazgo | Impacto |
|---------|-------|----------|---------|
| `backend.gs` | 6 | `SECRET_TOKEN = "SUITORG_SECURE_TOKEN_2026"` | Token de autenticación GAS en texto plano, duplicado en 4 archivos |
| `backend.gs` | 7 | `ID_SHEET = "1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8"` | Sheet ID expuesto |
| `._backup/script.js` | 8-10 | `DRIVE_API_KEY`, `DRIVE_CLIENT_ID`, `DRIVE_APP_ID` | Credenciales Google Cloud en backup |
| `lib/supabase.js` | 5-6 | `SUPABASE_SERVICE_ROLE_KEY` desde `.env` | Bypass total de RLS en Supabase |
| `local-server-node.js` | 12 | `GAS_URL` hardcodeada | URL de ejecución GAS expuesta |
| `scripts/download-drive-media.js` | 6,8 | `FOLDER_ID`, ruta `suitorg00-bf9dc6dcb6ca.json` | IDs Drive + ruta credenciales |

### 🔴 CRÍTICO — Command Injection (10+ ocurrencias)

`execSync(cmd, { shell: true })` donde `cmd` se construye concatenando strings con input del usuario:

| Archivo | Línea | Comando | Variable peligrosa |
|---------|-------|---------|-------------------|
| `local-server-node.js` | 448-454 | `ffmpeg ... textFilePath ...` | `textFilePath`, `imgPath`, `logoPathFwd` |
| `local-server-node.js` | 982 | `ffmpeg ... effect ${effect}` | `effect`, `image` base64 |
| `local-server-node.js` | 1051-1064 | `ffmpeg ... slideshow segments` | Rutas de archivos temporales |
| `local-server-node.js` | 1191 | `python -c "${ttsScript}" "${fullText}"` | `fullText` (guion del usuario) |
| `local-server-node.js` | 1206 | `python music.py -s ${style}` | `style` del body JSON |
| `local-server-node.js` | 1235-1249 | `ffmpeg ... video-produce` | Múltiples parámetros |
| `scripts/agent-tendencias.js` | 54 | `browser-act "${fuente.url}"` | URL de fuente |

### 🔴 CRÍTICO — XSS masivo por innerHTML sin sanitizar

30+ ocurrencias de `innerHTML` con datos de usuario/IA sin sanitizar en `script.js`:

| Línea | Código | Riesgo |
|-------|--------|--------|
| 470,473 | `drivePreview.innerHTML = '<img ... onerror="...">'` | URL de Drive inyectada directamente |
| 1244,1253 | `slideEl.innerHTML = ...` | Contenido generado por IA |
| 1401 | `card.innerHTML = ...` | Datos del historial |
| 2364,2373 | `container.innerHTML = ...` | Slides desde JSON |
| 549,563,590,614,1370,1374,1382 | Mensajes de error/estado | Strings sin sanitizar |

### 🔴 ALTO — Sin autenticación en endpoints Supabase

| Endpoint | Método | Datos expuestos |
|----------|--------|-----------------|
| `/api/industrias` | GET/POST/PUT | Industrias y nichos |
| `/api/campanas` | GET/POST | Campañas generadas |
| `/api/recetas` | GET | Recetas de video |
| `/api/prompts/:id` | GET | Prompts del sistema |

### 🔴 ALTO — CORS permisivo y sin CSP

| Hallazgo | Archivo:Línea |
|----------|---------------|
| `Access-Control-Allow-Origin: *` | `local-server-node.js:65` |
| Sin header `Content-Security-Policy` | `local-server-node.js` (ausente) |
| Sin `helmet` ni middlewares de seguridad | Servidor HTTP nativo |

### 🔴 ALTO — SSRF potencial en `/api/proxy-image`

`local-server-node.js:1089-1128` — acepta cualquier URL por query param y la fetchea sin validación de dominios. Puede escanear redes internas.

---

## 3. PROBLEMAS DE ARQUITECTURA

### 3.1 Monolito en 2 archivos

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `script.js` | 2605 | Toda la lógica frontend: 7 modos, IA, UI, descargas, TTS, canvas |
| `local-server-node.js` | 1495 | 27 endpoints, FFmpeg, OpenRouter, Supabase, GAS proxy, static serving |

No hay separación de concerns. Cualquier cambio toca el mismo archivo.

### 3.2 Sin capa de abstracción de base de datos

Queries a Supabase están dispersas en `local-server-node.js` en lugar de un DAO. Si cambia el schema, hay que buscar y reemplazar en 27 lugares.

### 3.3 Dual-write sin consistencia

```javascript
// script.js:756-806
await fetch(GAS_URL, { mode: 'no-cors', ... }) // ⚠️ Opaco, no detecta errores
await fetch(api/campanas, { ... })              // Supabase
```

El modo `no-cors` impide leer la respuesta de GAS. El usuario ve "éxito" incluso si GAS falló.

### 3.4 GAS URL hardcodeada

`local-server-node.js:12` — si se redepliega el script GAS, la URL cambia y todo el sistema deja de funcionar. Debería estar en `.env`.

### 3.5 Sin tests automatizados

No hay lint, typecheck, ni tests automatizados. `test-system.js` (67 lns) es un smoke test manual rudimentario.

### 3.6 Violaciones a reglas del proyecto

| Regla | Violación | Archivo:Línea |
|-------|-----------|---------------|
| #22 Secrets en `.env` | Token hardcodeado | `backend.gs:6` |
| #22 Secrets en `.env` | GAS URL hardcodeada | `local-server-node.js:12` |
| #22 Secrets en `.env` | Drive creds en backup | `._backup/script.js:8-10` |
| #12 Service Role en cliente | `service_role` en backend | `lib/supabase.js:5-6` |

---

## 4. LO QUE ESTÁ BIEN HECHO

### Fallback robusto de modelos IA
Hasta 4 modelos OpenRouter en cadena + LM Studio local. Si todos fallan, el usuario recibe error claro.

### Cache de prompts
`promptsCache` con TTL de 60s evita llamadas repetitivas a Supabase. Auto-sync cada 5 minutos desde GAS.

### Dual-write GAS + Supabase
Redundancia de datos: si un backend falla, el otro puede haber funcionado. El historial lee de Supabase con fallback a GAS.

### Manejo de errores consistente en servidor
Todos los endpoints envueltos en `try/catch` con respuesta JSON `{ status, message }`. Logger con buffer circular.

### Sistema de recetas flexible
Recetas configurables (orden, duración, ritmo, filtro, transición, animación) permiten diferentes estilos de video sin cambiar código.

### Arquitectura multi-modelo
8 modelos gratuitos vía OpenRouter con distinta calidad/velocidad, seleccionables por el usuario. Modelo default: DeepSeek V4 Flash.

---

## 5. RECOMENDACIONES PRIORIZADAS

### Prioridad 1 — Seguridad (INMEDIATO)

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 1 | Mover `SECRET_TOKEN` a `.env` o `PropertiesService` | 15 min | `backend.gs:6` |
| 2 | Mover `GAS_URL` a `.env` | 5 min | `local-server-node.js:12` |
| 3 | Eliminar `._backup/` del repo o agregar a `.gitignore` | 2 min | `.gitignore` |
| 4 | Agregar lista blanca de dominios en `/api/proxy-image` | 30 min | `local-server-node.js:1089` |
| 5 | Reemplazar `execSync` con `execFile` (argumentos separados) | 1-2h | 10+ líneas en `local-server-node.js` |
| 6 | Sanitizar `innerHTML`: usar `textContent` o `DOMPurify` | 2-4h | `script.js` (~30 sitios) |

### Prioridad 2 — Arquitectura

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 7 | Agregar autenticación a endpoints Supabase (token) | 1h | `local-server-node.js` endpoints |
| 8 | Centralizar queries Supabase en módulo DAO | 2h | `lib/supabase.js` |
| 9 | Fragmentar `script.js` (2605 lns) en módulos | 2-4h | `SuitCampanas/js/` |
| 10 | Fragmentar `local-server-node.js` (1495 lns) en módulos | 2-4h | `SuitCampanas/routes/`, `services/` |
| 11 | Restringir CORS a lista blanca | 15 min | `local-server-node.js:65` |

### Prioridad 3 — Calidad

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 12 | Agregar lint + typecheck (`node --check`) | 30 min | `package.json` scripts |
| 13 | Agregar tests automatizados para endpoints críticos | 2-4h | `test-system.js` |
| 14 | Registrar `start` real en package.json | 2 min | `package.json` (hoy apunta a mock-server) |
| 15 | Agregar CSP header | 30 min | `local-server-node.js` |

### Prioridad 4 — Mejoras

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 16 | Validar schemas de respuestas IA antes de parsear | 30 min | `script.js:generateAIContent()` |
| 17 | Agregar health check endpoint | 15 min | `local-server-node.js` |
| 18 | Limpiar `setInterval` en shutdown graceful | 15 min | `local-server-node.js:1457` |

---

## 6. VERIFICACIÓN

Para validar cambios:

1. **Secrets**: `git diff` — confirmar que `._backup/` está en `.gitignore`
2. **Command Injection**: Buscar `execSync` residual con `grep -rn "execSync.*shell:.*true"`
3. **XSS**: Buscar `innerHTML` residual con `grep -n "innerHTML" script.js`
4. **Service Role**: Confirmar que `lib/supabase.js` tiene advertencia clara
5. **CORS**: `curl -v http://localhost:8000/api/models` — verificar `Access-Control-Allow-Origin`
6. **Sintaxis**: `node --check local-server-node.js && node --check script.js`

---

## 7. RESUMEN EJECUTIVO

**SuitCampanas** es un CMS de marketing con IA funcional y maduro (~75% del roadmap). Su arquitectura de 27 endpoints, 7 modos de operación y fallback multi-modelo es sólida en concepto. Sin embargo, tiene **3 vulnerabilidades críticas**: (1) secrets hardcodeados en 4 archivos (token GAS, Sheet ID, credenciales Drive), (2) 10+ puntos de command injection vía `execSync` con `shell:true`, y (3) XSS masivo por `innerHTML` sin sanitizar en ~30 sitios del frontend. Adicionalmente, los 2 archivos principales (`script.js` con 2605 líneas y `local-server-node.js` con 1495) son monolitos que dificultan el mantenimiento, no hay autenticación en endpoints Supabase, y el CORS está abierto a cualquier origen. Se requiere una intervención de seguridad antes de continuar con nuevas features.
