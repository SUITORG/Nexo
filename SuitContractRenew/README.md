# SuitContractRenew

Alertas de renovación de contratos de mantenimiento — **idea ganadora** corrida `ideas-saas` 2026-10-10b (juez 7.8/10).

- **Puerto:** 3017 (Express wrapper) · **Núcleo:** Python stdlib + SQLite WAL (`python/`) — cero dependencias de pago
- **Docs:** `docs/MANUAL_VENTAS.md` · `docs/MANUAL_CLIENTE.md` · `docs/MANUAL_PROVEEDOR.md` · `docs/MANUAL_TECNICO.md` · `docs/MANUAL_PRUEBAS.md`
- **Origen:** `SuitIdeasSaaS/2026-10-10b-evaluacion.md` (Mercado 8.5 · Técnico 8.0 · Riesgo 7.5 · Fin 7.0)

```bash
npm install && npm start                 # http://localhost:3017/api/health
python python/main.py due 60             # contratos por renovar
```

Ver `docs/MANUAL_TECNICO.md` (arquitectura) y `docs/MANUAL_PRUEBAS.md` (E2E).
