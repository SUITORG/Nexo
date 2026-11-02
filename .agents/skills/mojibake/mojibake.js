#!/usr/bin/env node
// Mojibake diagnose/repair — UTF-8 double-encoded as CP1252 (one layer).
// Usage: node mojibake.js <file|dir>... [--fix]
const fs = require('fs');
const path = require('path');

const EXT = new Set(['.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.md', '.yaml', '.yml', '.json', '.bat', '.ps1', '.txt', '.csv', '.svg']);
const SKIP = new Set(['.git', 'node_modules', 'dist', 'respaldos', 'media', 'backup', 'backups']);
const MOJI_PATTERNS = ['Ã­', 'Ã¡', 'Ã©', 'Ã³', 'Ã±', 'Ã¡', 'Ã³', 'Ã©', 'Ãº', 'Ã‘', 'â€"', 'â€”', 'â€œ', 'â€™', 'Ã§', 'Ã¤', 'Ã¶', 'Ã¼', 'Ã¥', 'Ã¦'];
const CP1252_EXTRA = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F };

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const roots = args.filter(a => a !== '--fix');
if (!roots.length) { console.error('Uso: node mojibake.js <archivo|carpeta>... [--fix]'); process.exit(2); }

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isFile()) { out.push(p); return; }
  for (const name of fs.readdirSync(p)) {
    if (SKIP.has(name)) continue;
    const fp = path.join(p, name);
    const s = fs.statSync(fp);
    if (s.isDirectory()) walk(fp, out);
    else if (EXT.has(path.extname(name).toLowerCase())) out.push(fp);
  }
}

const files = [];
for (const r of roots) { if (fs.existsSync(r)) walk(r, files); else console.log('SKIP (no existe): ' + r); }

const count = (s, sub) => s.split(sub).length - 1;
let repaired = 0, withMoji = 0, aborted = 0;

for (const f of files) {
  let buf = fs.readFileSync(f);
  const hadBom = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
  if (hadBom) buf = buf.slice(3);
  let cur = buf.toString('utf8');
  if (cur.includes('\uFFFD')) { console.log('SKIP (binario/invalido): ' + f); continue; }

  const mojiTotal = MOJI_PATTERNS.reduce((n, p) => n + count(cur, p), 0);
  const okAcc = (cur.match(/[áéíóúñÁÉÍÓÚÑü]/g) || []).length;
  const nonAscii = (cur.match(/[^\x00-\x7F]/g) || []).length;

  if (mojiTotal === 0 && !hadBom) { console.log('OK    ' + f); continue; }
  withMoji++;
  if (!fix) { console.log(`MOJI(${mojiTotal}${hadBom ? ' +BOM' : ''}, okAccents=${okAcc}, nonAscii=${nonAscii})  ` + f); continue; }

  // revert one CP1252 layer: string -> CP1252 bytes -> UTF-8
  const out = Buffer.alloc(cur.length);
  let oi = 0, bad = null;
  for (const ch of cur) {
    const code = ch.codePointAt(0);
    if (code < 0x80) out[oi++] = code;
    else if (code <= 0xFF) out[oi++] = code;
    else if (CP1252_EXTRA[ch] !== undefined) out[oi++] = CP1252_EXTRA[ch];
    else { bad = 'U+' + code.toString(16) + ' "' + ch + '"'; break; }
  }
  if (bad) { console.log('ABORT (capa >1, ' + bad + '): ' + f); aborted++; continue; }
  const restored = out.slice(0, oi).toString('utf8');
  if (restored.includes('\uFFFD')) { console.log('ABORT (UTF8 invalido): ' + f); aborted++; continue; }
  fs.writeFileSync(f, restored, { encoding: 'utf8' });
  repaired++;
  console.log('FIXED ' + f + ' (moji=' + mojiTotal + (hadBom ? ' +BOM' : '') + '-> ok)');
}

console.log(`\narchivos: ${files.length} | con moji: ${withMoji} | reparados: ${repaired} | abortados: ${aborted}`);
if (aborted) { console.log('Abortados = más de una capa de codificación; no forzar --fix en ellos.'); process.exitCode = 1; }
