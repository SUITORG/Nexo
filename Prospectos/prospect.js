const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Try loading .env from this folder first, then fall back to parent (SUITORGSTORE01 root)
const localEnv = path.join(__dirname, '.env');
const parentEnv = path.join(__dirname, '..', '.env');
if (fs.existsSync(localEnv)) {
    require('dotenv').config({ path: localEnv });
} else if (fs.existsSync(parentEnv)) {
    require('dotenv').config({ path: parentEnv });
}

// ── Config ──────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUTPUT_DIR = path.join(__dirname, 'reportes');

// ── Helpers ─────────────────────────────────────────────────────────────────
function httpGet(url, isJson = true) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { headers: { 'User-Agent': 'SuitOrg-Prospect/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                resolve(isJson ? JSON.parse(data) : data);
            });
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function now() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ── Supabase ────────────────────────────────────────────────────────────────
function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos en .env');
        process.exit(1);
    }
    return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function listIndustrias() {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('industrias')
        .select('*, nichos(*)')
        .eq('activo', true)
        .order('categoria');

    if (error) {
        console.error('❌ Error al leer industrias:', error.message);
        process.exit(1);
    }
    return data;
}

async function findNicho(valor) {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('nichos')
        .select('*, industrias!inner(categoria)')
        .eq('valor', valor)
        .eq('activo', true)
        .maybeSingle();

    if (error) {
        console.error('❌ Error al buscar nicho:', error.message);
        process.exit(1);
    }
    return data;
}

// ── Google Maps / Places ────────────────────────────────────────────────────
async function searchPlaces(query, location, radius) {
    if (!GOOGLE_MAPS_KEY) {
        console.error('❌ GOOGLE_MAPS_API_KEY no está configurada en .env');
        process.exit(1);
    }

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_KEY}&language=es`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (radius) url += `&radius=${radius * 1000}`;

    console.log(`  🔍 Buscando: "${query}"${location ? ` en ${location}` : ''} (radio: ${radius || 5}km)`);

    const result = await httpGet(url);
    if (result.status !== 'OK' && result.status !== 'ZERO_RESULTS') {
        console.error(`  ⚠️  Google API error: ${result.status} - ${result.error_message || ''}`);
        return [];
    }
    return result.results || [];
}

async function getPlaceDetails(placeId) {
    const fields = [
        'name', 'formatted_address', 'formatted_phone_number', 'international_phone_number',
        'website', 'rating', 'user_ratings_total', 'reviews', 'types', 'editorial_summary',
        'plus_code', 'opening_hours', 'business_status', 'price_level', 'url'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_KEY}&language=es&reviews_no_translations=true`;
    const result = await httpGet(url);
    if (result.status !== 'OK') return null;
    return result.result;
}

async function extractSocialFromWebsite(website) {
    if (!website) return {};
    try {
        const html = await httpGet(website, false);
        const social = {};
        const patterns = {
            facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/gi,
            instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._-]+/gi,
            twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/gi,
            tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+/gi,
            youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c|channel|user|@)[a-zA-Z0-9_-]+/gi,
            linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/gi,
            whatsapp: /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\/[a-zA-Z0-9]+/gi,
        };
        for (const [platform, pattern] of Object.entries(patterns)) {
            const matches = html.match(pattern);
            if (matches && matches.length > 0) {
                social[platform] = [...new Set(matches)][0];
            }
        }
        return social;
    } catch {
        return {};
    }
}

function analyzeDigitalPresence(place, social) {
    let score = 0;
    if (place.website) score += 2;
    if (place.formatted_phone_number) score += 1;
    if (place.rating) score += 1;
    if ((place.user_ratings_total || 0) >= 10) score += 1;
    if ((place.user_ratings_total || 0) >= 50) score += 1;
    if (Object.keys(social).length >= 2) score += 2;
    else if (Object.keys(social).length >= 1) score += 1;
    if (place.editorial_summary) score += 1;
    if (place.opening_hours) score += 1;

    if (score >= 7) return 'Alta';
    if (score >= 4) return 'Media';
    return 'Baja';
}

function analyzeStrengths(place) {
    if (!place.reviews || place.reviews.length === 0) return ['Sin reseñas disponibles'];
    const strengths = [];
    const mentions = {};

    const keywords = {
        'Atención/Servicio': ['atención', 'servicio', 'amable', 'trato', 'personal', 'profesional', 'excelente atención'],
        'Calidad/Precio': ['calidad', 'precio', 'económico', 'barato', 'caro', 'relación calidad'],
        'Rapidez': ['rápido', 'rapidez', 'entrega', 'pronto', 'velocidad'],
        'Ubicación': ['ubicación', 'cerca', 'acceso', 'estacionamiento', 'llegar'],
        'Limpieza': ['limpio', 'limpieza', 'higiene', 'ordenado'],
        'Variedad': ['variedad', 'opciones', 'diversidad', 'amplio'],
        'Recomendación': ['recomiendo', 'recomendado', 'volvería', 'repetiré', 'excelente'],
    };

    for (const review of place.reviews.slice(0, 20)) {
        const text = (review.text || '').toLowerCase();
        for (const [category, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (text.includes(word)) {
                    mentions[category] = (mentions[category] || 0) + 1;
                    break;
                }
            }
        }
    }

    const sorted = Object.entries(mentions).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sorted.slice(0, 3)) {
        strengths.push(`${cat} (${count} menciones)`);
    }
    return strengths.length > 0 ? strengths : ['Análisis general positivo (basado en reseñas)'];
}

function detectSocialFromPlace(place) {
    const social = {};
    const text = [
        place.editorial_summary?.overview || '',
        place.name || '',
        ...(place.reviews || []).map(r => r.text || '')
    ].join(' ').toLowerCase();

    if (/facebook\.com|fb\.com|fb\.me/i.test(text)) social.facebook = 'mencionado en perfil';
    if (/instagram\.com|ig\.com/i.test(text)) social.instagram = 'mencionado en perfil';
    if (/(?:twitter|x)\.com/i.test(text)) social.twitter = 'mencionado en perfil';
    if (/tiktok\.com/i.test(text)) social.tiktok = 'mencionado en perfil';
    return social;
}

function inferTargetAudience(place, nicho) {
    const audiences = new Set();
    const text = [
        place.editorial_summary?.overview || '',
        place.name || '',
        ...(place.reviews || []).map(r => r.text || '')
    ].join(' ').toLowerCase();

    const indicators = {
        'Familias': ['familia', 'niños', 'hijos', 'familiar'],
        'Jóvenes': ['joven', 'juvenil', 'estudiante', 'universidad'],
        'Profesionales': ['ejecutivo', 'oficina', 'corporativo', 'empresa', 'trabajo'],
        'Turistas': ['turista', 'visitante', 'viajero', 'foráneo'],
        'Cliente local': ['vecino', 'local', 'colonia', 'cerca de casa'],
        'Cliente premium': ['exclusivo', 'premium', 'lujo', 'gourmet', 'alta calidad'],
    };

    for (const [audience, words] of Object.entries(indicators)) {
        for (const word of words) {
            if (text.includes(word)) {
                audiences.add(audience);
                break;
            }
        }
    }

    if (audiences.size === 0) {
        if (place.price_level >= 3) audiences.add('Cliente premium');
        else audiences.add('Público general');
    }

    return [...audiences];
}

function getWhatsapp(place) {
    const phone = place.international_phone_number || place.formatted_phone_number || '';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) return `https://wa.me/${cleaned}`;
    return '';
}

function formatCell(text) {
    if (!text) return '—';
    return text.replace(/"/g, '""');
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    const args = {};
    const raw = process.argv.slice(2);

    for (let i = 0; i < raw.length; i++) {
        if (raw[i].startsWith('--')) {
            const key = raw[i].replace('--', '');
            const next = raw[i + 1];
            if (next && !next.startsWith('--')) {
                args[key] = next;
                i++;
            } else {
                args[key] = true;
            }
        }
    }

    if (args.help || args.h || Object.keys(args).length === 0) {
        console.log(`
🔍 SuitOrg — Prospector Comercial
===================================
Uso: node prospect.js [opciones]

Opciones:
  --ciudad   TEXT    Ciudad a buscar (requerido)
  --nicho    TEXT    Nicho/industria (requerido, ver --list)
  --radio    NUM     Radio en km (default: 5)
  --zona     TEXT    Zona/colonia específica
  --especializacion TEXT  Especialización dentro del nicho
  --list             Listar industrias y nichos disponibles
  --output   TEXT    Nombre del archivo de reporte
  --help             Mostrar esta ayuda

Ejemplos:
  node prospect.js --ciudad Monterrey --nicho restaurantes --radio 3
  node prospect.js --ciudad CDMX --nicho abogados --especializacion "Derecho Corporativo"
  node prospect.js --list
`);
        return;
    }

    if (args.list) {
        const industrias = await listIndustrias();
        console.log('\n📋 Industrias y Nichos disponibles en Supabase:\n');
        for (const ind of industrias) {
            console.log(`  ${ind.icono || '📦'} ${ind.categoria}`);
            for (const n of (ind.nichos || [])) {
                const esp = n.especializaciones?.length > 0 ? ` [${n.especializaciones.slice(0, 3).join(', ')}${n.especializaciones.length > 3 ? '...' : ''}]` : '';
                console.log(`    └ ${n.etiqueta} (${n.valor})${esp}`);
            }
        }
        console.log();
        return;
    }

    if (!args.ciudad || !args.nicho) {
        console.error('❌ --ciudad y --nicho son requeridos. Usa --help para ayuda.');
        process.exit(1);
    }

    const radio = parseInt(args.radio) || 5;
    const outputName = args.output || `prospectos_${slugify(args.ciudad)}_${slugify(args.nicho)}_${now()}`;
    const outputFile = path.join(OUTPUT_DIR, `${outputName}.md`);

    // ── Find niche in Supabase ──────────────────────────────────────────
    console.log(`\n🔎 Buscando nicho "${args.nicho}" en Supabase...`);
    const nichoData = await findNicho(args.nicho);
    if (!nichoData) {
        console.error(`❌ Nicho "${args.nicho}" no encontrado en Supabase. Usa --list para ver disponibles.`);
        process.exit(1);
    }
    console.log(`  ✅ ${nichoData.industrias?.categoria || '?'} > ${nichoData.etiqueta} (${nichoData.valor})`);

    const sinonimos = (nichoData.sinonimos || []).filter(Boolean);
    const searchTerms = [...sinonimos, args.nicho, args.especializacion].filter(Boolean).slice(0, 5);
    const searchQuery = `${searchTerms.join(' ')} en ${args.zona || ''} ${args.ciudad}`.trim();

    // ── Search Google Places ────────────────────────────────────────────
    console.log(`\n📍 Buscando establecimientos en ${args.ciudad}...`);
    const places = await searchPlaces(searchQuery, null, radio);
    console.log(`  📊 ${places.length} resultados encontrados`);

    if (places.length === 0) {
        console.log('  No se encontraron resultados. Intenta con otro nicho, ciudad o radio más amplio.');
        return;
    }

    // ── Get details for each place ──────────────────────────────────────
    console.log(`\n📋 Obteniendo detalles de cada establecimiento...`);
    const results = [];
    for (let i = 0; i < Math.min(places.length, 20); i++) {
        const p = places[i];
        process.stdout.write(`  [${i + 1}/${Math.min(places.length, 20)}] ${p.name}... `);
        const details = await getPlaceDetails(p.place_id);
        if (!details) {
            process.stdout.write('sin datos\n');
            continue;
        }

        const social = await extractSocialFromWebsite(details.website);
        const socialFromPlace = detectSocialFromPlace(details);
        const allSocial = { ...socialFromPlace, ...social };

        const strengths = analyzeStrengths(details);
        const audience = inferTargetAudience(details, nichoData);
        const presence = analyzeDigitalPresence(details, allSocial);
        const whatsapp = getWhatsapp(details);

        process.stdout.write('✅\n');
        await sleep(200);

        results.push({
            nombre: details.name || p.name,
            direccion: details.formatted_address || p.formatted_address || '',
            rating: details.rating || p.rating || '—',
            totalReviews: details.user_ratings_total || p.user_ratings_total || 0,
            telefono: details.formatted_phone_number || '',
            whatsapp,
            website: details.website || '',
            redesSociales: allSocial,
            tipoNegocio: (details.types || []).filter(t => !t.startsWith('_') && t !== 'establishment').join(', ') || '—',
            publicoObjetivo: audience,
            puntosFuertes: strengths,
            presenciaDigital: presence,
            googleUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
        });
    }

    // ── Generate Report ─────────────────────────────────────────────────
    console.log(`\n📝 Generando reporte...`);

    const lines = [
        `# Reporte de Prospección Comercial`,
        ``,
        `**Generado:** ${new Date().toLocaleString('es-MX')}`,
        `**Ciudad:** ${args.ciudad}${args.zona ? ` | **Zona:** ${args.zona}` : ''}`,
        `**Radio:** ${radio} km`,
        `**Industria:** ${nichoData.industrias?.categoria || '?'}`,
        `**Nicho:** ${nichoData.etiqueta} (${args.nicho})${args.especializacion ? ` | **Especialización:** ${args.especializacion}` : ''}`,
        `**Establecimientos encontrados:** ${results.length} de ${places.length} totales`,
        ``,
        `---`,
        ``,
        `| Nombre del Negocio | Dirección Completa | Puntuación Google | N° Reseñas | Teléfono | WhatsApp | Redes Sociales | Tipo de Negocio | Público Objetivo | Puntos Fuertes (basados en reseñas) | Presencia Digital |`,
        `|---|---|---|---|---|---|---|---|---|---|---|`,
    ];

    for (const r of results) {
        const redes = Object.entries(r.redesSociales)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ') || '—';

        lines.push([
            formatCell(r.nombre),
            formatCell(r.direccion),
            r.rating,
            r.totalReviews,
            formatCell(r.telefono || '—'),
            formatCell(r.whatsapp || '—'),
            formatCell(redes),
            formatCell(r.tipoNegocio),
            formatCell(r.publicoObjetivo.join(', ')),
            formatCell(r.puntosFuertes.join('. ')),
            r.presenciaDigital,
        ].join(' | '));
    }

    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Detalles por establecimiento`);
    lines.push(``);

    for (const r of results) {
        lines.push(`### ${r.nombre}`);
        lines.push(`- **Dirección:** ${r.direccion}`);
        lines.push(`- **Google Maps:** [Abrir en Maps](${r.googleUrl})`);
        if (r.telefono) lines.push(`- **Teléfono:** ${r.telefono}`);
        if (r.whatsapp) lines.push(`- **WhatsApp:** [Enviar mensaje](${r.whatsapp})`);
        if (r.website) lines.push(`- **Sitio web:** ${r.website}`);
        if (Object.keys(r.redesSociales).length > 0) {
            lines.push(`- **Redes sociales:**`);
            for (const [platform, url] of Object.entries(r.redesSociales)) {
                lines.push(`  - ${platform}: ${url}`);
            }
        }
        lines.push(`- **Tipo:** ${r.tipoNegocio}`);
        lines.push(`- **Público objetivo:** ${r.publicoObjetivo.join(', ')}`);
        lines.push(`- **Puntos fuertes:** ${r.puntosFuertes.join('. ')}`);
        lines.push(`- **Presencia digital:** ${r.presenciaDigital}`);
        lines.push(`- **Google Rating:** ${r.rating} ⭐ (${r.totalReviews} reseñas)`);
        lines.push(``);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

    console.log(`\n✅ Reporte generado: ${outputFile}`);
    console.log(`📊 ${results.length} establecimientos analizados\n`);
}

main().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
