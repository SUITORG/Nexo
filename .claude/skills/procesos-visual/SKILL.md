---
name: procesos-visual
description: "Genera mapas de proceso visuales en HTML (diagrama de flujo ligero en CSS, sin imágenes embebidas) a partir de los MANUAL_*.md de un proyecto — un HTML por rol en <Proyecto>/docs/procesos/. Úsala cuando el usuario diga 'mapa de proceso', 'diagrama de flujo', 'proceso visual', 'flujo por rol', 'haz el diagrama', o al cerrar la etapa de manuales de guia-total. Requiere que existan los manuales del rol. Autocontenido: se abre con doble click, sin servidor."
---

# Procesos visuales — mapas de flujo por rol (1 HTML por rol)

Convierte el "Diagrama de Flujo" (ASCII) de cada `MANUAL_*.md` en un HTML visual que el usuario abre con doble click. Un archivo por rol en `<Proyecto>/docs/procesos/PROCESO_<ROL>.html`. Solo lectura del manual; escribe solo esos HTML.

## Cuándo se ejecuta

- `guia-total` modo manuales → tras crear/actualizar `MANUAL_*.md`, regenerar el HTML del rol afectado.
- Petición directa: "mapa de proceso de X", "diagrama de flujo del cliente", etc.
- Proyecto nuevo en F5: generar todos los roles de una vez.

## Paso a paso

1. Detectar roles: archivos `docs/MANUAL_*.md` (CLIENTE, PROVEEDOR, TECNICO, PRUEBAS…). El rol del nombre del manual = nombre del HTML.
2. Extraer de cada manual: el §"Diagrama de Flujo" (nodos y conexiones), §"Resumen de Estados" si existe, y los pasos numerados de cada sección (texto de cada caja = título corto + 1 línea).
3. Escribir `<Proyecto>/docs/procesos/PROCESO_<ROL>.html` con la plantilla base (`GuiaTotal/plantillas/proceso-rol.html`).
4. Mantener 1:1 con el manual: si cambia un paso en el manual, se regenera el HTML (el HTML nunca es fuente de verdad).

## Plantilla (estructura del HTML)

- **Autocontenido**: `<style>` inline, cero JS, cero imágenes externas, `lang="es"`.
- **Nodo** = caja blanca redondeada con número de paso + título + 1 línea de detalle.
- **Flecha** = `↓` CSS entre nodos (no SVG).
- **Decisión** = caja con borbre ámbar `¿...?` con 2 ramas etiquetadas (`Sí →`, `No →`).
- **Estado/result** = caja verde/azul con el resultado (ej. "Fondos liberados 85%").
- **Nota importante** = banda gris con ⚠ (ej. "No compartas el PIN antes de tiempo").
- Cabecera: nombre del proyecto, rol, fecha, y `Fuente: docs/MANUAL_<ROL>.md` — el manual manda.
- Máx ~15 nodos por mapa; si el manual tiene más, agrupar pasos (el mapa es resumen visual, no el manual).

## Reglas

- pv-001: el HTML es **derivado** — nunca editar el HTML para cambiar el proceso; se cambia el manual y se regenera.
- pv-002: sin imágenes embebidas ni SVG: solo HTML+CSS (liviano, abre en cualquier lado, git-diff limpio).
- pv-003: si falta el manual del rol, no se inventa el flujo — primero crear/editar el `MANUAL_*.md`.
- pv-004: contenido textual idéntico al manual (mismos estados, mismos montos/PIN) — nada de texto nuevo no documentado.
