const fs = require('fs')

function parseScalar(v) {
  if (v === '' || v === '~' || v === 'null') return null
  if (v === 'true') return true
  if (v === 'false') return false
  const num = Number(v)
  if (!isNaN(num) && v !== '') return num
  return v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
}

function parseYaml(text) {
  const lines = text.split('\n')
  const root = {}
  const path = [root]
  const indents = [-1]

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '  ')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const indent = line.length - line.trimStart().length

    while (indents.length > 1 && indent <= indents[indents.length - 1]) {
      path.pop()
      indents.pop()
    }

    let parent = path[path.length - 1]
    const isListItem = trimmed.startsWith('- ')
    const content = isListItem ? trimmed.slice(2).trim() : trimmed
    const colonIdx = content.indexOf(':')
    const key = colonIdx >= 0 ? content.slice(0, colonIdx).trim() : null
    const val = colonIdx >= 0 ? content.slice(colonIdx + 1).trim() : content

    if (isListItem && !key && val) {
      if (!Array.isArray(parent)) {
        const arr = []
        const pp = path.length > 1 ? path[path.length - 2] : root
        const lastKey = Object.keys(pp).find(k => pp[k] === parent)
        if (lastKey) { pp[lastKey] = arr; parent = arr; path[path.length - 1] = arr }
      }
      parent.push(parseScalar(val))
      continue
    }

    if (isListItem && key) {
      if (!Array.isArray(parent)) {
        const arr = []
        const pp = path.length > 1 ? path[path.length - 2] : root
        const lastKey = Object.keys(pp).find(k => pp[k] === parent)
        if (lastKey) { pp[lastKey] = arr; parent = arr; path[path.length - 1] = arr }
      }
      const child = {}
      parent.push(child)
      path.push(child)
      indents.push(indent)
      parent = child
    }

    const parsed = parseScalar(val)
    if (parsed !== null) {
      if (key) parent[key] = parsed
    } else {
      if (key) {
        const child = Array.isArray(parent) ? parent[parent.length - 1] : {}
        parent[key] = child
        if (!Array.isArray(parent) || parent[parent.length - 1] === child) {
          path.push(child)
          indents.push(indent)
        }
      }
    }
  }

  return root
}

function readYamlFile(filePath) {
  try {
    return parseYaml(fs.readFileSync(filePath, 'utf8'))
  } catch { return {} }
}

module.exports = { parseYaml, readYamlFile }
