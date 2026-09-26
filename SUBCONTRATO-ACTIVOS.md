# SUBCONTRATO-ACTIVOS — Capa LAPVTFU del vector Brief
SuitOrg › SUBCONTRATO-ACTIVOS · Padre: `CONTRATO.md` (raíz SuitOrg) · Hermano: `SUBCONTRATO-BRIEF.md` · Fecha: 2026-09-25 · v1.0

## Propósito
Goberna la **Capa Activos**: el segmento `LAPVTFU` (posición 10 del vector que vive dentro de `Config_Empresas.logo_url`) — manifiesto **posicional de 7 slots** de assets en Drive. Es el único responsable de verificar, asegurar y escribir esos 7 slots.

## Catálogo de slots (posiciones fijas — jamás filtrar ni compactar vacíos)
| # | Slot | Flujo | Estado |
|---|---|---|---|
| 1 | Logo | `ensureLogoUrl` → `raíz\cte<id>\logo.png` (nombre fijo, ADR-028); fallback lectura `_activos/logo/` | ✅ operativo |
| 2 | Avatar | `ensureAvatarUrl`: `fotopersonal.png` (raíz de `cte<id>/`) → Gemini 2.5 Flash Image → `avatar.png`; `no_foto` = skip; ya existe = reutilizar; jamás placeholder ni fallback al logo | ✅ operativo |
| 3 | Foto Personal | archivo `fotopersonal.png` en raíz de `cte<id>/`; opcional | ⚠️ parcial — sin ensure dedicado |
| 4 | Videos | — | ⏳ `[PENDIENTE - sin flujo]` |
| 5 | Testimonios | — | ⏳ `[PENDIENTE - sin flujo]` |
| 6 | Fotos | hasta 5 sub-fotos; separador interno **sin decidir** (deuda abierta, ADR-026) | ⏳ `[PENDIENTE - sin flujo]` |
| 7 | UGC | contenido de usuarios | ⏳ `[PENDIENTE - sin flujo]` |

## Stack y ejecución
- **Escritor único del segmento**: `_setLapvtfuSlot_` (`backend/core.js`) — lee-modifica-escribe solo la posición indicada, preserva los 20 segmentos de contenido
- Flujos: `ensureLogoUrl` / `ensureAvatarUrl` (GAS), despachados por `case` en `backend/core.js`, vía `POST /api/brief/ensure-logo|ensure-avatar` (`scripts/brief-generate.js`) o botones del sidebar (`backend/brief-sidebar.js`)
- Estados de respuesta: `existing` · `needs_generate` · `generated` · `no_foto`
- Drive: raíz dinámica `DRIVE_ROOT_ID` o My Drive (ADR-028); `_activos/` solo como fallback de lectura; historial en `_brief/historial/`
- Skill: `.suit/skills/domain/lapvtfu.yaml`
- Contratos de origen de las reglas: ADR-025, ADR-026, ADR-028

## Límites
- Puede modificar: `backend/core.js` (solo funciones `ensure*`, `_setLapvtfuSlot_`, `getBriefAssets`, `_getLogoUrlVector_`), botones de assets en `backend/brief-sidebar.js`, endpoints `ensure-*` en `scripts/brief-generate.js`, su skill
- No debe tocar: los 20 segmentos de contenido, otros campos de `Config_Empresas`, el workflow de contenido

## Invariantes (además de los heredados del padre)
1. **Frontera de escritura**: al escribir slots, los 20 segmentos de contenido se preservan byte a byte (invariante de celda, `CONTRATO.md` §Invariantes #7)
2. **7 posiciones siempre** — vacíos como `''`; compactar o filtrar desalinea el manifiesto (bug de ADR-026)
3. **Idempotencia**: asset ya generado → reutilizar sin regenerar; `no_foto` = skip total del slot 2
4. Avatar jamás usa placeholder ni fallback al logo dentro del manifiesto
5. Share `ANYONE` en Drive antes de publicar URL (patrón `_finalizeAvatar_`)
6. Timeouts de 180 s en los 5 calls GAS del flujo avatar (gotcha verificado en vivo)
7. Hereda del padre: `id_empresa` en toda query, soft delete, RBAC

## Definición de terminado
- Slots 1 y 2 E2E idempotentes: segunda corrida → `existing`, sin regeneración
- `node --check` limpio en archivos GAS/Node tocados
- Skill `lapvtfu` creada con el catálogo completo de 7 slots y registrada en `registry/skills.yaml`
- Slots 4-7 declarados `[PENDIENTE - sin flujo]` en la skill

## POR CONFIRMAR
- ¿El fallback Avatar→Logo de ADR-025 sigue vivo en algún consumidor fuera de GAS? (se eliminó del parser y del vector en la sesión del slot 2)
- Slot 3: ¿existe escritura dedicada o solo lectura de `fotopersonal.png`?
- Slot 6: separador de sub-fotos sigue sin decidir (deuda abierta)

## Cambios
- 2026-09-25: sub-contrato inicial creado (f0), verificado contra `core.js`, `brief-sidebar.js`, ADR-025/026/028 y la validación del slot 2
