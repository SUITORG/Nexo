# VALIDACION - ciclo: guia-total SuitCampanas (validación F3)
Fecha: 2026-10-24 · Contrato: SuitCampanas/CONTRATO.md · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | Syntax check | N/A | `node --check local-server-node.js` | Sin errores | PASA |
| V2 | Parser `parseBrief()` (20 asserts) | NOET / GSHEETS | `node scripts/tmp_test_parser.js` | ALL_ASSERTS_PASS (20/20) tras fix | PASA |
| V3 | Servidor arranca y responde | N/A | `node local-server-node.js` + `GET :8000` | HTTP 200, 73,916 bytes | PASA |
| V4 | Fetch BRIEF desde GAS | NOET / GSHEETS | `GET GAS?action=getAll` → filtra NOET | logo_url 1,165 chars, segmento 0 = `industria: ...` | PASA |
| V5 | Supabase tablas accesibles | Global / SUPABASE | Query `Prompts_IA`, `planes_medios`, `piezas_creativas` | 5, 3, 3 rows respectivamente | PASA |
| V6 | Prompts CAMP-* habilitados | Global / SUPABASE | Query `Prompts_IA` WHERE `id_agente LIKE 'CAMP-%'` | 3/3 encontrados y `habilitado=TRUE` | PASA |
| V7 | BRIEF real NOET parsea end-to-end | NOET / GSHEETS | `parseBrief(logo_url)` con datos reales de GAS | 11/11 checks PASS | PASA |

## Evidencia
- V1: `node --check` exit code 0
- V2: salida `ALL_ASSERTS_PASS` - cubre industria, nicho, producto, dolor, PBP, objetivo, canal, activos posicionales (7 slots), precio_margen, objeciones, prueba_social, RLP, oferta, cta, legado tipo_negocio
- V3: `Invoke-WebRequest http://localhost:8000` → HTTP 200, 73916 bytes (index.html)
- V4: GAS_URL del server (`AKfycbwbyoj...`) con `action=getAll` → `Config_Empresas` con 25 filas; NOET encontrada con BRIEF completo
- V5: Supabase `Prompts_IA` 5 rows, `planes_medios` 3 rows, `piezas_creativas` 3 rows - sin errores
- V6: 6 prompts CAMP-* en DB, los 3 requeridos (MEDIAPLANNER, BRIEFMARKER, STYLEDIRECTOR) habilitados + CAMPAIGN-QA bonus
- V7: `parseBrief()` sobre `logo_url` real de NOET → 11/11 checks (industria, nicho, producto, dolor lista, pbp string, objetivo, canal, activos obj, precio_margen, cta, etiqueta_legado vacío)

## Corrección aplicada durante validación
- **V2 FALLABA inicialmente**: `pbp` estaba en `BRIEF_LIST_FIELDS` (convertía PBP a lista), contradiciendo ADR-026 que dice que PBP debe caer como texto libre. Fix: removido `pbp` del mapa. Ver `CORRECCIONES.md`.

## GAPs (no verificable ahora)
- Generación end-to-end con IA real (MediaPlanner → BriefMarker): requiere OmniRoute activo - no probado en esta ronda (depende de servicio externo)
- Render de video (VIDE/ViRe): requiere FFmpeg + Edge TTS + tiempo de render - no probado en esta ronda
- Aislamiento multi-inquilino (empresa A no ve datos de B): no probado - el BRIEF es de solo lectura desde GAS, no hay escritura cruzada que verificar

## Veredicto global
**PASA** - 7/7 pruebas PASS. Corrección de V2 aplicada y re-verificada. Pendiente: smoke test end-to-end con IA real (fuera del alcance de esta ronda).

---

## Ronda 2 - Fase 1 visual (2026-10-24)

| ID | Verifica | Empresa | Acción | Resultado observado | Veredicto |
|----|----------|---------|--------|---------------------|-----------|
| V8 | Sintaxis Node | N/A | `node --check local-server-node.js` + `script.js` | Sin errores | PASA |
| V9 | Sintaxis Python | N/A | `python -m py_compile generators/static_renderer.py` | Sin errores | PASA |
| V10 | Servidor sano | N/A | `GET :8000/api/health` | `{status: success, omniroute: true, internet: true}` | PASA |
| V11 | Render de piezas LABARIES | LABARIES / GSHEETS | `POST /api/media-plan/plan_1792868536593/render-imagenes` | 7/7 piezas, 0 errores; 1080x1350 (Post/Story) y 1080x1080 (Banner) | PASA |
| V12 | Sin watermark / sin fondo vacío | LABARIES | Inspección visual de 7 PNG | 7/7 con foto real del Brief o Gemini; 0 watermark | PASA |
| V13 | Estilo y paleta aplicados | LABARIES | Inspección visual + `plan.estilo_visual` | `paper`, accent `#00CCFF`, logo y CTA visibles | PASA |

### Evidencia Ronda 2
- `SuitCampanas/descargas/LABARIES/` - 7 PNG finales.
- `SuitCampanas/docs/comparativa-fase1-2026-10-24.png` - antes (Pollinations, estudio fotográfico) vs después (foto real + layout de marca).
- `SuitCampanas/docs/kit-labaries-fase1-2026-10-24.png` - las 7 piezas finales de LABARIES en una hoja de contacto.
- `SuitCampanas/docs/comparativa-actual-vs-gemini-2026-10-24.png` - calidad de imagen actual vs Gemini 3 Pro.
- Cambios: `mascara.html` ya no manda `estilo_visual: null`; `approveMediaPlan()` auto-resuelve template; `runPiezaImgJob()` usa fotos reales + `brand_colors`; `generators/static_renderer.py`; Gemini 2.5 Flash default; `render.js --still` hace `process.exit(0)`.

### GAPs Ronda 2
- QA de copy/claims: se detectó "puedes agenda" y un claim no verificado ("80% de nuestros clientes...") en el copy generado por IA. Requiere Fase 3.
- Body opcional: cuando el hook se repite, la pieza queda con espacio vacío (no rompe, pero se puede enriquecer).
- Segunda empresa (SUITORG) aún no re-renderizada con el pipeline nuevo.
- Video real (MP4) todavía no se genera desde el alta; Fase 4.

---

## Ronda 2.1 - switch de estilo por empresa (2026-10-24)

| ID | Verifica | Acción | Resultado observado | Veredicto |
|----|----------|--------|---------------------|-----------|
| V14 | Tabla `empresa_estilo_config` | Consulta SQL | 13 empresas sembradas en `auto` | PASA |
| V15 | API GET/POST | `GET /api/estilo-config/LABARIES` → `POST manual 41` → `GET` → `POST auto` | `auto` → `manual/41` → `auto`, sin errores | PASA |
| V16 | UI mácara | `node --check` del script inline extraído | Sin errores de sintaxis | PASA |

| V17 | UI real (Playwright) | Abrir mácara, elegir LABARIES, cambiar a manual y estilo 41 | 37 estilos cargados, toast “Estilo visual guardado”, Supabase `manual/41`, 0 errores de consola | PASA |

### Evidencia Ronda 2.1
- Migración: `database/migrations/2026-10-24_empresa_estilo_config.sql`.
- Endpoints en `local-server-node.js`: `GET/POST /api/estilo-config/:id_empresa`.
- UI: `mascara.html` Sección E → “Estilo visual” (Automático / Elegir estilo).
- Playwright: `mascara.html` cargó 37 estilos; el switch guardó `manual/41` en Supabase y luego se regresó a `auto` para no dejar estado de prueba.
- `resolveEstiloVisualForEmpresa()` lee la config y, en manual, usa el `id_subestilo` elegido; si no existe, cae a auto.
