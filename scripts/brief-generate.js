// ── BRIEF GENERATOR (SuitOrg) ────────────────────────────────────────────────
// Router Express autocontenido: toda la lógica de decisión/generación del Brief
// vive acá. SuitCampanas solo lee parseBrief() — no decide su generación.
// Montado en server.js antes del catch-all SPA.

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// GAS deployment de SuitCampanas (Config_Empresas / brief metadata / assets).
// NO usar el GAS_URL de server.js (event log / sync) — son deployments distintos.
const GAS_URL = process.env.BRIEF_GAS_URL
    || process.env.SUITCAMPANAS_GAS_URL
    // Deployment canónico de "EVASOL Backend" (scriptId 1ne8mrUA...). SÍ tiene
    // updateBriefVector. Se estabilizó el 2026-09-23 (ping + write verificados
    // tras la propagación inicial) — reemplaza al "stable" anterior que nunca
    // tuvo ese case. Ver .suit/registry/gas-deployments.yaml.
    || 'https://script.google.com/macros/s/AKfycbzlkAI09chbtmf3VX5jKA9N4-6Ka2pcc6P65YqCXHn9amzACDCjuJBpFm2A8tPFyDwrsA/exec';

// Lazy Supabase client - solo se crea cuando se necesita
let _supabase = null;
function getSupabase() {
    if (!_supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        if (!url || !key) {
            throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos en .env');
        }
        _supabase = createClient(url, key, { auth: { persistSession: false } });
    }
    return _supabase;
}

function serverLog(level, ...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    console.log(`[${new Date().toLocaleTimeString()}] [${level}] ${msg}`);
}

// fetch a GAS con reintento — Google intermitentemente devuelve una página HTML
// ("ppConfig...") en vez de ejecutar el script (visto en vivo 2026-09-23, en
// ambos deployments probados). No es un bug de este código: 1 reintento tras
// una pausa corta resuelve la gran mayoría de estos casos.
// Timeout de 15s por intento — sin esto, un Google lento hace que los 3 intentos
// juntos superen el límite de 100s del túnel cloudflared (HTTP 524 opaco en el
// sidebar en vez de un error claro, visto en vivo 2026-09-23).
async function fetchGasJson(url, options, retries = 2, timeoutMs = 15000) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
            const text = await res.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error(`GAS no devolvió JSON (¿HTML de Google?): ${text.slice(0, 120)}`);
            }
            return { res, json };
        } catch (e) {
            lastErr = e.name === 'TimeoutError' ? new Error(`GAS no respondió en ${timeoutMs / 1000}s`) : e;
            serverLog('WARN', `[GAS_FETCH] intento ${attempt + 1}/${retries + 1} falló: ${lastErr.message}`);
            if (attempt < retries) await new Promise(r => setTimeout(r, 1500));
        }
    }
    throw lastErr;
}

function normalizeDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return url;
}

// ── Web Research con Fallback Chain ───────────────────────────────────────────
// Cadena: 1) Google Custom Search / SerpAPI (búsqueda real) → 2) callAiJson
// (Gemini→SuitAI, que ya cae a Ollama/OmniRoute internamente — ver más abajo).
// Antes el paso 2 llamaba a SuitAI /api/research, que nunca existió (404 fijo,
// confirmado en vivo 2026-09-23) — todo el research caía siempre a Ollama directo
// sin razón. Unificado a la misma cadena que usa la generación del Brief.

const RESEARCH_CHAIN = [
    { name: 'google', fn: researchGoogle, timeout: 15000 },
    { name: 'ai', fn: researchAI, timeout: 90000 }
];

async function researchWithFallback(query, intent) {
    let lastError = '';
    for (const step of RESEARCH_CHAIN) {
        try {
            serverLog('INFO', `[RESEARCH] Intentando ${step.name} para: ${query.slice(0,60)}...`);
            const result = await Promise.race([
                step.fn(query, intent),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), step.timeout))
            ]);
            if (result && result.findings && result.findings.length > 0) {
                serverLog('INFO', `[RESEARCH] ${step.name} OK (${result.findings.length} hallazgos)`);
                return { ...result, source: step.name };
            }
            serverLog('WARN', `[RESEARCH] ${step.name} sin resultados útiles`);
        } catch (err) {
            lastError = err.message;
            serverLog('WARN', `[RESEARCH] ${step.name} falló: ${err.message}`);
        }
    }
    serverLog('ERROR', `[RESEARCH] Todos los fallbacks fallaron para: ${query}`);
    return { findings: [], consensus: '', sources: [], confidence: 'C', error: lastError };
}

async function researchGoogle(query, intent) {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.SERPAPI_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    if (!apiKey || !cx) throw new Error('GOOGLE_SEARCH_API_KEY/CX no configuradas');
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
    const res = await fetch(url);
    const data = await res.json();
    
    const findings = (data.items || []).map(item => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link
    }));
    
    return {
        findings,
        consensus: findings.slice(0,3).map(f => f.snippet).join(' | '),
        sources: findings.map(f => f.url),
        confidence: 'B'
    };
}

async function researchAI(query, intent) {
    const system = 'Eres un investigador de mercado. Responde EXCLUSIVAMENTE con JSON válido, sin texto extra.';
    const user = `Investiga sobre: ${query}\nIntención: ${intent}\nResponde en JSON: {"findings":[{"title":"","snippet":"","url":""}],"consensus":"","sources":[],"confidence":"C"}`;
    try {
        return await callAiJson(system, user);
    } catch (e) {
        throw new Error(`AI research falló: ${e.message}`);
    }
}

// Sub-agentes de research que usan la fallback chain

async function researchAvatar(nicho, especializacion, geo) {
    const queries = [
        `perfil cliente ideal ${nicho} ${especializacion} ${geo} demografía poder adquisitivo`,
        `dolores principales ${nicho} ${especializacion} lenguaje cliente`,
        `objeciones compra ${nicho} ${especializacion} primera persona`
    ];
    const results = await Promise.all(queries.map(q => researchWithFallback(q, 'avatar')));
    return {
        audiencia: results[0].consensus || '[PENDIENTE - Avatar]',
        dolor: results[1].consensus || '[PENDIENTE - Dolores]',
        objecion: results[2].consensus || '[PENDIENTE - Objeciones]',
        sources: results.flatMap(r => r.sources || []),
        confidence: 'B'
    };
}

async function researchCompetencia(nicho, especializacion, geo) {
    const queries = [
        `competidores directos ${nicho} ${especializacion} ${geo} referentes inspiración`,
        `precios mercado ${nicho} ${especializacion} ${geo} rango`,
        `plataformas recomendadas ${nicho} ${especializacion} justificación`
    ];
    const results = await Promise.all(queries.map(q => researchWithFallback(q, 'competencia')));
    return {
        competidores: results[0].consensus || '[PENDIENTE - Competidores]',
        PM: results[1].consensus || '[PENDIENTE - PM]',
        vivir: results[2].consensus || '[PENDIENTE - Vivir]',
        sources: results.flatMap(r => r.sources || []),
        confidence: 'B'
    };
}

async function researchLegal(industria, producto, plataformas) {
    const query = `restricciones legales ${industria} ${producto} publicidad ${plataformas} regulador políticas Meta Google Ads disclosure IA`;
    const result = await researchWithFallback(query, 'legal');
    return {
        RLP: result.consensus || '[PENDIENTE - RLP]',
        sources: result.sources || [],
        confidence: 'B'
    };
}

// ── Brief Parser (pipe-delimited de Config_Empresas.logo_url) ────────────────

const BRIEF_LIST_FIELDS = {
    dolor: 'dolor',
    pcp: 'promesa_beneficio_prueba',
    pbp: 'promesa_beneficio_prueba',  // alias canónico (ADR-026)
    pbm: 'promesa_beneficio_prueba',  // alias legado
    objecion: 'objeciones',
    competidores: 'competidores'
};

const BRIEF_EXTRA_COLUMNS = ['slogan', 'descripcion', 'giro_especifico', 'foto_agente'];

function parseBrief(briefVectorRaw, empresaRow) {
    const brief = { etiqueta_legado: '' };
    const mergeExtras = () => {
        if (!empresaRow) return;
        for (const k of BRIEF_EXTRA_COLUMNS) {
            if (empresaRow[k] && !brief[k]) brief[k] = empresaRow[k];
        }
        if (!brief.telefonowhastapp) {
            brief.telefonowhastapp = empresaRow.telefonowhatsapp || empresaRow.telefonowhastapp || '';
        }
    };
    if (!briefVectorRaw || typeof briefVectorRaw !== 'string') { mergeExtras(); return brief; }
    const segments = briefVectorRaw.split('|');
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i].trim();
        if (!seg) continue;
        const colon = seg.indexOf(':');
        if (colon < 0) {
            if (i === 0) brief.etiqueta_legado = seg;
            continue;
        }
        const key = seg.slice(0, colon).trim().toLowerCase();
        let value = seg.slice(colon + 1).trim();
        if (!value) continue;
        value = value.replace(/\s*\[([ABC])\]\s*$/i, '').trim();
        if (key === 'lapvtfu' || key === 'lavtfu') {
            const parts = value.split(',').map(s => s.trim());
            while (parts.length < 7) parts.push('');
            const [logo, avatarRaw, fotoPersonal, videos, testimonios, fotos, ugc] = parts;
            brief.activos = { logo, avatar: avatarRaw || logo, fotoPersonal, videos, testimonios, fotos, ugc };
            continue;
        }
        if (BRIEF_LIST_FIELDS[key]) {
            const arr = value.split(',').map(s => s.trim()).filter(Boolean);
            if (arr.length) brief[BRIEF_LIST_FIELDS[key]] = arr;
            continue;
        }
        if (key === 'galeria') { brief.usa_galeria = value.toLowerCase().includes('si_galeria'); continue; }
        if (key === 'vendes') { brief.producto = value; continue; }
        if (key === 'lograr') { brief.objetivo = value; continue; }
        if (key === 'vivir') { brief.canal_principal = value; continue; }
        if (key === 'pm') {
            const parts = value.split(',').map(s => s.trim()).filter(Boolean);
            brief.precio_margen = { precio: parts[0] || '', margen: parts[1] || '' };
            continue;
        }
        if (key === 'ps') { brief.prueba_social = value; continue; }
        if (key === 'rlp') { brief.restricciones_legales = value; continue; }
        brief[key] = value;
    }
    mergeExtras();
    return brief;
}

// Trae la fila de Config_Empresas por id_empresa desde GAS (action=getAll).
// fetch nativo GET sigue el 302 de GAS automáticamente (sin re-POSTear).
async function fetchEmpresaRow(idEmpresa) {
    const url = GAS_URL.includes('?') ? (GAS_URL + '&action=getAll') : (GAS_URL + '?action=getAll');
    const { json: gasBody } = await fetchGasJson(url, { redirect: 'follow' });
    const rows = gasBody?.Config_Empresas || gasBody?.data || [];
    return rows.find(c => String(c.id_empresa || '').toLowerCase() === String(idEmpresa || '').toLowerCase())
        || rows.find(c => String(c.nomempresa || '').toLowerCase() === String(idEmpresa || '').toLowerCase())
        || null;
}

// ── IA: Gemini directo (rápido, con crédito) → SuitAI (Ollama/OmniRoute) de respaldo ──
// Antes le pegaba directo a OpenRouter (OPENROUTER_DIRECT_KEY) sin fallback — sin
// crédito, todo Brief fallaba con "Insufficient credits". Probado en vivo (2026-09-23):
// SuitAI prioriza Ollama local por latencia de escaneo, pero Ollama tarda 120s+ por
// intento con este prompt grande y falla igual (2/2 fallos reales) — con 17 modelos
// Ollama en la cola, el timeout de fetch (~5min) revienta antes de llegar a nada más.
// OmniRoute (oc/*, "auto/*") está caído ahora mismo (401/403/"unavailable"/cuelgues de
// 45s+) — no es un bug de este código, es el proveedor. Gemini directo (misma
// GEMINI_API_KEY que ya usa server.js) respondió 200 OK en ~2s: se usa primero.

function extractJsonFromAiText(text) {
    const raw = (text || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return fenced[1].trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) return raw.slice(start, end + 1);
    return raw;
}

async function callGeminiJson(systemContent, userContent) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');
    const model = process.env.BRIEF_GEMINI_MODEL || 'gemini-flash-latest';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemContent}\n\n${userContent}` }] }],
            // responseMimeType fuerza JSON sintácticamente válido — sin esto, Gemini
            // ocasionalmente mete una comilla sin escapar en un campo largo (ej.
            // audiencia/PBP) y JSON.parse revienta ("Expected ',' or '}'...", visto
            // en vivo 2026-09-23). maxOutputTokens en 8192 (antes 4096): con prompts
            // grandes (research de 3 sub-agentes embebido) el modelo gasta tokens
            // "pensando" antes del JSON final y con 4096 se cortaba a medias, dejando
            // texto de razonamiento sin cerrar en vez de JSON (visto en vivo).
            generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: 'application/json' }
        })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `Gemini HTTP ${res.status}`);
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error('Gemini: respuesta sin contenido (posible bloqueo de safety)');
    return content;
}

async function callSuitAiJson(systemContent, userContent) {
    const messages = [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent }
    ];
    const suitaiUrl = process.env.SUITAI_URL || 'http://localhost:3010';
    const res = await fetch(`${suitaiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `SuitAI HTTP ${res.status}`);
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('SuitAI: respuesta sin contenido');
    serverLog('INFO', `[BRIEF_AI] SuitAI modelo: ${json.model || 'desconocido'} (${json.latency_ms ?? '?'}ms)`);
    return content;
}

// Cadena única de IA para todo el módulo (generación de Brief Y research):
// Gemini directo (rápido, con crédito) → SuitAI (Ollama/OmniRoute de respaldo).
// Se probó priorizar Ollama local (2026-09-23): con el prompt real completo
// (research de 3 sub-agentes embebido) ningún modelo local disponible terminó
// a tiempo — timeouts de 90s en qwen3.6/qwen2.5-coder, JSON mal formado en
// llama3.2 — y el research en paralelo (hasta 7 llamadas simultáneas) satura
// un solo modelo local. Se revirtió a Gemini-primero.
async function callAiJson(systemContent, userContent) {
    let content;
    try {
        content = await callGeminiJson(systemContent, userContent);
        serverLog('INFO', '[BRIEF_AI] Gemini directo OK');
    } catch (e) {
        serverLog('WARN', `[BRIEF_AI] Gemini falló (${e.message}), cae a SuitAI...`);
        content = await callSuitAiJson(systemContent, userContent);
    }
    try {
        return JSON.parse(extractJsonFromAiText(content));
    } catch (e) {
        serverLog('ERROR', `[BRIEF_AI] JSON inválido, texto crudo: ${content}`);
        throw e;
    }
}

// ── Taxonomía (Supabase catalogs: industrias → nichos → especializaciones) ───

async function resolverTaxonomia(giro, nombre) {
    const result = { industria: '', nicho: '', especializacion: '', tono: '' };
    if (!giro && !nombre) return result;

    const { data: industrias } = await getSupabase()
        .from('industrias')
        .select('id, categoria, nichos(id, nombre, especializaciones, sinonimos)')
        .limit(50);

    if (!industrias || industrias.length === 0) return result;

    const searchText = `${giro} ${nombre}`.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const ind of industrias) {
        const catLower = (ind.categoria || '').toLowerCase();
        const descLower = (ind.descripcion || '').toLowerCase();
        const words = searchText.split(/\s+/).filter(w => w.length > 3);
        let score = 0;
        for (const w of words) {
            if (catLower.includes(w)) score += 2;
            if (descLower.includes(w)) score += 1;
            for (const nicho of (ind.nichos || [])) {
                const nichoName = (nicho.nombre || '').toLowerCase();
                const sinos = (nicho.sinonimos || []).map(s => s.toLowerCase());
                if (nichoName.includes(w)) score += 3;
                if (sinos.some(s => s.includes(w))) score += 2;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = ind;
        }
    }

    if (bestMatch && bestScore > 0) {
        result.industria = bestMatch.categoria || '';

        let bestNicho = null;
        let bestNichoScore = 0;
        for (const nicho of (bestMatch.nichos || [])) {
            const nichoName = (nicho.nombre || '').toLowerCase();
            const sinos = (nicho.sinonimos || []).map(s => s.toLowerCase());
            let nScore = 0;
            const words = searchText.split(/\s+/).filter(w => w.length > 3);
            for (const w of words) {
                if (nichoName.includes(w)) nScore += 3;
                if (sinos.some(s => s.includes(w))) nScore += 2;
            }
            if (nScore > bestNichoScore) {
                bestNichoScore = nScore;
                bestNicho = nicho;
            }
        }

        if (bestNicho) {
            result.nicho = bestNicho.nombre || '';
            const esps = bestNicho.especializaciones || [];
            if (esps.length === 1) {
                result.especializacion = esps[0];
            } else if (esps.length > 1) {
                let bestEsp = esps[0];
                let bestEspScore = 0;
                for (const esp of esps) {
                    const espLower = esp.toLowerCase();
                    let eScore = 0;
                    const words = searchText.split(/\s+/).filter(w => w.length > 3);
                    for (const w of words) {
                        if (espLower.includes(w)) eScore += 2;
                    }
                    if (eScore > bestEspScore) {
                        bestEspScore = eScore;
                        bestEsp = esp;
                    }
                }
                result.especializacion = bestEsp;
            }
        }
    }

    return result;
}

// ── Prompt del generador de Brief (20 campos, orden fijo) ─────────────────────

function buildBriefGeneratorPrompt() {
    return `Eres un Director de Marketing experto. Genera campos faltantes de un Brief de Marketing de 20 campos.

# REGLAS
- Responde EXCLUSIVAMENTE con JSON válido, sin texto extra.
- Nunca sobrescribas datos del cliente (campos ya presentes en "existente").
- Campos vacíos/vacíos se generan; campos con valor se respetan.
- Cada campo inferido lleva confianza: "A" (cliente), "B" (inferido con fuente), "C" (creativo).
- Si no puedes generar un campo, escribe "[PENDIENTE - razón]".
- Idioma: español (México).

# CAMPOS DEL BRIEF (orden fijo)
1. industria - De catálogo Supabase (ya resuelto en taxonomia.industria)
2. nicho - De catálogo Supabase (ya resuelto en taxonomia.nicho)
3. especializacion - De catálogo Supabase (ya resuelto en taxonomia.especializacion)
4. vendes - Producto(s) o Servicio. UNO solo.
5. audiencia - Demografía + geografía + psicografía + poder adquisitivo, en una frase densa.
6. dolor - 3-5 dolores reales del cliente ideal, en su lenguaje.
7. PBP - Promesa + Beneficio + Prueba. Prueba: evidencia de categoría, jamás inventes testimonios.
8. lograr - Uno solo: Ventas | Leads | Awareness | Contenido.
9. vivir - Plataforma(s) con justificación de 1 línea.
10. LAPVTFU - 7 posiciones: logo,avatar,fotoPersonal,videos,testimonios,fotos,ugc. Vacías = [PENDIENTE].
11. PM - Precio,margen. Formato: 0000.00,00%. Si falta: sugiere rango de mercado (confianza C).
12. objecion - 4-6 objeciones en primera persona del avatar.
13. competidores - Competidores directos y referentes/inspiración.
14. tono - Tono de marca (profesional, cercano, divertido, directo, premium, etc.)
15. PS - Prueba social. Si no hay: [PENDIENTE - Prueba social].
16. RLP - Restricciones legales: regulador + políticas de plataformas + disclosure IA.
17. slogan - Si existe en cliente, copiar. Si no, propone 3 opciones (confianza C).
18. oferta - Si existe en cliente, copiar. Si no, arma oferta: qué incluye + garantía + facilidad.
19. cta - Hook + copy alineado a #8. Ventas=imperativo; Leads=bajo riesgo; Awareness=curiosidad; Contenido=suscripción.
20. tipografia - Par display+texto coherente con #14. Catálogo: moderna/audaz/elegante/amigable/corporativa.

# FORMATO DE SALIDA
{
  "campos": {
    "vendes": { "valor": "...", "confianza": "A|B|C" },
    "audiencia": { "valor": "...", "confianza": "B" },
    "dolor": { "valor": "...", "confianza": "B" },
    "PBP": { "valor": "...", "confianza": "B|C" },
    "lograr": { "valor": "...", "confianza": "A" },
    "vivir": { "valor": "...", "confianza": "B" },
    "PM": { "valor": "...", "confianza": "C" },
    "objecion": { "valor": "...", "confianza": "B" },
    "competidores": { "valor": "...", "confianza": "B" },
    "tono": { "valor": "...", "confianza": "C" },
    "PS": { "valor": "...", "confianza": "A|B" },
    "RLP": { "valor": "...", "confianza": "B" },
    "slogan": { "valor": "...", "confianza": "A|C" },
    "oferta": { "valor": "...", "confianza": "C" },
    "descripcion": { "valor": "...", "confianza": "A" },
    "cta": { "valor": "...", "confianza": "C" },
    "tipografia": { "valor": "...", "confianza": "C" }
  }
}`;
}

function buildBriefGeneratorInput(empresaRow, existingBrief, taxonomia, researchData = {}) {
    const empresa = {
        id_empresa: empresaRow.id_empresa || '',
        nombre: empresaRow.nomempresa || '',
        giro_especifico: empresaRow.giro_especifico || '',
        descripcion: empresaRow.descripcion || '',
        slogan: empresaRow.slogan || '',
        color_tema: empresaRow.color_tema || '',
        tipo_negocio: empresaRow.tipo_negocio || ''
    };

    const existente = {};
    if (existingBrief.industria) existente.industria = existingBrief.industria;
    if (existingBrief.nicho) existente.nicho = existingBrief.nicho;
    if (existingBrief.especializacion) existente.especializacion = existingBrief.especializacion;
    if (existingBrief.producto) existente.vendes = existingBrief.producto;
    if (existingBrief.audiencia) existente.audiencia = existingBrief.audiencia;
    if (existingBrief.dolor) existente.dolor = Array.isArray(existingBrief.dolor) ? existingBrief.dolor.join(', ') : existingBrief.dolor;
    if (existingBrief.pbp) existente.PBP = existingBrief.pbp;
    if (existingBrief.objetivo) existente.lograr = existingBrief.objetivo;
    if (existingBrief.canal_principal) existente.vivir = existingBrief.canal_principal;
    if (existingBrief.activos) {
        const a = existingBrief.activos;
        existente.LAPVTFU = [a.logo, a.avatar, a.fotoPersonal, a.videos, a.testimonios, a.fotos, a.ugc].join(',');
    }
    if (existingBrief.precio_margen) existente.PM = `${existingBrief.precio_margen.precio},${existingBrief.precio_margen.margen}`;
    if (existingBrief.objeciones) existente.objecion = existingBrief.objeciones.join(', ');
    if (existingBrief.competidores) existente.competidores = existingBrief.competidores;
    if (existingBrief.tono) existente.tono = existingBrief.tono;
    if (existingBrief.prueba_social) existente.PS = existingBrief.prueba_social;
    if (existingBrief.restricciones_legales) existente.RLP = existingBrief.restricciones_legales;
    if (existingBrief.slogan) existente.slogan = existingBrief.slogan;
    if (existingBrief.oferta) existente.oferta = existingBrief.oferta;
    if (existingBrief.descripcion) existente.descripcion = existingBrief.descripcion;
    if (existingBrief.cta) existente.cta = existingBrief.cta;
    if (existingBrief.tipografia) existente.tipografia = existingBrief.tipografia;

    // Incluir researchData para que la IA use hallazgos con fuentes
    const research = {};
    if (researchData.avatar) {
        research.audiencia = researchData.avatar.audiencia;
        research.dolor = researchData.avatar.dolor;
        research.objecion = researchData.avatar.objecion;
        research.avatarSources = researchData.avatar.sources;
    }
    if (researchData.competencia) {
        research.competidores = researchData.competencia.competidores;
        research.PM = researchData.competencia.PM;
        research.vivir = researchData.competencia.vivir;
        research.competenciaSources = researchData.competencia.sources;
    }
    if (researchData.legal) {
        research.RLP = researchData.legal.RLP;
        research.legalSources = researchData.legal.sources;
    }

    return JSON.stringify({
        empresa,
        taxonomia,
        existente,
        research,
        instruccion: 'Genera SOLO los campos que faltan en "existente". Respeta los que ya tienen valor. Usa "research" como fuente para campos B (citar sources).'
    }, null, 2);
}

const BRIEF_FIELD_ORDER = [
    'industria', 'nicho', 'especializacion', 'vendes', 'audiencia',
    'dolor', 'PBP', 'lograr', 'vivir', 'LAPVTFU', 'PM', 'objecion',
    'competidores', 'tono', 'PS', 'RLP', 'slogan', 'oferta', 'descripcion', 'cta', 'tipografia'
];

function assembleCompleteBrief(existingBrief, generated, taxonomia, empresaRow, researchData = {}) {
    const campos = generated?.campos || {};

    function getVal(field) {
        const avatarR = researchData.avatar || {};
        const compR = researchData.competencia || {};
        const legalR = researchData.legal || {};

        switch (field) {
            case 'industria':
                if (existingBrief.industria) return { valor: existingBrief.industria, confianza: 'A' };
                if (taxonomia.industria) return { valor: taxonomia.industria, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'nicho':
                if (existingBrief.nicho) return { valor: existingBrief.nicho, confianza: 'A' };
                if (taxonomia.nicho) return { valor: taxonomia.nicho, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'especializacion':
                if (existingBrief.especializacion) return { valor: existingBrief.especializacion, confianza: 'A' };
                if (taxonomia.especializacion) return { valor: taxonomia.especializacion, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'vendes':
                if (existingBrief.producto) return { valor: existingBrief.producto, confianza: 'A' };
                if (campos.vendes?.valor) return { valor: campos.vendes.valor, confianza: campos.vendes.confianza || 'C' };
                return { valor: '', confianza: 'C' };
            case 'audiencia':
                if (existingBrief.audiencia) return { valor: existingBrief.audiencia, confianza: 'A' };
                if (campos.audiencia?.valor) return { valor: campos.audiencia.valor, confianza: campos.audiencia.confianza || 'B' };
                if (avatarR.audiencia) return { valor: avatarR.audiencia, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'dolor': {
                const d = existingBrief.dolor;
                if (d) return { valor: (Array.isArray(d) ? d.join(', ') : d), confianza: 'A' };
                if (campos.dolor?.valor) return { valor: campos.dolor.valor, confianza: campos.dolor.confianza || 'B' };
                if (avatarR.dolor) return { valor: avatarR.dolor, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            }
            case 'PBP':
                if (existingBrief.pbp) return { valor: existingBrief.pbp, confianza: 'A' };
                if (campos.PBP?.valor) return { valor: campos.PBP.valor, confianza: campos.PBP.confianza || 'B' };
                return { valor: '', confianza: 'C' };
            case 'lograr':
                if (existingBrief.objetivo) return { valor: existingBrief.objetivo, confianza: 'A' };
                if (campos.lograr?.valor) return { valor: campos.lograr.valor, confianza: campos.lograr.confianza || 'A' };
                return { valor: '', confianza: 'C' };
            case 'vivir':
                if (existingBrief.canal_principal) return { valor: existingBrief.canal_principal, confianza: 'A' };
                if (campos.vivir?.valor) return { valor: campos.vivir.valor, confianza: campos.vivir.confianza || 'B' };
                if (compR.vivir) return { valor: compR.vivir, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'LAPVTFU': {
                if (existingBrief.activos) {
                    const a = existingBrief.activos;
                    return { valor: [a.logo, a.avatar, a.fotoPersonal, a.videos, a.testimonios, a.fotos, a.ugc].join(','), confianza: 'A' };
                }
                return { valor: ',,,,,,', confianza: 'C' };
            }
            case 'PM': {
                if (existingBrief.precio_margen) {
                    return { valor: `${existingBrief.precio_margen.precio},${existingBrief.precio_margen.margen}`, confianza: 'A' };
                }
                if (campos.PM?.valor) return { valor: campos.PM.valor, confianza: campos.PM.confianza || 'C' };
                if (compR.PM) return { valor: compR.PM, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            }
            case 'objecion': {
                const o = existingBrief.objeciones;
                if (o) return { valor: (Array.isArray(o) ? o.join(', ') : o), confianza: 'A' };
                if (campos.objecion?.valor) return { valor: campos.objecion.valor, confianza: campos.objecion.confianza || 'B' };
                if (avatarR.objecion) return { valor: avatarR.objecion, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            }
            case 'competidores':
                if (existingBrief.competidores) return { valor: existingBrief.competidores, confianza: 'A' };
                if (campos.competidores?.valor) return { valor: campos.competidores.valor, confianza: campos.competidores.confianza || 'B' };
                if (compR.competidores) return { valor: compR.competidores, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'tono':
                if (existingBrief.tono) return { valor: existingBrief.tono, confianza: 'A' };
                if (campos.tono?.valor) return { valor: campos.tono.valor, confianza: campos.tono.confianza || 'C' };
                return { valor: '', confianza: 'C' };
            case 'PS':
                if (existingBrief.prueba_social) return { valor: existingBrief.prueba_social, confianza: 'A' };
                if (campos.PS?.valor) return { valor: campos.PS.valor, confianza: campos.PS.confianza || 'A' };
                return { valor: '[PENDIENTE - Prueba social]', confianza: 'C' };
            case 'RLP':
                if (existingBrief.restricciones_legales) return { valor: existingBrief.restricciones_legales, confianza: 'A' };
                if (campos.RLP?.valor) return { valor: campos.RLP.valor, confianza: campos.RLP.confianza || 'B' };
                if (legalR.RLP) return { valor: legalR.RLP, confianza: 'B' };
                return { valor: '', confianza: 'C' };
            case 'slogan':
                if (existingBrief.slogan) return { valor: existingBrief.slogan, confianza: 'A' };
                if (empresaRow.slogan) return { valor: empresaRow.slogan, confianza: 'A' };
                if (campos.slogan?.valor) return { valor: campos.slogan.valor, confianza: campos.slogan.confianza || 'C' };
                return { valor: '', confianza: 'C' };
            case 'oferta':
                if (existingBrief.oferta) return { valor: existingBrief.oferta, confianza: 'A' };
                if (campos.oferta?.valor) return { valor: campos.oferta.valor, confianza: campos.oferta.confianza || 'C' };
                return { valor: '', confianza: 'C' };
            case 'descripcion':
                if (existingBrief.descripcion) return { valor: existingBrief.descripcion, confianza: 'A' };
                if (empresaRow.descripcion) return { valor: empresaRow.descripcion, confianza: 'A' };
                if (campos.descripcion?.valor) return { valor: campos.descripcion.valor, confianza: campos.descripcion.confianza || 'A' };
                return { valor: '', confianza: 'C' };
            case 'cta':
                if (existingBrief.cta) return { valor: existingBrief.cta, confianza: 'A' };
                if (campos.cta?.valor) return { valor: campos.cta.valor, confianza: campos.cta.confianza || 'C' };
                return { valor: '', confianza: 'C' };
            case 'tipografia':
                if (existingBrief.tipografia) return { valor: existingBrief.tipografia, confianza: 'A' };
                if (campos.tipografia?.valor) return { valor: campos.tipografia.valor, confianza: campos.tipografia.confianza || 'C' };
                return { valor: 'moderna', confianza: 'C' };
            default:
                return { valor: '', confianza: 'C' };
        }
    }

    const parts = BRIEF_FIELD_ORDER.map(field => {
        const { valor, confianza } = getVal(field);
        let val = typeof valor === 'string' ? valor : String(valor);
        val = val.replace(/\|/g, '⁄');
        if (!val || val.trim() === '') val = '[PENDIENTE]';
        return `${field}: ${val} [${confianza}]`;
    });

    return parts.join(' |');
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /api/brief/companies — lista de empresas para brief.html
router.get('/api/brief/companies', async (req, res) => {
    try {
        const url = GAS_URL.includes('?') ? (GAS_URL + '&action=getAll') : (GAS_URL + '?action=getAll');
        const { json: parsed } = await fetchGasJson(url, { redirect: 'follow' });
        const rows = Array.isArray(parsed.Config_Empresas) ? parsed.Config_Empresas
            : (Array.isArray(parsed.data) ? parsed.data : null);
        if (!rows) throw new Error('GAS no devolvió Config_Empresas');
        const companies = rows.map(c => ({
            nomempresa: c.nomempresa || c.nombre_empresa || '',
            logo_url: c.logo_url || '',
            telefonowhastapp: c.telefonowhatsapp || c.telefonowhastapp || '',
            enlace_oficial: c.enlace_oficial || c.website || '',
            color_tema: c.color_tema || '#2563eb',
            id_empresa: c.id_empresa || '',
            tipo_negocio: c.tipo_negocio || ''
        })).filter(c => c.nomempresa);
        res.json({ status: 'success', message: 'Configuraciones cargadas', data: companies });
    } catch (e) {
        serverLog('ERROR', `[BRIEF_COMPANIES] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// GET /api/brief/empresa?empresa=id — Brief parseado de una empresa (solo lectura)
router.get('/api/brief/empresa', async (req, res) => {
    try {
        const id = req.query.empresa;
        if (!id) return res.status(400).json({ status: 'error', error: 'empresa requerido' });
        const empresaRow = await fetchEmpresaRow(id);
        if (!empresaRow) return res.status(404).json({ status: 'error', error: `Empresa "${id}" no encontrada` });
        const briefRaw = (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio || '').trim();
        const brief = parseBrief(briefRaw, empresaRow);
        res.json({ status: 'success', data: brief });
    } catch (e) {
        serverLog('ERROR', `[BRIEF_EMPRESA] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// POST /api/brief/generate — genera un Brief completo de 20 campos.
// NO escribe a GAS automáticamente — el cliente muestra preview y el usuario confirma.
router.post('/api/brief/generate', async (req, res) => {
    try {
        const { id_empresa } = req.body || {};
        if (!id_empresa) return res.status(400).json({ status: 'error', error: 'id_empresa es requerido' });

        serverLog('INFO', `[BRIEF_GEN] Iniciando generación para "${id_empresa}"`);

        const empresaRow = await fetchEmpresaRow(id_empresa);
        if (!empresaRow) throw new Error(`Empresa "${id_empresa}" no encontrada en Config_Empresas`);

        const briefRaw = (empresaRow.logo_url || empresaRow.tipo_negocio || empresaRow.tiponegocio || '').trim();
        const existingBrief = parseBrief(briefRaw, empresaRow);

        let taxonomia = { industria: '', nicho: '', especializacion: '' };
        try {
            const giro = empresaRow.giro_especifico || empresaRow.descripcion || '';
            const nombre = empresaRow.nomempresa || '';
            taxonomia = await resolverTaxonomia(giro, nombre);
        } catch (e) {
            serverLog('WARN', `[BRIEF_GEN] Taxonomía fallback: ${e.message}`);
        }

        // Sub-agentes de research en paralelo (B, C, D)
        const nicho = taxonomia.nicho || '';
        const especializacion = taxonomia.especializacion || '';
        const geo = empresaRow.ciudad || empresaRow.estado || 'México';
        const industria = taxonomia.industria || '';
        const producto = existingBrief.producto || '';

        const [avatarResearch, competenciaResearch, legalResearch] = await Promise.all([
            researchAvatar(nicho, especializacion, geo).catch(e => { serverLog('WARN', `[BRIEF_GEN] Avatar research: ${e.message}`); return {}; }),
            researchCompetencia(nicho, especializacion, geo).catch(e => { serverLog('WARN', `[BRIEF_GEN] Competencia research: ${e.message}`); return {}; }),
            researchLegal(industria, producto, '').catch(e => { serverLog('WARN', `[BRIEF_GEN] Legal research: ${e.message}`); return {}; })
        ]);

        const researchData = {
            avatar: avatarResearch,
            competencia: competenciaResearch,
            legal: legalResearch
        };

        const systemPrompt = buildBriefGeneratorPrompt();
        const userContent = buildBriefGeneratorInput(empresaRow, existingBrief, taxonomia, researchData);

        const generated = await callAiJson(systemPrompt, userContent);

        const vector = assembleCompleteBrief(existingBrief, generated, taxonomia, empresaRow, researchData);

        const parsed = parseBrief(vector, empresaRow);
        const totalFields = 20;
        const filledFields = Object.values(parsed).filter(v => v && typeof v === 'string' && !v.includes('[PENDIENTE')).length;

        const confidenceMap = {};
        for (const seg of vector.split('|')) {
            const match = seg.trim().match(/^([^:]+):\s*.*\[([ABC])\]$/i);
            if (match) confidenceMap[match[1].trim().toLowerCase()] = match[2].toUpperCase();
        }

        serverLog('INFO', `[BRIEF_GEN] Brief generado: ${filledFields}/${totalFields} campos para "${id_empresa}"`);

        res.json({
            status: 'success',
            data: {
                id_empresa,
                vector,
                brief: parsed,
                confidence: confidenceMap,
                completitud: { filled: filledFields, total: totalFields },
                existente: existingBrief,
                research: researchData
            }
        });
    } catch (e) {
        serverLog('ERROR', `[BRIEF_GEN] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// POST /api/brief/metadata — guarda brief.json + confianza.json en Drive vía GAS.
router.post('/api/brief/metadata', async (req, res) => {
    try {
        const { id_empresa, vector, confianza } = req.body || {};
        if (!id_empresa || !vector) {
            return res.status(400).json({ status: 'error', error: 'id_empresa y vector requeridos' });
        }
        const { json: gasResult } = await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'saveBriefMetadata', id_empresa, vector, confianza }),
            redirect: 'follow'
        });
        res.json(gasResult);
    } catch (e) {
        serverLog('ERROR', `[BRIEF_META] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// POST /api/brief/write — escribe el vector del Brief a Config_Empresas.logo_url vía GAS.
router.post('/api/brief/write', async (req, res) => {
    try {
        const { id_empresa, vector } = req.body || {};
        if (!id_empresa || !vector) {
            return res.status(400).json({ status: 'error', error: 'id_empresa y vector requeridos' });
        }
        const { json: gasResult } = await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'updateBriefVector', id_empresa, vector }),
            redirect: 'follow'
        });
        res.json(gasResult);
    } catch (e) {
        serverLog('ERROR', `[BRIEF_WRITE] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// POST /api/brief/folders — crea estructura cte<id>/ si no existe (idempotente).
router.post('/api/brief/folders', async (req, res) => {
    try {
        const { id_empresa } = req.body || {};
        if (!id_empresa) return res.status(400).json({ status: 'error', error: 'id_empresa es requerido' });
        const { json: gasResult } = await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ensureCteFolders', id_empresa }),
            redirect: 'follow'
        });
        res.json(gasResult);
    } catch (e) {
        serverLog('ERROR', `[BRIEF_FOLDERS] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// POST /api/brief/assets — genera assets LAPVTFU para una empresa.
router.post('/api/brief/assets', async (req, res) => {
    try {
        const { id_empresa } = req.body || {};
        if (!id_empresa) return res.status(400).json({ status: 'error', error: 'id_empresa es requerido' });

        await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ensureCteFolders', id_empresa }),
            redirect: 'follow'
        });

        const empresaRow = await fetchEmpresaRow(id_empresa);
        if (!empresaRow) throw new Error(`Empresa "${id_empresa}" no encontrada`);

        const existingBrief = parseBrief(empresaRow.logo_url || empresaRow.tipo_negocio || '', empresaRow);
        const activos = existingBrief.activos || {};

        const { json: gasResult } = await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generateAllAssets', id_empresa, activos }),
            redirect: 'follow'
        });

        serverLog('INFO', `[BRIEF_ASSETS] ${gasResult.generated || 0}/${gasResult.total || 0} assets generados para "${id_empresa}"`);

        res.json({
            status: 'success',
            data: {
                id_empresa,
                total: gasResult.total,
                generated: gasResult.generated,
                results: gasResult.results || []
            }
        });
    } catch (e) {
        serverLog('ERROR', `[BRIEF_ASSETS] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// GET /api/brief/assets?id=xxx — URLs de assets LAPVTFU existentes.
router.get('/api/brief/assets', async (req, res) => {
    try {
        const id_empresa = req.query.id;
        if (!id_empresa) return res.status(400).json({ status: 'error', error: 'id requerido' });
        const { json: gasResult } = await fetchGasJson(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getBriefAssets', id_empresa }),
            redirect: 'follow'
        });
        res.json({ status: 'success', data: gasResult });
    } catch (e) {
        serverLog('ERROR', `[BRIEF_ASSETS_GET] ${e.message}`);
        res.status(500).json({ status: 'error', error: e.message });
    }
});

module.exports = router;
module.exports.parseBrief = parseBrief;
module.exports.fetchEmpresaRow = fetchEmpresaRow;
module.exports.BRIEF_FIELD_ORDER = BRIEF_FIELD_ORDER;
