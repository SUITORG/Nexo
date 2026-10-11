---
name: ideas-saas
description: "Pipeline por-corrida de ideas SaaS: genera 3 ideas digitales de alta viabilidad 80/20, las evalúa con el Panel de Expertos (Mercado/Técnico/Riesgo/Financiero + Juez) y, si el juez aprueba con score >= 7.5, hace el scaffold de un MVP en Python local en SuitIdeasSaaS/<slug> y lo promueve AUTOMÁTICAMENTE a módulo Suit* estándar (Suit<NombrePascal>/: Express + python/ + 5 manuales incl. MANUAL_VENTAS.md + projects.yaml + ADR) [ADR-048]. No es automático: se invoca por corrida del usuario, o con el comando /ideas. Úsala cuando digas 'ideas saas', 'genera ideas', 'corrida de ideas', 'pipeline saas', '3 ideas', 'evaluar ideas', 'necesito un MVP', 'ideas de negocio', 'pipeline autónomo de ideas', 'corrida desde cero', o 'desarrolla la ganadora'."
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

### Etapa 4 — Promoción automática → módulo Suit* [ADR-048]

Si hay ganadora (>= 7.5), **sin esperar confirmación** (decisión ya tomada en el gate):

1. **Mover** `SuitIdeasSaaS/<slug>/` → `Suit<NombrePascal>/python/` (sin duplicar; `SuitIdeasSaaS/` conserva solo informes + ideas no aprobadas).
2. **Envoltorio estándar Suit\*** en `Suit<NombrePascal>/`:
   - `index.js` (Express, `module.exports = app`, puerto único libre; `GET /api/health` + endpoints del MVP), `package.json`, `.env.example`, `.env` no commiteado.
   - `db/client.js` spawn al núcleo Python con `PYTHONIOENCODING=utf-8` (gotcha cp1252).
   - `handlers/` (+ `services/` si aplica).
   - `README.md` raíz.
3. **5 manuales** en `docs/`: `MANUAL_CLIENTE`, `MANUAL_PROVEEDOR`, `MANUAL_TECNICO`, `MANUAL_PRUEBAS` y **`MANUAL_VENTAS.md`** (obligatorio — ver estructura en `guia-total manuales`). Cada uno con `Para qué sirve este manual` + `Audiencia`.
4. **Registro ecosistema**: entrada en `.suit/registry/projects.yaml` (puerto, frontend gates, api_endpoints) · ADR + `node scripts/generate-adr-index.js` · fila `AGENTS.md` tabla de puertos · `INDEX.md` projects · nodo en `GuiaTotal/MAPA.md` si enlaza flujo + `node scripts/gen-mapa-info.js` → `node scripts/check-map-visual.js` (debe dar OK).
5. **Validar**: `node --check` en los .js nuevos, `python -m py_compile` en el núcleo, smoke del API (health + import + report).
6. **Commit por fase** como manda `ciclo` (formato `{tipo}(scope): desc`).

**Si desde cero:** borrar `SuitIdeasSaaS/<fecha>-evaluacion.md*` + `Suit<Nombre>/` de corridas anteriores (o usar nombre de fecha nuevo) y reejecutar la corrida — Etapas 1-4 repiten todo en automático.

## Entradas / Salidas

- **Entrada:** opcionalmente un tema o nicho del usuario; si no, filtro libre 80/20.
- **Salidas:** `SuitIdeasSaaS/<fecha>-evaluacion.md` (+ `SuitIdeasSaaS/<slug>/` si hay aprobado → promovido en Etapa 4 a `Suit<NombrePascal>/` con 5 manuales, projects.yaml y ADR).

## Comando

`/ideas` (`.opencode/commands/ideas.md` + `.claude/commands/ideas.md`) = 1 paso para Etapas 1-4 completas.

## Nota

El pipeline **no se ejecuta solo cada semana** — se invoca por corrida. La cadencia la decide el usuario.
