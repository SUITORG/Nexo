---
name: calidad-minima
description: "Gate de pre-diseño anti-mediocre: juzga si el RESULTADO de la app/proceso merece existir y cómo evitar que salga pobre, a medias o genérico. Úsala SIEMPRE antes de diseñar una idea/proyecto/feature cuando el usuario diga '¿esto vale la pena?', 'que no salga mediocre', 'que no quede pobre', '¿el sistema vale la pena?', 'que se vea/profesional', 'calidad', o al revisar un entregable para decidir si pasa. Fija un piso de calidad concreto (qué SÍ y qué NO) que el diseño y la construcción deben cumplir. Va ANTES del diseño junto con viabilidad-operativa y durabilidad. Entrega piso de calidad + checklist de rechazo en ≤1 página."
---

# Calidad mínima — gate anti-mediocre (2 de 3)

El enemigo no es el error técnico: es **lo mediocre** — funciona, pero no enamora, no se distingue, se siente plantilla. Esta skill fija el piso ANTES de diseñar para que luego no haya que "arreglar la fealdad" después. Compañeras de gate: `viabilidad-operativa` (¿es viable?) y `durabilidad` (¿durará?). Solo lectura: no modifica el proyecto.

## Qué juzga

### 1. ¿Merece existir el resultado?
- ¿Resuelve un problema que el usuario realmente siente (no uno inventado para justificar la app)?
- Si desaparece mañana, ¿alguien lo extrañaría? Si la respuesta es "no", el diseño sobra o hay que redirigirlo.
- ¿Hay algo en el resultado que **nadie más** de ese mercado da (aunque sea 1% diferente)? Si todo es copia de un competidor, el veredicto es NO PASA hasta encontrar ese diferencial.

### 2. Piso de calidad concreto (qué SÍ debe tener)
Para el alcance anunciado, definir en frases accionables — nunca adjetivos vagos ("bonito", "profesional"):
- **Pantallas/pasos**: cada pantalla dice en ≤5 segundos qué puede hacer el usuario ahí (test de los 5 segundos).
- **Copy**: textos reales del dominio, en el idioma del usuario; cero lorem ipsum, cero "Función 1", cero jerga interna (ej: decir "pago protegido" no "escrow").
- **Estados**: todo flujo cubierto — carga, vacío, error, éxito — nada se queda en blanco o en "undefined".
- **Flujo completo**: el camino principal funciona de punta a punta (si se queda a mitad, es mediocre aunque cada pantalla se vea bien).
- **Consistencia**: misma navegación, mismos botones para mismas acciones, mismos colores/tipografía en todo.

### 3. Checklist de rechazo (lo que hace que NO pase)
Marca lo que aparezca en el diseño/propuesta. **2 o más marcas = NO PASA**; 1 marca = pasa con condición:
- [ ] Se ve genérico (plantilla sin identidad, podría ser de cualquier marca)
- [ ] Textos relleno o traducción literal de inglés
- [ ] El usuario necesita ayuda para saber qué hacer en la primera pantalla
- [ ] Flujo principal incompleto o con pasos manuales escondidos
- [ ] Promete más de lo que entrega (copy que no coincide con la funcionalidad)
- [ ] Sin estados de error/vacío — si algo falla, se ve roto
- [ ] Decisiones de UI copiadas textualmente de un competidor sin aporte

## Salida (estructura fija, ≤1 página)

```markdown
## Veredicto de calidad: [PASA | PASA CON CONDICIONES | NO PASA]

**¿Merece existir?** (2-3 frases: problema real, diferencia, quién lo extrañaría)

**Piso de calidad para este proyecto** (4-6 bullets accionables, específicos de este caso)

**Checklist de rechazo**: N marcas → [detalle de cada marca]

**Condiciones** (si aplica): qué cerrar para que pase.
```

## Reglas

- cm-001: el piso de calidad se define **antes** del diseño y se adjunta como requisito al contrato/CONTRATO.md cuando el proyecto avance.
- cm-002: nada de adjetivos sin ejemplo concreto — "que se vea profesional" NO es un requisito; "cabecera con nombre del usuario y 3 acciones máximas, sin scroll en la vista inicial" SÍ lo es.
- cm-003: NO PASA no mata la idea: entrega el cierre mínimo para que pase (la regla es "que no sea mediocre", no "que sea perfecto").
- cm-004: máximo 3 preguntas al usuario (o 0 con `decision_libre=true`, supuestos documentados).
- cm-005: para auditoría de pantallas EXISTENTES ya construidas, invocar `pantalla-limpia` en vez de esta skill (ésta fija el piso antes del diseño).
