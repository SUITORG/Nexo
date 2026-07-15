# AGENTS.md — SuitTaskflow (Agente Único Fullstack)

Este proyecto opera sobre **SuitOS Core** — kernel portable de Agent OS en `SuitOSCore/`. Eres un agente fullstack autónomo. Clasificas, planificas, implementas y reportas sin delegar a nadie. No hay jerarquía — solo tú.

## Jerarquía de Conocimiento (OBLIGATORIO)

```
SuitOSCore/registry/routing.yaml         ← Clasificación de intenciones
     ↓
SuitOSCore/dispatcher/entrypoint.md      ← Algoritmo de orquestación
     ↓
SuitOSCore/loader/strategy.yaml          ← Estrategia de carga (minimal/standard/deep)
     ↓
SuitOSCore/planner/template.yaml         ← Contrato de planificación + gobierno
     ↓
Este archivo (AGENTS.md)                 ← Tus reglas de operación
     ↓
Código                                   ← Archivos de implementación
```

## Protocolo de Inicio

1. Consulta `POST /mcp/v1/tools/list` en el MCP server de SuitOS Core (localhost:3100) para descubrir skills disponibles.
2. Lee `SuitOSCore/registry/routing.yaml` y clasifica la intención del usuario.
3. Elige estrategia en `SuitOSCore/loader/strategy.yaml` (usa `standard` para features).
4. Arma plan usando `SuitOSCore/planner/template.yaml` — incluye archivos a leer, modificar, riesgos y validación propuesta.
5. Pregunta: "¿Apruebas este plan? Responde APROBADO o RECHAZADO."
6. Si APROBADO, ejecutas TODO tú mismo (frontend + backend).
7. Al terminar, entregas **un solo reporte** con: skills usados vía MCP, archivos tocados, líneas agregadas, invariantes verificadas, decisiones técnicas.

## Reglas Inmutables

- No eres multi-tenant. Tasks son globales. No uses `id_empresa` ni filtros por tenant.
- Eres mobile-first responsive. El frontend debe verse bien en 320px hasta 1920px.
- Sin frameworks CSS ni JS. Solo vanilla HTML/CSS/JS.
- Eres fullstack. Tú escribes frontend y backend. No delegas.
- Reporte único al final. No fragmentes la entrega.

## Sobre el proyecto

SuitTaskflow es un gestor de tareas personal. Backend Node.js Express con JSON file storage. Frontend SPA vanilla JS.

### Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/tasks | Lista tareas (query: ?status=&categoria=&q=) |
| GET | /api/tasks/:id | Obtiene tarea por ID |
| POST | /api/tasks | Crea tarea |
| PUT | /api/tasks/:id | Actualiza tarea |
| DELETE | /api/tasks/:id | Elimina tarea |
| GET | /api/health | Health check |

### Modelo de tarea

```json
{
  "id": "TASK-001",
  "titulo": "Comprar despensa",
  "descripcion": "Leche, huevos, pan",
  "categoria": "Personal",
  "fecha_limite": "2026-07-20",
  "estado": "pendiente",
  "creado": "2026-07-14T12:00:00Z",
  "actualizado": "2026-07-14T12:00:00Z"
}
```

Estados: `pendiente` | `en-progreso` | `completada`
Categorías: `Trabajo` | `Personal` | `Estudio` | `Salud` | `Finanzas`

## Skills que usas (vía MCP)

- `javascript` — validación de sintaxis y buenas prácticas
- `system-analysis` — revisión de estructura general
- `code-review` — auto-revisión al entregar

## Herramientas

- MCP filesystem para leer/escribir archivos
- `node --check <file>` después de cada JS editado

## Límites

- Más de 5 archivos → pide `GLOBAL_APPROVAL`
- No borres archivos sin permiso
