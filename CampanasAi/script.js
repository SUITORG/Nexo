// CMS Frontend Logic - Campañas AI
// Generador Inteligente con soporte para IA y Google Sheets

const CONFIG = {
    AI_URL: '/api/ai/generate', 
    HISTORY_URL: '/api/history', 
    TOKEN: 'SUITORG_SECURE_TOKEN_2026',
    DRIVE_API_KEY: 'AIzaSyCWfxEjPwtOwAR7QQOscS0e-180st_W35Q',  // Google Cloud API Key (Picker API)
    DRIVE_CLIENT_ID: '136483197929-6rma46r0oc4d1bp39ti7vr4s7vjvah3n.apps.googleusercontent.com',  // OAuth 2.0 Client ID
    DRIVE_APP_ID: '136483197929'                               // Google Cloud Project Number
};

// Variables Globales de UI
let form, submitBtn, generateBtn, loader, btnText, toast, toastMessage;
let aiIndustry, aiSlides, aiTheme, captionField;
let aiTemplate, aiEspecializacion;
let formatTabs, platformTabs, historyContainer, refreshHistoryBtn, downloadBtn;
let previewSection, carouselContainer;
let enableVoice, enableMusic, enableVideo;
let currentMode = 'Ai';
let uploadedLogoDataUrl = null;
let companyConfigs = [];
let bdUploadedPhotos = [];

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
    aiEspecializacion = document.getElementById('aiEspecializacion');
    aiTemplate = document.getElementById('aiTemplate');
    aiSlides = document.getElementById('aiSlides');
    aiTheme = document.getElementById('aiTheme');
    const aiConciencia = document.getElementById('aiConciencia');
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
    const enableAnimation = document.getElementById('enableAnimation');
    const animationOptions = document.getElementById('animationOptions');
    if (enableAnimation && animationOptions) {
        enableAnimation.addEventListener('change', () => {
            animationOptions.style.display = enableAnimation.checked ? 'flex' : 'none';
        });
    }

    // Sugerencia automática del tema según conciencia, industria y plantilla
    const INDUSTRY_LABELS = {
        abogados: 'el mundo legal', agricultura: 'la agricultura',
        clinicas_medicas: 'la salud', construccion: 'la construcción',
        consultoria_coaching: 'la consultoría y el coaching',
        dentistas: 'la odontología', despachos_contables: 'la contabilidad',
        ecommerce: 'el e-commerce', educacion: 'la educación',
        energia_solar: 'la energía solar', almacenamiento_energia: 'el almacenamiento de energía',
        hoteles_turismo: 'el turismo', manufacturera: 'la manufactura',
        inmobiliarias: 'el sector inmobiliario', logistica_transporte: 'la logística',
        mascotas: 'las mascotas', pastelerias: 'la pastelería',
        restaurantes: 'la gastronomía', salud_bienestar: 'el bienestar',
        software: 'el software', tecnologia: 'la tecnología',
        tornos_maquinado: 'el maquinado industrial', otro: 'tu industria'
    };
    const INDUSTRIAS_DATA = { clasificacion: [] };
    const INDUSTRIA_CATEGORIA = {};
    const ESPECIALIZACIONES = {};
    const initCategoriaLookup = (data) => {
        INDUSTRIAS_DATA.clasificacion = data.clasificacion;
        data.clasificacion.forEach(grupo => {
            grupo.subclasificaciones.forEach(sub => {
                INDUSTRIA_CATEGORIA[sub.valor] = grupo.categoria;
                ESPECIALIZACIONES[sub.valor] = sub.especializaciones || [];
            });
        });
    };
    const CONCIENCIA_SUGGEST = {
        Inconsciente: ['¿Sabías que...?', 'Lo que nadie te dice sobre', 'La verdad oculta de'],
        Consciente_Problema: ['¿Estás cometiendo este error en', 'El problema oculto en', 'Por qué sigues perdiendo oportunidades en'],
        Consciente_Solucion: ['Cómo mejorar ', 'La solución definitiva para', 'Transforma '],
        Consciente_Producto: ['Por qué elegir ', 'La mejor opción en', 'Todo lo que necesitas saber sobre'],
        Mas_Consciente: ['Oferta exclusiva: ', 'Última oportunidad para', 'Descuento especial en']
    };
    function getCategoriaIndustria(valor) {
        return INDUSTRIA_CATEGORIA[valor] || '';
    }
    function getEspecializaciones(valor) {
        return ESPECIALIZACIONES[valor] || [];
    }
    function updateEspecializacionSelect() {
        const ind = aiIndustry.value;
        const list = getEspecializaciones(ind);
        aiEspecializacion.innerHTML = '<option value="">-- Especialización --</option>';
        if (list.length > 0) {
            list.forEach(esp => {
                const opt = document.createElement('option');
                opt.value = esp;
                opt.textContent = esp;
                aiEspecializacion.appendChild(opt);
            });
            aiEspecializacion.style.display = '';
        } else {
            aiEspecializacion.style.display = 'none';
        }
        aiEspecializacion.value = '';
    }
    function suggestTheme() {
        const c = aiConciencia.value;
        const ind = aiIndustry.value;
        const indLabel = INDUSTRY_LABELS[ind] || 'tu sector';
        const esp = aiEspecializacion.value;
        const phrases = CONCIENCIA_SUGGEST[c] || ['Estrategia para'];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        aiTheme.value = esp ? `${phrase} ${esp} en ${indLabel}` : `${phrase} ${indLabel}`;
    }
    function showCategoriaHint() {
        const hint = document.getElementById('industriaCategoriaHint');
        if (!hint) return;
        const cat = getCategoriaIndustria(aiIndustry.value);
        hint.textContent = cat ? `Categoría: ${cat}` : '';
    }
    aiConciencia.addEventListener('change', suggestTheme);
    aiIndustry.addEventListener('change', () => { updateEspecializacionSelect(); suggestTheme(); showCategoriaHint(); });
    aiEspecializacion.addEventListener('change', suggestTheme);
    aiTemplate.addEventListener('change', suggestTheme);
    suggestTheme();

    // Elementos de Fotos de BD
    const bdPhotosContainer = document.getElementById('bdPhotosContainer');
    const bdPhotosInput = document.getElementById('bdPhotosInput');
    const bdPhotosPreview = document.getElementById('bdPhotosPreview');
    const clearBdPhotosBtn = document.getElementById('clearBdPhotosBtn');
    
    // Función para actualizar etiqueta de cantidad de fotos esperadas
    window.updateBdPhotosLabel = function() {
        const slidesCount = parseInt(aiSlides.value) || 1;
        const bdPhotosLabel = document.getElementById('bdPhotosLabel');
        if (bdPhotosLabel) {
            bdPhotosLabel.innerHTML = `Fotos del Carrusel (Locales) - <span style="color:var(--primary)">Sube hasta ${slidesCount} foto${slidesCount > 1 ? 's' : ''}</span> (secuencial según slide)`;
        }
    };

    // Escuchar cambios en la cantidad de slides para actualizar la etiqueta
    if (aiSlides) {
        aiSlides.addEventListener('input', () => {
            if (typeof window.updateBdPhotosLabel === 'function') {
                window.updateBdPhotosLabel();
            }
        });
    }

    // Manejador de subida de fotos BD
    if (bdPhotosInput) {
        bdPhotosInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            const slidesCount = parseInt(aiSlides.value) || 1;
            
            // Limitar las fotos a subir según el número de slides
            const filesToProcess = files.slice(0, slidesCount);
            
            bdUploadedPhotos = [];
            if (bdPhotosPreview) bdPhotosPreview.innerHTML = '';

            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resolve(event.target.result);
                    reader.readAsDataURL(file);
                });

                bdUploadedPhotos.push(dataUrl);

                // Agregar miniatura con etiqueta indicando el slide correspondiente
                if (bdPhotosPreview) {
                    const thumb = document.createElement('div');
                    thumb.style.position = 'relative';
                    thumb.style.width = '60px';
                    thumb.style.height = '60px';
                    thumb.style.borderRadius = '4px';
                    thumb.style.backgroundImage = `url('${dataUrl}')`;
                    thumb.style.backgroundSize = 'cover';
                    thumb.style.backgroundPosition = 'center';
                    thumb.style.border = '1px solid rgba(255,255,255,0.2)';
                    
                    const badge = document.createElement('span');
                    badge.innerText = `S${i + 1}`;
                    badge.style.position = 'absolute';
                    badge.style.bottom = '2px';
                    badge.style.right = '2px';
                    badge.style.background = 'var(--primary)';
                    badge.style.color = '#fff';
                    badge.style.fontSize = '8px';
                    badge.style.padding = '1px 3px';
                    badge.style.borderRadius = '2px';
                    badge.style.fontWeight = 'bold';

                    thumb.appendChild(badge);
                    bdPhotosPreview.appendChild(thumb);
                }
            }

            if (clearBdPhotosBtn) {
                clearBdPhotosBtn.style.display = bdUploadedPhotos.length > 0 ? 'inline-block' : 'none';
            }
        });
    }

    // Botón para limpiar fotos
    if (clearBdPhotosBtn) {
        clearBdPhotosBtn.addEventListener('click', () => {
            bdUploadedPhotos = [];
            if (bdPhotosInput) bdPhotosInput.value = '';
            if (bdPhotosPreview) bdPhotosPreview.innerHTML = '';
            clearBdPhotosBtn.style.display = 'none';
        });
    }

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

    // Google Drive Picker (Picker API con fallback a URL manual)
    const driveBtn = document.getElementById('driveLogoBtn');
    const driveModal = document.getElementById('driveModal');
    const driveInput = document.getElementById('driveLinkInput');
    const drivePreview = document.getElementById('drivePreview');
    const driveConfirm = document.getElementById('driveConfirmBtn');
    const driveCancel = document.getElementById('driveCancelBtn');

    let pickerApiLoaded = false;

    function loadGooglePickerAPI(callback) {
        if (pickerApiLoaded) { callback(); return; }
        if (typeof gapi !== 'undefined') {
            gapi.load('picker', () => {
                pickerApiLoaded = true;
                callback();
            });
        } else {
            const check = setInterval(() => {
                if (typeof gapi !== 'undefined') {
                    clearInterval(check);
                    gapi.load('picker', () => {
                        pickerApiLoaded = true;
                        callback();
                    });
                }
            }, 200);
            setTimeout(() => clearInterval(check), 15000);
        }
    }

    function openDrivePicker() {
        const hasCreds = CONFIG.DRIVE_API_KEY && CONFIG.DRIVE_CLIENT_ID;
        if (!hasCreds) {
            showToast('⚠️ Configura DRIVE_API_KEY y DRIVE_CLIENT_ID en CONFIG para usar el explorador', 'warning');
            showDriveModalFallback();
            return;
        }
        setAiLoading(true);
        loadGooglePickerAPI(() => {
            if (typeof google === 'undefined' || !google.accounts?.oauth2) {
                showToast('⚠️ Google Identity Services no cargó, usando método manual', 'warning');
                setAiLoading(false);
                showDriveModalFallback();
                return;
            }
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.DRIVE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (tokenResponse) => {
                    setAiLoading(false);
                    if (tokenResponse.access_token) {
                        const picker = new google.picker.PickerBuilder()
                            .addView(google.picker.ViewId.DOCS_IMAGES)
                            .addView(google.picker.ViewId.DOCS_VIDEOS)
                            .setOAuthToken(tokenResponse.access_token)
                            .setDeveloperKey(CONFIG.DRIVE_API_KEY)
                            .setAppId(CONFIG.DRIVE_APP_ID || CONFIG.DRIVE_CLIENT_ID.split('-')[0])
                            .setCallback((data) => {
                                if (data.action === google.picker.Action.PICKED) {
                                    const file = data.docs[0];
                                    const url = `https://drive.google.com/uc?export=view&id=${file.id}`;
                                    document.getElementById('companyLogo').value = url;
                                    uploadedLogoDataUrl = null;
                                    showToast(`✅ Logo seleccionado: ${file.name}`, 'success');
                                }
                            })
                            .build();
                        picker.setVisible(true);
                    } else {
                        showToast('❌ No se pudo autenticar con Google', 'error');
                    }
                },
                error_callback: () => {
                    setAiLoading(false);
                    showToast('❌ Error de autenticación con Google', 'error');
                }
            });
            tokenClient.requestAccessToken();
        });
    }

    function showDriveModalFallback() {
        if (driveModal) driveModal.style.display = 'flex';
        if (driveInput) driveInput.value = '';
        if (drivePreview) drivePreview.style.display = 'none';
    }
    function hideDriveModal() {
        if (driveModal) driveModal.style.display = 'none';
    }

    if (driveBtn) driveBtn.addEventListener('click', openDrivePicker);
    if (driveCancel) driveCancel.addEventListener('click', hideDriveModal);
    if (driveModal) driveModal.addEventListener('click', (e) => { if (e.target === driveModal) hideDriveModal(); });

    if (driveInput) {
        driveInput.addEventListener('input', () => {
            const raw = driveInput.value.trim();
            const url = normalizeDriveUrl(raw);
            if (url && url !== raw) driveInput.value = url;
            if (drivePreview) {
                if (url && url.match(/drive\.google\.com|uc\?|lh3\.googleusercontent\.com/)) {
                    const imgUrl = normalizeDriveUrl(url);
                    drivePreview.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<p style=color:red;font-size:0.7rem;>No se pudo previsualizar</p>'">`;
                    drivePreview.style.display = 'block';
                } else if (raw) {
                    drivePreview.innerHTML = `<img src="${raw}" style="width:100%; height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<p style=color:red;font-size:0.7rem;>No se pudo previsualizar</p>'">`;
                    drivePreview.style.display = 'block';
                } else {
                    drivePreview.style.display = 'none';
                }
            }
        });
    }

    if (driveConfirm) {
        driveConfirm.addEventListener('click', () => {
            const url = normalizeDriveUrl(driveInput.value.trim());
            if (!url) { showToast('❌ Pegá un enlace de Google Drive', 'error'); return; }
            document.getElementById('companyLogo').value = url;
            uploadedLogoDataUrl = null;
            showToast('✅ Logo desde Drive cargado', 'success');
            hideDriveModal();
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

    // Manejador del Switch AI / BD / BDPR
    document.getElementById('btnModeAi').addEventListener('click', () => setWorkMode('Ai'));
    document.getElementById('btnModeBd').addEventListener('click', () => setWorkMode('BD'));
    document.getElementById('btnModeBdpr').addEventListener('click', () => setWorkMode('BDPR'));

    // Sincronizar estado inicial
    setWorkMode('Ai');

    // Cargar clasificación de industrias
    fetch('/config/industrias.json')
        .then(r => r.json())
        .then(data => { initCategoriaLookup(data); showCategoriaHint(); updateEspecializacionSelect(); })
        .catch(() => {});

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
            bdUploadedPhotos = [];
            if (bdPhotosInput) bdPhotosInput.value = '';
            if (bdPhotosPreview) bdPhotosPreview.innerHTML = '';
            if (clearBdPhotosBtn) clearBdPhotosBtn.style.display = 'none';
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
    // --- MODO BDPR: tomar texto pegado, mostrar preview, sin IA ---
    if (currentMode === 'BDPR') {
        const text = captionField.value.trim();
        if (!text) {
            showToast('❌ Escribe o pega el contenido de la campaña', 'error');
            captionField.focus();
            return;
        }
        if (!document.getElementById('companyName').value.trim()) {
            showToast('❌ Selecciona una empresa/marca', 'error');
            return;
        }
        setAiLoading(true);
        try {
            await renderCarouselPreview(text);
            showToast('👁️ Vista previa generada', 'success');
        } catch (e) {
            showToast('❌ Error al generar preview: ' + e.message, 'error');
        } finally {
            setAiLoading(false);
        }
        return;
    }

    const industry = aiIndustry.value;
    const conciencia = document.getElementById('aiConciencia').value;
    let template = aiTemplate.value;
    
    if (!template) {
        const templateMap = {
            'Inconsciente': 'Storytelling (Narrativo)',
            'Consciente_Problema': 'Enfocado en el Dolor (Agitar Problema)',
            'Consciente_Solucion': 'Técnico / Educativo',
            'Consciente_Producto': 'Vende a la Mente (Inspirador/Urgente)',
            'Mas_Consciente': 'Oferta Directa / CTA Agresivo',
            'audio_podcast': 'Podcast / Formato Auditivo',
            'visual_infografia': 'Visual / Infografía Persuasiva'
        };
        template = templateMap[conciencia];
    }

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
    const catLabel = getCategoriaIndustria(industry);
    const espLabel = aiEspecializacion.value;
    const contextDetails = `Nicho: ${industry}${catLabel ? `, Categoria: ${catLabel}` : ''}${espLabel ? `, Especializacion: ${espLabel}` : ''}`;
    const systemPrompt = `# PERSONA
Actúa como un Copywriter Maestro en Conversión y Especialista en Branding dinámico.

# CONTEXTO Y MERCADO
- Empresa: ${company} (${contextDetails}).
- Tema de Publicación: "${theme}" (Todo el contenido debe desarrollarse desde aquí).
- Formato de Estrategia: ${template}.
- Nivel de Conciencia del Cliente: ${conciencia}.

# INSTRUCCIONES DE EJECUCIÓN PSICOLÓGICA
- Alineación Psicológica: Adapta el gancho (hook), ángulo y tono al estado mental exacto del cliente (${conciencia}).

# PASOS (CHAIN OF THOUGHT)
1. Define el ángulo narrativo según la estrategia ${template} y el nivel de conciencia.
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
- El contenido DEBE ser una mezcla perfecta entre el tema "${theme}", el estilo "${template}" y el nivel de conciencia "${conciencia}".`;

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
        await renderCarouselFromJson(generatedJson);
        
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
    const espVal = aiEspecializacion.value;
    
    return {
        caption: captionField.value.trim(),
        mediaUrl: document.getElementById('mediaUrl').value.trim(),
        postDate: document.getElementById('postDate').value,
        status: `${company}, ${platform}, ${format}, ${document.getElementById('aiTemplate').value}, Mode:${currentMode}${espVal ? `, Esp:${espVal}` : ''}`, 
        token: document.getElementById('token').value,
        options: {            voice: enableVoice.checked,
            music: enableMusic.checked,
            video: enableVideo.checked
        }
    };
}

function autoToggleMultimedia(format) {
    const enableAnimation = document.getElementById('enableAnimation');
    if (format === 'Reel' || format === 'Story') {
        enableVoice.checked = true;
        enableMusic.checked = true;
        enableVideo.checked = true;
        if (enableAnimation) { enableAnimation.checked = true; enableAnimation.dispatchEvent(new Event('change')); }
    } else {
        enableVoice.checked = false;
        enableMusic.checked = false;
        enableVideo.checked = false;
        if (enableAnimation) { enableAnimation.checked = false; enableAnimation.dispatchEvent(new Event('change')); }
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

async function renderCarouselPreview(text) {
    carouselContainer.innerHTML = '';
    previewSection.style.display = 'block';

    // Dividimos por "Slide" o "Diapositiva" o números seguidos de punto
    const slides = text.split(/(?=Slide|Diapositiva|\n\d+\.)/i).filter(s => s.trim().length > 10);

    const format = document.querySelector('.format-tab.active').dataset.format;
    const rawLogoUrl = normalizeDriveUrl(document.getElementById('companyLogo').value.trim());
    const finalLogoUrl = uploadedLogoDataUrl || await resolveLogoUrl(rawLogoUrl);

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

        // Usar foto local si existe, si no usar fallbacks de IA
        if (bdUploadedPhotos[index]) {
            setTimeout(() => {
                const el = document.getElementById(slideId);
                const loader = document.getElementById(`loader-${slideId}`);
                if (el) {
                    el.style.backgroundImage = `url('${bdUploadedPhotos[index]}')`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                }
                if (loader) loader.classList.add('hidden');
            }, 0);
        } else {
            tryLoadImage(slideId, imageSources);
        }
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
    
    // Limpiar Google Drive con lh3.googleusercontent.com
    const driveMatch = cleanUrl.match(/drive\.google\.com\/(?:file\/d\/|uc\?.*?id=|open\?.*?id=)\/?([^&/?]+)/);
    if (driveMatch) {
        cleanUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
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
            const slideControls = slide.querySelector('.slide-controls');
            const visualTag = slide.querySelector('.slide-visual');
            const slideNumberTag = slide.querySelector('.slide-number');
            const titleTag = slide.querySelector('.slide-title');
            
            if (voiceBtn) voiceBtn.style.visibility = 'hidden';
            if (slideControls) slideControls.style.visibility = 'hidden';
            if (visualTag) visualTag.style.visibility = 'hidden';
            if (slideNumberTag) slideNumberTag.style.visibility = 'hidden';

            let originalTitle = "";
            if (titleTag) {
                originalTitle = titleTag.innerText;
                titleTag.innerText = originalTitle.replace(/^\s*\(\d+\)\s*[-.:]?\s*/, '');
            }

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
                // Restaurar visibilidad y título original
                if (voiceBtn) voiceBtn.style.visibility = 'visible';
                if (slideControls) slideControls.style.visibility = 'visible';
                if (visualTag) visualTag.style.visibility = 'visible';
                if (slideNumberTag) slideNumberTag.style.visibility = 'visible';
                if (titleTag && originalTitle) titleTag.innerText = originalTitle;
                
                const newVisualTag = slide.querySelector('.slide-visual');
                if (newVisualTag) newVisualTag.style.visibility = 'visible';
            }
        }
        // 3. Si animación activa, generar slideshow .mp4 limpio
        const animToggle = document.getElementById('enableAnimation');
        if (animToggle?.checked && typeof html2canvas !== 'undefined') {
            try {
                downloadBtn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px;"></div> 🎬 VIDEO...';
                showToast('🎬 Generando video animado del kit...', 'info');

                const effect = document.getElementById('animationEffect')?.value || 'zoom';
                const duration = parseInt(document.getElementById('animationDuration')?.value) || 5;

                // Capturar slides CON campaña (con overlay/texto/logo visible)
                const kitImages = [];
                for (let i = 0; i < slides.length; i++) {
                    const slide = slides[i];
                    const canvas = await html2canvas(slide, {
                        scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#0f172a'
                    });
                    kitImages.push(canvas.toDataURL('image/jpeg', 0.9));
                    downloadBtn.innerHTML = `<div class="loader" style="display:inline-block; margin-right:8px;"></div> 📷 ${i+1}/${slides.length}`;
                }

                downloadBtn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px;"></div> 🚀 ENSAMBLANDO...';
                const resp = await fetch('/api/slideshow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: kitImages, effect, duration, transition: 'fade' })
                });
                const data = await resp.json();
                if (data.status === 'success' && data.video) {
                    const b64 = data.video.split(',')[1];
                    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                    const blob = new Blob([bytes], { type: 'video/mp4' });
                    downloadFile(URL.createObjectURL(blob), `kit_${company}_animado.mp4`);
                } else {
                    throw new Error(data.error || 'Error del servidor');
                }
                showToast('✅ ¡Kit completo con video animado!', 'success');
            } catch (e) {
                showToast(`⚠️ Video no generado: ${e.message}`, 'warning');
                console.error(e);
            }
        } else {
            showToast('✅ ¡Kit descargado exitosamente!', 'success');
        }
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
            populateCompanySelect();
            console.log("🏢 Empresas cargadas correctamente");
        }
    } catch (e) {
        console.warn("⚠️ No se pudieron cargar las empresas");
    }
}

function populateCompanySelect() {
    const select = document.getElementById('companyName');
    if (!select || select.tagName !== 'SELECT') return;
    select.innerHTML = '<option value="">-- Seleccionar Empresa --</option>';
    companyConfigs.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nomempresa;
        opt.textContent = c.nomempresa;
        select.appendChild(opt);
    });
}

function setupCompanyAutoFill() {
    const select = document.getElementById('companyName');
    if (!select) return;
    const handler = (e) => {
        const empresaSeleccionada = e.target.value;
        const selected = companyConfigs.find(c => c.nomempresa === empresaSeleccionada);

        if (selected) {
            console.log("🔍 [BD] Datos encontrados para:", empresaSeleccionada, selected);
            const findVal = (keys) => {
                const foundKey = Object.keys(selected).find(k =>
                    keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
                );
                return foundKey ? selected[foundKey] : null;
            };

            const logo = findVal(['logo_url', 'logo']);
            document.getElementById('companyLogo').value = normalizeDriveUrl(logo || "");

            const tel = findVal(['telefonowhastapp', 'telefonowhasapp', 'telefono', 'tel', 'whatsapp', 'whas']);
            document.getElementById('contactPhone').value = tel || "";

            const web = findVal(['enlace_oficial', 'url_oficial', 'website', 'enlace']) || "";
            document.getElementById('webSite').value = (web && web.toString().startsWith('http')) ? web : "";

            const color = findVal(['color_tema', 'color', 'tema']);
            if (color) {
                document.documentElement.style.setProperty('--primary', color);
                document.documentElement.style.setProperty('--primary-hover', color + 'dd');
                showToast(`Configuración de ${empresaSeleccionada} cargada`, 'success');
            }
        } else {
            document.getElementById('companyLogo').value = "";
            document.getElementById('contactPhone').value = "";
            document.getElementById('webSite').value = "";
        }
    };
    select.removeEventListener('change', handler);
    select.addEventListener('change', handler);
}

function setWorkMode(mode) {
    currentMode = mode;
    const aiBtn = document.getElementById('btnModeAi');
    const bdBtn = document.getElementById('btnModeBd');
    const bdprBtn = document.getElementById('btnModeBdpr');
    const container = document.getElementById('companyInputContainer');
    const bdPhotosContainer = document.getElementById('bdPhotosContainer');
    const genText = document.querySelector('.gen-text');
    const magicIcon = document.querySelector('.magic-icon');

    aiBtn.classList.remove('active');
    bdBtn.classList.remove('active');
    if (bdprBtn) bdprBtn.classList.remove('active');

    if (mode === 'Ai') {
        aiBtn.classList.add('active');
        console.log("🤖 Modo actual: Inteligencia Artificial (Manual)");
        if (bdPhotosContainer) bdPhotosContainer.style.display = 'none';
        bdUploadedPhotos = [];
        const bdPhotosInput = document.getElementById('bdPhotosInput');
        const bdPhotosPreview = document.getElementById('bdPhotosPreview');
        const clearBdPhotosBtn = document.getElementById('clearBdPhotosBtn');
        if (bdPhotosInput) bdPhotosInput.value = '';
        if (bdPhotosPreview) bdPhotosPreview.innerHTML = '';
        if (clearBdPhotosBtn) clearBdPhotosBtn.style.display = 'none';
        container.innerHTML = `
            <label for="companyName">Empresa / Marca</label>
            <input type="text" id="companyName" placeholder="Nombre de la marca..." required>
        `;
        if (genText) genText.textContent = 'Generar con IA (Incluye Imágenes)';
        if (magicIcon) magicIcon.textContent = '🪄';
        captionField.placeholder = 'La IA escribirá aquí...';
        return;
    }

    // BD y BDPR comparten: select de empresa y fotos de carrusel
    if (bdPhotosContainer) {
        bdPhotosContainer.style.display = 'block';
        if (typeof window.updateBdPhotosLabel === 'function') window.updateBdPhotosLabel();
    }

    container.innerHTML = `
        <label for="companyName">Empresa / Marca</label>
        <select id="companyName">
            <option value="">-- Cargando desde BD... --</option>
        </select>
    `;

    if (mode === 'BD') {
        bdBtn.classList.add('active');
        console.log("📊 Modo actual: Base de Datos (Automático)");
        if (genText) genText.textContent = 'Generar con IA (Incluye Imágenes)';
        if (magicIcon) magicIcon.textContent = '🪄';
        captionField.placeholder = 'La IA escribirá aquí...';
    } else if (mode === 'BDPR') {
        bdprBtn.classList.add('active');
        console.log("✏️ Modo actual: BD Personal/Manual");
        if (genText) genText.textContent = 'Previsualizar Campaña';
        if (magicIcon) magicIcon.textContent = '👁️';
        captionField.placeholder = 'Escribe o pega la campaña aquí...';
    }

    loadCompanies().then(() => setupCompanyAutoFill());
}

function normalizeDriveUrl(url) {
    if (!url) return url;
    // Extraer ID de cualquier formato de Google Drive
    let fileId = null;
    const patterns = [
        /drive\.google\.com\/file\/d\/([^/?]+)/,
        /drive\.google\.com\/uc\?.*?id=([^&]+)/,
        /drive\.google\.com\/open\?.*?id=([^&]+)/,
        /googleusercontent\.com\/d\/([^/?]+)/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) { fileId = m[1]; break; }
    }
    if (!fileId) return url;
    return `https://lh3.googleusercontent.com/d/${fileId}`;
}

// Resuelve la URL del logo sin proxy: lh3.googleusercontent.com sirve imágenes directamente sin CORS
async function resolveLogoUrl(rawUrl) {
    if (!rawUrl) return null;
    if (rawUrl.startsWith('data:')) return rawUrl;
    const normalized = normalizeDriveUrl(rawUrl);
    if (!normalized) return null;
    // lh3.googleusercontent.com no necesita proxy — sirve la imagen directamente
    if (normalized.includes('lh3.googleusercontent.com')) {
        return normalized;
    }
    return normalized;
}

async function renderCarouselFromJson(data) {
    if (!data || !data.slides) return;
    carouselContainer.innerHTML = '';
    const format = document.querySelector('.format-tab.active').dataset.format;
    const isReel = (format === 'Reel' || format === 'Story');
    const rawLogoUrl = normalizeDriveUrl(document.getElementById('companyLogo').value.trim());
    const userLogoUrl = await resolveLogoUrl(rawLogoUrl);
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
                    <button class="anim-btn" onclick="downloadAnimatedVideo('${slideId}', '${index}')"
                            style="background:rgba(245,158,11,0.2); border:1px solid rgba(245,158,11,0.3); color:#fbbf24; width:35px; height:35px; border-radius:50%; cursor:pointer; display:${document.getElementById('enableAnimation')?.checked ? 'flex' : 'none'}; align-items:center; justify-content:center; backdrop-filter:blur(5px); transition:all 0.3s; font-size:0.8rem;"
                            onmouseover="this.style.background='var(--accent-color)'; this.style.borderColor='var(--accent-color)';"
                            onmouseout="this.style.background='rgba(245,158,11,0.2)'; this.style.borderColor='rgba(245,158,11,0.3)';"
                            title="Descargar Video Animado">🎬</button>
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
        if (bdUploadedPhotos[index]) {
            // Usar foto cargada localmente por el usuario
            setTimeout(() => {
                const el = document.getElementById(slideId);
                const loader = document.getElementById(`loader-${slideId}`);
                if (el) {
                    el.style.backgroundImage = `url('${bdUploadedPhotos[index]}')`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                }
                if (loader) loader.classList.add('hidden');
                const sourceTag = document.getElementById(`source-${slideId}`);
                if (sourceTag) {
                    sourceTag.innerText = '[LOCAL]';
                    sourceTag.style.color = '#10b981';
                }
            }, 0);
        } else {
            loadSlideImage(slideId, slide.visual, industry, theme);
        }
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
            body: JSON.stringify({ prompt: `${aiEspecializacion.value ? aiEspecializacion.value + ' ' : ''}${industry} ${theme} ${visual}, high resolution, 8k, professional photography` })
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

// --- ANIMACIÓN DE FOTO (FFmpeg backend) ---
async function downloadAnimatedVideo(slideId, index) {
    const toggle = document.getElementById('enableAnimation');
    if (!toggle?.checked) return;

    const effect = document.getElementById('animationEffect')?.value || 'zoom';
    const duration = parseInt(document.getElementById('animationDuration')?.value) || 5;
    const slide = document.querySelectorAll('.carousel-slide')[parseInt(index)];
    if (!slide) return;

    showToast('🎬 Generando video animado...', 'info');

    try {
        // Extraer URL directa del background-image (limpia, sin overlay)
        const bgDiv = slide.querySelector('.slide-image');
        let imgUrl = '';
        if (bgDiv) {
            const bg = bgDiv.style.backgroundImage;
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m) imgUrl = m[1];
        }
        if (!imgUrl) throw new Error('No se encontró imagen de fondo');

        let imageBase64 = imgUrl;
        if (!imgUrl.startsWith('data:')) {
            const resp = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`);
            const data = await resp.json();
            if (data.status !== 'ok') throw new Error(data.error || 'Error al descargar imagen');
            imageBase64 = data.image;
        }

        const response = await fetch('/api/animate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64, effect, duration })
        });

        const data = await response.json();
        if (data.status !== 'success' || !data.video) {
            throw new Error(data.error || 'Error del servidor');
        }

        const b64 = data.video.split(',')[1];
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'video/mp4' });
        downloadFile(URL.createObjectURL(blob), `slide_${parseInt(index)+1}_${effect}.mp4`);
        showToast(`✅ Video ${effect} descargado (${duration}s)`, 'success');
    } catch (e) {
        showToast(`❌ Error: ${e.message}`, 'error');
        console.error(e);
    }
}

// Sincronizar visibilidad de botones de animación con el toggle
document.addEventListener('change', (e) => {
    if (e.target.id === 'enableAnimation') {
        document.querySelectorAll('.anim-btn').forEach(btn => {
            btn.style.display = e.target.checked ? 'flex' : 'none';
        });
    }
});

// --- CONSOLA DE LOGS UNIFICADA ---
let logAutoRefresh = true;
let logInterval = null;

async function fetchLogs() {
    try {
        const res = await fetch('/api/logs');
        if (!res.ok) return;
        const logs = await res.json();
        const el = document.getElementById('logContent');
        if (!el) return;
        el.innerHTML = logs.map(l => `<div>${l}</div>`).join('');
        el.scrollTop = el.scrollHeight;
    } catch (e) { /* servidor no disponible */ }
}

function toggleLogPanel() {
    const panel = document.getElementById('logPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        fetchLogs();
        if (logAutoRefresh) {
            logInterval = setInterval(fetchLogs, 2000);
        }
    } else {
        clearInterval(logInterval);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        toggleLogPanel();
    }
});

document.getElementById('toggleLogBtn')?.addEventListener('click', () => {
    logAutoRefresh = !logAutoRefresh;
    document.getElementById('toggleLogBtn').style.color = logAutoRefresh ? 'var(--success)' : 'var(--text-dim)';
    if (logAutoRefresh) {
        logInterval = setInterval(fetchLogs, 2000);
    } else {
        clearInterval(logInterval);
    }
});
