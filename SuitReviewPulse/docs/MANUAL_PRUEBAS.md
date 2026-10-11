# MANUAL PRUEBAS — ReviewPulse

> **Para qué sirve:** smoke test E2E sin servicios de pago.
> **Audiencia:** desarrollador / QA.
> **Última actualización:** 2026-10-10

## Preparación
```bash
cd SuitReviewPulse && npm install
node --check index.js && node --check db/client.js && node --check handlers/reviews.js
python -m py_compile python/main.py python/db.py
```

## E2E (10 min)
1. Borrar BD: `del python\reviewpulse.db*` (Windows) / `rm python/reviewpulse.db*`
2. Levantar: `npm start` → debe imprimir `SuitReviewPulse en http://localhost:3016`
3. Health: `GET /api/health` → `{"status":"ok","module":"SuitReviewPulse"}`
4. Import: `POST /api/import` body `{"empresa":"Café Sol","reviews":[{"review_id":"R1","author":"Ana","rating":5,"comment":"Excelente","date":"2026-10-01"},{"review_id":"R2","author":"Luis","rating":2,"comment":"Demora","date":"2026-10-09"}]}` → `{"ok":true,"imported":2}`
5. Report: `GET /api/report/Café Sol` → `avg_rating: 3.5`, `nuevas: 2`
6. Report de nuevo → `nuevas: 0` (ya vistas)

## Criterios de paso
- [ ] health ok · [ ] import ok · [ ] report avg=3.5 nuevas=2 · [ ] segunda llamada nuevas=0
- [ ] Sin UnicodeEncodeError en consola Windows
- [ ] Sin .db en git (gitignored)

## CLI alternativo (sin API)
```bash
python python/main.py report-json "Café Sol"
```
