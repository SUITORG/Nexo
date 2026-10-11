---
name: ideas-saas
description: "Pipeline por-corrida de ideas SaaS en 2 modos: IDEAS RÁPIDAS (3 ideas 80/20 → panel juzgador → gate >=7.5 → scaffold + promoción automática a módulo Suit* [ADR-048]) o IDEAS VERIFICADAS (ciclo completo: además analista-proy con investigación web real → sintesis-proyecto → RE-JUEZ con evidencia → si cae <7.5 se para y se reporta; si mantiene >=7.5 continúa a go-to-market automático: BRIEF_CLIENTE + activos con Google Flow MCP + landing/leads desde plantilla RUCP o config-texto según decisión 4G [ADR-051]). Úsala cuando digas 'ideas saas', 'genera ideas', 'corrida de ideas', 'ideas verificadas', 'pipeline saas', 'evaluar ideas', o 'desarrolla la ganadora'."
---

# ideas-saas — pipeline idea → panel → MVP Python → go-to-market

**Modos:**
- **RÁPIDAS** (default antiguo): Etapas 1→2→3→4 directas, sin investigación profunda. Rápido, arriesga falsos positivos.
- **VERIFICADAS** (recomendado, default actual): Etapas 1→2→**2V**→3→4→**4G**. Ciclo completo con investigación real, re-juez y comercialización automática.

**Propósito:** un solo comando deja ideas evaluadas **y** el producto vendible (módulo Suit* + brief + activos + landing/leads) del ganador.

**Hardware asumido:** AMD Ryzen 7000 / Radeon / 64 GB RAM, Python local, SQLite, concurrencia asyncio sin saturar iGPU.

## Panel de monitoreo (obligatorio en cada corrida)

**Solicitud:** si existe `SuitIdeasSaaS/solicitud.json` (escrita desde el panel web), usarla como entrada: tomar `tema` y `modo` de ese archivo y **borrarlo tras leerlo** (consumido). Si no existe, seguir el flujo normal (tema del usuario o libre).

Durante toda la corrida, mantener vivo `SuitIdeasSaaS/estado.json` (formato: `corrida`, `modo`, `tema`, `fase`, `ideas[]`, `herramientas[]`, `log[]`). El usuario monitorea en **`http://localhost:8099/panel.html`** (`abrir-panel.bat`; puerto raíz 3001 también lo sirve estático pero sin POST de solicitud).

- **`fase`** en cada cambio: `ideacion → panel → analisis → sintesis → rejuez → scaffold → promocion → brief → activos → landing → cierre → fin` (en rápidas: omitir `analisis/sintesis/rejuez/brief/activos/landing`, saltando de `panel` a `scaffold`).
- **`ideas[]`**: `{nombre, nicho, score, reScore, estado}` — `estado`: `aprobado|condicional|rechazado`; `reScore` se llena en la 2V.
- **`herramientas[]`**: al activar cada skill/herramienta → `{nombre, estado:'activo', detalle}` (ej: `panel-juzgador`, `analista-proy`, `sintesis-proyecto`, `google-flow`, `supabase`, `clasp`); al terminar → `estado:'ok'`; pendientes → `pendiente`.
- **`log[]`**: push `{ts, fase, msg}` en cada paso (máx. mantener últimos 200).
- Si la corrida termina o falla, `fase` queda en el estado real + log del error — no resetear el JSON a idle.
- **Al alcanzar `fase: fin`** (o al fallar de forma definitiva): hacer **append** a `SuitIdeasSaaS/historial.json` (`{corridas:[…]}`) un registro `{fecha, nombre, nicho, score, estado, modulo}` por cada idea evaluada (no solo la ganadora) — es el histórico que ve el panel.

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

### Etapa 2V — Verificación (solo modo VERIFICADAS)

Por cada idea APROBADO (>= 7.5), antes de construir nada:

1. **`analista-proy`** → `<SuitIdeasSaaS/<slug>/Analista_Proy.md>`: investigación web REAL (mínimo: mercado/tamaño, 3-5 competidores con precios, 3-5 fuentes de dolor verificable — Reddit/foros/reseñas, regulación si aplica). Sin inventar: cada hallazgo con fuente.
2. **`sintesis-proyecto`** → `SINTESIS_PROYECTO.md` en la misma carpeta (convierte el análisis en especificación de producto: features, perfiles, diferenciadores).
3. **RE-JUEZ con evidencia:** volver a correr `panel-juzgador` sobre la misma idea, pero ahora el prompt incluye el `Analista_Proy.md` + `SINTESIS_PROYECTO.md` como evidencia. Persistir el re-score en `SuitIdeasSaaS/<fecha>-reverificacion.md`.
4. **Gate de re-verificación (7.5):**
   - **score < 7.5** → PARAR. No se construye. Reportar al usuario: score inicial vs re-score, qué cayó y por qué (ej: "mercado caía de 8.5 a 6.0 al ver competencia real"). La idea queda documentada en el informe.
   - **score >= 7.5** → continúa sola a Etapa 3 (sin pedir confirmación — el gate ya habló 2 veces).

Si en modo RÁPIDAS, la 2V se omite (riesgo aceptado explícitamente).

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

### Etapa 4G — Go-to-market automático (solo modo VERIFICADAS) [ADR-051]

Tras la promoción (Etapa 4), el módulo queda **vendible sin intervención del usuario**. Cadena por decisión (RUCP — reusar, no reescribir):

**4G.1 — BRIEF:** copiar `GuiaTotal/plantillas/brief-cliente.md` → `Suit<Nombre>/docs/BRIEF_CLIENTE.md` y llenarlo desde `MANUAL_VENTAS.md` + `SINTESIS_PROYECTO.md` (21 segmentos, semáforos A/B/C; `id_empresa: null`).

**4G.2 — Decisión de datos (tabla, documentar en el ADR de la corrida):**

| Si el producto... | Entonces |
|---|---|
| Es herramienta de config propia (uso interno, sin clientes externos) | config YAML/texto en el módulo. **Sin web, sin leads.** |
| Vende a clientes (suscripción/SaaS) | **Supabase** para leads (`leads_<slug>`, RLS, insert server-side) — como ContractRenew |
| Es multi-tenant sobre la plataforma GS | cadena **empresa-mascara** (switches `auto`) en vez de lo anterior |

**4G.3 — ¿Web?** Si vende a clientes → **sí, landing** (decisión por defecto: sin landing no hay captura). Si además quiere tráfico orgánico → cadena **clusters-seo + paginas-seo** (solo si 4G.2 = multi-tenant GS).

**4G.4 — Landing + leads:** instalar plantilla `GuiaTotal/plantillas/landing-leads/` en `Suit<Nombre>/landing/` (tokens desde el brief; handler `POST /api/leads` desde `handler-leads.snippet.js`; tabla Supabase + smoke 200/201/400). Ver `landing-leads/LEEME.md`.

**4G.5 — Activos (LAPVTFU — 100% automático, sin pedirle nada al cliente):** generar los 7 activos con **Google Flow MCP** (clone fuera del repo, ver ADR-050):
- `generate-asset.cjs "<prompt>" <ruta>` (CDP 9222, requiere Chrome del perfil dedicado corriendo).
- Prompts: dark flat vector, sin texto, paleta del brief — hero de la landing + variantes para logo/foto/producto según slots LAPVTFU.
- Actualizar segmento 10 del BRIEF con las rutas reales (quitar `[PENDIENTE]`).

**4G.6 — Cierre:** ADR de la corrida (score inicial + re-score + decisión 4G.2/4G.3 + activos) + `node scripts/generate-adr-index.js` + MAPA footer + `gen-mapa-info.js` → `check-map-visual.js` OK + commits por fase (ciclo). El módulo queda: núcleo + landing + brief + activos + manuales + registro — listo para prospección.

**Si ninguna idea llega a 4G** (rápidas sin ganadora, o verificadas que cayeron en 2V): solo el informe, sin módulo, sin landing.

## Entradas / Salidas

- **Entrada:** opcionalmente un tema o nicho del usuario; si no, filtro libre 80/20. Modo: verificadas (default) o `--rapidas`.
- **Salidas (verificadas):** `SuitIdeasSaaS/<fecha>-evaluacion.md` + `Analista_Proy.md` + `SINTESIS_PROYECTO.md` + `<fecha>-reverificacion.md` por la ganadora → `Suit<NombrePascal>/` con núcleo, 5 manuales, `docs/BRIEF_CLIENTE.md`, `landing/` + leads, activos Flow, projects.yaml y ADR.
- **Salidas (rápidas):** solo `<fecha>-evaluacion.md` + `Suit<NombrePascal>/` (Etapa 4), sin 2V ni 4G.

## Comando

`/ideas [tema] [--rapidas]` (`.opencode/commands/ideas.md` + `.claude/commands/ideas.md`) = 1 paso para el pipeline completo. Default = VERIFICADAS (ciclo natural completo). `--rapidas` = modo antiguo (sin investigación ni 4G).

## Nota

El pipeline **no se ejecuta solo cada semana** — se invoca por corrida. La cadencia la decide el usuario.
