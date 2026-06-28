/**
 * generate-index.js — Escanea el proyecto y genera INDEX_FUNCIONES.md
 * 
 * Uso: node scripts/generate-index.js
 * 
 * Escanea todos los .js y .gs del proyecto (excluyendo node_modules,
 * _LEGACY_BACKUPS, .git, tmp, respaldos) y genera un índice de funciones
 * con sus ubicaciones exactas (archivo:línea).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'INDEX_FUNCIONES.md');
const EXCLUDE_DIRS = new Set(['node_modules', '_LEGACY_BACKUPS', '.git', 'tmp', 'respaldos']);

const FILE_CATEGORIES = [
  { prefix: 'js/modules/', label: 'js/modules/' },
  { prefix: 'backend/', label: 'backend/' },
  { prefix: 'CampanasAi/', label: 'CampanasAi/' },
  { prefix: 'citas/', label: 'citas/' },
  { prefix: 'scripts/', label: 'scripts/' },
  { prefix: 'Documentacion/', label: 'Documentacion/' },
];

function categorizeFile(relPath) {
  for (const cat of FILE_CATEGORIES) {
    if (relPath.startsWith(cat.prefix)) return cat.label;
  }
  return 'root';
}

function scanFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      results.push(...scanFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && /\.(js|gs)$/i.test(entry.name)) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function extractFunctions(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const functions = [];

  const patterns = [
    // function name( params )
    /^\s*function\s+(\w+)\s*\(/,
    // const/fn name = ( or name => or function(
    /^\s*(?:const|let|var|fn)\s+(\w+)\s*=\s*(?:\(|[\w]+\s*=>|function\s*\()/,
    // name: ( params ) => or name: function(  (object methods)
    /^\s*(\w+)\s*:\s*(?:\(|async\s*\(|function\s*\()/,
    // app.method = ( or app.method = function(
    /^\s*app\.(\w+(?:\.\w+)*)\s*=\s*(?:\(|async\s*\(|function\s*\()/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip lines that are clearly NOT function definitions
    if (line.includes('||') && line.includes('?')) continue; // ternary expressions
    if (/=\s*\(/.test(line) && !/=>/.test(line) && !/function/.test(line)) continue; // destructuring
    if (/getElementById|querySelector|appendChild|createElement/.test(line)) continue;
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1];
        if (name && name.length > 1 && !/^(if|for|while|switch|catch|return|case|else)$/.test(name)) {
          // Verify it looks like a real function (has params or arrow)
          const afterName = line.substring(line.indexOf(name) + name.length).trim();
          if (afterName.startsWith('=')) {
            const afterEq = afterName.substring(1).trim();
            if (!afterEq.startsWith('(') && !afterEq.startsWith('function') && !afterEq.includes('=>')) continue;
          }
          if (!afterName.startsWith(':') && !afterName.startsWith('(') && !afterName.startsWith('=') && !afterName.startsWith('function')) continue;

          const isAppDot = line.trimStart().startsWith('app.');
          const shortName = isAppDot ? `app.${name}` : name;
          functions.push({ name: shortName, line: i + 1, raw: line.trim() });
          break;
        }
      }
    }
  }
  return functions;
}

function buildIndex() {
  const files = scanFiles(ROOT);
  const grouped = {};

  for (const file of files) {
    const relPath = path.relative(ROOT, file).replace(/\\/g, '/');
    const cat = categorizeFile(relPath);
    if (!grouped[cat]) grouped[cat] = [];
    const funcs = extractFunctions(file);
    if (funcs.length > 0) {
      grouped[cat].push({ relPath, funcs });
    }
  }

  let md = `# Índice de Funciones — SuitOrg\n`;
  md += `**Generado:** ${new Date().toISOString().split('T')[0]} | `;
  md += `**Total archivos:** ${files.length} JS/GS\n\n`;

  for (const [cat, entries] of Object.entries(grouped)) {
    if (cat === 'root') {
      for (const entry of entries) {
        md += `## \`${entry.relPath}\`\n\n`;
        md += `| Línea | Función |\n|-------|---------|\n`;
        for (const fn of entry.funcs) {
          md += `| ${fn.line} | \`${fn.name}\` |\n`;
        }
        md += '\n';
      }
    } else {
      // Group by directory
      const dirGroups = {};
      for (const entry of entries) {
        const dir = path.dirname(entry.relPath);
        if (!dirGroups[dir]) dirGroups[dir] = [];
        dirGroups[dir].push(entry);
      }
      for (const [dir, dirEntries] of Object.entries(dirGroups)) {
        md += `## \`${dir}/\`\n\n`;
        if (dirEntries.length === 1 && dirEntries[0].funcs.length <= 30) {
          md += `| Línea | Función | Archivo |\n|-------|---------|--------|\n`;
          for (const entry of dirEntries) {
            for (const fn of entry.funcs) {
              const fileShort = path.basename(entry.relPath);
              md += `| ${fn.line} | \`${fn.name}\` | \`${fileShort}\` |\n`;
            }
          }
        } else {
          for (const entry of dirEntries) {
            md += `### \`${entry.relPath}\`\n\n`;
            md += `| Línea | Función |\n|-------|---------|\n`;
            for (const fn of entry.funcs) {
              md += `| ${fn.line} | \`${fn.name}\` |\n`;
            }
            md += '\n';
          }
        }
        md += '\n';
      }
    }
  }

  md += `---\n`;
  md += `> **Auto-generado por \`scripts/generate-index.js\`** — `;
  md += `Ejecuta \`node scripts/generate-index.js\` para actualizar.\n`;

  fs.writeFileSync(OUTPUT, md, 'utf8');
  console.log(`✓ INDEX_FUNCIONES.md generado en ${OUTPUT}`);
  console.log(`  ${files.length} archivos escaneados`);
}

buildIndex();
