const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const supabase = require('./lib/supabase');
const bdpvGenerator = require('../PresentacionesVid/bdpv-generator');

const PORT = 8000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzlNe28j7yJObxqfCyUg595Zeg1IjsMMjOZyf8KOK5pkCYU-zYFJrsyzwsJhNFjZy1v-A/exec';

// --- LOG BUFFER COMPARTIDO ---
const logBuffer = [];
const MAX_LOGS = 200;
function serverLog(level, ...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const entry = `[${new Date().toLocaleTimeString()}] [${level}] ${msg}`;
    console.log(entry);
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}
function normalizeDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return url;
}

const server = http.createServer((req, res) => {
    serverLog('REQ', `${req.method} ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 🔄 PROXY DE HISTORIAL
    if (pathname.includes('/api/history')) {
        const historyUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=history') : (GAS_URL + '?action=history');
        serverLog('INFO', "📜 [PROXY] Consultando Historial...");
        fetchWithRedirects(historyUrl, (data, statusCode) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // 🔄 PROXY DE CONFIGURACIÓN (Empresas)
    if (pathname.includes('/api/config')) {
        const configUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=config') : (GAS_URL + '?action=config');
        serverLog('INFO', "🏢 [PROXY] Solicitando /api/config a Google...");
        fetchWithRedirects(configUrl, (data, statusCode) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // 🔄 PROXY DE GUARDADO (POST)
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };
            const gasReq = https.request(GAS_URL, options, (gasRes) => {
                res.writeHead(gasRes.statusCode);
                gasRes.pipe(res);
            });
            gasReq.write(body);
            gasReq.end();
        });
        return;
    }

    // ===== SUPABASE ENDPOINTS =====

    // GET /api/industrias — lista industrias con nichos
    if (pathname === '/api/industrias' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('industrias')
                    .select('*, nichos(*)')
                    .eq('activo', true)
                    .order('categoria');

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/industrias — crear industria + nichos
    if (pathname === '/api/industrias' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { categoria, icono, descripcion, nichos } = JSON.parse(body);
                const { data: industria, error: errInd } = await supabase
                    .from('industrias')
                    .insert({ categoria, icono, descripcion })
                    .select()
                    .single();

                if (errInd) throw errInd;

                if (nichos && nichos.length > 0) {
                    const { error: errNichos } = await supabase
                        .from('nichos')
                        .insert(nichos.map(n => ({ ...n, industria_id: industria.id })));

                    if (errNichos) throw errNichos;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: industria }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias POST:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // PUT /api/industrias/:id — editar industria
    const industriasMatch = pathname.match(/^\/api\/industrias\/(\d+)$/);
    if (industriasMatch && req.method === 'PUT') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const id = parseInt(industriasMatch[1]);
                const updates = JSON.parse(body);
                const { data, error } = await supabase
                    .from('industrias')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/industrias PUT:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // GET /api/campanas — lista campañas desde Supabase
    if (pathname === '/api/campanas' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('campanas')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/campanas GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/campanas — guardar campaña en Supabase
    if (pathname === '/api/campanas' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const campana = JSON.parse(body);
                const { data, error } = await supabase
                    .from('campanas')
                    .insert({
                        id: campana.id || `camp_${Date.now()}`,
                        empresa: campana.empresa || '',
                        nombre: campana.nombre || '',
                        tema: campana.tema || '',
                        formato: campana.formato || '',
                        estado: campana.estado || 'pendiente',
                        configuracion: campana.configuracion || {}
                    })
                    .select()
                    .single();

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/campanas POST:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // ===== RECETAS (IMG DE IMAGINACION) =====

    // GET /api/recetas — lista recetas
    if (pathname === '/api/recetas' && req.method === 'GET') {
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('recetas')
                    .select('*')
                    .order('nombre');

                if (error) throw error;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data }));
            } catch (e) {
                serverLog('ERROR', '[SUPABASE] /api/recetas GET:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // POST /api/video-imaginacion — genera video desde carpeta media + receta
    if (pathname === '/api/video-imaginacion' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            const tmpDir = path.join(__dirname, `tmp_imaginacion_${Date.now()}`);
            try {
                const { texto, receta_id, logo_base64, formato, overrides } = JSON.parse(body);

                // Obtener receta
                let recipe;
                if (receta_id) {
                    const { data, error } = await supabase
                        .from('recetas')
                        .select('*')
                        .eq('id', receta_id)
                        .single();
                    if (error) throw new Error('Receta no encontrada: ' + error.message);
                    recipe = data;
                } else {
                    throw new Error('Se requiere receta_id');
                }
                if (overrides) Object.assign(recipe, overrides);

                const mediaFolder = process.env.MEDIA_FOLDER;
                if (!mediaFolder) throw new Error('MEDIA_FOLDER no configurado en .env');
                if (!fs.existsSync(mediaFolder)) throw new Error(`La carpeta ${mediaFolder} no existe`);

                // Escanear archivos
                let files = fs.readdirSync(mediaFolder)
                    .filter(f => /\.(jpg|jpeg|png|mp4|mpg|mpeg)$/i.test(f))
                    .map(f => path.join(mediaFolder, f));

                if (files.length === 0) throw new Error('No hay archivos compatibles en MEDIA_FOLDER');

                // Ordenar
                if (recipe.orden === 'aleatorio') {
                    for (let i = files.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [files[i], files[j]] = [files[j], files[i]];
                    }
                }

                // Filtrar solo imagenes para v1
                const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
                if (imageFiles.length === 0) throw new Error('No hay imágenes (jpg/png) en MEDIA_FOLDER');

                const selectedFiles = imageFiles.slice(0, 50);

                // Calcular tiempo por slide
                const totalDur = parseInt(recipe.duracion_total) || 30;
                let timePerSlide;
                if (recipe.ritmo === 'musica') {
                    timePerSlide = totalDur / selectedFiles.length;
                } else {
                    const ritmoSec = parseFloat(recipe.ritmo) || 1;
                    const totalWithRitmo = selectedFiles.length * ritmoSec;
                    timePerSlide = totalWithRitmo > totalDur ? totalDur / selectedFiles.length : ritmoSec;
                }
                timePerSlide = Math.max(timePerSlide, 0.5);

                fs.mkdirSync(tmpDir, { recursive: true });

                // Dimensiones segun formato
                const DIMS = {
                    Post: { w: 1080, h: 1080 },
                    Reel: { w: 1080, h: 1920 },
                    Story: { w: 1080, h: 1920 },
                    Banner: { w: 1200, h: 628 }
                };
                const dim = DIMS[formato] || DIMS.Reel;
                const W = dim.w;
                const H = dim.h;

                // Logo temp
                let logoPath = null;
                if (logo_base64) {
                    logoPath = path.join(tmpDir, 'logo.png');
                    const b64 = logo_base64.replace(/^data:image\/\w+;base64,/, '');
                    fs.writeFileSync(logoPath, b64, 'base64');
                }

                // Filtro de color
                const colorFilter = {
                    'blanco_y_negro': 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3',
                    'colores_vivos': 'eq=saturation=2.0',
                    'vintage': "curves=all='0/0 0.25/0.15 0.5/0.5 0.75/0.85 1/1',hue=s=0.5"
                }[recipe.filtro] || null;

                const { execSync } = require('child_process');
                const fps = 24;

                // Write text to file for drawtext (avoids escaping issues)
                let textFilePath = null;
                if (texto) {
                    textFilePath = path.join(tmpDir, 'overlay_text.txt').replace(/\\/g, '/');
                    fs.writeFileSync(textFilePath, texto, 'utf8');
                }

                // Generar segmentos individuales
                const segments = [];
                for (let i = 0; i < selectedFiles.length; i++) {
                    const segPath = path.join(tmpDir, `seg_${i}.mp4`).replace(/\\/g, '/');

                    let filters = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,fps=${fps}`;
                    if (colorFilter) filters += `,${colorFilter}`;
                    if (textFilePath) {
                        filters += `,drawtext=textfile=${textFilePath}:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-th-100:enable=between(t,0,${timePerSlide})`;
                    }
                    filters += '[v0]';

                    const imgPath = selectedFiles[i].replace(/\\/g, '/');
                    let cmd;
                    if (logoPath) {
                        const logoPathFwd = logoPath.replace(/\\/g, '/');
                        const overlayFilter = `[v0][1:v]overlay=10:10:enable=between(t,0,${timePerSlide})[out]`;
                        cmd = `ffmpeg -y -loop 1 -t ${timePerSlide + 0.5} -i "${imgPath}" -i "${logoPathFwd}" -filter_complex "${filters};${overlayFilter}" -map "[out]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${segPath}"`;
                    } else {
                        cmd = `ffmpeg -y -loop 1 -t ${timePerSlide + 0.5} -i "${imgPath}" -filter_complex "${filters}" -map "[v0]" -c:v libx264 -pix_fmt yuv420p -preset ultrafast -crf 23 "${segPath}"`;
                    }

                    serverLog('INFO', `[IMAGINACION] Segmento ${i+1}/${selectedFiles.length}...`);
                    execSync(cmd, { timeout: 60000, shell: true, stdio: 'pipe' });
                    segments.push(segPath);
                }

                // Concatenar con o sin transiciones
                const outPath = path.join(__dirname, `imaginacion_${Date.now()}.mp4`);
                let concatCmd;

                if (segments.length === 1) {
                    // Solo un segmento, copiar directamente
                    concatCmd = `ffmpeg -y -i "${segments[0].replace(/\\/g, '/')}" -c copy "${outPath}"`;
                } else if (recipe.transicion === 'corte_brusco') {
                    const listPath = path.join(tmpDir, 'files.txt').replace(/\\/g, '/');
                    const listContent = segments.map(s => `file '${s.replace(/'/g, "'\\''")}'`).join('\n');
                    fs.writeFileSync(listPath, listContent);
                    concatCmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outPath}"`;
                } else {
                    const xfadeMap = { fundido: 'fade', barrido_derecha: 'slideright', zoom: 'zoomin' };
                    const xfadeType = xfadeMap[recipe.transicion] || 'fade';
                    const transDur = 0.5;
                    const n = segments.length;

                    let filterComplex;
                    if (n === 1) {
                        filterComplex = `nullsrc=s=${W}x${H},trim=duration=${timePerSlide}[vout]`;
                    } else if (n === 2) {
                        const offset = timePerSlide;
                        filterComplex = `[0:v][1:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vout]`;
                    } else {
                        let parts = [];
                        for (let i = 1; i < n; i++) {
                            const offset = timePerSlide * i;
                            if (i === 1) {
                                parts.push(`[0:v][1:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vx1]`);
                            } else {
                                parts.push(`[vx${i-1}][${i}:v]xfade=transition=${xfadeType}:duration=${transDur}:offset=${offset}[vx${i}]`);
                            }
                        }
                        filterComplex = parts.join(';');
                    }

                    const lastLabel = n <= 2 ? '[vout]' : `[vx${n-1}]`;
                    const inputs = segments.map(s => `-i "${s}"`).join(' ');

                    concatCmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map ${lastLabel} -pix_fmt yuv420p -c:v libx264 -preset ultrafast "${outPath}"`;
                }

                serverLog('INFO', `[IMAGINACION] Concatenando ${segments.length} segmentos...`);
                execSync(concatCmd, { timeout: 120000, shell: true, stdio: 'pipe' });

                const videoBase64 = fs.readFileSync(outPath).toString('base64');

                // Limpiar
                fs.rmSync(tmpDir, { recursive: true, force: true });
                if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', video: `data:video/mp4;base64,${videoBase64}` }));

            } catch (e) {
                serverLog('ERROR', `[IMAGINACION] ${e.message}`);
                if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // ===== AGENTE DE TENDENCIAS =====
    if (pathname === '/api/agent/tendencias' && req.method === 'POST') {
        (async () => {
            try {
                const agent = require('./scripts/agent-tendencias');
                const resultados = await agent.ejecutarAgente(serverLog);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: resultados }));
            } catch (e) {
                serverLog('ERROR', `[AGENT] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        })();
        return;
    }

    // ===== TRENDS BDSMT =====

    // POST /api/trends/fetch — busca tendencias reales (pytrends + Reddit)
    if (pathname === '/api/trends/fetch' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { niche, subNiche, region } = JSON.parse(body);
                const trendResearch = require('./scripts/trend-research');
                const result = await trendResearch.fetchTrends(niche || '', subNiche || '', region || '');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: result }));
            } catch (e) {
                serverLog('ERROR', `[TRENDS] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // POST /api/trends/generate — genera campaña basada en un trend seleccionado
    if (pathname === '/api/trends/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { trend, niche, subNiche, region, slides, template, platform, format, conciencia, empresa, phone } = JSON.parse(body);

                const systemPrompt = `# PERSONA
Actúa como un Copywriter Maestro en Conversión y Especialista en Branding dinámico.

# CONTEXTO Y MERCADO
- Empresa: ${empresa || 'Tu Marca'}.
- Nicho: ${niche}${subNiche ? `, Sub-nicho: ${subNiche}` : ''}.
- Región: ${region || 'México'}.
- Tendencia detectada: "${trend.titulo}" — ${trend.descripcion} (Fuente: ${trend.fuente}).
- Formato de Estrategia: ${template || 'storytelling'}.
- Nivel de Conciencia del Cliente: ${conciencia || 'Consciente_Solucion'}.

# INSTRUCCIONES
- Usa la tendencia real detectada como base para el contenido.
- Adapta el gancho al contexto regional de ${region || 'México'}.
- Incluye datos locales y references de ${region || 'México'} cuando sea relevante.

# PASOS (CHAIN OF THOUGHT)
1. Define el ángulo narrativo según la tendencia y el nivel de conciencia.
2. Redacta un post caption persuasivo con hashtags relevantes al nicho y la región.
3. Estructura exactamente ${slides || 5} slides: (1. Gancho, 2. Contexto del Trend, 3. Valor/Problema, 4. Solución, 5. Cierre/CTA).

# RESTRICCIONES (RAILS)
- Idioma: Español de México/Latinoamérica.
- MÁXIMO 30 palabras por slide en el Cuerpo.
- **OBLIGATORIO**: Incluir el número de slide entre paréntesis al INICIO de cada título.
- El contenido DEBE estar basado en la tendencia: "${trend.titulo}"

# REGLAS VISUALES
- **PROHIBIDO**: Frases como "a happy person", "looking at camera", "isolated on white".
- **OBLIGATORIO**: Describe ángulos dramáticos, detalles técnicos o escenas de acción real.
- **IDIOMA**: Prompt del campo "visual" en INGLÉS técnico de fotografía.

# PLANTILLA DE SALIDA (JSON)
{
  "caption": "Texto del post con hashtags...",
  "slides": [
    { "title": "(1) Título", "body": "Cuerpo del slide...", "visual": "Professional photo of..." }
  ]
}

# NOTAS IMPORTANTES
- Genera exactamente ${slides || 5} slides.
- El contenido DEBE ser relevante a ${niche} en ${region || 'México'}.`;

                const userPrompt = `Generar campaña de ${slides || 5} slides para ${platform || 'Instagram'} en formato ${format || 'Post'}. Tendencia: "${trend.titulo}". CTA final: ${phone || 'Interacción en redes'}. ¡Responde estrictamente con JSON!`;

                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];

                const orModels = [
                    "openrouter/free",
                    "qwen/qwen3.6-35b-a3b:free",
                    "minimax/minimax-m2.5:free",
                    "google/gemini-flash-1.5",
                    "deepseek/deepseek-v4-flash"
                ];

                let lastError = "No se recibieron errores.";
                let generatedJson = null;
                for (const m of orModels) {
                    try {
                        serverLog('INFO', `🤖 [BDSMT_TRY] Intentando con ${m}...`);
                        const result = await callOpenRouter(m, messages, 0.7);
                        serverLog('INFO', `✅ [BDSMT_SUCCESS] ${m} respondió correctamente.`);
                        const rawContent = result.trim();
                        const jsonStr = rawContent.startsWith('```') ? rawContent.replace(/```json|```/g, '') : rawContent;
                        generatedJson = JSON.parse(jsonStr);
                        break;
                    } catch (err) {
                        lastError = err.message;
                        serverLog('WARN', `⚠️ [BDSMT_FAIL] ${m}: ${err.message}`);
                        if (err.message.includes('ECONNRESET')) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }

                if (!generatedJson) {
                    throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', data: generatedJson }));
            } catch (e) {
                serverLog('ERROR', `[TRENDS GEN] ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: e.message }));
            }
        });
        return;
    }

    // ===== FIN SUPABASE ENDPOINTS =====

    if (req.method === 'POST' && pathname.includes('/api/ai')) {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { messages, temperature } = JSON.parse(body);
                
                if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
                    throw new Error("La OPENROUTER_API_KEY parece estar vacía o incompleta en el archivo .env");
                }

                // 📡 LISTA DE MODELOS (Priorizando Gratuitos y Estables)
                const orModels = [
                    "openrouter/free",
                    "qwen/qwen3.6-35b-a3b:free",
                    "minimax/minimax-m2.5:free",
                    "google/gemini-flash-1.5",
                    "deepseek/deepseek-v4-flash"
                ];

                let lastError = "No se recibieron errores.";
                for (const m of orModels) {
                    try {
                        serverLog('INFO', `🤖 [AI_TRY] Intentando con ${m}...`);
                        const result = await callOpenRouter(m, messages, temperature || 0.7);
                        serverLog('INFO', `✅ [AI_SUCCESS] ${m} respondió correctamente.`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                    } catch (err) {
                        lastError = err.message;
                        serverLog('WARN', `⚠️ [AI_FAIL] ${m}: ${err.message}`);
                        // Si es un error de conexión pura, esperamos un poco antes de reintentar
                        if (err.message.includes('ECONNRESET')) {
                            serverLog('INFO', "⏳ Reintentando en 1 segundo por reset de red...");
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }

                // 🏠 [FALLBACK LOCAL] Si todo lo anterior falla, intentamos usar IA Local (LM Studio)
                try {
                    serverLog('INFO', `🏠 [AI_LOCAL] Intentando conexión con IA Local (LM Studio en puerto 1234)...`);
                    const result = await callLocalLMS(messages[messages.length-1].content);
                    serverLog('INFO', `✅ [AI_SUCCESS] La IA Local respondió con éxito.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                } catch (localErr) {
                    serverLog('WARN', `❌ [AI_LOCAL_FAIL]: ${localErr.message}`);
                }

                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Fallo total de red. Revisa tu Firewall o Antivirus. Detalle: ${lastError}` }));

            } catch (e) {
                serverLog('ERROR', "❌ Error en Proxy AI:", e);
                res.writeHead(400); res.end('Invalid JSON');
            }
        });
        return;
    }

    // --- NUEVO ENDPOINT: GOOGLE IMAGEN 3 (PREMIUM) ---
    if (pathname === '/api/ai/image' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { prompt } = JSON.parse(body);
                const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

                if (!GEMINI_API_KEY) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Falta GEMINI_API_KEY en .env" }));
                }

                serverLog('INFO', `🎨 [GOOGLE_IMAGEN] Generando: "${prompt.substring(0, 50)}..."`);
                
                // Endpoint oficial de Imagen 3 (v1beta)
                const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: prompt }],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: "3:4",
                            outputMimeType: "image/png"
                        }
                    })
                });

                const data = await response.json();
                
                if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
                    const base64 = data.predictions[0].bytesBase64Encoded;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: "success", image: `data:image/png;base64,${base64}` }));
                } else {
                    serverLog('WARN', "⚠️ Imagen 3 no disponible. Fallback al vector secundario. Error:", JSON.stringify(data));
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "Modelo Imagen 3 no habilitado en esta llave." }));
                }

            } catch (error) {
                serverLog('ERROR', "❌ Error en Google Imagen Server:", error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // ===== BDPV ENDPOINTS =====

    // POST /api/bdpv/generate — Genera presentación HTML
    if (pathname === '/api/bdpv/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                serverLog('INFO', `🎞️ [BDPV] Generando presentación para: ${data.company}`);

                // Wrapper to call OpenRouter with the same pattern as /api/ai
                const callAI = async (messages, temperature) => {
                    const orModels = [
                        "openrouter/free",
                        "qwen/qwen3.6-35b-a3b:free",
                        "minimax/minimax-m2.5:free",
                        "google/gemini-flash-1.5",
                        "deepseek/deepseek-v4-flash"
                    ];
                    let lastError = '';
                    for (const m of orModels) {
                        try {
                            const result = await callOpenRouter(m, messages, temperature || 0.7);
                            return result;
                        } catch (err) {
                            lastError = err.message;
                            serverLog('WARN', `⚠️ [BDPV_AI] ${m}: ${err.message}`);
                        }
                    }
                    // Try local fallback
                    try {
                        const msg = messages[messages.length - 1].content;
                        return await callLocalLMS(msg);
                    } catch (localErr) {
                        throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
                    }
                };

                const result = await bdpvGenerator.generatePresentation(data, callAI);

                if (result.success) {
                    // Auto-open the file
                    await bdpvGenerator.openPresentation(result.filePath);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'success',
                        filename: result.filename,
                        filePath: result.filePath
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', error: result.error }));
                }
            } catch (e) {
                serverLog('ERROR', `❌ [BDPV] Error: ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // POST /api/bdpv/open — Abre archivo generado
    if (pathname === '/api/bdpv/open' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { filePath } = JSON.parse(body);
                await bdpvGenerator.openPresentation(filePath);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', error: e.message }));
            }
        });
        return;
    }

    // 🎬 ANIMATE PHOTO ENDPOINT (FFmpeg)
    if (pathname === '/api/animate' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { image, effect, duration } = JSON.parse(body);
                serverLog('INFO', `[ANIMATE] Recibido: effect=${effect}, duration=${duration}, imageLength=${image?.length} chars`);
                if (!image) { serverLog('ERROR', "[ANIMATE] ❌ No image"); res.writeHead(400); res.end(JSON.stringify({ error: "Falta 'image' (base64)" })); return; }

                const imgPath = path.join(__dirname, `temp_img_${Date.now()}.png`);
                const outPath = path.join(__dirname, `temp_vid_${Date.now()}.mp4`);
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const imgSize = Buffer.byteLength(base64Data, 'base64');
                serverLog('INFO', `[ANIMATE] Imagen decodificada: ${(imgSize/1024).toFixed(1)} KB -> ${imgPath}`);
                fs.writeFileSync(imgPath, base64Data, 'base64');
                serverLog('INFO', `[ANIMATE] ✅ Imagen guardada en disco`);

                const dur = duration || 5;
                const fps = 24;
                const frames = dur * fps;

                let filter;
                switch (effect || 'zoom') {
                    case 'blink':
                        filter = `fade=t=in:st=0:d=0.3,fade=t=out:st=${dur-0.3}:d=0.3`;
                        break;
                    case 'color_shift':
                        filter = `hue=H=50*sin(2*PI*t/${dur}):s=1`;
                        break;
                    case 'ken_burns':
                        filter = `zoompan=z='if(lte(zoom,1.0),1.0,zoom-0.008)':d=${frames}:s=1920x1080:fps=${fps}`;
                        break;
                    case 'zoom':
                    default:
                        filter = `zoompan=z='min(zoom+0.015,1.5)':d=${frames}:s=1920x1080:fps=${fps}`;
                        break;
                }
                serverLog('INFO', `[ANIMATE] Filter: ${filter}`);

                const { execSync } = require('child_process');
                const cmd = `ffmpeg -y -loop 1 -i "${imgPath}" -vf "${filter}" -c:v libx264 -t ${dur} -pix_fmt yuv420p "${outPath}"`;
                serverLog('INFO', `[ANIMATE] Ejecutando: ffmpeg ... (timeout 30s)`);
                const output = execSync(cmd, { timeout: 30000, shell: true, stdio: 'ignore' });
                serverLog('INFO', `[ANIMATE] ✅ FFmpeg OK. Video generado: ${outPath}`);

                const videoBase64 = fs.readFileSync(outPath).toString('base64');
                serverLog('INFO', `[ANIMATE] Video en base64: ${(videoBase64.length/1024).toFixed(1)} KB`);

                fs.unlinkSync(imgPath);
                fs.unlinkSync(outPath);
                serverLog('INFO', `[ANIMATE] ✅ Temporales eliminados. Enviando respuesta...`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "success", video: `data:video/mp4;base64,${videoBase64}`, effect, duration: dur }));
            } catch (e) {
                serverLog('ERROR', `[ANIMATE] ❌ Error: ${e.message}`);
                if (e.message?.includes('ffmpeg')) serverLog('ERROR', "[ANIMATE] ⚠️ ¿FFmpeg está instalado? Verificá con: ffmpeg -version");
                if (e.message?.includes('ETIMEDOUT') || e.message?.includes('timeout')) serverLog('ERROR', "[ANIMATE] ⏳ Timeout: la imagen es muy grande o el efecto es muy pesado");
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // 🎞️ SLIDESHOW ENDPOINT (múltiples slides con transiciones)
    if (pathname === '/api/slideshow' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', async () => {
            try {
                const { images, effect, duration, transition } = JSON.parse(body);
                if (!images || !Array.isArray(images) || images.length < 2) {
                    res.writeHead(400); res.end(JSON.stringify({ error: "Se necesitan al menos 2 imágenes" })); return;
                }
                serverLog('INFO', `[SLIDESHOW] ${images.length} imágenes, effect=${effect}, dur=${duration}s`);

                const dur = duration || 5;
                const fps = 24;
                const frames = dur * fps;
                const transDur = 1; // 1s crossfade
                const { execSync } = require('child_process');

                // Guardar imágenes temporales
                const tmpDir = path.join(__dirname, `tmp_slideshow_${Date.now()}`);
                fs.mkdirSync(tmpDir, { recursive: true });
                const imgPaths = images.map((img, i) => {
                    const p = path.join(tmpDir, `slide_${i}.png`);
                    const b64 = img.replace(/^data:image\/\w+;base64,/, '');
                    fs.writeFileSync(p, b64, 'base64');
                    return p;
                });

                // Construir filter complex
                const effFilter = (effect === 'blink') ? `fade=t=in:st=0:d=0.3,fade=t=out:st=${dur-0.3}:d=0.3` :
                    (effect === 'color_shift') ? `hue=H=50*sin(2*PI*t/${dur}):s=1` :
                    (effect === 'ken_burns') ? `zoompan=z='if(lte(zoom,1.0),1.0,zoom-0.008)':d=${frames}:s=1920x1080:fps=${fps}` :
                    `zoompan=z='min(zoom+0.015,1.5)':d=${frames}:s=1920x1080:fps=${fps}`;

                let filterParts = [];
                imgPaths.forEach((_, i) => {
                    filterParts.push(`[${i}:v]${effFilter}[v${i}]`);
                });

                // Conectar con xfade
                let chain = '';
                imgPaths.forEach((_, i) => {
                    if (i === 0) chain = `[v${i}]`;
                    else {
                        const offset = (dur * i) - transDur;
                        if (i === 1) chain = `[v0][v1]xfade=transition=fade:duration=${transDur}:offset=${offset}[v${i}c]`;
                        else chain = `[v${i-1}c][v${i}]xfade=transition=fade:duration=${transDur}:offset=${offset}[v${i}c]`;
                    }
                });
                const lastLabel = images.length === 2 ? '[v1c]' : `[v${images.length-1}c]`;
                const fullFilter = `${filterParts.join(';')};${chain}`;

                const inputs = imgPaths.map(p => `-loop 1 -t ${dur + 1} -i "${p}"`).join(' ');
                const outPath = path.join(__dirname, `slideshow_${Date.now()}.mp4`);
                const cmd = `ffmpeg -y ${inputs} -filter_complex "${fullFilter}" -map ${lastLabel} -pix_fmt yuv420p -c:v libx264 "${outPath}"`;

                serverLog('INFO', `[SLIDESHOW] Ejecutando FFmpeg (${images.length} slides)...`);
                execSync(cmd, { timeout: Math.max(30000, images.length * 15000), shell: true, stdio: 'ignore' });
                serverLog('INFO', `[SLIDESHOW] ✅ Video generado: ${outPath}`);

                const videoBase64 = fs.readFileSync(outPath).toString('base64');
                fs.rmSync(tmpDir, { recursive: true, force: true });
                fs.unlinkSync(outPath);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: "success", video: `data:video/mp4;base64,${videoBase64}`, slides: images.length }));
            } catch (e) {
                serverLog('ERROR', `[SLIDESHOW] ❌ ${e.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // 🖼️ PROXY-IMAGE: fetch imagen externa y la devuelve como base64 (sigue redirects)
    if (pathname === '/api/proxy-image' && req.method === 'GET') {
        const url = parsedUrl.searchParams.get('url');
        if (!url) { res.writeHead(400); res.end(JSON.stringify({ error: 'Falta url' })); return; }

        function fetchFollowingRedirects(targetUrl, redirectCount, cb) {
            if (redirectCount > 10) return cb(new Error('Demasiados redirects'));
            const lib = targetUrl.startsWith('https') ? https : http;
            lib.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (imgRes) => {
                // Seguir redirects 301/302/307/308
                if ([301, 302, 307, 308].includes(imgRes.statusCode) && imgRes.headers.location) {
                    let nextUrl = imgRes.headers.location;
                    if (!nextUrl.startsWith('http')) {
                        const base = new URL(targetUrl);
                        nextUrl = new URL(nextUrl, base.origin).href;
                    }
                    serverLog('INFO', `[PROXY-IMG] Redirect ${imgRes.statusCode} → ${nextUrl.substring(0, 80)}`);
                    imgRes.resume(); // descartar cuerpo del redirect
                    return fetchFollowingRedirects(nextUrl, redirectCount + 1, cb);
                }
                const chunks = [];
                imgRes.on('data', c => chunks.push(c));
                imgRes.on('end', () => cb(null, Buffer.concat(chunks), imgRes.headers['content-type']));
            }).on('error', cb);
        }

        fetchFollowingRedirects(url, 0, (err, buf, contentType) => {
            if (err) {
                serverLog('WARN', `[PROXY-IMG] Error: ${err.message}`);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ status: 'error', error: err.message }));
            }
            const mime = contentType && contentType.startsWith('image/')
                ? contentType.split(';')[0].trim()
                : (url.includes('.png') ? 'image/png' : url.includes('.webp') ? 'image/webp' : 'image/jpeg');
            const b64 = buf.toString('base64');
            serverLog('INFO', `[PROXY-IMG] ✅ Entregado: ${mime}, ${(buf.length / 1024).toFixed(1)} KB`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', image: `data:${mime};base64,${b64}` }));
        });
        return;
    }


    // 📋 LOGS ENDPOINT
    if (pathname === '/api/logs') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        res.end(JSON.stringify(logBuffer.slice(-100)));
        return;
    }

    // Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not Found'); }
        else { res.writeHead(200); res.end(content); }
    });
});

async function callOpenRouter(model, messages, temperature = 0.7) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:8000',
                'X-Title': 'CampanasAi Content Manager',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.error ? (data.error.message || data.error) : `Error HTTP ${response.status}`;
            throw new Error(msg);
        }

        if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Respuesta de IA vacía o malformada");
        }
    } catch (error) {
        throw error;
    }
}

async function callLocalLMS(prompt) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: "qwen/qwen2.5-vl-7b",
            messages: [{ role: "user", content: prompt }]
        });

        const options = {
            hostname: '127.0.0.1',
            port: 1234,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else {
                        reject(new Error("Respuesta local incompleta"));
                    }
                } catch (e) { reject(new Error("Error parsing Local LMS JSON")); }
            });
        });
        req.on('error', e => reject(e));
        req.write(postData);
        req.end();
    });
}

function fetchWithRedirects(url, callback) {
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    https.get(url, options, (res) => {
        // Manejar Redirecciones (301, 302, 307, 308)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            // Si la URL es relativa, unirla
            if (!nextUrl.startsWith('http')) {
                const origin = new URL(url).origin;
                nextUrl = new URL(nextUrl, origin).href;
            }
            serverLog('INFO', `↪️ Redireccionando a: ${nextUrl}`);
            return fetchWithRedirects(nextUrl, callback);
        }

        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            // Verificar si la respuesta parece HTML o texto plano en lugar de JSON
            const trimmed = data.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || !trimmed.startsWith('{')) {
                serverLog('WARN', "⚠️ [PROXY] Respuesta no válida (posible error de Google o Redirección):");
                serverLog('INFO', trimmed.substring(0, 500));
                
                const errorObj = { 
                    status: 'error', 
                    message: trimmed.includes('Not Found') ? 'URL de Google no válida o no publicada' : 'Respuesta errónea de Google',
                    raw: trimmed.substring(0, 100)
                };
                callback(JSON.stringify(errorObj), 200);
            } else {
                callback(data, res.statusCode);
            }
        });
    }).on('error', (e) => {
        serverLog('ERROR', "❌ [PROXY_ERROR]:", e.message);
        callback(JSON.stringify({ status: 'error', message: e.message }), 500);
    });
}



server.listen(PORT, () => {
    serverLog('INFO', `🚀 RELIABLE SERVER V3: CAMPANASAI (Puerto ${PORT}) - Multi-Model OpenRouter`);
});
