#!/usr/bin/env node
/* check-map-visual.js — valida GuiaTotal/MAPA_VISUAL.html contra MAPA.md
 * 1) cobertura de secciones: cada § de MAPA.md tiene su burbuja (data-sec="X")
 *    en el HTML y viceversa (mecanismo de sincronización del cierre común)
 * 2) integridad de conexiones: cada { from, to } del JS apunta a un id="..." existente
 * 3) sanity HTML: doctype, cierre, ids únicos
 * Uso: node scripts/check-map-visual.js   (sale con código 1 si falla)
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'GuiaTotal/MAPA_VISUAL.html'), 'utf8');
const mapa = fs.readFileSync(path.join(root, 'GuiaTotal/MAPA.md'), 'utf8');
let fail = 0;
const err = m => { fail++; console.log('ERR  ' + m); };

// ── 1) cobertura de secciones § ──────────────────────────────────────────────
const mapaSecs = [...mapa.matchAll(/^## ═══ (\d+(?:\.\d+)*)\. /gm)].map(m => m[1]);
const htmlSecs = [...html.matchAll(/data-sec="(\d+(?:\.\d+)?)"/g)].map(m => m[1]);
for (const s of mapaSecs) if (!htmlSecs.includes(s)) err(`MAPA §${s} sin burbuja (data-sec="${s}" ausente)`);
for (const s of htmlSecs) if (!mapaSecs.includes(s)) err(`burbuja data-sec="${s}" no corresponde a ninguna sección de MAPA`);
if (mapaSecs.length && !fail) console.log(`OK   cobertura: ${mapaSecs.length} secciones § en ambos archivos`);

// ── 1b) cobertura del drawer (INFO: cada burbuja § con panel de pasos) ───────
const infoBlock = (html.match(/const INFO = \{([\s\S]*?)\n {2}\};/) || [])[1] || '';
const infoSecs = [...infoBlock.matchAll(/["'](\d+(?:\.\d+)?)["']\s*:\s*\{/g)].map(m => m[1]);
for (const s of htmlSecs) if (!infoSecs.includes(s)) err(`drawer INFO sin entrada para §${s} (click no mostraría pasos)`);
for (const s of infoSecs) if (!htmlSecs.includes(s)) err(`drawer INFO con §${s} sin burbuja correspondiente`);
if (htmlSecs.length) console.log(`OK   drawer: ${infoSecs.length}/${htmlSecs.length} secciones con pasos internos`);

// ── 1c) INFO generado al día con MAPA.md (fuente única) ──────────────────────
try {
  const { buildInfoBlock } = require('./gen-mapa-info');
  const expected = buildInfoBlock(mapa);
  const embedded = (html.match(/[^\n]*\/\/ @GEN:INFO-BEGIN[^\n]*\n[\s\S]*?[^\n]*\/\/ @GEN:INFO-END[^\n]*/) || [])[0];
  if (!embedded) err('marcadores @GEN:INFO-BEGIN/END ausentes en MAPA_VISUAL.html (corre gen-mapa-info.js)');
  else if (embedded !== expected) err('INFO desincronizado de MAPA.md — corre: node scripts/gen-mapa-info.js');
  else console.log('OK   info: bloque INFO generado al día con MAPA.md (fuente única)');
} catch (e) { err('no se pudo validar INFO contra MAPA.md: ' + e.message); }

// ── 2) integridad de conexiones ──────────────────────────────────────────────
const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
if (dup.length) err(`ids duplicados: ${[...new Set(dup)].join(', ')}`);

const conns = [...html.matchAll(/\{\s*from:\s*'([^']+)',\s*to:\s*'([^']+)'/g)];
let okConn = 0;
for (const [, f, t] of conns) {
  if (!ids.includes(f)) err(`conexión from:"${f}" → id inexistente`);
  else if (!ids.includes(t)) err(`conexión to:"${t}" → id inexistente`);
  else okConn++;
}
console.log(`OK   conexiones: ${okConn}/${conns.length} endpoints válidos · ids: ${ids.length} únicos`);

// ── 3) sanity HTML ───────────────────────────────────────────────────────────
if (!/^<!DOCTYPE html>/i.test(html.trim())) err('falta <!DOCTYPE html>');
if (!html.includes('</html>')) err('falta </html>');
if (!html.includes("EDGES = [")) err('falta arreglo EDGES en el script');

console.log(fail ? `FAIL (${fail})` : 'CHECK MAPA_VISUAL OK');
process.exit(fail ? 1 : 0);
