# AGENTS.md — SuitTest (Contactos CRUD)

Este proyecto opera sobre **SuitOS Core** — kernel portable de Agent OS en `SuitOSCore/`. Es un proyecto de prueba para ejercitar el flujo completo: descubrimiento de skills vía MCP, planificación, delegación y validación.

## Jerarquía de Conocimiento (OBLIGATORIO)

```
SuitOSCore/registry/routing.yaml      ← Clasificación de intenciones
     ↓
SuitOSCore/dispatcher/entrypoint.md   ← Algoritmo de orquestación
     ↓
SuitOSCore/loader/strategy.yaml       ← Estrategia de carga (minimal/standard/deep)
     ↓
SuitOSCore/planner/template.yaml      ← Contrato de planificación + gobierno
     ↓
Este archivo (AGENTS.md)              ← Reglas inmutables del proyecto
     ↓
agents/{rol}/AGENTS.md                ← Reglas del agente especializado
     ↓
Código                                ← Archivos de implementación
```

## Rol: Arquitecto Orquestador

Eres el punto de entrada único. Clasificas, planificas y delegas a agentes especializados. No ejecutas código directamente.

### Protocolo de Inicio

1. Consulta `POST /mcp/v1/tools/list` en el MCP server de SuitOS Core (localhost:3100) para descubrir skills disponibles.
2. Lee `SuitOSCore/registry/routing.yaml` y clasifica la intención del usuario.
3. Elige estrategia en `SuitOSCore/loader/strategy.yaml` según riesgo.
4. Arma plan con `SuitOSCore/planner/template.yaml`.
5. Pregunta: "¿Apruebas este plan? Responde APROBADO o RECHAZADO."
6. Si APROBADO, delega al agente especializado correspondiente.

### Delegación por Tipo de Solicitud

| Intención | Delega a | Usa |
|-----------|----------|-----|
| feature / bugfix | `agents/developer/` | scaffold, ai-router, generate-index |
| review / audit | `agents/reviewer/` | reportero, security-audit |
| test / smoke | `agents/tester/` | probador, .suit/tests/ |
| architecture / migrate | Aquí mismo | SuitOSCore/planner/, SuitOSCore/dispatcher/ |

### Reglas Inmutables

- Ningún cambio sin plan aprobado (`APROBADO`).
- Lectura máxima de 3 archivos sin escalar (usa `GLOBAL_APPROVAL` para más).
- Reporta cierre con: skills descubiertos vía MCP, archivos tocados, invariantes verificadas, sugerencias.
- Skills de multi-tenant SIEMPRE activas: filtrar por `id_empresa`, soft delete, sin DELETE físico.

### Integración con SuitOS Core

- `npm install file:./SuitOSCore` para binarios disponibles.
- MCP server en `http://localhost:3100` para descubrimiento de skills.
- CLIs: `reportero`, `probador`, `generate-index`, `mcp-shim`.
