# MANUAL TÉCNICO — SuitCampanas (Campañas AI)

> **Para qué sirve este manual:** documenta el backend para quien mantiene y configura el sistema: arquitectura, variables de entorno, base de datos, despliegue, monitoreo y recuperación.
> **Audiencia:** backend — desarrollador o administrador técnico del proyecto.
> **Versión:** 1.0 · **Última actualización:** 2026-10-24 · **Stack:** Node.js + GAS + Supabase · **Puerto(s):** 8000

---

## Resumen en corto (tabla técnica)

| Aspecto | Qué es |
|---|---|
| **Alcance** | Carpeta `SuitCampanas/` — módulo independiente |
| **Tipo** | Aplicación web local (servidor Node + frontend SPA vanilla) |
| **Frontend** | SPA vanilla (`index.html` + `script.js` + `style.css`) |
| **Backend** | Node.js HTTP server (`local-server-node.js`, puerto 8000) |
| **Base de datos** | Google Sheets (vía GAS) + Supabase (`planes_medios`, `piezas_creativas`, `video_*`, `Prompts_IA`) |
| **¿Google Sheets?** | Sí — `Config_Empresas`, `Prompts_IA` (fuente de verdad) |
| **Configuración** | `.env` (raíz del repo) + `Config_Empresas` |
| **Para correrlo** | `npm start` (o `iniciar.bat`) |

## 1. Arquitectura general

```
Frontend (browser, puerto 8000)
    ↓ fetch
local-server-node.js (Node, puerto 8000)
    ├→ GAS (Google Sheets: Config_Empresas, prompts)
    ├→ Supabase (planes_medios, piezas_creativas, video_subestilos)
    ├→ OpenRouter/Gemini (IA: MediaPlanner, BriefMarker, StyleDirector)
    ├→ Ollama local (fallback IA)
    ├→ Edge TTS (voz es-MX)
    ├→ FFmpeg (video encode)
    └→ SuitVidGenRemotion (ViRe renders, puerto 3004)
```

## 2. Stack y ejecución

- **Requisitos de equipo:** CPU 4+ núcleos · RAM 8+ GB · Windows (WSL para bash) · Node 18+ · FFmpeg en PATH · navegador moderno
- Runtime / lenguaje: Node.js (CommonJS), vanilla JS, Google Apps Script
- Comandos: instalar `npm install` · desarrollo `npm start` · mock `npm run mock` · seed `node scripts/seed-supabase.js`
- Puertos: **8000** (este servidor) · 3004 (ViRe, opcional) · 8000 es el único obligatorio

## 3. Variables de entorno

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase | sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Key admin Supabase (bypass RLS) | sí |
| `OPENROUTER_API_KEY` | IA primaria (OmniRoute gateway) | sí |
| `OPENROUTER_DIRECT_KEY` | IA directa (visión, sin OmniRoute) | sí |
| `FREESOUND_API_KEY` | SFX con licencia CC0 para VIDE | no (opcional) |
| `PEXELS_API_KEY` | Fotos stock para ViCap | no (opcional) |
| `API_AUTH_TOKEN` | Auth GAS POST | sí |
| `GAS_URL` | URL del deployment GAS | sí |

**Nunca** commitear secretos al repo. Todos en `.env` (raíz del repo, gitignored).

## 4. Base de datos y esquema

### Google Sheets (fuente de verdad)
- `Config_Empresas` — registro de tenants (BRIEF en `logo_url`, contacto, flags)
- `Prompts_IA` — prompts de IA (`CAMP-MEDIAPLANNER`, `CAMP-BRIEFMARKER`, `CAMP-STYLEDIRECTOR`)

### Supabase (tablas operativas)
- `planes_medios` — planes generados por MediaPlanner
- `piezas_creativas` — piezas individuales por BriefMarker
- `video_subestilos` — catálogo de estilos visuales
- `video_categorias_estilo` — categorías de estilos
- `video_tendencias_estilo` — uso real de estilos
- `Prompts_IA` (espejo Supabase)
- `recetas`, `tendencias` — contenido del Agente de Tendencias

## 5. Prompts de IA

Los 3 prompts maestros viven en Supabase `Prompts_IA` (IDs: `CAMP-MEDIAPLANNER`, `CAMP-BRIEFMARKER`, `CAMP-STYLEDIRECTOR`). Seed: `node scripts/seed-media-plan-prompts.js`.

**Nota:** GAS es fuente de verdad para `Prompts_IA` — el sync 5-min upserta desde GAS.

## 6. Despliegue

No se despliega a GitHub Pages. Es servidor local:
1. `npm start` → abre `http://localhost:8000`
2. GAS se despliega por separado con `clasp push && clasp deploy` (desde `SuitCampanas/`)

## 7. Monitoreo y logs

- Logs del server: stdout de `local-server-node.js` (formato `serverLog`)
- Supabase: dashboard de la consola (tablas `planes_medios`, `piezas_creativas`)

## 8. Recuperación ante fallos

| Fallo | Causa probable | Acción |
|---|---|---|
| OmniRoute cae | Gateway local no corriendo | Ollama local como fallback (lento ~60-90s) |
| GAS no responde | Deployment vencido o URL cambiada | `clasp deploy` y actualizar `GAS_URL` |
| FFmpeg no encontrado | No está en PATH | Instalar FFmpeg y agregar al PATH |
| Supabase error | Key vencida o tabla no existe | Regenerar key, correr seed script |

## 9. Respaldo

- Google Sheets: respaldo nativo de Drive
- Supabase: backup automático (dashboard → Database → Backups)
- Código: git (push a `main`)
