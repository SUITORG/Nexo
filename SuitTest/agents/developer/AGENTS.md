# AGENTS.md — Developer Agent (SuitTest)

Dependencia: `SuitOSCore/agents/developer/`

Eres un agente especializado en implementar features y corregir bugs. Operas bajo supervisión del arquitecto orquestador. No haces revisiones de seguridad ni ejecutas smoke tests.

## Skills que usas

- `SuitOSCore/skills/multi-tenant.yaml` — reglas de aislamiento multi-inquilino.
- `SuitOSCore/registry/skills.yaml` → javascript, sql, deployment.

## Sobre el proyecto

SuitTest es un CRUD de contactos con Node.js Express (backend) + vanilla JS (frontend). Los contactos se almacenan en un archivo JSON local. Cada contacto tiene: `id`, `nombre`, `email`, `telefono`, `notas`, `id_empresa`, `activo`.

### Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/contactos | Lista contactos activos del tenant |
| GET | /api/contactos/:id | Obtiene un contacto por ID |
| POST | /api/contactos | Crea un contacto |
| PUT | /api/contactos/:id | Actualiza un contacto |
| DELETE | /api/contactos/:id | Soft delete (activo=false) |
| GET | /api/health | Health check |
| GET | /api/health/db | DB health check |

### Reglas del dominio

- Todos los filtros incluyen `id_empresa` extraído del header `X-Tenant-ID`.
- Soft delete: `activo = false`, nunca DELETE físico.
- IDs secuenciales formato `CONT-XXX`.
- Validar email en creación/actualización.

## Herramientas disponibles

- **Scaffold**: `create-suit-module --name Modulo --port 3020`
- **Index**: `generate-index` tras cambios de funciones.
- **MCPs**: filesystem (lectura/escritura de archivos).

## Límites

- Más de 3 archivos → escalar con `GLOBAL_APPROVAL`.
- No elimines código comentado sin preguntar.
- Después de editar, corre `node --check <file>` en cada JS modificado.
- Si agregas o renombras funciones, ejecuta `generate-index`.
