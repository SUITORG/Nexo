# Léxico del usuario — glosario intención ↔ herramienta

**Propósito:** interpretar la forma en que el usuario escribe, pide o erratea en esta
terminal y mapearla a la intención correcta **sin preguntar por erratas obvias**.

**Activación:** automática — AGENTS.md (pre-flight, sección "Léxico") manda a consultar
este archivo antes de clasificar la intención de cualquier pedido. No requiere skill ni
comando.

**Mantenimiento:** cada vez que se interprete un giro/errata nueva del usuario, añadirla
aquí en la misma sesión (solo append — no reescribir entradas existentes).

## Reglas

- Erratas ortográficas obvias → corregir mentalmente y ejecutar; **no preguntar**.
- Su escritura normal es en minúsculas y sin acentos → comparar en minúsculas/sin acentos.
- Si tras aplicar este glosario la intención queda <95% clara → preguntar (máx 3), como
  manda el pre-flight.
- Nunca interpretar un giro hacia una acción destructiva: si hay dos lecturas posibles y
  una borra/escribe datos → preguntar.

## Glosario

| El usuario dice / giro | Se entiende como |
|---|---|
| máscara / mascara / form empresa | skill `empresa-mascara` — obligatorios de `Config_Empresas` + cadena por switches |
| los ciclos / activa los ciclos | eslabones de la cadena: `empresa-registro` → `clusters-seo` → `paginas-seo` → `brief` → `activos` |
| el mapa | `GuiaTotal/MAPA.md` |
| índice / índice de funciones / index | `INDEX_FUNCIONES.md` |
| la hoja / GS / googles | Google Sheets maestro (`Config_*`) — fuente de verdad |
| espejo | Supabase (tablas `Config_*` espejo) |
| registro / la tarjeta | `GuiaTotal/registro/<id>.yaml` |
| el backend | GAS webapp (`backend/*.js`, deploy @25) + `server.js` (3001) |
| brief | `brief-engine` → vector en `Config_Empresas.logo_url` |
| los activos | `lapvtfu` → `cte<id>/_activos` (fotos/video) |
| clusters / clústeres | skill `clusters-seo` → `Config_SEO` |
| páginas / paginas seo | skill `paginas-seo` → `Config_Paginas` |
| estructura drive | `ensureCteFolders` → `cte<id>/` |
| fotoagente | foto del tenant en `cte<id>/fotoagente.jpg` (share ANYONE) |
| sync / sincroniza | `syncToSupabase` (fallback: MCP supabase) |
| maestro | Google Sheets manda; Supabase solo espeja |
| las 9 / los 9 | clústeres SEO (máx. 9 por empresa) |
| piloto | empresa en pruebas de una cadena (ej. HMP) |
| los manuales | `GuiaTotal/manuales/<id>/` (no `docs/` — renombrado MANUAL_PRUEBAS) |
| el visual / mapa visual | `GuiaTotal/MAPA_VISUAL.html` (burbujas + drawer de pasos) |
| la máscara (sitio) | `mascara.html` en server :3001 |

## Cómo pide (patrones de petición — leer antes de responder)

> Capa de ESTILO: cómo formula sus pedidos, aprueba y pausa. Complementa el glosario
> de arriba; misma activación (pre-flight #4).

### Formas típicas de pedir → interpretación

| Él escribe | Interpretar como |
|---|---|
| "dame solo X" / "sin el brief completo, solo los activos" | salida **acotada a X** — cero extras, cero ampliaciones |
| "dame el plan para aprobación" / "hazme un plan" | **primero plan** (fases, archivos, riesgo) → esperar su "aprobado/ejecuta" antes de tocar nada |
| "qué abarcaria" / "dame la estructura/árbol" | preguntar-respuesta: explicar alcance o mostrar estructura, **no construir** |
| "indaga …" / "cruza la información con lo que está ahora" | research de solo lectura **antes** de responder; comparar estado nuevo vs actual |
| "me preguntas" / "dime si tenemos…" | quiere preguntas cortas (≤3) antes de ejecutar, o datos concretos |
| "mantén el código simple" | ponytail: lo mínimo que funcione, sin abstracciones |
| "explicame brevemente" | respuesta corta, sin ensayo |
| "abrilo/abrela por mi" | abrirlo en el navegador/archivo y mostrar (él no lo abre) |
| "¿qué opinas de X?" / "me gustaría X" | **opinar primero**; construir solo tras su "si/ejecuta" |
| "dame la temperatura…" / "cómo funciona / cómo se activa" | explicar mecanismo actual, no inventar ni construir |

### Formas de decidir → acción

| Él escribe | Acción |
|---|---|
| "si" / "aprobado" / "ejecuta" | ejecutar todo lo aprobado sin volver a preguntar |
| respuestas numeradas ("1 si,2 si,3 si") | aprueba **todas** las preguntas en orden → ejecutar las3 sin repetir |
| "haz el commit" | commit **por partes** con el formato del repo; push solo si lo pide |
| "me quedo aquí" / "dejalo así por el momento" / "en unos minutos continuamos" | **PAUSA**: guardar estado en ≤5 líneas, no continuar nada |
| "sigue/continua" | retomar lo pausado (no empezar frentes nuevos) |

### Señales de estilo (siempre asumir)

- Minúsculas, sin acentos, puntuación suelta → normal, no preguntar.
- Respuestas cortas tipo "si", "aprobado" = aprobación plena de lo propuesto.
- Si un "si" es ambiguo entre2 interpretaciones → una sola pregunta corta.

## Erratas vistas (acumular)

| Errata | Palabra |
|---|---|
| actuliza | actualiza |
| rabol | árbol |
| porciento | por ciento (%) |
| asic | así |
| giro no encontrado → apuntar giro aquí | — |
