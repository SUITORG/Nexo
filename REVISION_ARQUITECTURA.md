# Revisión de Arquitectura — SuitOrg

**Fecha**: 2026-07-19
**Proyecto**: `C:\Users\rojo-\Downloads\suitorg`
**Tipo**: Análisis de arquitectura, procesos y seguridad (solo lectura)
**Stack**: Node.js Express + Google Apps Script + Supabase/PostgreSQL + Vanilla JS SPA + Python (CV/Media) + React/Remotion

---

## 1. ESTRUCTURA ACTUAL

```
suitorg/
├── .suit/                     ← SuitOS Kernel (62 archivos YAML/MD)
├── backend/                   ← GAS Backend (6 archivos)
├── js/modules/                ← Frontend SPA (12 módulos vanilla)
├── server.js                  ← Express principal (puerto 3001)
├── index.html                 ← SPA principal (1920 líneas)
├── SuitCampanas/              ← CMS campañas (puerto 8000, 25 archivos)
├── SuitAI/                    ← Model Discovery + Routing
├── SuitReservaciones/         ← Reservaciones + WhatsApp (puerto 3002)
├── SuitCotizador/             ← Motor cotizaciones (puerto 3003)
├── SuitProductos/             ← Catálogo (puerto 3007)
├── SuitInventarios/           ← Inventarios (puerto 3008)
├── SuitBodega/                ← Bodega (puerto 3009)
├── SuitPedidoExpress/         ← Pedidos (puerto 3005)
├── SuitPos/                   ← POS (puerto 3006)
├── SuitVidGenRemotion/        ← ViRe Remotion (puerto 3004)
├── SuitIngles/                ← React + Vite + TS
├── SuitCVLO/                  ← Computer Vision (Python)
├── SuitWhatsapp/              ← Utilidades WhatsApp
├── Citas/                     ← ← MÓDULO DUPLICADO (reemplazado por SuitReservaciones)
├── Conecionpagos/             ← Stripe multi-tenant
├── Prospectos/                ← Prospector autónomo
├── SuitOSCore/                ← SuitOS Core (scaffolder, tooling)
├── SuitMusic/ SuitSubtitles/ SuitTTS/ SuitVideoAssembly/ SuitStableDiffusion/ SuitFFmpeg/
├── PresentacionesVid/         ← Presentaciones HTML generadas
├── Documentacion/             ← Migraciones SQL + docs
├── scripts/                   ← Scripts utilitarios + agentes (reportero, probador)
├── knowledge/                 ← Base de conocimiento de negocio
└── telegram-opencode-loop/    ← Bot Telegram (Python)
```

**Total**: ~518 archivos fuente, ~24 submódulos, 12 servidores/backends.

---

## 2. HALLAZGOS CRÍTICOS

### CRÍTICO — Fuga masiva de secrets

| Archivo | Línea | Hallazgo | Impacto |
|---------|-------|----------|---------|
| `.env` | 6-50 | **Todas** las credenciales en texto plano (Supabase service_role, Stripe secret, Gemini, OpenRouter, WhatsApp, Drive) | Exposición total si el repo es público |
| `google-credentials.json` | 1-13 | Google Service Account **private key** completa | Acceso total a GCP |
| `js/modules/config.js` | 7-9 | API token + Supabase anon key en frontend | Expuestas al navegador |
| `backend/core.js` | 215 | Token de orquestación hardcodeado `"PROTON-77-X"` | Operaciones privilegiadas sin autenticación real |
| `backend/database.js` | 167 | Password `"Sudo1234."` hardcodeada en seed | Acceso nivel DIOS si se usa en producción |

### CRÍTICO — Path Traversal en `/api/local/save`

| Archivo | Línea | Código |
|---------|-------|--------|
| `server.js` | 53-71 | `const { path: filePath } = req.body; fs.writeFileSync(path.join(__dirname, filePath), ...)` |

El cliente envía la ruta. `path.join` no previene traversal con rutas absolutas. Un atacante puede escribir archivos arbitrarios.

### CRÍTICO — XSS masivo por `innerHTML` sin sanitizar

| Archivo | Líneas | Uso |
|---------|--------|-----|
| `js/modules/public.js` | 30+ sitios | `innerHTML` con datos de empresa, usuarios, contenido CMS |
| `js/modules/agents.js` | 504 | `innerHTML` con respuestas de IA (no sanitizadas) |
| `js/modules/router.js` | 204 | `innerHTML` con hash de URL |
| `PresentacionesVid/*.html` | 162 | `document.body.innerHTML` desde localStorage |
| `SuitCotizador/public/js/cotizador.js` | 68,89,98 | `innerHTML` con mensajes de error |

### CRÍTICO — 6 módulos con `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)

| Archivo | Impacto |
|---------|---------|
| `server.js:104-108` | Admin client global sin filtro `id_empresa` en `/api/db/*` |
| `SuitBodega/db/client.js` | Bypass RLS en bodega |
| `SuitCotizador/server.js` | Bypass RLS en cotizador |
| `Citas/db/client.js` | Bypass RLS en citas |
| `SuitReservaciones/db/client.js` | Bypass RLS en reservaciones |
| `supabase.js` | Bypass RLS en módulo genérico |

---

## 3. PROBLEMAS DE ARQUITECTURA

### 3.1 Duplicación de módulos

| Módulo Legacy | Módulo Nuevo | Riesgo |
|---------------|--------------|--------|
| `Citas/` | `SuitReservaciones/` | Ambos activos y montados en server.js |
| `backend/ai_engine.js` (GAS) | `SuitAI/` (Node.js) | Dos motores AI paralelos |
| `drive_manager.gs` | `backend/DriveManager.js` | Dos implementaciones Drive |
| `backend/utils.js:syncToSupabase()` | `server.js:/api/db/:table` | Dos caminos de escritura a Supabase |

### 3.2 db/client.js duplicado en 6 módulos

`createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` copiado en:
- `SuitBodega/db/client.js`
- `SuitCotizador/server.js:10-14`
- `Citas/db/client.js`
- `SuitReservaciones/db/client.js`
- `supabase.js`
- `server.js:104-108`

Cada uno es un punto de fuga de `service_role`. Debería ser un singleton central.

### 3.3 Endpoints `/api/ai/generate` y `/api/ai/chat` casi idénticos

`server.js:111-165` y `server.js:168-203` — solo varían `maxOutputTokens`. Código duplicado.

### 3.4 Backend dual inconsistente

Google Sheets (GAS) y Supabase (Node.js) implementan CRUD superpuestos con semánticas distintas. La migración está en progreso pero ambos sistemas activos crean inconsistencia.

### 3.5 Violaciones a reglas de AGENTS.md

| Regla | Violación | Archivo |
|-------|-----------|---------|
| #6 Soft delete | `deleteRow()` en GAS | `backend/utils.js:80` |
| #6 Soft delete | `delete()` en Supabase | `server.js:273-276` |
| #7 IDs secuenciales | `"RES-" + timestamp` | `backend/core.js:241` |
| #12 Service Role en cliente | En 6 archivos | Múltiples `db/client.js` |
| #22 Secrets en código | `config.js:7-9` | Frontend |

### 3.6 Archivos excesivamente grandes

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `SuitIngles/index.html` | ~4200 | JS embebido masivo |
| `SuitCampanas/script.js` | 2605 | Toda la lógica en un archivo |
| `js/modules/public.js` | 2300 | Demasiadas responsabilidades |
| `index.html` | 1920 | CSS+HTML+JS inline |
| `js/modules/pos.js` | 1479 | POS monolítico |
| `js/modules/admin.js` | 1204 | Admin monolítico |
| `js/modules/agents.js` | 1177 | Agentes monolítico |

---

## 4. LO QUE ESTÁ BIEN HECHO

### Arquitectura multi-tenant sólida
- Toda query relevante filtra por `id_empresa` (~90+ referencias)
- IDs secuenciales por tenant (LEAD-XXX, ORD-XXX, COT-XXX)
- Soft delete implementado en la mayoría del código nuevo
- RBAC con niveles DIOS(999), ADMIN(10), STAFF(5), DELIVERY

### Manejo de errores consistente
- Todos los endpoints de Express envueltos en try/catch
- Error logging centralizado en frontend vía `POST /api/logs/error`
- Circuit breaker en SuitAI para modelos fallidos

### Patrones de diseño aplicados
- Proxy/Gateway para APIs externas (Gemini, Stripe, OpenRouter)
- Strategy para fallback de modelos AI
- Module Pattern para microservicios Express
- Dual-Write para migración GAS → Supabase

### SuitOS (`.suit/`) como capa de orquestación
- Registry completo (agents, skills, projects, workflows, routing, permissions)
- Workflows declarativos para feature/bugfix/deploy/review/test
- Skills reutilizables definidos en YAML
- Index de funciones (`INDEX_FUNCIONES.md`) generado automáticamente

### Scaffolder de módulos
- `SuitOSCore/scaffold/create-suit-module/` — genera módulos Express completos con templates
- `scripts/generate-index.js` — mantiene `INDEX_FUNCIONES.md` actualizado

---

## 5. RECOMENDACIONES PRIORIZADAS

### Prioridad 1 — Seguridad (INMEDIATO)

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 1 | Rotar **todas** las credenciales expuestas (asumir comprometidas): Supabase service_role, Stripe, Gemini, OpenRouter, WhatsApp, Google Service Account | 30 min | `.env`, `google-credentials.json` |
| 2 | Eliminar `google-credentials.json` y `.env` del repo, agregar a `.gitignore`, usar variables de entorno | 5 min | Raíz |
| 3 | **Deshabilitar** endpoint `/api/local/save` o agregar whitelist de rutas + validación anti-traversal | 30 min | `server.js:53-71` |
| 4 | Sanitizar todos los `innerHTML`: reemplazar con `textContent` o implementar `escapeHtml()` | 2-4h | `public.js`, `agents.js`, `router.js`, `cotizador.js` |

### Prioridad 2 — Calidad

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 5 | Agregar autenticación y filtro `id_empresa` a `/api/db/*` y `/api/storage/*` | 1h | `server.js:207-321` |
| 6 | Centralizar `db/client.js` en un singleton con service_role | 30 min | Todos los `Suit*/db/client.js` |
| 7 | Migrar todas las claves de `config.js` a `.env` con proxy backend | 30 min | `js/modules/config.js` |
| 8 | Eliminar módulo `Citas/` (reemplazado por `SuitReservaciones/`) | 30 min | `Citas/` |

### Prioridad 3 — Arquitectura

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 9 | Dividir `public.js` (2300 líneas) en módulos más pequeños | 2-4h | `js/modules/public.js` |
| 10 | Dividir `SuitCampanas/script.js` (2605 líneas) en módulos | 2-4h | `SuitCampanas/script.js` |
| 11 | Refactorizar `/api/ai/generate` y `/api/ai/chat` en un solo handler | 30 min | `server.js:111-203` |
| 12 | Eliminar `deleteRow()` en GAS, implementar soft delete real | 1h | `backend/utils.js:80` |

### Prioridad 4 — Mejoras

| # | Recomendación | Esfuerzo | Dónde |
|---|---------------|----------|-------|
| 13 | Endurecer CSP: eliminar `unsafe-inline` y `unsafe-eval`, usar nonces | 2h | `server.js:37-38` |
| 14 | Agregar rate limiting a endpoints públicos | 1h | `server.js` |
| 15 | Unificar sistema de IDs secuenciales (timestamp no es secuencial) | 30 min | `backend/core.js:241`, `backend/utils.js:198` |
| 16 | Agregar marcadores TODO/FIXME para documentar deuda técnica | 15 min | General |

---

## 6. VERIFICACIÓN

Para validar los cambios recomendados:

1. **Secrets**: `git diff` para confirmar que `.env` y `google-credentials.json` fueron eliminados del tracking.
2. **Path traversal**: Probar `curl -X POST -H "Content-Type: application/json" -d '{"path":"../../../etc/test","data":"x"}' http://localhost:3001/api/local/save` → debe rechazar.
3. **XSS**: Buscar `innerHTML` residual con `grep -rn "innerHTML" js/modules/`.
4. **Service Role**: Confirmar que solo `server.js` crea el admin client, los módulos lo importan.
5. **Arquitectura**: `node --check` en todos los archivos JS después de refactors.
6. **Duplicación**: Confirmar que `Citas/` fue eliminado y server.js ya no lo monta.

---

## 7. RESUMEN EJECUTIVO

SuitOrg es un ecosistema multi-inquilino maduro con ~518 archivos fuente, 24 submódulos y 12 servidores. Su arquitectura de microservicios Express + GAS + Supabase es sólida en concepto, pero tiene **3 vulnerabilidades críticas que requieren acción inmediata**: (1) fuga masiva de secrets en `.env` y `google-credentials.json`, (2) path traversal en `/api/local/save` que permite escritura arbitraria de archivos, y (3) XSS masivo por `innerHTML` sin sanitizar en toda la SPA. Adicionalmente, 6 módulos usan `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS, y hay duplicación de módulos (`Citas/` vs `SuitReservaciones/`). Las fortalezas incluyen un multi-tenant bien implementado, manejo de errores consistente, y una capa SuitOS que define workflows y skills para agentes de IA. Se requiere una rotación inmediata de credenciales, deshabilitar el endpoint vulnerable, y sanitizar las inserciones HTML antes de cualquier otro cambio.
