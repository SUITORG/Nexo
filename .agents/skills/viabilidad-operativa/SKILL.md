---
name: viabilidad-operativa
description: "Gate de pre-diseño que cuestiona la OPERACIÓN de una idea/proceso ANTES de diseñar: ¿es ágil o se complica?, ¿el tiempo que toma vale la pena?, ¿cuántos tokens/créditos consume?, ¿hay riesgo de que nos suspendan o baneen una cuenta (WhatsApp, Google, scraping, APIs no oficiales)?, ¿depende de algo frágil? Úsala SIEMPRE que el usuario diga '¿vale la pena hacer esto?', '¿cuánto se va a tardar?', '¿no nos van a banear?', 'evalúa el proceso', '¿es viable este proceso?', '¿cuánto consume?', antes de arrancar cualquier idea, automatización, integración o feature nueva — aunque no pida la skill. Va ANTES del diseño, junto con calidad-minima y durabilidad. Entrega veredicto APTO / APTO CON CONDICIONES / NO APTO en ≤1 página."
---

# Viabilidad operativa — gate de pre-diseño (1 de 3)

Preguntas incómodas que hay que responder **antes de diseñar**, no después de construir. Compañeras de gate: `calidad-minima` (¿merece existir?) y `durabilidad` (¿durará y se podrá conectar?). Solo lectura: no escribe código, solo opina.

## Las 5 preguntas (en este orden)

### 1. ¿Es ágil?
Compara el proceso propuesto contra la alternativa más simple. Cuenta pasos, pantallas, dependencias y decisiones que pide al usuario.
- Señal roja: más de ~7 pasos para la tarea principal, o el usuario debe entender jerga interna del sistema para avanzar.
- Pregunta clave: *"¿se puede resolver con la mitad de piezas?"* — si sí, esa versión simplificada es el diseño recomendado.

### 2. ¿El tiempo vale la pena?
Estima en minutos/horas cada camino: tiempo de construcción + tiempo que consume al usuario en cada uso.
- Regla 20/80: si el 20% del proceso da el 80% del valor, propón recortar el resto.
- Señal roja: un flujo que toma 30 min construir pero ahorra 2 segundos por uso en un escenario que casi no ocurre.

### 3. ¿Cuánto consume?
Costo recurrente del proceso: tokens de IA por ejecución, créditos de APIs de pago (Gemini, OpenRouter, Flow, Stripe), llamadas a Sheets/Supabase, tiempo de cálculo.
- Si el proceso se repite en loop o por lote: proyecta el costo mensual, no el de una corrida.
- Señal roja: algo "barato por corrida" × cientos de corridas diarias, o créditos gratuitos que se agotan con 2 usos.
- Si hay alternativa gratuita o más barata de calidad equivalente, esa va primero (prioridad: modelos free de `.suit/registry/models.yaml`).

### 4. ¿Nos pueden banear?
Riesgo real de suspensión de cuentas o bloqueos por el camino elegido:
- **WhatsApp no oficial (Baileys u otras librerías no oficiales)** → riesgo ALTO de suspensión de número; exigir: cuenta dedicada (no la personal), volumen bajo, texto manual-aprobado, README con advertencia visible.
- **Scraping / extracción de datos** → revisar ToS del sitio; preferir API oficial aunque cueste (Google Places tiene tier gratis, por ejemplo).
- **Automatización en Google/Meta/TikTok** → APIs oficiales sí; macros y bots no.
- **Rate limits**: si el proceso depende de cuotas gratuitas, verificar cuota actual antes de diseñar alrededor de ella.
- Veredicto con este riesgo: nunca "APTO" limpio — a lo sumo "APTO CON CONDICIONES" con las medidas de mitigación listadas.

### 5. ¿De qué depende que no se caiga?
Cadena de dependencias: API externa, webhook, extensión navegador, servicio que puede morir, credencial que expira, clave hardcodeada.
- Señal roja: un solo punto de fallo sin plan B (si el servicio A cae, el proceso entero se detiene sin alternativa).

## Salida (estructura fija, ≤1 página)

```markdown
## Veredicto operativo: [APTO | APTO CON CONDICIONES | NO APTO]

| Pregunta | Respuesta (1-2 líneas) |
|---|---|
| 1. ¿Ágil? | |
| 2. ¿Tiempo vale la pena? | |
| 3. ¿Cuánto consume? | |
| 4. ¿Riesgo de ban? | |
| 5. ¿Dependencias frágiles? | |

**Condiciones** (solo si APTO CON CONDICIONES): medidas concretas, ej. "cuenta dedicada, máx 20 envíos/día".
**Alternativa más simple**: si la hay, una frase.
```

## Reglas

- vi-001: cada respuesta respalda con dato o supuesto marcado `[supuesto]` — nada afirmado sin evidencia.
- vi-002: NO APTO solo cuando un riesgo es irremediable (ToS prohíbe tajantemente, costo inviable); si se mitiga, es APTO CON CONDICIONES.
- vi-003: máximo 3 preguntas al usuario (o 0 con `decision_libre=true` de `.suit/config/switches.yaml`, documentando supuestos).
- vi-004: salida en una página; el detalle fino va en `analista-proy` (mercado) — esta skill juzga la OPERACIÓN, no el mercado.
