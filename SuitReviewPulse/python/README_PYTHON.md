# ReviewPulse — MVP 80/20

Monitor de reseñas Google para negocios locales. ADR-047 · skill `ideas-saas`.

## Qué hace (el 20% que resuelve el 80%)
1. Importa reseñas (CSV manual o Places API opcional) → SQLite
2. Detecta reseñas nuevas y calcula promedio de rating
3. Redacta borrador de respuesta estándar

## Uso
```bash
pip install -r requirements.txt
python main.py import reseñas_demo.csv "Mi Negocio"
python main.py report "Mi Negocio"
# opcional:
export PLACES_API_KEY=...
python main.py sync <place_id> "Mi Negocio"
```

## CSV formato
`review_id,business,author,rating,comment,date`

## Decisión (gate ≥7.5, juez 7.8)
Places API oficial (free tier $200/mo) evita el riesgo ToS del scraping.
Solo 1 scaffold por corrida. Evaluación completa: `SuitIdeasSaaS/<fecha>-evaluacion.md`.
