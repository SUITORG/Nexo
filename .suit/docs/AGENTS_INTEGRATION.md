# SuitOS — Agent Integration Guide

## How AI Agents Consume `.suit/`

SuitOS is tool-agnostic by design. Each AI coding tool connects differently:

## OpenCode

OpenCode reads AGENTS.md at session start. The root AGENTS.md now references `.suit/` as the primary architecture. The agent will:

1. Read `.suit/config/kernel.yaml` for system config
2. Read `.suit/ARCHITECTURE.md` for full design
3. Query `.suit/registry/routing.yaml` to classify requests
4. Load workflows from `.suit/workflows/` for execution
5. Validate via `.suit/reviewer/profiles.yaml`
6. Record decisions in `.suit/memory/decisions/`

No additional configuration needed — the AGENTS.md update is sufficient.

## Claude Code

Claude Code reads `.claude/` directory. To integrate:

1. Create `.claude/suitos-preamble.md` referencing `.suit/ARCHITECTURE.md`
2. Or symlink: `ln -s ../.suit .claude/suitos`
3. Claude Code will auto-load any `.claude/*.md` files at session start

## OpenAI / GPTs

GPTs require explicit instructions. Use the AGENTS.md content above as the system prompt:

- Include the SuitOS Knowledge Hierarchy section
- Include the Activation Protocol section
- Include the Runtime Integration table
- GPTs do not auto-discover files — you must load them explicitly

## Generic Agent

The `.suit/` kernel is plain YAML and Markdown. Any agent can consume it by:

1. Loading `.suit/ARCHITECTURE.md` as architecture reference
2. Querying `.suit/registry/` for system state
3. Loading `.suit/workflows/` for process definitions
4. Writing to `.suit/memory/` for persistence
5. Writing to `.suit/logs/` for telemetry

## What Gets Loaded When

| Strategy | Tokens | Files |
|---|---|---|
| minimal | ~2k | AGENTS.md + workflow YAML |
| standard | ~8k | + contexto.md + INDEX_FUNCIONES.md + skills |
| deep | ~20k | + memory/decisions + memory/patterns + memory/bugs |

Strategies are defined in `.suit/loader/strategy.yaml`. The agent selects based on task complexity.
