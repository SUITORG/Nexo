// CMS Frontend Logic - Campañas AI
// Generador Inteligente con soporte para IA y Google Sheets

const CONFIG = {
    AI_URL: '/api/ai/generate', 
    HISTORY_URL: '/api/history', 
    TOKEN: 'SUITORG_SECURE_TOKEN_2026'
};

// Variables Globales de UI
let form, submitBtn, generateBtn, loader, btnText, toast, toastMessage;
let aiIndustry, aiSlides, aiTheme, captionField;
let aiTemplate;
let formatTabs, platformTabs, historyContainer, refreshHistoryBtn, downloadBtn;
let previewSection, carouselContainer;
let enableVoice, enableMusic, enableVideo;
let uploadedLogoDataUrl = null;
let companyConfigs = [];

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Elementos
    form = document.getElementById('cmsForm');
    submitBtn = document.getElementById('submitBtn');
    generateBtn = document.getElementById('generateBtn');
    loader = document.querySelector('.loader');
    btnText = document.querySelector('.btn-text');
    toast = document.getElementById('toast');
    toastMessage = document.getElementById('toastMessage');
    
    aiIndustry = document.getElementById('aiIndustry');
    aiTemplate = document.getElementById('aiTemplate');
    aiSlides = document.getElementById('aiSlides');
    aiTheme = document.getElementById('aiTheme');
    captionField = document.getElementById('caption');
    formatTabs = document.querySelectorAll('.format-tab');
    platformTabs = document.querySelectorAll('.platform-tab');
    historyContainer = document.getElementById('historyContainer');
    refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    downloadBtn = document.getElementById('downloadBtn');

    previewSection = document.getElementById('previewSection');
    carouselContainer = document.getElementById('carouselContainer');

    enableVoice = document.getElementById('enableVoice');
    enableMusic = document.getElementById('enableMusic');
    enableVideo = document.getElementById('enableVideo');

    // Manejador de subida de Logo
    const logoFileInput = document.getElementById('companyLogoFile');
    if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    uploadedLogoDataUrl = event.target.result;
                    // Limpiar URL si sube archivo
                    document.getElementById('companyLogo').value = "";
                };
                reader.readAsDataURL(file);
            } else {
                uploadedLogoDataUrl = null;
            }
        });
    }

    // Sincronizar Menú de Formatos
    formatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const format = tab.dataset.format;
            updateActiveTab(format);
            autoToggleMultimedia(format);
        });
    });

    // Sincronizar Menú de Redes Sociales
    platformTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            platformTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Manejador del Switch AI / BD
    document.getElementById('btnModeAi').addEventListener('click', () => setWorkMode('Ai'));
    document.getElementById('btnModeBd').addEventListener('click', () => setWorkMode('BD'));

    // Cargar historial al inicio
    fetchHistory();

    // Event Listener para Refrescar Historial
    refreshHistoryBtn.addEventListener('click', fetchHistory);

    // Event Listener para Descargar Kit
    downloadBtn.addEventListener('click', downloadCampaignKit);

    // Event Listener para Generación IA
    generateBtn.addEventListener('click', generateAIContent);

    // Event Listener para Limpiar Formulario
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            form.reset();
            carouselContainer.innerHTML = '';
            previewSection.style.display = 'none';
            captionField.value = '';
            uploadedLogoDataUrl = null;
            showToast('Formulario limpios y listos para nueva campaña', 'success');
        });
    }

    // Event Listener para Envío a Sheets
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetFormErrors();

        const formData = getFormData();
        if (!validateFormData(formData)) return;

        setLoading(true);

        try {
            // Nota: Para GAS en producción, usamos 'no-cors' para evitar bloqueos del navegador.
            const fetchOptions = {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'text/plain' }, 
                body: JSON.stringify(formData)
            };

            await fetch(CONFIG.HISTORY_URL, fetchOptions);
            
            showToast('✅ Solicitud enviada a Google Sheets', 'success');
            console.log('📡 [GAS_SENT]: Los datos fueron enviados (modo opaco)');
            form.reset();
            document.getElementById('token').value = CONFIG.TOKEN;
            
            // Actualizar historial después de un pequeño delay para que GAS termine de escribir
            setTimeout(fetchHistory, 2000);

        } catch (error) {
            console.error('Fetch Error:', error);
            if (error.message === "Failed to fetch") {
                showToast('❌ Error de conexión: ¿El servidor está encendido?', 'error');
            } else {
                showToast(`❌ ${error.message}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    });
});

async function generateAIContent() {
    const industry = aiIndustry.value;
    const template = aiTemplate.value;
    const slides = aiSlides.value;
    const theme = aiTheme.value;
    const company = document.getElementById('companyName').value.trim();
    const platform = document.querySelector('.platform-tab.active').dataset.platform;
    const format = document.querySelector('.format-tab.active').dataset.format;
    const phone = document.getElementById('contactPhone').value.trim();

    // Límites de texto según el formato para evitar textos cortados
    let lengthRule = "";
    if (format === 'Reel' || format === 'Story') {
        lengthRule = "- MÁXIMO 15 a 20 palabras por slide en el Cuerpo. MUY conciso, texto grande en pantalla.";
    } else {
        lengthRule = "- MÁXIMO 30 palabras por slide en el Cuerpo. Sé claro y directo.";
    }

    if (!company) {
        showToast('❌ Escribe el nombre de la empresa/marca arriba', 'error');
        document.getElementById('companyName').focus();
        return;
    }

    if (!theme) {
        showToast('❌ Escribe un tema para generar el contenido', 'error');
        aiTheme.focus();
        return;
    }

    setAiLoading(true);

    // 📝 CONSTRUCCIÓN DEL PROMPT MAESTRO (JSON)
    const systemPrompt = `# PERSONA
Actúa como un Copywriter Maestro en Conversión y Especialista en Branding dinámico.

# CONTEXTO Y MERCADO
- Empresa: ${company} (Nicho: ${industry}).
- Tema de Publicación: "${theme}" (Todo el contenido debe desarrollarse desde aquí).
- Formato de Estrategia: ${template}.

# PASOS (CHAIN OF THOUGHT)
1. Define el ángulo narrativo según la plantilla ${template}.
2. Redacta un post caption persuasivo con hashtags.
3. Estructura exactamente ${slides} slides: (1. Gancho, 2. Valor, 3. Desarrollo, 4... N-1. Beneficios, N. Cierre/CTA).

# RESTRICCIONES (RAILS)
- Idioma: Español de México/Latinoamérica.
- ${lengthRule}
- **OBLIGATORIO**: Incluir el número de slide entre paréntesis al INICIO de cada título (ej: "(1) Título Impactante").
- **SERÁS PENALIZADO** si el contenido no es 100% relevante al nicho ${industry} y al tema "${theme}".

# REGLAS VISUALES (EVITAR GENÉRICOS)
- **PROHIBIDO**: Frases como "a happy person", "looking at camera", "isolated on white".
- **OBLIGATORIO**: Describe ángulos dramáticos, detalles técnicos o escenas de acción real.
- **TÉCNICA**: Especifica iluminación (Golden Hour, Cinematic Moody), Lente (85mm bokeh, Macro) y Atmósfera (Industrial, Luxury) en el campo "visual".
- **IDIOMA**: Prompt del campo "visual" en INGLÉS técnico de fotografía.

# PLANTILLA DE SALIDA (JSON)
{
  "caption": "Texto del post...",
  "slides": [
    { "title": "(1) Título", "body": "Cuerpo del slide...", "visual": "Professional photo of..." }
  ]
}

# NOTAS IMPORTANTES
- Genera exactamente ${slides} slides.
- El contenido DEBE ser una mezcla perfecta entre el tema "${theme}" y el estilo "${template}".`;

    const userPrompt = `Generar campaña de ${slides} slides para ${platform} en formato ${format}. CTA final: ${phone || 'Interacción en redes'}. ¡Responde estrictamente con JSON!`;

    try {
        const response = await fetch(CONFIG.AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status} en el servidor`);
        }

        const data = await response.json();
        let generatedJson;
        
        try {
            const rawContent = data.choices[0].message.content.trim();
            // Limpiar posibles bloques de código de markdown si la IA los incluye
            const jsonStr = rawContent.startsWith('```') ? rawContent.replace(/```json|```/g, '') : rawContent;
            generatedJson = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Error parseando JSON de IA:", e);
            throw new Error("La IA no devolvió un formato válido. Prueba de nuevo.");
        }
        
        // 1. Llenar el pie de foto (Caption)
        captionField.value = generatedJson.caption;
        
        // 2. Renderizar el carrusel usando la nueva función JSON
        renderCarouselFromJson(generatedJson);
        
        showToast('✨ ¡Contenido Maestro Generado!', 'success');

    } catch (error) {
        console.error('AI Error:', error);
        showToast(`❌ IA: ${error.message}`, 'error');
    } finally {
        setAiLoading(false);
    }
}

function updateActiveTab(format) {
    formatTabs.forEach(tab => {
        if (tab.dataset.format === format) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function getFormData() {
    const company = document.getElementById('companyName').value.trim();
    const platform = document.querySelector('.platform-tab.active').dataset.platform;
    const format = document.querySelector('.format-tab.active').dataset.format;
    
    return {
        caption: captionField.value.trim(),
        mediaUrl: document.getElementById('mediaUrl').value.trim(),
        postDate: document.getElementById('postDate').value,
        status: `${company}, ${platform}, ${format}, ${document.getElementById('aiTemplate').value}`, 
        token: document.getElementById('token').value,
        options: {            voice: enableVoice.checked,
            music: enableMusic.checked,
            video: enableVideo.checked
        }
    };
}

function autoToggleMultimedia(format) {
    if (format === 'Reel' || format === 'Story') {
        enableVoice.checked = true;
        enableMusic.checked = true;
        enableVideo.checked = true;
    } else {
        enableVoice.checked = false;
        enableMusic.checked = false;
        enableVideo.checked = false;
    }
}

function validateFormData(data) {
    if (!data.caption) {
        showToast('❌ El contenido es obligatorio', 'error');
        captionField.focus();
        return false;
    }
    if (!data.postDate) {
        showToast('❌ Selecciona fecha y hora', 'error');
        return false;
    }
    return true;
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (loader) loader.style.display = isLoading ? 'block' : 'none';
    btnText.style.opacity = isLoading ? '0.5' : '1';
}

function setAiLoading(isLoading) {
    generateBtn.disabled = isLoading;
    const genLoader = document.querySelector('.gen-loader');
    const genText = document.querySelector('.gen-text');
    if (genLoader) genLoader.style.display = isLoading ? 'block' : 'none';
    if (genText) genText.style.opacity = isLoading ? '0.5' : '1';
}

function showToast(message, type) {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function renderCarouselPreview(text) {
    carouselContainer.innerHTML = '';
    previewSection.style.display = 'block';

    // Dividimos por "Slide" o "Diapositiva" o números seguidos de punto
    const slides = text.split(/(?=Slide|Diapositiva|\n\d+\.)/i).filter(s => s.trim().length > 10);

    const format = document.querySelector('.format-tab.active').dataset.format;
    const userLogoUrl = document.getElementById('companyLogo').value.trim();
    const finalLogoUrl = uploadedLogoDataUrl || userLogoUrl; 

    slides.forEach((slideText, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'carousel-slide';
        if (format === 'Reel' || format === 'Story') {
            slideEl.classList.add('reel-mode');
        }
        
        // Intentamos extraer Título, Cuerpo y Visual
        const lines = slideText.split('\n').filter(l => l.trim().length > 0);
        let title = "Slide " + (index + 1);
        let body = slideText;
        let visual = "";

        if (lines.length >= 2) {
            // Remueve explícitamente Slide X, Diapositiva X, números iniciales como "1:", "2.", y asteriscos Markdown
            title = lines[0].replace(/^\s*[*#]*\s*(?:Slide|Diapositiva|\d+)?\s*[:.\-]?\s*/i, '').replace(/[*#]/g, '').trim();
            
            // Buscar sugerencia visual explícitamente y de forma unificada
            const visualRegex = /(?:Sugerencia Visual|Imagen|Visual|Foto)[^:]*:\s*(.*)/i;
            const visualMatch = slideText.match(visualRegex);
            if (visualMatch) {
                visual = visualMatch[1].trim();
            }
            
            // Asegurarse de remover del body la sugerencia y el body contenga los breaks
            const filteredLines = lines.slice(1).filter(l => !visualRegex.test(l));
            // Remover explícitamente el prefijo "Cuerpo: " si existe
            body = filteredLines.join('<br>').replace(/^(?:Cuerpo|Texto|Body)[:\s]*/i, '').trim();
        }

        // Usamos la sugerencia en inglés (si la IA la dio) para un mejor resultado, o el título si no.
        let searchTerms = visual || title;
        searchTerms = searchTerms.replace(/[\/\\#'"]/g, ' ').trim(); // Limpiar quotes

        const seed = Math.floor(Math.random() * 100000);
        
        // Mejorar la calidad de la cadena de búsqueda eliminando conectores
        const rawKeywords = searchTerms.replace(/photorealistic|image|of|a|showing|illustration/gi, '').trim();
        // Usamos solo las palabras para pollinations para no sobrecargarlo
        const keyword = encodeURIComponent(rawKeywords + ", high resolution");
        
        const imageSources = [
            `https://image.pollinations.ai/prompt/${keyword}?width=600&height=600&seed=${seed}&nologo=true`,
            `https://loremflickr.com/600/600/${encodeURIComponent(searchTerms.split(' ')[0])}?lock=${seed}`, // Solo la primera palabra real para flickr
            `https://picsum.photos/seed/${seed}/600/600`
        ];

        const slideId = `slide-${index}-${seed}`;
        slideEl.innerHTML = `
            <div id="loader-${slideId}" class="image-loading-state">
                <div class="clock-loader"></div>
                <div class="loading-text">GENERANDO IMAGEN...</div>
            </div>
            ${finalLogoUrl ? `<img src="${finalLogoUrl}" class="slide-logo" alt="logo">` : ''}
            <div class="slide-image" id="${slideId}"></div>
            <div class="slide-overlay">
                <div class="voice-player">
                    <button class="voice-btn" onclick="speakText('${body.replace(/'/g, "\\'")}', this)" title="Escuchar Texto y Música">🔊</button>
                </div>
                <div class="slide-number">Slide ${index + 1}</div>
                <div class="slide-title">${title}</div>
                <div class="slide-body">${body}</div>
                ${visual ? `<div class="slide-visual">📸 Imagen: ${visual}</div>` : ''}
            </div>
        `;
        carouselContainer.appendChild(slideEl);

        // Lógica de carga con fallbacks
        tryLoadImage(slideId, imageSources);
    });

    previewSection.scrollIntoView({ behavior: 'smooth' });
}

function tryLoadImage(elementId, sources, index = 0) {
    const el = document.getElementById(elementId);
    const loader = document.getElementById(`loader-${elementId}`);
    
    // Obtener el color de la marca dinámico
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1e293b';

    if (index >= sources.length) {
        console.warn('❌ Fuentes agotadas. Aplicando fondo sólido premium de marca.');
        if (el) {
            el.style.backgroundImage = 'none';
            el.style.backgroundColor = brandColor;
            el.style.background = `linear-gradient(135deg, ${brandColor} 0%, #000000 100%)`;
            el.innerHTML += `<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.1; font-size:5rem; font-weight:bold; letter-spacing:-2px; pointer-events:none;">BRAND</div>`;
        }
        if (loader) loader.classList.add('hidden');
        return;
    }

    const img = new Image();
    let cleanUrl = sources[index];
    
    // Limpiar Google Drive
    if (cleanUrl.includes('drive.google.com') && !cleanUrl.includes('uc?')) {
        cleanUrl = cleanUrl.replace('file/d/', 'uc?id=').split('/view')[0];
    }
    
    img.src = cleanUrl;

    img.onload = () => {
        if (el) {
            el.style.backgroundImage = `url('${cleanUrl}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            
            // Actualizar etiqueta de fuente para diagnóstico
            const sourceTag = document.getElementById(`source-${elementId}`);
            if (sourceTag) {
                if (cleanUrl.includes('pollinations')) sourceTag.innerText = '[POLLINATIONS]';
                else if (cleanUrl.includes('unsplash')) sourceTag.innerText = '[UNSPLASH]';
                else if (cleanUrl.includes('flickr')) sourceTag.innerText = '[FLICKR]';
                else sourceTag.innerText = '[EXTERNAL]';
                sourceTag.style.color = '#10b981';
            }
        }
        if (loader) loader.classList.add('hidden');
    };

    img.onerror = () => {
        console.warn(`⚠️ Fuente ${index + 1} falló, intentando vector siguiente...`);
        tryLoadImage(elementId, sources, index + 1);
    };
}

async function fetchHistory() {
    try {
        refreshHistoryBtn.classList.add('spinning');
        const response = await fetch(CONFIG.HISTORY_URL);
        const data = await response.json();
        
        refreshHistoryBtn.classList.remove('spinning');

        if (data.status === 'success') {
            renderHistory(data.data);
        } else {
            console.warn('GAS Error:', data.message);
            historyContainer.innerHTML = `<div class="empty-state" style="color:var(--error)">⚠️ Error en Google: ${data.message} <br><small>Revisa que el script esté publicado para "Cualquiera" (Anyone).</small></div>`;
        }
    } catch (error) {
        console.error('Error fetching history:', error);
    } finally {
        refreshHistoryBtn.classList.remove('spinning');
    }
}

function renderHistory(items) {
    if (!items || items.length === 0) {
        historyContainer.innerHTML = '<div class="empty-state">No hay publicaciones recientes.</div>';
        return;
    }

    historyContainer.innerHTML = '';
    // Mostrar de más reciente a más vieja
    const sortedItems = [...items].reverse();
    
    sortedItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        // Limpiar caption para el título
        const title = item.caption ? item.caption.substring(0, 80) + '...' : 'Sin contenido';
        const date = item.fecha ? new Date(item.fecha).toLocaleString() : 'Fecha desconocida';
        
        // Si no hay imagen, usar una por defecto basada en el tema o pollinations
        const imageUrl = item.mediaurl || `https://image.pollinations.ai/prompt/${encodeURIComponent(item.status || 'social media')}?width=300&height=200&seed=1&nologo=true`;

        card.innerHTML = `
            <div class="history-card-image" style="background-image: url('${imageUrl}')"></div>
            <div class="history-card-content">
                <div class="history-card-meta">${item.status || 'General'}</div>
                <div class="history-card-title">${title}</div>
                <div class="history-card-date">📅 ${date}</div>
            </div>
        `;
        historyContainer.appendChild(card);
    });
}

function resetFormErrors() {}

async function downloadCampaignKit() {
    const caption = captionField.value;
    const slides = document.querySelectorAll('.carousel-slide');
    const company = (document.getElementById('companyName').value || 'campana').replace(/\s+/g, '_').toLowerCase();
    
    if (!caption || slides.length === 0) {
        showToast('❌ No hay contenido suficiente para descargar', 'error');
        return;
    }

    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px;"></div> PREPARANDO...';

    showToast(`🚀 Generando Kit (${slides.length} slides)... Por favor espera`, 'info');

    // 1. Descargar Texto del Caption (Instantáneo)
    const textBlob = new Blob([caption], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    downloadFile(textUrl, `caption_${company}.txt`);

    // 2. Descargar Imágenes del Carrusel
    if (typeof html2canvas !== 'undefined') {
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            
            // UI Feedback
            downloadBtn.innerHTML = `<div class="loader" style="display:inline-block; margin-right:8px;"></div> ${i+1}/${slides.length}`;

            // Ocultar elementos de UI temporalmente
            const voiceBtn = slide.querySelector('.voice-player');
            const visualTag = slide.querySelector('.slide-visual');
            const slideNumberTag = slide.querySelector('.slide-number');
            
            if (voiceBtn) voiceBtn.style.visibility = 'hidden';
            if (visualTag) visualTag.style.visibility = 'hidden';
            if (slideNumberTag) slideNumberTag.style.visibility = 'hidden';

            try {
                const canvas = await html2canvas(slide, {
                    scale: 1.5, // Balance perfecto: nítido pero mucho más rápido
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#0f172a'
                });

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                downloadFile(dataUrl, `slide_${i + 1}_${company}.jpg`);
                
                // Pequeña pausa para permitir que el navegador respire
                await new Promise(r => setTimeout(r, 250)); 
            } catch (err) {
                console.error('Error renderizando slide:', err);
            } finally {
                // Restaurar visibilidad
                if (voiceBtn) voiceBtn.style.visibility = 'visible';
                if (visualTag) visualTag.style.visibility = 'visible';
                if (slideNumberTag) slideNumberTag.style.visibility = 'visible';
                
                const newVisualTag = slide.querySelector('.slide-visual');
                if (newVisualTag) newVisualTag.style.visibility = 'visible';
            }
        }
        showToast('✅ ¡Kit descargado exitosamente!', 'success');
    } else {
        showToast('❌ Error: Librería de renderizado no disponible', 'error');
    }
    
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalHTML;
}

function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function downloadExternalImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objUrl = URL.createObjectURL(blob);
        downloadFile(objUrl, filename);
        // Pequeño delay para no saturar el navegador con múltiples decargas simultáneas
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {
        console.error('Error downloading image:', e);
        // Fallback: abrir en nueva pestaña si falla el fetch (CORS)
        window.open(url, '_blank');
    }
}

// Lógica de Voz - Web Speech API con Toggles Inteligentes
function speakText(text, btn) {
    const isVoiceEnabled = document.getElementById('enableVoice').checked;
    const isMusicEnabled = document.getElementById('enableMusic').checked;

    if (!isVoiceEnabled && !isMusicEnabled) {
        showToast('Debes encender "Generar Voz" o "Música de fondo" arriba', 'warning');
        return;
    }

    // Cancelar/Pausar si ya está hablando/sonando
    if (window.speechSynthesis.speaking || (bgMusic && !bgMusic.paused)) {
        window.speechSynthesis.cancel();
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
        if (btn.classList.contains('speaking')) {
            btn.classList.remove('speaking');
            return;
        }
    }

    // Preparar UI
    btn.classList.add('speaking');
    let hasVoiceFinished = !isVoiceEnabled;
    let hasMusicFinished = !isMusicEnabled;

    const stopAll = () => {
        if (hasVoiceFinished && hasMusicFinished) {
            btn.classList.remove('speaking');
            if (bgMusic) {
                bgMusic.pause();
                bgMusic.currentTime = 0;
            }
        }
    }

    // Disparar Música
    if (isMusicEnabled) {
        if (!bgMusic) {
            bgMusic = new Audio('https://cdn.pixabay.com/download/audio/2022/02/10/audio_fcbb47aeb4.mp3'); 
            bgMusic.loop = true;
        }
        // Baja volumen si hay voz al mismo tiempo, sube si es solo musica
        bgMusic.volume = isVoiceEnabled ? 0.15 : 0.6; 
        
        bgMusic.play().catch(e => console.log('Audio error:', e));

        // Si solo es música, duramos 10 segundos
        if (!isVoiceEnabled) {
            setTimeout(() => {
                hasMusicFinished = true;
                stopAll();
            }, 10000);
        }
    }

    // Disparar Voz
    if (isVoiceEnabled && 'speechSynthesis' in window) {
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/<br>/gi, ' '); 
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        
        // Ajuste de velocidad acelerado solicitado para videos
        const postFormatValue = document.querySelector('.format-tab.active').dataset.format;
        if (postFormatValue === 'Reel' || postFormatValue === 'Story') {
            utterance.rate = 1.5;
        } else {
            utterance.rate = 1.0;
        }
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) 
                             || voices.find(v => v.lang.includes('es'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            hasVoiceFinished = true;
            hasMusicFinished = true; // Forzamos música off si la voz acaba
            stopAll();
        };

        utterance.onerror = () => {
            hasVoiceFinished = true;
            hasMusicFinished = true;
            stopAll();
        };

        window.speechSynthesis.speak(utterance);
    }
}

async function loadCompanies() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        if (data.status === 'success') {
            companyConfigs = data.data;
            const select = document.getElementById('companyName');
            if (select && select.tagName === 'SELECT') {
                select.innerHTML = '<option value="">-- Seleccionar Empresa --</option>';
                companyConfigs.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.nomempresa;
                    opt.textContent = c.nomempresa;
                    select.appendChild(opt);
                });
                console.log("🏢 Empresas cargadas correctamente");
            }
        }
    } catch (e) {
        console.warn("⚠️ No se pudieron cargar las empresas");
    }
}

function setWorkMode(mode) {
    const aiBtn = document.getElementById('btnModeAi');
    const bdBtn = document.getElementById('btnModeBd');
    const container = document.getElementById('companyInputContainer');
    
    if (mode === 'Ai') {
        aiBtn.classList.add('active');
        bdBtn.classList.remove('active');
        console.log("🤖 Modo actual: Inteligencia Artificial (Manual)");
        
        // Cambiar a Input de Texto
        container.innerHTML = `
            <label for="companyName">Empresa / Marca</label>
            <input type="text" id="companyName" placeholder="Nombre de la marca..." required>
        `;
    } else {
        bdBtn.classList.add('active');
        aiBtn.classList.remove('active');
        console.log("📊 Modo actual: Base de Datos (Automático)");
        
        // Cambiar a Select
        container.innerHTML = `
            <label for="companyName">Empresa / Marca</label>
            <select id="companyName">
                <option value="">-- Cargando desde BD... --</option>
            </select>
        `;
        
        // Cargar datos y añadir listener de autocompletado
        loadCompanies().then(() => {
            const select = document.getElementById('companyName');
            if (select) {
                select.addEventListener('change', (e) => {
                    const empresaSeleccionada = e.target.value;
                    const selected = companyConfigs.find(c => c.nomempresa === empresaSeleccionada);
                    
                    if (selected) {
                        console.log("🔍 [BD] Datos encontrados para:", empresaSeleccionada, selected);
                        
                        // Función para buscar valor en el objeto ignorando pequeñas variaciones de nombre
                        const findVal = (keys) => {
                            const foundKey = Object.keys(selected).find(k => 
                                keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
                            );
                            return foundKey ? selected[foundKey] : null;
                        };

                        // 1. Logo
                        const logo = findVal(['logo_url', 'logo']);
                        document.getElementById('companyLogo').value = logo || "";
                        
                        // 2. Teléfono (Busca cualquier columna que mencione "tel" o "whatsapp" o "whas")
                        const tel = findVal(['telefonowhastapp', 'telefonowhasapp', 'telefono', 'tel', 'whatsapp', 'whas']);
                        document.getElementById('contactPhone').value = tel || "";

                        // 3. Sitio Web (Prioridad absoluta a enlace_oficial)
                        const web = findVal(['enlace_oficial', 'url_oficial', 'website', 'enlace']) || "";
                        document.getElementById('webSite').value = (web && web.toString().startsWith('http')) ? web : "";
                        
                        // 4. Color de Tema
                        const color = findVal(['color_tema', 'color', 'tema']);
                        if (color) {
                            document.documentElement.style.setProperty('--primary', color);
                            document.documentElement.style.setProperty('--primary-hover', color + 'dd');
                            showToast(`Configuración de ${empresaSeleccionada} cargada`, 'success');
                        }
                    } else {
                        // Limpiar si no hay selección
                        document.getElementById('companyLogo').value = "";
                        document.getElementById('contactPhone').value = "";
                        document.getElementById('webSite').value = "";
                    }
                });
            }
        });
    }
}

function renderCarouselFromJson(data) {
    if (!data || !data.slides) return;
    carouselContainer.innerHTML = '';
    const format = document.querySelector('.format-tab.active').dataset.format;
    const isReel = (format === 'Reel' || format === 'Story');
    const userLogoUrl = document.getElementById('companyLogo').value.trim();
    const industry = aiIndustry.value;
    const theme = aiTheme.value;

    data.slides.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = `carousel-slide ${isReel ? 'reel-mode' : ''}`;
        
        const slideId = `slide-img-${index}-${Date.now()}`;

        slideEl.innerHTML = `
            <div id="loader-${slideId}" class="image-loading-state">
                <div class="clock-loader"></div>
                <div class="loading-text">BUSCANDO MEJOR OPCIÓN...</div>
            </div>
            ${userLogoUrl ? `<img src="${userLogoUrl}" class="slide-logo" alt="logo">` : ''}
            <div class="slide-image" id="${slideId}"></div>
            <div class="slide-overlay">
                <div class="slide-controls" style="position: absolute; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; z-index: 10;">
                    <button class="voice-btn" onclick="speakText('${slide.body.replace(/'/g, "\\'")}', this)" title="Escuchar">🔊</button>
                    <button class="refresh-img-btn" onclick="regenerateSlideImage('${slideId}', '${slide.visual.replace(/'/g, "\\'")}', '${industry}', '${theme}')" 
                            style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); color:white; width:35px; height:35px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px); transition:all 0.3s;"
                            onmouseover="this.style.background='var(--primary)'; this.style.borderColor='var(--primary)';"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.borderColor='rgba(255,255,255,0.3)';"
                            title="Cambiar Foto">🔄</button>
                </div>
                <div class="slide-number">Slide ${index + 1}</div>
                <div class="slide-title">${slide.title}</div>
                <div class="slide-body">${slide.body}</div>
                <div class="slide-visual" style="font-size:0.65rem; background: rgba(255,255,0,0.15); border: 1px solid rgba(255,255,0,0.3); padding: 5px; border-radius: 4px; color: yellow; margin-top:0.5rem;">
                   <span id="source-${slideId}" style="float:right; opacity:0.7; border:1px solid; padding:1px 4px; border-radius:3px; font-size:0.5rem; margin-left:5px;">[Buscando...]</span>
                   🎨 Concepto: ${slide.visual}
                </div>
            </div>
        `;
        carouselContainer.appendChild(slideEl);

        // --- VECTOR MAESTRO DE FUENTES AGRESIVO ---
        loadSlideImage(slideId, slide.visual, industry, theme);
    });

    previewSection.style.display = 'block';
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Nueva función unificada de carga con anclaje de contexto (Buscando Máxima Calidad Google)
async function loadSlideImage(slideId, visual, industry, theme, seedOverride = null) {
    const seed = seedOverride || Math.floor(Math.random() * 1000000);
    const ts = Date.now();
    const el = document.getElementById(slideId);
    
    // 1. Limpieza de Concepto
    const companyName = document.getElementById('companyName')?.value || "";
    let coreConcept = visual.replace(new RegExp(companyName, 'gi'), '')
                            .replace(/photo|8k|realistic|cinematic|professional|hyperdetailed|masterpiece|photorealistic/gi, '');
    coreConcept = coreConcept.split(',')[0].trim();

    // --- PRIORIDAD #1: GOOGLE IMAGEN 3 (PREMIUM) ---
    try {
        console.log("💎 Intentando generar con Google Imagen 3...");
        const response = await fetch('/api/ai/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `${industry} ${theme} ${visual}, high resolution, 8k, professional photography` })
        });
        
        const data = await response.json();
        if (data.status === 'success' && data.image) {
            console.log("✅ Imagen de Google recibida con éxito!");
            const sourceTag = document.getElementById(`source-${slideId}`);
            if (sourceTag) {
                sourceTag.innerText = '[GOOGLE]';
                sourceTag.style.color = '#4285f4';
            }
            if (el) {
                el.style.backgroundImage = `url('${data.image}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
            const loader = document.getElementById(`loader-${slideId}`);
            if (loader) loader.classList.add('hidden');
            return; // Éxito total
        }
    } catch (err) {
        console.warn("⚠️ Google Imagen 3 falló o no está listo. Saltando al vector de respaldo...");
    }

    // --- VECTOR DE RESPALDO (Vitamina con FLUX) ---
    const imageSources = [
        // Fuente 1: Pollinations con modelo FLUX (Calidad similar a Midjourney)
        `https://image.pollinations.ai/prompt/${encodeURIComponent(coreConcept + " style of professional commercial photography, 8k, cinematic lighting")}?width=600&height=800&seed=${seed}&model=flux&nologo=true`,
        
        // Fuente 2: LoremFlickr (Búsqueda contextual)
        `https://loremflickr.com/600/800/${encodeURIComponent(coreConcept.split(' ')[0])}?lock=${seed}`,
        
        // Fuente 3: Unsplash Direct (Si nada funciona)
        `https://images.unsplash.com/photo-1504384308090-c89e9595802b?auto=format&fit=crop&w=600&q=60`
    ];
    
    tryLoadImage(slideId, imageSources);
}

function regenerateSlideImage(slideId, visual, industry, theme) {
    const loader = document.getElementById(`loader-${slideId}`);
    if (loader) loader.classList.remove('hidden');
    loadSlideImage(slideId, visual, industry, theme, Math.floor(Math.random() * 999999));
}

// --- ACTIVACIÓN DE BOTONES DE MODO (BD / AI) ---
document.getElementById('btnModeAi')?.addEventListener('click', () => setWorkMode('Ai'));
document.getElementById('btnModeBd')?.addEventListener('click', () => setWorkMode('Bd'));

// Carga inicial de empresas si está en modo BD
loadCompanies();
