# VALIDACION — ciclo: cierre de evidencia SuitContractRenew
Fecha: 2026-10-11 · Contrato: docs/CONTRATO.md · Ronda: 1

| ID | Verifica | Empresa / db_engine | Comando o acción | Resultado observado | Veredicto |
|----|----------|---------------------|------------------|---------------------|-----------|
| V1 | API viva | n/a (local 3017) | GET /api/health | (pendiente F3) | |
| V2 | Alta + consulta de contratos | sqlite-local | POST /api/contracts + GET /api/contracts/due/60 | (pendiente F3) | |
| V3 | Núcleo Python CLI | sqlite-local | python main.py due 60 | (pendiente F3) | |
| V4 | Landing estática | n/a | GET / + /assets/hero.png | (pendiente F3) | |
| V5 | Contrato sin duplicados | docs/CONTRATO.md | grep Resueltos | 4 resueltos exactos | PASA |
| V6 | Lead válido/inválido | SUPABASE leads_contractrenew | POST /api/leads (válido → 201, sin nombre → 400) | (pendiente F3) | |

## Evidencia
- V5: sección Resueltos con exactamente 4 entradas `- [x]` sin anidamientos (verificado tras fix `2fded75`).

## GAPs (no verificable ahora)
- Alertas por correo (decidido en contrato): sin implementar — fuera del MVP actual, riesgo bajo.
- Cobro Stripe: futuro, no verificable hoy.

## Veredicto global
PENDIENTE — se completa tras correr V1-V4/V6 en F3.
