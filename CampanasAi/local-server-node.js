const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
                    "google/gemini-2.0-flash-exp:free",
                    "google/gemma-4-31b:free",
                    "meta-llama/llama-3.1-8b-instruct:free",
                    "huggingfaceh4/zephyr-7b-beta:free",
                    "google/gemini-flash-1.5",
                    "anthropic/claude-3-haiku"
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
