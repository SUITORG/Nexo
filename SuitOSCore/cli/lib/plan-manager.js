const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PLANS_DIR = '.opencode/plans'

function ensureDirs(projectRoot) {
  for (const d of ['pending', 'in_progress', 'done']) {
    fs.mkdirSync(path.join(projectRoot, PLANS_DIR, d), { recursive: true })
  }
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function planId(description) {
  const hash = crypto.createHash('md5').update(description + Date.now()).digest('hex').slice(0, 8)
  return slugify(description) + '-' + hash
}

function createPlan(projectRoot, description, planData) {
  ensureDirs(projectRoot)
  const id = planId(description)
  const planDir = path.join(projectRoot, PLANS_DIR, 'pending', id)
  fs.mkdirSync(planDir, { recursive: true })

  const metadata = {
    id,
    title: planData.title || description,
    type: planData.type || 'task',
    description,
    risk: planData.risk || 'low',
    workflow: planData.workflow || 'feature',
    created: new Date().toISOString(),
    status: 'pending',
    fileCount: planData.files?.read?.length + (planData.files?.write?.length || 0) || 0,
  }

  const spec = {
    summary: planData.summary || '',
    impact: planData.impact || [],
    dependencies: planData.dependencies || [],
    files: planData.files || { read: [], write: [] },
    validation: planData.validation || { steps: [], expected_outcomes: [] },
    phases: planData.phases || [],
    estimated_cost: planData.estimated_cost || { input_tokens: 0, output_tokens: 0, model: 'unknown' },
  }

  fs.writeFileSync(path.join(planDir, 'metadata.json'), JSON.stringify(metadata, null, 2))
  fs.writeFileSync(path.join(planDir, 'specifications.md'), formatSpec(spec))

  const planContent = `# Plan: ${metadata.title}\n\n## Tareas\n\n${(planData.tasks || []).map(t => `- [${t.status === 'done' ? 'x' : ' '}] ${t.content}`).join('\n') || '*Sin tareas definidas*'}\n`
  fs.writeFileSync(path.join(planDir, 'implementation.md'), planContent)

  return { id, dir: planDir, metadata }
}

function formatSpec(spec) {
  let md = '# Especificaciones\n\n'
  if (spec.summary) md += `## Resumen\n\n${spec.summary}\n\n`
  if (spec.impact?.length) md += `## Impacto\n\n${spec.impact.map(i => `- ${i}`).join('\n')}\n\n`
  if (spec.files?.read?.length) md += `## Archivos a leer\n\n| Archivo | Razón | Líneas |\n|---------|-------|--------|\n${spec.files.read.map(f => `| \`${f.path}\` | ${f.reason || '-'} | ${f.lines || '-'} |`).join('\n')}\n\n`
  if (spec.files?.write?.length) md += `## Archivos a modificar\n\n| Archivo | Operación | Líneas estimadas |\n|---------|-----------|-----------------|\n${spec.files.write.map(f => `| \`${f.path}\` | ${f.operation || 'modify'} | ${f.estimated_lines || '-'} |`).join('\n')}\n\n`
  if (spec.validation?.steps?.length) md += `## Validación\n\n${spec.validation.steps.map(s => `- ${s}`).join('\n')}\n\n`
  if (spec.estimated_cost?.input_tokens) md += `## Costo estimado\n\n- Input tokens: ${spec.estimated_cost.input_tokens}\n- Output tokens: ${spec.estimated_cost.output_tokens}\n- Modelo: ${spec.estimated_cost.model}\n`
  return md
}

function listPlans(projectRoot, status) {
  const dir = path.join(projectRoot, PLANS_DIR, status || '')
  if (!fs.existsSync(dir)) return []
  const items = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const metaPath = path.join(dir, entry.name, 'metadata.json')
      if (fs.existsSync(metaPath)) {
        items.push({ ...JSON.parse(fs.readFileSync(metaPath, 'utf8')), dir: entry.name })
      }
    }
  }
  return items
}

function updatePlanStatus(projectRoot, id, newStatus) {
  const valid = ['pending', 'in_progress', 'done']
  if (!valid.includes(newStatus)) return false

  for (const s of valid) {
    const src = path.join(projectRoot, PLANS_DIR, s, id)
    if (fs.existsSync(src)) {
      const dst = path.join(projectRoot, PLANS_DIR, newStatus, id)
      if (s !== newStatus) {
        const metaPath = path.join(src, 'metadata.json')
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
          meta.status = newStatus
          meta.updated = new Date().toISOString()
          if (newStatus === 'done') meta.completed = new Date().toISOString()
          fs.writeFileSync(path.join(src, 'metadata.json'), JSON.stringify(meta, null, 2))
        }
        fs.renameSync(src, dst)
      }
      return true
    }
  }
  return false
}

module.exports = { createPlan, listPlans, updatePlanStatus }
