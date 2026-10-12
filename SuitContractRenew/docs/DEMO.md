# DEMO — ContractRenew (guión para el cliente)

**Para qué sirve:** demostración en vivo de 5-10 min para un taller HVAC (o plomería/eléctrica) con contratos de mantenimiento.
**Audiencia:** quien vende (dueño SuitOrg / comercial) — el cliente solo mira y pregunta.
**Preparación previa (2 min):** `abrir.bat` corriendo · 3 contratos de ejemplo cargados · pestaña landing abierta en otra pestaña.

## Guión

### 1. Abre con el dolor (1 min)
> "¿Cuántos contratos de mantenimiento activos tienes y cuándo vence cada uno? ¿Y la última vez que un cliente no renovó porque nadie le avisó?"

Deja que responda. No toques la computadora todavía.

### 2. Muestra la landing (1 min)
Pestaña `localhost:3017` — señala el slogan ("Nunca más se te pase una renovación"), el precio ($29/mes = $0.97/día) y el form.
> "Esto es lo que vería tu cliente si te lo recomienda."

### 3. Demo en vivo — los 3 momentos (4 min)
Cambia a la pestaña de la API (o un cliente REST) y muestra:

1. **Alta:** `POST /api/contracts` con un cliente real del taller → "Listo, contrato cargado".
2. **El reporte:** `GET /api/contracts/due/60` → "Estos vencen en los próximos 60 días — esto es lo que hoy no ves en tu carpeta".
3. **Cierre:** `POST /api/contracts/:id/close` → "Cuando renueva, se cierra y entra el siguiente".

### 4. Cierra con el número (1 min)
> "Un contrato perdido son $600-2,000 al año. Dos renovaciones recuperadas y el sistema ya se pagó un año entero."

### 5. Siguiente paso (1 min)
> "Te lo dejo cargado con tus 3 contratos reales esta semana. ¿Prefieres que empiece por los que vencen primero o por todos?"

## Objeciones típicas → respuesta (reusa MANUAL_VENTAS)
| Objeción | Respuesta |
|---|---|
| "Lo tengo en Excel" | Excel no le avisa. El aviso es el producto. |
| "Muy caro" | $0.97/día; un contrato perdido = $600-2,000/año. |
| "Somos muy pocos" | Justamente para eso: los grandes ya tienen su sistema. |

## Qué NO hacer en la demo
- No prometer cobro automático, SMS ni email (fuera del MVP).
- No mostrar código ni la ventana de la consola técnica.
- No comparar por nombre con ServiceTitan en la conversación (solo si él lo menciona: "$200-500/mes, hecho para operaciones grandes").
