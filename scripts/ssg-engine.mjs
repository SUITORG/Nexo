import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * EVASOL SSG ENGINE (v2.0.0)
 * Responsabilidad: Generar archivos físicos HTML con SEO inyectado desde Google Sheets.
 *
 * Cambios v2.0.0 (plan-posicionamiento-seo-multitenant):
 *  - F1.1: noindex, nofollow en toda página que no sea la real (EVASOL).
 *  - F1.2: sitemap.xml lista SOLO la(s) página(s) reales de EvaSol.
 *  - F1.3: robots.txt con Disallow por cada archivo de inquilino de prueba.
 *  - F1.4: baseUrl corregido a https://grupoevasol.com (dominio real).
 *  - F2.1: OG/Twitter personalizados por inquilino (title/description/image/url).
 *  - F2.2: og:url = URL específica de cada página.
 *  - F2.3: rel=canonical solo en la página real (EvaSol).
 *  - F2.4: JSON-LD LocalBusiness solo en la página real (EvaSol).
 *  - F2.5: descripción/keywords reales derivadas de campos existentes (sin migración).
 *  - F2.6: se retira el chrome de panel interno (Chart.js, consola SYSTEM READY,
 *          indicador de salud de IA) de las páginas públicas generadas.
 *  - F1.5 (revisión SuitOS): borra páginas huérfanas de inquilinos renombrados/
 *          eliminados de Config_Empresas — sin esto quedaban en disco, indexables
 *          y con SEO genérico, sin que ningún fix anterior las tocara.
 */

// 1. Configuración (Detectada del sistema)
const CONFIG = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbzhWR6LoS7wirxWPhQBZIZJ2ynuQHa_VYzrIILR5rasOuCSE55Fk4f3M07fCmnyzEwN/exec',
    apiToken: 'PROTON-77-X',
    outputDir: './dist', // Directorio para los archivos generados
    template: 'index.html',
    baseUrl: 'https://grupoevasol.com', // F1.4: dominio real (antes suitorg.com)
    realTenant: 'EVASOL' // F1.1: única empresa con es_principal=true — la real
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

// Convierte link de vista de Google Drive a URL de imagen directa (para og:image).
function directDriveImage(url) {
    if (!url) return url;
    const m = url.match(/\/file\/d\/([^/]+)\//);
    return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : url;
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

        const sitemapUrls = [];   // F1.2: solo la página real
        const demoFiles = [];     // F1.3: archivos de demo a Disallow en robots.txt
        const generatedFiles = new Set(); // F1.5: para detectar huérfanos (inquilinos renombrados/eliminados)

        // 4. Generar páginas estáticas por inquilino
        for (const company of companies) {
            const coId = (company.id_empresa || "").trim().toUpperCase();
            if (!coId) continue; // filas basura sin id_empresa
            const isReal = coId === CONFIG.realTenant; // F1.1
            console.log(`📦 Procesando Inquilino: ${coId}...${isReal ? ' (REAL — indexable)' : ''}`);

            // Buscar SEO específico (Mapeo: id_empresa en Sheets -> id en el objeto data.Config_SEO)
            const coSeo = seoData.find(s => (s.id_empresa || s.id || "").toString().trim().toUpperCase() === coId) ||
                seoData.find(s => (s.id_empresa || s.id || "").toString().trim().toUpperCase() === 'SUITORG') || {};

            // F2.5: título/descripción/keywords reales derivadas de campos existentes.
            const title = coSeo.titulo || `${company.nomempresa || 'SuitOrg'} | ${company.giro_especifico || company.giro || 'Food Hub'}`;
            const desc = coSeo.description || company.descripcion || company.descripcion_corta ||
                (isReal
                    ? `${company.nomempresa || 'EvaSol'} — ${company.giro_especifico || 'Energía Solar'}.${company.slogan ? ' ' + company.slogan + '.' : ''}`
                    : `Ordena online en ${company.nomempresa || 'nosotros'}.`);
            const keywords = coSeo.keywords || coSeo.keywords_coma || `${company.nomempresa || 'SuitOrg'}, pedidos online`;

            // Inyectar en el HTML físicamente
            let html = templateContent
                .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
                .replace(/<meta name="description"[\s\S]*?>/, `<meta name="description" content="${desc}">`)
                .replace(/<meta name="keywords"[\s\S]*?>/, `<meta name="keywords" content="${keywords}">`)
                // F1.1: la página real indexable; las demás fuera del radar de buscadores.
                .replace(/<meta name="robots" content=".*?">/,
                    isReal ? '<meta name="robots" content="index, follow">' : '<meta name="robots" content="noindex, nofollow">')
                // F2.1: OG/Twitter personalizados por inquilino.
                .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
                .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${desc}">`)
                .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${CONFIG.baseUrl}/${fileName(coId)}">`)
                .replace(/<meta property="og:image" content=".*?">/,
                    `<meta property="og:image" content="${directDriveImage(coSeo.imagen_url) || 'https://lh3.googleusercontent.com/d/1Z_u3u1XnZJm5_p...'}">`)
                .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`)
                .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${desc}">`);

            // F2.6: retirar chrome de panel interno de las páginas públicas.
            html = html.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js"><\/script>\s*/, '\n');
            html = html.replace(/\s*<!-- CENTER: Logic Console -->\s*<div class="sb-console"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="sb-right">)/, '\n');
            html = html.replace(/\s*<span id="sb-ai-container"[\s\S]*?<\/span>\s*(?=<span class="divider">)/, '');

            // Añadir bandera de pre-renderizado para el JS
            html = html.replace('<body>', `<body data-pre-rendered="true" data-co-id="${coId}">`);

            // F2.3/F2.4: canonical + JSON-LD LocalBusiness SOLO en la página real.
            if (isReal) {
                const ogUrl = `${CONFIG.baseUrl}/${fileName(coId)}`;
                const ogImage = directDriveImage(coSeo.imagen_url);
                html = html.replace('</head>', `    <link rel="canonical" href="${ogUrl}">\n</head>`);
                const ld = {
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": company.nomempresa || 'EvaSol',
                    "description": desc,
                    "url": ogUrl,
                    "image": ogImage,
                    "telephone": company.telefonowhatsapp ? `+${company.telefonowhatsapp}` : (coSeo.wa_directo ? `+${coSeo.wa_directo}` : undefined),
                    "email": company.correoempresarial || coSeo.mail_directo || undefined,
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": company.ubicacion_url || company.ubicacion || undefined
                    }
                };
                html = html.replace('</head>', `    <script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
            }

            // Guardar archivo (ej: POLLITO.html o index.html si es el principal)
            const file = fileName(coId);
            fs.writeFileSync(path.join(CONFIG.outputDir, file), html);
            generatedFiles.add(file);

            // F1.2/F1.3: solo la real al sitemap; las demás a la lista de Disallow.
            if (isReal) {
                sitemapUrls.push({ loc: `${CONFIG.baseUrl}/${file}`, priority: '1.0' });
            } else {
                demoFiles.push(file);
            }
        }

        // Nombre de archivo por inquilino (index.html solo para SUITORG).
        function fileName(coId) {
            return coId === 'SUITORG' ? 'index.html' : `${coId.toLowerCase()}.html`;
        }

        // 5. Generar Sitemap.xml — F1.2: solo página(s) real(es)
        console.log("🗺️ Generando Sitemap.xml...");
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `   <url>
      <loc>${url.loc}</loc>
      <priority>${url.priority}</priority>
   </url>`).join('\n')}
</urlset>`;
        fs.writeFileSync(path.join(CONFIG.outputDir, 'sitemap.xml'), sitemapContent);

        // 6. Generar Robots.txt — F1.3: Disallow por cada archivo de demo
        console.log("🤖 Generando Robots.txt...");
        const disallowLines = demoFiles.map(f => `Disallow: /${f}`);
        const robotsContent = `User-agent: *
Allow: /
${disallowLines.join('\n')}
Sitemap: ${CONFIG.baseUrl}/sitemap.xml`;
        fs.writeFileSync(path.join(CONFIG.outputDir, 'robots.txt'), robotsContent);

        // F1.5: borrar páginas huérfanas — inquilinos renombrados o eliminados de
        // Config_Empresas dejaban su .html viejo en dist/ sin tocar, indexable y
        // con SEO genérico, porque el loop de arriba solo escribe/actualiza
        // archivos de inquilinos ACTUALES, nunca revisa lo que ya sobraba en disco
        // (caso real encontrado: roomateanl.html sobrevivió al rename a
        // roommatenl.html, seguía en "index, follow" con og:title genérico).
        const existingHtml = fs.readdirSync(CONFIG.outputDir).filter(f => f.endsWith('.html'));
        const orphans = existingHtml.filter(f => !generatedFiles.has(f));
        for (const orphan of orphans) {
            fs.unlinkSync(path.join(CONFIG.outputDir, orphan));
            console.log(`🗑️ Huérfano eliminado: ${orphan} (ya no corresponde a ningún inquilino activo)`);
        }

        console.log("✅ Proceso SSG completado con éxito.");
        console.log(`📂 Archivos generados en: ${CONFIG.outputDir}`);
        console.log(`🔎 Indexables: ${sitemapUrls.map(u => u.loc).join(', ') || 'NINGUNO'}`);
        console.log(`🚫 No index (${demoFiles.length}): ${demoFiles.join(', ')}`);

    } catch (err) {
        console.error("❌ Error CRÍTICO en Motor SSG:");
        console.error(err);
        process.exit(1);
    }
}

build();
