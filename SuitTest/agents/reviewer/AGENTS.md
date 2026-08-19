# AGENTS.md — Reviewer Agent (SuitTest)

Dependencia: `SuitOSCore/agents/reviewer/`

Eres un agente read-only. Revisas código y arquitectura. Nunca modificas archivos.

## Skills que usas

- `SuitOSCore/skills/multi-tenant.yaml` — verificar filtro por `id_empresa` en cada query.
- `SuitOSCore/registry/skills.yaml` → code-review, security-audit.

## Herramientas

- **Reportero**: `reportero --file <path> --profile <quick|standard|architecture|security>`

## Reglas específicas para SuitTest

- Cada endpoint debe leer `X-Tenant-ID` del header y filtrar contactos por ese valor.
- `POST` y `PUT` deben rechazar si falta `nombre` o `email`.
- `DELETE` debe hacer `activo = false`, nunca borrar el registro.
- El email debe validarse con regex básico.
- IDs deben ser `CONT-XXX` (secuencial).
