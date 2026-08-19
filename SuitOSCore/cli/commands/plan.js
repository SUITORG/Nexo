#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { readYamlFile } = require('../lib/parse-yaml')
const { createPlan } = require('../lib/plan-manager')

function run(args) {
  const description = args.join(' ')
  if (!description) {
    console.log('Uso: npx suitos plan "describe lo que necesitas hacer"')
    process.exit(1)
  }

  const projectRoot = process.cwd()
  const suitosRoot = path.join(projectRoot, 'SuitOSCore')
  const tmplPath = path.join(suitosRoot, 'planner', 'template.yaml')

  let template = { plan: {} }
  if (fs.existsSync(tmplPath)) {
    template = readYamlFile(tmplPath)
  }

  const governance = template.plan?.governance || {}
  const rules = governance.rules || []

  const planData = {
    title: description,
    type: 'task',
    risk: 'medium',
    workflow: 'feature',
    summary: description,
    impact: ['Por determinar tras análisis'],
    dependencies: [],
    files: { read: [], write: [] },
    validation: { steps: ['node --check <files>', 'Verificar tenant isolation'], expected_outcomes: [] },
    phases: [{ name: 'Fase 1', tasks: [{ content: description, status: 'pending' }] }],
    estimated_cost: { input_tokens: 5000, output_tokens: 2000, model: 'claude-sonnet-4' },
  }

  const result = createPlan(projectRoot, description, planData)
  const planPath = path.join('.opencode/plans/pending', result.id)

  console.log('\n========================================')
  console.log('  PLAN GENERADO')
  console.log('========================================\n')
  console.log(`  ID:        ${result.id}`)
  console.log(`  Título:    ${description}`)
  console.log(`  Riesgo:    ${planData.risk}`)
  console.log(`  Ubicación: ${planPath}/\n`)
  console.log('  Archivos:')
  console.log(`    metadata.json       - metadatos del plan`)
  console.log(`    specifications.md   - specs detalladas`)
  console.log(`    implementation.md   - lista de tareas\n`)

  if (rules.length) {
    console.log('  Gobernanza activa:')
    for (const r of rules) {
      const desc = typeof r === 'object' ? (r.description || JSON.stringify(r)) : r
      console.log(`    ${r.id || ''}: ${desc}`)
    }
    console.log()
  }

  console.log('  ¿Apruebas este plan? Responde APROBADO o RECHAZADO.')
  console.log('========================================\n')
}

module.exports = { run }
