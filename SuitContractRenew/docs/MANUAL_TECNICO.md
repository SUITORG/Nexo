# MANUAL TÉCNICO — ContractRenew

> **Para qué sirve:** mantener, desplegar y operar ContractRenew.
> **Audiencia:** desarrollador SuitOrg.
> **Última actualización:** 2026-10-10

## Arquitectura
- **API:** `index.js` Express, puerto **3017** (`module.exports = app`). Rutas: `GET /api/health`, `POST /api/contracts`, `GET /api/contracts/due/:dias?` (default 60).
- **Núcleo:** `python/main.py` (stdlib puro, sin pip) + `python/db.py` (SQLite WAL, tabla `contracts`). El wrapper spawn con `PYTHONIOENCODING=utf-8` (`db/client.js`).
- **Datos:** `python/contractrenew.db` (gitignored).

## Correr
```bash
cd SuitContractRenew && npm install && npm start    # :3017
python python/main.py add "Talleres López" 2026-12-01 800
python python/main.py due 60
python python/main.py due-json 60
python python/main.py close 3
```

## Gotchas
- **Encoding Windows:** `PYTHONIOENCODING=utf-8` ya seteado en `db/client.js` (cp1252 rompe acentos).
- **Fechas:** formato estricto `YYYY-MM-DD` (comparaciones SQL con `date()`).
- **`close` es soft-delete** (`activo=0`), nunca DELETE físico (regla repo #2).
- **SQLite WAL:** no borrar el `.db-wal` con el proceso corriendo.

## Multi-tenant (futuro)
MVP single-tenant. Integración al ecosistema → Supabase + `id_empresa` (regla inmutable #1).

## Puerto
| Puerto | Módulo |
|---|---|
| 3017 | SuitContractRenew |
