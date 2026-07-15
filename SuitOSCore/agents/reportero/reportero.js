#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CORE_DIR = path.resolve(__dirname, '..', '..');
const LOG_DIR = path.join(process.cwd(), '.suit/logs/review');

const ICONS = { error: '[ERROR]', warning: '[WARN]', improvement: '[IMPROVE]' };
const SEVERITY_LABELS = { error: 'Critical', warning: 'Warning', improvement: 'Improvement' };

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, '');
    args[key] = process.argv[i + 1];
  }
  if (!args.file) {
    console.error('Usage: node reporters/reportero.js --file <path> [--profile quick|standard|architecture|security] [--output <path>]');
    process.exit(1);
  }
  return args;
}

function loadChecks(profileName) {
  const profilesPath = path.join(CORE_DIR, 'registry', 'agents.yaml');
  if (!fs.existsSync(profilesPath)) {
    return [
      { id: 'syntax', description: 'Syntax validation', severity: 'error', patterns: ['function ', '=>', 'var ', 'let ', 'const '] },
      { id: 'secrets', description: 'No hardcoded secrets', severity: 'error', patterns: ['sk-', 'service_role', 'AIza', 'supabase_key', 'eyJ'] },
      { id: 'debug', description: 'No debug code', severity: 'warning', patterns: ['console.log', 'debugger', 'TODO', 'FIXME'] }
    ];
  }
  return loadProfiles(profilesPath)[profileName] || [];
}

function loadProfiles(filePath) {
  const yamlText = fs.readFileSync(filePath, 'utf8');
  const lines = yamlText.split('\n');
  const profiles = {};
  let currentProfile = null;
  let currentCheck = null;
  let inPatterns = false;

  for (const line of lines) {
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    if (indent === 0 && trimmed === 'profiles:') continue;
    if (indent === 2 && !trimmed.startsWith('-') && trimmed.endsWith(':')) {
      currentProfile = { name: trimmed.slice(0, -1), checks: [], extends: null, description: '' };
      profiles[currentProfile.name] = currentProfile;
      currentCheck = null;
      inPatterns = false;
      continue;
    }
    if (!currentProfile) continue;
    if (indent === 4 && !trimmed.startsWith('-')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim().replace(/^"/, '').replace(/"$/, '');
      if (key === 'description') currentProfile.description = val;
      if (key === 'extends') currentProfile.extends = val;
      continue;
    }
    if (indent === 6 && trimmed.startsWith('- id:')) {
      const id = trimmed.replace('- id:', '').trim();
      currentCheck = { id };
      currentProfile.checks.push(currentCheck);
      inPatterns = false;
      continue;
    }
    if (!currentCheck) continue;
    if (indent >= 8) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) {
        const val = trimmed.replace(/^- /, '');
        if (inPatterns) {
          if (!currentCheck.patterns) currentCheck.patterns = [];
          currentCheck.patterns.push(val.replace(/"/g, ''));
        }
        continue;
      }
      const key = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim().replace(/^"/, '').replace(/"$/, '');
      if (key === 'description') currentCheck.description = val;
      else if (key === 'severity') currentCheck.severity = val;
      else if (key === 'patterns') { inPatterns = true; if (val) currentCheck.patterns = [val.replace(/"/g, '')]; else currentCheck.patterns = []; }
      else if (key === 'check' || key === 'file_pattern') {
        if (!currentCheck.checks) currentCheck.checks = [];
        currentCheck.checks.push(val.replace(/"/g, ''));
      }
      continue;
    }
    if (indent < 6) { currentCheck = null; inPatterns = false; }
  }

  for (const name of Object.keys(profiles)) {
    const p = profiles[name];
    if (p.extends && profiles[p.extends]) {
      p.checks = [...profiles[p.extends].checks, ...p.checks];
    }
  }
  return profiles;
}

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
      if (check.id === 'secrets' || check.id === 'hardcoded-keys') {
        if (lineContent.includes('process.env') || lineContent.includes('require(') || lineContent.includes('import ')) continue;
      }
      findings.push({ checkId: check.id, severity: check.severity || 'warning', line: lineNum, code: lineContent.substring(0, 120), pattern: pattern });
    }
  }
  if (check.checks && Array.isArray(check.checks)) {
    for (const subCheck of check.checks) {
      if (typeof subCheck === 'string' && subCheck.includes('tenant_id') && filePath.endsWith('.js')) {
        if (!/tenant_id/.test(content) && !/\.eq\(/.test(content)) {
          findings.push({ checkId: check.id, severity: check.severity || 'error', line: 1, code: '(whole file)', pattern: subCheck, semantic: true });
        }
      }
    }
  }
  return findings;
}

function analyzeComplexity(lines) {
  const findings = [];
  let currentFunc = null;
  let funcStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const funcMatch = line.match(/(?:function|=>)\s*(?:\w+\s*)?[\(=]/);
    if (funcMatch && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
      if (currentFunc) { const lineCount = i - funcStart; if (lineCount > 80) findings.push({ checkId: 'complexity', severity: 'improvement', line: funcStart + 1, code: (currentFunc + ' (' + lineCount + ' lines)').substring(0, 120), pattern: 'Function too long (>80 lines). Extract into smaller functions.' }); }
      currentFunc = line.trim().substring(0, 60);
      funcStart = i;
    }
    const callbackDepth = (line.match(/function\s*\(/g) || []).length + (line.match(/=>\s*[^,]/g) || []).length + (line.match(/\.then\(/g) || []).length;
    if (callbackDepth >= 3 && !line.trim().startsWith('//')) findings.push({ checkId: 'callback-hell', severity: 'improvement', line: i + 1, code: line.trim().substring(0, 100), pattern: 'Excessive nesting (' + callbackDepth + '+ callbacks). Use async/await.' });
  }
  if (currentFunc) { const lineCount = lines.length - funcStart; if (lineCount > 80) findings.push({ checkId: 'complexity', severity: 'improvement', line: funcStart + 1, code: (currentFunc + ' (' + lineCount + ' lines)').substring(0, 120), pattern: 'Function too long (>80 lines). Extract into smaller functions.' }); }
  return findings;
}

function analyzeDuplication(lines) {
  const findings = [];
  const blocks = {};
  const MIN_BLOCK = 4;
  for (let i = 0; i < lines.length - MIN_BLOCK; i++) {
    const block = lines.slice(i, i + MIN_BLOCK).map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('import') && !l.startsWith('require')).join('\n');
    if (block.length < 30) continue;
    let hash = 0; for (let c = 0; c < block.length; c++) { hash = ((hash << 5) - hash) + block.charCodeAt(c); hash |= 0; }
    const key = Math.abs(hash).toString(36);
    if (!blocks[key]) blocks[key] = { block, count: 0, lines: [] };
    blocks[key].count++;
    blocks[key].lines.push(i + 1);
  }
  for (const key of Object.keys(blocks)) {
    if (blocks[key].count >= 3) {
      const occurrences = blocks[key].lines.slice(0, 4).join(', ');
      findings.push({ checkId: 'duplication', severity: 'improvement', line: blocks[key].lines[0], code: blocks[key].block.split('\n').slice(0, 2).join('; ').substring(0, 80), pattern: 'Duplicated code (' + blocks[key].count + 'x) at lines ' + occurrences + '. Extract to shared function.' });
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
      if ((line.includes('await ') || line.includes('fetch(') || line.includes('.then(')) && !line.trim().startsWith('//')) {
        const above = lines.slice(Math.max(0, i - 3), i).join(' ');
        if (!above.includes('try')) { findings.push({ checkId: 'error-handling', severity: 'warning', line: i + 1, code: line.trim().substring(0, 100), pattern: 'Async operation without try/catch. Add error handling.' }); break; }
      }
    }
  }
  const nullPattern = /\.(find|filter|findIndex)\([^)]*\)\./g;
  let match;
  while ((match = nullPattern.exec(content)) !== null) {
    if (!content.slice(Math.max(0, match.index - 40), match.index).includes('?.')) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      findings.push({ checkId: 'null-safety', severity: 'improvement', line: lineNum, code: (lines[lineNum - 1] || '').trim().substring(0, 100), pattern: 'Access without optional chaining (?.) after ' + match[1] + '(). Use result?.[prop] or validate.' });
    }
  }
  return findings;
}

function analyzeDeadCode(lines) {
  const findings = [];
  let commentBlock = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//') && !trimmed.includes('TODO') && !trimmed.includes('FIXME') && !trimmed.startsWith('// ---')) {
      commentBlock.push(i);
    } else {
      if (commentBlock.length >= 4) findings.push({ checkId: 'dead-code', severity: 'improvement', line: commentBlock[0] + 1, code: 'Lines ' + (commentBlock[0] + 1) + '-' + (commentBlock[commentBlock.length - 1] + 1), pattern: 'Commented-out dead code. Remove (git history preserves it).' });
      commentBlock = [];
    }
  }
  return findings;
}

function analyzeConsistency(content) {
  const findings = [];
  if (/\bvar\s/.test(content) && (/\blet\s/.test(content) || /\bconst\s/.test(content))) findings.push({ checkId: 'consistency', severity: 'improvement', line: 1, code: 'Mixed var/let/const', pattern: 'Use const by default, let only when reassignment is needed.' });
  const singleQuotes = (content.match(/'/g) || []).length;
  const doubleQuotes = (content.match(/"/g) || []).length;
  if (singleQuotes > 5 && doubleQuotes > 5) findings.push({ checkId: 'consistency', severity: 'improvement', line: 1, code: 'Mixed single/double quotes', pattern: 'Standardize quote style (' + singleQuotes + ' single, ' + doubleQuotes + ' double).' });
  return findings;
}

function generateReport(targetPath, profileName, findings, scope) {
  const filename = path.basename(targetPath);
  const targetContent = fs.readFileSync(targetPath, 'utf8');
  const totalLines = targetContent.split('\n').length;
  const errors = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warning');
  const improvements = findings.filter(f => f.severity === 'improvement');

  var md = '# Code Review: ' + filename + '\n';
  md += 'Date: ' + new Date().toISOString().slice(0, 10) + '\n';
  md += 'Profile: ' + profileName + '\n';
  md += 'Scope: ' + (scope || filename + ' (' + totalLines + ' lines)') + '\n\n';
  md += '## Summary\n\n';
  md += '- ' + ICONS.error + ' **' + errors.length + '** critical\n';
  md += '- ' + ICONS.warning + ' **' + warnings.length + '** warnings\n';
  md += '- ' + ICONS.improvement + ' **' + improvements.length + '** improvements\n';
  md += '- File: `' + targetPath + '` (' + totalLines + ' lines)\n\n';
  if (!findings.length) { md += '_No issues found._\n\n'; md += '---\n*Report generated by reportero (SuitOS Code Reviewer)*\n*Read-only: no files were modified.*\n'; return md; }

  var allFindings = errors.concat(warnings).concat(improvements);
  for (var fi = 0; fi < allFindings.length; fi++) {
    var f = allFindings[fi];
    md += '### ' + ICONS[f.severity] + ' ' + SEVERITY_LABELS[f.severity] + ' (L' + f.line + ')\n';
    md += '**Code**: `' + (f.code || '(no context)') + '`\n';
    md += '**Issue**: ' + f.pattern + '\n';
    var proposal = f.checkId === 'secrets' ? 'Move to `.env` and use `process.env.VARIABLE`.' : f.checkId === 'debug' ? 'Remove debug code or replace with controlled logger.' : f.checkId === 'complexity' ? 'Extract logical blocks into independent functions (<30 lines each).' : f.checkId === 'error-handling' ? 'Wrap in try/catch with specific error handling.' : f.checkId === 'null-safety' ? 'Use optional chaining: `result?.property`.' : f.semantic ? 'Apply multi-tenant filter to all queries.' : 'Review and fix per severity.';
    md += '**Proposal**: ' + proposal + '\n\n';
  }

  md += '---\n*Report generated by reportero (SuitOS Code Reviewer)*\n*Read-only: no files were modified.*\n';
  return md;
}

function main() {
  var args = parseArgs();
  var targetPath = path.resolve(args.file);
  var profileName = args.profile || 'quick';

  if (!fs.existsSync(targetPath)) { console.error('File not found: ' + targetPath); process.exit(1); }

  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

  var content = fs.readFileSync(targetPath, 'utf8');
  var lines = content.split('\n');
  var filename = path.basename(targetPath);

  console.log('\n  reportero - Code Reviewer');
  console.log('  Target:  ' + targetPath);
  console.log('  Lines:   ' + lines.length + '\n');

  var checks = loadChecks(profileName);

  var findings = [];
  for (var ci = 0; ci < checks.length; ci++) findings = findings.concat(scanPatterns(content, lines, checks[ci], targetPath));
  findings = findings.concat(analyzeComplexity(lines));
  findings = findings.concat(analyzeDuplication(lines));
  findings = findings.concat(analyzeRobustness(content, lines));
  findings = findings.concat(analyzeDeadCode(lines));
  findings = findings.concat(analyzeConsistency(content));

  var seen = {};
  findings = findings.filter(function(f) { var key = '' + f.line + '-' + f.checkId; if (seen[key]) return false; seen[key] = true; return true; });

  var errors = findings.filter(function(f) { return f.severity === 'error'; });
  var warnings = findings.filter(function(f) { return f.severity === 'warning'; });
  var improvements = findings.filter(function(f) { return f.severity === 'improvement'; });

  console.log('  ' + ICONS.error + ' ' + errors.length + ' critical');
  console.log('  ' + ICONS.warning + ' ' + warnings.length + ' warnings');
  console.log('  ' + ICONS.improvement + ' ' + improvements.length + ' improvements\n');

  for (var fi = 0; fi < findings.length; fi++) {
    var f = findings[fi];
    console.log('  ' + (f.severity === 'error' ? ICONS.error : f.severity === 'warning' ? ICONS.warning : ICONS.improvement) + ' L' + f.line + ': ' + (f.code || '').substring(0, 80));
    console.log('     -> ' + (f.pattern || '').substring(0, 120) + '\n');
  }
  if (!findings.length) console.log('  No issues found.\n');

  var md = generateReport(targetPath, profileName, findings, args.scope);
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  var defaultOutput = path.join(LOG_DIR, timestamp + '-' + filename + '.md');
  var outputPath = args.output ? path.resolve(args.output) : defaultOutput;
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log('  Report saved: ' + outputPath + '\n');
}

main();
