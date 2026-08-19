#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const STATE_FILE = '.opencode/.suitos-guard.json'

function getState(projectRoot) {
  const p = path.join(projectRoot, STATE_FILE)
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true })
  if (!fs.existsSync(p)) return { readFiles: [], blockedWrites: [] }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return { readFiles: [], blockedWrites: [] } }
}

function saveState(projectRoot, state) {
  fs.mkdirSync(path.join(projectRoot, path.dirname(STATE_FILE)), { recursive: true })
  fs.writeFileSync(path.join(projectRoot, STATE_FILE), JSON.stringify(state, null, 2), 'utf8')
}

function run(args) {
  const action = args[0]
  const projectRoot = process.cwd()
  const state = getState(projectRoot)

  if (action === 'read') {
    const filePath = args.slice(1).join(' ')
    if (!filePath) { console.log('Uso: npx suitos guard read "ruta/del/archivo.js"'); return }
    const normalized = filePath.replace(/\\/g, '/')
    if (!state.readFiles.includes(normalized)) {
      state.readFiles.push(normalized)
      saveState(projectRoot, state)
    }
    console.log(`📖 Registrado como leído: ${normalized}`)
    return
  }

  if (action === 'check') {
    const filePath = args.slice(1).join(' ')
    if (!filePath) { console.log('Uso: npx suitos guard check "ruta/del/archivo.js"'); return }
    const normalized = filePath.replace(/\\/g, '/')
    if (state.readFiles.includes(normalized)) {
      console.log(`✅ Permitido: ${normalized} fue leído antes de escribir`)
      return true
    }
    console.log(`🔒 BLOQUEADO: ${normalized} no fue leído en esta sesión`)
    console.log(`  Ejecuta: npx suitos guard read "${normalized}"`)
    console.log(`  Luego intenta de nuevo.`)
    state.blockedWrites.push({ file: normalized, when: new Date().toISOString() })
    saveState(projectRoot, state)
    return false
  }

  if (action === 'status') {
    console.log(`\n  Archivos leídos: ${state.readFiles.length}`)
    for (const f of state.readFiles) console.log(`    ✅ ${f}`)
    console.log(`  Escrituras bloqueadas: ${state.blockedWrites.length}`)
    for (const b of state.blockedWrites) console.log(`    🔒 ${b.file} (${b.when})`)
    console.log()
    return
  }

  if (action === 'reset') {
    saveState(projectRoot, { readFiles: [], blockedWrites: [] })
    console.log('Estado del guard reseteado.')
    return
  }

  console.log('Uso:')
  console.log('  npx suitos guard read "archivo"    — registra archivo como leído')
  console.log('  npx suitos guard check "archivo"   — verifica si puede escribirse')
  console.log('  npx suitos guard status            — muestra estado')
  console.log('  npx suitos guard reset             — limpia registro')
}

module.exports = { run }
