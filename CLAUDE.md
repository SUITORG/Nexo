# SuitOS para Claude Code

Tienes SuitOS disponible. Usa estos slash commands:

| Comando | Función |
|---|---|
| `/suit-registry` | Consultar registry (agents, skills, workflows, projects, routing, etc.) |
| `/suit-plan` | Crear plan de ejecución con impacto, riesgo y rollback |
| `/suit-workflow` | Cargar workflow (feature, bugfix, audit, review, deploy) |
| `/suit-validate` | Correr validaciones (quick, standard, architecture, security) |
| `/suit-memory` | Escribir Architecture Decision Record (ADR) |
| `/suit-commit` | Git commit con formato SuitOS |
| `/suit-backup` | ZIP de respaldo |

## Flujo recomendado
```
/suit-plan → /suit-workflow → [codificar] → /suit-validate → /suit-commit
```

## Referencia rápida
- `.suit/registry/` — declarative knowledge base
- `.suit/workflows/` — process definitions
- `.suit/skills/` — reusable capability modules
- `.suit/reviewer/profiles.yaml` — validation profiles
- `.suit/memory/decisions/` — Architecture Decision Records
- `.suit/planner/template.yaml` — plan structure
