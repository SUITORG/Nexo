# Analista_Proy — SuitCompromisos (pendientes personales con puente a Google Calendar)

> Investigado: 2026-11-16 | Fuentes consultadas: 12

## Resumen ejecutivo
**Viabilidad: MEDIA** — alta como herramienta personal (ya construida y en uso), media-baja como producto comercial si se vendiera: el nicho de apps de tareas es enorme (mercado task management ~USD $4.5B en 2026, CAGR 15.6%) pero saturado y con gigantes gratuitos (Google Tasks incluido en Calendar). El hallazgo más valioso: **la integración tarea↔calendario bidireccional es un dolor real y no resuelto** — Todoist eliminó su integración legada de Calendar (2025) y sus usuarios amenazan con cancelar; en TickTick se pide "calendario en vez de AI" en thread tras thread — justo lo que el puente `suitId` de SuitCompromisos resuelve a nivel local. **Riesgo #1: retención brutal del rubro (apps de productividad retienen 4.1% a D30) sumado a que para uso personal la competencia "gratis y nativa" (Google Tasks) no se puede vencer en precio.**

## Clasificación sugerida
- **Industria:** Tecnología / Software — producto digital de productividad personal; coincide con la hipótesis del ecosistema Suit*.
- **Nicho:** Task management personal con calendario (pendientes, recordatorios, life admin) — segmento consumidor/SMB, no enterprise.
- **Especialización:** **Local-first + puente propio a Google Calendar** (service account, sin OAuth, sin mensualidad): el ángulo diferencial no es "otra lista de tareas" sino "tus compromisos llegan a tu calendario sin suscripción ni nube de terceros".
- **Hipótesis inicial vs hallazgo:** se mantuvo (Productividad → task+calendario personal); se afinó: la oportunidad no está en features de lista de tareas (mercado ganado por Todoist/TickTick) sino en la capa de sincronización calendario, que los líderes descuidan.

## Pilar 1 — Fundamentos expertos del sector
- **Retención de productividad es de las peores del mercado:** D1 ≈ 17.1% y **D30 ≈ 4.1%**, muy por debajo del benchmark global (26% D1 / ~7% D30) — [FoxData](https://foxdata.com/en/blogs/why-users-stop-using-productivity-apps-and-how-to-fix-it/), con datos de [Sendbird de benchmarks de retención](https://sendbird.com/blog/app-retention-benchmarks-broken-down-by-industry) (D1 medio 25.3% en 1,000+ apps).
- **Churn mensual de productividad ≈ 6.5% (55.2% anual), 2026:** los drivers #1 y #2 son "se fue a un all-in-one que incluye esto" (31%) y "el free tier alcanza" (26%); #3 "la herramienta se volvió demasiado compleja" (20%). Dato decisional: **los usuarios conectados a calendario/email hacen churn 40–60% menor** que los standalone — [RetentionCheck benchmarks 2026](https://retentioncheck.com/churn-benchmarks/productivity-apps).
- **La integración al workflow diario es el ancla de retención**, y los datos profundizados (6+ meses de tareas acumuladas) reducen el churn a la mitad (misma fuente RetentionCheck).
- **Los to-do apps no arreglan el cumplimiento:** 41% de las tareas de IDoneThis nunca se completaron; la mitad de las completadas se hacían en <1 día — la lista se vuelve "List of Shame" y el usuario declara "to-do bankruptcy" — [WIRED: Hundreds of Ways to Get S#!+ Done (2021)](https://www.wired.com/story/to-do-apps-failed-productivity-tools/) `[viejo, clásico innegociable]`.
- **Principios innegociables para una solución bien planteada:** captura en <10s, un "aha moment" en la primera sesión (marcar la primera tarea), integración con el calendario ya usado, y profundidad de datos en el tiempo como lock-in.

## Pilar 2 — Productos de éxito del sector
### Todoist — líder de categoría (~30M usuarios)
- Qué hace bien: NLP para creación rápida, multiplataforma, free tier generoso, AI (Ramble, Assist) en 2026.
- Patrón replicable: simplicidad potente; **pero en 2025 eliminó la integración legada bidireccional con Google Calendar** y genera el dolor que documenta el Pilar 3.
- Precio: free / Pro $5–7/mes — [Zapier: 7 best to do list apps](https://zapier.com/blog/best-todo-list-apps/), [2sync: 10 best apps 2026](https://2sync.com/blog/best-to-do-list-apps).
### TickTick — mejor relación features/precio
- Qué hace bien: vista calendario, Pomodoro, hábitos, matriz Eisenhower, Kanban; $35.99–49.99/año; AI "sin abusar" (MCP, voz).
- Patrón replicable: todo-en-uno personal; **su deuda es exactamente la debilidad de SuitCompromisos invertida: usuarios pidiendo mejor integración de calendario** (ver Pilar 3).
### Google Tasks — el gigante gratuito
- Qué hace bien: embebido en Gmail/Calendar, gratis, sin setup; "vivo y muero por Tasks dentro de Google Calendar" (Wirecutter).
- Implicación: **para el usuario casual, la alternativa gratis ya resuelve "tarea en el calendario"** — la diferenciación debe estar en tipos/estados/export/privacidad local, no en lo básico — [Zapier](https://zapier.com/blog/best-todo-list-apps/), [Wirecutter](https://www.nytimes.com/wirecutter/reviews/best-to-do-list-app/).

| Producto | Precio | Calendario bidireccional | Local/privado | Fortaleza vs SuitCompromisos |
|---|---|---|---|---|
| Todoist | free / $5–7/mo | parcial (nueva integración 2025, mal recibida) | nube | marca, NLP, móvil |
| TickTick | ~$36–50/año | vista calendario, sin convertir tarea↔evento | nube | features extra |
| Google Tasks | gratis | nativo en Calendar | nube | gratis, sin setup |
| Amplenote | freemium | sync nativo Google/Outlook/Apple | nube | calendario como feature central |
| **SuitCompromisos** | **$0** | **sí, vía suitId + service account** | **sí, localStorage + laptop** | **sin mensualidad, sin nube, tipos propios** |

## Pilar 3 — Necesidades reales de los usuarios
### Frustraciones frecuentes
- **"La eliminación del sync bidireccional es estúpida, me voy a ir"** — usuarios pagando 5–6 años de Todoist cancelando por la nueva integración de Calendar — [r/todoist: Need 2 way GCal](https://www.reddit.com/r/todoist/comments/1j9kbyi/), [r/todoist: New GCal integration sucks](https://www.reddit.com/r/todoist/comments/1jmmeit/) (14 upvotes cada uno, convergencia en múltiples threads = frecuencia, no existencia).
- **"Odio que las apps metan AI en vez de arreglar lo básico"** — TickTick pidiendo convertir tarea↔evento en móvil y escritorio desde hace años — [r/ticktick: proper calendar integration instead of AI](https://www.reddit.com/r/ticktick/comments/1pj54wb/) (dic-2025).
- **"Pierdo más tiempo re-diseñando el workflow que haciendo las tareas"** — abandono de apps digitales de gestión por sobrecustomización (Todoist↔TickTick↔Google Cal) — [r/productivity: abandon digital task apps](https://www.reddit.com/r/productivity/comments/1ncwwgi/) (sep-2025).
### Lo que piden y no existe
- Sincronización tarea↔calendario fiable y sin servicios de pago de terceros (cada thread pide "sin integraciones externas").
- Sistemas simples que no compitan por su atención (frecuencia alta en los 3 threads).
### Quéjas de productos que (casi) fracasan
- Estudio ACM sobre Asana: **42.9% de reseñas negativas**, topics UI/confusión/costo — la complejidad mata retención — [Vaidian et al., Churn Analysis of Asana (2024)](https://doi.org/10.1145/3745812.3745881).

## Pilar 4 — Tendencias, oportunidades y posicionamiento
### Tendencias actuales
- **Mercado task management ~USD $4.5B (2026) → $12.3B proyectado a 2033, CAGR 15.6%** (Grand View Research, citado en [selfmanager.ai: AI Task Manager Market 2026](https://selfmanager.ai/articles/ai-task-manager-app-market)) — la categoría crece pese a la saturación.
- **AI copilots/agents entran al rubro** ([Microsoft Work Trend Index 2026](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)): 66% de usuarios de AI dice ganar tiempo en trabajo de alto valor; los incumbents meten AI (Todoist Ramble, TickTick MCP).
- **Local-first como movimiento** (señal emergente, fuentes secundarias marcadas como débiles en evidencia): workspaces personales que viven en tu máquina y exponen control a assistants (MCP) — ej. Wasl/Orbit/Nod (2026) — dirección afín a SuitCompromisos aunque aún sin consenso de usuarios.
### Huecos sin cubrir
- **Tarea↔evento bidireccional confiable sin suscripción** — dolor documentado y sin buen sustituto tras el cambio de Todoist.
- Life admin personal (viajes, pagos, entregas) con tipos propios — los líderes optimizan para work, no para "compromisos de vida".
### Perfiles de usuario más interesantes
- Pagan por Todoist/TickTick pero cancelan por el calendario (churners del rubro).
- Usuarios de "life admin" que ya viven en Google Calendar y quieren sus pendientes ahí.
### Ángulo diferencial recomendado
**"Tus compromisos, en tu calendario, sin nube ni mensualidad"** — local-first + puente Calendar + tipos personales (viaje/pago/reunión). Si algún día se comercializara: no competir en features contra Todoist; vender la capa de sincronización y la privacidad.

## Evidencia desconfirmatoria
1. **Google Tasks es gratis y ya vive dentro de Google Calendar** — para el caso de uso básico "ver tareas en el calendario", la alternativa dominante cuesta $0 y sin setup; el usuario casual no cambia (Zapier/Wirecutter).
2. **Retención del rubro pésima (4.1% D30) y churn 55.2%/año** — aun con buena integración, mantener uso diario en productividad personal es el problema estructural (FoxData, RetentionCheck).
3. **El público objetivo de SuitCompromisos es UN usuario** (uso personal declarado) — no hay mercado que abordar tal como está planteado; como producto tendría que rehacerse (multiusuario, cuentas, móvil, hosting), lo que lo pone en ventaja comparativa cero contra incumbents con décadas.
4. **SPOF aceptado: la laptop debe estar encendida** con la SA configurada — fricción de setup que los competidores cloud no tienen (ya documentado como condición 5 del panel-juzgador).
5. **Los incumbents ya trabajan en AI+MCP** (TickTick MCP, Todoist Assist) — la ventana de diferenciación "simplicidad" se estrecha.

## Veredicto
- **Viabilidad:** media — uso interno: alta (ya construida, en uso diario, puente funcionando); comercial: media-baja (saturación + gigantes gratis + necesidad de re-diseño multiusuario).
- **Riesgo #1:** retención/frecuencia de uso del rubro (4.1% D30 en productividad) — el valor depende de que el dueño la use a diario, no de features nuevas.
- **Siguiente paso recomendado:** validar barato = medir uso propio real 30 días (syncs/mes, artículos creados/marcar hechos) y encuestar 3–5 personas de "life admin" sobre si pagarían por el puente Calendar sin nube; si no hay tracción de uso ni de pago, mantenerla como herramienta interna y no perseguir comercialización.
