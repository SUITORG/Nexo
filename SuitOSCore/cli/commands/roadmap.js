#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function run(args) {
  const action = args[0] || 'status'
  const projectRoot = process.cwd()
  const roadmapPath = path.join(projectRoot, 'ROADMAP.md')

  if (action === 'init') {
    const template = `# Roadmap: ${projectRoot.split(path.sep).pop()}

## Pendiente
_No hay tareas registradas_

## En progreso
_No hay tareas en progreso_

## Completado
_No hay tareas completadas_

---
*Generado por SuitOS Core. Actualiza con: npx suitos roadmap add "descripción"*
`
    fs.writeFileSync(roadmapPath, template, 'utf8')
    console.log(`ROADMAP.md creado en ${roadmapPath}`)
    return
  }

  if (action === 'add') {
    const task = args.slice(1).join(' ')
    if (!task) { console.log('Uso: npx suitos roadmap add "descripción de la tarea"'); return }
    if (!fs.existsSync(roadmapPath)) { run(['init']) }

    let content = fs.readFileSync(roadmapPath, 'utf8')
    const date = new Date().toISOString().split('T')[0]
    const entry = `- [ ] ${task} (${date})`

    if (content.includes('## Pendiente\n_No hay tareas registradas_')) {
      content = content.replace('## Pendiente\n_No hay tareas registradas_', `## Pendiente\n\n${entry}`)
    } else {
      const idx = content.indexOf('## Pendiente')
      const endIdx = content.indexOf('\n## ', idx + 12)
      const section = endIdx === -1 ? content.slice(idx) : content.slice(idx, endIdx)
      content = content.slice(0, idx) + `## Pendiente\n\n${entry}\n` + content.slice(idx + section.length)
    }

    fs.writeFileSync(roadmapPath, content, 'utf8')
    console.log(`Tarea agregada a ROADMAP.md: ${task}`)
    return
  }

  if (action === 'done') {
    const task = args.slice(1).join(' ')
    if (!task) { console.log('Uso: npx suitos roadmap done "descripción exacta"'); return }
    if (!fs.existsSync(roadmapPath)) { console.log('No hay ROADMAP.md. Crea uno con: npx suitos roadmap init'); return }

    let content = fs.readFileSync(roadmapPath, 'utf8')
    const date = new Date().toISOString().split('T')[0]
    const wasInProgress = content.includes(`- [ ] ${task}`) || content.includes(`- [/] ${task}`)

    content = content.replace(`- [ ] ${task}`, `- [x] ${task} (completado: ${date})`)
    content = content.replace(`- [/] ${task}`, `- [x] ${task} (completado: ${date})`)

    if (content !== fs.readFileSync(roadmapPath, 'utf8')) {
      fs.writeFileSync(roadmapPath, content, 'utf8')
      console.log(`Tarea marcada como completada: ${task}${wasInProgress ? '' : ' (nota: no estaba en pendientes, se agregó igual)'}`)
    } else {
      console.log(`No se encontró la tarea: "${task}". Usa el texto exacto de ROADMAP.md.`)
    }
    return
  }

  if (action === 'status') {
    if (!fs.existsSync(roadmapPath)) {
      console.log('No hay ROADMAP.md aún. Crea uno con: npx suitos roadmap init')
      return
    }
    const content = fs.readFileSync(roadmapPath, 'utf8')
    const pending = (content.match(/- \[ \]/g) || []).length
    const inProgress = (content.match(/- \[\/\]/g) || []).length
    const done = (content.match(/- \[x\]/g) || []).length
    console.log(`\n  ROADMAP.md — ${pending} pendientes, ${inProgress} en progreso, ${done} completados\n`)
    return
  }

  console.log('Comandos: init, add "tarea", done "tarea", status')
}

module.exports = { run }
