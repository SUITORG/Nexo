# VALIDACION — Evidencias F3

## 2026-09-24 — Slot 2 LAPVTFU (avatar)

**Scope:** `backend/core.js`, `scripts/brief-generate.js`, `backend/brief-sidebar.js`, `.suit/registry/gas-deployments.yaml`
**Contrato:** `CONTRATO.md` (raíz) — F0 ✓

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `node --check backend/core.js` | PASS |
| 2 | `node --check scripts/brief-generate.js` | PASS |
| 3 | `node --check backend/brief-sidebar.js` | PASS |
| 4 | `node scripts/generate-index.js` | PASS (1560 archivos) |
| 5 | `clasp push` | PASS (10 archivos) |
| 6 | `clasp deploy -i AKfycbz... -d` (ADR-028) | PASS → **@17** |
| 7 | Server Node reiniciado | PASS pid 60784, :3001 |
| 8 | `POST /api/brief/ensure-avatar` sin fotopersonal | PASS → `no_foto`, sin crear archivo |
| 9 | Delegación 19 empresas → `no_foto` (4 reintentos GAS 15s) | PASS 19/19 |
| 10 | `POST /api/brief/assets` (Crear assets) | PASS → avatar `no_foto` (no skip, no duplica logo); 5 campos vacíos → skipped |
| 11 | Vector LAPVTFU TOPLUXF | PASS 7/7 slots intactos tras todas las llamadas |
| 12 | Referencias muertas `_setLapvtfuLogo_`/`_createPlaceholderAsset` | PASS 0 hits |

### E2E real con fotopersonal.png (cteTOPLUXF)

| # | Check | Resultado |
|---|-------|-----------|
| 13 | Diagnóstico: `GAS no respondió en 15s` → causa = patrón GAS 302→echo-GET + timeout 15s | PASS identificado |
| 14 | Fix: `fetchGasJson(..., 2, 180000)` en 5 calls del flujo avatar (`brief-generate.js`) | PASS `node --check` + restart pid 21040 |
| 15 | `POST /api/brief/ensure-avatar` → Gemini Nano Banana genera caricatura desde foto | PASS 51s · `status=ready` `source=generated` `vectorUpdated=true` |
| 16 | Vector TOPLUXF post-E2E | PASS 7/7 slots · slot 2 = avatar ≠ logo (stale sobrescrito) |
| 17 | `avatar.png` creado en raíz cteTOPLUXF | PASS 850070 bytes |
| 18 | Idempotencia 2ª llamada | PASS 11s · `source=existing` · misma URL · sin Gemini |

**Verdict:** PASS (rutas no_foto, delegación, integridad de vector, E2E generación + write-back slot 2 + idempotencia).

**Sin pendientes bloqueados.** Sin commits (decisión: cerrar LAPVTFU primero).

---

## Ciclo gobernanza BRIEF/LAPVTFU (2026-09-25) � F3

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `node --check backend/brief-sidebar.js` / `backend/core.js` / `scripts/tunel.js` | PASS |
| 2 | Parse YAML `lapvtfu.yaml`, `brief-engine.yaml`, `registry/skills.yaml` (js-yaml) | PASS |
| 3 | `clasp push` + `clasp deploy -i AKfycbz... -d` (ADR-028) | PASS � **@19** |
| 4 | `POST action=setNodeBaseUrl` con token + URL cloudflared | PASS `{"success":true}` |
| 5 | `node scripts/tunel.js` E2E: mata t�nel previo ? URL nueva ? registra en GAS | PASS `owen-logistics-happy-town` ? property |
| 6 | `GET {t�nel}/api/brief/companies` (sidebar real, GET) | PASS HTTP 200 + empresas |
| 7 | `node scripts/generate-index.js` (incluye `setNodeBaseUrl_`, `tunel.js`) | PASS 1566 archivos |
| 8 | Invariante celda #7 en CONTRATO.md + 2 sub-contratos creados | PASS commit `6511736` |
| 9 | Sidebar GAS (UI en Sheets) | **PENDIENTE � verificaci�n manual del usuario** |

**Verdict:** PASS (9/10 � el check 9 requiere abrir el sidebar en Sheets).

**Commits:** `6511736` f0 contrato � `3a803a7` f2 fix-tunel � pendiente f2/skills + f3.
**Operaci�n:** para levantar el t�nel en el futuro: `node scripts/tunel.js` (auto-registra la URL en GAS).
**Push a origin:** aplazado � pendiente decisi�n del usuario.

---

## 2026-09-29 — Estándar activos LAPVTFU `*01` en raíz `cte<id>/`

**Scope:** `backend/core.js` (árbol, estándar, dual-read, `shareCteFile_`, `setLapvtfuSlot_`, fix idempotencia), `SUBCONTRATO-ACTIVOS.md` v1.1, `.suit/skills/domain/lapvtfu.yaml` v1.1
**Contrato:** `CONTRATO.md` (raíz) F0 ✓ + `SUBCONTRATO-ACTIVOS.md` ✓ · **Deploy:** `clasp push` + `deploy -i` → **@26 → @27 (misma URL)** · Ciclo F1→F5

| # | Check | Comando/acción | Resultado |
|---|-------|----------------|-----------|
| 1 | Sintaxis GAS | `node --check backend/core.js` | PASS |
| 2 | YAML skills/registries | `temp/valida-mascara.js` (9 YAMLs) | PASS 9/9 |
| 3 | Árbol idempotente | `ensureCteFolders HMP` | PASS "Estructura ya existía", created:[], sin crear `_brief/_activos` |
| 4 | Gate nuevo avatar | `ensureAvatarUrl HMP` | PASS `no_foto` — mensaje `fotoprs01.* (o fotopersonal.* legado)…` |
| 5 | Lectura dual | `getBriefAssets HMP` | PASS success, 7 claves, logo=[] |
| 6 | Compartir manual | `shareCteFile HMP imagenurl-hamburguesas-metroplex.jpg` | PASS shared:true + fileUrl |
| 7 | Escritor de slots | `setLapvtfuSlot HMP slot6←URL` | PASS success + vectorUpdated (única escritura real aprobada) |
| 8 | **Idempotencia (2 corridas)** | `setLapvtfuSlot` ×2 (+5 s) | PASS 2ª → unchanged (tras fix trim @27) — falló en vueltas 1-2 → ver CORRECCIONES |
| 9 | Integridad del vector | GET getAll HMP | PASS **21/21 segmentos**, seg1-3 taxonomía intactos, slot6 = URL válida |

**Verdict:** PASS (9/9 tras 2 iteraciones).

## Evidencia
- Smoke final: `temp/smoke-activos.js` → `RESULTADO: 7/7 PASS` (V1-V6 con V5b).
- Bug encontrado y corregido en caliente: idempotencia del manifiesto (espacios acumulados por rebuild) → fix `_setLapvtfuSlot_` + redeploy **@27** → 2ª corrida `unchanged` ✓.

## GAPs (no verificable ahora)
- Rutas de ESCRITURA de `ensureLogoUrl`/`ensureAvatarUrl` (initials/generación): no ejecutadas en caliente (escribirían slots 1/2 sin aprobación) — cubiertas por sintaxis + mismo camino de escritura ya probado vía `setLapvtfuSlot`.
- Sidebar GAS (botones ensure): verificación manual del usuario (pendiente histórico).
- `generateAsset` V·T·F a raíz: sin subida real (flujo manual por decisión) — lógica `_nextAssetName_` revisada + sintaxis.

**Commits:** `701558e` f1 vivos · `f6219cc` f2 implementación · `4f49cd0` f4 fix idempotencia · (evidencia en este commit).
**Push a origin:** pendiente decisión del usuario.

---

## 2026-09-29 — Migración legacy → estándar (ciclo continuación F2-F3)

**Scope:** `backend/core.js` acción `migrarActivosCte` (dryRun por defecto, `all:true`) · Deploy **@28** (misma URL)

| # | Check | Comando/acción | Resultado |
|---|-------|----------------|-----------|
| 1 | Sintaxis | `node --check backend/core.js` | PASS |
| 2 | DryRun global | `migrarActivosCte {all:true, dryRun:true}` | PASS — 28 cte*, plan=25, conflictos=0, errores=0 (23× TRASH _activos vacías · renombres TOPLUXF avatar/fotoprs + -Suit.Org avatar) |
| 3 | Ejecución | `migrarActivosCte {all:true, dryRun:false}` | PASS — renombrados=3 · trash=23 · conflictos=0 · errores=0 |
| 4 | Estándar visible | `getBriefAssets` TOPLUXF / -Suit.Org | PASS — `avatar01.png`, `fotoprs01.png` en raíz |
| 5 | Post-trash sin romper | `getBriefAssets` HMP (ya sin _activos) | PASS — success, listas vacías, sin error |
| 6 | IDs estables (slots válidos) | GET TOPLUXF vector | PASS — 21/21 segs, slot2 = `uc?id=1bbLUHbz8…` (mismo ID pre-rename) |

**Verdict:** PASS (6/6).
**Nota:** TOPLUXF tiene además un archivo preexistente llamado `logo01` (sin extensión) listado por el path legado `/logo/i` — observación, no migrado (no tocó la regla).
**Commits:** `682a64a` f2 migración + (evidencia en este commit).

---

## 2026-09-29 — Fotos TOPLUXF → slot6 (fotos, multi `;`) — lapvtfu

**Scope:** sin código · acciones existentes `shareCteFile` + `setLapvtfuSlot` · espejo · Ciclo F1-F6

| # | Check | Acción | Resultado |
|---|-------|--------|-----------|
| 1 | Revisión lapvtfu | `getBriefAssets TOPLUXF` | PASS — fotos01/02/03.jpeg en raíz (81/127/79 KB), nombres estándar, multi F ✓ |
| 2 | Share lf-005 | `shareCteFile` ×3 | PASS — URLs `uc?id=1EFTtdJf9…`, `1CHryp0e…`, `1lLZgXo9…` ANYONE |
| 3 | Colocación slot6 | `setLapvtfuSlot6 ← url1;url2;url3` | PASS — separador `;`, orden 01→03 |
| 4 | Integridad | GET getAll | PASS — **21/21** · otros 20 segmentos byte-a-byte idénticos · slot6 exacto |
| 5 | Idempotencia share | re-`shareCteFile fotos02` | PASS |
| 6 | Espejo | `syncToSupabase TOPLUXF` + MCP | PASS — `SYNC_COMPLETE` · len=3057 · **slot6_triple_ok=true** (triple con `;` verificado en Supabase) |

**Verdict:** PASS (6/6) — única escritura: slot6 de TOPLUXF (aprobada).

---

## 2026-10-23 — Políticas privacidad/cookies en identidad (ciclo F3) + smoke tarea A (ensure-campanas)

**Scope:** `GuiaTotal/prompts/IDENTIDAD_CORPORATIVA.md` (Anexo legal) · `.agents/skills/empresa-registro/SKILL.md` · `.agents/skills/guia-total/SKILL.md` · `js/modules/public.js` (`showPolicies`) · `index.html` (bump `?v=`) · `GuiaTotal/MANUAL_OPERACION.md` · `Documentacion/02-tablas-campos.md` · escritura GAS LABARIES
**Contrato:** `CONTRATO.md` (raíz) ✓ · Ronda: 1

| # | Verifica | Comando / acción | Resultado observado | Veredicto |
|---|----------|------------------|---------------------|-----------|
| V1 | Sintaxis JS | `node --check js/modules/public.js` | sin salida de error | PASA |
| V2 | Escritura GAS | POST `action=updateRow` → `Config_Empresas`/LABARIES con `politicas_privacidad` + `politicas_cookies` | `{"success":true}` | PASA |
| V3 | Persistencia | GET `getAll&id_empresa=LABARIES` | priv_len=2699 · cook_len=2409 · notas de revisión legal presentes · refs LFPDPPP/Reg.art14 correctas | PASA |
| V4 | Render modal (con campos) | server :3001 → `?co=LABARIES` → click POLÍTICAS | secciones: **1. AVISO DE PRIVACIDAD** (texto completo, pre-wrap) · **2. POLÍTICA DE COOKIES** (texto completo) · 3. TÉRMINOS COMERCIALES · 4. POLÍTICAS PERSONALIZADAS | PASA |
| V4b | Render fallback (sin campos) | `?co=EVASOL` → POLÍTICAS | 3 secciones (sin cookies): 1. AVISO DE PRIVACIDAD = texto base (91 chars) · 2. TÉRMINOS · 3. PERSONALIZADAS (4180 chars intactos) | PASA |
| V5 | Tarea A: ensure-campanas | :8000 apagado → `GET /api/ensure-campanas` → espera 8s → `GET :8000` | `HTTP 200 {"running":false,"starting":true}` → 8000 **True** → responde 200 | PASA |

## Evidencia
- V2-V3: POST/GET contra GAS live (`AKfycbzh…EwN/exec`), respuesta `success:true` y relectura con conteos.
- V4/V4b: snapshots Chrome DevTools (modal LABARIES 4 secciones con texto legal completo; EVASOL 3 secciones con fallback).
- V5: `Test-NetConnection` 8000 antes=False / después=True + HEAD 200.
- Nota: arranque de `server.js` tuvo 1 intento fallido por `EADDRINUSE :3006` (otra instancia previa); segundo intento OK tras liberarse el puerto.

## GAPs (no verificable ahora)
- Flujo completo de la máscara Sección E en navegador (requiere login DIOS) — solo se validó el endpoint que invoca.
- Espejo Supabase `Config_Empresas` **no tiene** las 2 columnas nuevas → PLAN-SYNC (F5), nada ejecutado sin aprobación.

## Veredicto global
**PASA** (6/6) — redacción + escritura + render + fallback + endpoint tarea A.

---

## 2026-10-23 — Sync espejo Supabase (ciclo F5 PLAN-SYNC + F6 visto bueno)

**Scope:** espejo Supabase `Config_Empresas` (proyecto `egyxgnlnzanxpqyuvmsg`) · `ALTER ADD COLUMN` + `syncToSupabase LABARIES` · aprobado por usuario (F6)
**Contrato:** `CONTRATO.md` ✓ · Ronda: 1

| # | Verifica | Acción | Resultado | Veredicto |
|---|----------|--------|-----------|-----------|
| F5 | Columnas ausentes | `information_schema.columns` = 0 filas para las 2 col. | confirmado divergente del maestro GSHEETS | PLAN-SYNC escrito |
| F6.1 | ALTER | `ADD COLUMN IF NOT EXISTS politicas_privacidad/cookies text` | `{"success":true}` | PASA |
| F6.2 | Sync 1er intento | `syncToSupabase LABARIES` (GAS) | `SYNC_COMPLETE` pero SELECT = NULL (no-op) | FALLA transitoria |
| F6.3 | Diagnóstico | PK `Config_Empresas_pkey(id_empresa)` existe · 13 filas · 0 dup · 0 null | schema OK → no es PK | — |
| F6.4 | Purga caché + upsert directo PostgREST | POST merge-duplicates LABARIES (anon) | HTTP 200 · pobla 2699/2409 | PASA |
| F6.5 | Re-sync oficial GAS | `syncToSupabase LABARIES` | `SYNC_COMPLETE` · SELECT **mantiene 2699/2409** | PASA |

**Causa raíz F6.2:** caché de schema de PostgREST recién tras el ALTER (upsert no ve columnas nuevas). Con caché tibio (tras F6.4) el sync oficial GAS pobla y sostiene. **Lección registrada:** tras ALTER, dejar reposar/upsert de prueba antes de confiar en `syncToSupabase`.

**GAP:** ninguna. Espejo LABARIES consistente con maestro GSHEETS. Brecha preexistente de cobertura (13 espejo vs 21 GAS) anotada en PLAN-SYNC, fuera de alcance.

## Veredicto global F5/F6
**PASA** — espejo Supabase poblado y sostenido (2699/2409) bajo visto bueno del usuario.

---

## 2026-10-24 — Sección E-a) cadena 100% automática: copy → imágenes → zip (nueva feature)

**Scope:** `SuitCampanas/local-server-node.js` (3 endpoints + extensión estado) · `mascara.html` (casillas ☑ copy/img/zip + poll + auto-zip) · `.gitignore` (descargas/)
**Decisiones usuario:** 1 imagen por pieza · motor Remotion still (`/api/vire-still` self-HTTP)

| # | Verifica | Acción | Resultado | Veredicto |
|---|----------|--------|-----------|-----------|
| V1 | Sintaxis server | `node --check local-server-node.js` | sin errores | PASA |
| V1b | Sintaxis máscara | JS inline extraído → `node --check` (1 bloque) | sin errores | PASA |
| V2 | Contadores | `GET estado-campanas/SUITORG` | `copy: 6/6 · img: 0/6` (campos nuevos) | PASA |
| V3 | Render batch | `POST render-imagenes` → poll `img-status` | **6/6 PNGs en 96s**, 0 errores, log por pieza (`C1-1..C3-2 ok`) | PASA |
| V4 | Zip | `GET descargar` | HTTP 200 · `application/zip` · `kit_SUITORG.zip` 6.5MB · magic `PK` | PASA |
| V5 | Idempotencia | re-`POST render-imagenes` | 6× "ya existe ✓", done 6/6, **0 regeneraciones** | PASA |
| V6 | UI máscara | Chrome: `mascara.html` → SUITORG → sec E | chip `6%` verde · `st-ea = "6/6 copy · 6/6 img"` · casillas copy/img/zip presentes (on/on/on) | PASA |

## Evidencia
- PNGs en `SuitCampanas/descargas/SUITORG/`: pieza_C1-1 (1.5MB) … C3-2 (850KB), 6 archivos, 48KB–2MB.
- Zip 6.5MB con Content-Disposition attachment (bajado vía fetch-blob en la máscara, maneja 404).
- Plan real del usuario: `plan_1792817039033` (SUITORG, aprobado 2026-10-24 04:43).

## GAPs
- No se probó el clic completo "Generar campaña" con ☑ desde la máscara (regeneraría copy con llamadas IA nuevas); cada tramo sí está verificado por separado (V2–V5) + lógica de cadena con `node --check`.

## Veredicto global
**PASA** (7/7) — cadena copy→imágenes→zip operativa desde la Sección E-a).
