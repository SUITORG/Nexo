#!/usr/bin/env node
'use strict';
// SuitDashboard — escanea MCPs, Skills, proyectos indepes y escribe data.js
// Uso: node scan.js [--live]
const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'data.js');
const LIVE = process.argv.includes('--live');
const PROBE = process.argv.includes('--probe');

// Directorios que NO son proyectos de nivel 1
const EXCLUDE = new Set([
  'node_modules', '.git', '.github', 'dist', 'media', 'Video',
  'jdk-21.0.2', 'neo4j-community-5.26.0', '_LEGACY_BACKUPS',
  'respaldos', 'TempRobertoV', 'SuitDashboard',
  '.claude', '.agents', '.opencode', '.ponytail', '.suit', '.mimocode',
  '.blackboxcli', '.agent', 'agent', 'agent/skills',
  '.wwebjs_auth', '.wwebjs_cache', '.playwright-mcp'
]);

// Fuentes de skills por proyecto
const SKILL_DIRS = ['skills', '.claude/skills', '.agents/skills', '.opencode/skills', '.suit/skills'];
// Fuentes de skills que pertenecen a la raíz
const ROOT_SKILL_DIRS = ['.claude/skills', '.agents/skills', '.opencode/skills', '.suit/skills', '.ponytail/skills', 'agent/skills'];

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}
function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

// --- Registry projects.yaml (parser mínimo, sin dependencias) ---
function parseRegistry() {
  const txt = readText(path.join(ROOT, '.suit', 'registry', 'projects.yaml'));
  const reg = {};
  let cur = null;
  for (const raw of txt.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const mKey = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(raw);
    if (mKey) { cur = mKey[1]; reg[cur] = { key: cur, ports: [], rawPath: '' }; continue; }
    if (!cur) continue;
    const mPath = /^ {4}path:\s*(.+)$/.exec(raw);
    if (mPath) reg[cur].rawPath = mPath[1].trim().replace(/\/$/, '');
    const mPort = /^\s+port:\s*(\d+)/i.exec(raw);
    if (mPort) reg[cur].ports.push(Number(mPort[1]));
    const mDb = /^\s+db_engine:\s*(\S+)/.exec(raw);
    if (mDb) reg[cur].db = mDb[1];
    const mDesc = /^ {4}description:\s*["']?(.+)$/.exec(raw);
    if (mDesc && !reg[cur].desc) reg[cur].desc = mDesc[1].slice(0, 140);
  }
  // index por nombre de carpeta
  const byDir = {};
  for (const p of Object.values(reg)) {
    const d = p.rawPath === '.' || p.rawPath === './' ? '' : path.basename(p.rawPath);
    if (d) byDir[d] = p;
  }
  return { byDir, all: reg };
}

// --- PROJECT_OPTIMAL desde scripts/mcp-manager.js (no require: ejecuta CLI) ---
function parseOptimal() {
  const txt = readText(path.join(ROOT, 'scripts', 'mcp-manager.js'));
  const start = txt.indexOf('const PROJECT_OPTIMAL');
  if (start < 0) return {};
  const open = txt.indexOf('{', start);
  const close = txt.indexOf('\n};', open);
  if (open < 0 || close < 0) return {};
  try {
    return new Function('return ' + txt.slice(open, close + 2))();
  } catch { return {}; }
}

// --- Agentes SuitOS (.suit/registry/agents.yaml) ---
function parseAgentsRegistry() {
  const txt = readText(path.join(ROOT, '.suit', 'registry', 'agents.yaml'));
  const agents = [];
  let cur = null;
  for (const raw of txt.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const mKey = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(raw);
    if (mKey) { cur = { name: mKey[1], desc: '', domain: '', risk: '' }; agents.push(cur); continue; }
    if (!cur) continue;
    const mDesc = /^ {4}description:\s*(.+)$/.exec(raw);
    if (mDesc) cur.desc = mDesc[1].replace(/^["']|["']$/g, '').trim();
    const mDomain = /^ {4}domain:\s*(\S+)/.exec(raw);
    if (mDomain) cur.domain = mDomain[1];
    const mRisk = /^ {4}risk_level:\s*(\S+)/.exec(raw);
    if (mRisk) cur.risk = mRisk[1];
  }
  return agents;
}

// --- Agentes nativos de Claude Code (.claude/agents/*.md, solo raíz) ---
function scanClaudeAgents() {
  const dir = path.join(ROOT, '.claude', 'agents');
  if (!exists(dir)) return [];
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.endsWith('.md')); } catch { return []; }
  return files.map(f => {
    const txt = readText(path.join(dir, f));
    const end = txt.startsWith('---') ? txt.indexOf('\n---', 3) : -1;
    const fm = end > 0 ? txt.slice(3, end) : null;
    const mName = fm && /^name:\s*(.+)$/m.exec(fm);
    const mDesc = fm && /^description:\s*(.+)$/m.exec(fm);
    return {
      file: f,
      name: mName ? mName[1].trim() : f.replace(/\.md$/, ''),
      desc: mDesc ? mDesc[1].replace(/^["']|["']$/g, '').trim().slice(0, 160) : '',
      hasFrontmatter: !!fm
    };
  });
}

// --- Grupos en paralelo declarados en .suit/workflows/*.yaml (campo parallel: true) ---
function scanParallelGroups() {
  const dir = path.join(ROOT, '.suit', 'workflows');
  if (!exists(dir)) return [];
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /\.ya?ml$/i.test(f)); } catch { return []; }
  const groups = [];
  for (const f of files) {
    const txt = readText(path.join(dir, f));
    const mName = /^\s*name:\s*(.+)$/m.exec(txt);
    const workflow = mName ? mName[1].trim() : f.replace(/\.ya?ml$/i, '');
    const steps = [];
    let cur = null, listMode = null;
    for (const raw of txt.split(/\r?\n/)) {
      const mId = /^ {4}- id:\s*(\S+)/.exec(raw);
      if (mId) { cur = { step: mId[1], agent: null, skills: [], parallel: false }; steps.push(cur); listMode = null; continue; }
      if (!cur) continue;
      const mKey = /^ {6}(\w+):\s*(.*)$/.exec(raw);
      if (mKey) {
        listMode = mKey[2].trim() === '' ? mKey[1] : null;
        if (mKey[1] === 'agent') cur.agent = mKey[2].trim();
        if (mKey[1] === 'parallel' && mKey[2].trim() === 'true') cur.parallel = true;
        continue;
      }
      const mItem = /^ {8}-\s*(.+)$/.exec(raw);
      if (mItem && listMode === 'skills') cur.skills.push(mItem[1].replace(/^["']|["']$/g, '').trim());
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].parallel) continue;
      const start = i;
      while (i + 1 < steps.length && steps[i + 1].parallel) i++;
      const group = steps.slice(start, i + 1);
      const then = steps[i + 1] || null;
      const actorOf = s => s.agent || (s.skills.length ? s.skills.join(', ') : '?');
      groups.push({
        workflow,
        parallelSteps: group.map(s => ({ step: s.step, actor: actorOf(s) })),
        thenStep: then ? { step: then.step, actor: actorOf(then) } : null
      });
    }
  }
  return groups;
}

// --- Scripts (scripts/**/*.{js,mjs,cjs,sh,py}) ---

// Descripciones en español (mapa local). Las cabeceras de scripts/ viven fuera
// del alcance de este dashboard y no se tocan — ver CONTRATO.md.
const SCRIPT_DESC_ES = {
  'agents/probador.js': 'Agente SuitOS de pruebas de humo (solo lectura): corre suites de .suit/tests/*.yaml contra los servidores activos.',
  'agents/reportero.js': 'Agente SuitOS de revisión de código (solo lectura): analiza archivos y propone hallazgos según reviewer/profiles.yaml.',
  'agents/vision-audit.js': 'Agente de navegador: escucha Agent_Tasks en Supabase y ejecuta auditorías visuales automáticas con Playwright.',
  'backup.sh': 'Respaldo del monorepo a ZIP en el directorio padre (excluye .git, node_modules, .venv, cachés).',
  'brief-generate.js': 'Router Express autocontenido del Brief: parseo, validación y generación; SuitCampanas solo llama parseBrief().',
  'check-gas-sync.sh': 'Compara backend/*.js locales contra el código desplegado en el GAS canónico (hace visible el drift antes de desplegar).',
  'commit-fase.sh': 'Commitea el resultado de una fase del ciclo de mantenimiento con el formato ciclo(f<n>/<fase>)[alcance].',
  'configurador-estilos.js': 'TUI de consulta de Estilos Visuales: lee en vivo video_categorias_estilo / video_subestilos desde Supabase.',
  'configurador-formatos.js': 'TUI de consulta de formatos por red desde la matriz fija GUIAFMTRRSS.MD (medidas, duración, objetivo).',
  'detectar-cambios.sh': 'Resuelve el alcance del ciclo, su CONTRATO.md y los cambios git pendientes de ese alcance.',
  'find-loose-files.js': 'Busca archivos huérfanos: nombres que ningún otro archivo referencia (require/import/src/href/fetch).',
  'generate-index.js': 'Escanea los .js/.gs del proyecto y regenera INDEX_FUNCIONES.md con funciones en archivo:línea.',
  'get-qr.mjs': 'Obtiene el QR de vinculación de WhatsApp lanzando @kahflane/whatsapp-mcp y capturando su salida.',
  'install-skill.js': 'Instala una skill como fuente única en .agents/skills/<nombre> y crea junctions hacia .claude/ y .opencode/.',
  'mcp/brief-server.js': 'MCP server del Brief (herramientas brief.parse / validate / generate / write) para agentes compatibles con MCP.',
  'mcp-github.js': 'Wrapper del MCP de GitHub: carga el .env de la raíz y lanza npx @modelcontextprotocol/server-github.',
  'mcp-manager.js': 'Gestor de MCPs: MCP_DEFAULTS / PROJECT_OPTIMAL y sincronización de servidores en opencode.json y .mcp.json.',
  'mcp-supabase.js': 'Wrapper del MCP de Supabase: carga el .env de la raíz y lanza npx @supabase/mcp-server-supabase.',
  'mcp-telegram.js': 'Wrapper del MCP de Telegram: carga el .env de la raíz y lanza npx telegram-bot-mcp-server.',
  'migrate-supabase-to-neon.js': 'Migra todas las tablas de Supabase a Neon Postgres (acepta --dry-run).',
  'orchestrator_client.js': 'Cliente HTTP del orquestador: hace POST JSON a una URL (la usan flujos de agentes y GAS).',
  'parse-theme.js': 'Parser del campo color_tema pipe-delimited (color, candado, pal, tp, tpl) y resolución del tema visual.',
  'read-last.js': 'Lee el último mensaje recibido por whatsapp-web.js con la sesión local .wappmcp/profile.',
  'run-migration-007.js': 'Ejecuta Documentacion/migrations/007_planes_medios.sql contra la API de Supabase (SUPABASE_ACCESS_TOKEN).',
  'send-direct.js': 'Envía un mensaje directo de prueba por WhatsApp con la sesión local (whatsapp-web.js).',
  'send-manuel.js': 'Envía un mensaje de WhatsApp a un contacto con la sesión local .wappmcp/profile (prueba de envío).',
  'send-wa-test.mjs': 'Prueba de conexión al MCP wappmcp: lo lanza por npx y espera el handshake.',
  'ssg-engine.mjs': 'Motor SSG multi-inquilino: genera los HTML estáticos con SEO desde Google Sheets (único generador de dist/).',
  'system-status.js': 'Muestra qué servicios locales están activos por puerto — alternativa a netstat/tasklist.',
  'tunel.js': 'Túnel cloudflared con auto-heal para el sidebar BRIEF: extrae la URL viva y la registra en GAS.',
  'whatsapp-test.js': 'Prueba de conexión al MCP wappmcp: lo lanza por npx y espera el handshake.'
};

// Activadores: fuentes que referencian cada script, leídas una sola vez.
function buildTriggerSources() {
  const src = [];
  const add = (rel, kind) => {
    const t = readText(path.join(ROOT, rel));
    if (t && t.length < 1000000) src.push({ rel, kind, text: t });
  };
  ['AGENTS.md', 'CLAUDE.md', 'package.json'].forEach(f => add(f, 'root'));
  try {
    for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
      if (e.isFile() && /\.bat$/i.test(e.name)) add(e.name, 'bat');
    }
  } catch { /* noop */ }
  const walk = (dir, rel, re, kind) => {
    let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r, re, kind);
      else if (re.test(e.name)) add(r, kind);
    }
  };
  walk(path.join(ROOT, '.suit'), '.suit', /\.(ya?ml|md)$/i, 'suit');
  walk(path.join(ROOT, '.github'), '.github', /\.ya?ml$/i, 'ci');
  try {
    for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
      if (!e.isDirectory() || EXCLUDE.has(e.name)) continue;
      add(e.name + '/opencode.json', 'mcp-oc');
      add(e.name + '/.mcp.json', 'mcp-claude');
    }
  } catch { /* noop */ }
  add('opencode.json', 'mcp-oc');
  add('.mcp.json', 'mcp-claude');
  return src;
}

function triggersFor(rel, sources) {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pat = new RegExp('scripts[/\\\\]' + rel.split('/').map(esc).join('[/\\\\]'), 'i');
  const hits = sources.filter(s => pat.test(s.text));
  const labels = [];
  const ci = hits.filter(h => h.kind === 'ci');
  for (const h of ci) {
    const name = path.basename(h.rel);
    const cron = /schedule:[\s\S]{0,500}?-\s*cron:\s*['"]?([^'"\r\n]+)/.exec(h.text);
    labels.push(cron ? `cron ${cron[1].trim()} · ${name}` : `github workflow · ${name}`);
  }
  const bat = hits.filter(h => h.kind === 'bat');
  if (bat.length) labels.push(bat.map(h => 'bat: ' + h.rel).join(', '));
  const oc = hits.filter(h => h.kind === 'mcp-oc');
  if (oc.length) labels.push(`opencode.json ×${oc.length}`);
  const cl = hits.filter(h => h.kind === 'mcp-claude');
  if (cl.length) labels.push(`.mcp.json ×${cl.length}`);
  const root = hits.filter(h => h.kind === 'root' && h.rel !== 'package.json');
  if (root.length) labels.push(root.map(h => h.rel).join(', '));
  if (hits.some(h => h.rel === 'package.json')) labels.push('npm scripts');
  const suit = hits.filter(h => h.kind === 'suit');
  if (suit.length) labels.push(`.suit (${suit.length} refs)`);
  return labels.length ? labels : ['CLI manual'];
}

function scanScripts() {
  const dir = path.join(ROOT, 'scripts');
  if (!exists(dir)) return [];
  const sources = buildTriggerSources();
  const out = [];
  (function walk(d, rel) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      const relPath = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) { walk(full, relPath); continue; }
      if (!/\.(js|mjs|cjs|sh|py)$/i.test(e.name)) continue;
      const lines = readText(full).slice(0, 800).split(/\r?\n/);
      let desc = '';
      for (const raw of lines.slice(0, 6)) {
        const t = raw.trim();
        if (!t || /^#!/.test(t)) continue;
        const m = /^(?:\/\/|#)\s*(.+)$/.exec(t);
        desc = m ? m[1].trim() : '';
        break;
      }
      out.push({
        name: e.name,
        path: 'scripts/' + relPath,
        ext: path.extname(e.name).slice(1).toLowerCase(),
        desc: (SCRIPT_DESC_ES[relPath] || desc).slice(0, 160),
        triggers: triggersFor(relPath, sources)
      });
    }
  })(dir, '');
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

// --- Plugins (.claude-plugin/plugin.json + opencode.json:plugin[]) ---
function scanPlugins() {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name); } catch { /* noop */ }
  for (const d of dirs) {
    const pj = path.join(ROOT, d, '.claude-plugin', 'plugin.json');
    if (!exists(pj)) continue;
    const j = readJson(pj);
    if (!j) continue;
    out.push({ name: j.name || d, version: j.version || '', desc: j.description || '', dir: d, claude: true, opencode: false });
  }
  const oc = readJson(path.join(ROOT, 'opencode.json'));
  for (const p of (oc && oc.plugin) || []) {
    const match = out.find(x => p.includes(x.dir));
    if (match) match.opencode = true;
    else out.push({ name: path.basename(p), version: '', desc: '', dir: p, claude: false, opencode: true });
  }
  return out;
}

// --- Skills ---
function readSkillDesc(mdPath) {
  const txt = readText(mdPath).slice(0, 4000);
  if (!txt.trim()) return '';
  if (txt.startsWith('---')) {
    const end = txt.indexOf('\n---', 3);
    const fm = end > 0 ? txt.slice(4, end) : txt;
    const m = /^description:\s*[>|-]?\s*["']?(.+)$/m.exec(fm);
    if (m) return m[1].replace(/["'\s]+$/, '').trim();
  }
  const line = txt.split(/\r?\n/).find(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('---'));
  return (line || '').trim().replace(/^#+\s*/, '').slice(0, 160);
}

function yamlDesc(txt) {
  const m = /^description:\s*(.+)$/m.exec(txt);
  return m ? m[1].replace(/^['">|-]\s*/, '').replace(/["']+$/, '').trim().slice(0, 160) : '';
}

function collectSkills(dir, sources) {
  const out = [];
  for (const s of sources) {
    const base = path.join(dir, s);
    if (!exists(base)) continue;
    let entries = [];
    try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(base, e.name);
      if (e.isFile() && /\.ya?ml$/i.test(e.name)) {            // skills planos (SuitOSCore/*.skill.yaml)
        out.push({ name: e.name.replace(/\.ya?ml$/i, ''), desc: yamlDesc(readText(full)), src: s });
        continue;
      }
      if (!e.isDirectory() && !e.isSymbolicLink()) continue;    // isDirectory() es false para junctions en Windows
      if (exists(path.join(full, 'SKILL.md'))) {                // skills estándar (SKILL.md)
        out.push({ name: e.name, desc: readSkillDesc(path.join(full, 'SKILL.md')), src: s });
        continue;
      }
      let sub = [];                                             // skills SuitOS (.suit/skills/<cat>/*.yaml)
      try { sub = fs.readdirSync(full, { withFileTypes: true }); } catch { continue; }
      for (const f of sub) {
        if (f.isFile() && /\.ya?ml$/i.test(f.name)) {
          out.push({ name: f.name.replace(/\.ya?ml$/i, ''), desc: yamlDesc(readText(path.join(full, f.name))), src: s + '/' + e.name });
        }
      }
    }
  }
  return out;
}

// --- Puerto escuchado en un entry file ---
function findPort(file) {
  const txt = readText(file).slice(0, 8000);
  const m = /\.listen\(\s*(\d{4,5})/.exec(txt) || /PORT\s*[=:]\s*(\d{4,5})/.exec(txt);
  return m ? Number(m[1]) : null;
}

// --- Escaneo de puertos (live) ---
function checkPort(port, timeout = 700) {
  return new Promise(res => {
    const s = net.createConnection({ port, host: '127.0.0.1' });
    const done = ok => { s.destroy(); res(ok); };
    s.setTimeout(timeout);
    s.once('connect', () => done(true));
    s.once('timeout', () => done(false));
    s.once('error', () => done(false));
  });
}

// --- Contexto de CLIs (OpenCode / Claude Code) ---
function loadEnvKeys(dir) {
  const keys = new Set();
  for (const f of [path.join(ROOT, '.env'), path.join(dir, '.env')]) {
    for (const line of readText(f).split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line);
      if (m) keys.add(m[1]);
    }
  }
  return keys;
}

function claudeCmdArr(cfg) {
  if (!cfg) return [];
  if (cfg.command) return [cfg.command, ...(cfg.args || [])];
  if (cfg.url) return [cfg.url];
  return [];
}

function countSkillDirs(dir) {
  if (!exists(dir)) return 0;
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isDirectory() && exists(path.join(dir, d.name, 'SKILL.md'))).length;
  } catch { return 0; }
}

function claudeContext() {
  const ctx = { cfg: {}, globalSkills: 0, allow: [], enabledMcp: [], disabledMcp: [], autoApprove: false };
  const home = process.env.USERPROFILE || '';
  const cj = readJson(path.join(home, '.claude.json'));
  if (cj) {
    for (const [k, v] of Object.entries(cj.mcpServers || {})) ctx.cfg[k] = v;
    const pr = cj.projects && Object.entries(cj.projects)
      .find(([k]) => k.replace(/\\/g, '/').toLowerCase().endsWith('/suitorg'));
    if (pr) {
      const p = pr[1];
      ctx.enabledMcp = p.enabledMcpjsonServers || [];
      ctx.disabledMcp = p.disabledMcpjsonServers || [];
    }
  }
  const st = readJson(path.join(ROOT, '.claude', 'settings.json'));
  if (st) {
    ctx.autoApprove = !!st.enableAllProjectMcpServers;
    ctx.allow = ((st.permissions && st.permissions.allow) || []).filter(a => String(a).startsWith('mcp__'));
  }
  ctx.globalSkills = countSkillDirs(path.join(home, '.claude', 'skills'));
  return ctx;
}

// Ruta del comando resuelta contra la carpeta donde se declaró (cwd del CLI)
function pathCheck(dir, cmd, cwd) {
  const arr = Array.isArray(cmd) ? cmd : (cmd ? String(cmd).split(' ') : []);
  if (!arr.length) return { ok: true, issue: null };
  const bin = arr[0];
  if (/^https?:\/\//i.test(bin)) return { ok: true, issue: null, remote: true };
  const base = cwd ? path.resolve(ROOT, cwd) : dir;
  const rel = bin.includes('/') || bin.includes('\\');
  const test = p => exists(p);
  if (/^[A-Za-z]:[\\/]/.test(bin) || bin.startsWith('\\\\')) {
    return test(bin) ? { ok: true, issue: null } : { ok: false, issue: 'bin-missing' };
  }
  if (rel) {
    const a = path.resolve(base, bin), b = path.resolve(ROOT, bin);
    if (test(a)) return { ok: true, issue: null };
    if (test(b)) return { ok: false, issue: dir === ROOT ? 'missing' : 'root-only' };
    return { ok: false, issue: 'missing' };
  }
  const script = arr.slice(1).find(a => /\.(js|mjs|cjs|py)$/i.test(a) && !a.startsWith('-'));
  if (script) {
    const a = path.resolve(base, script), b = path.resolve(ROOT, script);
    if (test(a)) return { ok: true, issue: null };
    if (test(b)) return { ok: false, issue: dir === ROOT ? 'missing' : 'root-only' };
    return { ok: false, issue: 'missing' };
  }
  return { ok: true, issue: null };
}

// Env que el config pide con ${VAR} — si no está en .env ni en el proceso, falta
function envRequired(cmd, envObj) {
  const keys = new Set();
  const scan = s => {
    (String(s || '').match(/\$\{([A-Za-z0-9_]+)\}/g) || []).forEach(x => keys.add(x.slice(2, -1)));
    (String(s || '').match(/\{env:([A-Za-z0-9_]+)\}/g) || []).forEach(x => keys.add(x.slice(5, -1)));
  };
  if (envObj) Object.values(envObj).forEach(scan);
  scan(Array.isArray(cmd) ? cmd.join(' ') : cmd);
  return [...keys];
}

function stripAnsi(s) { return String(s).replace(/\x1b\[[0-9;]*m/g, ''); }

// Sondeo vivo: lo que OpenCode reporta de verdad (cwd = raíz)
function probeOpenCode() {
  let raw = '';
  try {
    raw = stripAnsi(execSync('opencode mcp list 2>&1', { shell: true, cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 300000 }));
  } catch (e) { raw = stripAnsi((e.stdout || '') + '\n' + (e.stderr || '')); }
  const servers = {};
  for (const b of raw.split('•').slice(1)) {
    const m = /^\s*([✓✗○●⏸])\s+(\S+)\s+(\w+)/.exec(b);
    if (!m) continue;
    const status = { '✓': 'connected', '✗': 'failed', '○': 'disabled', '●': 'unknown', '⏸': 'pending' }[m[1]] || m[1];
    const lines = b.split(/\r?\n/).map(s => s.replace(/[|\s]+$/, '').trim()).filter(Boolean).slice(1);
    const note = lines.find(s => /error|ENOENT|closed|Missing|not found|ECONN|refused/i.test(s)) || '';
    servers[m[2]] = { status, note };
  }
  return servers;
}

// Sondeo vivo: lo que Claude Code reporta de verdad (cwd = raíz)
function probeClaude() {
  let raw = '';
  try {
    raw = stripAnsi(execSync('claude mcp list 2>&1', { shell: true, cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 300000 }));
  } catch (e) { raw = stripAnsi((e.stdout || '') + '\n' + (e.stderr || '')); }
  const servers = {}, warn = {};
  for (const m of raw.matchAll(/^(\S+):\s+(.+?)\s+-\s+([√×⚠⏸])\s+(.+)$/gm)) {
    servers[m[1]] = { status: ({ '√': 'connected', '×': 'failed', '⚠': 'warning', '⏸': 'pending' })[m[3]], cmd: m[2], note: m[4].trim() };
  }
  for (const m of raw.matchAll(/\[Warning\]\s+\[([^\]]+)\]\s+(.+)/g)) warn[m[1]] = m[2].trim();
  return { servers, warn };
}

// --- Proyecto ---
function scanProject(name, dir, isRoot, reg, optimal, ctx) {
  const pkg = readJson(path.join(dir, 'package.json'));
  const oc = readJson(path.join(dir, 'opencode.json'));
  const mcpJson = readJson(path.join(dir, '.mcp.json'));

  const mcpActive = [], mcpOff = [];
  if (oc && oc.mcp) {
    for (const [k, v] of Object.entries(oc.mcp)) {
      const cmd = v.command ? (Array.isArray(v.command) ? v.command.join(' ') : v.command) : v.url || '';
      (v.enabled === false ? mcpOff : mcpActive).push({ name: k, type: v.type || (v.url ? 'remote' : 'local'), cmd });
    }
  }
  const claudeMcp = mcpJson && mcpJson.mcpServers ? Object.keys(mcpJson.mcpServers) : [];

  // Visibilidad por CLI + ruta/env por MCP
  const ocCfg = (oc && oc.mcp) || {};
  const localCfg = (mcpJson && mcpJson.mcpServers) || {};
  const claudeSee = {};
  // servidores globales de Claude solo se listan una vez (en root)
  if (isRoot) for (const k of Object.keys(ctx.cfg)) claudeSee[k] = 'global';
  for (const k of Object.keys(localCfg)) {
    const off = ctx.disabledMcp.includes(k);
    claudeSee[k] = off ? 'off' : (isRoot ? (ctx.autoApprove || ctx.enabledMcp.includes(k) ? 'mcpjson' : 'pending') : 'local');
  }
  const names = [...new Set([...Object.keys(ocCfg), ...Object.keys(claudeSee)])];
  const envKeys = loadEnvKeys(dir);
  const mcps = names.map(n => {
    const o = ocCfg[n];
    const lcfg = o ? null : (localCfg[n] || ctx.cfg[n]);
    const cmdArr = o
      ? (Array.isArray(o.command) ? o.command : (o.command ? [o.command] : (o.url ? [o.url] : [])))
      : claudeCmdArr(lcfg);
    const cwd = (o && o.cwd) || null;
    const req = envRequired(cmdArr, (o && (o.env || o.environment)) || (lcfg && (lcfg.env || lcfg.environment)) || null);
    return {
      name: n,
      oc: !o ? 'absent' : (o.enabled === false ? 'off' : 'on'),
      claude: claudeSee[n] || 'absent',
      cmd: cmdArr.join(' '),
      path: pathCheck(dir, cmdArr, cwd),
      envReq: req,
      envMissing: req.filter(k => !envKeys.has(k) && !process.env[k])
    };
  });

  const OC_SRC = ['.claude/skills', '.agents/skills', '.opencode/skills', '.ponytail/skills'];

  const skills = collectSkills(dir, isRoot ? ROOT_SKILL_DIRS : SKILL_DIRS);
  const otherMap = {};
  skills.filter(s => !OC_SRC.includes(s.src) && s.src !== '.claude/skills')
    .forEach(s => { const k = s.src.split('/').slice(0, 2).join('/'); otherMap[k] = (otherMap[k] || 0) + 1; });
  const skillsCli = {
    openCode: skills.filter(s => OC_SRC.includes(s.src)).length + (isRoot ? ctx.occSkills : 0),
    claude: skills.filter(s => s.src === '.claude/skills').length + (isRoot ? ctx.globalSkills : 0),
    other: Object.entries(otherMap).map(([k, v]) => k + ' (' + v + ')')
  };
  const entry = ['index.js', 'server.js', 'app.js', 'main.js', 'local-server-node.js'].find(f => exists(path.join(dir, f))) || null;
  const entryPort = entry ? findPort(path.join(dir, entry)) : null;

  const r = isRoot ? (reg.all.root || null) : (reg.byDir[name] || null);
  const ports = [...new Set([...(r ? r.ports : []), ...(entryPort ? [entryPort] : [])])];

  const opt = isRoot ? (optimal.root || []) : (optimal[name] || []);
  const act = mcpActive.map(m => m.name);
  const missing = opt.filter(m => !act.includes(m));
  const extra = act.filter(m => !opt.includes(m));
  const sync = opt.length === 0 ? (act.length ? 'CFG' : 'NA') : (missing.length + extra.length === 0 ? 'SYNC' : 'DESYNC');

  const hasServer = !!entry || ports.length > 0;
  const hasPkg = !!pkg;
  const hasTools = hasPkg || skills.length > 0 || mcpActive.length > 0 || mcpOff.length > 0 || claudeMcp.length > 0;
  let kind;
  if (isRoot) kind = 'ROOT';
  else if (hasServer && r) kind = 'INDEP';            // servidor propio + catalogado en projects.yaml
  else if (hasServer && !r) kind = 'NO-CAT';          // servidor propio NO catalogado
  else if (!hasServer && r) kind = 'BUILD';           // catalogado pero sin servidor (plantilla/build-time)
  else if (hasTools) kind = 'KIT';                    // scripts/libs/herramientas sin servidor propio
  else kind = 'ASSETS';

  return {
    name,
    kind,
    dir: isRoot ? '.' : name,
    pkg: pkg ? { name: pkg.name || name, scripts: Object.keys(pkg.scripts || {}), deps: Object.keys(pkg.dependencies || {}).length } : null,
    entry,
    ports,
    registry: r ? { key: r.key, db: r.db || null, desc: r.desc || null } : null,
    mcpActive, mcpOff, claudeMcp,
    mcps, skillsCli,
    skills,
    orphanSkills: skills.filter(s => !s.desc).length,
    optimal: opt, sync, missing, extra,
    agents: exists(path.join(dir, 'AGENTS.md')),
    claudeDoc: exists(path.join(dir, 'CLAUDE.md')),
    live: null
  };
}

(async () => {
  const reg = parseRegistry();
  const optimal = parseOptimal();
  const ctx = claudeContext();
  // skills globales de OpenCode (~/.config/opencode/skills)
  ctx.occSkills = countSkillDirs(path.join(process.env.USERPROFILE || '', '.config', 'opencode', 'skills'));

  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && !EXCLUDE.has(d.name))
    .map(d => d.name).sort();

  const projects = [scanProject('root', ROOT, true, reg, optimal, ctx)];
  for (const d of dirs) projects.push(scanProject(d, path.join(ROOT, d), false, reg, optimal, ctx));

  // --- Capabilities: skills consolidadas + agentes SuitOS + agentes Claude + grupos paralelos ---
  const agentsRegistry = parseAgentsRegistry();
  const claudeAgents = scanClaudeAgents();
  const parallelGroups = scanParallelGroups();

  const SKIP_SRC = new Set(['.ponytail/skills', 'agent/skills']); // vendored / copia de build obsoleta
  const SKIP_PROJECT = new Set(['open-design']); // submódulo externo (git propio), no es de SuitOrg
  const CLI_BY_SRC = { '.claude/skills': 'claude', '.opencode/skills': 'opencode', '.agents/skills': 'claude', 'skills': 'claude' };
  const seenSkill = new Map();
  const allSkills = [];
  for (const p of projects) {
    if (SKIP_PROJECT.has(p.name)) continue;
    for (const s of p.skills) {
      if (SKIP_SRC.has(s.src)) continue;
      const cli = s.src.startsWith('.suit/skills') ? 'suitos' : (CLI_BY_SRC[s.src] || 'otro');
      const key = p.name + '|' + s.name;
      const existing = seenSkill.get(key);
      if (existing) {
        if (!existing.cli.includes(cli)) existing.cli.push(cli);
        continue;
      }
      const entry = { name: s.name, desc: s.desc, project: p.name, src: s.src, cli: [cli] };
      seenSkill.set(key, entry);
      allSkills.push(entry);
    }
  }

  const rolesByAgent = {};
  for (const g of parallelGroups) {
    for (const s of g.parallelSteps) if (s.actor && s.actor !== '?') rolesByAgent[s.actor] = 'paralelo';
    if (g.thenStep && g.thenStep.actor && g.thenStep.actor !== '?') rolesByAgent[g.thenStep.actor] = 'orquestador';
  }
  for (const a of agentsRegistry) {
    const shortKey = Object.keys(rolesByAgent).find(k => a.name.startsWith(k));
    a.role = shortKey ? rolesByAgent[shortKey] : 'estándar';
  }

  const capabilities = { skills: allSkills, agents: agentsRegistry, claudeAgents, parallelGroups };
  const scriptsList = scanScripts();
  const pluginsList = scanPlugins();

  let probe = null;
  if (PROBE) {
    console.log('Sondeando OpenCode... (puede tardar ~1 min)');
    const oc = probeOpenCode();
    console.log('Sondeando Claude Code...');
    const cl = probeClaude();
    probe = { at: new Date().toISOString(), opencode: oc, claude: cl.servers, warn: cl.warn };
  }

  if (LIVE) {
    const allPorts = [...new Set(projects.flatMap(p => p.ports))];
    const results = await Promise.all(allPorts.map(p => checkPort(p).then(ok => [p, ok])));
    const up = new Set(results.filter(([, ok]) => ok).map(([p]) => p));
    for (const p of projects) {
      if (!p.ports.length) p.live = null;
      else p.live = p.ports.some(pt => up.has(pt)) ? 'up' : 'down';
    }
  }

  // conflictos de puerto (>1 proyecto en el mismo puerto)
  const owners = {};
  for (const p of projects) for (const pt of p.ports) (owners[pt] = owners[pt] || []).push(p.name);
  for (const p of projects) {
    p.portConflict = p.ports
      .filter(pt => owners[pt].length > 1)
      .map(pt => ({ port: pt, with: owners[pt].filter(n => n !== p.name) }));
  }

  // conserva el último sondeo si esta corrida no lo ejecutó
  if (!probe) {
    try {
      const prev = JSON.parse(readText(OUT).replace(/^window\.SUIT\s*=\s*/, '').replace(/;\s*$/, ''));
      probe = prev.probe || null;
    } catch { /* sin data previa */ }
  }

  const data = {
    generatedAt: new Date().toISOString(),
    live: LIVE,
    probe,
    claude: {
      allow: ctx.allow,
      globalSkills: ctx.globalSkills,
      autoApprove: ctx.autoApprove
    },
    projects,
    capabilities,
    scripts: scriptsList,
    plugins: pluginsList,
    catalog: Object.keys(optimal).length ? { optimal, registry: Object.keys(reg.all) } : { optimal, registry: [] }
  };

  fs.writeFileSync(OUT, 'window.SUIT = ' + JSON.stringify(data) + ';\n', 'utf8');

  const show = projects.filter(p => p.kind !== 'ASSETS');
  const kpis = {
    proyectos: show.length,
    conMcp: show.filter(p => p.mcpActive.length).length,
    conSkills: show.filter(p => p.skills.length).length,
    indep: show.filter(p => p.kind === 'INDEP').length,
    noCatalogados: show.filter(p => p.kind === 'NO-CAT').length,
    desync: show.filter(p => p.sync === 'DESYNC').length,
    conflictos: show.filter(p => p.portConflict && p.portConflict.length).length,
    up: LIVE ? show.filter(p => p.live === 'up').length : null
  };
  console.log(`SuitDashboard -> data.js  (${projects.length} dirs, ${projects.length - show.length} assets)`);
  console.log(JSON.stringify(kpis));
  console.log(`MCPs activos: ${projects.reduce((a, p) => a + p.mcpActive.length, 0)} | Skills: ${projects.reduce((a, p) => a + p.skills.length, 0)}`);
  const allMcp = projects.flatMap(p => p.mcps || []);
  console.log(`CLI: ${allMcp.length} filas MCP | OpenCode ve ${allMcp.filter(m => m.oc !== 'absent').length} | Claude ve ${allMcp.filter(m => m.claude !== 'absent').length} | rutas rotas ${allMcp.filter(m => !m.path.ok).length} | env faltante ${allMcp.filter(m => m.envMissing.length).length}`);
  if (probe) console.log(`Sondeo: ${Object.values(probe.opencode).filter(s => s.status === 'failed').length} fallan en OpenCode | ${Object.values(probe.claude).filter(s => s.status === 'failed').length} fallan en Claude`);
  console.log(`Capabilities: ${capabilities.skills.length} skills (claude ${capabilities.skills.filter(s => s.cli.includes('claude')).length} | opencode ${capabilities.skills.filter(s => s.cli.includes('opencode')).length} | suitos ${capabilities.skills.filter(s => s.cli.includes('suitos')).length}) | ${capabilities.agents.length} agentes SuitOS (${capabilities.agents.filter(a => a.role === 'paralelo').length} paralelo, ${capabilities.agents.filter(a => a.role === 'orquestador').length} orquestador) | ${capabilities.claudeAgents.length} agentes Claude nativos | ${capabilities.parallelGroups.length} grupos paralelos`);
  console.log(`Scripts: ${scriptsList.length} en scripts/ | Plugins: ${pluginsList.length} (${pluginsList.filter(p => p.claude).length} Claude, ${pluginsList.filter(p => p.opencode).length} OpenCode)`);
})().catch(e => { console.error(e); process.exit(1); });
