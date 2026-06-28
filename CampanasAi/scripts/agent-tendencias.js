const supabase = require('../lib/supabase');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MEDIA_FOLDER = process.env.MEDIA_FOLDER;

const FUENTES_REALES = [
    { nombre: 'Google Trends', url: 'https://trends.google.com/trending', categoria: 'General' },
    { nombre: 'TikTok', url: 'https://www.tiktok.com/trending', categoria: 'Entretenimiento' }
];

async function callIA(prompt, temperature = 0.7) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:8000',
            'X-Title': 'CampanasAi Agent Tendencias'
        },
        body: JSON.stringify({
            model: 'openrouter/free',
            messages: [{ role: 'user', content: prompt }],
            temperature
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data.choices[0].message.content;
}

async function buscarTendencias(limite = 5) {
    const prompt = `Eres un analista de tendencias. Genera una lista de ${limite} tendencias actuales y relevantes para crear contenido viral en redes sociales (Instagram, TikTok, Facebook). Para cada tendencia incluye:
- titulo: nombre corto de la tendencia
- descripcion: explicacion breve
- categoria: una de [Moda, Tecnologia, Salud, Negocios, Entretenimiento, Educacion, EstiloVida, Otro]
- keywords: 3-5 palabras clave separadas por coma

Responde SOLO con JSON válido, un array de objetos:
[{"titulo": "...", "descripcion": "...", "categoria": "...", "keywords": "..."}]`;

    const raw = await callIA(prompt, 0.8);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
}

async function buscarTendenciasReales(serverLog, limite = 5) {
    for (const fuente of FUENTES_REALES) {
        try {
            serverLog('AGENT', `🌐 Intentando browser-act: ${fuente.nombre} (${fuente.url})`);
            const output = execSync(
                `browser-act stealth-extract "${fuente.url}" --content-type markdown`,
                { timeout: 45000, shell: true, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
            );

            if (!output || output.length < 100) {
                serverLog('AGENT', `  ⚠️ Respuesta muy corta de ${fuente.nombre}, intentando siguiente fuente...`);
                continue;
            }

            serverLog('AGENT', `  ✅ ${(output.length / 1024).toFixed(0)} KB extraídos de ${fuente.nombre}`);
            serverLog('AGENT', `  🧠 Procesando con IA para extraer tendencias...`);

            const prompt = `Eres un analista de tendencias. Extrae las ${limite} tendencias principales del siguiente contenido extraído de "${fuente.nombre}". Ignora navegación, menús, publicidad y enfócate en términos/ temas virales reales.

Para cada tendencia incluye:
- titulo: nombre corto de la tendencia
- descripcion: explicacion breve de 1-2 oraciones
- categoria: una de [Moda, Tecnologia, Salud, Negocios, Entretenimiento, Educacion, EstiloVida, Otro]
- keywords: 3-5 palabras clave separadas por coma

CONTENIDO EXTRAIDO:
${output.substring(0, 8000)}

Responde SOLO con JSON válido, un array de objetos:
[{"titulo": "...", "descripcion": "...", "categoria": "...", "keywords": "..."}]`;

            const raw = await callIA(prompt, 0.3);
            const cleaned = raw.replace(/```json|```/g, '').trim();
            const tendencias = JSON.parse(cleaned);

            if (!Array.isArray(tendencias) || tendencias.length === 0) {
                serverLog('AGENT', `  ⚠️ IA no pudo extraer tendencias de ${fuente.nombre}, intentando siguiente...`);
                continue;
            }

            serverLog('AGENT', `  📊 ${tendencias.length} tendencias extraídas de ${fuente.nombre}`);
            return { fuente: fuente.nombre, tendencias: tendencias.slice(0, limite) };

        } catch (e) {
            const msg = e.message || String(e);
            if (msg.includes('No browsers found') || msg.includes('Skill version') || msg.includes('Downloading')) {
                serverLog('AGENT', `  ⏳ browser-act no listo (${msg.substring(0, 60)}...)`);
            } else {
                serverLog('AGENT', `  ⚠️ ${fuente.nombre}: ${msg.substring(0, 100)}`);
            }
        }
    }

    serverLog('AGENT', '  ➡️ Ninguna fuente real disponible, usando IA generativa');
    return { fuente: 'ia', tendencias: null };
}

async function categorizarTendencia(titulo, descripcion) {
    const prompt = `Clasifica esta tendencia en una categoria:
Titulo: ${titulo}
Descripcion: ${descripcion}

Elige UNA categoria exacta de: [Moda, Tecnologia, Salud, Negocios, Entretenimiento, Educacion, EstiloVida, Otro]
Responde solo con el nombre de la categoria.`;

    const raw = await callIA(prompt, 0.3);
    return raw.trim();
}

async function buscarRecetaPorCategoria(supabase, categoria) {
    const { data, error } = await supabase
        .from('recetas')
        .select('*');
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const prompt = `Dada esta categoria: "${categoria}"
Elige la receta MAS ADECUADA de la siguiente lista para crear un video viral sobre esa categoria.
Responde SOLO con el ID numerico de la receta, nada mas.

Recetas disponibles:
${data.map(r => `ID:${r.id} - ${r.nombre} (orden:${r.orden}, duracion:${r.duracion_total}s, ritmo:${r.ritmo}, filtro:${r.filtro}, transicion:${r.transicion})`).join('\n')}

Si ninguna es adecuada, responde "0" para crear una nueva.`;

    const raw = await callIA(prompt, 0.3);
    const id = parseInt(raw.trim());
    if (!id || id === 0) return null;
    return data.find(r => r.id === id) || null;
}

async function crearRecetaConIA(supabase, titulo, categoria) {
    const prompt = `Eres un creador de recetas para videos virales. Crea una NUEVA receta para esta tendencia:
Titulo: ${titulo}
Categoria: ${categoria}

Genera una receta con estos campos exactos:
- nombre: nombre creativo para la receta (max 30 chars)
- orden: "aleatorio" o "secuencial"
- duracion_total: "30" o "60" (segundos)
- ritmo: "musica", "0.5", o "2"
- filtro: "ninguno", "blanco_y_negro", "colores_vivos", o "vintage"
- transicion: "corte_brusco", "fundido", "barrido_derecha", o "zoom"
- animacion: true o false

Responde SOLO con JSON valido, sin markdown:
{"nombre": "...", "orden": "...", "duracion_total": "...", "ritmo": "...", "filtro": "...", "transicion": "...", "animacion": false}`;

    const raw = await callIA(prompt, 0.8);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const receta = JSON.parse(cleaned);

    const { data, error } = await supabase
        .from('recetas')
        .insert({
            nombre: receta.nombre,
            orden: receta.orden,
            duracion_total: receta.duracion_total,
            ritmo: receta.ritmo,
            filtro: receta.filtro,
            transicion: receta.transicion,
            animacion: !!receta.animacion
        })
        .select()
        .single();

    if (error) throw new Error('Error guardando receta: ' + error.message);
    return data;
}

async function generarVideo(titulo, recetaId, serverLog) {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const http = require('http');
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            texto: titulo,
            receta_id: recetaId,
            logo_base64: null,
            formato: 'Reel',
            plataforma: 'Instagram',
            overrides: {}
        });

        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: '/api/video-imaginacion',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'success') resolve(json.video);
                    else reject(new Error(json.error || 'Error generando video'));
                } catch (e) {
                    reject(new Error('Error parseando respuesta del video'));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function guardarTendencia(supabase, tendencia, recetaId, videoBase64, fuente = 'ia') {
    const { error } = await supabase
        .from('tendencias')
        .insert({
            titulo: tendencia.titulo || tendencia,
            categoria: tendencia.categoria || 'Otro',
            descripcion: tendencia.descripcion || '',
            fuente: fuente,
            receta_id: recetaId,
            video_url: videoBase64 ? `data:video/mp4;base64,${videoBase64.substring(0, 50)}...` : null,
            metadata: { keywords: tendencia.keywords || '' }
        });

    if (error) console.error('Error guardando tendencia:', error.message);
}

async function ejecutarAgente(serverLog) {
    const resultados = [];

    try {
        serverLog('AGENT', '🤖 Iniciando agente de tendencias...');

        // Intentar fuentes reales (browser-act), fallback a IA generativa
        const { fuente: fuenteActiva, tendencias: tendenciasReales } = await buscarTendenciasReales(serverLog, 5);
        const tendencias = tendenciasReales || await buscarTendencias(5);
        serverLog('AGENT', `📊 ${tendencias.length} tendencias encontradas (fuente: ${fuenteActiva})`);

        for (const t of tendencias) {
            serverLog('AGENT', `→ Procesando: ${t.titulo} (${t.categoria})`);

            let receta = await buscarRecetaPorCategoria(supabase, t.categoria);
            let esNueva = false;

            if (!receta) {
                serverLog('AGENT', `  ➕ Creando nueva receta para "${t.categoria}"...`);
                receta = await crearRecetaConIA(supabase, t.titulo, t.categoria);
                esNueva = true;
                serverLog('AGENT', `  ✅ Receta creada: ${receta.nombre} (ID: ${receta.id})`);
            } else {
                serverLog('AGENT', `  ✅ Usando receta existente: ${receta.nombre}`);
            }

            let video = null;
            try {
                video = await generarVideo(t.titulo, receta.id, serverLog);
                serverLog('AGENT', `  🎬 Video generado (${(video.length / 1024).toFixed(0)} KB base64)`);
            } catch (e) {
                serverLog('AGENT', `  ❌ Error en video: ${e.message}`);
            }

            await guardarTendencia(supabase, t, receta.id, video, fuenteActiva);

            resultados.push({
                tendencia: t,
                receta: { id: receta.id, nombre: receta.nombre, nueva: esNueva },
                video: video ? `${video.substring(0, 50)}...` : null
            });
        }

        serverLog('AGENT', '✅ Agente completado');
    } catch (e) {
        serverLog('AGENT', `❌ Error fatal: ${e.message}`);
        throw e;
    }

    return resultados;
}

module.exports = { ejecutarAgente };

// Ejecucion directa: node scripts/agent-tendencias.js
if (require.main === module) {
    const log = (level, ...args) => console.log(`[${level}]`, ...args);
    ejecutarAgente(log)
        .then(r => {
            console.log('Resultados:', JSON.stringify(r, null, 2));
            process.exit(0);
        })
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}