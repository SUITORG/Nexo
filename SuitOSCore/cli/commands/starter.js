#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function run(args) {
  const projectRoot = process.cwd()
  const projectName = args.join(' ') || path.basename(projectRoot)
  const outPath = path.join(projectRoot, 'PROJECT_START.md')

  const hasPackage = fs.existsSync(path.join(projectRoot, 'package.json'))
  const hasServer = fs.existsSync(path.join(projectRoot, 'server.js'))
  const hasIndex = fs.existsSync(path.join(projectRoot, 'index.html'))
  const hasGit = fs.existsSync(path.join(projectRoot, '.git'))
  const subdirs = fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !['node_modules'].includes(d.name))
    .map(d => d.name)

  const content = `# PROJECT START: ${projectName}

**Generado**: ${new Date().toISOString().split('T')[0]}

## Contexto

${projectName} es un proyecto ${hasServer ? 'Node.js/Express' : ''} ${hasIndex ? 'con frontend SPA' : ''}.

## Setup

\`\`\`bash
${hasPackage ? 'npm install' : '# Sin package.json'}
${hasServer ? 'node server.js' : ''}
\`\`\`

## Arquitectura

| Aspecto | Detalle |
|---------|---------|
| Backend | ${hasServer ? 'Express (server.js)' : 'Por definir'} |
| Frontend | ${hasIndex ? 'Vanilla SPA (index.html)' : 'Por definir'} |
| Git | ${hasGit ? 'Sí' : 'No inicializado'} |
| Módulos | ${subdirs.join(', ') || 'Ninguno'} |

## Próximos pasos sugeridos

1. Definir estructura de directorios
2. Configurar variables de entorno (.env)
3. Elegir base de datos y crear schema
4. Implementar primer endpoint
5. Escribir tests

## Entregables esperados

- Código fuente funcional
- Documentación técnica
- Tests automatizados

---
*Generado por SuitOS Core — npx suitos starter*
`
  fs.writeFileSync(outPath, content, 'utf8')
  console.log(`PROJECT_START.md creado en ${outPath}`)
}

module.exports = { run }
