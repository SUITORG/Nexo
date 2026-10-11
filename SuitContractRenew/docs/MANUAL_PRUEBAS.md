# MANUAL PRUEBAS — ContractRenew

> **Para qué sirve:** smoke test E2E sin servicios externos.
> **Audiencia:** desarrollador / QA.
> **Última actualización:** 2026-10-10

## Preparación
```bash
cd SuitContractRenew && npm install
node --check index.js && node --check db/client.js && node --check handlers/contracts.js
python -m py_compile python/main.py python/db.py
```

## E2E (10 min)
1. Borrar BD: `del python\contractrenew.db*`
2. `npm start` → imprime `SuitContractRenew en http://localhost:3017`
3. `GET /api/health` → `{"status":"ok","module":"SuitContractRenew"}`
4. `POST /api/contracts` body `{"cliente":"Talleres López","renovacion":"2026-12-01","precio_mensual":800}` → `ok:true`
5. `POST /api/contracts` body `{"cliente":"Clima Norte","renovacion":"2026-10-05","precio_mensual":600}` (vencido)
6. `GET /api/contracts/due/60` → `total:2`; `Clima Norte` con `vencido:true`
7. Repetir → sigue total:2 (no hay estado "visto" que consumir)

## Criterios de paso
- [ ] health ok · [ ] add ok · [ ] due incluye ambos · [ ] vencido:true solo en Clima Norte
- [ ] Sin UnicodeEncodeError · [ ] sin .db en git
