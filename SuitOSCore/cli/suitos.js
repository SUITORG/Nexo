#!/usr/bin/env node
const commands = {
  plan: require('./commands/plan'),
  load: require('./commands/load'),
  dispatch: require('./commands/dispatch'),
  roadmap: require('./commands/roadmap'),
  starter: require('./commands/starter'),
  mejoras: require('./commands/mejoras'),
  arch: require('./commands/arch-review'),
  learn: require('./commands/learn'),
  guard: require('./commands/guard'),
}

const cmd = process.argv[2]
const args = process.argv.slice(3)

if (!cmd || cmd === '--help' || cmd === '-h') {
  console.log(`
  SuitOS Core CLI v1.0.0

  USO:
    npx suitos <comando> [args]

  COMANDOS:
    plan      "descripción"         Crea plan numerado con gobernanza
    load      [minimal|standard|deep]  Mide tokens y carga contexto
    dispatch  "qué necesitas"       Clasifica intención y genera plan de orquestación
    roadmap   init|add|done|status  Gestiona ROADMAP.md persistente
    starter   "nombre"              Genera PROJECT_START.md
    mejoras   "módulo"              Genera MEJORAS_<MODULO>.md
    arch      ""                    Genera ARCHITECTURE_REVIEW.md
    learn     add|list|search       Aprendizaje continuo (lecciones)
    guard     read|check|status|reset  Protege escrituras no autorizadas

  EJEMPLOS:
    npx suitos plan "crear módulo de cotizaciones"
    npx suitos load deep
    npx suitos dispatch "auditar seguridad del proyecto"
    npx suitos starter "mi-app"
    npx suitos mejoras "cotizador"
    npx suitos learn add "usuario prefiere botones redondeados"
    npx suitos guard check "src/app.js"

  DOCS: SuitOSCore/README.md
`)
  process.exit(0)
}

if (!commands[cmd]) {
  console.log(`Comando desconocido: "${cmd}". Usa npx suitos --help para ver los disponibles.`)
  process.exit(1)
}

try {
  commands[cmd].run(args)
} catch (e) {
  console.error(`Error ejecutando "${cmd}": ${e.message}`)
  process.exit(1)
}
