/* ===========================================
   BDPV Generator — Server-side
   Genera presentaciones HTML vía IA + skills
   =========================================== */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PRESENTACIONES_DIR = path.join(__dirname);

// Unsplash photo pool for presentations
const UNSPLASH_POOL = [
    { id: '1509391366360-2e959784a276', alt: 'Paneles solares' },
    { id: '1558618666-fcd25c85f82e', alt: 'Baterías de litio' },
    { id: '1519552928909-672ca2c4d6a6', alt: 'Planta de energía' },
    { id: '1466611653911-95081537e5b7', alt: 'Energía renovable' },
    { id: '1473341304170-971dccb5ac1e', alt: 'Energía eólica' },
    { id: '1508514177221-188b1cf16e9d', alt: 'Instalación solar' },
    { id: '1497440001374-f69e08f3a6f8', alt: 'Industria energética' },
    { id: '1579389083078-4e7018379f82', alt: 'Equipo de trabajo' },
    { id: '1497366216548-37526070297c', alt: 'Oficina corporativa' },
    { id: '1497366811353-6870744d04b2', alt: 'Espacio de trabajo' },
    { id: '1541888942125-2bb1070e7a07', alt: 'Construcción industrial' },
    { id: '1581091226825-a6a2a5a0b1b0', alt: 'Energía solar techo' }
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
   Build AI prompt for HTML presentation
   =========================================== */
function buildPrompt(data) {
    const { company, website, phone, region, subNicho, industry, skills, noLogo } = data;
    const skillsText = skills.length ? skills.join(', ') : 'frontend-slides, frontend-design';
    const logoInstr = noLogo ? 'NO incluir logo de la empresa' : 'Incluir el logo de la empresa si está disponible';

    const photos = getRandomPhotos(8);
    const photoMarkup = photos.map((p, i) =>
        `<img src="https://images.unsplash.com/photo-${p.id}?w=800&q=80" alt="${p.alt}" loading="lazy">`
    ).join('\n            ');

    const subtitle = [industry, subNicho, region].filter(Boolean).join(' — ');

    return `
Eres un experto en crear presentaciones HTML profesionales usando las skills: ${skillsText}.

Genera una presentación HTML completa para:

EMPRESA: ${company}
SITIO WEB: ${website || '(No especificado)'}
TELÉFONO: ${phone || '(No especificado)'}
UBICACIÓN: ${region || 'Monterrey, N.L., México'}
INDUSTRIA: ${industry || 'Energía'}
SUB-NICHO: ${subNicho || 'General'}
${logoInstr}

REQUISITOS TÉCNICOS OBLIGATORIOS:
1. Archivo HTML único, auto-contenido (CSS/JS inline)
2. 10-15 diapositivas que cubran: portada, introducción, servicios/productos, pros/contras, comparativa, mejor opción, por qué la región, contacto
3. Cada slide debe tener height: 100vh; overflow: hidden;
4. Usa clamp() para todos los tamaños de fuente y espaciado
5. Tipografía: 'Bebas Neue' para títulos, 'DM Sans' para cuerpo (Google Fonts)
6. Incluir imágenes Unsplash en AL MENOS el 50% de los slides
7. Navegación: flechas del teclado, rueda del mouse, dots laterales
8. Barra de progreso en la parte superior
9. Animaciones con clase .reveal activadas por IntersectionObserver
10. Inline editing: botón ✏️ editable con contentEditable, Ctrl+S guarda en localStorage
11. Diseño responsive con media queries para alturas 700px, 600px, 500px
12. prefers-reduced-motion support
13. Sin dependencias externas (solo Google Fonts)
14. Colores: azul (#003366) corporativo, rojo (#cc0000) acento, blanco (#ffffff) fondo
15. Incluir los números de slide tipo "01 / 12"

ESTRUCTURA DE SLIDES RECOMENDADA:
1. Portada con ${company}, subtítulo: "${subtitle}"
2. Introducción / Quiénes somos (con foto)
3. Nuestros servicios/soluciones (grid de 3 cards)
4-6. Slides de cada solución principal (concepto + pros/contras)
7. Comparativa por segmento (Negocios, Residencias, Industria)
8. Mejor combinación costo-beneficio
9. ¿Por qué ${region}? (datos locales)
10. Contacto / CTA con ${phone ? 'teléfono ' + phone : 'información de contacto'}${website ? ' y sitio web ' + website : ''}

Usa estas fotos Unsplash distribuidas en los slides:
${photoMarkup}

Genera SOLO el HTML completo, sin explicaciones, sin marcadores de código. El HTML debe ser funcional y verse profesional inmediatamente al abrirse.
`;
}

/* ===========================================
   Generate presentation
   =========================================== */
async function generatePresentation(data, callAI) {
    const prompt = buildPrompt(data);
    const company = data.company.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${company}_${timestamp}.html`;
    const filePath = path.join(PRESENTACIONES_DIR, filename);

    try {
        // Call AI via OpenRouter (reuses the same function pattern)
        const messages = [
            { role: 'system', content: 'Eres un experto en crear presentaciones HTML profesionales. Genera SOLO el código HTML sin explicaciones adicionales.' },
            { role: 'user', content: prompt }
        ];
        const result = await callAI(messages, 0.7);

        // Clean result (remove markdown code fences if any)
        let html = result.trim();
        if (html.startsWith('```html')) html = html.substring(7);
        if (html.startsWith('```')) html = html.substring(3);
        if (html.endsWith('```')) html = html.substring(0, html.length - 3);
        html = html.trim();

        // Validate it looks like HTML
        if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
            throw new Error('La IA no generó HTML válido. Respuesta: ' + html.substring(0, 200));
        }

        // Write file
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`✅ BDPV: Presentación guardada: ${filePath}`);

        return { success: true, filePath, filename };
    } catch (err) {
        console.error('❌ BDPV: Error generando presentación:', err.message);
        return { success: false, error: err.message };
    }
}

/* ===========================================
   Open file in browser (Windows)
   =========================================== */
function openPresentation(filePath) {
    return new Promise((resolve) => {
        const winPath = filePath.replace(/\//g, '\\');
        exec(`start "" "${winPath}"`, (err) => {
            if (err) {
                console.warn('⚠️ BDPV: No se pudo abrir automáticamente:', err.message);
            }
            resolve();
        });
    });
}

module.exports = { generatePresentation, openPresentation };
