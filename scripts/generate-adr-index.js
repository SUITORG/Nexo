/**
 * generate-adr-index.js - Genera .suit/memory/INDEX.md desde memory/ (5 subdirs)
 *
 * Uso: node scripts/generate-adr-index.js
 *
 * Índice navegable de ADRs (ID, título, status, fecha, TL;DR, refs cruzadas)
 * para no cargar los 42 ADRs completos (~50K tokens) en cada tarea deep.
 * Advertencia por consola si detecta IDs duplicados o status faltante.
 * No editar el INDEX.md generado a mano: regenerar con este script.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MEMORY = path.join(ROOT, '.suit', 'memory');
const OUTPUT = path.join(MEMORY, 'INDEX.md');
const SECTIONS = ['decisions', 'bugs', 'lessons', 'patterns', 'pending'];

const warnings = [];

function trunc(str, max) {
  const s = str.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return cut.slice(0, sp > 40 ? sp : max - 1) + '…';
}

function firstParagraph(body) {
  // Partir del primer heading de contenido (Context/Contexto/Decisión...) para
  // no atrapar valores de Status que viven en headings/metadata previos.
  const anchor = body.match(/^#{2,3}\s+(Context|Contexto|Problema|Problem|Motiv\w*|Decisi\w*|Situaci\w*|Summary|Resumen)\b.*$/mi);
  if (anchor) body = body.slice(anchor.index + anchor[0].length);
  const lines = body.split('\n');
  let out = [];
  let started = false;
  for (const line of lines) {
    const t = line.trim();
    if (!started) {
      if (!t || /^(#|\*\*|---|\||>)/.test(t)) continue;
      started = true;
    } else if (!t) {
      break;
    }
    if (/^#{1,6}\s/.test(t)) break;
    out.push(t);
  }
  return trunc(out.join(' '), 140);
}

function parseAdr(file) {
  const content = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  const head = content.slice(0, 4000);

  const m = head.match(/^#\s+ADR-(\d{3})[\s:.\-—–]+(.+)$/m);
  const id = m ? m[1] : null;
  const title = m ? m[2].trim() : name;

  // Status: inline **Status:** / **Estado**:  o heading ## Status + valor
  let status = '';
  const inline = head.match(/^\*\*(?:Status|Estado):?\*\*\s*:?\s*(\S.*)$/mi);
  if (inline) status = inline[1].trim();
  if (!status) {
    const heading = head.match(/^#{2,3}\s*(?:Status|Estado):?\s*\n+([^\n]+)/mi);
    if (heading) status = heading[1].trim();
  }
  const statusShort = trunc(status || '(sin status)', 90);
  if (!status) warnings.push(`status faltante: ${name}`);

  // Fecha: **Date:** / **Fecha**: o parentesis dentro del status
  // (excluir notas de reasignación de ID para no capturar su fecha)
  const headNoNote = head.replace(/^> ID reasignado.*$/gm, '');
  let date = '';
  const dm = headNoNote.match(/^\*\*(?:Date|Fecha)\*\*[:\s]+(\d{4}-\d{2}-\d{2})/mi) ||
             headNoNote.match(/(\d{4}-\d{2}-\d{2})/);
  if (dm) date = dm[1];

  // Refs cruzadas a otros ADR (para ver cadenas sin abrir el archivo)
  const refs = [...new Set((content.match(/ADR-\d{3}/g) || []))]
    .filter(r => r !== `ADR-${id}`)
    .sort()
    .map(r => r.replace('ADR-', ''));

  return { id, name, title, status: statusShort, date, refs, tldr: firstParagraph(content) };
}

function main() {
  const out = [];
  out.push('# SuitOS Memory — Índice');
  out.push('');
  out.push('> Auto-generado por `scripts/generate-adr-index.js`. **No editar a mano** (regenerar tras crear/modificar entradas).');
  out.push('> Uso: leer esta tabla primero y abrir solo los archivos citados (ahorra ~48K tokens por tarea deep).');

  // decisions/ — tabla completa
  const dir = path.join(MEMORY, 'decisions');
  const adrs = fs.readdirSync(dir).filter(f => /^ADR-.*\.md$/i.test(f)).map(f => parseAdr(path.join(dir, f)));
  adrs.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

  const byId = {};
  for (const a of adrs) (byId[a.id] = byId[a.id] || []).push(a.name);
  const dups = Object.entries(byId).filter(([, v]) => v.length > 1);
  if (dups.length) {
    warnings.push(`IDs duplicados: ${dups.map(([id, v]) => `${id} (${v.join(' + ')})`).join(' | ')}`);
  }

  out.push('');
  out.push(`## decisions/ (${adrs.length} ADRs)`);
  out.push('');
  out.push('| ID | Título | Status | Fecha | TL;DR | → refs |');
  out.push('|---|---|---|---|---|---|');
  for (const a of adrs) {
    const t = trunc(a.title, 70).replace(/\|/g, '\\|');
    const s = a.status.replace(/\|/g, '\\|');
    const p = a.tldr.replace(/\|/g, '\\|');
    out.push(`| ADR-${a.id} | [${t}](${a.name}) | ${s} | ${a.date || '-'} | ${p || '-'} | ${a.refs.length ? a.refs.join(', ') : '-'} |`);
  }

  // Resto de subdirs — lista corta (título de primera línea `# `)
  for (const sec of SECTIONS) {
    if (sec === 'decisions') continue; // ya está en la tabla completa
    const d = path.join(MEMORY, sec);
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter(f => f.endsWith('.md')).sort();
    if (!files.length) continue;
    out.push('');
    out.push(`## ${sec}/ (${files.length})`);
    for (const f of files) {
      const head = fs.readFileSync(path.join(d, f), 'utf8').split('\n')
        .find(l => l.startsWith('#')) || '';
      const t = head.replace(/^#+\s*/, '').trim();
      out.push(`- [${f}](${sec}/${f})${t && !t.includes(f.slice(0, 8)) ? ' — ' + trunc(t, 90) : ''}`);
    }
  }

  out.push('');
  fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');

  console.log(`OK ${path.relative(ROOT, OUTPUT).replace(/\\/g, '/')}: ${adrs.length} ADRs`);
  for (const w of warnings) console.log(`WARN: ${w}`);
}

main();
