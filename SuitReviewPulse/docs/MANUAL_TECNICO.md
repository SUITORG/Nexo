# MANUAL TÉCNICO — ReviewPulse

> **Para qué sirve:** mantener, desplegar y operar ReviewPulse.
> **Audiencia:** desarrollador SuitOrg.
> **Última actualización:** 2026-10-10

## Arquitectura
- **API:** `index.js` Express, puerto **3016** (`module.exports = app`, patrón Suit\*). Rutas: `GET /api/health`, `POST /api/import`, `GET /api/report/:empresa`.
- **Núcleo:** `python/main.py` (asyncio) + `python/db.py` (SQLite WAL, tablas `businesses`/`reviews`). El wrapper hace spawn con `PYTHONIOENCODING=utf-8` (`db/client.js`).
- **Datos:** `python/reviewpulse.db` (gitignored). Sync opcional vía Google Places API (`PLACES_API_KEY` en `.env`).

## Correr
```bash
cd SuitReviewPulse
npm install
npm start                  # API en :3016
python python/main.py import archivo.csv "Empresa"
python python/main.py report-json "Empresa"
```

## Gotchas (conocidos)
- **Encoding Windows:** el stdout de Python debe ir en UTF-8 (`PYTHONIOENCODING=utf-8` ya seteado en `db/client.js`); sin él, `reseñas` rompe con cp1252.
- **`report` marca reseñas como vistas (`seen=1`)** — es intencional: cada reporte solo muestra lo nuevo una vez.
- **Places API:** free tier $200/mo; FieldMask solo `id,displayName,rating,userRatingCount`.
- **SQLite WAL:** no borrar `reviewpulse.db-wal` con el proceso corriendo.

## Multi-tenant (futuro)
MVP es single-tenant (SQLite por archivo). Si se integra al ecosistema multi-tenant: migrar a Supabase con `id_empresa` (regla inmutable #1 del repo).

## Puerto
| Puerto | Módulo |
|---|---|
| 3016 | SuitReviewPulse |
