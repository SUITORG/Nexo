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
