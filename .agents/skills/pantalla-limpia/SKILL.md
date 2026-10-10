---
name: pantalla-limpia
description: "Auditoría genérica de claridad de pantallas (cualquier proyecto): menos es más, Pareto 1%/20-80, modo creativo opcional, invocable por otras skills."
---

# Pantalla limpia — auditoría de claridad por pantalla

Skill **genérica y portable**: se instala o se invoca en cualquier proyecto y trabaja sobre él. Fin único: **que cada usuario entienda y pueda operar mejor cada una de sus funciones** — empezando por el acceso (login / sign-in / registro) y siguiendo por cada pantalla. Cubre el frontend (pantallas) y su respaldo (backend: lo que la pantalla promete vs. lo que existe).

- **Solo lectura + veredicto:** no modifica el proyecto; el veredicto es el único escrito.
- **Autocontenida:** un solo archivo, sin dependencias del proyecto donde nació. Apta para instalarse en cualquier proyecto (como `<skills>/pantalla-limpia/SKILL.md`) o para que otra skill la invoque.

## ACTIVACIÓN (triggers bien señalados)

### 1) Por intención del usuario (frases típicas)
- "revisa las pantallas" · "audita las pantallas" · "revisión de claridad" · "limpia la UI".
- "está amontonado" · "no se entiende" · "no se entiende para qué es" · "¿por qué está confuso?".
- "menos es más" · "que se entienda en cada pantalla cuál es su propósito".
- Equivalentes en el idioma del usuario o del proyecto.

### 2) Por momento del proyecto
- Se agregaron pantallas nuevas → **revisión incremental** (solo lo nuevo o cambiado).
- Antes de lanzamiento, demo o entrega.
- Revisión periódica de claridad.

### 3) Invocada por otra skill o por un pipeline (sin usuario directo)
- Otra skill la llama por su nombre (`pantalla-limpia`) y le pasa las **Entradas** del contrato (§CONTRATO DE INVOCACIÓN).
- Sin conversación: trabaja con lo recibido; si falta algo crítico, devuelve **máximo 3 preguntas** o supuestos explícitos.
- Al terminar, devuelve el **bloque de resultado** (§CONTRATO DE INVOCACIÓN, Salidas).

## CONTRATO DE INVOCACIÓN (entradas ↔ salidas ↔ lectura del proyecto)

### A) Entradas — lo que el proyecto que llama debe "llenar"
| Campo | Qué es | Obligatorio |
|---|---|---|
| proyecto | Ruta o nombre del proyecto a revisar | Sí |
| alcance | Todo el producto; pantallas o áreas específicas; o "incremental desde <fecha/commit>" | Sí |
| idioma | Idioma del veredicto (default: el del usuario) | Recomendado |
| entregable | Formato (MD/DOCX) y carpeta destino (default: MD en la carpeta que indique el llamante) | Recomendado |
| modo | `estandar` (default) o `creativo` (ver §CREATIVIDAD) | Opcional |
| contexto_extra | Roles, flujos o pantallas extra a considerar; contexto ya conocido del llamante | Opcional |
| restricciones | p. ej. "solo lectura", "no tocar X", "no entrar a Y" | Opcional |

Ejemplo mínimo (cómo se llena):
- proyecto: `<ruta>`
- alcance: incremental — pantallas nuevas desde `<fecha>`
- idioma: es · entregable: MD en `docs/` · modo: estandar

### B) Lectura del proyecto — lo que la skill detecta sola (viceversa)
- **Estructura y navegación:** router, rutas, carpeta de pantallas, menús → inventario de pantallas + rol(es) que las usan.
- **Stack y convenciones:** framework, estilos, idioma real, manuales o índices existentes (p. ej. índice de funciones) → se respetan; no se impone estructura.
- **Puertas de entrada:** login / sign-in / registro / "continuar sin sesión" / logout / errores.
- Lo que no se pueda detectar no se inventa: se marca como supuesto en el veredicto (o se pregunta, máximo 3).

### C) Salidas — lo que se produce y cómo "leerlo"
1. **Resumen corto** (mensaje de retorno): diagnóstico en 1 frase + top hallazgos + siguiente paso.
2. **Veredicto** (documento) con **estructura fija numerada** para que cualquier proyecto lo lea igual:
   1. Cabecera estándar: Proyecto · Fecha · Alcance · Modo · Pantallas cubiertas (n/total) · Resultado general.
   2. Veredicto general.
   3. Causas de fondo.
   4. Fichas por pantalla.
   5. Renombres (jerga → lenguaje de usuario).
   6. Plan A / M / R.
   7. Checklist "5 segundos" por pantalla.
   8. Método, fuentes y límites.
3. **Pendientes:** lo que quede fuera de alcance va a una nota separada; nunca se mezcla con el veredicto.
4. **Bloque de resultado** (para skills/pipelines): `proyecto · pantallas cubiertas (n/total) · hallazgos A (n) · hallazgos M (n) · estado (listo|parcial) · ruta del veredicto`.

## ENFOQUE 1% / PARETO / MENOS ES MÁS (siempre activo)
- **¿Qué haría el 1%?** No agrega funcionalidad para "aclarar": quita fricción. Una pantalla = un propósito + una acción principal. El texto habla el idioma del usuario, no el interno.
- **20/80:** el 20% de los cambios produce el 80% de la mejora. Cada hallazgo se clasifica por efecto (alto/medio/bajo) × esfuerzo (S/M/L); primero los "quick wins".
- **Menos es más:** por defecto se propone quitar o colapsar; agregar es el último recurso. Si algo no se explica en una frase o no mejora la "prueba de los 5 segundos", va a backlog.

## CREATIVIDAD (solo si el usuario lo pide)
- **`modo: estandar` (default):** cirugía mínima y conservadora.
- **`modo: creativo`:** además de lo anterior, se pueden proponer **2-3 variantes por hallazgo clave** (conservadora / media / audaz): conceptos de nombres, microcopy alternativo, agrupaciones o reórdenes más ambiciosos, ideas de jerarquía o presentación, y posibles divisiones de pantalla.
- Guardarraíles: sin funciones nuevas; todo con evidencia; lo audaz se marca como opción con su esfuerzo; decide el usuario.
- La creatividad **nunca sustituye** la regla madre (menos es más): se crea quitando, no sumando.

## REGLAS
1. **Solo lectura.** Nunca modificar código ni datos; el único escrito es el veredicto (y la nota de pendientes si algo queda fuera).
2. **Extensible.** Las pantallas se DESCUBREN del proyecto; no se fija lista a mano. Pantallas nuevas entran en la siguiente pasada.
3. **Lectura dirigida, nunca total.** Primero índices y estructura; después rangos y búsquedas puntuales; se cita archivo:línea.
4. **Evidencia real.** Hecho visto vs inferencia; no inventar; lo no verificable se marca.
5. **Cirugía, no diseño nuevo.** Quitar/mover/colapsar/renombrar sobre lo existente; si el ruido no cabe, proponer **separar en pantalla nueva**. (El diseño nuevo solo se explora en `modo: creativo` y como opciones.)
6. **Alcance cerrado.** Solo el proyecto indicado; nada de fuera entra al análisis ni al entregable.
7. **Idioma del usuario.** Veredicto en el idioma acordado; renombres en lenguaje del usuario final.
8. **Portabilidad.** Nada específico de un proyecto vive dentro de esta skill; el proyecto entra por las Entradas.

## PROCESO (6 pasos)
1. **Descubrir** — inventario completo de pantallas + roles (ver §CONTRATO B). Foco en acceso y sesión. Si hay revisión previa, marcar nuevas/cambiadas → incremental.
2. **Ficha por pantalla (mínimo viable)** — propósito esperado (1 frase) vs el que hoy comunica; título/subtítulo/CTA principal (archivo:línea); bloques en orden (nº); qué compite por atención; jerga; duplicaciones; contenido de otro rol; cruce backend (promesa vs realidad, demo visible, estados y errores legibles).
3. **Clasificar hallazgos** — QUITAR · MOVER · COLAPSAR · RENOMBRAR · SEPARAR (pantalla nueva) · AGREGAR (último recurso), con efecto, esfuerzo y evidencia. Prueba de los 5 segundos por pantalla.
4. **Pareto** — ordenar por efecto/esfuerzo; elegir el conjunto mínimo de mayor mejora; marcar A/M/R; descartar lo de bajo efecto.
5. **Veredicto** — documento con estructura fija (§CONTRATO C) y resumen corto primero. Si es incremental: sección "Qué cambió desde la revisión anterior".
6. **Verificación antes de cerrar** — re-verificar hallazgos de severidad alta; pantallas cubiertas = inventario completo; nada fuera de alcance dentro del documento.

## CHECKLIST DE RUIDO (apoyo a los pasos 2-3)
- ¿Más de un mensaje compitiendo por ser "el" mensaje? ¿Más de una acción principal?
- ¿Jerga sin traducir o siglas internas?
- ¿Insignias repetidas? (si todo resalta, nada resalta)
- ¿Se repite dentro de la pantalla lo que ya está en header/nav?
- ¿Contenido de otro rol? ¿Datos demo mostrados como reales?
- ¿Una función a más de 2 toques o que no se entiende sin manual?

## SALIDA Y REGISTRO
- Archivos: `Veredicto-Pantallas-<Proyecto>.<md|docx>` y `Pendientes.md` (si aplica), en la carpeta acordada.
- Registrar supuestos y límites dentro del propio veredicto (§8).
