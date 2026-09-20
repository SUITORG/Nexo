'use strict';
// Compone el overlay (tipografia + franja inferior + insignia) sobre un fondo
// fotorrealista generado por ComfyUI. SD1.5 no puede renderizar texto legible,
// asi que el texto se dibuja aparte via SVG (preciso, con acentos correctos)
// y se aplasta sobre la foto con sharp.
//
// ponytail: sin textura de madera/grunge real (serian filtros de imagen, no
// SVG) y la insignia no lleva texto curvo — son recortes deliberados de
// fidelidad visual, no bugs. Subir de nivel si el resultado se usa en
// produccion real de campañas.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const W = 768;
const H = 1024;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Iconos lineales genericos en un viewBox 64x64, dibujados a mano con formas
// simples (no vienen de ningun icon pack con licencia).
const ICONS = {
  dumbbell: c => `<circle cx="10" cy="24" r="8" fill="${c}"/><circle cx="54" cy="24" r="8" fill="${c}"/><line x1="18" y1="24" x2="46" y2="24" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`,
  calendar: c => `<rect x="6" y="10" width="52" height="42" rx="6" fill="none" stroke="${c}" stroke-width="6"/><line x1="6" y1="24" x2="58" y2="24" stroke="${c}" stroke-width="6"/><line x1="18" y1="4" x2="18" y2="16" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="46" y1="4" x2="46" y2="16" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  chart: c => `<polyline points="6,50 24,32 36,42 58,12" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><polyline points="42,12 58,12 58,28" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  trophy: c => `<path d="M16,8 H48 V24 A16,16 0 0 1 16,24 Z" fill="none" stroke="${c}" stroke-width="6"/><line x1="32" y1="40" x2="32" y2="50" stroke="${c}" stroke-width="6"/><line x1="20" y1="56" x2="44" y2="56" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M16,10 H6 V18 A10,10 0 0 0 16,24" fill="none" stroke="${c}" stroke-width="6"/><path d="M48,10 H58 V18 A10,10 0 0 1 48,24" fill="none" stroke="${c}" stroke-width="6"/>`,
  book: c => `<path d="M32,14 C24,8 12,8 6,12 V50 C12,46 24,46 32,52 C40,46 52,46 58,50 V12 C52,8 40,8 32,14 Z" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><line x1="32" y1="14" x2="32" y2="52" stroke="${c}" stroke-width="6"/>`,
  brain: c => `<path d="M20,10 C8,10 6,26 14,30 C6,36 12,50 24,48 C26,54 38,54 40,48 C52,50 58,36 50,30 C58,26 56,10 44,10 C40,6 24,6 20,10 Z" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><line x1="32" y1="12" x2="32" y2="48" stroke="${c}" stroke-width="6"/>`,
  key: c => `<circle cx="16" cy="32" r="10" fill="none" stroke="${c}" stroke-width="6"/><line x1="26" y1="32" x2="56" y2="32" stroke="${c}" stroke-width="6"/><line x1="46" y1="32" x2="46" y2="42" stroke="${c}" stroke-width="6"/><line x1="56" y1="32" x2="56" y2="42" stroke="${c}" stroke-width="6"/>`,
  lightbulb: c => `<circle cx="32" cy="24" r="16" fill="none" stroke="${c}" stroke-width="6"/><line x1="24" y1="42" x2="40" y2="42" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="26" y1="50" x2="38" y2="50" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="32" y1="14" x2="32" y2="20" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  heart: c => `<path fill="${c}" d="M32,54 C10,38 4,24 14,14 C22,6 32,12 32,20 C32,12 42,6 50,14 C60,24 54,38 32,54 Z"/>`,
  scale: c => `<line x1="32" y1="8" x2="32" y2="52" stroke="${c}" stroke-width="6"/><line x1="10" y1="16" x2="54" y2="16" stroke="${c}" stroke-width="6" stroke-linecap="round"/><circle cx="10" cy="30" r="10" fill="none" stroke="${c}" stroke-width="6"/><circle cx="54" cy="30" r="10" fill="none" stroke="${c}" stroke-width="6"/><line x1="18" y1="56" x2="46" y2="56" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  walk: c => `<circle cx="32" cy="10" r="7" fill="${c}"/><line x1="32" y1="18" x2="32" y2="36" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="32" y1="36" x2="20" y2="56" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="32" y1="36" x2="44" y2="50" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="32" y1="24" x2="46" y2="16" stroke="${c}" stroke-width="6" stroke-linecap="round"/><line x1="32" y1="24" x2="20" y2="30" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  check: c => `<circle cx="32" cy="32" r="26" fill="none" stroke="${c}" stroke-width="6"/><polyline points="20,32 28,42 46,20" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function icon(name, x, y, size, color) {
  const body = ICONS[name] || ICONS.check;
  const s = size / 64;
  return `<g transform="translate(${x},${y}) scale(${s})">${body(color)}</g>`;
}

function fitFontSize(lines, maxWidth) {
  const longest = Math.max(...lines.map(l => l.text.length), 1);
  return Math.max(30, Math.min(Math.floor(maxWidth / (longest * 0.62)), 104));
}

function buildSVG(spec) {
  const { accent, lines, destino, badge, icons } = spec;
  const margin = 40;
  const blockWidth = W * 0.5 - margin;
  const fontSize = fitFontSize(lines, blockWidth);
  const lineHeight = Math.round(fontSize * 0.94);
  const blockTop = H * 0.30;
  const blockHeight = lineHeight * lines.length;
  const textTop = Math.max(H * 0.14, blockTop - blockHeight / 2);

  const textLines = lines.map((l, i) => {
    const y = textTop + i * lineHeight + fontSize * 0.85;
    const fill = l.accent ? accent : '#ffffff';
    const font = l.accent ? 'Impact, "Arial Narrow", sans-serif' : '"Arial Black", Arial, sans-serif';
    const filter = l.accent ? 'url(#glow)' : 'url(#shadow)';
    return `<text x="${margin}" y="${y}" font-family='${font}' font-size="${fontSize}" font-weight="900" fill="${fill}" filter="${filter}" letter-spacing="-1">${esc(l.text)}</text>`;
  }).join('\n');

  const quoteTop = textTop - fontSize * 0.55;
  const quoteBottom = textTop + blockHeight + fontSize * 0.25;

  // Scrim detrás del bloque de tipografía — sin esto, texto claro (blanco o
  // accent con glow) pierde contraste contra fondos brillantes (ventanas,
  // cielo). Se desvanece hacia la derecha para no verse como un cuadro/marco.
  const scrimY = quoteTop - fontSize * 0.7;
  const scrimH = quoteBottom - quoteTop + fontSize * 1.3;
  const textScrim = `<rect x="0" y="${scrimY}" width="${W * 0.62}" height="${scrimH}" fill="url(#textScrim)"/>`;

  // Franja inferior
  const bandH = H * 0.20;
  const bandY = H - bandH;
  const arrowY1 = bandY + bandH * 0.32;
  const arrowY2 = bandY + bandH * 0.14;
  const arrowPath = `M ${margin} ${bandY + bandH * 0.5} Q ${W / 2} ${arrowY2} ${W - margin} ${arrowY1 - 10}`;

  const cols = icons.map((it, i) => {
    const isLast = i === icons.length - 1;
    const size = isLast ? 60 : 46;
    const cx = W * ((i + 0.5) / icons.length);
    const iconY = bandY + bandH * 0.34;
    const labelY = iconY + size + (isLast ? 26 : 22);
    const pillY = labelY + 14;
    const pillW = Math.max(52, it.pill.length * 9 + 20);
    const labelSize = isLast ? 17 : 14;
    return `
      ${icon(it.icon, cx - size / 2, iconY, size, '#ffffff')}
      <text x="${cx}" y="${labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${labelSize}" font-weight="900" fill="#ffffff">${esc(it.label)}</text>
      <rect x="${cx - pillW / 2}" y="${pillY}" width="${pillW}" height="24" rx="12" fill="${accent}"/>
      <text x="${cx}" y="${pillY + 17}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="#111111">${esc(it.pill)}</text>
    `;
  }).join('\n');

  // Letrero de madera (simplificado: sin textura, ver nota ponytail arriba)
  const signCX = W * 0.76, signCY = H * 0.62;
  const sign = `
    <g transform="rotate(-4 ${signCX} ${signCY})">
      <rect x="${signCX - 90}" y="${signCY - 32}" width="180" height="64" rx="6" fill="#5a3a22" stroke="#2e1d10" stroke-width="4"/>
      <text x="${signCX}" y="${signCY + 10}" text-anchor="middle" font-family='"Arial Black", Arial, sans-serif' font-size="30" font-weight="900" fill="#f2e6d8">${esc(destino)}</text>
    </g>`;

  // Insignia circular (texto recto, no curvo)
  const badgeCX = W - 76, badgeCY = 76, badgeR = 58;
  const badgeWords = badge.split(' ');
  const badgeLines = [];
  let cur = '';
  for (const w of badgeWords) {
    if ((cur + ' ' + w).trim().length > 12) { badgeLines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) badgeLines.push(cur);
  const badgeText = badgeLines.slice(0, 3).map((l, i) =>
    `<text x="${badgeCX}" y="${badgeCY - 4 + i * 13}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="800" fill="#ffffff">${esc(l)}</text>`
  ).join('\n');

  return `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feDropShadow dx="3" dy="3" stdDeviation="0" flood-color="#000000" flood-opacity="0.9"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="0.35" stop-color="#000000" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.86"/>
    </linearGradient>
    <linearGradient id="textScrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.6"/>
      <stop offset="0.7" stop-color="#000000" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  ${textScrim}
  <text x="${margin}" y="${quoteTop}" font-family="Georgia, serif" font-size="34" fill="${accent}">&#8220;</text>
  ${textLines}
  <text x="${margin}" y="${quoteBottom}" font-family="Georgia, serif" font-size="34" fill="${accent}">&#8221;</text>
  <line x1="${margin}" y1="${quoteBottom + 8}" x2="${margin + 60}" y2="${quoteBottom + 8}" stroke="${accent}" stroke-width="3"/>

  ${sign}

  <rect x="0" y="${bandY}" width="${W}" height="${bandH}" fill="url(#bandGrad)"/>
  <path d="${arrowPath}" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
  <polygon points="${W - margin - 4},${arrowY1 - 22} ${W - margin + 10},${arrowY1 - 12} ${W - margin - 10},${arrowY1 - 4}" fill="${accent}"/>
  ${cols}

  <circle cx="${badgeCX}" cy="${badgeCY}" r="${badgeR}" fill="#0a0a0a" stroke="${accent}" stroke-width="4"/>
  <text x="${badgeCX - badgeR + 6}" y="${badgeCY - badgeR + 22}" font-family="Georgia, serif" font-size="22" fill="${accent}">&#8220;</text>
  ${badgeText}
</svg>`;
}

async function composePoster({ backgroundPath, outputPath, spec }) {
  const svg = buildSVG(spec);
  const bg = await sharp(backgroundPath).resize(spec.W || W, spec.H || H, { fit: 'cover' }).toBuffer();
  await sharp(bg)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(outputPath);
  return outputPath;
}

const DEFAULT_SPEC = {
  W, H,
  accent: '#ffd400',
  lines: [
    { text: 'RESISTE', accent: false },
    { text: 'HOY,', accent: false },
    { text: 'DOMINA', accent: true },
    { text: 'MAÑANA', accent: true },
  ],
  destino: 'CIMA',
  badge: 'MENTALIDAD DE ESFUERZO',
  icons: [
    { icon: 'dumbbell', label: 'ENTRENA', pill: 'HOY' },
    { icon: 'calendar', label: 'CONSTANCIA', pill: 'CADA DÍA' },
    { icon: 'chart', label: 'AVANCE', pill: 'UN MES' },
    { icon: 'trophy', label: 'VICTORIA', pill: 'SIEMPRE' },
  ],
};

module.exports = { composePoster, buildSVG, DEFAULT_SPEC };

async function demo() {
  const backgroundPath = process.argv[2] ||
    path.join('C:', 'Users', 'rojo-', 'AppData', 'Local', 'Programs', 'ComfyUI1', 'output', 'suitcomfy_00001_.png');
  assert(fs.existsSync(backgroundPath), `No existe el fondo: ${backgroundPath}`);

  const outputPath = process.argv[3] || path.join(__dirname, 'output', 'quote-flow-poster.png');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await composePoster({ backgroundPath, outputPath, spec: DEFAULT_SPEC });

  const meta = await sharp(outputPath).metadata();
  assert.strictEqual(meta.width, W);
  assert.strictEqual(meta.height, H);
  assert(fs.statSync(outputPath).size > 10000, 'PNG de salida sospechosamente chico');

  console.log(`OK -> ${outputPath} (${meta.width}x${meta.height}, ${fs.statSync(outputPath).size} bytes)`);
}

if (require.main === module) {
  demo().catch(e => { console.error(e); process.exit(1); });
}
