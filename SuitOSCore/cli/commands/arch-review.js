#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function run(args) {
  const projectRoot = process.cwd()
  const outPath = path.join(projectRoot, 'ARCHITECTURE_REVIEW.md')

  const hasServer = fs.existsSync(path.join(projectRoot, 'server.js'))
  const hasOpenCode = fs.existsSync(path.join(projectRoot, 'opencode.json'))
  const hasSuit = fs.existsSync(path.join(projectRoot, '.suit'))
  const hasMCP = fs.existsSync(path.join(projectRoot, '.mcp.json'))
  const hasAgent = fs.existsSync(path.join(projectRoot, 'AGENTS.md'))
  const hasEnv = fs.existsSync(path.join(projectRoot, '.env'))
  const subprojects = fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('Suit') && !d.name.startsWith('.'))
    .map(d => d.name)

  let warnings = []
  if (!hasAgent) warnings.push('Falta AGENTS.md — el proyecto no tiene reglas inmutables')
  if (!hasEnv) warnings.push('Falta .env — las credenciales podrían estar hardcodeadas')
  if (subprojects.length && !hasMCP) warnings.push(`Se detectaron ${subprojects.length} subproyectos pero no hay .mcp.json raíz`)

  const content = `# REVISIÓN DE ARQUITECTURA

**Generado**: ${new Date().toISOString().split('T')[0]}
**Proyecto**: ${path.basename(projectRoot)}

## Componentes detectados

| Componente | Estado |
|------------|--------|
| Backend Express | ${hasServer ? '✅ Detectado' : '⚠️ No detectado'} |
| OpenCode config | ${hasOpenCode ? '✅ Detectado' : '⚠️ No detectado'} |
| SuitOS kernel | ${hasSuit ? '✅ Detectado' : '⚠️ No detectado'} |
| MCP servers | ${hasMCP ? '✅ Detectado' : '⚠️ No detectado'} |
| AGENTS.md | ${hasAgent ? '✅ Detectado' : '⚠️ No detectado'} |
| .env | ${hasEnv ? '✅ Detectado' : '⚠️ No detectado'} |
| Subproyectos | ${subprojects.length ? subprojects.join(', ') : 'Ninguno'} |

## Alertas

${warnings.length ? warnings.map(w => `- ⚠️ ${w}`).join('\n') : '- ✅ Sin alertas críticas'}

## Recomendaciones

1. ${hasSuit ? 'Usa npx suitos dispatch para orquestar tareas' : 'Considera adoptar SuitOS Core para gobernanza de agentes'}
2. ${hasMCP ? 'Revisa que los MCPs tengan enabled correcto en .claude/settings' : 'Configura MCP servers para herramientas externas'}
3. Ejecuta \`npx generate-index\` para tener índice de funciones
4. Corre \`npx suitos load deep\` para auditoría completa

---
*Generado por SuitOS Core — npx suitos arch-review*
`
  fs.writeFileSync(outPath, content, 'utf8')
  console.log(`ARCHITECTURE_REVIEW.md creado en ${outPath}`)
}

module.exports = { run }
