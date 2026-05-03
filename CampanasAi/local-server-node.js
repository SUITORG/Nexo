const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const PORT = 8000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzlNe28j7yJObxqfCyUg595Zeg1IjsMMjOZyf8KOK5pkCYU-zYFJrsyzwsJhNFjZy1v-A/exec';

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 🔄 PROXY DE HISTORIAL
    if (pathname.includes('/api/history')) {
        const historyUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=history') : (GAS_URL + '?action=history');
        console.log("📜 [PROXY] Consultando Historial...");
        fetchWithRedirects(historyUrl, (data, statusCode) => {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // 🔄 PROXY DE CONFIGURACIÓN (Empresas)
    if (pathname.includes('/api/config')) {
        const configUrl = GAS_URL.includes('?') ? (GAS_URL + '&action=config') : (GAS_URL + '?action=config');
        console.log("🏢 [PROXY] Solicitando /api/config a Google...");
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
                    "meta-llama/llama-3.1-8b-instruct:free",
                    "huggingfaceh4/zephyr-7b-beta:free",
                    "google/gemini-flash-1.5",
                    "anthropic/claude-3-haiku"
                ];

                let lastError = "No se recibieron errores.";
                for (const m of orModels) {
                    try {
                        console.log(`🤖 [AI_TRY] Intentando con ${m}...`);
                        const result = await callOpenRouter(m, messages, temperature || 0.7);
                        console.log(`✅ [AI_SUCCESS] ${m} respondió correctamente.`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                    } catch (err) {
                        lastError = err.message;
                        console.warn(`⚠️ [AI_FAIL] ${m}: ${err.message}`);
                        // Si es un error de conexión pura, esperamos un poco antes de reintentar
                        if (err.message.includes('ECONNRESET')) {
                            console.log("⏳ Reintentando en 1 segundo por reset de red...");
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                }

                // 🏠 [FALLBACK LOCAL] Si todo lo anterior falla, intentamos usar IA Local (LM Studio)
                try {
                    console.log(`🏠 [AI_LOCAL] Intentando conexión con IA Local (LM Studio en puerto 1234)...`);
                    const result = await callLocalLMS(messages[messages.length-1].content);
                    console.log(`✅ [AI_SUCCESS] La IA Local respondió con éxito.`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ choices: [{ message: { content: result } }] }));
                } catch (localErr) {
                    console.warn(`❌ [AI_LOCAL_FAIL]: ${localErr.message}`);
                }

                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Fallo total de red. Revisa tu Firewall o Antivirus. Detalle: ${lastError}` }));

            } catch (e) {
                console.error("❌ Error en Proxy AI:", e);
                res.writeHead(400); res.end('Invalid JSON');
            }
        });
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
            console.log(`↪️ Redireccionando a: ${nextUrl}`);
            return fetchWithRedirects(nextUrl, callback);
        }

        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            // Verificar si la respuesta parece HTML o texto plano en lugar de JSON
            const trimmed = data.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || !trimmed.startsWith('{')) {
                console.warn("⚠️ [PROXY] Respuesta no válida (posible error de Google o Redirección):");
                console.log(trimmed.substring(0, 500));
                
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
        console.error("❌ [PROXY_ERROR]:", e.message);
        callback(JSON.stringify({ status: 'error', message: e.message }), 500);
    });
}

// --- NUEVO ENDPOINT: GOOGLE IMAGEN 3 (PREMIUM) ---
app.post('/api/ai/image', async (req, res) => {
    const { prompt } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "Falta GEMINI_API_KEY en .env" });
    }

    try {
        console.log(`🎨 [GOOGLE_IMAGEN] Generando: "${prompt.substring(0, 50)}..."`);
        
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
            return res.json({ status: "success", image: `data:image/png;base64,${base64}` });
        } else {
            console.warn("⚠️ Imagen 3 no disponible. Fallback al vector secundario. Error:", JSON.stringify(data));
            return res.status(404).json({ error: "Modelo Imagen 3 no habilitado en esta llave." });
        }

    } catch (error) {
        console.error("❌ Error en Google Imagen Server:", error.message);
        res.status(500).json({ error: error.message });
    }
});

server.listen(PORT, () => {
    console.log(`🚀 RELIABLE SERVER V3: CAMPANASAI (Puerto ${PORT}) - Multi-Model OpenRouter`);
});
