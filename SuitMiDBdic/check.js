// Valida dictionary.html antes de que un error rompa el diccionario en el navegador.
// Uso: npm run check  (o: node check.js)
//
// Cubre dos capas distintas de error, cada una invisible a la otra:
//  1. Sintaxis del JS embebido (llaves/paréntesis sin cerrar, comas faltantes...)
//  2. Estructura del HTML (tags sin cerrar, ids de sección duplicados o huérfanos)
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('dictionary.html', 'utf8');
let failed = false;

// ---- 1. Sintaxis del JS embebido ----
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let m, combinedJs = '';
while ((m = scriptRe.exec(html))) combinedJs += m[1] + '\n;\n';
try {
  new vm.Script(combinedJs, { filename: 'dictionary.html (JS embebido)' });
  console.log('✓ Sintaxis JS OK (' + combinedJs.split('\n').length + ' líneas revisadas)');
} catch (e) {
  console.error('✗ Error de sintaxis JS:', e.message);
  failed = true;
}

// ---- 2. Balance de tags HTML principales ----
// No es un parser HTML completo (no hace falta) — cuenta aperturas vs cierres
// de los tags donde un desbalance rompe visualmente la página.
const TAGS = ['div', 'section', 'table', 'tr', 'td', 'button', 'h2', 'h3'];
for (const tag of TAGS) {
  const opens = (html.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
  const closes = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  if (opens !== closes) {
    console.error(`✗ Tags <${tag}> desbalanceados: ${opens} abiertos, ${closes} cerrados`);
    failed = true;
  }
}
if (!failed) console.log('✓ Tags HTML balanceados (' + TAGS.join(', ') + ')');

// ---- 3. Cada id de SECTIONS/PARTS tiene su <section> exactamente una vez ----
const secStart = html.indexOf('const SECTIONS=[');
const secEnd = html.indexOf('];', secStart) + 2;
const SECTIONS = eval(html.slice(secStart, secEnd).replace('const SECTIONS=', ''));
let idsOk = true;
for (const [id] of SECTIONS) {
  const count = (html.match(new RegExp(`<section class="topic[^"]*" id="${id}"`, 'g')) || []).length;
  if (count !== 1) {
    console.error(`✗ id="${id}" (en SECTIONS) tiene ${count} <section> en el HTML — debería ser 1`);
    idsOk = false; failed = true;
  }
}
if (idsOk) console.log(`✓ Los ${SECTIONS.length} ids de SECTIONS tienen exactamente 1 <section> cada uno`);

if (failed) { console.error('\n✗ dictionary.html tiene problemas — revisar antes de confiar en el navegador.'); process.exit(1); }
console.log('\n✓ Todo OK.');
