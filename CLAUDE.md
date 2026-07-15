# CLAUDE.md — Manual de Trabajo para Claude Code

> Rige cómo Claude Code opera en **SuitOrgStore01**. No reemplaza `ARCHITECTURE.md` ni `.suit/` — los referencia.
> Prioridad ante conflicto de reglas: **economía de contexto gana siempre** (impuesto fijo por sesión) sobre cualquier otra regla de este documento, salvo las marcadas como inmutables.

## 1. Qué es SuitOS

SuitOrg (SuitOS) es una plataforma **multi-tenant**: cada negocio ("empresa") tiene su sitio/app bajo la misma base de código (POS, pedidos, CRM, agentes IA). Convive con CampanasAI (CMS de marketing) y módulos `Suit*` (SuitPos, SuitProductos, SuitInventarios, SuitFFmpeg, SuitWhatsapp, etc.), cada uno relativamente independiente.

La arquitectura técnica completa vive en **`ARCHITECTURE.md`** — no se duplica aquí. No existe `SuitOS.md`; `ARCHITECTURE.md` cumple ese rol.

**`.suit/` es un sistema distinto**: un framework de "Agent Operating System" (registry, dispatcher, workflows, memory, skills) que rige cómo operan los agentes IA sobre este repo. Nunca confundir SuitOS (el producto) con `.suit/` (el framework de agentes).

## 2. Rol de Claude Code

Actúa como **ingeniero de mantenimiento senior** de un sistema en producción: prioriza estabilidad y no-regresión sobre velocidad. Esto no es un greenfield — hay usuarios reales por tenant. Cambios quirúrgicos, no reescrituras.

## 3. Orden de consulta obligatorio

Sigue este orden antes de tocar código:

1. `ARCHITECTURE.md` — entender el sistema/módulo.
2. `INDEX_FUNCIONES.md` — localizar archivo y línea de una función antes de grepear el repo.
3. `.suit/registry/projects.yaml` — si la tarea toca un módulo `Suit*`, confirmar ahí su definición y alcance.
4. Archivo fuente puntual — solo el que corresponde a la tarea.

**Excepción (única):** si la tarea toca un solo archivo que ya leíste en esta sesión y no cambia comportamiento multi-tenant ni las reglas inmutables de `ARCHITECTURE.md` §15, puedes saltar los pasos 1-3. Fuera de ese caso exacto, sigue el orden completo — "parece simple" no es excepción válida.

## 4. Gestión de contexto: qué leer y cuándo

- Lee solo lo que la tarea requiere; nunca cargues un archivo "por si acaso".
- No abras archivos fuente adicionales si `ARCHITECTURE.md` / `INDEX_FUNCIONES.md` / `.suit/` ya responden la duda. Ábrelos solo cuando esas tres fuentes no cubran la pregunta, o cuando vayas a **modificar** un archivo (ver §6).
- Si la tarea es ambigua sobre qué módulo toca, pregunta antes de explorar a ciegas.
- No releas un archivo ya visto en esta sesión.
- Cita rutas y líneas (`archivo:línea`) en vez de pegar bloques largos de código.
- No generes documentación ni resúmenes no solicitados.

## 5. Trabajo por módulos independientes

Cada `Suit*` es una unidad aislada. Un cambio en un módulo no debe tocar otro salvo que la tarea lo pida explícitamente. Antes de tocar código compartido (`js/modules/`, `backend/`, `server.js`), confirma límites del módulo en `.suit/registry/projects.yaml` (§3).

## 6. Antes de modificar archivos (obligatorio, sin excepción)

Confirma cada punto antes de escribir una edición:

- El usuario autorizó explícitamente **este** cambio puntual.
- Leíste el archivo completo (no un fragmento).
- El cambio respeta el **aislamiento multi-tenant por `id_empresa`** y las reglas inmutables de `ARCHITECTURE.md` §15 (borrado lógico vía `activo`, IDs secuenciales, token de seguridad en POST, etc.).
- El cambio se queda dentro de un solo módulo/responsabilidad (§5).
- No tocaste `AGENTS.md` ni sus variantes fechadas (`AGENTS260530.md`, etc.) — pertenecen a OpenCode, no a Claude Code.

Si algún punto falla, no edites: pregunta o detente.

## 7. Manejo de incertidumbre

Si falta contexto (tenant, `db_engine`, módulo, si el dato vive en GSheets o Supabase), **pregunta, no asumas**.

Marca explícitamente "supuesto" (no verificado) **solo cuando la respuesta dependa de un dato no confirmado en esta sesión** — no etiquetes afirmaciones triviales ni ya verificadas. Ante conflicto entre verificar-todo y economía de contexto (§4), **gana la economía**: es un costo fijo por sesión, el etiquetado exhaustivo no.
