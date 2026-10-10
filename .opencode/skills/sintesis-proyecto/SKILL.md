---
name: sintesis-proyecto
description: "Síntesis ejecutiva de una investigación de viabilidad: convierte Analista_Proy.md en SINTESIS_PROYECTO.md — patrones comunes, oportunidades detectadas, funcionalidades recomendadas, perfiles de usuario, diferenciadores potenciales y conclusiones prácticas para diseñar el prototipo de la aplicación. Úsala SIEMPRE que exista un Analista_Proy.md y se necesite un documento corto para diseñar/prototipar, o cuando el usuario diga 'sintetiza el análisis', 'síntesis', 'documento ejecutivo', 'resume el analista', 'brief para el prototipo'."
license: MIT
compatibility: "Claude Code y opencode."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Sintesis-proyecto — síntesis ejecutiva para diseñar el prototipo

Regla base: **no investiga ni inventa — solo sintetiza lo que ya está en `Analista_Proy.md`.** Todo hallazgo del output debe ser rastreable al análisis fuente.

## Entradas

1. **Manual**: `/sintesis-proyecto [ruta]` o "sintetiza el análisis de [proyecto]".
2. **Automática**: la skill `analista-proy` la invoca al cerrar; `guia-total` la invoca en el flujo IDEA (paso 2).

## Insumo obligatorio

- `<Proyecto>/Analista_Proy.md` (raíz del proyecto o donde el usuario indique). **Si no existe, detente y di que corre antes `analista-proy`** — no sintetices de memoria.
- Insumos opcionales (si existen, enríquelos): `<Proyecto>/proposal.md`, veredicto de `panel-juzgador` (`.suit/logs/panel-juzgador/`).

## Salida

`<Proyecto>/docs/SINTESIS_PROYECTO.md` — **siempre en `docs/`**, nunca en la raíz. Si `docs/` no existe, créalo.

## Plantilla exacta

```markdown
# SINTESIS_PROYECTO — [Nombre del proyecto]

> Fuente: [ruta]/Analista_Proy.md (investigado: [fecha], [N] fuentes) · Sintetizado: [fecha]
> Para qué sirve: documento ejecutivo de referencia para DISEÑAR EL PROTOTIPO de la aplicación.
> Regla: todo hallazgo es rastreable al Analista_Proy.md — nada nuevo, nada inventado.

## 1. Resumen ejecutivo
[3-4 líneas: veredicto de viabilidad, mercado en una frase, riesgo #1]

## 2. Patrones comunes del sector
[Lo que se repite en la evidencia: prácticas, métricas, comportamientos de usuario confirmados por ≥2 fuentes]

## 3. Oportunidades detectadas
[Huecos sin cubrir, tendencias aprovechables, canales abiertos — con la fuente que lo respalda]

## 4. Funcionalidades recomendadas
[Lista priorizada para el prototipo, derivada del análisis: cada una con el hallazgo que la respalda]
| # | Funcionalidad | Prioridad | Respaldada por |
|---|---|---|---|

## 5. Perfiles de usuario
[Los perfiles identificados, ordenados por atractivo, con su motivación central]

## 6. Diferenciadores potenciales
[El ángulo diferencial recomendado + los avenidas únicas detectadas]

## 7. Conclusiones prácticas para el prototipo
[5-8 bullets accionables: qué construir primero, qué evitar, qué medir — todo trazado al análisis]

## 8. Evidencia desconfirmatoria (no omitir)
[Lo que desmiente la idea — copiado/esquematizado del análisis. Se incluye SIEMPRE para no diseñar sobre un sesgo de confirmación]
```

## Flujo

1. **Lee** `Analista_Proy.md` completo.
2. **Extrae** por sección: veredicto → §1; repeticiones en los 4 pilares → §2; huecos/tendencias (Pilar 4 + oportunidades) → §3; necesidades JTBD + frustraciones → §4 (funcionalidades que las resuelven); perfiles (Pilar 4) → §5; ángulo diferencial → §6; "Siguiente paso" + principios → §7; "Evidencia desconfirmatoria" → §8 (obligatorio).
3. **Escribe** `<Proyecto>/docs/SINTESIS_PROYECTO.md` con la plantilla. Si hay proposal/veredicto, márcalos como insumos en la cabecera.
4. **Cierre en ≤3 líneas**: dónde quedó el archivo, cuántas funcionalidades recomendó, y la prioridad #1 del prototipo.

## Reglas

- **No inventar**: si el análisis no cubre algo (p.ej. perfiles), escribe "no cubierto en el análisis" — no lo rellenes con conocimiento propio.
- **§8 obligatoria**: sin evidencia desconfirmatoria la síntesis miente por omisión.
- Funcionalidades: máximo 12 en la tabla, prioridad `MVP` / `fase 2` / `futuro`.
- Idioma: el del usuario (español por defecto).
- Este documento es **solo lectura del análisis** — nunca modifica `Analista_Proy.md` ni escribe código.
