---
description: "Ejecuta las órdenes encoladas desde el panel web (SuitIdeasSaaS/orden.json) y la solicitud de corrida pendiente (solicitud.json). Uso: /panel"
---

# /panel — ejecutar órdenes del panel web

El usuario gestiona desde `http://localhost:8099/panel.html` (abrir-panel.bat). Tú ejecutas lo que dejó encolado:

1. **Lee `SuitIdeasSaaS/orden.json`** — si tiene `ordenes[]`, ejecuta cada una en orden:
   - `tipo: "ciclo"` → corre el ciclo del proyecto: `Alcance: <proyecto>` — si falta `docs/CONTRATO.md` créalo (fase 0), si existe continúa desde donde esté (lee `VALIDACION.md`/`CORRECCIONES.md` del alcance). Sigue el skill `ciclo`.
   - `tipo: "fase"` → `proyecto` + `detalle` describen la siguiente fase de producto (ver `GuiaTotal/FASES-PRODUCTO.md`). Ejecuta el trabajo de esa fase para ese proyecto (Fase 5 = login+dashboard; Fase 4 = 4G: brief/activos/landing; etc.), sigue el workflow que corresponda (`ciclo`, plantillas RUCP) y al terminar actualiza `fase_producto` en `GuiaTotal/registro/<slug>.yaml` (+ commit). 
   - `tipo: "pendiente"` → `detalle` = título exacto de una fila de `GuiaTotal/PENDIENTES.md`. **Resuelve el trabajo real** (crear tabla, hacer push, instalar, lo que pida la fila) y después márcala: `POST http://localhost:8099/resolver-pendiente` con `{"titulo": "<detalle>"}` (si el panel no corre, edita la fila a mano: `- [x]` + fecha).
   - Otros tipos: interpétalos razonablemente (prospección = plan de contacto con MANUAL_VENTAS, etc.).
2. **Lee `SuitIdeasSaaS/solicitud.json`** — si existe, úsala como tema/modo de una corrida `/ideas` y borra el archivo (consumido).
3. Al terminar TODAS las órdenes: `POST http://localhost:8099/orden/clear` (o borra el contenido del archivo a `{ "ordenes": [] }`) y di en ≤3 líneas qué se ejecutó.
4. Si `orden.json` y `solicitud.json` están vacíos/no existen: di "sin órdenes pendientes" y termina.

**Monitoreo (obligatorio para TODA orden, no solo corridas):** al empezar una orden escribe `SuitIdeasSaaS/estado.json` con `fase` actual, `fases[]` (si es ciclo: f1-f7; si es fase de producto: las fases de `FASES-PRODUCTO.md`), `log[]` con el paso en curso y `herramientas[]`; al cambiar de paso actualízalo; al terminar deja `fase: "fin"` + resumen. El panel web (poll 2s) lo muestra en vivo sin que el usuario pida nada.

Mantén `estado.json` del panel si la orden genera una corrida (ver skill ideas-saas §Panel). No toques nada fuera de las órdenes pedidas.
