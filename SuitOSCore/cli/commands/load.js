#!/usr/bin/env node
const path = require('path')
const { loadReport } = require('../lib/context-loader')

function run(args) {
  const strategy = args[0] || 'standard'
  const valid = ['minimal', 'standard', 'deep']
  if (!valid.includes(strategy)) {
    console.log('Estrategias válidas: minimal (2K), standard (8K), deep (20K)')
    console.log('Uso: npx suitos load [minimal|standard|deep]')
    process.exit(1)
  }

  const projectRoot = process.cwd()
  const result = loadReport(projectRoot, strategy)

  console.log('\n========================================')
  console.log('  CONTEXTO CARGADO')
  console.log('========================================\n')
  console.log(`  Estrategia: ${strategy.toUpperCase()}`)
  console.log(`  Presupuesto: ${result.data.budget} tokens`)
  console.log(`  Usado: ${result.data.totalTokens} tokens`)
  console.log(`  Archivos cargados: ${result.data.files.length}\n`)
  console.log(`  ${result.report}`)
}

module.exports = { run }
