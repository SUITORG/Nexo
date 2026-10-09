#!/usr/bin/env node
/* gen-mapa-info.js — genera el bloque INFO del drawer de MAPA_VISUAL.html desde MAPA.md
 * Fuente única: GuiaTotal/MAPA.md. El HTML solo lleva el bloque entre marcadores
 *   // @GEN:INFO-BEGIN ...  // @GEN:INFO-END
 * y NO se edita a mano. check-map-visual.js valida que esté al día (check 1c).
 *
 * Derivación por § (encabezado `## ═══ X. TÍTULO ═══`):
 *   t      ← título del encabezado (title-case español, siglas ≤3 conservadas)
 *   steps  ← líneas del árbol ```text (sin glyphs ├└│); si no hay árbol →
 *            fallback: encabezados ### + citas > + viñetas - (máx 12)
 *   skills ← tokens `⚡` kebab-case o presentes en el inventario de skills
 *   gas    ← `⚡` camelCase + llamadas `fn (archivo.js:NNN)`
 *   files  ← rutas con extensión (con solape/colon-filter); §10 list ← SKILLS-AJENAS.json
 * Uso: node scripts/gen-mapa-info.js [--check]   (--check solo compara, no escribe)
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const MAPA = path.join(root, 'GuiaTotal/MAPA.md');
const HTML = path.join(root, 'GuiaTotal/MAPA_VISUAL.html');

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'con', 'por', 'para', 'al', 'un', 'una']);

function titleCase(src) {
  return src.split(' ').map(w => {
    if (/^[A-Z]{2,3}$/.test(w)) return w;                  // siglas (SEO)
    const lead = w.match(/^[^A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ]+/);
    const p = lead ? lead[0] : '';
    const core = w.slice(p.length);
    if (!core || core.includes('-') || STOP.has(core.toLowerCase())) return p + core.toLowerCase();
    return p + core[0].toUpperCase() + core.slice(1).toLowerCase();
  }).join(' ');
}

function skillsSet() {
  const set = new Set();
  for (const dir of ['.agents/skills', '.claude/skills', '.opencode/skills']) {
    try { for (const n of fs.readdirSync(path.join(root, dir))) set.add(n); } catch (_) {}
  }
  try {
    const y = fs.readFileSync(path.join(root, '.suit/registry/skills.yaml'), 'utf8');
    for (const m of y.matchAll(/^ {2}([a-z0-9-]+):/gm)) set.add(m[1]);
  } catch (_) {}
  return set;
}

function stepsFromBody(body) {
  const blocks = [...body.matchAll(/```text\r?\n([\s\S]*?)```/g)].map(m => m[1]);
  const lines = blocks.join('\n').split(/\r?\n/);
  const steps = [];
  if (lines.some(l => /^[ \t]*[│├└]─/.test(l))) {
    for (const raw of lines) {
      if (!raw.trim()) continue;
      const m = raw.match(/^[ \t│]*[├└]──[ \t]?(.*)$/);
      if (m) { steps.push(m[1].trim()); continue; }
      const c = raw.replace(/^[ \t│─]+/, '').trim();
      if (c && steps.length) steps[steps.length - 1] += ' ' + c;
      else if (c) steps.push(c);
    }
  }
  if (!steps.length) {   // fallback: ### + citas > + viñetas
    for (const l of body.split(/\r?\n/)) {
      let m;
      if ((m = l.match(/^###\s+(.+)$/))) steps.push(m[1].trim());
      else if ((m = l.match(/^>\s?(.+)$/))) steps.push(m[1].trim());
      else if ((m = l.match(/^[-*]\s+(.+)$/))) steps.push(m[1].trim());
      if (steps.length >= 12) break;
    }
  }
  return steps;
}

function filesFromBody(body) {
  const re = /[A-Za-z0-9_.*<>-]+(?:\/[A-Za-z0-9_.*<>-]+)+\.[a-z0-9]+|\b[A-Za-z0-9_*-]+\.(?:md|json|yaml|yml|html|bat)\b/g;
  const out = [], seen = new Set(), ranges = [];
  for (const m of body.matchAll(re)) {
    const end = m.index + m[0].length;
    if (body[end] === ':' || m[0].includes(':')) continue;          // file:line → es gas
    if (ranges.some(([a, b]) => m.index < b && end > a)) continue;  // solape con match de ruta
    ranges.push([m.index, end]);
    const k = m[0].toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(m[0]); }
  }
  return out.slice(0, 8);
}

function parseMapa(md) {
  const set = skillsSet();
  const heads = [...md.matchAll(/^## ═══ (\d+(?:\.\d+)*)\. (.+)$/gm)];
  const nextHeadings = [...md.matchAll(/^## /gm)].map(m => m.index);
  const info = {};
  heads.forEach((h, i) => {
    const sec = h[1];
    const end = nextHeadings.find(ix => ix > h.index);
    const body = md.slice(h.index, end ?? md.length);
    const title = titleCase(h[2].replace(/[═\s]+$/, '').replace(/^\d+(?:\.\d+)?\.\s*/, ''));

    const steps = stepsFromBody(body);
    const skills = [], gas = [], gasNames = new Set();
    for (const m of body.matchAll(/⚡\s+([A-Za-z0-9][A-Za-z0-9-]*)/g)) {
      const tok = m[1];
      if (set.has(tok) || /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(tok)) { if (!skills.includes(tok)) skills.push(tok); }
      else if (/[a-z][A-Z]/.test(tok) && !gasNames.has(tok)) { gasNames.add(tok); gas.push(tok); }
    }
    for (const m of body.matchAll(/([A-Za-z]\w*)\s*\(([^()]*\.\w+:\d+[^()]*)\)/g)) {
      if (gasNames.has(m[1])) continue;
      gasNames.add(m[1]); gas.push(`${m[1]} (${m[2]})`);
    }

    const entry = { t: title, steps };
    if (skills.length) entry.skills = skills;
    if (gas.length) entry.gas = gas;
    const files = filesFromBody(body);
    if (files.length) entry.files = files;
    if (sec === '10') {
      try { entry.list = JSON.parse(fs.readFileSync(path.join(root, 'GuiaTotal/SKILLS-AJENAS.json'), 'utf8')).skills; } catch (_) {}
    }
    info[sec] = entry;
  });
  return info;
}

function buildInfoBlock(md) {
  const json = JSON.stringify(parseMapa(md), null, 2).replace(/\n/g, '\n  ');
  return '  // @GEN:INFO-BEGIN generado por scripts/gen-mapa-info.js desde GuiaTotal/MAPA.md — NO editar a mano\n'
       + '  const INFO = ' + json + ';\n'
       + '  // @GEN:INFO-END';
}

module.exports = { parseMapa, buildInfoBlock };

if (require.main === module) {
  const md = fs.readFileSync(MAPA, 'utf8');
  const html = fs.readFileSync(HTML, 'utf8');
  const block = buildInfoBlock(md);
  const re = /[^\n]*\/\/ @GEN:INFO-BEGIN[^\n]*\n[\s\S]*?[^\n]*\/\/ @GEN:INFO-END[^\n]*/;
  const m = html.match(re);
  if (!m) { console.error('ERR  marcadores @GEN:INFO-BEGIN/END no encontrados en MAPA_VISUAL.html'); process.exit(1); }
  if (process.argv.includes('--check')) {
    if (m[0] === block) { console.log('OK   INFO al día con MAPA.md'); process.exit(0); }
    console.log('ERR  INFO desalineado de MAPA.md — corre: node scripts/gen-mapa-info.js');
    process.exit(1);
  }
  const out = html.replace(re, block);
  if (out === html) { console.log('OK   INFO sin cambios (ya al día)'); process.exit(0); }
  fs.writeFileSync(HTML, out, 'utf8');
  const secs = Object.keys(JSON.parse(block.match(/const INFO = ([\s\S]*);/)[1])).length;
  console.log(`OK   INFO regenerado desde MAPA.md (${secs} secciones) → MAPA_VISUAL.html`);
}
