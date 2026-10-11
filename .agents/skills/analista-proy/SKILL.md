---
name: analista-proy
description: Investigación profunda de mercado para validar si un TEMA nuevo (app, desarrollo, producto, proyecto, nicho) tiene posibilidad de éxito. Úsala SIEMPRE que el usuario mencione validar una idea, investigar un nicho o mercado antes de construir, analizar viabilidad, "¿esto tiene éxito?", "investigación de app", "investigación de mercado", o "Analista_Proy" — aunque no pida la skill explícitamente. El TEMA es un placeholder: si el usuario no lo dio, pídeselo antes de investigar. Genera un archivo MD llamado Analista_Proy.md con 4 pilares de investigación, sugerencia de Industria/Nicho/Especialización y las técnicas del 1% aplicadas.
---

# Analista Proy — Investigación de viabilidad de un proyecto

## Propósito

Antes de escribir una línea de código, responder con evidencia: **¿este TEMA tiene mercado real?** El entregable es un solo archivo `Analista_Proy.md` que el usuario puede leer y decidir. La investigación se hace con búsquedas web reales — no con conocimiento de memoria, que se desactualiza.

## Flujo

### 1. Recibir el TEMA

El prompt de esta skill contiene el placeholder `[TEMA]` — ahí va **la app, desarrollo, producto o proyecto** que el usuario quiere investigar.

- Si el usuario ya dio el TEMA en su mensaje → úsalo directo.
- Si no lo dio o es ambiguo → pregúntale: **"¿Cuál es el TEMA a investigar?"** (con expectativa ≤3 preguntas: qué hace, para quién, plataforma). No paralices por falta de detalle: con una descripción razonable, arranca.

### 2. Fijar hipótesis

Antes de investigar, anota una hipótesis de clasificación que la investigación deberá confirmar o corregir:

- **Industria** — el sector macro al que pertenece el TEMA
- **Nicho** — el segmento concreto dentro de esa industria
- **Especialización** — el ángulo diferencial donde el proyecto podría ganar

La hipótesis final **puede cambiar** si la evidencia lo indica. Eso es señal de buena investigación, no de error.

### 3. Ejecutar los 4 pilares (investigación web real)

**Política de fuentes — calidad > volumen (anti-gerga):**

- **Cupo duro: 8-12 fuentes TOTALES** por análisis (~2-3 por pilar). Se acabó rellenar.
- **Whitelist (fuentes confiables):** informes de industria reconocidos (Gartner, Statista, IBISWorld, cámaras/gobiernos), estudios/papers con metodología explícita, páginas oficiales de precios y rankings de competidores, tiendas (App Store/Play) con datos reales, Reddit/foros **solo** threads con engagement alto (100+ votos o 50+ comentarios) y recientes, autores/analistas con track record verificable en el nicho.
- **Fuera de whitelist:** blogs anónimos de SEO, listicles "top 10", contenido generado por IA, foros muertos, noticias de 2do/3er nivel que solo repiten un original (ir a la fuente original), opiniones sueltas sin evidencia.
- **Recencia: ≤24 meses** por defecto. Si un clásico es innegociable (ej: paper fundacional), incluirlo marcado `[viejo]` y que sea como máximo 1 de las 8-12.
- **Test de descarte:** si la fuente no cambia ninguna decisión del análisis (feature, precio, riesgo, posicionamiento, ICP) → **no entra**. Pregúntate: "¿qué decido distinto gracias a esto?" Si no hay respuesta, descartada.
- **1-2 queries por pilar** (no 3-5), en el idioma del nicho (inglés para mercados anglo; español para MX/LatAm; ambos solo si el producto vende en los dos).

Lanza las búsquedas **en paralelo**. Repite por cada pilar:

**Pilar 1 — Fundamentos expertos del sector**
Estudios, informes, papers, principios probados de diseño (retención, engagement, monetización), lo que la evidencia dice sobre este tipo de producto. Qué principios debería tener una solución bien planteada.

**Pilar 2 — Productos de éxito del sector**
Apps/productos líderes o muy bien valorados en el nicho. Funcionalidades, patrones comunes, propuestas de valor, mecánicas de engagement, monetización, lo que ya demostró funcionar.

**Pilar 3 — Necesidades reales de usuarios**
Reviews de tiendas (1-3 estrellas = oro), foros (Reddit, Discord), comentarios. Frecuentes: quéjas, funcionalidades que echan en falta, frustraciones, deseos, mejoras pedidas.

**Pilar 4 — Tendencias, oportunidades y posicionamiento**
Tendencias actuales, subnichos en crecimiento, perfiles de usuario más interesantes, huecos poco cubiertos, ángulos diferenciales, posicionamiento posible.

### 4. Aplicar las técnicas del 1%

Lo que separa una investigación mediocre de una excelente no es más búsquedas, sino cómo se evalúa la evidencia. Aplica esto en todos los pilares:

| Técnica | Cómo se aplica |
|---|---|
| **Triangulación** | Hallazgo *decisional* (va al veredicto, precio o feature): ≥2 fuentes confiables de la whitelist, independientes entre sí. Hallazgo no-decisional: 1 fuente o se cae. Nunca cuentes 3 blogs que repiten el mismo dato original. |
| **Evidencia desconfirmatoria** | Busca activamente razones por las que el TEMA **fallaría**. Si solo encuentras confirmación, no investigaste bien. |
| **Señales > opiniones** | Descargas, rankings, pricing, anunciantes activos (Ads Library), tráfico = demanda real. Opiniones sueltas = ruido. |
| **Frecuencia, no existencia** | "5 threads pidiendo X" pesa más que "1 thread". Cuenta menciones, no solo presencia. |
| **Reviews de 1-3 estrellas** | Son la fuente primaria de necesidades: revelan qué falla en los productos que ya fallaron por eso. |
| **Jobs to be Done** | Qué trabajo contrata el usuario (emoción, estatus, conveniencia), no qué feature quiere. |
| **Cuantificar** | Tamaño rough del mercado, willingness-to-pay aparente, número de competidores activos. Números aproximados > adjetivos. |

### 5. Generar el archivo

Escribe `Analista_Proy.md` en el directorio de trabajo (o donde el usuario indique). **Plantilla exacta:**

```markdown
# Analista_Proy — [Nombre del TEMA]

> Investigado: [fecha] | Fuentes consultadas: [N]

## Resumen ejecutivo
[3-5 líneas: veredicto de viabilidad, mercado, y el riesgo #1]

## Clasificación sugerida
- **Industria:** [con justificación de 1-2 líneas]
- **Nicho:** [con justificación]
- **Especialización:** [el ángulo diferencial recomendado]
- **Hipótesis inicial vs hallazgo:** [se mantuvo / cambió y por qué]

## Pilar 1 — Fundamentos expertos del sector
[Hallazgos con fuentes enlazadas. Qué principios son innegociables.]

## Pilar 2 — Productos de éxito del sector
### [Producto 1] — [valoración/descargas si se halla]
- Qué hace bien: ...
- Patrón replicable: ...
### [Producto 2] — ...
[Tabla comparativa de competidores al final del pilar]

## Pilar 3 — Necesidades reales de los usuarios
### Frustraciones frecuentes
### Lo que piden y no existe
### Quéjas de productos que fracasaron
[Cada punto con fuente: review, thread, foro]

## Pilar 4 — Tendencias, oportunidades y posicionamiento
### Tendencias actuales
### Huecos sin cubrir
### Perfiles de usuario más interesantes
### Ángulo diferencial recomendado

## Evidencia desconfirmatoria
[Los mejores argumentos en contra de este TEMA. Obligatorio.]

## Veredicto
- **Viabilidad:** alta / media / baja
- **Riesgo #1:** ...
- **Siguiente paso recomendado:** [validación concreta y barata]
```

### 6. Síntesis para el prototipo

Después de escribir `Analista_Proy.md`, invoca la skill `sintesis-proyecto` (si no está instalada, dilo y sugiere `node scripts/install-skill.js sintesis-proyecto`): genera `<Proyecto>/docs/SINTESIS_PROYECTO.md` — el documento ejecutivo (patrones, oportunidades, funcionalidades recomendadas, perfiles, diferenciadores, conclusiones) con el que se diseña el prototipo. No la reemplaces escribiendo tú la síntesis: esa skill tiene su plantilla y su trazabilidad al análisis.

### 7. Cierre

Al entregar, responde en ≤3 líneas: veredicto, dónde está el archivo, y si la clasificación sugerida cambió respecto a la hipótesis inicial. No repitas el contenido del MD en el chat.

**Handoff a construcción**: si el veredicto es **alta** o **media**, añade a esas 3 líneas la sugerencia `/ciclo [ruta]` — `Analista_Proy.md` es insumo directo de la fase 0 del ciclo (creación de `CONTRATO.md`): su clasificación Industria/Nicho/Especialización y el "Siguiente paso recomendado" alimentan las reglas del contrato. Solo sugiere el ciclo; no lo ejecutes tú. Si el veredicto es **baja**, no lo sugieras.

## Reglas

- Todo hallazgo lleva fuente enlazada — sin fuente, no es hallazgo, es opinión. Solo cuentan fuentes de la whitelist (sección 3).
- Si un pilar sale débil (ninguna fuente whitelist pasa el test de descarte), márcalo **`DÉBIL`** en el MD y sigue — rellenar con ruido degrada el análisis completo.
- Cupo 8-12 fuentes totales: si llegas al cupo y un pilar queda flojo, es preferible entregar ese pilar débil antes que bajar el listón de calidad.
- Idioma del MD: el del usuario (español por defecto).
- Esta skill solo investiga y recomienda — nunca escribe código ni crea el proyecto.
