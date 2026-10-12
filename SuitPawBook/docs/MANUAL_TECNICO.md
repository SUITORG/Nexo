# MANUAL TÉCNICO — SuitPawBook

**Para qué sirve este manual:** arquitectura y operación del sistema.
**Audiencia:** quien mantenga el código.

## Arquitectura
- `index.js` Express (puerto 3018) → `handlers/pawbook.js` → `db/client.js` (spawn Python con `PYTHONIOENCODING=utf-8`)
- `python/main.py` CLI + `python/db.py` SQLite WAL: tablas `pets`, `bookings`, `policy` (id=1 row singleton)
- Esquema idempotente: `init_db()` con `CREATE TABLE IF NOT EXISTS` — sin migraciones en MVP

## Endpoints
| Método | Ruta | Qué hace |
|---|---|---|
| GET | /api/health | ok + módulo |
| GET | /api/today | reservas de hoy (JSON) |
| POST | /api/pets | alta mascota |
| POST | /api/bookings | alta reserva con depósito_pct |
| POST | /api/bookings/:id/cancel | soft cancel |

## Gotchas
- Spawn Python: siempre `PYTHONIOENCODING=utf-8` (cp1252 en Windows rompe acentos)
- `policy` es una sola fila (id=1) — no migrar a multi-tenant sin diseñar antes
- Depósito: el sistema REGISTRA el pct, no cobra (Stripe fase 2)

## Run
`npm install && npm start` · smoke: `GET /api/health`, `POST /api/pets`, `POST /api/bookings`, `GET /api/today`
