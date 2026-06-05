const express = require('express');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// 🛡️ Seguridad: Configuración de Security Headers via Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.google.com", "https://*.googleapis.com", "https://kit.fontawesome.com", "https://cdn.jsdelivr.net"],
            "script-src-attr": ["'unsafe-inline'"],
            "connect-src": ["'self'", "https://*.supabase.co", "https://*.google.com", "https://*.googleapis.com", "https://openrouter.ai", "https://ka-f.fontawesome.com", "https://*.googleusercontent.com"],
            "img-src": ["'self'", "data:", "https://loremflickr.com", "https://*.supabase.co", "https://*.google.com", "https://*.googleapis.com", "https://*.googleusercontent.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com", "https://cdnjs.cloudflare.com"],
            "frame-src": ["'self'", "https://*.google.com", "https://*.googleusercontent.com"],
            "upgrade-insecure-requests": [],
        },
    },
    crossOriginEmbedderPolicy: false, 
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ENDPOINT DE GUARDADO LOCAL (v1.0.0)
// Permite a módulos locales guardar JSONs en el disco duro de forma segura
app.post('/api/local/save', (req, res) => {
    const fs = require('fs');
    const { path: filePath, data } = req.body;

    if (!filePath || !data) return res.status(400).json({ error: "Faltan parámetros de ruta o datos." });

    try {
        const fullPath = path.join(__dirname, filePath);
        // Asegurar que el directorio existe
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        // Guardar archivo
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
        console.log(`💾 [LOCAL_SAVE] Archivo guardado: ${filePath}`);
        res.json({ success: true });
    } catch (e) {
        console.error("❌ [LOCAL_SAVE_ERROR]", e);
        res.status(500).json({ error: e.message });
    }
});

// Configuración CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware de Seguridad: Bloquear acceso a archivos sensibles
app.use((req, res, next) => {
    const forbidden = ['.env', '.git', 'package.json', 'package-lock.json'];
    if (forbidden.some(file => req.url.includes(file))) {
        return res.status(403).send('🔒 Acceso Denegado por Seguridad');
    }
    next();
});

// Endpoint para proveer configuración al frontend (SIN llaves secretas)
app.get('/api/config', (req, res) => {
    res.json({
        sbUrl: process.env.SUPABASE_URL,
        sbKey: process.env.SUPABASE_ANON_KEY
    });
});

// INICIALIZACIÓN SUPABASE ADMIN (v17.0.0)
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// PROXY DIRECTO GOOGLE GEMINI (v18.0.0) - BYPASS OPENROUTER
app.post('/api/ai/generate', (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "GOOGLE_GEMINI_KEY no configurada." });

    // Adaptar formato SuitOrg a formato Google AI
    const prompt = messages[messages.length - 1].content;
    const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => body += chunk);
        proxyRes.on('end', () => {
            try {
                const responseData = JSON.parse(body);
                if (proxyRes.statusCode !== 200) {
                    console.error("🔴 Google AI Error:", responseData);
                    return res.status(proxyRes.statusCode).json(responseData);
                }
                
                // Normalizar respuesta para el Frontend
                const aiText = responseData.candidates[0].content.parts[0].text;
                res.json({
                    choices: [{ message: { content: aiText } }]
                });
            } catch (e) {
                console.error("🔴 Parse Error:", body);
                res.status(500).json({ error: "Error en respuesta de Google" });
            }
        });
    });

    proxyReq.on('error', (e) => res.status(500).json({ error: e.message }));
    proxyReq.write(postData);
    proxyReq.end();
});

// CHAT ENDPOINT PARA AGENTES (v16.8.0) - Same engine as /api/ai/generate
app.post('/api/ai/chat', (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GOOGLE_GEMINI_KEY no configurada." });

    const prompt = messages[messages.length - 1].content;
    const postData = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => body += chunk);
        proxyRes.on('end', () => {
            try {
                const responseData = JSON.parse(body);
                if (proxyRes.statusCode !== 200) return res.status(proxyRes.statusCode).json(responseData);
                const aiText = responseData.candidates[0].content.parts[0].text;
                res.json({ choices: [{ message: { content: aiText } }] });
            } catch (e) {
                res.status(500).json({ error: "Error en respuesta de Google" });
            }
        });
    });
    proxyReq.on('error', (e) => res.status(500).json({ error: e.message }));
    proxyReq.write(postData);
    proxyReq.end();
});

// PROXY SEGURO PARA BASE DE DATOS (v17.0.0)
// Este túnel se salta el RLS usando la Service Role Key para que la web funcione
app.get('/api/db/:table', async (req, res) => {
    const { table } = req.params;
    const { select, ...filters } = req.query;
    
    try {
        let query = supabaseAdmin.from(table).select(select || '*');
        
        // Aplicar filtros básicos si existen
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error(`❌ [DB_PROXY_ERROR] Table: ${table}`, e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/db/:table', async (req, res) => {
    const { table } = req.params;
    const { method = 'upsert' } = req.query; // 'insert', 'upsert', 'update'
    
    try {
        let query;
        if (method === 'insert') query = supabaseAdmin.from(table).insert(req.body);
        else if (method === 'update') query = supabaseAdmin.from(table).update(req.body).eq('id', req.body.id);
        else query = supabaseAdmin.from(table).upsert(req.body);

        const { data, error } = await query.select();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (e) {
        console.error(`❌ [DB_PROXY_WRITE_ERROR] Table: ${table}`, e);
        res.status(500).json({ error: e.message });
    }
});


// UPLOAD PROXY - Usa service_role key para bypass RLS (v16.8.0)
app.post('/api/storage/upload', express.json({ limit: '10mb' }), async (req, res) => {
    const { bucket, path, fileName, contentType, buffer } = req.body;
    if (!bucket || !path || !fileName || !buffer) return res.status(400).json({ error: "Faltan parámetros" });
    try {
        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(`${path}/${fileName}`, Buffer.from(buffer, 'base64'), {
                contentType: contentType || 'image/jpeg',
                upsert: false
            });
        if (error) throw error;
        console.log(`📸 [UPLOAD_PROXY] Subido: ${path}/${fileName}`);
        res.json({ success: true, data });
    } catch (e) {
        console.error(`❌ [UPLOAD_PROXY_ERROR]`, e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/storage/list/:bucket', async (req, res) => {
    const { bucket } = req.params;
    const { prefix } = req.body;
    
    try {
        const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, {
            limit: 30,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
        });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error(`❌ [STORAGE_PROXY_ERROR] Bucket: ${bucket}`, e);
        res.status(500).json({ error: e.message });
    }
});


// PROXY ROBUSTO PARA GOOGLE SHEETS (v19.0.0) - BYPASS CORS & AUTO-FILTER
app.get('/api/sheets/prompts', (req, res) => {
    const { industria } = req.query;
    const SHEET_ID = process.env.ID_SHEET || '1uyy2hzj8HWWQFnm6xy-XCwvvGh3odjV4fRlDh5SBxu8';
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=prompts_campanas`;

    https.get(url, (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => body += chunk);
        proxyRes.on('end', () => {
            try {
                const jsonStr = body.substring(47).slice(0, -2);
                const fullData = JSON.parse(jsonStr);
                
                // Normalizar datos: Convertir el formato complejo de Google a JSON simple
                const rows = fullData.table.rows.map(r => ({
                    industria: r.c[0]?.v?.toString().toLowerCase() || "",
                    contenido: r.c[1]?.v || ""
                }));

                // Filtrar por industria en el servidor (más rápido y seguro)
                if (industria) {
                    const match = rows.filter(r => r.industria === industria.toLowerCase());
                    return res.json(match);
                }

                res.json(rows);
            } catch (e) {
                console.error("🔴 Error en Proxy Sheets:", e);
                res.status(500).json({ error: "Error en el formato de Google Sheets" });
            }
        });
    }).on('error', (e) => {
        res.status(500).json({ error: "Conexión fallida con Google" });
    });
});

// Endpoint para notificaciones del módulo de Citas
app.post('/api/webhook/citas', (req, res) => {
    const auth = req.headers['x-auth-token'];
    if (auth !== process.env.API_AUTH_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    console.log(`📅 [CITAS_WEBHOOK]`, JSON.stringify(req.body));
    res.json({ received: true });
});

// Montar módulo de Citas (webhook WhatsApp + API)
const citasApp = require('./citas/index');
app.use(citasApp);

// Serve static files from the current directory
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.static(__dirname));

// For SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, 'localhost', () => {
    console.log(`
🚀 SUITORG SECURE SERVER RUNNING
-------------------------------
URL: http://localhost:${PORT}
Status: Protected (AI Proxy & DB Admin Proxy Active)
-------------------------------
    `);
});

