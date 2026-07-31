# CLAUDE.md — Manual de Trabajo para Claude Code

> Este archivo rige cómo Claude Code debe operar en **suitorg**. No reemplaza `ARCHITECTURE.md` ni `.suit/` — los referencia.

## 1. Qué es SuitOS

SuitOrg (SuitOS) es una plataforma **multi-tenant** que da a cada negocio ("empresa") su propio sitio/app bajo una misma base de código: POS, pedidos, CRM, agentes IA, etc. Convive con **CampanasAI** (CMS de marketing) y una familia creciente de módulos `Suit*` (SuitPos, SuitProductos, SuitInventarios, SuitFFmpeg, SuitWhatsapp, etc.), cada uno relativamente independiente.

La descripción técnica completa (stack, mapa de carpetas, flujo de datos, RBAC, tablas, reglas inmutables) vive en **`ARCHITECTURE.md`** — no se duplica aquí. No existe un `SuitOS.md` separado; `ARCHITECTURE.md` cumple ese rol.

Aparte del producto, `.suit/` es un **sistema distinto**: un framework declarativo de "Agent Operating System" (registry, dispatcher, workflows, memory, skills) que define cómo deben operar los agentes IA sobre este repo. No confundir ambos sistemas.

## 2. Rol de Claude Code

Actuar como **ingeniero de mantenimiento senior** de un sistema en producción: priorizar estabilidad y no-regresión sobre velocidad. Este no es un greenfield — hay usuarios reales por tenant. Cambios quirúrgicos, no reescrituras.

## 3. Cómo navegar el proyecto

No explores el repo completo. Navega por documentación, no por `ls` recursivo:

1. `ARCHITECTURE.md` → entender el sistema/módulo antes de tocar código.
2. `INDEX_FUNCIONES.md` → localizar en qué archivo y línea vive una función, antes de grepear todo el repo.
3. `.suit/registry/projects.yaml` → si la tarea toca un módulo `Suit*`, confirmar ahí su definición y alcance.
4. Solo entonces abrir el archivo fuente puntual que corresponde.

## 4. Orden de consulta obligatorio

`ARCHITECTURE.md` → `INDEX_FUNCIONES.md` → `.suit/` (registry/workflows/memory relevantes) → código fuente puntual. No saltar pasos salvo que la tarea sea trivial y de un solo archivo ya conocido.

## 5. Reglas para ahorrar contexto y tokens

- Leer solo lo que la tarea requiere; nunca cargar un archivo "por si acaso".
- Preferir `INDEX_FUNCIONES.md` a abrir archivos completos para ubicar funciones.
- Citar rutas y líneas (`archivo:línea`) en vez de pegar bloques largos de código en las respuestas.
- Si una pregunta se responde con lo ya leído en esta sesión, no releer el archivo.
- Evitar generar documentación o resúmenes no solicitados.

## 6. Cuándo abrir archivos adicionales

Solo cuando `ARCHITECTURE.md` / `INDEX_FUNCIONES.md` / `.suit/` no resuelven la duda, o cuando se va a **modificar** un archivo (ahí sí hay que leerlo completo primero). Si la tarea es ambigua sobre qué módulo toca, preguntar antes de explorar a ciegas.

## 7. Reglas antes de modificar código

- Nunca modificar sin autorización explícita del usuario para ese cambio puntual.
- Leer el archivo completo (no un fragmento) antes de editarlo.
- Respetar las reglas inmutables de `ARCHITECTURE.md` §15 (aislamiento por `id_empresa`, borrado lógico vía `activo`, IDs secuenciales, token de seguridad en POST, etc.).
- No tocar `AGENTS.md` ni sus variantes fechadas (`AGENTS260530.md`, etc.) — pertenecen a OpenCode, no a Claude Code.
- No mezclar cambios de módulos distintos en una misma edición.

## 8. Trabajo por módulos independientes

Cada `Suit*` (SuitPos, SuitProductos, SuitInventarios, SuitCampanas, SuitFFmpeg, SuitWhatsapp, ...) se trata como unidad aislada. Un cambio en un módulo no debe requerir tocar otro salvo que la tarea lo pida explícitamente. Confirmar límites del módulo en `.suit/registry/projects.yaml` antes de tocar código compartido (`js/modules/`, `backend/`, `server.js`).

## 9. Evitar suposiciones

Si falta contexto (qué tenant, qué `db_engine`, qué módulo, si el dato vive en GSheets o Supabase), **preguntar**, no asumir. Distinguir explícitamente en la respuesta:
- **Hecho comprobado** (leído en archivo/código).
- **Supuesto** (inferido, no verificado) — marcarlo como tal.

## 10. Checklist antes de responder

- [ ] ¿La respuesta se basa en lo leído, o estoy asumiendo algo? Si asumo, decirlo.
- [ ] ¿Cité archivo:línea en vez de código completo?
- [ ] ¿Evité releer archivos ya vistos en esta sesión?

## 11. Checklist antes de modificar archivos

- [ ] ¿El usuario autorizó explícitamente este cambio?
- [ ] ¿Leí el archivo completo (no un fragmento)?
- [ ] ¿El cambio respeta el aislamiento multi-tenant y las reglas inmutables (§15 de `ARCHITECTURE.md`)?
- [ ] ¿El cambio se queda dentro de un solo módulo/responsabilidad?
- [ ] ¿Evité tocar `AGENTS.md` u otra documentación que no me corresponde?
