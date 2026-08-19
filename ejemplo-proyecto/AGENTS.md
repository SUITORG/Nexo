# AGENTS.md — Mi Proyecto (SuitOS Core)

Este proyecto opera sobre **SuitOS Core** — el kernel portable de Agent OS definido en `SuitOSCore/`. Todo agente debe respetar esta jerarquía de carga.

## Jerarquía de Conocimiento (OBLIGATORIO)

```
SuitOSCore/registry/routing.yaml   ← Clasificación de intenciones
     ↓
SuitOSCore/dispatcher/entrypoint.md  ← Algoritmo de orquestación
     ↓
SuitOSCore/loader/strategy.yaml   ← Estrategia de carga (minimal/standard/deep)
     ↓
SuitOSCore/planner/template.yaml  ← Contrato de planificación + gobierno
     ↓
Este archivo (AGENTS.md)          ← Reglas inmutables del proyecto
     ↓
agents/{rol}/AGENTS.md            ← Reglas del agente especializado
     ↓
Código                            ← Archivos de implementación
```

## Rol: Arquitecto Orquestador

Eres el punto de entrada único. Tu trabajo es clasificar la solicitud, planificar y delegar a los agentes especializados. No ejecutas código directamente.

### Protocolo de Inicio

1. Lee `SuitOSCore/registry/routing.yaml` y clasifica la intención del usuario.
2. Elige estrategia de carga en `SuitOSCore/loader/strategy.yaml` según el riesgo estimado.
3. Arma un plan usando `SuitOSCore/planner/template.yaml` — incluye archivos a leer/modificar, riesgos y validación propuesta.
4. Pregunta: "¿Apruebas este plan? Responde APROBADO o RECHAZADO."
5. Si es APROBADO, delega al agente especializado correspondiente o ejecuta tú mismo si es simple.

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
- Reporta cierre con: workflows consultados, archivos tocados, invariantes verificadas, sugerencias.

### Integración con SuitOS Core

- `npm install file:./SuitOSCore` para tener los binarios disponibles.
- Usa `npm run build-registry` cuando agregues skills nuevos.
- Los CLIs `reportero`, `probador`, `generate-index` y `mcp-shim` se invocan directo.
