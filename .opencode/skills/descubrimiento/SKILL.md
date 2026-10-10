---
name: descubrimiento
description: "Fase obligatoria de descubrimiento y arquitectura ANTES de escribir, modificar o eliminar código. Clasifica la solicitud, diagnostica 10 capacidades (configuración, archivos, filtros, cruce, reportes, dashboard, respaldos, idempotencia, validación, seguridad), activa solo los micro-skills internas necesarias y entrega un propuesta de 11 puntos antes de programar. Úsala SIEMPRE ante una idea nueva, feature, bugfix, mantenimiento correctivo/evolutivo, mejora de rendimiento, refactorización, integración, automatización, migración, procesamiento de datos, reporte o dashboard — y al analizar una idea (guia-total). Lee `.suit/config/switches.yaml` al arrancar: con `decision_libre=true` (defecto) no hace preguntas y documenta supuestos; máximo 3 preguntas en total. También aplica si el usuario dice 'antes de programar', 'analiza esto primero', 'diagnóstico de capacidades' o 'descubrimiento'."
---

# Descubrimiento — fase previa obligatoria al desarrollo

**No comiences a programar hasta completar esta fase** y obtener la respuesta del usuario, o documentar claramente los supuestos autorizados.

Aplica a: ideas/proyectos nuevos · cambios pequeños · mantenimiento correctivo y evolutivo · mejoras de rendimiento · refactorizaciones · integraciones (APIs, archivos, bases de datos, servicios) · automatizaciones, migraciones y procesamiento de datos · reportes y dashboards.

## 0. Switches (al arrancar)

📁 Lee `.suit/config/switches.yaml` (skill `parametros`):

- `decision_libre` (defecto `true`) → **true: 0 preguntas**, documenta supuestos en el entregable (punto 4). **false: máximo 3 preguntas** antes de continuar.
- `nivel_preguntas` → `lote` (defecto): agrupa las preguntas en una sola tanda · `minimo`: solo lo imprescindible.
- `modo_descubrimiento` → `completo` (defecto): 5 fases · `rapido`: solo fases 1 + 5 (cambios pequeños).

Si el comportamiento pedido no es configurable desde el switch → es un gap nuevo: propón switch y regístralo en `GuiaTotal/PENDIENTES.md`.

> **Autoridad de supuestos:** los supuestos tienen autoridad **nula** — puedes *proceder* con ellos (documentados en el punto 4 del entregable), pero **nunca afirmarlos como hechos** ni promoverlos a requisito confirmado hasta verificarlos en vivo.

## 1. Clasifica la solicitud

Determina si se trata de:

- Idea o proyecto nuevo
- Cambio pequeño
- Mantenimiento correctivo
- Mantenimiento evolutivo
- Mejora de rendimiento
- Refactorización
- Automatización
- Procesamiento, transformación o análisis de datos
- Reporte o dashboard
- Integración entre sistemas, archivos, APIs o bases de datos

Explica brevemente el objetivo, el resultado esperado y el impacto potencial antes de proponer una implementación.

## 2. Diagnóstico obligatorio de capacidades

Evalúa si la solución necesita alguna de estas capacidades. Pregunta únicamente por las relevantes (máximo 3 preguntas en total; `decision_libre=true` → ninguna), pero nunca las ignores:

1. **Configuración externa** — ¿archivo de configuración (TXT/JSON/YAML/CSV/.env/env vars)? ¿Qué valores configurables sin cambiar código (rutas, URLs, constantes, credenciales, límites, fechas, modos, parámetros de API, reglas de negocio)? Prioriza formatos simples (`clave=valor` cuando aplique). **Checklist de qué parametrizar → skill `parametros`, sección "Recomendación de arranque"** (taxonomía: constantes, rangos min/max, rutas, formatos fecha/hora, banderas, montos; dónde vive cada uno: switches.yaml vs `<modulo>/config.yaml` vs `.env`).
2. **Archivos y fuentes de información** — ¿qué archivos intervienen? ¿formato (TXT/CSV/TSV/JSON/Excel/PDF/imágenes)? ¿ubicación? ¿cuál es fuente, salida y temporal? ¿cómo se valida estructura y contenido?
3. **Filtros y criterios** — ¿debe filtrar? ¿campos, reglas, condiciones, fechas, estados, categorías, rangos? ¿fijos o configurables? ¿guardar los filtros usados para repetir el proceso?
4. **Cruce y consolidación de datos** — ¿cruzar/comparar/unir/reconciliar entre archivos, hojas, tablas, APIs o BD? ¿llave de coincidencia? ¿duplicados, faltantes, inconsistentes? ¿qué fuente tiene prioridad en conflictos?
5. **Reportes** — ¿formato de salida (TXT/CSV/Excel/JSON/HTML/PDF/correo/Google Sheets)? ¿métricas, columnas, totales, alertas, conclusiones? ¿historial de ejecuciones?
6. **Dashboard** — ¿quién lo usará y qué decisiones debe facilitar? ¿indicadores, filtros, gráficas, exportaciones, periodos? **Si un reporte simple resuelve, no hagas dashboard.**
7. **Respaldos locales y recuperación** — ¿se modifican/reemplazan datos o configuraciones? ¿respaldo previo, dónde, retención, restauración? **Nunca sobrescribas información crítica sin estrategia de respaldo.**
8. **Reprocesamiento e idempotencia** — ¿ejecutable de nuevo sobre la misma información? ¿qué pasa si se interrumpe? ¿evita duplicar? ¿reanunable desde el último punto válido?
9. **Validación, errores y trazabilidad** — ¿validaciones antes/durante/después? ¿qué errores detienen el flujo vs se registran? ¿log local o archivo de errores? ¿cómo sabe el usuario que terminó bien?
10. **Seguridad y datos sensibles** — ¿credenciales, datos personales, API keys, financieros? **Nunca secretos en código ni repositorio** → env vars o archivos locales ignorados por git.

## 3. Activación de micro-skills internas (solo las necesarias)

Según el diagnóstico, aplica solo estas secciones (son internas — no requieren instalación aparte):

- **Configuración** — diseña archivos de configuración simples, validados, separados del código (sigue la checklist "Recomendación de arranque" de la skill `parametros`).
- **Archivos y datos** — formatos, estructura, columnas, rutas, entradas/salidas, temporales, validación.
- **Filtros** — convierte requisitos de filtrado en reglas explícitas y configurables, probables con datos de ejemplo.
- **Cruce de información** — llaves, prioridades, duplicados, faltantes, conflictos, conciliación.
- **Reportes** — salidas accionables: columnas, agregados, fechas, estado de ejecución, formato.
- **Dashboard** — decide si aporta valor; si aplica: indicadores, vistas, filtros, fuente, actualización, exportación.
- **Respaldo y recuperación** — respaldos previos, versionado, ubicación, retención, restauración verificable.
- **Reprocesamiento** — reanudar, repetir, evitar duplicados, conservar trazabilidad.
- **Calidad** — pruebas mínimas, validaciones, manejo de errores, logs, criterios de aceptación.

## 4. Principio de implementación

- 20% de esfuerzo → 80% del valor.
- Solución mínima, útil, mantenible y verificable primero.
- Sin complejidad prematura, dependencias innecesarias ni arquitectura excesiva.
- Sé un 1% disruptivo: cuestiona lo convencional solo si hay alternativa claramente más simple, robusta, barata o reutilizable.
- Componentes pequeños, configurables, reutilizables; claridad sobre sofisticación.
- No construyas dashboards, automatizaciones, BD o sistemas complejos si basta un script, archivo estructurado o reporte.

## 5. Entregable previo al desarrollo

Antes de entrar al ciclo de programación, entrega una propuesta breve con:

1. Objetivo entendido
2. Tipo de trabajo (idea, cambio, mantenimiento, corrección, reporte, …)
3. Requisitos confirmados
4. Preguntas pendientes o supuestos adoptados
5. Micro-skills activadas y por qué
6. Entradas, salidas y archivos involucrados
7. Configuración necesaria
8. Riesgos: respaldos, datos sensibles, duplicados, errores, pérdida de datos
9. Enfoque recomendado de mínimo esfuerzo y máximo impacto
10. Plan de desarrollo por pasos
11. Criterios de aceptación y forma de comprobar que funciona

**Recién después de esta validación comienza la implementación.** Si el usuario aprueba (o `decision_libre=true` y no hay cambios de alcance), procede directo. Dudas persistentes → `GuiaTotal/PENDIENTES.md`. Tras cerrar: ↪ cierre estándar de guia-total (PENDIENTES + MAPA si difiere + ≤3 líneas).
