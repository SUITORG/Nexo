import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * EVASOL SSG ENGINE (v1.0.0)
 * Responsabilidad: Generar archivos físicos HTML con SEO inyectado desde Google Sheets.
 */

// 1. Configuración (Detectada del sistema)
const CONFIG = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbyTbapadaRfLsyaH086si09RR4dAIeHe955x7UFhtpE1ma7oUTkqizZvBwGod4QINkl/exec',
    apiToken: 'PROTON-77-X',
    outputDir: './dist', // Directorio para los archivos generados
    template: 'index.html',
    baseUrl: 'https://suitorg.com'
};

// Utilidad para fetch en Node.js (con soporte para redirecciones)
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            // Manejo de redirección Apps Script (vía 302 a googleusercontent)
            if (res.statusCode === 302 || res.statusCode === 301) {
                return resolve(fetchJson(res.headers.location));
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (data.trim().startsWith('<')) {
                        console.error("⚠️ Recibido HTML en lugar de JSON. Contenido:");
                        console.error(data.slice(0, 500));
                        return reject(new SyntaxError("JSON esperado, HTML recibido"));
                    }
                    resolve(JSON.parse(data));
                }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function build() {
    console.log("🚀 Iniciando Motor SSG (Static Site Generation)...");

    try {
        // 2. Obtener datos de Google Sheets
        const data = await fetchJson(`${CONFIG.apiUrl}?action=getAll&id_empresa=SuitOrg&token=${CONFIG.apiToken}`);

        if (!data || !data.Config_Empresas) {
            throw new Error("No se pudo obtener la matriz de empresas del backend.");
        }

        // Normalizar claves de objetos (GAS a veces devuelve claves con espacios o mayúsculas internas)
        const normalizeKeys = (obj) => {
            if (!obj) return {};
            const normalized = {};
            Object.keys(obj).forEach(key => {
                normalized[key.toLowerCase().trim()] = obj[key];
            });
            return normalized;
        };

        const companies = data.Config_Empresas.map(normalizeKeys);
        const seoData = (data.Config_SEO || []).map(normalizeKeys);
        const templateContent = fs.readFileSync(CONFIG.template, 'utf8');

        // 3. Crear directorio de salida si no existe
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        const sitemapUrls = [];

        // 4. Generar páginas estáticas por inquilino
        for (const company of companies) {
            const coId = company.id_empresa.trim().toUpperCase();
            console.log(`📦 Procesando Inquilino: ${coId}...`);

            // Buscar SEO específico (Mapeo: id_empresa en Sheets -> id en el objeto data.Config_SEO)
            const coSeo = seoData.find(s => (s.id_empresa || s.id || "").toString().trim().toUpperCase() === coId) ||
                seoData.find(s => (s.id_empresa || s.id || "").toString().trim().toUpperCase() === 'SUITORG') || {};

            const title = coSeo.title || `${company.nombre || 'SuitOrg'} | ${company.giro || 'Food Hub'}`;
            const desc = coSeo.description || company.descripcion_corta || `Ordena online en ${company.nombre || 'nosotros'}.`;
            const keywords = coSeo.keywords || `${company.nombre || 'SuitOrg'}, pedidos online`;

            // Inyectar en el HTML físicamente
            let html = templateContent
                .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
                .replace(/<meta name="keywords" content=".*?">/, `<meta name="keywords" content="${keywords}">`);

            // Añadir bandera de pre-renderizado para el JS
            html = html.replace('<body>', `<body data-pre-rendered="true" data-co-id="${coId}">`);

            // Guardar archivo (ej: POLLITO.html o index.html si es el principal)
            const fileName = coId === 'SUITORG' ? 'index.html' : `${coId.toLowerCase()}.html`;
            fs.writeFileSync(path.join(CONFIG.outputDir, fileName), html);

            sitemapUrls.push({
                loc: `${CONFIG.baseUrl}/${fileName}`,
                priority: coId === 'SUITORG' ? '1.0' : '0.8'
            });
        }

        // 5. Generar Sitemap.xml
        console.log("🗺️ Generando Sitemap.xml...");
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `   <url>
      <loc>${url.loc}</loc>
      <priority>${url.priority}</priority>
   </url>`).join('\n')}
</urlset>`;
        fs.writeFileSync(path.join(CONFIG.outputDir, 'sitemap.xml'), sitemapContent);

        // 6. Generar Robots.txt
        console.log("🤖 Generando Robots.txt...");
        const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${CONFIG.baseUrl}/sitemap.xml`;
        fs.writeFileSync(path.join(CONFIG.outputDir, 'robots.txt'), robotsContent);

        console.log("✅ Proceso SSG completado con éxito.");
        console.log(`📂 Archivos generados en: ${CONFIG.outputDir}`);

    } catch (err) {
        console.error("❌ Error CRÍTICO en Motor SSG:");
        console.error(err);
        process.exit(1);
    }
}

build();
