/* ===========================================
   LP Generator — Server-side
   Genera landing pages HTML vía IA a partir de
   los campos de Config_Empresas + Brief (ADR-025/026).
   Mismo patrón que PresentacionesVid/bdpv-generator.
   =========================================== */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LANDINGS_DIR = path.join(__dirname, 'landings');

// Unsplash photo pool para landing pages
const UNSPLASH_POOL = [
    { id: '1497366216548-37526070297c', alt: 'Oficina corporativa' },
    { id: '1497366811353-6870744d04b2', alt: 'Espacio de trabajo' },
    { id: '1521791136064-7986c2920216', alt: 'Equipo en reunión' },
    { id: '1552664730-d307ca884978', alt: 'Colaboración de equipo' },
    { id: '1460925895917-afdab827c52f', alt: 'Análisis de negocios' },
    { id: '1454165804606-c3d57bc86b40', alt: 'Planificación de proyectos' },
    { id: '1507679799987-c73779587ccf', alt: 'Profesional de negocios' },
    { id: '1519389950473-47ba0277781c', alt: 'Equipo de trabajo' },
    { id: '1553877522-43269d4ea984', alt: 'Negocios' },
    { id: '1521737604893-d14cc237f11d', alt: 'Equipo colaborando' },
    { id: '1531482615713-2afd69097998', alt: 'Entrevista' },
    { id: '1542744173-8e7e53415bb0', alt: 'Presentación de negocios' }
];

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function getRandomPhotos(count) {
    return shuffleArray(UNSPLASH_POOL).slice(0, Math.max(count || 6, 4));
}

/* ===========================================
   Build AI prompt for landing page
   data = campos del formulario + fila de Config_Empresas (brief)
   =========================================== */
function buildPrompt(data) {
    const {
        company, website, phone, logoUrl, noLogo, region, subNicho, industry,
        skills = [], brief = {}
    } = data;
    const skillsText = skills.length ? skills.join(', ') : 'frontend-design';
    const logoInstr = noLogo ? 'NO incluir logo de la empresa' : 'Incluir el logo de la empresa si está disponible';

    const photos = getRandomPhotos(6);
    const photoMarkup = photos.map(p =>
        `<img src="https://images.unsplash.com/photo-${p.id}?w=800&q=80" alt="${p.alt}" loading="lazy">`
    ).join('\n            ');

    const subtitle = [industry, subNicho, region].filter(Boolean).join(' — ');
    const b = brief;

    return `
Eres un experto en diseño de landing pages de alta conversión usando la skill: ${skillsText}.

Genera una landing page HTML completa para:

EMPRESA: ${company}
SITIO WEB: ${website || '(No especificado)'}
TELÉFONO: ${phone || '(No especificado)'}
UBICACIÓN: ${region || 'Monterrey, N.L., México'}
INDUSTRIA: ${industry || b.industria || 'General'}
SUB-NICHO: ${subNicho || b.nicho || 'General'}
${logoInstr}

DATOS COMERCIALES DEL BRIEF (usar solo si vienen; nunca inventar):
- Producto / Qué vende: ${b.producto || '(No especificado)'}
- Audiencia exacta: ${b.audiencia || '(No especificada)'}
- Dolor principal: ${b.dolor || '(No especificado)'}
- Promesa / Beneficio / Prueba: ${b.promesa_beneficio_prueba || '(No especificado)'}
- Oferta principal: ${b.oferta || b.descripcion || '(No especificada)'}
- Descripción: ${b.descripcion || ''}
- CTA texto: ${b.cta_texto || '(Usa un CTA acorde al objetivo)'}
- Tono de marca: ${b.tono || 'profesional'}
- Prueba social: ${b.prueba_social || ''}
- Precio / margen: ${(b.precio_margen && b.precio_margen.precio) || ''} (solo mostrar precio si viene explícito)
- Restricciones legales: ${b.restricciones_legales || '(Ninguna)'}
- Objetivo: ${b.objetivo || 'ventas'}

REQUISITOS TÉCNICOS OBLIGATORIOS:
1. HTML único, auto-contenido (CSS/JS inline), mobile-first responsive
2. Una sola página (landing) con secciones: hero con CTA arriba del fold, beneficios, producto/servicio, prueba social/testimonios, oferta, contacto/CTA final
3. Botón de CTA visible y repetido (hero + al menos una sección más), enlazado a WhatsApp si hay teléfono: https://wa.me/52${phone ? phone.replace(/\D/g, '') : ''}
4. Tipografía: 'Poppins' o 'DM Sans' (Google Fonts); títulos impactantes
5. Incluir imágenes Unsplash en AL MENOS 50% de las secciones
6. Animaciones suaves con clase .reveal + IntersectionObserver
7. prefers-reduced-motion support
8. Sin dependencias externas (solo Google Fonts)
9. Colores: usa ${data.color || '#2563eb'} como color primario si viene; si no, un esquema acorde a la industria
10. El precio solo se muestra si el Brief lo trae explícito

Usa estas fotos Unsplash distribuidas en las secciones:
${photoMarkup}

Genera SOLO el HTML completo, sin explicaciones, sin marcadores de código. Debe verse profesional inmediatamente al abrirse.
`;
}

/* ===========================================
   Generate landing
   =========================================== */
async function generateLanding(data, callAI) {
    const prompt = buildPrompt(data);
    const company = data.company.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `lp_${company}_${timestamp}.html`;
    const filePath = path.join(LANDINGS_DIR, filename);

    try {
        const messages = [
            { role: 'system', content: 'Eres un experto en crear landing pages HTML profesionales. Genera SOLO el código HTML sin explicaciones adicionales.' },
            { role: 'user', content: prompt }
        ];
        const result = await callAI(messages, 0.7);

        let html = result.trim();
        if (html.startsWith('```html')) html = html.substring(7);
        if (html.startsWith('```')) html = html.substring(3);
        if (html.endsWith('```')) html = html.substring(0, html.length - 3);
        html = html.trim();

        if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
            throw new Error('La IA no generó HTML válido. Respuesta: ' + html.substring(0, 200));
        }

        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`✅ LP: Landing guardada: ${filePath}`);

        return { success: true, filePath, filename };
    } catch (err) {
        console.error('❌ LP: Error generando landing:', err.message);
        return { success: false, error: err.message };
    }
}

/* ===========================================
   Open landing in browser (Windows)
   =========================================== */
function openLanding(filePath) {
    return new Promise((resolve) => {
        const winPath = filePath.replace(/\//g, '\\');
        exec(`start "" "${winPath}"`, (err) => {
            if (err) {
                console.warn('⚠️ LP: No se pudo abrir automáticamente:', err.message);
            }
            resolve();
        });
    });
}

module.exports = { generateLanding, openLanding };
