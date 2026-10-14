---
name: durabilidad
description: "Gate de pre-diseño para futuro: juzga si la app/proceso que va a crearse DURARÁ — que sea confiable, de fácil uso (para el usuario final y para el dueño), entendible, y que se pueda conectar después a otras funciones sin rehacerla. Úsala SIEMPRE antes de diseñar cuando el usuario diga 'que tenga futuro', 'que sea escalable', 'que después se le pueda conectar X', 'que dure', 'fácil de mantener', 'que se entienda', o al decidir arquitectura/stack de un proyecto nuevo. Va ANTES del diseño junto con viabilidad-operativa y calidad-minima. Entrega veredicto de durabilidad + decisiones de diseño que garantizan la conexión futura en ≤1 página."
---

# Durabilidad — gate de futuro (3 de 3)

Apps que "funcionan hoy" y en 3 meses son un cementerio: nadie las entiende, nadie las toca, no se les puede agregar nada. Esta skill obliga a decidir **antes del diseño** las condiciones para que lo que se construya siga vivo y crecible. Compañeras de gate: `viabilidad-operativa` (¿es viable?) y `calidad-minima` (¿merece existir?). Solo lectura.

## Las 5 condiciones de durabilidad

### 1. Fácil de conectar después (extensibilidad)
- ¿Los datos tienen **nombre claro y estructura tabular** (columnas con propósito), o quedaron metidos en un JSON desordenado que nadie leerá después?
- ¿Las funciones hacen **una cosa cada una**, con nombre que describe qué hace (`enviarRecordatorio()`, no `proc2()`)?
- ¿Hay **puntos de conexión naturales**: endpoints/rutas estándar, eventos, o campos que una función futura podría leer sin tocar el código existente?
- Test concreto: *"Si mañana quiero agregar [función X], ¿tengo que reescribir 3 cosas o solo agregar 1?"* — si es lo segundo, pasa.
- Si el proyecto apunta a ser módulo Suit*, debe cumplir el patrón estándar de AGENTS.md (carpeta + index.js que exporta app + puerto único + registry) — eso ES la extensibilidad del ecosistema.

### 2. Confiable (no se rompe sola)
- ¿Todo lo que el usuario escribe se **valida** antes de tocar datos? (formatos, montos, fechas, campos vacíos)
- ¿Si un servicio externo falla, hay **mensaje claro y reintento** — no pantalla en blanco ni error crudo?
- ¿Los datos importantes se pueden **recuperar** (backup/respaldo, soft delete en vez de DELETE físico)?
- ¿El proceso principal es **idempotente** o al menos no duplica daño si se ejecuta 2 veces?

### 3. Fácil de usar (doble audiencia)
- **Usuario final**: termina su tarea principal sin ayuda en el primer intento (≤3 pasos si es posible); si se equivoca, el sistema lo dice con palabras humanas y le da la vuelta.
- **Tú (dueño)**: hay una sola forma obvia de hacer cada cosa (no 3 rutas escondidas); la configuración vive en un solo lugar; los `.bat`/comandos de arranque funcionan copy-paste.

### 4. Entendible (no requiere ser su autor)
- Alguien (tú en 3 meses, otro agente, otro dev) debe poder entender el proyecto con: `AGENTS.md`/`README` de arranque, `INDEX_FUNCIONES.md` (dónde está cada función), y nombres de archivos/funciones autoexplicativos.
- Las decisiones importantes quedan registradas como ADR en `.suit/memory/decisions/` — no solo en el chat.
- Si explicar el proyecto toma más de 5 frases, sobra complejidad: documentar o eliminar.

### 5. Que dure contra el cambio
- ¿Depende de librerías/servicios **mantenidos** y de modos no-oficiales que puedan suspenderse (ver `viabilidad-operativa` pregunta 4)?
- ¿Versiones fijadas donde importa (package.json con versiones, no `latest` en producción)?
- ¿Separa lo que cambia seguido (copy, precios, flags) de lo que no (lógica) — preferiblemente en config/DB, no enterrado en código?

## Salida (estructura fija, ≤1 página)

```markdown
## Veredicto de durabilidad: [DURA | DURA CON CONDICIONES | FRÁGIL]

| Condición | Estado (✔ / ~ / ✘) | Nota (1 línea) |
|---|---|---|
| 1. Conextensible después | | |
| 2. Confiable | | |
| 3. Fácil de usar | | |
| 4. Entendible | | |
| 5. Resiste el cambio | | |

**Decisiones de diseño que garantizan el futuro** (3-5 bullets concretos que pasan al
CONTRATO.md / arquitectura, ej: "cada módulo = endpoint REST estándar", "flags en config,
no en código", "respaldo diario automático")

**Test de conexión futura**: para la función X que podría agregarse después, costaría [agregar 1 archivo / rehacer N cosas].

**Condiciones** (si DURA CON CONDICIONES): qué cerrar.
```

## Reglas

- du-001: las "decisiones de diseño que garantizan el futuro" se adjuntan como requisitos al diseño — esta skill existe para que no se decidan tarde.
- du-002: FRÁGIL no mata el proyecto: lista el camino para estabilizarlo.
- du-003: máximo 3 preguntas al usuario (o 0 con `decision_libre=true`, supuestos documentados).
- du-004: esta skill juzga ANTES de diseñar; para auditar durabilidad de código YA existente, combinar con `mejoras-proyecto` o `auditoria`.
