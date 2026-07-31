const path = require('path')
const fs = require('fs')
const { readYamlFile } = require('./parse-yaml')

function resolveSuitosRoot(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'SuitOSCore'),
    path.join(projectRoot, 'node_modules', 'suitos-core'),
    path.join(projectRoot, '..', 'SuitOSCore'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'registry', 'routing.yaml'))) return c
    if (fs.existsSync(path.join(c, 'dispatcher', 'entrypoint.md'))) return c
  }
  return path.join(projectRoot, 'SuitOSCore')
}

function collectRegistry(suitosRoot) {
  const base = path.join(suitosRoot, 'registry')
  return {
    routing: fs.existsSync(path.join(base, 'routing.yaml')) ? readYamlFile(path.join(base, 'routing.yaml')) : { intents: [] },
    workflows: fs.existsSync(path.join(base, 'workflows.yaml')) ? readYamlFile(path.join(base, 'workflows.yaml')) : { workflows: [] },
    agents: fs.existsSync(path.join(base, 'agents.yaml')) ? readYamlFile(path.join(base, 'agents.yaml')) : { agents: [] },
    models: fs.existsSync(path.join(base, 'models.yaml')) ? readYamlFile(path.join(base, 'models.yaml')) : { models: [] },
  }
}

function findIntent(routing, input) {
  const normalized = input.toLowerCase().trim()
  const intents = routing.intents || []
  let best = null
  let bestScore = -1

  for (const intent of intents) {
    const patterns = intent.patterns || [intent.name || '']
    for (const p of patterns) {
      if (normalized.includes(p.toLowerCase())) {
        const score = p.length
        if (score > bestScore) {
          bestScore = score
          best = intent
        }
      }
    }
  }
  return best || { name: 'research', workflow: 'research', description: 'No match found' }
}

function findWorkflow(registry, name) {
  const workflows = registry.workflows || {}
  return workflows[name] || { risk: 'low', agent: 'architect' }
}

function findAgent(registry, name) {
  const agents = registry.agents || {}
  return agents[name] || { required_skills: [] }
}

function dispatch(projectRoot, input) {
  const suitosRoot = resolveSuitosRoot(projectRoot)
  const registry = collectRegistry(suitosRoot)

  const intent = findIntent(registry, input)
  const workflow = findWorkflow(registry, intent.workflow || intent.name)
  const agent = findAgent(registry, workflow.agent || 'architect')
  const requiredSkills = [...new Set([
    ...(workflow.required_skills || []),
    ...(agent.required_skills || []),
    ...(intent.skills_override || []),
  ])]

  const models = registry.models || {}
  const modelEntries = Object.keys(models).map(k => ({ key: k, ...models[k] }))
  const selectedModel = (workflow.risk === 'high' ? modelEntries.find(m => m.preferred_for?.includes('architecture')) : modelEntries.find(m => m.preferred_for?.includes('cost-sensitive'))) || modelEntries[0]

  return {
    intent: intent.name || 'unknown',
    workflow: intent.workflow || 'research',
    agent: intent.agent || workflow.agent || 'architect',
    risk: workflow.risk || 'low',
    skills: requiredSkills,
    model: selectedModel ? { provider: selectedModel.provider, model: selectedModel.name } : null,
    contextStrategy: workflow.risk === 'high' ? 'deep' : workflow.risk === 'medium' ? 'standard' : 'minimal',
    project: projectRoot.split(path.sep).pop(),
  }
}

module.exports = { dispatch, resolveSuitosRoot }
