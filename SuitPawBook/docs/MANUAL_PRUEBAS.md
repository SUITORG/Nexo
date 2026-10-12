# MANUAL PRUEBAS — SuitPawBook

**Para qué sirve este manual:** smoke test E2E del módulo.
**Audiencia:** quien valide antes de cada release.

```bash
cd SuitPawBook && npm install && npm start   # terminal 1
```

1. `GET http://localhost:3018/api/health` → `{"status":"ok","module":"SuitPawBook"}`
2. `POST /api/pets` body `{"nombre":"Luna","raza":"Poodle","dueno_tel":"8112345678","vacunas_notas":"antirrábica 2026"}` → ok
3. `POST /api/bookings` body `{"pet_id":1,"fecha":"2026-10-20","hora":"10:00","servicio":"baño","precio":450,"deposito_pct":30}` → ok (depósito 30%)
4. `GET /api/today` → hoy no hay citas (la reserva es 2026-10-20); OK vacío o lista
5. `POST /api/bookings/1/cancel` → ok; `python python/main.py bookings` → muestra CANCELADA
6. CLI: `python python/main.py pets` y `python python/main.py policy 48 100` → política actualizada

**Pasa si:** 1-6 sin 500, depósito visible en listados, cancelación = soft (`cancelada=1`, nunca DELETE).
