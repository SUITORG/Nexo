---
description: "Corrida completa ideas-saas en 1 paso. Default VERIFICADAS: 3 ideas 80/20 → panel-juzgador → analista-proy (investigación real) → sintesis-proyecto → RE-JUEZ con evidencia (si cae <7.5 se para y reporta) → scaffold + promoción a Suit* + go-to-market 4G (BRIEF + activos Flow + landing/leads) [ADR-048/051]. Flag --rapidas = modo antiguo sin investigación. Uso: /ideas [tema] [--rapidas]"
---

# /ideas — pipeline idea → Suit* vendible

Ejecuta la skill `ideas-saas` (`.agents/skills/ideas-saas/SKILL.md`) de principio a fin:

1. **Etapa 1** — genera 3 ideas 80/20 (2 búsquedas web; si el usuario dio tema/nicho, filtra por él).
2. **Etapa 2** — panel-juzgador por idea (Mercado 25% · Técnico 30% · Riesgo 25% · Financiero 20%) → persiste `SuitIdeasSaaS/<fecha>-evaluacion.md`.
3. **Etapa 2V** *(solo verificadas)* — por la ganadora: `analista-proy` (investigación web real) → `sintesis-proyecto` → RE-JUEZ con evidencia → `<fecha>-reverificacion.md`. Si re-score < 7.5: PARAR y reportar por qué cayó. Si >= 7.5: sigue sola.
4. **Etapa 3** — scaffold MVP Python en `SuitIdeasSaaS/<slug>/`.
5. **Etapa 4** — promueve a `Suit<NombrePascal>/`: núcleo en `python/`, envoltorio Express puerto libre + `db/client.js` (spawn `PYTHONIOENCODING=utf-8`), 5 manuales incl. `MANUAL_VENTAS.md`, registro `projects.yaml` + ADR + MAPA + smoke + commits (ciclo).
6. **Etapa 4G** *(solo verificadas)* — go-to-market automático [ADR-051]: BRIEF_CLIENTE (plantilla) · decisión datos (config-texto / Supabase leads / máscara) · landing+leads desde `GuiaTotal/plantillas/landing-leads/` · activos LAPVTFU con Google Flow MCP · cierre ADR+MAPA.
7. **Etapa 4P** *(solo verificadas)* — producto terminado [ADR-054]: CRUD `/app` con login PIN + signup + recuperación por email · alertas diarias (SMTP o consola) + respaldo BD · favicon · `abrir.bat` + `cliente.bat` · smoke completo · `fase_producto: 7` en tarjeta.

`--rapidas` = omite 2V y 4G (modo original, sin investigación).

**Panel de monitoreo:** durante toda la corrida mantén vivo `SuitIdeasSaaS/estado.json` (fase, ideas, herramientas, log) — el usuario ve el avance en `http://localhost:3001/SuitIdeasSaaS/panel.html`. Formato y fases en la skill.

Respeta is-001..is-005 (gate 7.5, 1 sola promoción, Python local, manual, promoción automática). **Reejecución desde cero:** borrar salidas de corridas anteriores y volver a correr `/ideas`.
