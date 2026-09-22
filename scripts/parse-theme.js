/**
 * parse-theme.js — Parser y resolución de temas para color_tema pipe-delimited.
 *
 * Formato: "color|candado:0|pal:pal-teal|tp:tp-01|tpl:lp-local-service"
 *   - color:   hex (#xxxxxx) — opcional si pal trae el primary
 *   - candado: 1=usar plantilla sugerida, 0=no tocar estructura — default 0
 *   - pal:     ID de paleta en presets.json — auto-detecta del hex si falta
 *   - tp:      ID de par tipográfico en presets.json — default tp-01
 *   - tpl:     ID de plantilla de landing en presets.json — default lp-local-service
 *
 * Backwards-compatible: un hex simple ("#d32f2f") se parsea correctamente.
 *
 * Uso Node (CJS):
 *   const { parseTheme, resolveTheme } = require('./parse-theme');
 *   const theme = resolveTheme(parseTheme(company.color_tema));
 *
 * Uso browser (inline en ui.js): ver sección BROWSER EXPORTS abajo.
 */

const path = require('path');
const fs = require('fs');

// ── Carga catálogo de presets (una sola vez) ──────────────────────────────
let _presets = null;
function loadPresets() {
    if (_presets) return _presets;
    try {
        const raw = fs.readFileSync(path.join(__dirname, '..', 'presets.json'), 'utf8');
        _presets = JSON.parse(raw);
    } catch {
        _presets = { fontPairs: [], palettes: [], templates: [] };
    }
    return _presets;
}

// ── Defaults ──────────────────────────────────────────────────────────────
const DEFAULTS = {
    color: '#2563eb',
    candado: 0,
    pal: 'pal-teal',
    tp: 'tp-01',
    tpl: 'lp-local-service',
};

// ── Parser ────────────────────────────────────────────────────────────────
function parseTheme(raw) {
    if (!raw || typeof raw !== 'string') return { ...DEFAULTS };

    const trimmed = raw.trim();

    // Caso 1: hex simple (legacy) — "#d32f2f" o "#abc"
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
        return { color: trimmed, candado: 0, pal: null, tp: null, tpl: null };
    }

    // Caso 2: pipe-delimited
    const result = { color: null, candado: 0, pal: null, tp: null, tpl: null };
    const parts = trimmed.split('|');

    for (const part of parts) {
        const [key, ...rest] = part.split(':');
        const val = rest.join(':').trim(); // por si el valor tiene ':'
        const k = key.trim().toLowerCase();

        if (k === 'candado') {
            result.candado = val === '1' || val.toLowerCase() === 'true' ? 1 : 0;
        } else if (k === 'pal') {
            result.pal = val || null;
        } else if (k === 'tp') {
            result.tp = val || null;
        } else if (k === 'tpl') {
            result.tpl = val || null;
        } else if (/^#[0-9a-fA-F]{3,6}$/.test(part.trim())) {
            // Primer token que es hex sin key → es el color
            result.color = part.trim();
        } else if (k === 'color' || k === 'color_tema' || k === 'tema') {
            result.color = val || null;
        }
    }

    return result;
}

// ── Distancia euclídea RGB para auto-detectar paleta ──────────────────────
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3
        ? h.split('').map(c => c + c).join('')
        : h;
    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
}

function colorDistance(hex1, hex2) {
    const a = hexToRgb(hex1);
    const b = hexToRgb(hex2);
    return Math.sqrt(
        (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
    );
}

function findClosestPalette(hex, palettes) {
    let best = null;
    let bestDist = Infinity;
    for (const pal of palettes) {
        const d = colorDistance(hex, pal.light.primary);
        if (d < bestDist) {
            bestDist = d;
            best = pal;
        }
    }
    return best;
}

// ── Resolver ──────────────────────────────────────────────────────────────
function resolveTheme(parsed) {
    const presets = loadPresets();
    const result = {
        color: parsed.color || DEFAULTS.color,
        candado: parsed.candado,
        pal: null,
        tp: null,
        tpl: null,
        // CSS tokens listos para usar
        css: {},
    };

    // Resolver paleta
    if (parsed.pal) {
        result.pal = presets.palettes.find(p => p.id === parsed.pal) || null;
    }
    // Auto-detectar paleta del hex si no se especificó
    if (!result.pal && parsed.color) {
        result.pal = findClosestPalette(parsed.color, presets.palettes);
    }
    // Fallback final
    if (!result.pal) {
        result.pal = presets.palettes.find(p => p.id === DEFAULTS.pal) || presets.palettes[0];
    }

    // Si el color no se especificó, tomar el primary de la paleta
    if (!parsed.color && result.pal) {
        result.color = result.pal.light.primary;
    }

    // Resolver tipografía
    if (parsed.tp) {
        result.tp = presets.fontPairs.find(f => f.id === parsed.tp) || null;
    }
    if (!result.tp) {
        result.tp = presets.fontPairs.find(f => f.id === DEFAULTS.tp) || presets.fontPairs[0];
    }

    // Resolver template de landing
    if (parsed.tpl) {
        result.tpl = presets.templates.find(t => t.id === parsed.tpl) || null;
    }
    if (!result.tpl) {
        result.tpl = presets.templates.find(t => t.id === DEFAULTS.tpl) || presets.templates[0];
    }

    // Construir CSS tokens
    const pal = result.pal;
    if (pal) {
        result.css = {
            '--color-primary': result.color,
            '--color-primary-hover': pal.light.primaryHover || result.color,
            '--color-on-primary': pal.light.onPrimary || '#FFFFFF',
            '--color-bg': pal.light.bg,
            '--color-surface': pal.light.surface,
            '--color-border': pal.light.border,
            '--color-text': pal.light.text,
            '--color-text-muted': pal.light.textMuted,
            '--color-success': pal.light.success || '#16a34a',
            '--color-warning': pal.light.warning || '#f59e0b',
            '--color-error': pal.light.error || '#ef4444',
        };
    }

    // Tipografía CSS
    if (result.tp) {
        const headingFamily = result.tp.heading.split(' ').slice(0, -1).join(' ') || result.tp.heading;
        const bodyFamily = result.tp.body.split(' ').slice(0, -1).join(' ') || result.tp.body;
        result.css['--font-heading'] = `${headingFamily}, system-ui, sans-serif`;
        result.css['--font-body'] = `${bodyFamily}, system-ui, sans-serif`;
    }

    // Layout CSS del template
    if (result.tpl && result.tpl.layout) {
        const layout = result.tpl.layout;
        result.css['--container-max'] = layout.container || '1120px';
        result.css['--radius'] = radiusToPx(layout.radius);
        result.css['--shadow'] = shadowToCss(layout.shadow);
    }

    return result;
}

function radiusToPx(r) {
    const map = { none: '0px', sm: '8px', md: '16px', lg: '24px', pill: '9999px' };
    return map[r] || '16px';
}

function shadowToCss(s) {
    const map = {
        none: 'none',
        soft: '0 4px 24px rgba(0,0,0,0.08)',
        elevated: '0 20px 52px rgba(16, 24, 40, 0.11)',
    };
    return map[s] || map.soft;
}

// ── Helpers para el SSG engine ────────────────────────────────────────────
function getFontCssImport(tp) {
    if (!tp) return '';
    const provider = tp.provider || 'google';
    const headingName = tp.heading.replace(/\s+\d+$/, '');
    const bodyName = tp.body.replace(/\s+\d+$/, '');

    if (provider === 'fontshare') {
        return `<link href="https://api.fontshare.com/v2/css?f[]=${headingName.replace(/\s/g, '-')}/700,f[]=${bodyName.replace(/\s/g, '-')}/400&display=swap" rel="stylesheet">`;
    }
    // Google Fonts
    const families = [
        `${headingName.replace(/\s/g, '+')}:wght@700`,
        `${bodyName.replace(/\s/g, '+')}:wght@400`,
    ].join('&family=');
    return `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}

// ── Exports ───────────────────────────────────────────────────────────────
module.exports = {
    parseTheme,
    resolveTheme,
    getFontCssImport,
    loadPresets,
    DEFAULTS,
};

// ── BROWSER EXPORTS ───────────────────────────────────────────────────────
// Para ui.js: pegar solo parseTheme() y resolveTheme() inline.
// Ver comentario al final del archivo para el snippet.
