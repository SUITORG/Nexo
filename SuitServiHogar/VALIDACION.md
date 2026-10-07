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

---

## Ciclo 2: modo de prueba local de un comando (qa.bat + flujo-dev + candado PROD)
Fecha: 2026-10-07 - Contrato: docs/Contrato.md (v6.0) - Ronda: 2 (F4 corrigio 1 fallo)

| ID | Verifica | Comando o accion | Resultado observado | Veredicto |
|----|----------|------------------|---------------------|-----------|
| V7 | TSC + ESLint tras cambios de modo prueba (devMode, badge, useStripePayment, bookingService, exchangeRate, App, BookingEscrow, server.js, tests) | `npm run lint` | exit 0 - `tsc --noEmit && eslint src --max-warnings 0` sin errores (1 fix en ronda: firma `waitForEvent`) | PASA |
| V8 | Regresion unitaria | `npm test` (vitest run) | 2 archivos - 14/14 tests passed - exit 0 | PASA |
| V9 | E2E completo: smoke 4 + flujo-dev 3 contextos (cliente paga mock -> tecnico libera con PIN -> admin panel) | `npm run test:e2e` (webServer vite:3000 + tsx server.js:3010) | 5 passed (18.2s) - exit 0 - orden creada `ORD-*` verificada en BD, estado `Liberado / Pagado` en Historial, heading `Admin Panel` visible | PASA |

## Evidencia ciclo 2
- Fallo ronda 1 detectado y corregido (ver CORRECCIONES.md): `[QA LOGIN] role is not defined` -> 500 en qa-login; fix `const role = req.body?.role`.
- Orden creada por el test con id `ORD-<timestamp base36>` extraida del modal (prueba de que el INSERT llego a BD y el wiring `created -> funded` funciono).
- Servidores del webServer terminados por Playwright (3000/3010 libres tras la corrida).

## GAPs ciclo 2 (no verificable ahora)
- **Estado vivo de RLS/perms de `sh_orders`**: el INSERT del cliente y los UPDATEs del tecnico pasaron en la corrida, pero no se audito el detalle de politicas de la BD live (regla: nada remoto sin confirmacion).
- **`sh_referrals`/`sh_coupons`**: el release ejecuta el bloque de referidos sin error (el test llego a `Liberado / Pagado`), no se verifico si algun cupon/referido fue creado por el camino.

## Veredicto global ciclo 2
PASA - 3/3 pruebas (V7-V9); 1 correccion aplicada en F4.
