#!/usr/bin/env node
const path = require('path')
const { dispatch } = require('../lib/dispatcher')

function run(args) {
  const input = args.join(' ')
  if (!input) {
    console.log('Uso: npx suitos dispatch "describe qué necesitas hacer"')
    process.exit(1)
  }

  const projectRoot = process.cwd()
  const result = dispatch(projectRoot, input)

  console.log('\n========================================')
  console.log('  PLAN DE ORQUESTACIÓN')
  console.log('========================================\n')
  console.log(`  Intención detectada: ${result.intent}`)
  console.log(`  Workflow asignado:   ${result.workflow}`)
  console.log(`  Agente:              ${result.agent}`)
  console.log(`  Riesgo:              ${result.risk}`)
  const skills = result.skills || []
  console.log(`  Skills requeridos:   ${skills.length ? skills.join(', ') : '(ninguno)'}`)
  console.log(`  Estrategia contexto: ${result.contextStrategy}`)
  console.log(`  Proyecto:            ${result.project}\n`)

  if (result.model && result.model.provider) {
    console.log(`  Modelo sugerido:     ${result.model.provider}/${result.model.model}\n`)
  }

  console.log('  Siguiente paso:')
  console.log(`    npx suitos load ${result.contextStrategy}`)
  console.log(`    npx suitos plan "${input}"\n`)
  console.log('========================================\n')
}

module.exports = { run }
