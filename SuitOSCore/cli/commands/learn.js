#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const MEMO_DIR = '.suit/memory'

function ensureDir(projectRoot) {
  fs.mkdirSync(path.join(projectRoot, MEMO_DIR), { recursive: true })
}

function lessonsPath(projectRoot) {
  return path.join(projectRoot, MEMO_DIR, 'lecciones.yaml')
}

function loadLessons(projectRoot) {
  const lp = lessonsPath(projectRoot)
  if (!fs.existsSync(lp)) return []
  const text = fs.readFileSync(lp, 'utf8')
  const lessons = []
  let current = null
  for (const line of text.split('\n')) {
    if (line.startsWith('-')) {
      if (current) lessons.push(current)
      current = {}
    } else if (current) {
      const match = line.match(/^\s{2,}(\w+):\s*(.+)$/)
      if (match) current[match[1]] = match[2].replace(/^"(.*)"$/, '$1')
    }
  }
  if (current) lessons.push(current)
  return lessons
}

function saveLessons(projectRoot, lessons) {
  const lines = lessons.map(l => {
    const entries = Object.entries(l).map(([k, v]) => `  ${k}: "${v}"`).join('\n')
    return `-\n${entries}`
  })
  fs.writeFileSync(lessonsPath(projectRoot), lines.join('\n') + '\n', 'utf8')
}

function run(args) {
  const action = args[0]
  const projectRoot = process.cwd()

  if (action === 'add') {
    const desc = args.slice(1).join(' ')
    if (!desc) { console.log('Uso: npx suitos learn add "lo que aprendiste"'); return }
    ensureDir(projectRoot)
    const lessons = loadLessons(projectRoot)
    lessons.push({
      leccion: desc,
      fecha: new Date().toISOString().split('T')[0],
      contexto: path.basename(projectRoot),
    })
    saveLessons(projectRoot, lessons)
    console.log(`Lección guardada: ${desc}`)
    return
  }

  if (action === 'list') {
    const lessons = loadLessons(projectRoot)
    if (!lessons.length) { console.log('No hay lecciones registradas.'); return }
    console.log(`\n  Lecciones (${lessons.length}):\n`)
    for (const l of lessons) {
      console.log(`  - ${l.leccion || '(sin descripción)'} (${l.fecha || '? '})`)
    }
    console.log()
    return
  }

  if (action === 'search') {
    const term = args.slice(1).join(' ').toLowerCase()
    if (!term) { console.log('Uso: npx suitos learn search "término"'); return }
    const lessons = loadLessons(projectRoot)
    const found = lessons.filter(l => JSON.stringify(l).toLowerCase().includes(term))
    if (!found.length) { console.log(`No se encontraron lecciones para: "${term}"`); return }
    console.log(`\n  Lecciones encontradas (${found.length}):\n`)
    for (const l of found) {
      console.log(`  - ${l.leccion} (${l.fecha})`)
    }
    console.log()
    return
  }

  console.log('Uso: npx suitos learn add "lección" | list | search "término"')
}

module.exports = { run }
