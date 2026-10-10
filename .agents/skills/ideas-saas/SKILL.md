---
name: ideas-saas
description: "Pipeline por-corrida de ideas SaaS: genera 3 ideas digitales de alta viabilidad 80/20, las evalúa con el Panel de Expertos (Mercado/Técnico/Riesgo/Financiero + Juez) y, si el juez aprueba con score >= 7.5, hace el scaffold de un MVP en Python local en SuitIdeasSaaS/<slug> (stdlib + requests/bs4/pandas/sqlite3, concurrencia asyncio, sin cloud de pago). No es automático: se invoca por corrida del usuario. Úsala cuando digas 'ideas saas', 'genera ideas', 'corrida de ideas', 'pipeline saas', '3 ideas', 'evaluar ideas', 'necesito un MVP', 'ideas de negocio', o 'pipeline autónomo de ideas'."
---

# ideas-saas — pipeline idea → panel → MVP Python

**Modo:** por-corrida (el usuario dispara; nada de cron).

**Propósito:** un solo comando genera 3 ideas, las juzga con el Panel de Expertos y deja el MVP del ganador scaffolded en `SuitIdeasSaaS/<slug>/`.

**Hardware asumido:** AMD Ryzen 7000 / Radeon / 64 GB RAM, Python local, SQLite, concurrencia asyncio sin saturar iGPU.

## Flujo (3 etapas)

### Etapa 1 — Ideación (3 ideas, filtro 80/20)

Para cada idea: 20% esfuerzo → 80% impacto. Fuentes gratuitas/éticas (búsqueda web, tendencias, scraping público). Cada idea, en una tarjeta:

```markdown
### Idea <n>: <Nombre>
- **Nicho:** <nicho rentable y específico>
- **Problema:** <dolor real del usuario>
- **Solución (MVP):** <qué hace, 1 párrafo>
- **Monetización:** <cómo se cobra>
- **Stack Python:** <libs stdlib/gratuitas>
- **80/20:** <por qué el 20% de esfuerzo da el 80%>
```

### Etapa 2 — Evaluación (Panel Juzgador por idea)

Para cada idea → correr el flujo de `panel-juzgador` (4 expertos + juez). Persistir en `SuitIdeasSaaS/<fecha>-evaluacion.md`.

**Criterio del juez (ya codificado en el prompt):**
- score **>= 7.5** → **APROBADO**
- 5.0–7.4 → APROBADO CONDICIONAL
- 3.0–4.9 → POSPUESTO
- < 3.0 → RECHAZADO
- veto: cualquier agente < 3, o 3+ agentes RECHAZADO

### Etapa 3 — Disparo condicional → scaffold MVP Python

Si **alguna** idea es APROBADO (>= 7.5): hacer el scaffold de la de mayor score. Si varias, solo la mejor.

**Scaffold en `SuitIdeasSaaS/<slug>/` (slug = nombre en snake_case):**

```
SuitIdeasSaaS/<slug>/
├── main.py              # entrypoint, asyncio, 80/20 mínimo viable
├── requirements.txt     # solo requests / beautifulsoup4 / pandas (nada de pago)
├── db.py                # sqlite3, esquema mínimo, WAL
├── README.md            # qué hace, cómo correr, dependencias
└── .gitignore           # venv/, __pycache__/, *.db
```

**Reglas de diseño (defensivo y limpio):**
- Estándar + librerías gratuitas (`requests`, `beautifulsoup4`, `sqlite3`, `pandas`). Sin cloud de pago.
- Concurrencia `asyncio` (Ryzen 7000, 64 GB) — no saturar la iGPU.
- Tipado + manejo de errores explícito; secrets en `.env`, nunca hardcodeados.
- Principio Pareto: el 20% de código que resuelve el 80% del problema.

**Si ninguna idea aprueba (>= 7.5):** NO se hace scaffold. Solo el informe `SuitIdeasSaaS/<fecha>-evaluacion.md` con veredicto y razones.

## Entradas / Salidas

- **Entrada:** opcionalmente un tema o nicho del usuario; si no, filtro libre 80/20.
- **Salidas:** `SuitIdeasSaaS/<fecha>-evaluacion.md` (+ `SuitIdeasSaaS/<slug>/` si hay aprobado).

## Nota

El pipeline **no se ejecuta solo cada semana** — se invoca por corrida. La cadencia la decide el usuario.
