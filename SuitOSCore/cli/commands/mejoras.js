#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function run(args) {
  const moduleName = args.join(' ') || 'proyecto'
  const projectRoot = process.cwd()
  const slug = moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const outPath = path.join(projectRoot, `MEJORAS_${slug.toUpperCase()}.md`)

  const fileCount = []
  function walk(dir, depth = 0) {
    if (depth > 3) return
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const e of entries) {
        if (e.name.startsWith('.') || ['node_modules'].includes(e.name)) continue
        const full = path.join(dir, e.name)
        if (e.isDirectory()) walk(full, depth + 1)
        else if (/\.(js|ts|html|css|json|yaml|md)$/.test(e.name)) {
          fileCount.push(path.relative(projectRoot, full))
        }
      }
    } catch {}
  }
  walk(projectRoot)

  const content = `# MEJORAS: ${moduleName}

**Generado**: ${new Date().toISOString().split('T')[0]}
**Archivos revisados**: ${fileCount.length}

## Diagnóstico rápido

- [ ] ¿El módulo tiene separación de responsabilidades (handler/service)?
- [ ] ¿Usa variables de entorno para secretos?
- [ ] ¿Tiene middleware de autenticación?
- [ ] ¿Maneja errores con try/catch?
- [ ] ¿Tiene validación de entrada?
- [ ] ¿Respeta aislamiento multi-tenant?
- [ ] ¿Usa soft delete en lugar de DELETE físico?

## Sugerencias

${fileCount.length > 0 ? `- Revisar ${fileCount.length} archivos para mejoras de calidad` : '- No se encontraron archivos de código'}
- Verificar que no haya secretos hardcodeados
- Confirmar que las APIs tengan validación

## Problemas potenciales

| Severidad | Área | Descripción |
|-----------|------|-------------|
| Alta | Seguridad | Verificar service_role key no expuesta al cliente |
| Media | Calidad | Revisar cobertura de try/catch en handlers |
| Baja | Estilo | Unificar convenciones de nombres |

---
*Generado por SuitOS Core — npx suitos mejoras "nombre-módulo"*
`
  fs.writeFileSync(outPath, content, 'utf8')
  console.log(`MEJORAS_${slug.toUpperCase()}.md creado en ${outPath}`)
}

module.exports = { run }
