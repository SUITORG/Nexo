# VALIDACION — ciclo: mejoras SuitServiHogar (migraciones, índice, runbooks) + triggers guia-total
Fecha: 2026-10-07 · Contrato: docs/Contrato.md (v6.0) · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | TSC + ESLint sin errores tras cambios (package.json, scripts) | standalone / n/a (ADR-029) | `npm run lint` (SuitServiHogar) | exit 0 · `tsc --noEmit && eslint src --max-warnings 0` sin salida de error | PASA |
| V2 | Regresión unitaria | standalone / n/a | `npm test` (vitest run) | 2 archivos · 14/14 tests passed · exit 0 | PASA |
| V3 | Humo UI: home, explorar, perfil, escrow responden 200 | standalone / n/a | `npm run test:e2e` (playwright, webServer vite:3000) | 4 passed (9.8s) · exit 0 | PASA |
| V4 | Índice de funciones al día: 13 pantallas + 5 modales | standalone / n/a | `node scripts/generate-index.js` + conteo de headings vs `src/components/{screens,modals}` | ✓ 71 archivos · screens 13/13 · modals 5/5 · sin cirílico `[\u0400-\u04FF]` | PASA |
| V5 | Paquete y artefactos: name correcto, genai fuera, consolidado SQL y runbooks existen | standalone / n/a | parse `package.json` + `npm ls @google/genai` + `Test-Path` ×6 + conteo `migrations/*.sql` | name=`suit-servihogar` · genai `(empty)` · 6/6 True · `migrations/` raíz = 0 sql | PASA |
| V6 | Server arranca y sirve endpoint público tras `npm uninstall` | standalone / n/a | `node server.js` + `GET http://localhost:3010/api/config/category/platform` | HTTP 200 (241 B) · proceso detenido limpio | PASA |

## Evidencia
- V1-V3: salidas en sesión 2026-10-07, todos `EXIT=0` (batería completa re-ejecutada tras el último cambio de la fase).
- V4: `✓ INDEX_FUNCIONES.md generado (71 archivos)`; headings `## src/components/screens/*` = 13, `## src/components/modals/*` = 5 (coincide con filesystem).
- V5: runbooks `despliegue.md`/`rollback.md` ✓ · ZIP `respaldo_migrations_20261007.zip` ✓ · 3 migraciones nuevas en `supabase/migrations/` ✓.
- V6: healthcheck público documentado en `docs/runbooks/despliegue.md` verifica runtime real post-instalación podada.
- Fuera de alcance (autorizado por usuario): `GuiaTotal/MAPA.md` + `.suit/registry/routing.yaml` → `yaml.safe_load` OK · `node scripts/check-map-visual.js` → `CHECK MAPA_VISUAL OK` (16 secciones).

## GAPs (no verificable ahora)
- **Migraciones no ejecutadas contra BD remota** (regla: nada remoto sin confirmación). Riesgo bajo: las 3 son idempotentes (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `DROP POLICY IF EXISTS`). Si quedaran pendientes se ejecutan en F5/F6 con visto bueno.
- **Aislamiento multi-tenant N/A**: `convive_sheets:false`, sin `id_empresa` (standalone ADR-029) — no aplica prueba A/B de tenants.
- **CI → GitHub Pages no reproducida localmente** (solo laptop; `ci.yml` intacto).
- **Manuales `docs/MANUAL_*.md` no refrescados**: esta fase no tocó UI/backend (regla de F3 solo aplica si se tocó).

## Veredicto global
PASA — 6/6 pruebas con evidencia ejecutada; sin correcciones pendientes.
