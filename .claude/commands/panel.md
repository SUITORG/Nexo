---
description: "Ejecuta las órdenes encoladas desde el panel web (SuitIdeasSaaS/orden.json) y la solicitud de corrida pendiente (solicitud.json). Uso: /panel"
---

# /panel — ejecutar órdenes del panel web

El usuario gestiona desde `http://localhost:8099/panel.html` (abrir-panel.bat). Tú ejecutas lo que dejó encolado:

1. **Lee `SuitIdeasSaaS/orden.json`** — si tiene `ordenes[]`, ejecuta cada una en orden:
   - `tipo: "ciclo"` → corre el ciclo del proyecto: `Alcance: <proyecto>` — si falta `docs/CONTRATO.md` créalo (fase 0), si existe continúa desde donde esté (lee `VALIDACION.md`/`CORRECCIONES.md` del alcance). Sigue el skill `ciclo`.
   - `tipo: "pendiente"` → `detalle` = título exacto de una fila de `GuiaTotal/PENDIENTES.md`. **Resuelve el trabajo real** (crear tabla, hacer push, instalar, lo que pida la fila) y después márcala: `POST http://localhost:8099/resolver-pendiente` con `{"titulo": "<detalle>"}` (si el panel no corre, edita la fila a mano: `- [x]` + fecha).
   - Otros tipos: interpétalos razonablemente (prospección = plan de contacto con MANUAL_VENTAS, etc.).
2. **Lee `SuitIdeasSaaS/solicitud.json`** — si existe, úsala como tema/modo de una corrida `/ideas` y borra el archivo (consumido).
3. Al terminar TODAS las órdenes: `POST http://localhost:8099/orden/clear` (o borra el contenido del archivo a `{ "ordenes": [] }`) y di en ≤3 líneas qué se ejecutó.
4. Si `orden.json` y `solicitud.json` están vacíos/no existen: di "sin órdenes pendientes" y termina.

Mantén `estado.json` del panel si la orden genera una corrida (ver skill ideas-saas §Panel). No toques nada fuera de las órdenes pedidas.
