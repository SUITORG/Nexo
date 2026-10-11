# Corrida ideas-saas — 2026-10-10

Skill: `.agents/skills/ideas-saas/` · ADR-047 · pipeline manual (is-004) · gate ≥7.5 (is-001)

## Investigación (2 websearch)
- Micro-SaaS 2026: nichos sub-atendidos, gap score 8.3/10, disposición a pagar $30-150/mo
- Trades AI 2026: 59% usan AI embebida en software existente; solo 12% la tienen en su herramienta principal
- 93% de consumidores revisa reseñas antes de comprar local; <5% de PYMEs usa herramienta de reputación
- Incumbentes: Birdeye $349/mo, Podium $249-599/mo, Podium Starter $249/mo — hueco documentado <$50/mo
- 73% de contratistas reporta impacto de costos/tarifas 2026 (ServiceTitan)

## 3 ideas (80/20)
| # | Idea | Nicho | Monetización | Stack |
|---|---|---|---|---|
| 1 | ReviewPulse | PYMEs locales 1-5 sedes | $19-49/mo | requests, pandas, sqlite3, asyncio |
| 2 | LeadMinerLocal | Agencias/vendedores de gremios | $29-59/mo | requests, bs4, pandas, sqlite3 |
| 3 | MaterialPriceTracker | Contratistas MX | $15-29/mo | requests, bs4, pandas, asyncio |

## Panel Juzgador (Mercado 25% · Técnico 30% · Riesgo 25% · Financiero 20%)
| Idea | Mercado | Técnico | Riesgo | Financiero | TOTAL | Veredicto |
|---|---|---|---|---|---|---|
| ReviewPulse | 8.5 | 8.0 | 7.0 | 7.5 | **7.8** | APROBADO |
| LeadMinerLocal | 7.0 | 8.0 | 6.5 | 6.0 | **7.0** | APROBADO CONDICIONAL |
| MaterialPriceTracker | 6.5 | 7.5 | 5.5 | 6.5 | **6.6** | APROBADO CONDICIONAL |

### Racional del juez
- **Ganadora (ReviewPulse):** hueco de precio documentado, dolor real (93% revisa reseñas), Places API oficial elimina riesgo ToS que hunde a las otras dos.
- **LeadMiner:** técnicamente fácil pero scraping de directorios = riesgo ToS medio y monetización más débil (Apollo/free tools compiten).
- **PriceTracker:** dolor real de costos pero scraping de retail = mayor riesgo ToS/anti-bot + techo de mercado más bajo.

## Gate
- Idea 1 = 7.8 ≥ 7.5 → scaffold ejecutado (único, is-002).
- Ideas 2-3 ≥5.0 y <7.5 → condicionales, sin scaffold.
- Ningún agente <3 → sin veto.

## Scaffold
`SuitIdeasSaaS/review_pulse/` — main.py (async, import CSV + sync opcional Places), db.py (SQLite WAL), requirements.txt, README, .gitignore.
Validación: py_compile + init_db OK.
