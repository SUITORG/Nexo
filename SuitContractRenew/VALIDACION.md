# VALIDACION — ciclo: cierre de evidencia SuitContractRenew
Fecha: 2026-10-11 · Contrato: docs/CONTRATO.md · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | API viva | n/a (local 3017) | GET /api/health | `{"status":"ok","module":"SuitContractRenew"}` | PASA |
| V2 | Alta + consulta de contratos | sqlite-local | POST /api/contracts + GET /api/contracts/due/60 | alta `#3 Smoke Test` OK · due `total=3` | PASA |
| V3 | Núcleo Python CLI | sqlite-local | `due_contracts(60)` vía import directo | `total=3` | PASA |
| V4 | Landing estática | n/a | GET / + HEAD /assets/hero.png | 200 con "ContractRenew" · hero 200 | PASA |
| V5 | Contrato sin duplicados | docs/CONTRATO.md | sección Resueltos | 4 entradas `- [x]` exactas, sin anidamientos | PASA |
| V6 | Lead válido/inválido | SUPABASE leads_contractrenew | POST /api/leads | válido → 201 · sin nombre → 400 · fila smoke borrada (204) | PASA |

## Evidencia
- V1-V2, V4, V6: servidor `node index.js` en 3017 levantado en proceso de prueba, matado al terminar (sin procesos huérfanos).
- V6: `.env` del módulo creado (claves copiadas de la raíz, gitignore verificado con `git check-ignore` → ignorado). Fila de prueba eliminada vía REST (204).
- V5: fix `2fded75` — el panel ya no re-cuenta resueltos.

## GAPs (no verificable ahora)
- Alertas por correo (decidido en contrato): sin implementar — fuera del MVP actual, riesgo bajo.
- Cobro Stripe: futuro, no verificable hoy.

## Veredicto global
PASA — 6/6; sin procesos residuales; sin deltas de esquema.
