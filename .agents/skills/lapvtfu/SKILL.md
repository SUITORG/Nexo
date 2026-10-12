---
name: lapvtfu
description: "Activos del Brief (LAPVTFU): verifica, asegura, GENERA y escribe los 7 slots posicionales del segmento LAPVTFU (en Config_Empresas.logo_url) sobre la raíz de cte<id>/ con share ANYONE e idempotencia total. v1.2 agrega MODO GENERACIÓN para negocios creados por input/demo (eslabón activos en auto|preguntar, o comando explícito): Fotos (hasta 6) y Videos cortos (1-3) con motores locales; Testimonios solo en DEMO y marcados; nunca inventa en modo manual ni en clientes reales; jamás sobreescribe un activo existente. Skill canónica del eslabón `activos` de la cadena de alta."
license: MIT
compatibility: "Claude Code y opencode. Requiere: red al webapp GAS (@25), skills de cadena (empresa-mascara, empresa-registro, brief-engine); Google Flow MCP (clone local, ADR-050, preferente); motores locales opcionales: SuitComfy/ComfyUI (8188/3012), FFmpeg, ViRe/Remotion (3004)."
metadata:
  author: Roberto Padron
  version: "1.2"
---

# LAPVTFU - Activos del Brief (7 slots: verificar · generar · escribir)

## Propósito

Gobierna el eslabón **`activos`** de la cadena de alta (máscara → empresa-registro → clusters → páginas → brief → **activos**) y el segmento **LAPVTFU** del vector Brief (posición 10, dentro de `Config_Empresas.logo_url`): manifiesto **posicional de 7 slots** de assets en Drive.

Dos trabajos:
1. **Verificar / asegurar / escribir** (comportamiento original, sin cambios).
2. **Generar** (NUEVO v1.2): cuando el negocio se crea "por input" (nuevo/demo, sin activos reales) y el eslabón `activos` viene en `auto` o `preguntar`, llena los slots vacíos con contenido generado — **idempotente**, **marcado**, y **sin tocar nunca** lo real ni lo existente.

## Cuándo se usa (disparadores)

- Cadena de alta: eslabón `activos` con switch `auto | preguntar | skip`.
- Comandos: "activos…", "genera activos <ID>", "asegura logo <ID>", "asegura avatar <ID>", "¿qué activos tiene <ID>?".

## Catálogo de slots (posiciones fijas - jamás filtrar ni compactar vacíos)

| # | Slot | Archivo estándar (raíz `cte<id>/`) | Modo MANUAL | Modo GENERACIÓN (v1.2) |
|---|---|---|---|---|
| 1 | Logo | `logo01.<ext>` | ya existía | `ensureLogoUrl` (operativo, sin cambios) |
| 2 | Avatar | `avatar01.<ext>` | gate `fotoprs01.*` | `ensureAvatarUrl` (Gemini; `no_foto` = skip) |
| 3 | Foto personal | `fotoprs01.<ext>` | subida manual (lectura del gate) | **NUNCA se genera** (persona real) |
| 4 | Videos | `videos01.mp4` (+`02…`) | subida manual + `shareCteFile` + `setLapvtfuSlot` | ✅ 1-3 clips 9:16 de 15-30 s (visual + texto en pantalla; voz = fase 2) |
| 5 | Testimonios | `testimonios01.*` (+`02…`) | idem | ⚠️ solo negocio DEMO, marcados `DEMO`; cliente real → `[PENDIENTE - Testimonios]` |
| 6 | Fotos | `fotos01.*` (+`02…`; multi `;`) | idem | ✅ hasta 6 imágenes del nicho (según Brief) |
| 7 | Contenido | `contenido01.<ext>` | idem | ❌ `[PENDIENTE - Contenido]` (sin flujo) |

## Estándar de nombres

`<base>NN.<ext>` **plano en la raíz de `cte<id>/`** (acuerdo 2026-09-29): `logo01`, `avatar01`, `fotoprs01`, `videos01`, `testimonios01`, `fotos01`, `contenido01`. `NN=01` y `02+` **solo V·T·F**; multi dentro del slot con `;`. Share **ANYONE** siempre. Legado (`logo.png`, `_activos/`, `_brief/`) = solo lectura (sin migrar).

## Stack (dónde vive)

| Qué | Dónde |
|---|---|
| Escritor único del segmento | `_setLapvtfuSlot_` + `setLapvtfuSlot_` (`backend/core.js`) |
| Endpoints Node (3001) | `/api/brief/ensure-logo`, `/api/brief/ensure-avatar`, `/api/brief/assets` (`scripts/brief-generate.js`) |
| UI | botones de assets en `backend/brief-sidebar.js` + `brief.html` |
| Motores | SuitComfy (3012; ComfyUI 8188) · ViRe/SuitVidGenRemotion (3004) · FFmpeg |
| Contratos | `CONTRATO.md` + `SUBCONTRATO-ACTIVOS.md` |
| Registro | `.suit/skills/domain/lapvtfu.yaml` + `.suit/registry/skills.yaml` |

## Flujo A - Verificar / asegurar / escribir (sin cambios)

1. Leer el vector y localizar el segmento LAPVTFU (posición 10) con `parseBrief`.
2. **Slots 1-2**: `POST /api/brief/ensure-logo` / `ensure-avatar` (o botones del sidebar). Estados: `existing` = fin · `no_foto` = skip · `needs_generate` = generar y `_finalize`.
3. **Slots 3-7 (subida manual)**: el usuario sube V/T/F a la raíz → `shareCteFile` → `setLapvtfuSlot` (multi unido con `;`). Si falta archivo → `[PENDIENTE - <Activo>]`, **jamás inventar**.
4. Escritura siempre vía escritor único; backup del vector antes de escribir; share ANYONE antes de publicar URL.

## Flujo B - Modo GENERACIÓN (NUEVO v1.2)

Solo con switch `activos` en `auto|preguntar`, o comando explícito. En `skip` no se genera nada.

1. **Gate**: `auto` = ejecuta directo · `preguntar` = preview de 2-3 líneas + `[s/n]` · `skip` = no toca.
2. **Idempotencia dura**: si el slot ya tiene archivo/URL → `existing` → se salta. **JAMÁS regenerar ni sobreescribir.**
3. **Solo llena vacíos**: Fotos · Videos · (Testimonios solo DEMO).
4. **Cascada de motores** (si uno falta o falla → siguiente; registrar fallbacks):
   - **Fotos**: **Google Flow MCP** (`generate-asset.cjs`, clone local, ver ADR-050/051 — preferente, ya probado en ContractRenew/PawBook) → ComfyUI local `127.0.0.1:8188` (SuitComfy; gratis) → Muapi/OpenCode skills (si están instaladas) → Gemini (misma vía que el avatar) → si todo falla `[PENDIENTE - Fotos]`.
   - **Videos**: **Google Flow MCP** (`flow_generate_video` o `generate-asset.cjs` con prompt de video, si el modelo lo soporta) → SuitComfy + FFmpeg (`127.0.0.1:3012` `/api/video`; escenas + Ken Burns/crossfade) → Remotion/ViRe (`SuitVidGenRemotion`, 3004) → Kling (solo con key activa y aprobación explícita) → `[PENDIENTE - Videos]`.
5. **Subida y publicación**: archivo a la raíz con nombre estándar → share ANYONE → `setLapvtfuSlot` → **verificar URL sin sesión** antes de publicar.
6. **Registro**: `cte<id>/_brief/prompts_imagenes.json` (prompt, motor, seed, fecha) + `origen: ai` por asset en `brief.json`.
7. **Tope por corrida**: 6 fotos + 2 videos + 2 testimonios (DEMO). Si piden más → confirmar.

## Reglas (duras)

Heredadas (lf-001..lf-010): 7 posiciones siempre · escritor único · idempotencia · `no_foto` = skip · share antes de publicar · raíz estándar `<base>NN` · timeouts GAS de 180 s · manual = `shareCteFile` + `setLapvtfuSlot`, sin inventar URLs.

Nuevas v1.2:
- **lf-011** Generación solo con `auto|preguntar` o comando explícito; en `skip` jamás.
- **lf-012** El flujo manual no cambia; la generación es aditiva — nunca sustituye recursos reales.
- **lf-013** Segundo pase = `existing`; cero regeneración (idempotencia total).
- **lf-014** Testimonios sintéticos SOLO en negocio DEMO y marcados `DEMO`; sin cifras ni certificaciones inventadas; cliente real → `[PENDIENTE]`.
- **lf-015** Preferencia local (ComfyUI/FFmpeg/Remotion, costo $0); nube solo como fallback; registrar motor usado por asset.
- **lf-016** Los generados se marcan en metadata (`origen: ai`); los nombres de archivo no cambian (estándar `<base>NN`).
- **lf-017** URL publicada = verificada sin sesión; si no verifica → `[PENDIENTE - enlace sin verificar]`.

## Definición de terminado

- E2E en empresa demo: `activos` auto → `fotos01..` y `videos01..` en la raíz de `cte<id>/`, share OK, slots 4/6 escritos, los otros **6 intactos byte a byte**.
- Segunda corrida → todo `existing`, cero regeneración.
- Cliente real → testimonios `[PENDIENTE]` (sin invento).
- `prompts_imagenes.json` con un registro por asset.
- `node --check` limpio en el JS tocado + actualizar `SUBCONTRATO-ACTIVOS.md` a v1.2 (ver nota).

## Límites

- **Puede modificar**: `backend/core.js` (`ensure*`, `_setLapvtfuSlot_`, `setLapvtfuSlot_`, `shareCteFile_`, `generateAsset`, `generateAllAssets`, helpers), `scripts/brief-generate.js` (endpoints `/api/brief/assets` y `ensure-*`), botones de assets de `backend/brief-sidebar.js`, esta skill y su YAML.
- **No debe tocar**: los 20 segmentos de contenido · otros campos de `Config_Empresas` · workflow de contenido · slot 3 (foto personal) · generadores de subproyectos (solo invocación).

## Nota de conflicto (para el IDE)

`SUBCONTRATO-ACTIVOS.md` v1.1 declara slots 4/5/6/7 "manual". Al implementar: actualizarlo a v1.2 con el modo generación + reglas lf-011..lf-017. `CONTRATO.md` no se toca (invariante de celda #7 sigue vigente).

## POR CONFIRMAR

- ~~Motores definitivos y su orden~~ → **decidido 2026-10-12**: Flow MCP (preferente) → ComfyUI → Gemini (fotos) / Flow → ComfyUI+FFmpeg → ViRe → Kling (videos)
- ¿Voz/TTS en videos? (default: no; fase 2)
- ¿Key de Kling activa? (default: no se usa sin aprobación)
- ¿Sufijo para generados? (default: no; solo metadata `origen: ai`)
