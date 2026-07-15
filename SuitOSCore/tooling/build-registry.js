#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CORE_DIR = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(CORE_DIR, 'skills');
const AGENTS_DIR = path.join(CORE_DIR, 'agents');
const REGISTRY_DIR = path.join(CORE_DIR, 'registry');
const MCP_OUTPUT = path.join(CORE_DIR, 'registry-mcp.json');

const args = process.argv.slice(2);
const VALIDATE_ONLY = args.includes('--validate') || args.includes('--check');
const GEN_MCP = args.includes('--mcp');
const RUN_SERVER = args.includes('--server');
const RUN_WATCH = args.includes('--watch');
const RUN_VERIFY = args.includes('--verify');
const SERVER_PORT = (() => { const i = args.indexOf('--port'); return i !== -1 && args[i+1] ? parseInt(args[i+1], 10) : 3100; })();

let exitCode = 0;
const errors = [];

function logError(msg) { errors.push(msg); console.error('  ERROR: ' + msg); exitCode = 1; }

function warn(msg) { console.warn('  WARN: ' + msg); }

function loadYamlSimple(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1 }];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = raw.search(/\S/);
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();

    if (trimmed.endsWith(':')) {
      const key = trimmed.slice(0, -1).trim();
      const newObj = {};
      stack[stack.length - 1].obj[key] = newObj;
      stack.push({ obj: newObj, indent });
    } else if (trimmed.includes(': ') && !trimmed.startsWith('- ')) {
      const colonIdx = trimmed.indexOf(': ');
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 2).trim().replace(/^"/, '').replace(/"$/, '').replace(/^'/, '').replace(/'$/, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === '[]') val = [];
      else if (/^\d+$/.test(val)) val = parseInt(val, 10);
      else if (/^\d+\.\d+$/.test(val)) val = parseFloat(val);
      stack[stack.length - 1].obj[key] = val;
    } else if (trimmed.startsWith('- ')) {
      const val = trimmed.slice(2).trim().replace(/"/g, '');
      const parent = stack[stack.length - 1].obj;
      if (!parent._items) parent._items = [];
      parent._items.push(val);
    }
  }
  // Normalize _items => array for any property that has them
  function normalize(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (obj._items && Object.keys(obj).length === 1) {
      // This whole object is an array — handled by caller
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k === '_items') continue;
      if (v && typeof v === 'object') {
        if (v._items && Object.keys(v).length === 1) {
          obj[k] = v._items;
        } else {
          normalize(v);
        }
      }
    }
  }
  normalize(root);
  return root;
}

function dumpYamlSimple(obj, indent) {
  indent = indent || 0;
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);
  let out = '';
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object') {
      for (const item of obj) {
        out += pad + '- ';
        let first = true;
        for (const [k, v] of Object.entries(item)) {
          if (first) { out += k + ': ' + (typeof v === 'string' ? JSON.stringify(v) : v) + '\n'; first = false; }
          else out += padInner + k + ': ' + (typeof v === 'string' ? JSON.stringify(v) : v) + '\n';
        }
      }
    } else {
      for (const item of obj) out += pad + '- ' + (typeof item === 'string' ? JSON.stringify(item) : item) + '\n';
    }
  } else if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === '_items') continue;
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0) {
        out += pad + k + ':\n' + dumpYamlSimple(v, indent + 1);
      } else if (Array.isArray(v)) {
        out += pad + k + ':\n' + dumpYamlSimple(v, indent + 1);
      } else {
        out += pad + k + ': ' + (typeof v === 'string' ? JSON.stringify(v) : v) + '\n';
      }
    }
  }
  return out;
}

function collectArray(parent) {
  if (!parent) return [];
  if (parent._items) return parent._items;
  for (const k of Object.keys(parent)) {
    if (Array.isArray(parent[k])) return parent[k];
  }
  return [];
}

function collectObjectArray(parent) {
  if (!parent) return [];
  if (Array.isArray(parent)) return parent;
  const result = [];
  for (const [k, v] of Object.entries(parent)) {
    if (v && typeof v === 'object') {
      result.push({ ...v, _key: k });
    }
  }
  return result;
}

function scanManifests(dir, acceptNames) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      results.push(...scanManifests(path.join(dir, entry.name), acceptNames));
    } else if (entry.isFile()) {
      for (const name of acceptNames) {
        if (entry.name === name || entry.name.endsWith(name)) {
          results.push(path.join(dir, entry.name));
          break;
        }
      }
    }
  }
  return results;
}

function validateManifest(data, filePath, type) {
  const errors = [];
  if (type === 'skill') {
    const s = data.skill || data;
    if (!s.name) errors.push(filePath + ': missing skill.name');
    if (!s.description) errors.push(filePath + ': missing skill.description');
    if (!s.type) errors.push(filePath + ': missing skill.type');
  } else if (type === 'agent') {
    const a = data.agent || data;
    if (!a.name) errors.push(filePath + ': missing agent.name');
    if (!a.description) errors.push(filePath + ': missing agent.description');
  }
  return errors;
}

function parseExistingEntries(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;
  const parsed = loadYamlSimple(filePath);
  const rootKey = filePath.includes('skills') ? 'skills' : 'agents';
  const entries = parsed[rootKey];
  if (!entries || typeof entries !== 'object') return result;
  for (const [k, v] of Object.entries(entries)) {
    result[k] = v;
  }
  return result;
}

function mergeEntries(existing, fromManifests) {
  const merged = {};
  for (const [name, entry] of Object.entries(existing)) {
    if (!fromManifests[name]) merged[name] = entry;
  }
  for (const [name, entry] of Object.entries(fromManifests)) {
    merged[name] = entry;
  }
  return merged;
}

function stripInternal(obj) {
  const entry = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    entry[k] = v;
  }
  return entry;
}

function scanAndBuild() {
  console.log('\n  Building registry from manifests...\n');

  const skillManifests = scanManifests(SKILLS_DIR, ['skill.yaml', '.skill.yaml']);
  const agentManifests = scanManifests(AGENTS_DIR, ['agent.yaml', '.agent.yaml']);

  console.log('  Found ' + skillManifests.length + ' skill manifest(s), ' + agentManifests.length + ' agent manifest(s)');

  const skills = {};
  for (const mf of skillManifests) {
    const raw = loadYamlSimple(mf);
    const skill = raw.skill || raw;
    const valErrors = validateManifest(raw, mf, 'skill');
    for (const e of valErrors) logError(e);
    if (skills[skill.name]) logError('Duplicate skill name: ' + skill.name);
    skill._source = mf;
    skills[skill.name] = skill;
  }

  for (const [name, skill] of Object.entries(skills)) {
    const deps = skill.dependencies || [];
    for (const d of deps) {
      if (d !== 'javascript' && !skills[d]) {
        warn('Skill "' + name + '" depends on "' + d + '" without manifest — ensure it exists in registry/');
      }
    }
  }

  const agents = {};
  for (const mf of agentManifests) {
    const raw = loadYamlSimple(mf);
    const agent = raw.agent || raw;
    const valErrors = validateManifest(raw, mf, 'agent');
    for (const e of valErrors) logError(e);
    if (agents[agent.name]) logError('Duplicate agent name: ' + agent.name);
    agent._source = mf;
    agents[agent.name] = agent;
  }

  for (const [name, agent] of Object.entries(agents)) {
    const reqSkills = agent.required_skills || [];
    for (const s of reqSkills) {
      if (!skills[s]) {
        warn('Agent "' + name + '" requires skill "' + s + '" without manifest');
      }
    }
  }

  const existingSkills = parseExistingEntries(path.join(REGISTRY_DIR, 'skills.yaml'));
  const skillsFromManifests = {};
  for (const [name, skill] of Object.entries(skills)) skillsFromManifests[name] = stripInternal(skill);
  const mergedSkills = mergeEntries(existingSkills, skillsFromManifests);

  const existingAgents = parseExistingEntries(path.join(REGISTRY_DIR, 'agents.yaml'));
  const agentsFromManifests = {};
  for (const [name, agent] of Object.entries(agents)) agentsFromManifests[name] = stripInternal(agent);
  const mergedAgents = mergeEntries(existingAgents, agentsFromManifests);

  return { mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests };
}

function writeRegistryFiles(mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests) {
  let out = '# Auto-generated by tooling/build-registry.js — DO NOT EDIT BY HAND\n';
  out += '# Add/remove skills by creating *.skill.yaml manifests in skills/\n';
  out += '# Run: npm run build-registry\n\nskills:\n';
  for (const [name, entry] of Object.entries(mergedSkills)) {
    out += '  ' + name + ':\n';
    for (const [k, v] of Object.entries(entry)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'string') out += '    ' + k + ': ' + JSON.stringify(v) + '\n';
      else if (Array.isArray(v)) out += '    ' + k + ':\n' + dumpYamlSimple(v, 3);
      else if (typeof v === 'object') out += '    ' + k + ':\n' + dumpYamlSimple(v, 3);
      else out += '    ' + k + ': ' + v + '\n';
    }
  }
  fs.writeFileSync(path.join(REGISTRY_DIR, 'skills.yaml'), out, 'utf8');
  console.log('  Wrote registry/skills.yaml (' + Object.keys(mergedSkills).length + ' skills, ' + Object.keys(skillsFromManifests).length + ' from manifests)');

  out = '# Auto-generated by tooling/build-registry.js — DO NOT EDIT BY HAND\n';
  out += '# Add/remove agents by creating *.agent.yaml manifests in agents/\n';
  out += '# Run: npm run build-registry\n\nagents:\n';
  for (const [name, entry] of Object.entries(mergedAgents)) {
    out += '  ' + name + ':\n';
    for (const [k, v] of Object.entries(entry)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
      if (Array.isArray(v) && v.length === 0) continue;
      if (typeof v === 'string') out += '    ' + k + ': ' + JSON.stringify(v) + '\n';
      else if (Array.isArray(v)) out += '    ' + k + ':\n' + dumpYamlSimple(v, 3);
      else if (typeof v === 'object') out += '    ' + k + ':\n' + dumpYamlSimple(v, 3);
      else out += '    ' + k + ': ' + v + '\n';
    }
  }
  fs.writeFileSync(path.join(REGISTRY_DIR, 'agents.yaml'), out, 'utf8');
  console.log('  Wrote registry/agents.yaml (' + Object.keys(mergedAgents).length + ' agents, ' + Object.keys(agentsFromManifests).length + ' from manifests)');
}

function writeMcpJson(mergedSkills) {
  const mcpTools = [];
  for (const [name, skill] of Object.entries(mergedSkills)) {
    mcpTools.push({
      name: 'skill_' + name.replace(/-/g, '_'),
      description: skill.description || name,
      inputSchema: {
        type: 'object',
        properties: {
          context: { type: 'string', description: 'Input context for the skill' },
          project_root: { type: 'string', description: 'Project root path (optional)' }
        }
      }
    });
  }
  fs.writeFileSync(MCP_OUTPUT, JSON.stringify({ schemaVersion: '1.0', tools: mcpTools }, null, 2), 'utf8');
  console.log('  Wrote registry-mcp.json (' + mcpTools.length + ' MCP tools)');
}

function verifyRegistry(mergedSkills) {
  console.log('\n  Verifying registry...\n');
  let ok = true;

  for (const [name, skill] of Object.entries(mergedSkills)) {
    const patterns = skill.triggers || [];
    for (const t of patterns) {
      if (typeof t === 'object' && t.file_pattern) {
        const pat = t.file_pattern;
        if (pat.startsWith('**/')) continue;
        const glob = pat.replace(/\*\*/g, '').replace(/\*/g, '');
        const basedir = path.join(CORE_DIR, pat.split('/')[0] || '');
        if (!fs.existsSync(basedir)) {
          warn('Skill "' + name + '": referenced path "' + pat + '" not found');
          ok = false;
        }
      }
    }

    const deps = skill.dependencies || [];
    for (const d of deps) {
      if (!mergedSkills[d] && d !== 'javascript') {
        warn('Skill "' + name + '": dependency "' + d + '" not found in registry');
        ok = false;
      }
    }
  }

  if (ok) console.log('  All skills verified OK.\n');
  else console.log('  Verification completed with warnings.\n');
  return ok;
}

function startMCPServer(mergedSkills) {
  const http = require('http');
  const skillsList = [];

  for (const [name, skill] of Object.entries(mergedSkills)) {
    skillsList.push({
      name: 'skill_' + name.replace(/-/g, '_'),
      description: skill.description || name,
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to the file to analyze' },
          context: { type: 'string', description: 'Additional context or instructions' }
        }
      }
    });
  }

  function handleList(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools: skillsList }));
  }

  function handleCall(body, res) {
    const toolName = body.name || '';
    const skillEntry = skillsList.find(t => t.name === toolName);
    if (!skillEntry) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unknown tool: ' + toolName }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      content: [{
        type: 'text',
        text: 'Tool "' + toolName + '" discovered. Description: ' + (skillEntry.description || 'No description')
      }]
    }));
  }

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const url = req.url || '';
      if (url === '/mcp/v1/tools/list' || url === '/tools/list' || url === '/tools') {
        handleList(res);
      } else if (url === '/mcp/v1/tools/call' || url === '/tools/call') {
        handleCall(parsed, res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found. Try POST /mcp/v1/tools/list' }));
      }
    });
  });

  server.listen(SERVER_PORT, () => {
    console.log('\n  MCP Registry Server running on http://localhost:' + SERVER_PORT);
    console.log('  Endpoints:');
    console.log('    POST /mcp/v1/tools/list  — List all skills as MCP tools');
    console.log('    POST /mcp/v1/tools/call  — Call a skill by name');
    console.log('  Skills registered: ' + skillsList.length + '\n');
  });

  return server;
}

function startWatch() {
  const dirs = [SKILLS_DIR, AGENTS_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.endsWith('.skill.yaml') || filename.endsWith('.agent.yaml') || filename === 'skill.yaml' || filename === 'agent.yaml') {
        console.log('\n  Change detected in ' + filename + ' — rebuilding...');
        const { mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests } = scanAndBuild();
        if (exitCode === 0) {
          writeRegistryFiles(mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests);
          if (GEN_MCP) writeMcpJson(mergedSkills);
          console.log('\n  Watching for changes...');
        }
      }
    });
  }
  console.log('  Watching ' + dirs.filter(d => fs.existsSync(d)).join(', ') + ' for changes...\n');
}

// ===== MAIN =====

if (RUN_SERVER) {
  const data = scanAndBuild();
  writeRegistryFiles(data.mergedSkills, data.mergedAgents, data.skillsFromManifests, data.agentsFromManifests);
  if (GEN_MCP) writeMcpJson(data.mergedSkills);
  const server = startMCPServer(data.mergedSkills);
  if (RUN_WATCH) startWatch();
  return;
}

if (RUN_VERIFY) {
  const { mergedSkills } = scanAndBuild();
  verifyRegistry(mergedSkills);
  return;
}

if (VALIDATE_ONLY) {
  scanAndBuild();
  if (exitCode !== 0) { console.log('\n  Validation FAILED.\n'); process.exit(1); }
  console.log('  Validation passed.\n');
  return;
}

// Default: build + (optional) MCP JSON
const { mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests } = scanAndBuild();
if (exitCode !== 0) { console.log('\n  Build skipped due to errors.\n'); process.exit(1); }
writeRegistryFiles(mergedSkills, mergedAgents, skillsFromManifests, agentsFromManifests);
if (GEN_MCP) writeMcpJson(mergedSkills);
if (RUN_WATCH) startWatch();
console.log('\n  Done.\n');
