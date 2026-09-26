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

Lanza búsquedas **en paralelo** y repite por cada pilar. Mínimo 3-5 queries por pilar, en inglés y español.

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
| **Triangulación** | Nunca afirmes algo con una sola fuente. ≥3 fuentes independientes por hallazgo clave. |
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

### 6. Cierre

Al entregar, responde en ≤3 líneas: veredicto, dónde está el archivo, y si la clasificación sugerida cambió respecto a la hipótesis inicial. No repitas el contenido del MD en el chat.

## Reglas

- Todo hallazgo lleva fuente enlazada — sin fuente, no es hallazgo, es opinión.
- Si un pilar sale débil (poca evidencia), dilo explícitamente en el MD en vez de rellenar.
- Idioma del MD: el del usuario (español por defecto).
- Esta skill solo investiga y recomienda — nunca escribe código ni crea el proyecto.
