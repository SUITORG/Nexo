---
description: "Corrida completa ideas-saas en 1 paso: 3 ideas 80/20 → panel-juzgador → si juez >=7.5 scaffold + promoción automática a módulo Suit* estándar (5 manuales incl. MANUAL_VENTAS.md) [ADR-048]. Uso: /ideas [tema o nicho opcional]"
---

# /ideas — pipeline idea → Suit* completo

Ejecuta la skill `ideas-saas` (`.agents/skills/ideas-saas/SKILL.md`) de principio a fin:

1. **Etapa 1** — genera 3 ideas 80/20 (2 búsquedas web; si el usuario dio tema/nicho, filtra por él).
2. **Etapa 2** — panel-juzgador por idea (Mercado 25% · Técnico 30% · Riesgo 25% · Financiero 20%) → persiste `SuitIdeasSaaS/<fecha>-evaluacion.md`.
3. **Etapa 3** — si alguna >= 7.5: scaffold MVP Python en `SuitIdeasSaaS/<slug>/`. Si ninguna: termina tras el informe.
4. **Etapa 4** (automática si hay ganadora) — promueve a `Suit<NombrePascal>/`: mueve núcleo a `python/`, envoltorio Express puerto libre + `handlers/` + `db/client.js` (spawn con `PYTHONIOENCODING=utf-8`), 5 manuales en `docs/` incl. **`MANUAL_VENTAS.md`**, registro `projects.yaml` + ADR + `AGENTS.md` puerto + `INDEX.md` + MAPA (`gen-mapa-info.js` → `check-map-visual.js` OK), `node --check` + `py_compile` + smoke, commits por fase (ciclo).

Respeta is-001..is-005 (gate 7.5, 1 sola promoción, Python local, manual, promoción automática). **Reejecución desde cero:** borrar salidas de corridas anteriores y volver a correr `/ideas`.
