#!/usr/bin/env node
'use strict';
// Instala una skill como fuente única en .agents/skills/<nombre> + junctions
// hacia .claude/skills/ y .opencode/skills/ (mismo patrón ya usado por ciclo
// y las demás skills compartidas del repo).
// Uso: node scripts/install-skill.js <nombre> [ruta-origen]
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const [, , name, source] = process.argv;

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }
function exists(p) { try { fs.lstatSync(p); return true; } catch { return false; } }

if (!name || /[\\/]/.test(name)) fail('Uso: node scripts/install-skill.js <nombre> [ruta-origen]');

const canonical = path.join(ROOT, '.agents', 'skills', name);
const claudeLink = path.join(ROOT, '.claude', 'skills', name);
const opencodeLink = path.join(ROOT, '.opencode', 'skills', name);

// 1. Colisión de nombre en cualquiera de los 3 lugares
for (const p of [claudeLink, opencodeLink, ...(source ? [canonical] : [])]) {
  if (exists(p)) fail(`Ya existe ${path.relative(ROOT, p)} — nombre en uso, aborto.`);
}

// 2. Contenido en .agents/skills/<nombre>
if (source) {
  const src = path.resolve(source);
  if (!fs.existsSync(path.join(src, 'SKILL.md'))) fail(`No encontré SKILL.md en ${src}`);
  fs.mkdirSync(path.dirname(canonical), { recursive: true });
  fs.cpSync(src, canonical, { recursive: true });
  console.log(`Copiado ${src} -> ${path.relative(ROOT, canonical)}`);
} else if (!exists(canonical)) {
  fail(`No pasaste ruta-origen y no existe ya ${path.relative(ROOT, canonical)} — nada que instalar.`);
}
if (!fs.existsSync(path.join(canonical, 'SKILL.md'))) fail(`${path.relative(ROOT, canonical)} no tiene SKILL.md.`);

// 3. Junctions (Windows) / symlinks (POSIX) hacia el canónico
const linkType = process.platform === 'win32' ? 'junction' : 'dir';
for (const link of [claudeLink, opencodeLink]) {
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(canonical, link, linkType);
  console.log(`Link: ${path.relative(ROOT, link)} -> ${path.relative(ROOT, canonical)}`);
}

// 4. Regenerar el inventario
try {
  execSync('node .suit/skills/process/listado-capacidades/scripts/generate-list.js', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.warn('No se pudo regenerar SKILLS-MCP-AGENTS-LISTADO.txt automáticamente — corre el comando a mano.');
}

console.log(`\n"${name}" instalada. Pendiente (decisión tuya, no se automatiza):`);
console.log('  ¿Es de gobierno SuitOS? Si sí, agrega {name, path} a .suit/registry/skills.yaml');
console.log('  apuntando a su .suit/skills/<categoria>/<nombre>.yaml (no copies la description).');
