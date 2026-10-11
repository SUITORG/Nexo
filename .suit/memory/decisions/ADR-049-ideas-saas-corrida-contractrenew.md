# ADR-049: Primer ciclo completo ideas-saas → SuitContractRenew (corrida 2026-10-10b)

## Status
Accepted (2026-10-10)

## Context
Segunda corrida del pipeline `ideas-saas` (ADR-047) con la Etapa 4 de promoción ya operativa (ADR-048). Usuario pide: 3 ideas nuevas → panel → desarrollar la ganadora en automático con estándar Suit\* + manuales.

## Decision
1. 3 ideas evaluadas: **ContractRenew 7.8** (APROBADO), GrantClock 7.6 (APROBADO sin scaffold por is-002), PagaCuando 7.2 (CONDICIONAL). Informe: `SuitIdeasSaaS/2026-10-10b-evaluacion.md`.
2. **Scaffold intermedio en `SuitIdeasSaaS/<slug>/` omitido** (desvío consciente de la letra de is-003/Etapa 3): la Etapa 4 mueve ese scaffold a `python/` de todos modos; construirlo dos veces es trabajo duplicado. El núcleo se escribe una sola vez en `SuitContractRenew/python/`. Se documenta en el informe de corrida.
3. `SuitContractRenew/` (puerto **3017**): Express wrapper + núcleo Python **stdlib puro** (sin pip, sin requirements de terceros) + SQLite WAL + 5 manuales incl. `MANUAL_VENTAS.md` + projects.yaml + MAPA.

## Rationale
- Stdlib Python alcanza para el MVP (sqlite3, argparse-style CLI, datetime) — cero dependencias de pip, cero riesgo supply-chain.
- GrantClock archivada como "aprobado sin scaffold": re-corrida futura puede retomarla sin re-investigar.
- Soft-delete `activo=0` respeta regla inmutable #2 del repo desde el MVP.

## Consequences
- Puerto 3017 consumido.
- is-003 matizado: scaffold intermedio descartable cuando Etapa 4 está activa (actualizará el SKILL de ideas-saas si el patrón se repite).
- GrantClock queda como banco de ideas listo para la siguiente corrida.

## Alternatives Considered
- Scaffold intermedio + mover: 2x el trabajo, mismo resultado.
- Reescribir en Node: innecesario con stdlib Python funcionando y probada.

## Related
- ADR-047 (pipeline), ADR-048 (promoción a Suit\*)
- `SuitIdeasSaaS/2026-10-10b-evaluacion.md`
- `SuitContractRenew/docs/MANUAL_VENTAS.md`
