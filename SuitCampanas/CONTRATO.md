# CONTRATO — SuitCampanas (Campañas AI)
Alcance: `SuitCampanas/` · Contrato padre: `./CONTRATO.md` (raíz) · Fecha: 2026-10-24

## Propósito
CMS de generación de campañas publicitarias con IA. Pipeline Brief → MediaPlanner → BriefMarker → VIDE/ViRe que produce videos, posts y stories a partir de datos de empresas en Google Sheets + Supabase.

## Stack y ejecución
- Lenguaje / runtime: Node.js 18+ (CommonJS), vanilla JS frontend, Google Apps Script (backend GAS), FFmpeg
- Comandos: instalar `npm install` · desarrollo `npm start` (puerto 8000) · mock `npm run mock` · pruebas: manual con `test.html` · seed `node scripts/seed-supabase.js`
- Variables de entorno requeridas (solo nombres): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_DIRECT_KEY`, `FREESOUND_API_KEY`, `PEXELS_API_KEY`, `API_AUTH_TOKEN`, `GAS_URL`

## Datos y multi-inquilino
- Consume `Config_Empresas`: **sí** · campos usados: `logo_url` (BRIEF vector), `tipo_negocio`, `nomempresa`, `db_engine`, `modo`, `galeria`, flags `usa_*`, campos de contacto
- Motores soportados: GSHEETS (principal vía GAS) + SUPABASE (tablas `planes_medios`, `piezas_creativas`, `video_subestilos`, `video_categorias_estilo`, `video_tendencias_estilo`, `Prompts_IA`, `recetas`, `tendencias`)
- Ubicación de esquema o migraciones: Supabase (tablas creadas por seed scripts) + Google Sheets (`Config_Empresas`, `Prompts_IA` vía GAS)
- Reglas de aislamiento entre empresas: toda query filtrada por `id_empresa`; `id_empresa='ALL'` solo para sub-estilos compartidos

## Límites
- Puede modificar: `SuitCampanas/**` (todo el subproyecto)
- No debe tocar: raíz del repo (`server.js`, `js/`, `scripts/ssg-engine.mjs`), otros subproyectos (`SuitVidGen/`, `SuitPos/`, etc.) — salvo permiso explícito
- Dependencias con otros subproyectos: lee BRIEF de `Config_Empresas` (compartido con raíz); usa `SuitVidGenRemotion` (ViRe) para renders; CapCut MCP (`vectcutapi-mcp/`) para ViCap

## Invariantes (no romper nunca)
1. Voz: **Edge TTS neuronal** — no gTTS, no versión npm no-comercial
2. IA: **OpenRouter/Gemini primario, Ollama local como 3er fallback** — nunca depender de un solo proveedor
3. El estilo visual de un video se fija en la 1ª aprobación del plan y no cambia en reintentos
4. Overlays de logo/avatar/contacto van como miniaturas sobrepuestas, nunca como slides separados
5. Campos autollenados desde Google Sheets: normalizar/tolerar variaciones de formato, nunca blanquear silenciosamente
6. `SuitCampanas/` no pasa por GitHub Pages — es servidor local propio (puerto 8000)
7. BRIEF vive en `Config_Empresas.logo_url` (pipe-delimited), NO en `tipo_negocio` (ver ADR-025/026)
8. Prompts de IA en `Prompts_IA` (Supabase) con IDs `CAMP-MEDIAPLANNER`, `CAMP-BRIEFMARKER`, `CAMP-STYLEDIRECTOR`

## Definición de terminado
- Validación en PASA con evidencia en `VALIDACION.md`
- Commit por fase
- Sync de datos solo con visto bueno explícito

## Anexo heredado
N/A (primer contrato)

## POR CONFIRMAR
- `PPELS_API_KEY` y `FREESOUND_API_KEY` — ¿están activas en `.env` o solo como fallback?
- ¿SuitCampanas vende a clientes externos o es herramienta interna de SuitOrg? (afecta si aplica MANUAL_VENTAS/DEMO/INSTALACION)
- Estado real del pipeline VIDE end-to-end en el navegador del usuario (pendiente desde CLAUDE.md)

## Cambios
- 2026-10-24: Contrato inicial creado (fase 0 de guia-total)
