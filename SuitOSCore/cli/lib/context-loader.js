const fs = require('fs')
const path = require('path')
const { readYamlFile } = require('./parse-yaml')

const EXCLUDE = new Set(['node_modules', '.git', '.venv', 'tmp', 'backup', 'media', 'assets'])

function estimateTokens(text) {
  return Math.ceil(Buffer.byteLength(text, 'utf8') / 4)
}

function scanFiles(projectRoot, strategy, workflowName, skillNames, projectContextFiles) {
  const configPath = path.join(projectRoot, 'SuitOSCore', 'loader', 'strategy.yaml')
  let presets = { minimal: { token_budget: 2000 }, standard: { token_budget: 8000 }, deep: { token_budget: 20000 } }

  if (fs.existsSync(configPath)) {
    const parsed = readYamlFile(configPath)
    if (parsed && parsed.strategies) {
      for (const [k, v] of Object.entries(parsed.strategies)) {
        if (presets[k]) Object.assign(presets[k], v)
      }
    }
  }

  const preset = presets[strategy] || presets.standard
  const budget = typeof preset.token_budget === 'number' ? preset.token_budget : 8000
  const includes = preset.includes || []
  const excludes = new Set([...(preset.excludes || []), ...EXCLUDE])

  const filesToLoad = []
  const includePaths = []

  for (const inc of includes) {
    let resolved = inc
      .replace('{{project}}', '')
      .replace('{{workflow}}', workflowName || 'feature')
      .replace('{{project_context_files}}', projectContextFiles || '')
    if (resolved) includePaths.push(resolved)
  }

  if (skillNames?.length) {
    for (const sk of skillNames) {
      includePaths.push(`skills/${sk}/*.yaml`)
      includePaths.push(`SuitOSCore/skills/${sk}/skill.yaml`)
    }
  }

  function walk(dir, depth = 0) {
    if (depth > 5) return
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        if (excludes.has(e.name) || e.name.startsWith('.')) continue
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full, depth + 1)
        else if (e.isFile() && /\.(js|ts|json|yaml|yml|md|html|css)$/.test(e.name)) {
          const rel = path.relative(projectRoot, full).replace(/\\/g, '/')
          const content = fs.readFileSync(full, 'utf8')
          filesToLoad.push({ path: rel, tokens: estimateTokens(content), lines: content.split('\n').length })
        }
      }
    } catch {}
  }

  walk(projectRoot)
  filesToLoad.sort((a, b) => a.tokens - b.tokens)

  let total = 0
  const selected = []
  for (const f of filesToLoad) {
    if (total + f.tokens <= budget) {
      selected.push(f)
      total += f.tokens
    } else break
  }

  return { strategy: strategy || 'standard', budget, totalTokens: total, files: selected, preset }
}

function loadReport(projectRoot, strategy, workflow, skills, contextFiles) {
  const result = scanFiles(projectRoot, strategy, workflow, skills, contextFiles)
  const strat = strategy || 'standard'
  let out = `# Contexto cargado: ${strat.toUpperCase()}\n\n`
  out += `**Presupuesto**: ${result.budget} tokens | **Usado**: ${result.totalTokens} tokens\n\n`
  out += `| Archivo | Tokens | Líneas |\n|---------|--------|--------|\n`
  for (const f of result.files) {
    out += `| \`${f.path}\` | ${f.tokens} | ${f.lines} |\n`
  }
  if (result.budget > 0) {
    out += `\n---\n*Contexto cargado al ${Math.round(result.totalTokens / result.budget * 100)}% del presupuesto*\n`
  }
  return { report: out, data: result }
}

module.exports = { scanFiles, loadReport, estimateTokens }
