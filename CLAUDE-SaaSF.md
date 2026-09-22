# miniClaude.md — Específico de Claude Code

@AGENTS.md

Todo el contexto general del repositorio vive en `AGENTS.md` (importado arriba).
Aquí queda solo lo que es propio de Claude Code y que se eliminó al portar el
contenido a un formato neutro para otros agentes.

## Frontmatter de skills: campos exclusivos de Claude Code

`AGENTS.md` describe la anatomía genérica de un skill. Estos tres campos solo los
interpreta Claude Code:

```yaml
---
name: skill-name
description: Qué hace y cuándo activarlo
argument-hint: "[argumento]"      # Hint en el autocomplete de Claude Code
user-invocable: false             # Solo Claude puede invocarlo, no el usuario
context: fork                     # Se ejecuta en un subagent aislado
allowed-tools: Read, Write, Bash  # Tools permitidos sin pedir permiso
---
```

Los 7 skills de rol (`backend`, `frontend`, `supabase-admin`, `codebase-analyst`,
`vercel-deployer`, `documentacion`, `calidad`) son los antiguos agents de V3 y
dependen de `user-invocable: false` + `context: fork` para comportarse como
subagentes. En otro harness que no lea esos campos se activarán como skills
normales, en el contexto principal.

## Invocación con slash commands

En Claude Code los skills se llaman con `/`:

```
/new-app   /landing   /ai [template]   /memory-manager   /image-generation   /autoresearch
```

En `AGENTS.md` los mismos skills se listan sin `/` porque otros agentes los
activan por descripción, no por comando.

## Auto-memory

`memory-manager` reemplaza la auto-memory nativa de Claude Code: la memoria pasa de
`~/.claude/` al repo en `.claude/memory/`. **La primera activación deshabilita la
auto-memory en `.claude/settings.json`** — este paso es exclusivo de Claude Code y
no aplica a ningún otro agente.

## Rutas y archivos ligados a Claude Code

- `.claude/` — carpeta de configuración propia de Claude Code (skills, memory, PRPs,
  design-systems). Otros agentes leen su contenido como archivos normales.
- `.claude/settings.json` — permisos y flags de Claude Code.
- `saas-factory/CLAUDE.md` — Factory OS, el cerebro del agente en cada proyecto
  generado. Es el archivo que Claude Code carga al abrir un proyecto ya creado.
- `saas-factory/GEMINI.md` — espejo del anterior para Gemini.
- El paso 4 del workflow de instalación, en Claude Code, es literalmente `claude .`

## Nota de mantenimiento

Regla para no duplicar verdades: cualquier cambio de contenido va en `AGENTS.md`.
Este archivo solo crece con detalles que **únicamente** entiende Claude Code.
Si migras `saas-factory/CLAUDE.md` (el Factory OS) al mismo esquema, haz lo propio:
un `AGENTS.md` con el cerebro completo y un `CLAUDE.md` mínimo que lo importe.
