const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CACHE_TTL = 3600000;
const CACHE_FILE = path.join(__dirname, '..', 'cache_trends.json');
let cache = {};
try {
    if (fs.existsSync(CACHE_FILE)) {
        cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
} catch { cache = {}; }

function getCacheKey(niche, region) {
    return `${niche.toLowerCase().trim()}|${region.toLowerCase().trim()}`;
}

function readCache(niche, region) {
    const key = getCacheKey(niche, region);
    const entry = cache[key];
    if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
        return entry.data;
    }
    return null;
}

function writeCache(niche, region, data) {
    const key = getCacheKey(niche, region);
    cache[key] = { timestamp: Date.now(), data };
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
    } catch {}
}

async function fetchPythonTrends(niche, region) {
    const scriptPath = path.join(__dirname, 'pytrends_fetch.py');
    const cmd = `python "${scriptPath}" "${niche}" "${region}"`;
    try {
        const output = execSync(cmd, { timeout: 60000, encoding: 'utf8', shell: true });
        const parsed = JSON.parse(output.trim());
        return parsed;
    } catch (e) {
        return { google_trends: [{ type: 'error', error: e.message.substring(0, 200) }], reddit_trends: [] };
    }
}

function extractTrends(raw, niche) {
    const trends = [];
    const seen = new Set();

    const add = (title, desc, source, score = 0) => {
        const key = title.toLowerCase().trim();
        if (!seen.has(key) && title.length > 5) {
            seen.add(key);
            trends.push({ titulo: title, descripcion: desc, fuente: source, score });
        }
    };

    if (raw.google_trends) {
        for (const t of raw.google_trends) {
            if (t.type === 'rising' && t.query && t.value >= 50) {
                add(t.query, `Tendencia en Google Trends (${t.value}% de crecimiento)`, 'Google Trends', t.value);
            }
            if (t.type === 'trending' && t.query) {
                add(t.query, `Tendencia actual en Google`, 'Google Trends', 50);
            }
        }
    }

    if (raw.reddit_trends) {
        for (const t of raw.reddit_trends) {
            if (t.title) {
                add(t.title, `Discusión en r/${t.subreddit} (${t.score} votos, ${t.comments} comentarios)`, `Reddit r/${t.subreddit}`, t.score);
            }
        }
    }

    return trends;
}

function extractTrendsFromIA(niche, subNiche, region) {
    const base = niche || 'energía solar';
    const sub = subNiche || '';
    const reg = region || 'México';
    const suggestions = [
        { titulo: `Paneles solares en ${reg}: ¿Cuánto cuesta instalarlos realmente?`, descripcion: `Guía de precios y ahorro para ${sub} en ${reg}`, fuente: 'Sugerido', score: 100 },
        { titulo: `${sub} en ${reg}: Lo que nadie te dice antes de comprar`, descripcion: `Errores comunes al elegir ${base.toLowerCase()} en ${reg}`, fuente: 'Sugerido', score: 90 },
        { titulo: `CFE y paneles solares en ${reg}: Mitos y realidades`, descripcion: `Lo que realmente pasa con tu recibo de luz después de instalar ${base.toLowerCase()}`, fuente: 'Sugerido', score: 85 },
        { titulo: `${sub}: ¿Vale la pena en 2026? Casos reales en ${reg}`, descripcion: `Testimonios y ahorros documentados de ${base.toLowerCase()} en ${reg}`, fuente: 'Sugerido', score: 80 },
        { titulo: `Financiamiento para ${base.toLowerCase()} en ${reg}: Opciones y requisitos`, descripcion: `Créditos, programas y subsidios para instalar ${base.toLowerCase()} en ${reg}`, fuente: 'Sugerido', score: 75 },
    ];
    return suggestions;
}

async function fetchTrends(niche, subNiche, region) {
    const cached = readCache(niche, region);
    if (cached) return cached;

    const raw = await fetchPythonTrends(niche, region);
    let trends = extractTrends(raw, niche);

    if (trends.length < 3) {
        const iaFallback = extractTrendsFromIA(niche, subNiche, region);
        const existingTitles = new Set(trends.map(t => t.titulo.toLowerCase()));
        for (const fb of iaFallback) {
            if (!existingTitles.has(fb.titulo.toLowerCase())) {
                trends.push(fb);
            }
        }
    }

    const result = { trends: trends.slice(0, 10), raw };
    writeCache(niche, region, result);
    return result;
}

module.exports = { fetchTrends };
