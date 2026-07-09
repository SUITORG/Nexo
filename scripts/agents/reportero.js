#!/usr/bin/env node
/**
 * reportero — SuitOS Code Reviewer Agent
 * Version: 1.0.0
 * Purpose: Read-only code analysis. Scans files, finds issues, proposes improvements.
 *          Never modifies files. Integrates with SuitOS reviewer/profiles.yaml.
 *
 * Usage:
 *   node scripts/agents/reportero.js --file server.js
 *   node scripts/agents/reportero.js --file server.js --profile security
 *   node scripts/agents/reportero.js --file server.js --profile architecture --output custom.md
 *
 * Flags:
 *   --file     Target file (relative to project root, required)
 *   --profile  Review profile: quick | standard | architecture | security (default: standard)
 *   --output   Custom output path (default: .suit/logs/review/{timestamp}-{filename}.md)
 *   --scope    Custom scope description for the report header
 */
const fs = require('fs');
const path = require('path');

// --- Config ---
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PROFILES_PATH = path.join(PROJECT_ROOT, '.suit/reviewer/profiles.yaml');
const LOG_DIR = path.join(PROJECT_ROOT, '.suit/logs/review');

// Severity icons
const ICONS = { error: '🔴', warning: '🟡', improvement: '🔵' };
const SEVERITY_LABELS = { error: 'Crítico', warning: 'Warning', improvement: 'Mejora' };

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '');
    args[key] = process.argv[i + 1];
  }
  if (!args.file) {
    console.error('Usage: node scripts/agents/reportero.js --file <path> [--profile quick|standard|architecture|security] [--output <path>]');
    process.exit(1);
  }
  return args;
}

// --- YAML parser for reviewer/profiles.yaml structure ---
function loadProfiles(filePath) {
  const yamlText = fs.readFileSync(filePath, 'utf8');
  const lines = yamlText.split('\n');
  const profiles = {};
  let currentProfile = null;
  let currentCheck = null;
  let inPatterns = false;
  let inExclude = false;

  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Top-level profiles key
    if (indent === 0 && trimmed === 'profiles:') continue;

    // Profile name (indent 2, no dash)
    if (indent === 2 && !trimmed.startsWith('-') && trimmed.endsWith(':')) {
      currentProfile = { name: trimmed.slice(0, -1), checks: [], extends: null, description: '' };
      profiles[currentProfile.name] = currentProfile;
      currentCheck = null;
      inPatterns = false;
      inExclude = false;
      continue;
    }

    if (!currentProfile) continue;

    // Profile properties (indent 4)
    if (indent === 4 && !trimmed.startsWith('-')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim().replace(/^"/, '').replace(/"$/, '').replace(/^'/, '').replace(/'$/, '');
      if (key === 'description') currentProfile.description = val;
      if (key === 'extends') currentProfile.extends = val;
      if (key === 'checks') { inPatterns = false; inExclude = false; }
      continue;
    }

    // Check entry (indent 6, starts with -)
    if (indent === 6 && trimmed.startsWith('- id:')) {
      const id = trimmed.replace('- id:', '').trim();
      currentCheck = { id };
      currentProfile.checks.push(currentCheck);
      inPatterns = false;
      inExclude = false;
      continue;
    }

    if (!currentCheck) continue;

    // Check properties (indent 8+)
    if (indent >= 8) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) {
        // Array item
        const val = trimmed.replace(/^- /, '');
        if (inPatterns) {
          if (!currentCheck.patterns) currentCheck.patterns = [];
          currentCheck.patterns.push(val.replace(/"/g, ''));
        }
        if (inExclude) {
          if (!currentCheck.exclude) currentCheck.exclude = [];
          currentCheck.exclude.push(val.replace(/"/g, ''));
        }
        continue;
      }
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim().replace(/^"/, '').replace(/"$/, '').replace(/^'/, '').replace(/'$/, '');

      if (key === 'description') currentCheck.description = val;
      else if (key === 'severity') currentCheck.severity = val;
      else if (key === 'auto_fix') currentCheck.auto_fix = val === 'true';
      else if (key === 'patterns') {
        inPatterns = true;
        inExclude = false;
        if (val) {
          currentCheck.patterns = [val.replace(/"/g, '')];
        } else {
          currentCheck.patterns = [];
        }
      }
      else if (key === 'exclude') {
        inExclude = true;
        inPatterns = false;
        if (val) {
          currentCheck.exclude = [val.replace(/"/g, '')];
        } else {
          currentCheck.exclude = [];
        }
      }
      else if (key === 'check' || key === 'file_pattern') {
        if (!currentCheck.checks) currentCheck.checks = [];
        currentCheck.checks.push(val.replace(/"/g, ''));
      }
      else {
        currentCheck[key] = val;
      }
      continue;
    }

    // Reset on lower indent
    if (indent < 6) {
      currentCheck = null;
      inPatterns = false;
      inExclude = false;
    }
  }

  // Resolve extends
  for (const name of Object.keys(profiles)) {
    const p = profiles[name];
    if (p.extends && profiles[p.extends]) {
      const parent = profiles[p.extends];
      p.checks = [...parent.checks, ...p.checks];
    }
  }

  return profiles;
}

function getProfileChecks(profiles, profileName) {
  const p = profiles[profileName];
  if (!p) {
    console.warn(`Profile "${profileName}" not found. Falling back to standard.`);
    return profiles['standard']?.checks || [];
  }
  return p.checks || [];
}

// --- Pattern scanning ---
function scanPatterns(content, lines, check, filePath) {
  const findings = [];
  const patterns = check.patterns || [];

  for (const pattern of patterns) {
    let regex;
    try { regex = new RegExp(pattern.replace(/"/g, ''), 'gi'); } catch (e) { continue; }

    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      const lineContent = (lines[lineNum - 1] || '').trim();

      // Skip false positives
      if (check.id === 'secrets' || check.id === 'hardcoded-keys') {
        if (lineContent.includes('process.env') || lineContent.includes('require(') || lineContent.includes('import ')) continue;
        // Skip 'sk-' when it's inside a template literal variable like TASK-${...}
        if (pattern === 'sk-') {
          var beforeMatch = content.slice(Math.max(0, match.index - 5), match.index);
          if (beforeMatch.includes('${') || beforeMatch.includes('$')) continue;
          var afterSemi = content.slice(match.index + 3, match.index + 10);
          if (afterSemi.includes('${')) continue;
        }
        // Skip 'eyJ' in non-assignment contexts (imports, comments about JWT)
        if (pattern === 'eyJ') {
          var lineBefore = lineContent.substring(0, Math.min(20, lineContent.length));
          if (!lineBefore.includes('=') && !lineBefore.includes(':')) continue;
        }
      }
      if (check.id === 'debug') {
        if (pattern.toLowerCase() === 'todo' && lineContent.includes('// TODO')) continue;
        if (pattern.toLowerCase() === 'fixme' && lineContent.includes('// FIXME')) continue;
      }

      findings.push({
        checkId: check.id,
        severity: check.severity || 'warning',
        line: lineNum,
        code: lineContent.substring(0, 120),
        pattern: pattern
      });
    }
  }

  // For checks that have sub-checks (like multi-tenant), do semantic analysis
  if (check.checks && Array.isArray(check.checks)) {
    for (const subCheck of check.checks) {
      if (typeof subCheck === 'string') {
        if (subCheck.includes('id_empresa') && filePath.endsWith('.js')) {
          if (!/id_empresa/.test(content) && !/\.eq\(/.test(content)) {
            findings.push({
              checkId: check.id,
              severity: check.severity || 'error',
              line: 1,
              code: '(whole file)',
              pattern: subCheck,
              semantic: true
            });
          }
        }
        if (subCheck.includes('DELETE') && !filePath.endsWith('.sql') && !filePath.endsWith('.gs')) {
          const deleteMatches = content.match(/DELETE\s+(FROM\s+)?/gi);
          if (deleteMatches) {
            for (const dm of deleteMatches) {
              const lineNum = content.slice(0, content.indexOf(dm) + 1).split('\n').length;
              findings.push({
                checkId: check.id,
                severity: check.severity || 'error',
                line: lineNum,
                code: dm.trim(),
                pattern: subCheck,
                semantic: true
              });
            }
          }
        }
      }
    }
  }

  return findings;
}

// --- Contextual analysis ---
function analyzeComplexity(lines) {
  const findings = [];
  let currentFunc = null;
  let funcStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const funcMatch = line.match(/(?:function|=>)\s*(?:\w+\s*)?[\(=]/);
    if (funcMatch && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      if (currentFunc) {
        const lineCount = i - funcStart;
        if (lineCount > 80) {
          findings.push({
            checkId: 'complexity',
            severity: 'improvement',
            line: funcStart + 1,
            code: (currentFunc + ' (' + lineCount + ' líneas)').substring(0, 120),
            pattern: 'Función muy larga (>80 líneas). Dividir en funciones más pequeñas.'
          });
        }
      }
      currentFunc = line.trim().substring(0, 60);
      funcStart = i;
    }

    const callbackDepth = (line.match(/function\s*\(/g) || []).length +
      (line.match(/=>\s*[^,]/g) || []).length +
      (line.match(/\.then\(/g) || []).length;

    if (callbackDepth >= 3 && !line.trim().startsWith('//')) {
      findings.push({
        checkId: 'callback-hell',
        severity: 'improvement',
        line: i + 1,
        code: line.trim().substring(0, 100),
        pattern: 'Anidamiento excesivo (' + callbackDepth + '+ callbacks). Usar async/await.'
      });
    }
  }

  if (currentFunc) {
    const lineCount = lines.length - funcStart;
    if (lineCount > 80) {
      findings.push({
        checkId: 'complexity',
        severity: 'improvement',
        line: funcStart + 1,
        code: (currentFunc + ' (' + lineCount + ' líneas)').substring(0, 120),
        pattern: 'Función muy larga (>80 líneas). Dividir en funciones más pequeñas.'
      });
    }
  }

  return findings;
}

function analyzeDuplication(lines) {
  const findings = [];
  const blocks = {};
  const MIN_BLOCK = 4;

  for (let i = 0; i < lines.length - MIN_BLOCK; i++) {
    const block = lines.slice(i, i + MIN_BLOCK)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('import') && !l.startsWith('require'))
      .join('\n');
    if (block.length < 30) continue;
    const hash = simpleHash(block);
    if (!blocks[hash]) blocks[hash] = { block, count: 0, lines: [] };
    blocks[hash].count++;
    blocks[hash].lines.push(i + 1);
  }

  for (const key of Object.keys(blocks)) {
    if (blocks[key].count >= 3) {
      const occurrences = blocks[key].lines.slice(0, 4).join(', ');
      const sample = blocks[key].block.split('\n').slice(0, 3).join('; ');
      findings.push({
        checkId: 'duplication',
        severity: 'improvement',
        line: blocks[key].lines[0],
        code: sample.substring(0, 80),
        pattern: 'Código duplicado (' + blocks[key].count + 'x) en líneas ' + occurrences + '. Extraer a función compartida.'
      });
      // Mark all duplicates as seen
      for (const otherKey of Object.keys(blocks)) {
        if (otherKey !== key && blocks[otherKey].block === blocks[key].block) {
          delete blocks[otherKey];
        }
      }
    }
  }

  return findings;
}

function analyzeRobustness(content, lines) {
  const findings = [];
  const hasAsync = content.includes('async');
  const hasFetch = content.includes('fetch(');
  const hasThen = content.includes('.then(');
  const hasTryCatch = content.includes('try') || content.includes('.catch(');

  if ((hasAsync || hasFetch || hasThen) && !hasTryCatch) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if ((line.includes('await ') || line.includes('fetch(') || line.includes('.then(')) &&
        !line.trim().startsWith('//')) {
        const above = lines.slice(Math.max(0, i - 3), i).join(' ');
        if (!above.includes('try')) {
          findings.push({
            checkId: 'error-handling',
            severity: 'warning',
            line: i + 1,
            code: line.trim().substring(0, 100),
            pattern: 'Operación async sin try/catch. Agregar manejo de errores.'
          });
          break;
        }
      }
    }
  }

  const nullPattern = /\.(find|filter|findIndex)\([^)]*\)\./g;
  let match;
  while ((match = nullPattern.exec(content)) !== null) {
    if (!content.slice(Math.max(0, match.index - 40), match.index).includes('?.')) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      findings.push({
        checkId: 'null-safety',
        severity: 'improvement',
        line: lineNum,
        code: (lines[lineNum - 1] || '').trim().substring(0, 100),
        pattern: 'Acceso sin optional chaining (?.) después de ' + match[1] + '(). Usar resultado?.[prop] o validar.'
      });
    }
  }

  return findings;
}

function analyzeDeadCode(lines) {
  const findings = [];
  let commentBlock = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//') && !trimmed.includes('TODO') && !trimmed.includes('FIXME') &&
      !trimmed.startsWith('// ---') && !trimmed.startsWith('// =') && !trimmed.startsWith('// #') &&
      !trimmed.match(/^\/\/ \d+:/) && !trimmed.startsWith('// Copyright') &&
      !trimmed.startsWith('// SPDX')) {
      commentBlock.push(i);
    } else {
      if (commentBlock.length >= 4) {
        findings.push({
          checkId: 'dead-code',
          severity: 'improvement',
          line: commentBlock[0] + 1,
          code: 'Líneas ' + (commentBlock[0] + 1) + '-' + (commentBlock[commentBlock.length - 1] + 1) + ' (bloque de ' + commentBlock.length + ' líneas)',
          pattern: 'Código muerto comentado. Eliminar si no se necesita (git history lo conserva).'
        });
      }
      commentBlock = [];
    }
  }

  return findings;
}

function analyzeConsistency(content) {
  const findings = [];

  if (/\bvar\s/.test(content) && (/\blet\s/.test(content) || /\bconst\s/.test(content))) {
    findings.push({
      checkId: 'consistency',
      severity: 'improvement',
      line: 1,
      code: 'Mezcla de var/let/const',
      pattern: 'Mezcla de var, let y const. Usar const por defecto, let solo cuando se requiera reasignación.'
    });
  }

  const singleQuotes = (content.match(/'/g) || []).length;
  const doubleQuotes = (content.match(/"/g) || []).length;
  if (singleQuotes > 5 && doubleQuotes > 5) {
    findings.push({
      checkId: 'consistency',
      severity: 'improvement',
      line: 1,
      code: 'Mezcla de \'...\' y "..."',
      pattern: 'Mezcla de comillas simples (' + singleQuotes + ') y dobles (' + doubleQuotes + '). Estandarizar a un estilo.'
    });
  }

  return findings;
}

function analyzeAcoplamiento(content) {
  const findings = [];
  const basePatterns = ['../backend/', '../CampanasAi/', '../citas/', '../../', '../node_modules/'];

  for (const bp of basePatterns) {
    const escaped = bp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp("require\\s*\\(\\s*['\"]" + escaped + "[^'\"]+['\"]", 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      findings.push({
        checkId: 'coupling',
        severity: 'improvement',
        line: lineNum,
        code: match[0].substring(0, 80),
        pattern: 'Dependencia externa/deep: ' + match[0] + '. Evaluar si puede abstraerse.'
      });
    }
  }

  return findings;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// --- Report generation ---
function generateReport(targetPath, profileName, findings, scope) {
  const filename = path.basename(targetPath);
  const targetContent = fs.readFileSync(targetPath, 'utf8');
  const totalLines = targetContent.split('\n').length;
  const fileExt = path.extname(targetPath);

  const errors = findings.filter(function(f) { return f.severity === 'error'; });
  const warnings = findings.filter(function(f) { return f.severity === 'warning'; });
  const improvements = findings.filter(function(f) { return f.severity === 'improvement'; });

  var md = '';
  md += '# Code Review: ' + filename + '\n';
  md += 'Date: ' + new Date().toISOString().slice(0, 10) + '\n';
  md += 'Profile: ' + profileName + '\n';
  md += 'Scope: ' + (scope || filename + ' (' + totalLines + ' líneas, ' + fileExt + ')') + '\n\n';

  md += '## Resumen\n\n';
  md += '- ' + ICONS.error + ' **' + errors.length + '** críticos\n';
  md += '- ' + ICONS.warning + ' **' + warnings.length + '** warnings\n';
  md += '- ' + ICONS.improvement + ' **' + improvements.length + '** mejoras propuestas\n';
  md += '- Archivo: `' + targetPath + '` (' + totalLines + ' líneas)\n\n';

  if (!findings.length) {
    md += '_No se encontraron issues._\n\n';
    md += '## Archivos revisados\n';
    md += '- `' + targetPath + '` (' + totalLines + ' líneas)\n';
    md += '- 0 archivos modificados (agente read-only)\n\n';
    md += '---\n*Reporte generado por reportero v1.0.0 (SuitOS Code Reviewer)*\n*Read-only: ningún archivo fue modificado.*\n';
    return md;
  }

  var issueCount = 0;
  var allFindings = errors.concat(warnings).concat(improvements);

  for (var fi = 0; fi < allFindings.length; fi++) {
    var f = allFindings[fi];
    issueCount++;
    var icon = ICONS[f.severity] || '🔵';
    var label = SEVERITY_LABELS[f.severity] || 'Issue';
    var checkLabel = f.checkId ? ' (' + f.checkId + ')' : '';

    md += '### ' + icon + ' ' + label + ' #' + issueCount + checkLabel + '\n';
    md += '**Línea**: ' + f.line + '\n';
    md += '**Código**: `' + (f.code || '(sin contexto)') + '`\n';
    md += '**Problema**: ' + f.pattern + '\n';
    md += '**Propuesta**: ' + generateProposal(f) + '\n';
    md += '**Referencia**: `.suit/reviewer/profiles.yaml` → perfil `' + profileName + '` → check `' + f.checkId + '`\n\n';
  }

  md += '## Archivos revisados\n';
  md += '- `' + targetPath + '` (' + totalLines + ' líneas)\n';
  md += '- 0 archivos modificados (agente read-only)\n\n';
  md += '---\n';
  md += '*Reporte generado por reportero v1.0.0 (SuitOS Code Reviewer)*\n';
  md += '*Read-only: ningún archivo fue modificado.*\n';
  return md;
}

function generateProposal(finding) {
  if (finding.checkId === 'secrets' || finding.checkId === 'hardcoded-keys') {
    return 'Mover a `.env` y leer con `process.env.VARIABLE`.';
  }
  if (finding.checkId === 'debug') {
    if (finding.pattern && finding.pattern.toLowerCase().includes('console.log')) return 'Eliminar o reemplazar por logger controlado.';
    if (finding.pattern && (finding.pattern.toLowerCase().includes('todo') || finding.pattern.toLowerCase().includes('fixme'))) return 'Resolver o documentar en sistema de tickets.';
    return 'Eliminar código de debug.';
  }
  if (finding.checkId === 'complexity') {
    return 'Extraer bloques lógicos a funciones independientes (idealmente <30 líneas c/u).';
  }
  if (finding.checkId === 'callback-hell') {
    return 'Convertir a async/await y usar Promise.all() para operaciones paralelas.';
  }
  if (finding.checkId === 'duplication') {
    return 'Extraer lógica repetida a función compartida con parámetros.';
  }
  if (finding.checkId === 'error-handling') {
    return 'Envolver en try/catch con manejo de error específico (no solo console.error).';
  }
  if (finding.checkId === 'null-safety') {
    return 'Usar optional chaining: `resultado?.propiedad` o validar antes de acceder.';
  }
  if (finding.checkId === 'dead-code') {
    return 'Eliminar el bloque comentado. Git history lo conserva si se necesita después.';
  }
  if (finding.checkId === 'consistency') {
    return 'Unificar estilo según convención del proyecto (ver AGENTS.md → Immutable rules).';
  }
  if (finding.checkId === 'coupling') {
    return 'Evaluar si esta dependencia puede inyectarse mediante parámetro o interfaz.';
  }
  if (finding.checkId === 'syntax') {
    return 'Verificar sintaxis con `node --check <file>` antes de commit.';
  }
  if (finding.semantic) {
    if (finding.pattern && finding.pattern.includes('id_empresa')) return 'Agregar filtro `.eq(\'id_empresa\', idEmpresaActual)` a todas las queries.';
    if (finding.pattern && finding.pattern.includes('DELETE')) return 'Usar `activo = FALSE` en lugar de DELETE físico (soft delete).';
    return 'Revisar la regla de negocio correspondiente.';
  }
  return 'Revisar y corregir según la severidad del hallazgo.';
}

// --- Main ---
function main() {
  var args = parseArgs();
  var targetPath = path.resolve(PROJECT_ROOT, args.file);
  var profileName = args.profile || 'standard';
  var scope = args.scope || '';

  if (!fs.existsSync(targetPath)) {
    console.error('File not found: ' + targetPath);
    process.exit(1);
  }

  var validProfiles = ['quick', 'standard', 'architecture', 'security'];
  if (validProfiles.indexOf(profileName) === -1) {
    console.error('Invalid profile: "' + profileName + '". Valid: ' + validProfiles.join(', '));
    process.exit(1);
  }

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  var content = fs.readFileSync(targetPath, 'utf8');
  var lines = content.split('\n');
  var filename = path.basename(targetPath);

  console.log('\n  \uD83D\uDD0D reportero — SuitOS Code Reviewer');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  Target:  ' + targetPath);
  console.log('  Profile: ' + profileName);
  console.log('  Lines:   ' + lines.length);
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  // Load profiles
  var checks = [];
  if (fs.existsSync(PROFILES_PATH)) {
    var profiles = loadProfiles(PROFILES_PATH);
    checks = getProfileChecks(profiles, profileName);
    console.log('  \uD83D\uDCCB Loaded ' + checks.length + ' checks from profile "' + profileName + '"');
  } else {
    console.warn('  \u26A0\uFE0F reviewer/profiles.yaml not found. Running default checks.');
    checks = [
      { id: 'syntax', description: 'Syntax validation', severity: 'error', patterns: ['function ', '=>', 'var ', 'let ', 'const '] },
      { id: 'secrets', description: 'No hardcoded secrets', severity: 'error', patterns: ['sk-', 'service_role', 'AIza', 'supabase_key', 'eyJ'] },
      { id: 'debug', description: 'No debug code', severity: 'warning', patterns: ['console.log', 'debugger', 'TODO', 'FIXME'] }
    ];
  }

  // Run pattern scanning
  var findings = [];
  for (var ci = 0; ci < checks.length; ci++) {
    var check = checks[ci];
    var fileFindings = scanPatterns(content, lines, check, targetPath);
    findings = findings.concat(fileFindings);
  }

  // Run contextual analysis
  console.log('  \uD83E\uDDE0 Running contextual analysis...');
  findings = findings.concat(analyzeComplexity(lines));
  findings = findings.concat(analyzeDuplication(lines));
  findings = findings.concat(analyzeRobustness(content, lines));
  findings = findings.concat(analyzeDeadCode(lines));
  findings = findings.concat(analyzeConsistency(content));
  findings = findings.concat(analyzeAcoplamiento(content));

  // Deduplicate by line + checkId
  var seen = {};
  findings = findings.filter(function(f) {
    var key = '' + f.line + '-' + f.checkId + '-' + (f.code ? f.code.substring(0, 30) : '');
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  var errors = findings.filter(function(f) { return f.severity === 'error'; });
  var warnings = findings.filter(function(f) { return f.severity === 'warning'; });
  var improvements = findings.filter(function(f) { return f.severity === 'improvement'; });

  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  ' + ICONS.error + ' ' + errors.length + ' cr\u00EDticos');
  console.log('  ' + ICONS.warning + ' ' + warnings.length + ' warnings');
  console.log('  ' + ICONS.improvement + ' ' + improvements.length + ' mejoras');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  var issueCount = 0;
  for (var fi = 0; fi < findings.length; fi++) {
    var f = findings[fi];
    issueCount++;
    var icon = ICONS[f.severity] || '\uD83D\uDD35';
    var label = SEVERITY_LABELS[f.severity] || '?';
    console.log('  ' + icon + ' [' + label + '] L' + f.line + ': ' + (f.code || '').substring(0, 80));
    console.log('     \u21B3 ' + (f.pattern || '').substring(0, 120));
    console.log();
  }

  if (!findings.length) {
    console.log('  \u2705 No se encontraron issues.\n');
  }

  // Generate and save report
  var md = generateReport(targetPath, profileName, findings, scope);
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  var defaultOutput = path.join(LOG_DIR, timestamp + '-' + filename + '.md');
  var outputPath = args.output ? path.resolve(PROJECT_ROOT, args.output) : defaultOutput;

  fs.writeFileSync(outputPath, md, 'utf8');
  console.log('  \uD83D\uDCC4 Reporte guardado: ' + outputPath + '\n');
}

main();
