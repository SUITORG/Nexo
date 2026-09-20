/**
 * generate-index.js — Escanea SuitServiHogar y genera INDEX_FUNCIONES.md
 * Uso: node scripts/generate-index.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'INDEX_FUNCIONES.md');
const EXCLUDE = new Set(['node_modules', '.git', 'dist', '.next', 'scripts']);

function scanFiles(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE.has(entry.name)) results.push(...scanFiles(path.join(dir, entry.name), exts));
    } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function extractExports(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const exports = [];
  const pats = [
    /export\s+(?:async\s+)?function\s+(\w+)/,
    /export\s+(?:async\s+)?const\s+(\w+)/,
    /export\s+default\s+(?:function|const)\s+(\w+)/,
    /export\s+type\s+(\w+)/,
    /export\s+interface\s+(\w+)/,
    /export\s+\{([^}]+)\}/,
    /^\s*(\w+)\s*:\s*(?:async\s*\(|function)/,
    /^export\s+default\s+function/,
  ];
  for (let i = 0; i < lines.length; i++) {
    for (const p of pats) {
      const m = lines[i].match(p);
      if (m) {
        if (m[1] && m[1].length > 1 && !/^(if|for|while|switch|catch|return)$/.test(m[1])) {
          exports.push({ name: m[1], line: i + 1 });
        } else if (p.source.includes('export\\s+default')) {
          exports.push({ name: 'default', line: i + 1 });
        }
        break;
      }
    }
  }
  return exports;
}

function buildIndex() {
  const files = scanFiles(ROOT, ['.ts', '.tsx', '.js']);
  let md = `# Índice de Funciones — SuitServiHogar\n`;
  md += `**Generado:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `> Usa este índice para leer solo las líneas que necesitas, no archivos completos.\n\n`;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const exps = extractExports(file);
    if (exps.length === 0) continue;
    md += `## \`${rel}\`\n| Línea | Export |\n|-------|--------|\n`;
    for (const e of exps) md += `| ${e.line} | \`${e.name}\` |\n`;
    md += '\n';
  }

  fs.writeFileSync(OUTPUT, md, 'utf8');
  console.log(`✓ INDEX_FUNCIONES.md generado (${files.length} archivos)`);
}

buildIndex();
