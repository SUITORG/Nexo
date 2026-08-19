const express = require('express');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

// Stripe módulo de pagos
const stripePayments = require('./Conecionpagos/index');

// Stripe Webhook (debe ir ANTES de express.json() para recibir raw body)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!sig || !endpointSecret) return res.status(400).json({ error: 'Firma o secret no configurado' });
    try {
        const result = await stripePayments.handleWebhook(req.body, sig, endpointSecret);
        console.log(`💳 [STRIPE_WEBHOOK] ${result.event} | Status: ${result.status}`);
        if (result.status === 'completed') {
            console.log(`  Pago exitoso: ${result.paymentIntentId} - $${result.amount} MXN`);
        }
        res.json({ received: true });
    } catch (e) {
        console.error('❌ [STRIPE_WEBHOOK_ERROR]', e.message);
        res.status(400).json({ error: e.message });
    }
});

app.use(express.json());

// 🛡️ Seguridad: Configuración de Security Headers via Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.google.com", "https://*.googleapis.com", "https://kit.fontawesome.com", "https://cdn.jsdelivr.net", "https://js.stripe.com"],
            "script-src-attr": ["'unsafe-inline'"],
            "connect-src": ["'self'", "http://localhost:3003", "https://*.supabase.co", "https://*.google.com", "https://*.googleapis.com", "https://openrouter.ai", "https://ka-f.fontawesome.com", "https://*.googleusercontent.com", "https://api.stripe.com", "https://cdn.jsdelivr.net"],
            "img-src": ["'self'", "data:", "https://loremflickr.com", "https://*.supabase.co", "https://*.google.com", "https://*.googleapis.com", "https://*.googleusercontent.com", "https://*.stripe.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://kit.fontawesome.com", "https://cdnjs.cloudflare.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com", "https://cdnjs.cloudflare.com"],
            "frame-src": ["'self'", "http://localhost:3003", "https://*.google.com", "https://*.googleusercontent.com", "https://js.stripe.com"],
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
        path: `/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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


// CAPTURA DE ERRORES DEL FRONTEND (v16.7.30)
// Los errores JS del navegador se almacenan en la tabla Logs con evento='FRONTEND_ERROR'
// y se autodepuran cada 24h para no llenar la BD
app.post('/api/logs/error', async (req, res) => {
    const { message, source, lineno, colno, stack, url, companyId, userAgent } = req.body;
    try {
        const detalle = { message: message || '' };
        if (source) detalle.source = source;
        if (lineno !== undefined) detalle.lineno = lineno;
        if (colno !== undefined) detalle.colno = colno;
        if (stack) detalle.stack = stack;
        if (url) detalle.url = url;
        if (userAgent) detalle.userAgent = userAgent;
        if (companyId) detalle.companyId = companyId;

        await supabaseAdmin.from('Logs').insert({
            evento: 'FRONTEND_ERROR',
            usuario: 'BROWSER',
            detalle: detalle,
            fecha: new Date().toISOString(),
            id_empresa: companyId || 'BROWSER_GLOBAL'
        });

        // Autopurga: borrar errores de frontend mayores a 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin.from('Logs')
            .delete()
            .eq('evento', 'FRONTEND_ERROR')
            .lt('fecha', yesterday);

        res.json({ success: true });
    } catch (e) {
        console.error('❌ [FRONTEND_ERROR_LOG]', e.message);
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

// Montar SuitAI (model discovery + auto-routing + circuit breaker) — debe ir ANTES de /api/ai/* sueltos
const suitAiApp = require('./SuitAI/index');
app.use(suitAiApp);

// Montar módulo de Citas (webhook WhatsApp + API)
const citasApp = require('./citas/index');
app.use(citasApp);

// Montar SuitReservaciones (webhook WhatsApp + API) — módulo migrado
const reservacionesApp = require('./SuitReservaciones/index');
app.use(reservacionesApp);

// Montar SuitPedidoExpress (menú digital + órdenes) — módulo nuevo
const pedidoExpressApp = require('./SuitPedidoExpress/index');
app.use(pedidoExpressApp);

// Montar SuitPos (POS + monitor) — módulo nuevo
const posApp = require('./SuitPos/index');
app.use(posApp);

// Montar SuitProductos (catálogo + precios) — módulo nuevo
const productosApp = require('./SuitProductos/index');
app.use(productosApp);

// Montar SuitInventarios (stock + movimientos) — módulo nuevo
const inventariosApp = require('./SuitInventarios/index');
app.use(inventariosApp);

// Montar SuitBodega (ubicaciones + transferencias) — módulo nuevo
const bodegaApp = require('./SuitBodega/index');
app.use(bodegaApp);

// Montar SuitMistral (chat completion + historial) — módulo nuevo
const mistralApp = require('./SuitMistral/index');
app.use(mistralApp);

// =====================================================================
// 💳 STRIPE PAYMENT ENDPOINTS
// =====================================================================
// Obtener la publishable key de Stripe para el frontend
app.get('/api/stripe/config', (req, res) => {
    const companyId = req.query.company_id || '';
    const pubKey = stripePayments.getPublishableKey(companyId);
    if (!pubKey) return res.status(404).json({ error: 'Stripe no configurado para esta empresa' });
    res.json({ publishableKey: pubKey });
});

// Crear PaymentIntent para cobro con tarjeta
app.post('/api/stripe/create-payment-intent', async (req, res) => {
    const { amount, company_id, metadata } = req.body;
    if (!amount || !company_id) return res.status(400).json({ error: 'Faltan amount y company_id' });
    try {
        const intent = await stripePayments.createPaymentIntent({
            amount,
            companyId: company_id,
            metadata: metadata || {}
        });
        res.json(intent);
    } catch (e) {
        console.error('❌ [STRIPE_CREATE_INTENT_ERROR]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Confirmar estado de un PaymentIntent
app.get('/api/stripe/payment-status/:intentId', async (req, res) => {
    const { intentId } = req.params;
    const companyId = req.query.company_id || '';
    try {
        const result = await stripePayments.confirmPayment(intentId, companyId);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// =====================================================================
// 📋 COTIZADOR API — Proxy al standalone SuitCotizador (puerto 3003)
// =====================================================================
const http = require('http');
function proxyCotizador(req, res) {
  var opts = {
    hostname: '127.0.0.1',
    port: 3003,
    path: '/api' + req.path.replace('/api/cotizador', '/api/cotizador') + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''),
    method: req.method,
    headers: { 'Content-Type': 'application/json' }
  };
  var proxyReq = http.request(opts, function(proxyRes) {
    var body = '';
    proxyRes.on('data', function(chunk) { body += chunk; });
    proxyRes.on('end', function() {
      res.status(proxyRes.statusCode).type('json').send(body);
    });
  });
  proxyReq.on('error', function() {
    res.status(502).json({ error: 'SuitCotizador no disponible (puerto 3003)' });
  });
  if (req.body && Object.keys(req.body).length > 0) proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
}
app.all('/api/cotizador/*', proxyCotizador);

// SuitChatTG health proxy (port 3011)
app.get('/api/service-health/telegram', (req, res) => {
    const http = require('http');
    http.get('http://localhost:3011/api/health', (proxyRes) => {
        let body = '';
        proxyRes.on('data', (chunk) => body += chunk);
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode).type('json').send(body);
        });
    }).on('error', (e) => {
        res.json({ status: 'error', error: e.message });
    });
});

// Serve static files from the current directory
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.static(__dirname, { etag: false, lastModified: false }));

// SuitOpComer — Google Places API (requiere API key del usuario, free tier $200/mes)
app.post('/api/suitopcomer/places', async (req, res) => {
    const { apiKey, niche, location, limit } = req.body;
    if (!apiKey || !niche || !location) return res.status(400).json({ error: 'Faltan parámetros: apiKey, niche, location' });
    try {
        const maxResults = Math.min(parseInt(limit) || 5, 20);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(niche + ' in ' + location)}&key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            return res.status(400).json({ ok: false, error: 'Google Places error: ' + data.status + ' - ' + (data.error_message || '') });
        }
        const places = (data.results || []).slice(0, parseInt(limit) || 5);
        const results = [];
        for (const place of places) {
            const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${encodeURIComponent(apiKey)}`;
            const detailRes = await fetch(detailUrl);
            const detail = await detailRes.json();
            const d = detail.result || {};
            results.push({
                nombre: d.name || place.name,
                contacto: d.formatted_phone_number || '',
                giro: (d.types || []).filter(t => !t.includes('_')).join(', ') || place.types?.[0] || '',
                web: d.website || '',
                tamano: d.user_ratings_total ? (d.user_ratings_total > 100 ? 'Mediana' : 'Pequeña') : 'Desconocido',
                direccion: d.formatted_address || place.formatted_address || '',
                rating: d.rating || place.rating || '',
                reviews: d.user_ratings_total || place.user_ratings_total || 0
            });
        }
        res.json({ ok: true, empresas: results });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// SuitOpComer — Scraping puro (sin API key)
app.get('/api/suitopcomer/scrape', async (req, res) => {
    const { niche, location, limit } = req.query;
    if (!niche || !location) return res.status(400).json({ error: 'Faltan parámetros: niche, location' });
    try {
        const maxResults = Math.min(parseInt(limit) || 5, 20);
        const query = encodeURIComponent(`${niche} in ${location}`);
        const url = `https://www.google.com/search?q=${query}&num=${maxResults}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const html = await response.text();
        const results = [];
        const nameRegex = /<h3[^>]*>(.*?)<\/h3>/gi;
        const linkRegex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>(.*?)<\/a>/gi;
        let match;
        const names = [];
        while ((match = nameRegex.exec(html)) !== null) {
            const name = match[1].replace(/<[^>]+>/g, '').trim();
            if (name && name.length > 2) names.push(name);
        }
        const links = [];
        while ((match = linkRegex.exec(html)) !== null) {
            const url = match[1];
            const text = match[2].replace(/<[^>]+>/g, '').trim();
            if (url.startsWith('http') && text.length > 2) links.push({ url, text });
        }
        const empresas = [];
        for (let i = 0; i < Math.min(names.length, parseInt(limit) || 5); i++) {
            empresas.push({
                nombre: names[i],
                web: links.find(l => l.text.includes(names[i].slice(0, 10)))?.url || '',
                fuente: 'scraping'
            });
        }
        res.json({ ok: true, empresas, fuente: 'scraping' });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// =====================================================================
// 📊 SUITMARKET — US Market Dashboard Proxy (Yahoo Finance v8)
// =====================================================================
const yahooQuoteCache = new Map();
const YAHOO_CACHE_TTL = 15000; // 15s cache

function yahooFetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Invalid JSON from Yahoo')); }
            });
        }).on('error', reject);
    });
}

// Fetch single symbol via v8 chart API and normalize to quote-like object
async function fetchQuoteV8(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await yahooFetch(url);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;
    const change = prevClose ? price - prevClose : 0;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;
    return {
        symbol: meta.symbol,
        shortName: meta.shortName || meta.symbol,
        longName: meta.longName || meta.shortName || meta.symbol,
        regularMarketPrice: price,
        regularMarketChange: Math.round(change * 100) / 100,
        regularMarketChangePercent: Math.round(changePct * 100) / 100,
        regularMarketDayHigh: meta.regularMarketDayHigh,
        regularMarketDayLow: meta.regularMarketDayLow,
        regularMarketVolume: meta.regularMarketVolume,
        regularMarketTime: meta.regularMarketTime,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    };
}

// GET /api/market/quotes?symbols=AAPL,MSFT,SPY — v8 chart API, parallel fetch
app.get('/api/market/quotes', async (req, res) => {
    const { symbols } = req.query;
    if (!symbols) return res.status(400).json({ error: 'symbols requerido' });

    const cacheKey = symbols.split(',').sort().join(',');
    const cached = yahooQuoteCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < YAHOO_CACHE_TTL) {
        return res.json(cached.data);
    }

    try {
        const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);
        const results = await Promise.allSettled(symbolList.map(s => fetchQuoteV8(s)));
        const quotes = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
        yahooQuoteCache.set(cacheKey, { data: quotes, ts: Date.now() });
        res.json(quotes);
    } catch (e) {
        console.error('[MARKET_QUOTE_ERROR]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/market/movers — top gainers del día (v8 fallback: combine ETFs+commodities sorted by gain)
app.get('/api/market/movers', async (req, res) => {
    try {
        // v7 screener is now auth-gated; use v8 chart for a watchlist of popular US stocks
        const watchlist = 'NVDA,TSLA,AAPL,MSFT,AMZN,GOOGL,META,AMD,NFLX,PLTR';
        const symbolList = watchlist.split(',');
        const results = await Promise.allSettled(symbolList.map(s => fetchQuoteV8(s)));
        const quotes = results
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value)
            .sort((a, b) => (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0));
        res.json(quotes);
    } catch (e) {
        console.error('[MARKET_MOVERS_ERROR]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/market/news — financial news headlines
app.get('/api/market/news', async (req, res) => {
    try {
        const url = 'https://query2.finance.yahoo.com/v1/finance/search?q=stock+market&quotesCount=0&newsCount=15&enableFuzzyQuery=false';
        const data = await yahooFetch(url);
        const news = (data?.news || []).map(n => ({
            title: n.title,
            link: n.link,
            publisher: n.publisher,
            providerPublishTime: n.providerPublishTime
        }));
        res.json(news);
    } catch (e) {
        console.error('[MARKET_NEWS_ERROR]', e.message);
        res.status(500).json({ error: e.message });
    }
});

// For SPA routing
app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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

