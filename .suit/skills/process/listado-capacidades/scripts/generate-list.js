#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../../..');
const OUT = path.join(ROOT, 'SKILLS-MCP-AGENTS-LISTADO.txt');

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function listDir(p) {
  try { return fs.readdirSync(p); } catch { return []; }
}

function isSymlink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

function getSymlinkTarget(p) {
  try { return fs.readlinkSync(p); } catch { return null; }
}

function parseSkillsYaml(content) {
  const skills = [];
  const lines = content.split('\n');
  let current = null;
  for (const line of lines) {
    const m = line.match(/^  (\S[\w-]*):\s*$/);
    if (m) {
      if (current) skills.push(current);
      current = { name: m[1], description: '' };
    }
    if (current) {
      const d = line.match(/description:\s*["'](.+?)["']/);
      if (d) current.description = d[1].substring(0, 120);
    }
  }
  if (current) skills.push(current);
  return skills;
}

function parseAgentsYaml(content) {
  const agents = [];
  const lines = content.split('\n');
  let current = null;
  for (const line of lines) {
    const m = line.match(/^  (\S[\w-]*):\s*$/);
    if (m) {
      if (current) agents.push(current);
      current = { name: m[1], description: '', domain: '', risk: '' };
    }
    if (current) {
      const d = line.match(/description:\s*["'](.+?)["']/);
      if (d) current.description = d[1].substring(0, 120);
      const dom = line.match(/domain:\s*(\S+)/);
      if (dom) current.domain = dom[1];
      const r = line.match(/risk_level:\s*(\S+)/);
      if (r) current.risk = r[1];
    }
  }
  if (current) agents.push(current);
  return agents;
}

function parseMcpJson(content) {
  try {
    const obj = JSON.parse(content);
    return Object.entries(obj.mcpServers || {}).map(([name, cfg]) => ({
      name,
      command: cfg.command ? `${cfg.command} ${(cfg.args || []).join(' ')}`.trim() : cfg.url || '?'
    }));
  } catch { return []; }
}

function parseOpencodeCommands(content) {
  try {
    const obj = JSON.parse(content);
    return Object.entries(obj.command || {}).map(([name, cfg]) => ({
      name,
      description: (cfg.description || '').substring(0, 90)
    }));
  } catch { return []; }
}

// Descripciones cortas de MCPs (no derivables de .mcp.json, mantener a mano)
const MCP_DESC = {
  supabase: 'Conexion a base de datos Supabase (SQL, auth, storage)',
  whatsapp: 'Envio/recepcion de mensajes WhatsApp via wweb-mcp',
  higgsfield: 'Generacion de video/imagen AI (remoto)',
  'google-sheets': 'Lectura/escritura de Google Sheets (backend SuitOrg)',
  playwright: 'Automatizacion de navegador (Playwright)',
  'suitcvlo-filesystem': 'Acceso a filesystem del proyecto SuitCVLO',
  'telegram-bot': 'Bot de Telegram (envio/recepcion de mensajes)',
  manychat: 'Integracion con ManyChat (chatbot/marketing)',
  comfyui: 'Generacion de imagen/video con ComfyUI local',
  'chrome-devtools': 'DevTools MCP para debugging e inspeccion',
  github: 'API de GitHub (repos, PRs, issues)',
  mirofish: 'Swarm intelligence / prediccion (MiroFish)',
  capcut: 'Edicion de video via CapCut API'
};

// Ubicaciones de instalacion (convencion fija del proyecto)
const INSTALL_LOCATIONS = [
  ['.agents/skills/', 'Skills universales (compartidas)', 'Cualquier agente'],
  ['.claude/skills/', 'Skills para Claude Code', 'Claude'],
  ['.opencode/skills/', 'Skills de OpenCode', 'OpenCode'],
  ['opencode.json', 'Config MCPs + comandos personalizados', 'OpenCode'],
  ['.mcp.json', 'Config MCPs de Claude Code', 'Claude'],
  ['.suit/registry/agents.yaml', 'Registro de agentes SuitOS', 'Ambos'],
  ['scripts/agents/', 'Scripts de agente ejecutables', 'Ambos']
];

function getSkillDesc(skillPath) {
  const c = readIfExists(path.join(skillPath, 'SKILL.md'));
  if (!c) return '';
  const lines = c.split('\n');
  const idx = lines.findIndex(l => /^description:\s*/.test(l));
  if (idx === -1) return '';
  const first = lines[idx].replace(/^description:\s*/, '').trim();
  let text;
  if (/^[>|][+-]?$/.test(first)) {
    const block = [];
    for (let i = idx + 1; i < lines.length && /^\s+\S/.test(lines[i]); i++) block.push(lines[i].trim());
    text = block.join(' ');
  } else if (first.startsWith("'") && first.endsWith("'")) {
    text = first.slice(1, -1).replace(/''/g, "'");
  } else {
    text = first.replace(/^"|"$/g, '');
  }
  return text.substring(0, 150);
}

// Collect data
const suitSkills = {};
const cats = ['domain', 'language', 'process', 'system', 'tool'];
for (const cat of cats) {
  const dir = path.join(ROOT, '.suit/skills', cat);
  suitSkills[cat] = listDir(dir).filter(f => f.endsWith('.yaml')).map(f => ({
    name: f.replace(/\.yaml$/, ''),
    path: `.suit/skills/${cat}/${f}`
  }));
}

const claudeDir = path.join(ROOT, '.claude/skills');
const claudeSkills = listDir(claudeDir)
  .filter(f => fs.existsSync(path.join(claudeDir, f, 'SKILL.md')))
  .map(f => {
    const full = path.join(claudeDir, f);
    const sym = isSymlink(full);
    const tgt = sym ? getSymlinkTarget(full) : null;
    return { name: f, path: `.claude/skills/${f}`, symlink: sym, target: tgt ? path.relative(ROOT, tgt) : null };
  });

const ocDir = path.join(ROOT, '.opencode/skills');
const ocSkills = listDir(ocDir)
  .filter(f => fs.existsSync(path.join(ocDir, f, 'SKILL.md')))
  .map(f => ({ name: f, path: `.opencode/skills/${f}` }));

const regContent = readIfExists(path.join(ROOT, '.suit/registry/skills.yaml'));
const regSkills = regContent ? parseSkillsYaml(regContent) : [];

const agContent = readIfExists(path.join(ROOT, '.suit/registry/agents.yaml'));
const agents = agContent ? parseAgentsYaml(agContent) : [];

const mcpContent = readIfExists(path.join(ROOT, '.mcp.json'));
const mcps = mcpContent ? parseMcpJson(mcpContent) : [];

const ocConfigContent = readIfExists(path.join(ROOT, 'opencode.json'));
const ocCommands = ocConfigContent ? parseOpencodeCommands(ocConfigContent) : [];

// Build output
const now = new Date().toISOString().split('T')[0];
const sep = '='.repeat(72);
const dash = '-'.repeat(72);
let o = '';

o += sep + '\n';
o += '  LISTADO COMPLETO - SKILLS, MCP SERVERS Y AGENTES\n';
o += '  Generado: ' + now + '\n';
o += '  Auto-generado por: .suit/skills/process/listado-capacidades/\n';
o += sep + '\n\n';

// 1. SuitOS
o += sep + '\n';
o += '  1. SKILLS - SUITOS (.suit/skills/)\n';
o += sep + '\n\n';

const catNames = { domain: 'DOMINIO', language: 'LENGUAJE', process: 'PROCESO', system: 'SISTEMA', tool: 'HERRAMIENTA' };
let suitTotal = 0;
for (const cat of cats) {
  const sk = suitSkills[cat];
  if (!sk.length) continue;
  suitTotal += sk.length;
  o += '  -- ' + catNames[cat] + ' (.suit/skills/' + cat + '/)\n\n';
  o += '  NOMBRE                 RUTA\n';
  o += '  ' + dash + '\n';
  for (const s of sk) {
    o += '  ' + s.name.padEnd(25) + ' ' + s.path + '\n';
  }
  o += '\n';
}
o += '  TOTAL SUITOS: ' + suitTotal + ' skills\n\n\n';

// 2. Claude
o += sep + '\n';
o += '  2. SKILLS - CLAUDE CODE (.claude/skills/)\n';
o += sep + '\n\n';

const locals = claudeSkills.filter(s => !s.symlink);
const syms = claudeSkills.filter(s => s.symlink);

if (locals.length) {
  o += '  -- Skills locales (propias)\n\n';
  for (const s of locals) {
    const desc = getSkillDesc(path.join(claudeDir, s.name));
    o += '  ' + s.name.padEnd(25) + ' ' + s.path + '\n';
    if (desc) o += '  '.padEnd(25) + '   ' + desc + '\n';
  }
  o += '\n';
}
if (syms.length) {
  o += '  -- Skills enlazados (junctions)\n\n';
  for (const s of syms) {
    const desc = getSkillDesc(path.join(claudeDir, s.name));
    o += '  ' + s.name.padEnd(25) + ' ' + s.path + '\n';
    if (s.target) o += '  '.padEnd(25) + '   -> ' + s.target + '\n';
    if (desc) o += '  '.padEnd(25) + '   ' + desc + '\n';
  }
  o += '\n';
}
o += '  TOTAL CLAUDE: ' + claudeSkills.length + ' (' + locals.length + ' locales + ' + syms.length + ' symlinks)\n\n\n';

// 3. OpenCode
o += sep + '\n';
o += '  3. SKILLS - OPENCODE (.opencode/skills/)\n';
o += sep + '\n\n';
for (const s of ocSkills) o += '  ' + s.name.padEnd(25) + ' ' + s.path + '\n';
o += '\n  TOTAL OPENCODE: ' + ocSkills.length + '\n\n\n';

// 4. Registry
o += sep + '\n';
o += '  4. SKILLS - REGISTRY (.suit/registry/skills.yaml)\n';
o += sep + '\n\n';
for (const s of regSkills) o += '  ' + s.name.padEnd(35) + ' ' + s.description.substring(0, 70) + '\n';
o += '\n  TOTAL REGISTRY: ' + regSkills.length + ' skills declaradas\n\n\n';

// 5. MCP
o += sep + '\n';
o += '  5. MCP SERVERS (.mcp.json)\n';
o += sep + '\n\n';
o += '  NOMBRE               COMANDO / URL\n';
o += '  ' + dash + '\n';
for (const m of mcps) {
  o += '  ' + m.name.padEnd(25) + ' ' + m.command.substring(0, 55) + '\n';
  if (MCP_DESC[m.name]) o += '  '.padEnd(25) + '   ' + MCP_DESC[m.name] + '\n';
}
o += '\n  TOTAL MCP: ' + mcps.length + ' servers\n\n\n';

// 6. Agents
o += sep + '\n';
o += '  6. AGENTES (.suit/registry/agents.yaml)\n';
o += sep + '\n\n';
o += '  NOMBRE                DOMINIO      RIESGO\n';
o += '  ' + dash + '\n';
for (const a of agents) o += '  ' + a.name.padEnd(22) + (a.domain || '-').padEnd(13) + (a.risk || '-') + '\n';
o += '\n  TOTAL AGENTES: ' + agents.length + '\n\n\n';

// 7. Comandos personalizados (OpenCode)
o += sep + '\n';
o += '  7. COMANDOS PERSONALIZADOS (opencode.json)\n';
o += sep + '\n\n';
for (const c of ocCommands) {
  o += '  ' + c.name.padEnd(22) + ' ' + c.description + '\n';
}
o += '\n  TOTAL COMANDOS: ' + ocCommands.length + '\n\n\n';

// 8. Ubicaciones de instalacion
o += sep + '\n';
o += '  8. UBICACIONES DE INSTALACION\n';
o += sep + '\n\n';
o += '  RUTA                          PROPOSITO                              TOOL\n';
o += '  ' + dash + '\n';
for (const [ruta, proposito, tool] of INSTALL_LOCATIONS) {
  o += '  ' + ruta.padEnd(30) + ' ' + proposito.padEnd(38) + ' ' + tool + '\n';
}
o += '\n\n';

// Summary
o += sep + '\n';
o += '  RESUMEN TOTAL\n';
o += sep + '\n\n';

const cL = locals.length, cS = syms.length;
o += '  CAPACIDAD              TOTAL   SUITORG   PROYECTO\n';
o += '  ' + '='.repeat(45) + '\n';
o += '  Skills SuitOS (.yaml)    ' + String(suitTotal).padStart(2) + '      ' + String(suitTotal).padStart(2) + '         0\n';
o += '  Skills Claude Code       ' + String(claudeSkills.length).padStart(2) + '       ' + String(cL).padStart(2) + '        ' + String(cS).padStart(2) + '\n';
o += '  Skills OpenCode           ' + String(ocSkills.length).padStart(2) + '       ' + String(ocSkills.length).padStart(2) + '         0\n';
o += '  Registry YAML           ' + String(regSkills.length).padStart(2) + '      ' + String(regSkills.length).padStart(2) + '         0\n';
o += '  MCP Servers             ' + String(mcps.length).padStart(2) + '       ?         ?\n';
o += '  Agentes                 ' + String(agents.length).padStart(2) + '      ' + String(agents.length).padStart(2) + '         0\n';
o += '  ' + '='.repeat(45) + '\n';

const total = suitTotal + claudeSkills.length + ocSkills.length + regSkills.length + mcps.length + agents.length;
o += '  TOTAL                   ' + total + '\n\n';
o += '  Para regenerar: node .suit/skills/process/listado-capacidades/scripts/generate-list.js\n';
o += sep + '\n';

fs.writeFileSync(OUT, o, 'utf8');
console.log('Generado: ' + OUT);
console.log('SuitOS: ' + suitTotal + ' | Claude: ' + claudeSkills.length + ' | OpenCode: ' + ocSkills.length);
console.log('Registry: ' + regSkills.length + ' | MCP: ' + mcps.length + ' | Agentes: ' + agents.length);
console.log('TOTAL: ' + total);
