const express = require('express');
const path = require('path');
const https = require('https');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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

// PROXY SEGURO PARA IA (v17.0.0)
app.post('/api/ai/chat', (req, res) => {
    const { model, messages } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "API Key de OpenRouter no configurada en el servidor." });
    }

    const postData = JSON.stringify({
        model: model,
        messages: messages,
        headers: {
            "HTTP-Referer": "http://localhost:3001",
            "X-Title": "SuitOrg Secure Proxy"
        }
    });

    const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', (chunk) => { data += chunk; });
        proxyRes.on('end', () => {
            try {
                res.status(proxyRes.statusCode).json(JSON.parse(data));
            } catch (e) {
                res.status(500).json({ success: false, error: "Error al procesar respuesta de OpenRouter." });
            }
        });
    });

    proxyReq.on('error', (e) => {
        res.status(500).json({ success: false, error: e.message });
    });

    proxyReq.write(postData);
    proxyReq.end();
});

// Receptor temporal de Sincronización
app.post('/api/sync-empresa', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, 'tmp', 'sync_payload.json');
    
    fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
    
    console.log(`✅ [SYNC_RECEIVER] Recibidos datos de ${req.body.length} empresas.`);
    res.json({ success: true, message: "Datos recibidos en el servidor local." });
});

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
Status: Protected (OpenRouter Proxy Active)
-------------------------------
    `);
});

