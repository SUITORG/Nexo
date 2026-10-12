# SuitPawBook

Reservas con depósito para groomers caninos — **idea ganadora** corrida `ideas-saas` 2026-10-11 (re-juez 8.0/10, modo verificadas).

- **Puerto:** 3018 · **Núcleo:** Python stdlib + SQLite WAL (`python/`)
- **Dolor núcleo:** no-show epidemic (r/doggrooming 2024-2026) — cada reserva lleva depósito configurable
- **Docs:** `docs/MANUAL_*.md` (5) + `docs/BRIEF_CLIENTE.md`
- **Origen:** `SuitIdeasSaaS/2026-10-11-evaluacion.md` + `pawbook/{Analista_Proy,SINTESIS_PROYECTO}.md` + `2026-10-11-reverificacion.md`

```bash
npm install && npm start            # http://localhost:3018/api/health
python python/main.py today         # reservas de hoy
```
