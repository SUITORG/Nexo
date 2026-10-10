# ADR-047: Skill ideas-saas — pipeline idea → panel → MVP Python local

## Status
Accepted (2026-10-09)

## Context
Se necesitaba un pipeline que: (1) genere ideas SaaS de alta viabilidad 80/20, (2) las evalúe con Panel de Expertos, (3) si el juez aprueba (>= 7.5) dispare el scaffold de un MVP en Python local (AMD Ryzen 7000 / 64 GB RAM, libs gratuitas, sin cloud de pago). La referencia era un "prompt maestro" de ciclo semanal autónomo, pero el usuario pidió explícitamente que sea **por-corrida manual**, no automático/cron.

## Decision
Crear la skill **`ideas-saas`** en `.agents/skills/ideas-saas/` (fuente única + junctions `.claude`/`.opencode`), gobernada por `.suit/skills/process/ideas-saas.yaml` y registrada en `.suit/registry/skills.yaml`.

- **Reusa** `panel-juzgador` (prompts mercado/técnico/riesgo/financiero/juez existentes en `.suit/skills/process/panel-juzgador/prompts/`) — no duplicar la evaluación.
- **Gate duro:** scaffold SOLO si juez score >= 7.5 (regla `is-001`, severidad error). Si no, solo informe.
- **Salida:** `SuitIdeasSaaS/<fecha>-evaluacion.md` (+ `SuitIdeasSaaS/<slug>/` si aprueba). Convención de carpetas `Suit*` como SuitPoke/SuitPos.
- **Stack MVP:** stdlib + `requests`/`beautifulsoup4`/`pandas`/`sqlite3`, concurrencia `asyncio`, secrets en `.env`. Sin cloud de pago.
- **Modo:** por-corrida manual (regla `is-004`: nunca cron ni background sin que el usuario lo pida).

## Rationale
- Evita duplicar el Panel de Juzgador (ya probado en guia-total §1).
- Separación de concerns: la skill decide/qué genera; el Panel evalúa; el scaffold solo corre si hay aprobación explícita.
- `SuitIdeasSaaS/` como carpeta alineada al patrón `Suit*` existente (SuitPoke, SuitPos, …).

## Consequences
- El usuario dispara la corrida a demanda ("ideas saas", "genera ideas").
- Si en el futuro se quiere cadencia semanal, se puede envolver en un cron/GitHub Action que llame la skill — pero eso es fuera de alcance de este ADR.
- Las ideas generadas quedan versionadas en `SuitIdeasSaaS/`.

## Alternatives Considered
- Script Python standalone con cron: más fricción, no reusa el Panel ni el ecosistema SuitOS.
- Pipeline dentro de `guia-total`: guia-total ya es un orquestador amplio; preferimos skill dedicada invocable por separado.

## Related
- `.suit/skills/process/ideas-saas.yaml`
- `.suit/skills/process/panel-juzgador/prompts/`
- `GuiaTotal/MAPA.md` §1 (ramal `ideas-saas`)
