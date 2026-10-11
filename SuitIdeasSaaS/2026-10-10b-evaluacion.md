# Corrida ideas-saas 2026-10-10b — 3 ideas nuevas

Skill: `.agents/skills/ideas-saas/` · ADR-047/048 · gate ≥7.5 · 1 sola promoción (is-002)

## Investigación (2 websearch)
- MicroGaps 2026: HVAC maintenance agreement tracking — 118k talleres, ServiceTitan inviable 2-5 técnicos, hueco $29-49/mo documentado (paper/Excel)
- Nonprofit grant tracking: 1.5M ONGs <$500k presupuesto; solo GrantHub $95/mo; nada entre gratis y $95
- Freelancer cash flow: 59M freelancers; Pulse $29 = captura manual, sin predicción por historial de pago
- Vertical SaaS 2026: incumbentes 3.9-4.2 estrellas Capterra; márgenes 60-74%; median MRR $8-20k

## Panel Juzgador
| Idea | Mercado | Técnico | Riesgo | Financiero | TOTAL | Veredicto |
|---|---|---|---|---|---|---|
| ContractRenew | 8.5 | 8.0 | 7.5 | 7.0 | **7.8** | APROBADO |
| GrantClock | 7.5 | 8.5 | 7.5 | 6.5 | **7.6** | APROBADO (sin scaffold: is-002) |
| PagaCuando | 7.0 | 8.0 | 7.0 | 6.5 | **7.2** | APROBADO CONDICIONAL |

### Racional
- **ContractRenew:** dolor documentado (contratos = ingreso recurrente en papel), stack trivial SQLite, sin riesgo ToS. Debilidad: distribución offline a gremios.
- **GrantClock:** técnicamente perfecta pero ONGs con churn/precio más débil; segunda no scaffoldea.
- **PagaCuando:** predicción útil pero cold-start (necesita historial) y competencia fintech free tier.

## Gate
- ContractRenew 7.8 ≥ 7.5 → **promovido directamente** a módulo Suit\* `SuitContractRenew/` (puerto 3017, ADR-049). Scaffold intermedio en SuitIdeasSaaS/ omitido: la Etapa 4 lo mueve a `python/` igual — se construye una sola vez (ponytail, sin duplicar).
- GrantClock: archivada aquí como APROBADO sin scaffold (futura re-corrida puede retomarla).
- PagaCuando: condicional.
