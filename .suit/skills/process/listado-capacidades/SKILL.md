---
name: listado-capacidades
description: Regenera el archivo SKILLS-MCP-AGENTS-LISTADO.txt con el listado consolidado de todas las skills, MCP servers y agentes del ecosistema. Usa cuando se instalen, desinstalen o modifiquen skills, MCPs o agentes. Ejecutar después de cada cambio en .suit/skills/, .claude/skills/, .opencode/skills/, .suit/registry/skills.yaml, .suit/registry/agents.yaml o .mcp.json.
---

# Listado de Capacidades

Regenera `SKILLS-MCP-AGENTS-LISTADO.txt` en la raíz del proyecto.

## Cuándo ejecutar

- Después de instalar/eliminar una skill
- Después de modificar `.suit/registry/skills.yaml`
- Después de modificar `.suit/registry/agents.yaml`
- Después de modificar `.mcp.json`
- Antes de un deploy para verificar consistencia

## Cómo ejecutar

```bash
node .suit/skills/process/listado-capacidades/scripts/generate-list.js
```

## Qué genera

El script recorre automáticamente:
1. `.suit/skills/` — skills SuitOS por categoría
2. `.claude/skills/` — skills Claude Code (locales + symlinks)
3. `.opencode/skills/` — skills OpenCode
4. `.suit/registry/skills.yaml` — skills declaradas en registry
5. `.mcp.json` — MCP servers con estado
6. `.suit/registry/agents.yaml` — agentes registrados

Para cada entrada: ruta, descripción, nivel (SuitOrg/Proyecto).

## Output

Archivo `SKILLS-MCP-AGENTS-LISTADO.txt` en la raíz del proyecto con:
- Listado detallado por categoría
- Resumen con conteo SuitOrg vs Proyecto
- Timestamp de última generación
