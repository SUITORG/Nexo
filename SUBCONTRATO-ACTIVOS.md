# SUBCONTRATO-ACTIVOS — Capa LAPVTFU del vector Brief
SuitOrg › SUBCONTRATO-ACTIVOS · Padre: `CONTRATO.md` (raíz SuitOrg) · Hermano: `SUBCONTRATO-BRIEF.md` · Fecha: 2026-09-25 · v1.1 (2026-09-29 — estándar de nombres `*01` en raíz `cte<id>/`)

## Propósito
Goberna la **Capa Activos**: el segmento `LAPVTFU` (posición 10 del vector que vive dentro de `Config_Empresas.logo_url`) — manifiesto **posicional de 7 slots** de assets en Drive. Es el único responsable de verificar, asegurar y escribir esos 7 slots.

## Catálogo de slots (posiciones fijas — jamás filtrar ni compactar vacíos)
**Estándar 2026-09-29:** archivos **planos en la raíz de `cte<id>/`** con nombre `<base>NN.<ext>`
(extensión natural; `NN=01` y **solo V·T·F admiten `02,03,…`**), siempre **share ANYONE**.
Legado sin migrar (`logo.png`, `avatar.png`, `fotopersonal.*`, `_activos/`) queda como **fallback de lectura**.

| # | Slot | Archivo estándar (raíz `cte<id>/`) | Flujo | Estado |
|---|---|---|---|---|
| 1 | Logo | `logo01.<ext>` (legado `logo.png`) | `ensureLogoUrl` + `favicon.png` se crea si falta | ✅ operativo |
| 2 | Avatar | `avatar01.<ext>` (legado `avatar.png`) | `ensureAvatarUrl`: gate `fotoprs01.*` → Gemini 2.5 Flash Image; `no_foto` = skip; jamás placeholder ni fallback al logo | ✅ operativo |
| 3 | Foto Personal | `fotoprs01.<ext>` (legado `fotopersonal.*`) | subida manual del usuario; lectura desde el gate del avatar | ⚠️ parcial — sin ensure dedicado |
| 4 | Videos | `videos01.mp4`, `videos02…` (multi) | subida manual → `shareCteFile` → `setLapvtfuSlot` | 🔁 manual + acciones |
| 5 | Testimonios | `testimonios01.*`, `testimonios02…` (multi) | idem | 🔁 manual + acciones |
| 6 | Fotos | `fotos01.*`, `fotos02…` (multi; separador interno `;`) | idem | 🔁 manual + acciones |
| 7 | Contenido (antes UGC) | `contenido01.<ext>` (un archivo) | subida manual → `shareCteFile` → `setLapvtfuSlot` | 🔁 manual + acciones |

## Stack y ejecución
- **Escritor único del segmento**: `_setLapvtfuSlot_` (`backend/core.js`) — lee-modifica-escribe solo la posición indicada, preserva los 20 segmentos de contenido
- Flujos: `ensureLogoUrl` / `ensureAvatarUrl` (GAS), despachados por `case` en `backend/core.js`, vía `POST /api/brief/ensure-logo|ensure-avatar` (`scripts/brief-generate.js`) o botones del sidebar (`backend/brief-sidebar.js`)
- **Acciones (2026-09-29)**: `shareCteFile {id_empresa, fileName}` → share ANYONE de un archivo de la raíz (V/T/F subidos a mano por el usuario) · `setLapvtfuSlot {id_empresa, slot(1-7), url}` → wrapper del escritor único para slots 3-7 · `migrarActivosCte {id_empresa|all, dryRun}` → legacy→estándar (rename conserva IDs; dryRun por defecto; ejecutado @28: 3 renombres + 23 `_activos` trash, 0 errores)
- Estados de respuesta: `existing` · `needs_generate` · `generated` · `no_foto`
- Drive: **raíz de `cte<id>/` con nombres estándar** (extensión natural) · `_activos/` y `_brief/` solo fallback de lectura (ya no se crean; sin migrar) · historial legacy en `_brief/historial/`
- Skill: `.suit/skills/domain/lapvtfu.yaml`
- Contratos de origen de las reglas: ADR-025, ADR-026, ADR-028 + estándar de nombres aprobado 2026-09-29

## Límites
- Puede modificar: `backend/core.js` (funciones `ensure*`, `_setLapvtfuSlot_`, `setLapvtfuSlot_`, `shareCteFile_`, `getBriefAssets`, `_getLogoUrlVector_`, helpers `_findAssetFile_`/`_nextAssetName_`), botones de assets en `backend/brief-sidebar.js`, endpoints `ensure-*` en `scripts/brief-generate.js`, su skill
- No debe tocar: los 20 segmentos de contenido, otros campos de `Config_Empresas`, el workflow de contenido

## Invariantes (además de los heredados del padre)
1. **Frontera de escritura**: al escribir slots, los 20 segmentos de contenido se preservan byte a byte (invariante de celda, `CONTRATO.md` §Invariantes #7)
2. **7 posiciones siempre** — vacíos como `''`; compactar o filtrar desalinea el manifiesto (bug de ADR-026)
3. **Idempotencia**: asset ya generado → reutilizar sin regeneración; `no_foto` = skip total del slot 2
4. Avatar jamás usa placeholder ni fallback al logo dentro del manifiesto
5. Share `ANYONE` en Drive **antes** de publicar URL (patrón `_finalize*` y `shareCteFile_`)
6. Timeouts de 180 s en los 5 calls GAS del flujo avatar (gotcha verificado en vivo)
7. Hereda del padre: `id_empresa` en toda query, soft delete, RBAC
8. **Estándar de nombres (2026-09-29)**: `<base>NN.<ext>` plano en raíz `cte<id>/` (`logo01, avatar01, fotoprs01, videos01, testimonios01, fotos01, contenido01`) · `NN=01` y `02+` **solo V·T·F** · separador interno de multi = `;` · legado legible, **sin migrar**

## Definición de terminado
- Slots 1 y 2 E2E idempotentes: segunda corrida → `existing`, sin regeneración
- `node --check` limpio en archivos GAS/Node tocados
- Skill `lapvtfu` creada con el catálogo completo de 7 slots y registrada en `registry/skills.yaml`
- Slots 4-7 declarados `[PENDIENTE - sin flujo]` en la skill

## POR CONFIRMAR
- ¿El fallback Avatar→Logo de ADR-025 sigue vivo en algún consumidor fuera de GAS? (se eliminó del parser y del vector en la sesión del slot 2)
- Slot 3: ¿existe escritura dedicada o solo lectura de `fotopersonal.*`? (estándar `fotoprs01` — parcial)
- ~~Slot 6: separador de sub-fotos~~ → **decidido `;` (aprobado 2026-09-29)** para V·T·F multi

## Cambios
- 2026-09-25: sub-contrato inicial creado (f0), verificado contra `core.js`, `brief-sidebar.js`, ADR-025/026/028 y la validación del slot 2
- 2026-09-29: **estándar de nombres `*01` en raíz `cte<id>/`** (extensión natural, V·T·F multi con `;`, sin migrar legado) · `ensureCteFolders` deja de crear `_brief/_activos` · acciones nuevas `shareCteFile` + `setLapvtfuSlot` · subida V·T·F manual del usuario + reparto por el agente · v1.1
