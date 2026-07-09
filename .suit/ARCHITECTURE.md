# SuitOS — Agent Operating System Architecture

> Version: 0.1.0 (Design Document)
> Model-Agnostic | Provider-Independent | Declarative-by-Design

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Overview](#2-overview)
3. [Directory Structure](#3-directory-structure)
4. [Registry — The Heart](#4-registry--the-heart)
5. [Dispatcher — The Scheduler](#5-dispatcher--the-scheduler)
6. [Loader — The Memory Manager](#6-loader--the-memory-manager)
7. [Planner — The Process Scheduler](#7-planner--the-process-scheduler)
8. [Workflows — The Unit Definitions](#8-workflows--the-unit-definitions)
9. [Skills — The Shared Libraries](#9-skills--the-shared-libraries)
10. [Reviewer — The Validation Pipeline](#10-reviewer--the-validation-pipeline)
11. [Memory — The Persistent Store](#11-memory--the-persistent-store)
12. [Telemetry — The Observable Substrate](#12-telemetry--the-observable-substrate)
13. [Complete Flow](#13-complete-flow)
14. [Scalability](#14-scalability)
15. [Migration Strategy from Current .agent/](#15-migration-strategy-from-current-agent)
16. [Roadmap](#16-roadmap)

---

## 1. Philosophy

SuitOS is not a collection of prompts. It is an operating system for AI agents.

### Core Tenets

| Tenet | Meaning |
|---|---|
| **Kernel, not scripts** | The system provides primitives (scheduling, routing, loading, validation). Agents are processes. |
| **Declarative, not imperative** | What to do, not how. Registry describes capabilities; Dispatcher decides at runtime. |
| **Model-agnostic** | The same architecture works with Claude Code, OpenCode, OpenAI, Gemini, or any future model. No model-specific logic in the kernel. |
| **Minimal context** | Load only what is needed. Every byte in context has a cost. Selective reading is a first-class feature. |
| **Auditable by default** | Every decision, every load, every error is recorded. SuitOS knows what happened and why. |
| **No vendor lock-in** | Registry-based routing means any component can be swapped without touching the kernel. |

### What SuitOS is NOT

- Not a prompt library (prompts are versioned artifacts referenced by ID)
- Not an agent framework (no runtime code, no SDK to import)
- Not a database (registry is YAML files in git)
- Not a replacement for .agent/ or .opencode/ (it orchestrates them)

### Knowledge Hierarchy (Immutable)

```
User
  ↓
AGENTS.md (root)         → Immutable project rules
  ↓
AGENTS.md (subproject)   → Subproject-specific rules
  ↓
Workflow                 → Declarative process definition
  ↓
Skills                   → Reusable capability modules
  ↓
Code                     → Actual implementation files
```

SuitOS enforces this hierarchy. No component may skip a level.

---

## 2. Overview

```
.suit/                     ← Kernel directory (versioned in git)
├── registry/              ← Declarative knowledge base (THE HEART)
│   ├── agents.yaml        ← Registered agent types
│   ├── skills.yaml        ← Registered skills
│   ├── workflows.yaml     ← Registered workflows
│   ├── projects.yaml      ← Subproject definitions
│   ├── models.yaml        ← AI model registry
│   ├── permissions.yaml   ← Access control rules
│   └── routing.yaml       ← Intent-to-workflow mapping
├── dispatcher/            ← Scheduling & orchestration
│   └── entrypoint.md      ← Single entry point logic
├── loader/                ← Context management
│   └── strategy.yaml      ← Load strategies per workflow
├── planner/               ← Pre-execution planning
│   └── template.yaml      ← Plan structure template
├── workflows/             ← Declarative workflow definitions
│   ├── feature.yaml
│   ├── bugfix.yaml
│   ├── audit.yaml
│   ├── review.yaml
│   ├── docs.yaml
│   ├── deploy.yaml
│   └── research.yaml
├── skills/                ← Reusable skill definitions
│   ├── system/            ← Built-in SuitOS skills
│   └── domain/            ← Domain-specific skills
├── prompts/               ← Versioned prompt artifacts
│   └── registry.yaml      ← Prompt metadata index
├── reviewer/              ← Validation pipeline
│   └── profiles.yaml      ← Review profiles
├── memory/                ← Project memory
│   ├── decisions/         ← Architecture Decision Records
│   ├── bugs/              ← Known bug database
│   ├── lessons/           ← Cross-project learnings
│   └── patterns/          ← Reusable patterns
├── telemetry/             ← Observability
│   └── schema.yaml        ← Event schema definitions
├── config/                ← Kernel configuration
│   └── kernel.yaml        ← SuitOS global settings
├── docs/                  ← System documentation
│   └── ARCHITECTURE.md    ← This file
├── cache/                 ← Temporary context cache
├── logs/                  ← Execution logs
└── INDEX.md               ← Auto-generated entry point index
```

---

## 3. Directory Structure (Detailed)

### 3.1 `.suit/` Root

| Entry | Purpose |
|---|---|
| `registry/` | Declarative knowledge base — all capabilities, all agents, all routes |
| `dispatcher/` | Decision logic — maps intent to workflow, workflow to capabilities |
| `loader/` | Context minimization — decides what to read and what to skip |
| `planner/` | Execution planning — builds a plan before any action |
| `workflows/` | Declarative process definitions |
| `skills/` | Reusable capability modules (metadata only; code lives in the project) |
| `prompts/` | Versioned prompt artifacts (referenced by ID, not inlined) |
| `reviewer/` | Validation pipeline — checks before committing changes |
| `memory/` | Persistent project memory — decisions, bugs, patterns |
| `telemetry/` | Observability schema and event definitions |
| `config/` | Kernel-level configuration |
| `docs/` | System architecture and operational docs |
| `cache/` | Transient context cache (gitignored) |
| `logs/` | Execution logs (gitignored) |
| `INDEX.md` | Auto-generated, single-entry index (like INDEX_FUNCIONES.md but for .suit/) |

### 3.2 What goes in `.suit/` vs `.agent/` vs `.opencode/`

| Directory | Purpose | Managed by |
|---|---|---|
| `.suit/` | Agent OS kernel — architecture, registry, orchestration | SuitOS design |
| `.agent/` | Tool-specific agent memory (Claude Code) | Claude Code |
| `.opencode/` | OpenCode-specific config, skills, commands | OpenCode |
| `.claude/` | Claude-specific config, agents, skills | Claude |

**Key rule:** `.suit/` is tool-agnostic. It defines WHAT exists and HOW to orchestrate. `.agent/`, `.opencode/`, `.claude/` are tool-specific implementations that CONSUME `.suit/` definitions.

---

## 4. Registry — The Heart

### 4.1 Purpose

The Registry is the single source of truth for all capabilities, agents, workflows, skills, projects, models, permissions, and routing rules. It eliminates hardcoded logic by making every decision data-driven.

### 4.2 Files

#### `registry/agents.yaml`

Registers agent types. An agent type is a role with a specific capability set.

```yaml
# registry/agents.yaml
agents:
  architect:
    description: "System architecture analysis and design"
    domain: system
    risk_level: high
    required_skills:
      - system-analysis
      - multi-tenant
    required_reviewers:
      - security
      - architecture
    max_tokens: 8000
    temperature: 0.2

  developer:
    description: "Code implementation and refactoring"
    domain: code
    risk_level: medium
    required_skills:
      - javascript
      - gas
    required_reviewers:
      - style
    max_tokens: 16000
    temperature: 0.3

  researcher:
    description: "Information gathering and analysis"
    domain: knowledge
    risk_level: low
    required_skills:
      - web-search
      - trend-analysis
    required_reviewers: []
    max_tokens: 32000
    temperature: 0.5

  reviewer:
    description: "Code and architecture review"
    domain: quality
    risk_level: low
    required_skills:
      - code-review
      - security-audit
    required_reviewers: []
    max_tokens: 16000
    temperature: 0.1
```

**What happens when you add a new agent:**
1. Add entry to `agents.yaml`
2. List required skills (must exist in `skills.yaml`)
3. Specify required reviewers (must exist in `reviewer/profiles.yaml`)
4. Done. Dispatcher reads `agents.yaml` — no code changes.

#### `registry/skills.yaml`

Registers reusable skills that workflows and agents reference.

```yaml
# registry/skills.yaml
skills:
  system-analysis:
    description: "Analyze system architecture, identify patterns, detect issues"
    version: 1.0.0
    type: domain
    domain: system
    dependencies: []
    triggers:
      - "architecture review"
      - "system audit"
      - "technical debt analysis"
    inputs:
      - "source code files"
      - "architecture docs"
    outputs:
      - "architecture report"
      - "recommendations"
    discoverable: true          # Auto-discoverable by Registry
    context_hint:              # Hint to Loader about what to read
      - "contexto.md"
      - "docs/contexto/arquitectura.md"

  multi-tenant:
    description: "Multi-tenant isolation rules and patterns"
    version: 1.0.0
    type: domain
    domain: security
    dependencies:
      - system-analysis
    triggers:
      - "data isolation"
      - "id_empresa"
      - "RBAC"
    inputs: []
    outputs:
      - "isolation validation"
    discoverable: true
    context_hint:
      - "AGENTS.md"
      - "backend/core.js"

  javascript:
    description: "JavaScript/Node.js development"
    version: 1.0.0
    type: language
    domain: code
    dependencies: []
    triggers:
      - "js file"
      - "node"
      - "express"
    inputs:
      - "source files"
    outputs:
      - "modified files"
    discoverable: true
    context_hint:
      - "js/modules/"

  gas:
    description: "Google Apps Script development"
    version: 1.0.0
    type: language
    domain: code
    dependencies:
      - javascript
    triggers:
      - "gs file"
      - "clasp"
      - "google apps script"
    inputs:
      - "source files"
    outputs:
      - "modified files"
    discoverable: true
    context_hint:
      - "backend/"
      - "appsscript.json"

  code-review:
    description: "Code review according to project standards"
    version: 1.0.0
    type: process
    domain: quality
    dependencies:
      - javascript
    triggers:
      - "pull request"
      - "review request"
    inputs:
      - "diff"
      - "changed files"
    outputs:
      - "review comments"
    discoverable: true
    context_hint:
      - "AGENTS.md"
      - "contexto.md"

  security-audit:
    description: "Security audit for hardcoded keys, CSP, RBAC"
    version: 1.0.0
    type: process
    domain: security
    dependencies: []
    triggers:
      - "security review"
      - "vulnerability scan"
    inputs:
      - "source code"
      - "config files"
    outputs:
      - "security report"
    discoverable: true
    context_hint:
      - "server.js"
      - "backend/*.js"
      - ".env.example"

  web-search:
    description: "Web search and information retrieval"
    version: 1.0.0
    type: tool
    domain: knowledge
    dependencies: []
    triggers:
      - "search"
      - "research"
    inputs:
      - "query"
    outputs:
      - "search results"
    discoverable: true
    context_hint: []

  trend-analysis:
    description: "Social media and market trend analysis"
    version: 1.0.0
    type: domain
    domain: marketing
    dependencies:
      - web-search
    triggers:
      - "trends"
      - "market research"
    inputs:
      - "query"
      - "industry"
    outputs:
      - "trend report"
    discoverable: true
    context_hint:
      - "CampanasAi/config/tendencias.json"
```

**Auto-discovery mechanism:**
1. Registry scans `.suit/skills/` for `.yaml` files
2. Each file declares one or more skills
3. Registry validates that all dependencies exist
4. Skills with `discoverable: true` are indexed and available for automatic matching
5. Skills without `discoverable` are opt-in only

#### `registry/workflows.yaml`

Index of all registered workflows with metadata for fast filtering.

```yaml
# registry/workflows.yaml
workflows:
  feature:
    path: .suit/workflows/feature.yaml
    risk: medium
    domain: code
    requires_review: true
    requires_planning: true
    estimated_tokens: 8000
    trigger_keywords:
      - "implement"
      - "add"
      - "create"
      - "feature"
      - "nuevo"

  bugfix:
    path: .suit/workflows/bugfix.yaml
    risk: medium
    domain: code
    requires_review: true
    requires_planning: true
    estimated_tokens: 6000
    trigger_keywords:
      - "bug"
      - "error"
      - "fix"
      - "arreglar"
      - "issue"

  audit:
    path: .suit/workflows/audit.yaml
    risk: low
    domain: system
    requires_review: false
    requires_planning: true
    estimated_tokens: 12000
    trigger_keywords:
      - "audit"
      - "review"
      - "analyze"
      - "diagnose"

  docs:
    path: .suit/workflows/docs.yaml
    risk: low
    domain: documentation
    requires_review: false
    requires_planning: false
    estimated_tokens: 4000
    trigger_keywords:
      - "document"
      - "readme"
      - "documentation"
      - "doc"

  research:
    path: .suit/workflows/research.yaml
    risk: low
    domain: knowledge
    requires_review: false
    requires_planning: false
    estimated_tokens: 8000
    trigger_keywords:
      - "research"
      - "investigate"
      - "find"
      - "search"

  deploy:
    path: .suit/workflows/deploy.yaml
    risk: high
    domain: operations
    requires_review: true
    requires_planning: true
    estimated_tokens: 4000
    trigger_keywords:
      - "deploy"
      - "release"
      - "publish"
      - "production"

  review:
    path: .suit/workflows/review.yaml
    risk: low
    domain: quality
    requires_review: false
    requires_planning: false
    estimated_tokens: 8000
    trigger_keywords:
      - "review"
      - "validate"
      - "check"

  migration:
    path: .suit/workflows/migration.yaml
    risk: high
    domain: operations
    requires_review: true
    requires_planning: true
    estimated_tokens: 10000
    trigger_keywords:
      - "migrate"
      - "migration"
      - "schema"
```

#### `registry/projects.yaml`

Subproject definitions. Each subproject maps to a project path, its own AGENTS.md, skills, and context.

```yaml
# registry/projects.yaml
projects:
  root:
    path: ./
    agents: .suit/registry/agents.yaml
    skills: .suit/registry/skills.yaml
    context:
      - AGENTS.md
      - contexto.md
      - INDEX_FUNCIONES.md
      - opencode.json
    servers:
      - name: main
        path: server.js
        port: 3001
        type: express

  campanas-ai:
    path: CampanasAi/
    agents: CampanasAi/AGENTS.md
    skills:
      - trend-analysis
      - content-generation
    context:
      - CampanasAi/AGENTS.md         # (if it existed — recommended)
      - CampanasAi/script.js
      - CampanasAi/config/prompts.json
      - CampanasAi/config/formatos.json
      - CampanasAi/local-server-node.js
      - CampanasAi/backend.gs
    environment:
      PORT: 8000
      TYPE: cms
    servers:
      - name: cms
        path: CampanasAi/local-server-node.js
        port: 8000
        type: http

  citas:
    path: citas/
    agents: citas/AGENTS.md         # (if it existed — recommended)
    skills:
      - whatsapp-integration
      - calendar-integration
    context:
      - citas/index.js
      - citas/services/ai.js
      - citas/handlers/actions.js
      - citas/db/schema.sql
    environment:
      PORT: 3002
      TYPE: service
    servers:
      - name: appointments
        path: citas/index.js
        port: 3002
        type: express
```

**Adding a new subproject:**
1. Create its directory
2. Optionally create a local AGENTS.md
3. Add entry to `projects.yaml` specifying path, context, skills, servers
4. Include a `frontend:` section declaring:
   - `public: true/false` — does it have a customer-facing UI?
   - `public_route:` — which hash route(s) / UI entry points?
   - `public_gate:` — which `Config_Empresas` field gates it? (e.g. `usa_reservaciones >= 1`)
   - `staff: true/false` — does it have a staff/admin panel?
   - `staff_route:` — which hash route(s) serve the staff UI?
   - `staff_gate:` — which field + RBAC gates the staff panel?
   - `api_endpoints:` — list of REST endpoints the module exposes
5. Done. Dispatcher can now route tasks to this subproject.

#### `registry/models.yaml`

AI model registry. Enables provider-agnostic routing.

```yaml
# registry/models.yaml
models:
  claude-sonnet:
    provider: claude
    model: claude-sonnet-4-20250514
    capabilities:
      - code
      - analysis
      - planning
    cost_per_1k_input: 0.003
    cost_per_1k_output: 0.015
    context_window: 200000
    preferred_for:
      - planning
      - architecture
      - review
    enabled: true

  claude-haiku:
    provider: claude
    model: claude-haiku-3-5-20241022
    capabilities:
      - code
      - quick-analysis
    cost_per_1k_input: 0.0008
    cost_per_1k_output: 0.004
    context_window: 200000
    preferred_for:
      - quick-tasks
      - simple-edits
    enabled: true

  deepseek-flash:
    provider: opencode
    model: opencode/deepseek-v4-flash-free
    capabilities:
      - code
      - general
    cost_per_1k_input: 0
    cost_per_1k_output: 0
    context_window: 128000
    preferred_for:
      - general
      - cost-sensitive
    enabled: true

  gemini-flash:
    provider: google
    model: gemini-2.0-flash
    capabilities:
      - analysis
      - content
      - vision
    cost_per_1k_input: 0.0001
    cost_per_1k_output: 0.0004
    context_window: 1000000
    preferred_for:
      - long-context
      - vision-tasks
    enabled: true

  openrouter-fallback:
    provider: openrouter
    model: openrouter/auto
    capabilities:
      - general
      - fallback
    cost_per_1k_input: 0
    cost_per_1k_output: 0
    context_window: 128000
    preferred_for:
      - fallback
    enabled: true
```

**Adding a new model:**
1. Add entry to `models.yaml`
2. Specify provider, capabilities, cost, preferred use cases
3. Done. Dispatcher can now select this model based on task requirements.

#### `registry/permissions.yaml`

Access control for agents and operations.

```yaml
# registry/permissions.yaml
permissions:
  roles:
    architect:
      allowed_workflows:
        - audit
        - review
        - docs
      allowed_projects:
        - root
      max_risk: high

    developer:
      allowed_workflows:
        - feature
        - bugfix
        - docs
        - research
      allowed_projects:
        - root
        - campanas-ai
        - citas
      max_risk: medium

    operator:
      allowed_workflows:
        - deploy
        - migration
        - bugfix
      allowed_projects:
        - root
      max_risk: high

    researcher:
      allowed_workflows:
        - research
        - audit
      allowed_projects:
        - root
        - campanas-ai
      max_risk: low

  rules:
    - operation: "modify_gas_backend"
      requires_role: developer
      requires_review: [security, architecture]
      notify: true

    - operation: "modify_server_routing"
      requires_role: operator
      requires_review: [security, architecture]
      notify: true

    - operation: "modify_multi_tenant"
      requires_role: architect
      requires_review: [security]
      notify: true
```

#### `registry/routing.yaml`

Intent-to-workflow mapping. This is how the Dispatcher decides what to run.

```yaml
# registry/routing.yaml
routing:
  # Intent classification rules
  intents:
    - patterns:
        - "implement"
        - "add feature"
        - "create module"
        - "new functionality"
      workflow: feature
      priority: 10

    - patterns:
        - "fix"
        - "bug"
        - "error"
        - "crash"
        - "not working"
      workflow: bugfix
      priority: 20

    - patterns:
        - "audit"
        - "analyze"
        - "review architecture"
        - "diagnose"
      workflow: audit
      priority: 5

    - patterns:
        - "deploy"
        - "release"
        - "publish"
      workflow: deploy
      priority: 30

    - patterns:
        - "document"
        - "docs"
        - "readme"
      workflow: docs
      priority: 5

    - patterns:
        - "migrate"
        - "migration"
        - "schema change"
      workflow: migration
      priority: 30

    - patterns:
        - "research"
        - "search"
        - "investigate"
        - "find"
      workflow: research
      priority: 5

    - patterns:
        - "review"
        - "validate"
        - "check"
        - "verify"
      workflow: review
      priority: 5

  # Override rules (higher priority than intent matching)
  overrides:
    - if:
        project: campanas-ai
        keyword: "trend"
      workflow: research
      priority: 100  # Highest priority for specific matches

    - if:
        workflow: feature
        project: campanas-ai
      agent: developer
      skills_override:
        - content-generation
```

### 4.3 How the Dispatcher Queries the Registry

```
1. Parse user input
2. Match against routing.yaml intents (longest pattern match, highest priority wins)
3. Check routing.yaml overrides for project-specific or context-specific overrides
4. Load workflow definition from workflows.yaml → path
5. Load agent requirements from agents.yaml
6. Load required skills from skills.yaml
7. Load project context from projects.yaml
8. Check permissions from permissions.yaml
9. Return: { workflow, agent, skills, context, reviewers, permissions }
```

### 4.4 How Registry Eliminates Hardcoded Logic

| Before (Hardcoded) | After (Registry-Driven) |
|---|---|
| `if (input.includes("bug")) { runBugFix() }` | `routing.yaml` maps pattern → workflow |
| `agent.setModel("claude-sonnet-4")` | `models.yaml` selected by task requirements |
| `loadContext("AGENTS.md", "contexto.md")` | `projects.yaml` defines per-project context |
| `if (role === "developer") { allow }` | `permissions.yaml` defines role-based access |
| `skillList = ["js", "gas", "multi-tenant"]` | `skills.yaml` defines all skills with metadata |
| `switch(project) { case "campanas-ai": ... }` | `projects.yaml` defines subproject boundaries |

---

## 5. Dispatcher — The Scheduler

### 5.1 Purpose

The Dispatcher is the kernel scheduler. It receives a user request, consults the Registry, and produces a complete orchestration plan: which workflow, which agent, which skills, which context, which model, which reviewers.

### 5.2 Responsibilities

1. **Intent classification** — Parse user input against `routing.yaml`
2. **Registry lookup** — Query all registry tables for the matched workflow
3. **Resource allocation** — Select agent type, skills, model based on task requirements
4. **Permission check** — Validate against `permissions.yaml`
5. **Orchestration plan** — Produce a structured plan for downstream components
6. **Subproject routing** — If task targets a subproject, route to its context

### 5.3 Inputs

- User request (raw text)
- Active project context (current working directory, known state)
- Registry (all YAML files)

### 5.4 Outputs

```yaml
# Orchestration Plan (produced by Dispatcher)
orchestration:
  workflow: feature
  project: campanas-ai
  agent: developer
  model:
    provider: claude
    model: claude-sonnet-4-20250514
    reason: "Complex feature with multi-tenant implications"
  skills:
    - javascript
    - content-generation
  context_to_load:
    - AGENTS.md
    - CampanasAi/AGENTS.md
    - contexto.md
    - INDEX_FUNCIONES.md
    - CampanasAi/script.js (relevant functions only)
    - CampanasAi/config/prompts.json
  reviewers:
    - security
    - architecture
  permissions:
    allowed: true
    requires_confirmation: true
    risk_level: medium
```

### 5.5 Decision Algorithm

```
1. Normalize user input (lowercase, strip punctuation)
2. Tokenize and extract key phrases
3. Match against routing.yaml intents:
   a. For each intent, check if ANY pattern is a substring of input
   b. Collect all matches with their priorities
   c. Select highest priority match
   d. On tie, select most specific (longest pattern)
4. Check routing.yaml overrides (project + keyword matches)
5. Look up workflow path from workflows.yaml
6. Look up agent from workflow definition
7. Look up skills from workflow + agent definitions
8. Look up project context from projects.yaml
9. Select model from models.yaml based on:
   a. Workflow domain (code → code-capable models)
   b. Task complexity (long context → high context window)
   c. Cost sensitivity (free → deepseek-flash)
   d. Agent preference (architect → higher quality model)
10. Check permissions from permissions.yaml
11. Check cost estimate from telemetry history
12. Produce orchestration plan
```

### 5.6 Scalability

- Adding a new intent = add entry to `routing.yaml`
- Adding a new workflow = add entry to `workflows.yaml` + file in `workflows/`
- Adding a new agent = add entry to `agents.yaml`
- Adding a new project = add entry to `projects.yaml`
- Adding a new model = add entry to `models.yaml`

**No code changes. No dispatcher modifications.**

---

## 6. Loader — The Memory Manager

### 6.1 Purpose

The Loader is responsible for minimizing context consumption. It decides exactly what to read, how much to read, and what to skip — based on the workflow, skills, and project context.

### 6.2 Responsibilities

1. **Read AGENTS.md hierarchy** — root → subproject (never skip levels)
2. **Read workflow definition**
3. **Read required skills** (metadata only, not implementation)
4. **Read project context** from `projects.yaml` context list
5. **Locate relevant functions** via `INDEX_FUNCIONES.md` (only read the lines needed)
6. **Read only the relevant sections** of files (use line ranges, not entire files)
7. **Skip irrelevant files** — if a skill is not required, its context is not loaded
8. **Cache loaded context** in `.suit/cache/` for reuse within session

### 6.3 Load Strategy

```yaml
# loader/strategy.yaml
strategies:
  minimal:
    description: "Load only AGENTS.md hierarchy + workflow definition"
    token_budget: 2000
    includes:
      - "AGENTS.md"                    # Root rules
      - "{{project}}/AGENTS.md"        # Subproject rules (if exists)
      - ".suit/workflows/{{workflow}}.yaml"
    excludes:
      - "anything not in includes"
    use_case:
      - research
      - quick-review

  standard:
    description: "Full context for feature development"
    token_budget: 8000
    includes:
      - "AGENTS.md"
      - "{{project}}/AGENTS.md"
      - "contexto.md"
      - "INDEX_FUNCIONES.md"
      - ".suit/workflows/{{workflow}}.yaml"
      - ".suit/skills/{{skill}}/*.md"   # Only required skills
      - "{{project_context_files}}"      # From projects.yaml
    excludes:
      - "node_modules"
      - ".git"
      - "*.zip"
      - "media/*"
    use_case:
      - feature
      - bugfix

  deep:
    description: "Comprehensive context for architecture or audit"
    token_budget: 20000
    includes:
      - "AGENTS.md"
      - "{{project}}/AGENTS.md"
      - "contexto.md"
      - "INDEX_FUNCIONES.md"
      - ".suit/workflows/{{workflow}}.yaml"
      - ".suit/skills/{{skill}}/*.md"
      - "{{project_context_files}}"
      - ".suit/memory/decisions/*.md"
      - ".suit/memory/patterns/*.md"
      - ".suit/memory/bugs/*.md"
      - ".agent/lecciones.md"
    excludes:
      - "node_modules"
      - ".git"
    use_case:
      - audit
      - migration
      - deploy
```

### 6.4 Selective Reading Algorithm

```
1. Determine load strategy from workflow (minimal/standard/deep)
2. Resolve project-specific paths from projects.yaml
3. Resolve skill-specific context from skills.yaml context_hint
4. For each file in includes:
   a. If file is INDEX_FUNCIONES.md → read FUNCTION INDEX only
   b. If a function is needed → read only that function's lines (identified by grep)
   c. If file is AGENTS.md → read complete (it's small)
   d. If file is a skill → read only metadata header
   e. Otherwise → read first N lines based on token budget
5. Aggregate all context into a single token-budgeted string
6. Cache result in .suit/cache/{{session_id}}.context
7. Return context to caller
```

### 6.5 What is NOT Loaded

- Skills not required by the workflow
- Subprojects not targeted by the task
- Memory records not relevant to the task
- Full code files when function-level access suffices
- Telemetry history (loaded on demand)
- Prompts not referenced by the workflow

---

## 7. Planner — The Process Scheduler

### 7.1 Purpose

The Planner builds an execution plan before any action is taken. It evaluates impact, risk, dependencies, files to modify, validation steps, and rollback strategy.

### 7.2 Responsibilities

1. **Analyze the task** against the loaded context
2. **Identify files to modify** (read + write sets)
3. **Identify dependencies** between changes
4. **Assess risk** (based on project, files, permissions)
5. **Define validation steps** (what to check after changes)
6. **Define rollback strategy** (how to undo if something breaks)
7. **Estimate token cost** for the execution
8. **Produce a structured plan** for the agent to follow

### 7.3 Plan Template

```yaml
# planner/template.yaml
plan:
  task: "{{user_request}}"
  workflow: "{{workflow_name}}"
  project: "{{project_name}}"
  risk: "low|medium|high"

  analysis:
    summary: "Brief description of what needs to happen"
    impact:
      - "List of affected areas"
    dependencies:
      - "Any prerequisites or order constraints"

  files:
    read:
      - path: "file.js"
        reason: "Need to understand existing implementation"
        lines: "45-120"  # Selective reading
    write:
      - path: "file.js"
        operation: "modify|create|delete"
        estimated_lines: 30

  validation:
    steps:
      - "npm run lint"  # If available
      - "Check for syntax errors"
      - "Verify id_empresa filtering"
    expected_outcomes:
      - "Feature works without breaking existing functionality"

  rollback:
    strategy: "git checkout|manual revert|restore from backup"
    command: "git checkout -- {{modified_files}}"
    backup_before: true

  estimated_cost:
    input_tokens: 5000
    output_tokens: 2000
    model: "claude-sonnet-4"
```

### 7.4 When the Planner Intervenes

- **Always** for `high` and `medium` risk workflows
- **On request** for `low` risk workflows
- **Required** when modifying multi-tenant, security, or production code

### 7.5 Planner Output

The Planner outputs a structured plan that the agent follows step by step. The agent does NOT deviate from the plan without re-planning.

---

## 8. Workflows — The Unit Definitions

### 8.1 Purpose

Workflows are declarative process definitions. Each workflow defines a complete execution unit: what to do, what skills to use, what to validate, and what to check after.

### 8.2 Structure

#### `workflows/feature.yaml`

```yaml
# workflows/feature.yaml
workflow:
  name: feature
  display_name: "Feature Implementation"
  description: "Implement a new feature or module"
  risk: medium
  domain: code

  # Entry conditions
  entry:
    requires_planning: true
    requires_confirmation: true
    required_context:
      - AGENTS.md
      - contexto.md
      - INDEX_FUNCIONES.md
    required_skills:
      - domain-specific (resolved from registry)
    forbidden_if:
      - "No AGENTS.md loaded"

  # Steps
  steps:
    - id: analyze
      description: "Analyze requirements and existing code"
      action: read
      skills:
        - system-analysis
      validation:
        - "Understand the feature in context of existing architecture"

    - id: plan
      description: "Create implementation plan"
      action: plan
      skills:
        - system-analysis
      produces: plan.yaml
      validation:
        - "Plan approved by Planner"

    - id: implement
      description: "Implement the feature"
      action: write
      skills:
        - javascript
        - gas
        - domain-specific
      validation:
        - "Syntax is valid"
        - "No hardcoded secrets"
        - "id_empresa filtered where applicable"
        - "Soft delete only"

    - id: index
      description: "Update function index"
      action: run
      command: "node scripts/generate-index.js"
      condition: "if new functions added or renamed"
      validation:
        - "INDEX_FUNCIONES.md regenerated"

    - id: validate
      description: "Run all validations"
      action: review
      validation:
        - "No regressions detected"
        - "Permissions respected"
        - "Multi-tenant isolation maintained"

    - id: commit
      description: "Commit changes"
      action: git
      command: "git add . && git commit -m '{emoji} {type}: {desc} (v{version})'"
      condition: "user confirms"
      validation:
        - "Commit message follows convention"

  # Exit conditions
  exit:
    validation:
      - "INDEX_FUNCIONES.md is updated"
      - "No debug code left"
      - "Smoke test passed"
    requires_commit: true
    notifies:
      - memory/decisions
      - telemetry

  # Config
  config:
    allowed_models:
      - claude-sonnet
      - deepseek-flash
    max_steps_without_confirmation: 3
    auto_rollback_on_failure: true
```

#### `workflows/bugfix.yaml`

```yaml
# workflows/bugfix.yaml
workflow:
  name: bugfix
  display_name: "Bug Fix"
  description: "Fix a bug or error in existing code"
  risk: medium
  domain: code

  entry:
    requires_planning: true
    requires_confirmation: true
    required_context:
      - AGENTS.md
      - INDEX_FUNCIONES.md
      - contexto.md
    required_skills:
      - javascript
      - system-analysis

  steps:
    - id: reproduce
      description: "Understand the bug (read error, trace, affected code)"
      action: read
      skills:
        - system-analysis
      validation:
        - "Root cause identified"

    - id: plan_fix
      description: "Plan the minimal fix"
      action: plan
      skills:
        - system-analysis
      produces: fix_plan.yaml
      validation:
        - "Fix is minimal (doesn't touch unrelated code)"

    - id: implement_fix
      description: "Apply the fix"
      action: write
      skills:
        - javascript
        - gas
      validation:
        - "Fix is syntactically correct"
        - "No collateral damage"

    - id: verify_fix
      description: "Verify the bug is fixed and no regressions"
      action: test
      validation:
        - "Bug scenario now works"
        - "Existing functionality preserved"

    - id: document
      description: "Document the bug and fix"
      action: write
      target: .suit/memory/bugs/
      validation:
        - "Bug recorded with reproduction steps and fix"

    - id: commit
      action: git
      condition: "user confirms"

  exit:
    validation:
      - "Bug is fixed"
      - "Bug is documented in memory"
    requires_commit: true
    notifies:
      - memory/bugs
      - telemetry
```

#### `workflows/audit.yaml`

```yaml
# workflows/audit.yaml
workflow:
  name: audit
  display_name: "System Audit"
  description: "Analyze architecture, security, performance, or code quality"
  risk: low
  domain: system

  entry:
    requires_planning: false
    requires_confirmation: false
    required_context:
      - AGENTS.md
      - contexto.md
      - .suit/memory/bugs/*.md
    required_skills:
      - system-analysis
      - security-audit

  steps:
    - id: scope
      description: "Define audit scope (which module, which concern)"
      action: read
      produces: scope.yaml

    - id: analyze
      description: "Analyze code, config, and architecture"
      action: read+analyze
      skills:
        - system-analysis
        - security-audit
      validation:
        - "All relevant files examined"

    - id: report
      description: "Produce audit report with findings and recommendations"
      action: write
      target: .suit/reports/
      produces: audit_report.md
      validation:
        - "Report is actionable (not just descriptive)"

  exit:
    validation:
      - "Report saved to .suit/reports/"
    notifies:
      - telemetry
```

#### `workflows/deploy.yaml`

```yaml
# workflows/deploy.yaml
workflow:
  name: deploy
  display_name: "Deployment"
  description: "Deploy to production (GAS, GH Pages, servers)"
  risk: high
  domain: operations

  entry:
    requires_planning: true
    requires_confirmation: true
    required_context:
      - AGENTS.md
      - contexto.md
    required_skills:
      - javascript
    forbidden_if:
      - "Uncommitted changes in working directory"

  steps:
    - id: preflight
      description: "Check deployment readiness"
      action: validate
      validation:
        - "All tests pass (or manual smoke test)"
        - "INDEX_FUNCIONES.md is up to date"
        - "No uncommitted changes"
        - "Version bumped"

    - id: backup
      description: "Create pre-deployment backup"
      action: run
      command: "zip -r SUIT_predeploy_$(date +%d%m%y_%H%M).zip . -x '*/node_modules/*' '*/.git/*' '*.zip'"

    - id: deploy_gas
      description: "Deploy GAS backend"
      action: run
      command: "clasp push && clasp deploy"
      condition: "if backend/ files changed"
      validation:
        - "Deployment version matches expected"

    - id: deploy_frontend
      description: "Deploy frontend to GH Pages"
      action: run
      command: "git push origin main"
      condition: "if frontend files changed"
      validation:
        - "Push succeeded"

    - id: verify
      description: "Verify deployment is live"
      action: test
      validation:
        - "Servers respond on expected ports"
        - "Key endpoints return 200"

  exit:
    validation:
      - "Deployment verified"
      - "Backup exists"
    notifies:
      - telemetry
```

#### `workflows/research.yaml`

```yaml
# workflows/research.yaml
workflow:
  name: research
  display_name: "Research Task"
  description: "Gather information, analyze trends, investigate topics"
  risk: low
  domain: knowledge

  entry:
    requires_planning: false
    requires_confirmation: false
    required_context:
      - AGENTS.md
    required_skills:
      - web-search

  steps:
    - id: define_query
      description: "Define research question and scope"
      action: read
      produces: query.md

    - id: gather
      description: "Search and collect information"
      action: search
      skills:
        - web-search
        - trend-analysis
      validation:
        - "Multiple sources consulted"

    - id: synthesize
      description: "Synthesize findings into structured report"
      action: write
      produces: research_report.md
      validation:
        - "Report is structured and actionable"

  exit:
    validation:
      - "Report saved"
    notifies:
      - telemetry
```

### 8.3 Workflow Conditions

Each step can have conditions:
- `condition: always` (default) — always execute
- `condition: if new functions added or renamed` — only if condition met
- `condition: if backend/ files changed` — only if relevant files changed
- `condition: user confirms` — wait for user approval

---

## 9. Skills — The Shared Libraries

### 9.1 Purpose

Skills are reusable capability modules. Each skill encapsulates a specific domain, tool, or process. Skills are the "shared libraries" of SuitOS — they are dynamically linked by workflows and agents.

### 9.2 Skill Structure

```
skills/
├── system/                    ← Built-in SuitOS skills
│   ├── context-loader.yaml    ← How to load context
│   ├── index-navigator.yaml   ← How to use INDEX_FUNCIONES.md
│   └── registry-query.yaml    ← How to query registry
├── domain/                    ← Domain-specific skills
│   ├── multi-tenant.yaml      
│   ├── content-generation.yaml
│   ├── trend-analysis.yaml
│   └── whatsapp-integration.yaml
├── language/                  ← Language-specific skills
│   ├── javascript.yaml
│   ├── gas.yaml
│   └── sql.yaml
├── tool/                      ← Tool-specific skills
│   ├── web-search.yaml
│   ├── git.yaml
│   └── clasp.yaml
└── process/                   ← Process skills
    ├── code-review.yaml
    ├── security-audit.yaml
    └── deployment.yaml
```

### 9.3 Skill Definition Format

```yaml
# skills/domain/multi-tenant.yaml
skill:
  name: multi-tenant
  display_name: "Multi-Tenant Isolation"
  version: 1.0.0
  type: domain
  domain: security

  description: >
    Enforces multi-tenant data isolation rules.
    All queries must filter by id_empresa.
    No cross-tenant data access is permitted.

  dependencies:
    - javascript

  # When to load this skill
  triggers:
    - keyword: "id_empresa"
    - keyword: "tenant"
    - keyword: "multi-tenant"
    - keyword: "inquilino"
    - file_pattern: "backend/*.js"
    - file_pattern: "js/modules/*.js"

  # What context is needed
  context_hint:
    - "AGENTS.md"                                 # Immutable rule #1
    - "backend/core.js"                           # Orquestador
    - "backend/utils.js"                          # CRUD with id_empresa
    - "contexto.md"                               # Architecture section

  # Key rules this skill enforces
  rules:
    - id: mt-001
      description: "All queries must filter by id_empresa"
      severity: error
      check: "query.includes('id_empresa') || query.includes('WHERE')"
      file_pattern: "backend/*.js"

    - id: mt-002
      description: "No cross-tenant data access"
      severity: error
      check: "!code.includes('WHERE') || code.includes('id_empresa')"
      file_pattern: "backend/*.js"

  # Examples (loaded only when skill is actively used)
  examples:
    - scenario: "Filtering leads by tenant"
      correct: |
        const data = getSheetData(ss, 'Leads', id_empresa);
      incorrect: |
        const data = getSheetData(ss, 'Leads');

  # How this skill is validated
  validation:
    - "Every database query includes id_empresa filtering"
    - "No hardcoded tenant IDs"
    - "RBAC checks before data access"
```

### 9.4 Auto-Discovery

1. Skills in `.suit/skills/` are automatically indexed by the Registry
2. Each skill declares `triggers` — keywords, file patterns, and contexts that activate it
3. When a workflow loads, the registry matches required skills by name
4. When context is loaded, skills matching the current file patterns are suggested
5. Skills can be explicitly required by workflows or implicitly discovered by context

### 9.5 Skill Versioning

Each skill has a semantic version. When a skill is updated:
1. Bump version in the skill YAML
2. Update `registry/skills.yaml` with new version
3. Workflows can specify `>=1.0.0` version constraints
4. Registry validates version compatibility at load time

---

## 10. Reviewer — The Validation Pipeline

### 10.1 Purpose

The Reviewer is a configurable validation pipeline that checks code, architecture, security, and style before changes are committed. It is not a single reviewer but a pipeline of specialized reviewers.

### 10.2 Structure

```yaml
# reviewer/profiles.yaml
profiles:
  # Quick check — runs on every change
  quick:
    checks:
      - id: syntax
        description: "Basic syntax validation"
        severity: error

      - id: secrets
        description: "No hardcoded API keys or secrets"
        severity: error
        patterns:
          - "api_key"
          - "API_KEY"
          - "sk-"                           # Stripe key pattern
          - "service_role"
        exclude:
          - ".env.example"

      - id: debug
        description: "No debug code left in"
        severity: warning
        patterns:
          - "console.log"
          - "debugger"
          - "TODO"
          - "FIXME"

  # Standard — runs on medium risk workflows
  standard:
    extends: quick
    checks:
      - id: multi-tenant
        description: "Multi-tenant isolation preserved"
        severity: error
        checks:
          - "All new queries filter by id_empresa"
          - "No removal of existing id_empresa filters"

      - id: soft-delete
        description: "No physical DELETE statements"
        severity: error
        patterns:
          - "DELETE FROM"
          - "DELETE "
        exclude:
          - "*.sql"                         # SQL migration files
          - "scripts/"

      - id: ids
        description: "Sequential IDs maintained (no UUIDs)"
        severity: warning
        checks:
          - "New IDs follow PREFIX-NNN pattern"

  # Architecture — runs on high risk workflows
  architecture:
    extends: standard
    checks:
      - id: architecture
        description: "Architecture consistency check"
        severity: error
        checks:
          - "No new frontend frameworks"
          - "No new backend patterns without review"
          - "No CORS mode added to GAS fetches"

      - id: csp
        description: "CSP/Helmet compatibility"
        severity: warning
        checks:
          - "New external domains added to CSP"
          - "Helmet not accidentally disabled"

      - id: server-routing
        description: "Server routing impact"
        severity: error
        checks:
          - "No conflicts with existing routes"
          - "Webhook order preserved (before express.json)"

  # Security — dedicated security review
  security:
    extends: quick
    checks:
      - id: hardcoded-keys
        description: "No hardcoded API keys or tokens"
        severity: error
        patterns:
          - "AIza"                          # Google API key pattern
          - "sk_live"
          - "sk_test"
          - "service_role"
          - "supabase_key"
        exclude:
          - ".env.example"
          - "*.json"

      - id: rbac
        description: "RBAC enforced on new routes"
        severity: error
        checks:
          - "New routes protected by role check"

      - id: input-validation
        description: "User input validated and sanitized"
        severity: warning
        checks:
          - "Input sanitization before database operations"
```

### 10.3 How Review Profiles Are Selected

1. Workflow definition specifies `required_reviewers` (e.g., `security`, `architecture`)
2. Agent type specifies `required_reviewers` (e.g., `architect` always needs `architecture` review)
3. Reviewer merges profiles: `quick` (always) + workflow reviewers + agent reviewers
4. Review runs AFTER implementation but BEFORE commit
5. Blocking checks (severity: error) must pass. Warnings are advisory.

### 10.4 Reviewer Output

```yaml
review_result:
  profile: security
  status: pass|fail|warning
  checks:
    - id: hardcoded-keys
      status: pass
      details: "No hardcoded keys found in changed files"

    - id: rbac
      status: warning
      details: "New route /api/admin/users does not check RBAC role. Suggest adding app.auth.requireRole(10)"
```

---

## 11. Memory — The Persistent Store

### 11.1 Purpose

Memory is the project's persistent knowledge base. It is NOT conversational memory. It stores structured, reusable knowledge that any agent can consult.

### 11.2 Structure

```
memory/
├── decisions/              ← Architecture Decision Records (ADRs)
│   └── 001-use-vanilla-js.md
├── bugs/                   ← Known bug database
│   └── activo-lowercase.md
├── lessons/                ← Cross-project learnings
│   ├── gas-deployment.md
│   └── multi-tenant-patterns.md
├── patterns/               ← Reusable code/architecture patterns
│   ├── dual-write.md
│   └── fallback-chain.md
├── pending/                ← Pending decisions and debt tracking
│   ├── tech-debt.yaml
│   └── roadmap.yaml
└── INDEX.md                ← Auto-generated index of all memory entries
```

### 11.3 Decision Record Format

```markdown
# ADR-001: Use Vanilla JavaScript for Frontend

## Status
Accepted (2026-01-15)

## Context
We needed a frontend framework for the SPA. Options included React, Vue, and vanilla JS.

## Decision
Use vanilla JavaScript without frameworks.

## Rationale
- Zero dependencies
- Direct deployment to GitHub Pages
- No build step
- Simplicity for the project size
- No framework churn

## Consequences
- Manual DOM manipulation required
- No component reusability
- Cannot use npm UI libraries

## Alternatives Considered
- React: Overhead for a simple SPA
- Vue: Similar overhead, learning curve for team

## Related
- contexto.md: Decisiones técnicas → Arquitectura
- AGENTS.md: Immutable rule #7
```

### 11.4 Bug Record Format

```markdown
# Bug: activo field arrives as lowercase from Supabase

## Status
Known (active)

## First Observed
2026-03-15

## Symptoms
- Records incorrectly filtered as inactive
- Boolean comparison fails

## Root Cause
Supabase returns `activo` as string `"true"` (lowercase).
Frontend compares with `"TRUE"` (uppercase).

## Fix
Normalize with `String(p.activo).toUpperCase().trim() === "TRUE"`

## Affected Files
- `js/modules/core.js` (multiple locations)
- `js/modules/admin.js`

## Related
- contexto.md: Errores conocidos → Datos y Consistencia
- AGENTS.md: Immutable rule #6
```

### 11.5 How Memory is Used

1. **Loader phase**: If workflow is `deep` strategy, memory files are loaded
2. **Planning phase**: Planner consults memory for known patterns and gotchas
3. **Review phase**: Reviewer checks that changes don't reintroduce known bugs
4. **Completion phase**: After a change, memory is updated with new learnings
5. **Audit phase**: Memory provides historical context for analysis

### 11.6 Memory Maintenance

- `decisions/` — append-only, never modified
- `bugs/` — entries can be marked `resolved` but never deleted
- `lessons/` — created when a pattern repeats across projects
- `patterns/` — created when a solution is reusable
- `pending/` — updated as debt is paid or roadmap progresses

---

## 12. Telemetry — The Observable Substrate

### 12.1 Purpose

Telemetry provides observability into the agent system. Every execution, decision, error, and token consumption is recorded for analysis, debugging, and optimization.

### 12.2 Event Schema

```yaml
# telemetry/schema.yaml
version: 1.0.0

events:
  execution_started:
    fields:
      - session_id: uuid
      - timestamp: datetime
      - workflow: string
      - project: string
      - model: string
      - user_request: string (truncated to 200 chars)
      - estimated_tokens: integer

  execution_completed:
    fields:
      - session_id: uuid
      - timestamp: datetime
      - workflow: string
      - project: string
      - model: string
      - duration_ms: integer
      - tokens_used:
          input: integer
          output: integer
          total: integer
      - files_modified:
          - path: string
            operation: string
            lines_added: integer
            lines_removed: integer
      - steps_completed: integer
      - status: success|fail|partial

  error_occurred:
    fields:
      - session_id: uuid
      - timestamp: datetime
      - workflow: string
      - step: string
      - error_type: string
      - error_message: string
      - affected_file: string (optional)

  review_completed:
    fields:
      - session_id: uuid
      - timestamp: datetime
      - profile: string
      - status: pass|fail|warning
      - failed_checks:
          - id: string
            details: string
      - warnings:
          - id: string
            details: string

  skill_loaded:
    fields:
      - session_id: uuid
      - skill: string
      - version: string
      - context_size: integer (bytes)
      - load_time_ms: integer

  registry_query:
    fields:
      - session_id: uuid
      - query_type: string (workflow|agent|skill|project|model)
      - result_count: integer
      - query_time_ms: integer
```

### 12.3 Log Format

```
telemetry/logs/
├── YYYY-MM-DD/           ← Daily directories
│   ├── sessions/         ← Full session traces
│   │   └── {session_id}.jsonl
│   ├── errors/           ← Error aggregations
│   │   └── errors.jsonl
│   └── metrics/          ← Aggregated metrics
│       └── metrics.jsonl
└── metrics/              ← Long-term aggregations
    ├── token_usage.jsonl
    └── workflow_stats.jsonl
```

### 12.4 Observable Metrics

| Metric | Source | Purpose |
|---|---|---|
| Tokens per workflow | `execution_completed` | Cost optimization |
| Duration per step | `execution_started/completed` | Performance bottlenecks |
| Error rate by workflow | `error_occurred` | Reliability |
| Review pass rate | `review_completed` | Code quality trend |
| Skill usage frequency | `skill_loaded` | Popularity / ROI |
| Model usage distribution | `execution_completed` | Cost allocation |
| Files modified per session | `execution_completed` | Change velocity |
| Registry query performance | `registry_query` | System health |

---

## 13. Complete Flow

### 13.1 Step-by-Step

```
USER: "Agrega un nuevo campo 'telefono' al formulario de leads en el módulo CampanasAi"
```

#### Step 1: Dispatcher
```
1. Parse input → keywords: ["agrega", "nuevo campo", "telefono", "formulario leads", "CampanasAi"]
2. Match routing.yaml:
   - "agrega" → feature workflow (priority 10)
   - Project keyword "CampanasAi" → override: use campanas-ai project context
3. Load registry/workflows.yaml → feature → .suit/workflows/feature.yaml
4. Load registry/projects.yaml → campanas-ai → { path, context, skills }
5. Load registry/agents.yaml → developer (feature workflow in code domain)
6. Load registry/skills.yaml → javascript (required by workflow)
7. Load registry/models.yaml → deepseek-flash (cost-sensitive, free)
8. Check registry/permissions.yaml → developer allowed for campanas-ai? Yes
9. Output: orchestration plan
```

#### Step 2: Loader
```
1. Strategy: standard (feature workflow)
2. Load AGENTS.md (root) + CampanasAi/AGENTS.md (subproject)
3. Load contexto.md (architecture reference)
4. Load INDEX_FUNCIONES.md (locate form functions)
5. Load .suit/workflows/feature.yaml
6. Load .suit/skills/javascript.yaml, .suit/skills/content-generation.yaml
7. From INDEX_FUNCIONES, find: CampanasAi/script.js lines 677 (getFormData), 711 (validateFormData)
8. Read ONLY those sections of script.js
9. Load campanas-ai context from projects.yaml: local-server-node.js, config/prompts.json
10. Output: optimized context (~5000 tokens vs ~50000 for full project)
```

#### Step 3: Planner
```
1. Analyze: "Add phone field to leads form in CampanasAi"
2. Identify files:
   - READ: CampanasAi/script.js (getFormData, validateFormData)
   - WRITE: CampanasAi/script.js (modify getFormData, modify validateFormData)
3. Risk: low (single field, no multi-tenant impact, no backend change)
4. Validation:
   - Verify form still submits correctly
   - Check phone validation
   - Update INDEX_FUNCIONES.md if function signatures changed
5. Rollback: git checkout -- CampanasAi/script.js
6. Output: plan
```

#### Step 4: Agent Execution
```
1. Read plan
2. Read identified sections of script.js
3. Modify getFormData to include phone field
4. Modify validateFormData to validate phone format
5. Run: node scripts/generate-index.js (if function signatures changed)
6. Done
```

#### Step 5: Reviewer
```
1. Profile: quick (default for low risk) + no additional reviewers specified
2. Check: syntax → pass
3. Check: secrets → pass (no keys in changed code)
4. Check: debug → pass (no console.log left)
5. Check: multi-tenant → pass (no database queries touched)
6. Output: review_result { status: pass }
```

#### Step 6: Memory Update
```
1. No new decisions or bugs
2. Optionally log to lessons if this reveals a pattern
```

#### Step 7: Telemetry
```
1. Record: execution_completed
2. Tokens used: ~4500 input, ~800 output
3. Duration: ~45s
4. Files modified: 1 (CampanasAi/script.js)
5. Steps completed: 4
6. Status: success
```

#### Step 8: Response to User
```
"✅ Campo 'teléfono' agregado al formulario de leads en CampanasAi.
- Modificado: getFormData (línea 677) para incluir el campo
- Modificado: validateFormData (línea 711) para validar formato de 10 dígitos
- INDEX_FUNCIONES.md actualizado
Riesgo: bajo. Sin impacto en multi-tenant o backend."
```

### 13.2 Flow Diagram

```
User Request
    │
    ▼
┌─────────────┐     ┌──────────────┐
│  Dispatcher  │────▶│   Registry   │
│  (scheduler) │◀────│ (all YAMLs)  │
└──────┬──────┘     └──────────────┘
       │
       │ Orchestration Plan
       ▼
┌─────────────┐
│    Loader   │────▶ Projects.yaml context
│  (context)  │────▶ Skills context_hint
└──────┬──────┘────▶ INDEX_FUNCIONES.md
       │
       │ Optimized Context
       ▼
┌─────────────┐
│   Planner   │────▶ Impact Analysis
│   (plan)    │────▶ Risk Assessment
└──────┬──────┘────▶ File Identification
       │
       │ Execution Plan
       ▼
┌─────────────┐
│   Agent     │────▶ Read → Modify → Validate
│  (execute)  │
└──────┬──────┘
       │
       │ Implementation
       ▼
┌─────────────┐     ┌──────────────┐
│  Reviewer   │────▶│   Memory     │
│ (validate)  │     │  (persist)   │
└──────┬──────┘     └──────────────┘
       │
       │ Review Result
       ▼
┌─────────────┐
│  Telemetry  │
│  (record)   │
└──────┬──────┘
       │
       ▼
  User Response
```

---

## 14. Scalability

### 14.1 Horizontal Scaling (More Skills)

| Component | How it scales |
|---|---|
| Skills | Each skill is a separate YAML file in `.suit/skills/`. Hundreds of files are fine. Registry indexes by `discoverable` flag. Loader only loads skills required by the workflow. |
| Skills discovery | Registry auto-scans `.suit/skills/` directory. No registration step needed. |

### 14.2 Vertical Scaling (More Agents)

| Component | How it scales |
|---|---|
| Agents | Each agent type is a YAML entry in `registry/agents.yaml`. Decoupled from workflows via skill-based routing. |
| Agent selection | Dispatcher selects agent based on workflow + project requirements. Adding a new agent = new YAML entry. |

### 14.3 Project Scaling (More Subprojects)

| Component | How it scales |
|---|---|
| Projects | Each subproject is a YAML entry in `registry/projects.yaml`. Its context, skills, servers, and environment are self-contained. |
| Project isolation | Dispatcher routes tasks to the correct project context. Loader loads only that project's context. |

### 14.4 Model Scaling (More AI Providers)

| Component | How it scales |
|---|---|
| Models | Each model is a YAML entry in `registry/models.yaml`. Dispatcher selects by capability + cost. |
| Provider agnosticism | Models are referenced by logical name (e.g., `claude-sonnet`), not provider-specific strings. Swapping providers = updating `models.yaml`. |

### 14.5 Workflow Scaling (More Processes)

| Component | How it scales |
|---|---|
| Workflows | Each workflow is a YAML file in `.suit/workflows/`. Routing in `registry/routing.yaml` matches intents to workflows. |
| Workflow composition | Workflows can reference other workflows as sub-steps. Complex processes are composed, not duplicated. |

### 14.6 Token Scaling (More Context)

| Component | How it scales |
|---|---|
| Context | Loader uses `strategy.yaml` to select load depth. `minimal` (~2K tokens), `standard` (~8K), `deep` (~20K). |
| Selective reading | INDEX_FUNCIONES.md enables function-level granularity. No need to read entire files. |
| Cache | `.suit/cache/` stores loaded context for session reuse. Prevents redundant loading. |

---

## 15. Migration Strategy from Current .agent/

### 15.1 Current State

```
.agent/
├── lecciones.md                → .suit/memory/lessons/
├── memory/
│   ├── checkpoint_history.md   → .suit/telemetry/logs/
│   ├── DEBUG_LOG.md            → .suit/telemetry/logs/
│   ├── estandares_inmutables.md → .suit/memory/patterns/
│   ├── lecciones.md            → .suit/memory/lessons/
│   └── soluciones.md           → .suit/memory/lessons/
├── rules/
│   └── restricciones-de-modo-visual.md → .suit/memory/patterns/
└── workflows/
    ├── 1commit.md              → .suit/workflows/commit.yaml (sub-step)
    ├── 1Consulta.md            → .suit/skills/system/registry-query.yaml
    ├── 1DeployAll.md           → .suit/workflows/deploy.yaml
    ├── 1GAS.md                 → .suit/workflows/deploy.yaml (sub-step)
    ├── 1LandingJSON.md         → .suit/workflows/feature.yaml (sub-step)
    ├── 1migrar-supabase.md     → .suit/workflows/migration.yaml
    ├── 1RespZip.md             → .suit/workflows/deploy.yaml (sub-step)
    ├── 1subiraprod.md          → .suit/workflows/deploy.yaml (sub-step)
    ├── backend-core.md         → .suit/skills/domain/ (content)
    ├── checkpoint.md           → .suit/workflows/ (consolidated)
    ├── delivery_flow_v2.md     → .suit/workflows/ (consolidated)
    ├── estandar-crud.md        → .suit/skills/process/ (pattern)
    ├── estandar-landing.md     → .suit/workflows/ (consolidated)
    ├── evaluador.md            → .suit/reviewer/profiles.yaml
    ├── flujo-ventas.md         → .suit/workflows/ (consolidated)
    ├── manual-operativo.md     → .suit/workflows/ (consolidated)
    ├── optimizacion-recursos.md → .suit/memory/lessons/
    ├── orquestador.md          → .suit/dispatcher/entrypoint.md
    ├── planeacion.md           → .suit/planner/template.yaml
    ├── reglas-negocio.md       → .suit/knowledge/ (consolidated)
    └── Solucionesdocumentadas.md → .suit/memory/lessons/
```

### 15.2 Migration Phases

| Phase | What | Preserves |
|---|---|---|
| 1. Create structure | Create `.suit/` with all directories | Existing `.agent/` untouched |
| 2. Populate registry | Create all YAML files in `registry/` | Existing workflows still work |
| 3. Migrate workflows | Convert `.agent/workflows/*` to `.suit/workflows/*.yaml` | Both coexist during migration |
| 4. Migrate memory | Copy `.agent/lecciones.md`, `.agent/memory/*` to `.suit/memory/` | Dual-read during transition |
| 5. Remove `.agent/` | Only after all consumers use `.suit/` | Cleanup |

### 15.3 Coexistence

During migration, `.agent/` and `.suit/` coexist. The Loader checks both:
1. First, check `.suit/` for the requested entity
2. If not found, fall back to `.agent/`
3. This allows gradual migration without breaking existing workflows

---

## 16. Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Create `.suit/` directory structure with empty YAML schemas

**Tasks**:
- [ ] Create `.suit/` directory tree
- [ ] Create `registry/agents.yaml` with 2-3 agent types
- [ ] Create `registry/skills.yaml` with 5-10 skills (from existing patterns)
- [ ] Create `registry/workflows.yaml` with index
- [ ] Create `registry/projects.yaml` with existing subprojects
- [ ] Create `registry/models.yaml` with currently used models
- [ ] Create `config/kernel.yaml` with global settings

**Validation**: `tree .suit/` shows complete structure. All YAML files are valid.

### Phase 2: Registry Population (Week 2)
**Goal**: Populate all registry YAML files with real content

**Tasks**:
- [ ] Populate `registry/routing.yaml` with intent patterns
- [ ] Populate `registry/permissions.yaml` with RBAC rules
- [ ] Create `workflows/feature.yaml`, `bugfix.yaml`, `audit.yaml` (3 core workflows)
- [ ] Create first 3 skills: `system-analysis`, `multi-tenant`, `javascript`
- [ ] Create `reviewer/profiles.yaml` with quick and standard profiles
- [ ] Create `loader/strategy.yaml` with 3 load strategies

**Validation**: Each YAML can be parsed. Registry has no missing dependencies.

### Phase 3: Memory Seed (Week 3)
**Goal**: Migrate existing knowledge into `.suit/memory/`

**Tasks**:
- [ ] Migrate `.agent/lecciones.md` → `.suit/memory/lessons/`
- [ ] Create 5 ADRs from existing decisions in `contexto.md`
- [ ] Create known bug records from `contexto.md` errores conocidos
- [ ] Create pattern records from existing patterns
- [ ] Create `pending/tech-debt.yaml` from all `[PENDIENTE]` items

**Validation**: Every `[PENDIENTE]` in `contexto.md` is tracked in tech-debt.

### Phase 4: Planner & Dispatcher (Week 4)
**Goal**: Create the orchestration logic

**Tasks**:
- [ ] Create `dispatcher/entrypoint.md` with decision algorithm
- [ ] Create `planner/template.yaml` with plan structure
- [ ] Document how Dispatcher and Planner interact
- [ ] Create `INDEX.md` in `.suit/` as entry point

**Validation**: Given a sample request, the documented flow produces a valid orchestration plan.

### Phase 5: Reviewer & Telemetry (Week 5)
**Goal**: Create validation and observability

**Tasks**:
- [ ] Expand `reviewer/profiles.yaml` with architecture and security profiles
- [ ] Create `telemetry/schema.yaml` with all event types
- [ ] Create first telemetry records (manual, for reference)
- [ ] Create `logs/.gitkeep` and ensure logs directory is gitignored except for .gitkeep

**Validation**: Reviewer profiles cover all risk levels. Schema validates.

### Phase 6: First Active Workflow (Week 6)
**Goal**: Use SuitOS for a real task

**Tasks**:
- [ ] Run `research` workflow using SuitOS structure
- [ ] Run `audit` workflow on a module
- [ ] Run `bugfix` workflow on a known bug
- [ ] Record telemetry for each run

**Validation**: 3 real tasks completed using SuitOS-defined workflows. Lessons documented.

### Phase 7: Migration Complete (Week 7-8)
**Goal**: Full migration from `.agent/` to `.suit/`

**Tasks**:
- [ ] Migrate remaining `.agent/workflows/` to `.suit/workflows/`
- [ ] Update AGENTS.md to reference `.suit/` as primary architecture
- [ ] Add `.agent/` to deprecation notice
- [ ] Create `.suit/docs/AGENTS_INTEGRATION.md` explaining how tools consume `.suit/`

**Validation**: No active references to `.agent/` remain in daily workflow.

### Phase 8: Tool Integration (Week 9-10)
**Goal**: Connect `.suit/` to actual tooling

**Tasks**:
- [ ] Create OpenCode-specific bridge in `.opencode/` that reads `.suit/registry/`
- [ ] Document how Claude Code can leverage `.suit/` via AGENTS.md references
- [ ] Create `scripts/generate-suit-index.js` (like generate-index.js but for `.suit/`)
- [ ] Add `@suit` command in `.opencode/commands/` for SuitOS queries

**Validation**: `@suit registry` returns registry contents. `@suit workflow feature` prints feature workflow.

---

## Appendix A: Comparison of Design Alternatives

### A.1 Single YAML vs Directory of YAMLs

| Criteria | Single mega YAML | Directory of YAMLs |
|---|---|---|
| **Navigation** | Hard (scroll through 1000 lines) | Easy (grep specific file) |
| **Merge conflicts** | High (same file edited) | Low (different files) |
| **Discovery** | Manual grep | `ls`, glob patterns |
| **Loading** | Load everything | Load only what's needed |
| **Git diffs** | Large diffs | Small, targeted diffs |
| **Decision** | ❌ | ✅ **Selected** |

### A.2 YAML vs TOML vs JSON vs Markdown

| Criteria | YAML | TOML | JSON | Markdown |
|---|---|---|---|---|
| **Human readability** | Excellent | Good | Poor (no comments) | Excellent |
| **Structured data** | Excellent | Good | Excellent | Poor |
| **Git diff** | Excellent | Good | Poor (no trailing commas) | Good |
| **Comments** | ✅ (#) | ✅ (#) | ❌ | ✅ |
| **Nested structures** | Native | Tables needed | Native | Manual |
| **Decision** | ✅ **Selected** | ❌ | ❌ | ❌ (docs only) |

### A.3 Function-Level Loading vs File-Level Loading

| Criteria | Function-level | File-level |
|---|---|---|
| **Token efficiency** | High (read only relevant lines) | Low (read entire files) |
| **Complexity** | Higher (needs INDEX) | Lower (just read the file) |
| **Accuracy** | Needs precise line numbers | Always accurate |
| **When to use** | Large files (>200 lines) | Small files (<100 lines) |
| **Decision** | ✅ **Both** — Loader chooses based on file size and INDEX availability |

### A.4 Hardcoded Dispatcher vs Registry-Driven Dispatcher

| Criteria | Hardcoded | Registry-driven |
|---|---|---|
| **Simplicity** | High (if/else) | Lower (indirection) |
| **Extensibility** | Low (edit code) | High (add YAML) |
| **Auditability** | Low (logic hidden in code) | High (rules visible in YAML) |
| **Testability** | Low | High (YAML validation) |
| **Decision** | ❌ | ✅ **Selected** |

### A.5 File-Based Storage vs SQLite

| Criteria | YAML files | SQLite |
|---|---|---|
| **Dependency** | None | SQLite runtime |
| **Git-friendly** | ✅ Yes | ❌ Binary diffs |
| **Queryability** | Manual (grep) | SQL queries |
| **Relations** | Manual references | Foreign keys |
| **PR review** | Line-level diffs | ❌ Binary |
| **Decision** | ✅ **Selected** | ❌ |


## Appendix B: Glossary (SuitOS-specific)

| Term | Definition |
|---|---|
| **Agent** | A role with a specific capability set (e.g., `developer`, `architect`) |
| **Dispatcher** | Kernel scheduler that routes requests to workflows |
| **Kernel** | The core of SuitOS (`.suit/` directory) — provides primitives, not applications |
| **Loader** | Context manager that minimizes token consumption |
| **Memory** | Persistent, structured project knowledge |
| **Orchestration Plan** | Output of the Dispatcher — what to run, how, and with what |
| **Planner** | Pre-execution impact and risk analyzer |
| **Registry** | Declarative knowledge base — the heart of SuitOS |
| **Reviewer** | Validation pipeline that checks changes before commit |
| **Skill** | A reusable capability module (domain, language, tool, or process) |
| **Telemetry** | Observability substrate for monitoring and metrics |
| **Workflow** | A declarative process definition with steps, conditions, and validations |
| **Skill Auto-Discovery** | Mechanism by which the Registry finds and indexes skills automatically |
