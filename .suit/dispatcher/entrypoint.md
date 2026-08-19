# Dispatcher Entrypoint

## Purpose
Single entry point for all agent orchestration. Receives user request, consults Registry, produces Orchestration Plan.

## Algorithm

```
1. PARSE REQUEST
   - Normalize input (lowercase, trim)
   - Extract keywords and project hints

2. MATCH INTENT (routing.yaml)
   - For each intent in routing.intents:
     a. Check if ANY pattern is substring of normalized input
     b. Collect matches with priorities
   - Select highest priority match (tie: longest pattern)
   - Check routing.overrides for project+keyword matches

3. LOOKUP WORKFLOW (workflows.yaml)
   - Get workflow path from matched workflow name
   - Load workflow definition

4. RESOLVE AGENT (agents.yaml)
   - Get agent from workflow.agent or project.agent_override
   - Validate agent exists and has required skills

5. RESOLVE SKILLS (skills.yaml)
   - Combine: workflow.required_skills + agent.required_skills + project.skills
   - Deduplicate, resolve dependencies topologically

6. RESOLVE PROJECT (projects.yaml)
   - Match by project path or keyword
   - Validate project exists
   - Extract: context files, tables, environment, validation rules

7. CHECK PERMISSIONS (permissions.yaml)
   - Get role from agent or context
   - Check allowed_workflows, allowed_projects, max_risk
   - Check operation-specific rules (requires_review, notify, giro_validation)

8. SELECT MODEL (models.yaml)
   - Filter by workflow.domain and agent.capabilities
   - Prefer: lower cost for simple tasks, higher quality for architecture/review
   - Fallback chain if primary unavailable

9. VALIDATE PROJECT ACCESS (if giro_validation required)
   - Fetch Config_Empresas for current id_empresa
   - Check giro_especifico field:
     a. If null/empty/undefined → DENY (unless fallback=true)
     b. If matches enable_pattern (",1$") → ALLOW
     c. Else → DENY with error_message

10. PRODUCE ORCHESTRATION PLAN
    {
      workflow: "workflow_name",
      project: "project_name",
      agent: "agent_name",
      model: { provider, model, reason },
      skills: ["skill1", "skill2"],
      context_to_load: ["file1", "file2", "INDEX_FUNCIONES.md"],
      reviewers: ["reviewer1", "reviewer2"],
      permissions: { allowed: true, requires_confirmation: true, risk_level: "medium" },
      project_validation: { giro_checked: true, giro_valid: true }
    }
```

## Error Handling

- No intent match → workflow: research, agent: researcher
- No project match → project: root
- Permission denied → return error with reason
- Giro validation failed → return error with project_validation.error_message
- Registry parse error → fallback to hardcoded defaults (log error)

## Integration Points

- Called by: User interface, CLI, API endpoint
- Consumes: All registry YAML files
- Produces: Orchestration Plan (passed to Loader)