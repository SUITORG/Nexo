# SuitReviewPulse

Monitor de reseñas Google para negocios locales — **idea ganadora** de la corrida `ideas-saas` 2026-10-10 (juez 7.8/10).

- **Puerto:** 3016 (Express wrapper) · **Núcleo:** Python asyncio + SQLite WAL (`python/`)
- **Docs:** `docs/MANUAL_VENTAS.md` · `docs/MANUAL_CLIENTE.md` · `docs/MANUAL_PROVEEDOR.md` · `docs/MANUAL_TECNICO.md` · `docs/MANUAL_PRUEBAS.md`
- **Origen:** `SuitIdeasSaaS/2026-10-10-evaluacion.md` (panel: Mercado 8.5 · Técnico 8.0 · Riesgo 7.0 · Financiero 7.5)

```bash
npm install && npm start        # http://localhost:3016/api/health
```

Ver `docs/MANUAL_TECNICO.md` para arquitectura y `docs/MANUAL_PRUEBAS.md` para E2E.
