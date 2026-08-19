// CMS Frontend Logic - Campañas AI
// Generador Inteligente con soporte para IA y Google Sheets

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ADR-026: logo_url puede venir en formato vector de Brief (ADR-023/025 —
// "logo: url|avatar: url|industria: ...|LAPVTFU: url,url,,,,,|...") en vez del
// formato legado de ADR-008 ("logoUrl,avatarUrl"). Probar etiquetas primero;
// si no hay ninguna, caer al comma-split legado (retrocompatible).
function parseLogoUrlField(value) {
    if (!value) return { logoUrl: '', avatarUrl: '' };
    const trimmed = value.trim();

    if (trimmed.includes('|') || /^(logo|avatar|lapvtfu)\s*:/i.test(trimmed)) {
        let logo = '', avatar = '';
        trimmed.split('|').forEach(seg => {
            const m = seg.trim().match(/^(logo|avatar|lapvtfu)\s*:\s*([\s\S]*)$/i);
            if (!m) return;
            const key = m[1].toLowerCase();
            const val = m[2].trim();
            if (key === 'logo') logo = val;
            else if (key === 'avatar') avatar = val;
            else if (key === 'lapvtfu') {
                const parts = val.split(',').map(s => s.trim());
                if (!logo) logo = parts[0] || '';
                if (!avatar) avatar = parts[1] || '';
            }
        });
        // Vector de Brief sin logo/avatar/LAPVTFU todavía (ej. NOET hoy): sin
        // logo utilizable. No caer al comma-split — reventaría en las comas
        // internas de industria/dolor/objecion/etc.
        return { logoUrl: logo, avatarUrl: avatar };
    }

    if (!trimmed.includes(',')) return { logoUrl: trimmed, avatarUrl: '' };
    if (trimmed.startsWith('data:')) {
        const match = trimmed.match(/^(data:[^,]+;base64,[^,]+),?(.*)/);
        if (match) return { logoUrl: match[1], avatarUrl: match[2] || '' };
    }
    const lastComma = trimmed.lastIndexOf(',');
    return { logoUrl: trimmed.substring(0, lastComma).trim(), avatarUrl: trimmed.substring(lastComma + 1).trim() };
}

// Gemela de parseOrigenPoliticas() en js/modules/core.js (ADR-019) — sin módulo
// compartido entre root SuitOrg y SuitCampanas, misma lógica duplicada a propósito.
// origen_politicas = "op: ROL|presentacion: SI|lp: si"; legado sin etiquetas
// ("ROL"/"USUARIO" a secas) cae posicional a `op`.
function parseOrigenPoliticas(raw) {
    const segments = (raw || '').toString().trim().split('|').map(s => s.trim());
    const labeled = {};
    segments.forEach(seg => {
        const m = seg.match(/^(op|presentacion|lp)\s*:\s*([\s\S]*)$/i);
        if (m) labeled[m[1].toLowerCase()] = m[2].trim();
    });
    if (Object.keys(labeled).length > 0) {
        return { op: labeled.op || '', presentacion: labeled.presentacion || '', lp: labeled.lp || '' };
    }
    return { op: segments[0] || '', presentacion: '', lp: '' };
}

// Subconjunto del vector de Brief de logo_url (ADR-025/026) que BDPV puede
// aprovechar hoy: industria/nicho/especializacion van directo a
// autoSelectIndustriaFromBrief() (ya usada por MediaPlanner), sin duplicar esa
// lógica de matching contra los <select>.
function parseBriefTags(raw) {
    const brief = {};
    (raw || '').toString().trim().split('|').forEach(seg => {
        const m = seg.trim().match(/^(industria|nicho|especializacion)\s*:\s*([\s\S]*)$/i);
        if (m && m[2].trim()) brief[m[1].toLowerCase()] = m[2].trim();
    });
    return brief;
}

const CONFIG = {
    AI_URL: '/api/ai/generate',
    HISTORY_URL: '/api/history',
    SAVE_URL: '/api/save',
    CAMPANAS_URL: '/api/campanas',
    PROMPTS_API: '/api/prompts/',
    DRIVE_API_KEY: '',
    DRIVE_CLIENT_ID: '',
    DRIVE_APP_ID: ''
};

// jobId del render de ViRe en curso (o null) — lo lee el botón Cancelar,
// que se registra una sola vez al cargar la página, lejos de generateViReVideo().
let vireCurrentJobId = null;
// true desde que se hace click en Generar hasta que termina (incluye la
// conversión IA del prompt libre, que puede tardar varios minutos) — sin esto,
// un segundo click o un cambio de modo mientras la IA sigue respondiendo deja
// esa llamada vieja corriendo en segundo plano, y cuando por fin resuelve
// pisa los campos del formulario y dispara un render que el usuario ya no pidió.
let vireGenerationInProgress = false;
// true mientras el click en "📄 Guion JSON" está generando el guion vía IA —
// separado de vireGenerationInProgress (que cubre el render final) porque son
// dos pasos distintos de la secuencia (generar guion -> revisar -> renderizar).
let vireJsonGenerating = false;

// ViRe reutiliza Estilo Musical/Voz/Duración/Música/Narración del Asistente IA
// y Producción Multimedia (mismos <select>/checkboxes que ya usa VIDE) en vez
// de duplicarlos — esto los REUBICA físicamente arriba de la caja ViRe mientras
// ese modo está activo (dejando un comentario-marcador en su lugar original) y
// los devuelve a su sitio al salir, para no romper el layout de los demás modos
// que también los leen por id (VIDE, BDSMT, el flujo "Generar con IA", etc.).
const VIRE_SHARED_FIELD_IDS = ['videStyle', 'videVoice', 'videDuration', 'enableMusic', 'enableVoice'];
const vireSharedPlaceholders = new Map();
function vireSharedWrapper(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.closest('.toggle-group') || el.closest('.input-wrapper') || el;
}
function moveSharedFieldsIntoVire() {
    const target = document.getElementById('vireSharedConfig');
    if (!target) return;
    VIRE_SHARED_FIELD_IDS.forEach(id => {
        if (vireSharedPlaceholders.has(id)) return;
        const wrapper = vireSharedWrapper(id);
        if (!wrapper || !wrapper.parentNode) return;
        const placeholder = document.createComment(`vire-shared-${id}`);
        wrapper.parentNode.insertBefore(placeholder, wrapper);
        vireSharedPlaceholders.set(id, placeholder);
        wrapper.style.flex = '1 1 160px';
        target.appendChild(wrapper);
    });
}
function restoreSharedFieldsFromVire() {
    vireSharedPlaceholders.forEach((placeholder, id) => {
        const wrapper = vireSharedWrapper(id);
        if (wrapper && placeholder.parentNode) {
            wrapper.style.flex = '';
            placeholder.parentNode.insertBefore(wrapper, placeholder);
            placeholder.remove();
        }
    });
    vireSharedPlaceholders.clear();
}

// Plantilla narrativa derivada del nivel de conciencia cuando el usuario no elige
// una explícitamente — compartido por generateAIContent() (carrusel) y
// generateVideJson() (VIDE), para que ambos generadores de IA sigan la misma regla.
const TEMPLATE_MAP = {
    'Inconsciente': 'Storytelling (Narrativo)',
    'Consciente_Problema': 'Enfocado en el Dolor (Agitar Problema)',
    'Consciente_Solucion': 'Técnico / Educativo',
    'Consciente_Producto': 'Vende a la Mente (Inspirador/Urgente)',
    'Mas_Consciente': 'Oferta Directa / CTA Agresivo',
    'audio_podcast': 'Podcast / Formato Auditivo',
    'visual_infografia': 'Visual / Infografía Persuasiva'
};

// Load public config from server (no secrets exposed)
(async function loadClientConfig() {
    try {
        const res = await fetch('/api/config/client');
        if (res.ok) {
            const cfg = await res.json();
            if (cfg.DRIVE_API_KEY) CONFIG.DRIVE_API_KEY = cfg.DRIVE_API_KEY;
            if (cfg.DRIVE_CLIENT_ID) CONFIG.DRIVE_CLIENT_ID = cfg.DRIVE_CLIENT_ID;
            if (cfg.DRIVE_APP_ID) CONFIG.DRIVE_APP_ID = cfg.DRIVE_APP_ID;
        }
    } catch (e) {
        console.warn('No se pudo cargar config del cliente:', e.message);
    }
})();

// --- CACHE DE PROMPTS (cargados desde Prompts_IA vía API) ---
const promptCache = {};
async function loadPrompt(id) {
    if (promptCache[id]) return promptCache[id];
    try {
        const res = await fetch(CONFIG.PROMPTS_API + id);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        promptCache[id] = data.prompt_base || '';
        return promptCache[id];
    } catch (e) {
        console.warn('[PROMPTS] Error cargando ' + id + ': ' + e.message);
        return '';
    }
}

// Variables Globales de UI
let form, submitBtn, generateBtn, loader, btnText, toast, toastMessage;
let aiIndustry, aiSlides, aiTheme, captionField;
let aiTemplate, aiEspecializacion, aiNicho;
let formatTabs, platformTabs, historyContainer, refreshHistoryBtn, downloadBtn;
let previewSection, carouselContainer;
let enableVoice, enableMusic, enableVideo;
let currentMode = 'Ai';
let uploadedLogoDataUrl = null;
let companyConfigs = [];
let bdUploadedPhotos = [];
let lastGeneratedContent = null;

// --- Scope global: funciones accesibles desde generateAIContent ---
const INDUSTRIA_CATEGORIA = {};
const ESPECIALIZACIONES = {};
function getCategoriaIndustria(valor) {
    return INDUSTRIA_CATEGORIA[valor] || '';
}
function getEspecializaciones(valor) {
    return ESPECIALIZACIONES[valor] || [];
}
function updateEspecializacionSelect() {
    const nicho = aiNicho ? aiNicho.value : '';
    const ind = nicho || aiIndustry.value;
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
    aiNicho = document.getElementById('aiNicho');
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
        tornos_maquinado: 'el maquinado industrial', otro: 'tu industria',
        venta_renta_residencial: 'el sector inmobiliario', venta_renta_comercial: 'el sector comercial',
        desarrollo_inmobiliario: 'el desarrollo inmobiliario', fideicomiso_inmobiliario: 'la inversión inmobiliaria',
        administracion_propiedades: 'la administración de propiedades',
        diseño_paisajismo: 'el paisajismo', mantenimiento_jardines: 'el jardín',
        arboricultura: 'los árboles', jardines_verticales: 'los jardines verticales', vivero_plantas: 'el vivero',
        laboratorio_clinico: 'el laboratorio clínico', laboratorio_especializado: 'el laboratorio especializado',
        diagnostico_imagen: 'el diagnóstico por imagen', medicina_preventiva: 'la medicina preventiva',
        diagnostico_molecular: 'el diagnóstico molecular',
        veterinaria_general: 'la veterinaria', veterinaria_especialista: 'la veterinaria especializada',
        grooming_peluqueria: 'el grooming', hotel_mascotas: 'el hotel para mascotas',
        adiestramiento_comportamiento: 'el adiestramiento canino', pet_shop_accesorios: 'las mascotas',
        guarderia: 'la guardería', educacion_preescolar: 'la educación preescolar',
        actividades_extracurriculares: 'las actividades infantiles',
        psicologia_infantil: 'la psicología infantil', eventos_infantiles: 'los eventos infantiles',
        terapia_fisica_rehabilitacion: 'la fisioterapia', nutricion_dietetica: 'la nutrición',
        desarrollo_web_mobile: 'el desarrollo web', ciberseguridad: 'la ciberseguridad',
        venta_en_linea_ecommerce: 'el e-commerce', restaurante_cafeteria: 'la gastronomía',
        hoteleria_turismo: 'el turismo',
        servicios_profesionales: 'los servicios profesionales',
        industria_manufactura: 'la manufactura', energia: 'la energía',
        comercio_ventas: 'el comercio', alimentos_hospitalidad: 'la gastronomía',
        logistica_transporte: 'la logística', agropecuario: 'la agricultura',
        bienes_raices: 'el sector inmobiliario', jardineria_paisajismo: 'el paisajismo',
        analisis_clinicos: 'el laboratorio clínico', veterinaria: 'la veterinaria',
        guarderia_infantil: 'la guardería',
        electrodomesticos_premium: 'los electrodomésticos y bienes de consumo premium'
    };

    const INDUSTRIAS_DATA = { clasificacion: [] };
    const initCategoriaLookup = (data) => {
        INDUSTRIAS_DATA.clasificacion = data.clasificacion;
        data.clasificacion.forEach(grupo => {
            grupo.subclasificaciones.forEach(sub => {
                INDUSTRIA_CATEGORIA[sub.valor] = grupo.categoria;
                ESPECIALIZACIONES[sub.valor] = sub.especializaciones || [];
            });
        });
    };
    const populateIndustrias = () => {
        if (!aiIndustry) return;
        aiIndustry.innerHTML = '<option value="">-- Seleccionar Industria --</option>';
        INDUSTRIAS_DATA.clasificacion.forEach(grupo => {
            const opt = document.createElement('option');
            opt.value = grupo.id !== undefined ? String(grupo.id) : grupo.categoria;
            opt.textContent = `${grupo.icono || '📁'} ${grupo.categoria}`;
            aiIndustry.appendChild(opt);
        });
    };
    const CONCIENCIA_SUGGEST = {
        Inconsciente: ['¿Sabías que...?', 'Lo que nadie te dice sobre', 'La verdad oculta de'],
        Consciente_Problema: ['¿Estás cometiendo este error en', 'El problema oculto en', 'Por qué sigues perdiendo oportunidades en'],
        Consciente_Solucion: ['Cómo mejorar ', 'La solución definitiva para', 'Transforma '],
        Consciente_Producto: ['Por qué elegir ', 'La mejor opción en', 'Todo lo que necesitas saber sobre'],
        Mas_Consciente: ['Oferta exclusiva: ', 'Última oportunidad para', 'Descuento especial en']
    };
    function suggestTheme() {
        const c = aiConciencia.value;
        const ind = aiIndustry.value;
        const nicho = aiNicho ? aiNicho.value : '';
        const indOption = aiIndustry.selectedOptions[0];
        const indLabel = INDUSTRY_LABELS[nicho] || INDUSTRY_LABELS[ind]
            || (indOption && indOption.textContent.replace(/^[^\s]+\s/, '')) || 'tu sector';
        const esp = aiEspecializacion.value;
        const phrases = CONCIENCIA_SUGGEST[c] || ['Estrategia para'];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        aiTheme.value = esp ? `${phrase} ${esp} en ${indLabel}` : `${phrase} ${indLabel}`;
    }
    function showCategoriaHint() {
        // Hint removed - using two separate selects now
    }
    function populateNichos() {
        const ind = aiIndustry.value;
        const grupo = INDUSTRIAS_DATA.clasificacion.find(g => (g.id !== undefined ? String(g.id) : g.categoria) === ind);
        const nichos = grupo ? grupo.subclasificaciones : [];
        aiNicho.innerHTML = '<option value="">-- Seleccionar Nicho --</option>';
        nichos.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n.valor;
            opt.textContent = n.etiqueta;
            aiNicho.appendChild(opt);
        });
        aiNicho.value = '';
    }
    aiConciencia.addEventListener('change', suggestTheme);
    aiIndustry.addEventListener('change', () => { populateNichos(); updateEspecializacionSelect(); suggestTheme(); showCategoriaHint(); });
    if (aiNicho) aiNicho.addEventListener('change', () => { updateEspecializacionSelect(); suggestTheme(); showCategoriaHint(); });
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
        showDriveModalFallback();
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
                    drivePreview.style.display = 'block';
                    drivePreview.textContent = '';
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
                    img.onerror = function() { this.parentElement.textContent = 'No se pudo previsualizar'; };
                    drivePreview.appendChild(img);
                } else if (raw) {
                    drivePreview.style.display = 'block';
                    drivePreview.textContent = '';
                    const img = document.createElement('img');
                    img.src = raw;
                    img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
                    img.onerror = function() { this.parentElement.textContent = 'No se pudo previsualizar'; };
                    drivePreview.appendChild(img);
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

    // Manejador del Switch AI / BD / BDPR / IMG
    document.getElementById('btnModeAi').addEventListener('click', () => setWorkMode('Ai'));
    document.getElementById('btnModeBd').addEventListener('click', () => setWorkMode('BD'));
    document.getElementById('btnModeBdpr').addEventListener('click', () => setWorkMode('BDPR'));
    const btnModeImg = document.getElementById('btnModeImg');
    if (btnModeImg) btnModeImg.addEventListener('click', () => setWorkMode('IMG'));
    const btnModeBdsmt = document.getElementById('btnModeBdsmt');
    if (btnModeBdsmt) btnModeBdsmt.addEventListener('click', () => setWorkMode('BDSMT'));
    const btnModeBdpv = document.getElementById('btnModeBdpv');
    if (btnModeBdpv) btnModeBdpv.addEventListener('click', () => setWorkMode('BDPV'));
    const btnModeLp = document.getElementById('btnModeLp');
    if (btnModeLp) btnModeLp.addEventListener('click', () => setWorkMode('LP'));
    const btnModeViRe = document.getElementById('btnModeViRe');
    if (btnModeViRe) btnModeViRe.addEventListener('click', () => setWorkMode('ViRe'));
    const btnModeVide = document.getElementById('btnModeVide');
    if (btnModeVide) btnModeVide.addEventListener('click', () => setWorkMode('VIDE'));
    const openVireStudioBtn = document.getElementById('openVireStudioBtn');
    if (openVireStudioBtn) {
        openVireStudioBtn.addEventListener('click', () => {
            window.open('http://localhost:3004', '_blank');
        });
    }

    // ViRe: 3 cápsulas — Auto (Datos+IA) / Guion JSON / Prompt libre. Las tres
    // comparten vireJsonGenerating como lock (las 3 pueden escribir en el mismo
    // textarea vireGuionJson, así que solo una puede correr a la vez).
    const vireAutoModeBtn = document.getElementById('vireAutoMode');
    const vireJsonModeBtn = document.getElementById('vireJsonMode');
    const virePromptModeBtn = document.getElementById('virePromptMode');
    const vireModeButtons = [vireAutoModeBtn, vireJsonModeBtn, virePromptModeBtn];
    const setVireActiveButton = (activeBtn) => {
        vireModeButtons.forEach(b => {
            if (!b) return;
            if (b === activeBtn) {
                b.style.background = 'rgba(99,102,241,0.15)';
                b.style.borderColor = 'rgba(99,102,241,0.4)';
                b.style.color = '#a5b4fc';
            } else {
                b.style.background = 'rgba(255,255,255,0.05)';
                b.style.borderColor = 'var(--glass-border)';
                b.style.color = 'var(--text-dim)';
            }
        });
    };
    const setVireMode = (json) => {
        setVireActiveButton(json ? vireJsonModeBtn : virePromptModeBtn);
        const jsonEl = document.getElementById('vireGuionJson');
        const promptEl = document.getElementById('virePrompt');
        if (jsonEl) jsonEl.style.display = json ? '' : 'none';
        if (promptEl) promptEl.style.display = json ? 'none' : '';
    };

    // Pulsar "Guion JSON" no es solo un toggle de vista: si hay texto en el
    // prompt libre, genera (o regenera) el guion con IA y lo vuelca en el
    // textarea JSON — así el usuario ve/edita el guion como paso intermedio
    // antes de renderizar, en vez de tener que adivinar el formato a mano.
    // Sin prompt escrito, se comporta como antes (solo cambia de vista, para
    // quien prefiera pegar el JSON manualmente).
    const vireJsonModeLabel = vireJsonModeBtn?.textContent || '';
    if (vireJsonModeBtn) vireJsonModeBtn.addEventListener('click', async () => {
        if (vireJsonGenerating) {
            showToast('⏳ Ya se está generando un guion, espera a que termine', 'info');
            return;
        }
        setVireMode(true);
        const prompt = document.getElementById('virePrompt')?.value?.trim();
        if (!prompt) return;

        vireJsonGenerating = true;
        vireJsonModeBtn.textContent = '⏳ Generando...';
        vireJsonModeBtn.style.cursor = 'wait';
        showToast('🤖 Generando guion JSON desde tu prompt...', 'info');
        try {
            const duration = parseInt(document.getElementById('videDuration')?.value) || 30;
            const musicStyle = document.getElementById('videStyle')?.value || 'cinematic';
            const guionObj = await generarGuionDesdePrompt(prompt, duration, musicStyle);
            aplicarAjustesDetectados(guionObj.ajustes_detectados);
            const jsonEl = document.getElementById('vireGuionJson');
            if (jsonEl) jsonEl.value = JSON.stringify(guionObj, null, 2);
            showToast('✅ Guion JSON generado — revísalo/edítalo y pulsa "Generar con ViRe"', 'success');
        } catch (e) {
            showToast(`❌ Error generando guion: ${e.message}`, 'error');
            console.error(e);
        } finally {
            vireJsonGenerating = false;
            vireJsonModeBtn.textContent = vireJsonModeLabel;
            vireJsonModeBtn.style.cursor = '';
        }
    });
    if (virePromptModeBtn) virePromptModeBtn.addEventListener('click', () => setVireMode(false));

    // "✨ Auto (Datos+IA)" — el CreatorEngine de ViRe: nada de prompt libre,
    // arma el guion completo desde DATOS/NEGOCIO + Asistente IA (mismo
    // generador que usa VIDE). Mismo lock/indicador que "Guion JSON".
    const vireAutoModeLabel = vireAutoModeBtn?.textContent || '';
    if (vireAutoModeBtn) vireAutoModeBtn.addEventListener('click', async () => {
        if (vireJsonGenerating) {
            showToast('⏳ Ya se está generando un guion, espera a que termine', 'info');
            return;
        }
        setVireActiveButton(vireAutoModeBtn);
        const jsonEl = document.getElementById('vireGuionJson');
        const promptEl = document.getElementById('virePrompt');
        if (jsonEl) jsonEl.style.display = '';
        if (promptEl) promptEl.style.display = 'none';

        vireJsonGenerating = true;
        vireAutoModeBtn.textContent = '⏳ Generando...';
        vireAutoModeBtn.style.cursor = 'wait';
        showToast('✨ Generando guion desde Datos/Negocio + Asistente IA...', 'info');
        try {
            const guionObj = await generarGuionDesdeAsistente();
            if (jsonEl) jsonEl.value = JSON.stringify(guionObj, null, 2);
            showToast('✅ Guion generado — revísalo/edítalo y pulsa "Generar con ViRe"', 'success');
        } catch (e) {
            showToast(`❌ ${e.message}`, 'error');
            console.error(e);
        } finally {
            vireJsonGenerating = false;
            vireAutoModeBtn.textContent = vireAutoModeLabel;
            vireAutoModeBtn.style.cursor = '';
        }
    });

    // Búsqueda de tendencias (nicho/industria + sub-nicho/región, siempre desde
    // los mismos campos compartidos) que aplica al tema compartido #aiTheme —
    // extraído para que tanto BDSMT como VIDE puedan usar el mismo botón/lógica
    // apuntando a su propio contenedor de resultados.
    async function buscarTendencias(containerId, loaderEl) {
        const niche = aiNicho ? aiNicho.value : aiIndustry.value;
        if (!niche) {
            showToast('❌ Selecciona un nicho/industria primero', 'error');
            return;
        }
        const subNiche = document.getElementById('bdsmtSubNicho')?.value || '';
        const region = document.getElementById('bdsmtRegion')?.value?.trim() || 'México';
        const trendsContainer = document.getElementById(containerId);

        if (loaderEl) loaderEl.style.display = 'inline-block';
        if (trendsContainer) {
            trendsContainer.style.display = 'block';
            trendsContainer.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);">🔍 Buscando tendencias en Google Trends y Reddit...</div>';
        }

        try {
            const response = await fetch('/api/trends/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche, subNiche, region })
            });
            const json = await response.json();
            if (json.status !== 'success') throw new Error(json.message || 'Error');

            const { trends } = json.data;
            if (!trends || trends.length === 0) {
                trendsContainer.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);">😕 No se encontraron tendencias. Intenta con otro nicho o región.</div>';
                showToast('⚠️ No se encontraron tendencias', 'warning');
                return;
            }

            let html = `<div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--text-dim);">Selecciona una tendencia para usarla como tema:</div>`;
            trends.forEach((t, i) => {
                const checked = i === 0 ? 'checked' : '';
                const titulo = escapeHtml(t.titulo);
                const desc = escapeHtml(t.descripcion);
                const fuente = escapeHtml(t.fuente);
                html += `
                    <label class="trend-item" style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.75rem;margin-bottom:0.5rem;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s;">
                        <input type="radio" name="trendSelect-${containerId}" value="${i}" ${checked} style="margin-top:0.25rem;accent-color:#6366f1;">
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:600;font-size:0.85rem;color:var(--text);">${titulo}</div>
                            <div style="font-size:0.7rem;color:var(--text-dim);margin-top:0.15rem;">${desc}</div>
                            <div style="font-size:0.65rem;color:var(--primary);margin-top:0.25rem;">📡 ${fuente} ${t.score > 0 ? `· Score: ${escapeHtml(String(t.score))}` : ''}</div>
                        </div>
                    </label>
                `;
            });

            html += `<div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
                <button type="button" class="secondary-btn apply-trend-btn" style="flex:1;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;padding:0.6rem;">
                    ✅ Usar tendencia seleccionada
                </button>
            </div>`;

            trendsContainer.innerHTML = html;

            const applyBtn = trendsContainer.querySelector('.apply-trend-btn');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    const selected = trendsContainer.querySelector(`input[name="trendSelect-${containerId}"]:checked`);
                    if (!selected) {
                        showToast('❌ Selecciona una tendencia', 'error');
                        return;
                    }
                    const idx = parseInt(selected.value);
                    const trend = trends[idx];
                    window.selectedTrend = trend;
                    aiTheme.value = trend.titulo;
                    trendsContainer.style.display = 'none';
                    showToast('✅ Tendencia seleccionada: ' + trend.titulo.substring(0, 50) + '...', 'success');
                });
            }

            showToast(`📊 ${trends.length} tendencias encontradas`, 'success');
        } catch (e) {
            showToast('❌ Error buscando tendencias: ' + e.message, 'error');
            if (trendsContainer) {
                trendsContainer.innerHTML = `<div style="text-align:center;padding:1rem;color:#ef4444;">❌ Error: ${e.message}</div>`;
            }
        } finally {
            if (loaderEl) loaderEl.style.display = 'none';
        }
    }

    // BDSMT: Buscar Tendencias button
    const fetchTrendsBtn = document.getElementById('fetchTrendsBtn');
    if (fetchTrendsBtn) {
        fetchTrendsBtn.addEventListener('click', () => buscarTendencias('trendsContainer', fetchTrendsBtn.querySelector('.trends-loader')));
    }

    // VIDE: mismo buscador de tendencias, aplica al mismo #aiTheme que ya lee generateVideJson()
    const videFetchTrendsBtn = document.getElementById('videFetchTrendsBtn');
    if (videFetchTrendsBtn) {
        videFetchTrendsBtn.addEventListener('click', () => buscarTendencias('videTrendsContainer', videFetchTrendsBtn.querySelector('.trends-loader')));
    }

    // Sincronizar estado inicial
    setWorkMode('Ai');

    // Cargar clasificación de industrias desde Supabase
    fetch('/api/industrias')
        .then(r => r.json())
        .then(res => {
            if (res.status !== 'success' || !res.data) throw new Error('API error');
            const data = {
                clasificacion: res.data.map(item => ({
                    id: item.id,
                    categoria: item.categoria,
                    icono: item.icono || '',
                    descripcion: item.descripcion || '',
                    subclasificaciones: (item.nichos || []).map(n => ({
                        valor: n.valor,
                        etiqueta: n.etiqueta,
                        sinonimos: n.sinonimos || [],
                        especializaciones: n.especializaciones || []
                    }))
                }))
            };
            initCategoriaLookup(data);
            populateIndustrias();
            showCategoriaHint();
            updateEspecializacionSelect();
        })
        .catch(() => {
            // Fallback: cargar JSON local si Supabase falla
            fetch('/config/industrias.json')
                .then(r => r.json())
                .then(data => { initCategoriaLookup(data); populateIndustrias(); showCategoriaHint(); updateEspecializacionSelect(); })
                .catch(() => {});
        });

    // Cargar historial al inicio
    fetchHistory();

    // Event Listener para Refrescar Historial
    refreshHistoryBtn.addEventListener('click', fetchHistory);

    // Event Listener para selección de receta (IMAGINACION)
    const recipeSelect = document.getElementById('recipeSelect');
    if (recipeSelect) {
        recipeSelect.addEventListener('change', function() {
            const details = document.getElementById('recipeDetails');
            if (!this.value) { details.style.display = 'none'; return; }
            details.style.display = 'block';
            const val = this.value;
            // Buscar receta en window.recetasData
            const recetas = window.recetasData || [];
            const recipe = recetas.find(r => r.id == val);
            if (!recipe) return;
            document.getElementById('recipeOrden').value = recipe.orden || 'aleatorio';
            document.getElementById('recipeDuracion').value = recipe.duracion_total || '30';
            document.getElementById('recipeRitmo').value = recipe.ritmo || 'musica';
            document.getElementById('recipeFiltro').value = recipe.filtro || 'ninguno';
            document.getElementById('recipeTransicion').value = recipe.transicion || 'corte_brusco';
            document.getElementById('recipeAnimacion').checked = !!recipe.animacion;
        });
    }

    // Event Listener para Descargar Kit
    downloadBtn.addEventListener('click', downloadCampaignKit);

    // Event Listener para Generar Video desde carrusel
    const generateVideoBtn = document.getElementById('generateVideoBtn');
    generateVideoBtn.addEventListener('click', generateVideoFromCarousel);

    // Event Listener para Generación IA
    generateBtn.addEventListener('click', generateAIContent);

    // Model Selector
    const modelSelect = document.getElementById('modelSelect');
    const modelHint = document.getElementById('modelHint');
    const modelDescriptions = {
        'deepseek/deepseek-v4-flash': '⚡ DeepSeek V4 Flash — Rápido y gratis. El mejor para contenido.',
        'qwen/qwen3.6-35b-a3b:free': '🧠 Qwen 3.6 35B — Creativo en español. Textos largos.',
        'openrouter/free': '🔄 OpenRouter Free — Rápido pero variable.',
        'meta-llama/llama-4-maverick:free': '🦙 Llama 4 Maverick — Bueno para razonamiento.',
        'google/gemma-3-27b-it:free': '💎 Gemma 3 27B — Sigue instrucciones bien.',
        'qwen/qwen-2.5-72b-instruct:free': '👑 Qwen 2.5 72B — Máxima calidad, más lento.',
        'mistralai/mistral-small-3.1-24b-instruct:free': '💨 Mistral Small — Ultra rápido, tareas simples.'
    };
    if (modelSelect) {
        modelSelect.addEventListener('change', async () => {
            const selected = modelSelect.value;
            if (modelHint) modelHint.textContent = modelDescriptions[selected] || '';
            try {
                await fetch('/api/models/select', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ modelId: selected })
                });
                showToast(`🤖 Modelo: ${modelSelect.options[modelSelect.selectedIndex].text.split('—')[0].trim()}`, 'success');
            } catch (e) { console.log('Model select error:', e); }
        });
    }

    // Event Listener para IMG de Imaginación
    const imaginationBtn = document.getElementById('imaginationBtn');
    if (imaginationBtn) imaginationBtn.addEventListener('click', generateImaginationVideo);

    // Event Listener para Agente de Tendencias
    const agentBtn = document.getElementById('agentBtn');
    if (agentBtn) agentBtn.addEventListener('click', ejecutarAgente);

    // Event Listener para VIDE (Suite Completa)
    const videGenerateBtn = document.getElementById('videGenerateBtn');
    if (videGenerateBtn) videGenerateBtn.addEventListener('click', generateVideVideo);
    // Event Listener para Brief → MediaPlanner → BriefMarker (botón propio en VIDE)
    const videMediaPlanBtn = document.getElementById('videMediaPlanBtn');
    if (videMediaPlanBtn) videMediaPlanBtn.addEventListener('click', generateMediaPlanFromUI);
    // Event Listener para retomar un plan de medios viejo por id
    const videResumePlanBtn = document.getElementById('videResumePlanBtn');
    if (videResumePlanBtn) videResumePlanBtn.addEventListener('click', listRecentPlans);
    // Event Listener para ViRe (Remotion, motor independiente de VIDE)
    const vireGenerateBtn = document.getElementById('vireGenerateBtn');
    if (vireGenerateBtn) vireGenerateBtn.addEventListener('click', generateViReVideo);
    const vireCancelBtn = document.getElementById('vireCancelBtn');
    if (vireCancelBtn) vireCancelBtn.addEventListener('click', () => {
        if (!vireCurrentJobId) return;
        fetch('/api/vire-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: vireCurrentJobId })
        }).catch(() => {});
    });
    const videGenerateJsonBtn = document.getElementById('videGenerateJsonBtn');
    if (videGenerateJsonBtn) videGenerateJsonBtn.addEventListener('click', generateVideJson);

    // VIDE: Guion mode toggle (texto / JSON)
    const videGuionMode = document.getElementById('videGuionMode');
    const videJsonMode = document.getElementById('videJsonMode');
    const videGuion = document.getElementById('videGuion');
    const videGuionJson = document.getElementById('videGuionJson');
    if (videGuionMode) {
        videGuionMode.addEventListener('click', () => {
            videGuion.style.display = '';
            videGuionJson.style.display = 'none';
            videGuionMode.style.background = 'rgba(99,102,241,0.15)';
            videGuionMode.style.borderColor = 'rgba(99,102,241,0.4)';
            videGuionMode.style.color = '#a5b4fc';
            videJsonMode.style.background = 'rgba(255,255,255,0.05)';
            videJsonMode.style.borderColor = 'var(--glass-border)';
            videJsonMode.style.color = 'var(--text-dim)';
        });
    }
    if (videJsonMode) {
        videJsonMode.addEventListener('click', () => {
            videGuion.style.display = 'none';
            videGuionJson.style.display = '';
            videJsonMode.style.background = 'rgba(99,102,241,0.15)';
            videJsonMode.style.borderColor = 'rgba(99,102,241,0.4)';
            videJsonMode.style.color = '#a5b4fc';
            videGuionMode.style.background = 'rgba(255,255,255,0.05)';
            videGuionMode.style.borderColor = 'var(--glass-border)';
            videGuionMode.style.color = 'var(--text-dim)';
        });
    }

    if (videGuionJson) {
        videGuionJson.addEventListener('input', () => syncVideFieldsFromJson(videGuionJson.value));
    }

    const videDurationInput = document.getElementById('videDuration');
    if (videDurationInput && aiSlides) {
        videDurationInput.addEventListener('input', () => {
            const seconds = parseInt(videDurationInput.value) || 0;
            if (seconds <= 0) return;
            // ~7.5s/escena es un ritmo razonable (el schema del guion ya pide 4-15s por escena);
            // solo sugiere — el usuario puede ajustar #aiSlides libremente después.
            const suggested = Math.min(10, Math.max(1, Math.round(seconds / 7.5)));
            aiSlides.value = suggested;
        });
    }

    // VIDE: company datalist — no extra sync needed (free text)

    // Cargar recetas
    loadRecetas();

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

    // Event Listener para Envío (GAS + Supabase dual-write)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        resetFormErrors();

        const formData = getFormData();
        if (!validateFormData(formData)) return;

        setLoading(true);
        let gasOk = false;
        let supaOk = false;

        try {
            // 1. Enviar a GAS (Google Sheets) — vía /api/save (el proxy que de
            // verdad reenvía el POST a Apps Script). Antes apuntaba a
            // /api/history, que solo hace GET y descarta cualquier body — nunca
            // guardaba nada, pero con mode:'no-cors' la respuesta es opaca y
            // gasOk quedaba en true sin importar qué pasara realmente.
            const gasRes = await fetch(CONFIG.SAVE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const gasJson = await gasRes.json();
            gasOk = gasJson.status === 'success';
            console.log(gasOk ? '📡 [GAS_SENT]: Guardado en Sheets' : `⚠️ [GAS_ERROR]: ${gasJson.message}`);
        } catch (error) {
            console.warn('GAS fallback:', error.message);
        }

        try {
            // 2. Guardar en Supabase (dual-write, no bloqueante)
            const company = document.getElementById('companyName')?.value?.trim() || '';
            const platform = document.querySelector('.platform-tab.active')?.dataset?.platform || '';
            const format = document.querySelector('.format-tab.active')?.dataset?.format || '';
            const mode = currentMode || 'Ai';
            await fetch(CONFIG.CAMPANAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: `camp_${Date.now()}`,
                    empresa: company,
                    nombre: (formData.caption || '').substring(0, 100),
                    tema: document.getElementById('aiTheme')?.value?.trim() || '',
                    formato: format,
                    plataforma: platform,
                    modo: mode,
                    contenido: formData.caption || '',
                    estado: 'publicado',
                    configuracion: {
                        template: document.getElementById('aiTemplate')?.value || '',
                        slides: document.getElementById('aiSlides')?.value || 5,
                        voice: formData.options?.voice || false,
                        music: formData.options?.music || false,
                        video: formData.options?.video || false
                    },
                    contenido_json: lastGeneratedContent || {}
                })
            });
            supaOk = true;
            console.log('📡 [SUPABASE_SENT]: Campaña guardada');
        } catch (error) {
            console.warn('Supabase write:', error.message);
        }

        if (gasOk || supaOk) {
            showToast(`✅ Campaña guardada${gasOk ? ' (Sheets)' : ''}${supaOk ? ' + Supabase' : ''}`, 'success');
            form.reset();
            
            // Actualizar historial después de un pequeño delay
            setTimeout(fetchHistory, 2000);
        } else {
            showToast('❌ Error al guardar en ambas fuentes', 'error');
        }

        setLoading(false);
    });
});

async function generateAIContent() {
    // --- MODO BDPV: generar presentación HTML ---
    if (currentMode === 'BDPV') {
        const company = document.getElementById('companyName').value.trim();
        if (!company) {
            showToast('❌ Selecciona una empresa/marca', 'error');
            return;
        }
        setAiLoading(true);
        try {
            // Collect BDPV data
            const website = document.getElementById('webSite')?.value.trim() || '';
            const phone = document.getElementById('contactPhone')?.value.trim() || '';
            const logoFile = document.getElementById('companyLogoFile')?.files?.[0];
            const logoUrl = document.getElementById('companyLogo')?.value.trim() || '';
            const noLogo = document.getElementById('bdpvNoLogo')?.checked || false;
            const region = document.getElementById('bdpvRegion')?.value.trim() || 'Monterrey, N.L., México';
            const subNicho = document.getElementById('bdpvSubNicho')?.value || document.getElementById('bdpvSubNichoText')?.value.trim() || '';
            const autoPhotos = document.getElementById('bdpvAutoPhotos')?.checked || false;
            const industry = aiNicho ? aiNicho.value : document.getElementById('aiIndustry')?.value || '';
            const industryLabel = industry ? document.querySelector(`#aiNicho option[value="${industry}"]`)?.textContent || industry : '';

            // Get selected skills
            const skills = Array.from(document.querySelectorAll('.bdpv-skill:checked')).map(cb => cb.value);

            // Get uploaded photos
            const photoFiles = window.bdUploadedPhotos || [];

            // Build payload
            const payload = {
                company,
                website,
                phone,
                logoUrl,
                noLogo,
                region,
                subNicho,
                autoPhotos,
                industry: industryLabel,
                skills,
                photoCount: photoFiles.length
            };

            const BDPV_BASE = `http://${location.hostname}:8000`;
            const res = await fetch(`${BDPV_BASE}/api/bdpv/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status === 'success') {
                showToast(`✅ Presentación generada: ${data.filename}`, 'success');
                // Show link to open the file
                if (data.filePath) {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = `📂 Abrir: ${data.filename}`;
                    link.style.cssText = 'display:block;margin-top:0.5rem;color:#60a5fa;text-align:center;font-size:0.9rem';
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await fetch(`${BDPV_BASE}/api/bdpv/open`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filePath: data.filePath })
                        });
                    });
                    captionField.value = `✅ Presentación generada: ${data.filename}`;
                    // Append link after caption
                    const parent = captionField.parentElement;
                    const existing = parent.querySelector('.bdpv-open-link');
                    if (existing) existing.remove();
                    link.className = 'bdpv-open-link';
                    parent.appendChild(link);
                }
            } else {
                showToast(`❌ Error: ${data.error || 'Desconocido'}`, 'error');
            }
        } catch (e) {
            showToast(`❌ Error de conexión: ${e.message}`, 'error');
        }
        setAiLoading(false);
        return;
    }

    // --- MODO LP: generar landing page HTML ---
    if (currentMode === 'LP') {
        const company = document.getElementById('companyName').value.trim();
        if (!company) {
            showToast('❌ Selecciona una empresa/marca', 'error');
            return;
        }
        setAiLoading(true);
        try {
            const website = document.getElementById('webSite')?.value.trim() || '';
            const phone = document.getElementById('contactPhone')?.value.trim() || '';
            const logoFile = document.getElementById('companyLogoFile')?.files?.[0];
            const logoUrl = document.getElementById('companyLogo')?.value.trim() || '';
            const noLogo = document.getElementById('bdpvNoLogo')?.checked || false;
            const region = document.getElementById('bdpvRegion')?.value.trim() || 'Monterrey, N.L., México';
            const subNicho = document.getElementById('bdpvSubNicho')?.value || document.getElementById('bdpvSubNichoText')?.value.trim() || '';
            const industry = aiNicho ? aiNicho.value : document.getElementById('aiIndustry')?.value || '';
            const industryLabel = industry ? document.querySelector(`#aiNicho option[value="${industry}"]`)?.textContent || industry : '';

            const skills = Array.from(document.querySelectorAll('.bdpv-skill:checked')).map(cb => cb.value);

            const payload = {
                company,
                website,
                phone,
                logoUrl,
                noLogo,
                region,
                subNicho,
                industry: industryLabel,
                skills,
                photoCount: (window.bdUploadedPhotos || []).length
            };

            const LP_BASE = `http://${location.hostname}:8000`;
            const res = await fetch(`${LP_BASE}/api/lp/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.status === 'success') {
                showToast(`✅ Landing generada: ${data.filename}`, 'success');
                if (data.filePath) {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = `📂 Abrir: ${data.filename}`;
                    link.style.cssText = 'display:block;margin-top:0.5rem;color:#60a5fa;text-align:center;font-size:0.9rem';
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await fetch(`${LP_BASE}/api/lp/open`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filePath: data.filePath })
                        });
                    });
                    captionField.value = `✅ Landing generada: ${data.filename}`;
                    const parent = captionField.parentElement;
                    const existing = parent.querySelector('.bdpv-open-link');
                    if (existing) existing.remove();
                    link.className = 'bdpv-open-link';
                    parent.appendChild(link);
                }
            } else {
                showToast(`❌ Error: ${data.error || 'Desconocido'}`, 'error');
            }
        } catch (e) {
            showToast(`❌ Error de conexión: ${e.message}`, 'error');
        }
        setAiLoading(false);
        return;
    }

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

    // --- MODO BDSMT: generar basado en tendencia seleccionada ---
    if (currentMode === 'BDSMT') {
        const trend = window.selectedTrend;
        if (!trend) {
            showToast('❌ Primero busca y selecciona una tendencia', 'error');
            return;
        }
        const company = document.getElementById('companyName').value.trim();
        if (!company) {
            showToast('❌ Selecciona una empresa/marca', 'error');
            return;
        }
        const niche = aiNicho ? aiNicho.value : aiIndustry.value;
        if (!niche) {
            showToast('❌ Selecciona un nicho/industria', 'error');
            return;
        }
        const subNiche = document.getElementById('bdsmtSubNicho').value;
        const region = document.getElementById('bdsmtRegion').value.trim() || 'México';
        const platform = document.querySelector('.platform-tab.active').dataset.platform;
        const format = document.querySelector('.format-tab.active').dataset.format;
        const slides = aiSlides.value || 5;
        const template = aiTemplate.value || 'storytelling';
        const conciencia = document.getElementById('aiConciencia').value || 'Consciente_Solucion';
        const phone = document.getElementById('contactPhone').value.trim();

        setAiLoading(true);
        try {
            const response = await fetch('/api/trends/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trend,
                    niche,
                    subNiche,
                    region,
                    slides: parseInt(slides),
                    template,
                    platform,
                    format,
                    conciencia,
                    empresa: company,
                    phone
                })
            });

            const json = await response.json();
            if (json.status !== 'success') throw new Error(json.message || 'Error en el servidor');

            captionField.value = json.data.caption;
            lastGeneratedContent = json.data;
            await renderCarouselFromJson(json.data);
            showToast('✨ Campaña basada en tendencia generada', 'success');
        } catch (e) {
            showToast('❌ BDSMT: ' + e.message, 'error');
        } finally {
            setAiLoading(false);
        }
        return;
    }

    const industry = aiNicho ? aiNicho.value : aiIndustry.value;
    const conciencia = document.getElementById('aiConciencia').value;
    let template = aiTemplate.value;

    if (!template) {
        template = TEMPLATE_MAP[conciencia];
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

    // Ocultar botón de video de generación anterior
    const prevVideoBtn = document.getElementById('generateVideoBtn');
    if (prevVideoBtn) prevVideoBtn.style.display = 'none';

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

    // 📝 CONSTRUCCIÓN DEL PROMPT MAESTRO (desde Prompts_IA)
    const catLabel = getCategoriaIndustria(industry);
    const espLabel = aiEspecializacion.value;
    const contextDetails = `Nicho: ${industry}${catLabel ? `, Categoria: ${catLabel}` : ''}${espLabel ? `, Especializacion: ${espLabel}` : ''}`;
    let promptTemplate = await loadPrompt('CAMP-AI-MASTER');
    if (!promptTemplate) {
        showToast('❌ Error al cargar el prompt desde Prompts_IA', 'error');
        setAiLoading(false);
        return;
    }
    const systemPrompt = promptTemplate
        .replace(/\$\{company\}/g, company)
        .replace(/\$\{contextDetails\}/g, contextDetails)
        .replace(/\$\{theme\}/g, theme)
        .replace(/\$\{template\}/g, template)
        .replace(/\$\{conciencia\}/g, conciencia)
        .replace(/\$\{slides\}/g, slides)
        .replace(/\$\{lengthRule\}/g, lengthRule)
        .replace(/\$\{industry\}/g, industry);

    const userPrompt = `Generar campaña de ${slides} slides para ${platform} en formato ${format}. CTA final: ${phone || 'Interacción en redes'}. ¡Responde estrictamente con JSON!`;

    try {
        const selectedModel = document.getElementById('modelSelect')?.value || 'deepseek/deepseek-v4-flash';
        const response = await fetch(CONFIG.AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                model: selectedModel
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
        lastGeneratedContent = generatedJson;
        await renderCarouselFromJson(generatedJson);
        
        // Mostrar botón de video y auto-generar si el toggle está activo
        const videoBtn = document.getElementById('generateVideoBtn');
        videoBtn.style.display = 'inline-flex';
        const autoVideo = document.getElementById('enableVideo')?.checked;
        if (autoVideo) {
            setTimeout(() => generateVideoFromCarousel(), 500);
        }
        
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
        contenidoJson: lastGeneratedContent || {},
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
    // Si el contenido pegado es un JSON de guion VIDE ({config, escenas:[...]}),
    // NO es texto de campaña libre: el split por regex de abajo lo trocea mal
    // porque palabras como "Slide"/números aparecen dentro de los valores del JSON.
    // Normalizamos escenas -> slides y delegamos en el render JSON-aware existente.
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            const escenas = Array.isArray(parsed) ? parsed : parsed.escenas;
            if (Array.isArray(escenas)) {
                previewSection.style.display = 'block';
                const slides = escenas.map(s => ({
                    title: s.titulo || s.title || '',
                    body: s.texto || s.body || '',
                    visual: s.visual || s.image_prompt || ''
                }));
                lastGeneratedContent = { slides };
                await renderCarouselFromJson({ slides });
                return;
            }
        } catch (_) {
            // No era JSON válido: seguimos con el parseo de texto plano de abajo
        }
    }

    carouselContainer.innerHTML = '';
    previewSection.style.display = 'block';

    // Dividimos por "Slide" o "Diapositiva" o números seguidos de punto
    const slides = text.split(/(?=Slide|Diapositiva|\n\d+\.)/i).filter(s => s.trim().length > 10);

    const format = document.querySelector('.format-tab.active').dataset.format;
    const rawLogoUrl = normalizeDriveUrl(document.getElementById('companyLogo').value.trim());
    const finalLogoUrl = uploadedLogoDataUrl || await resolveLogoUrl(rawLogoUrl);

    // Se llena en paralelo al forEach de abajo para que Submit guarde el JSON
    // real de este preview (BDPR), no el de una generación anterior sin relación.
    const parsedSlidesForSave = [];

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

        parsedSlidesForSave.push({ title, body, visual });

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
        slideEl.textContent = '';
        const loaderDiv = document.createElement('div');
        loaderDiv.id = `loader-${slideId}`;
        loaderDiv.className = 'image-loading-state';
        loaderDiv.innerHTML = '<div class="clock-loader"></div><div class="loading-text">GENERANDO IMAGEN...</div>';
        slideEl.appendChild(loaderDiv);

        if (finalLogoUrl) {
            const logoImg = document.createElement('img');
            logoImg.src = finalLogoUrl;
            logoImg.className = 'slide-logo';
            logoImg.alt = 'logo';
            slideEl.appendChild(logoImg);
        }

        const slideImage = document.createElement('div');
        slideImage.className = 'slide-image';
        slideImage.id = slideId;
        slideEl.appendChild(slideImage);

        const overlay = document.createElement('div');
        overlay.className = 'slide-overlay';
        const voicePlayer = document.createElement('div');
        voicePlayer.className = 'voice-player';
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'voice-btn';
        voiceBtn.title = 'Escuchar Texto y Música';
        voiceBtn.textContent = '\u{1F50A}';
        voiceBtn.addEventListener('click', function() { speakText(body, this); });
        voicePlayer.appendChild(voiceBtn);
        overlay.appendChild(voicePlayer);

        const slideNum = document.createElement('div');
        slideNum.className = 'slide-number';
        slideNum.textContent = `Slide ${index + 1}`;
        overlay.appendChild(slideNum);

        const slideTitle = document.createElement('div');
        slideTitle.className = 'slide-title';
        slideTitle.textContent = title;
        overlay.appendChild(slideTitle);

        const slideBody = document.createElement('div');
        slideBody.className = 'slide-body';
        slideBody.textContent = body;
        overlay.appendChild(slideBody);

        if (visual) {
            const slideVisual = document.createElement('div');
            slideVisual.className = 'slide-visual';
            slideVisual.textContent = `📸 Imagen: ${visual}`;
            overlay.appendChild(slideVisual);
        }

        slideEl.appendChild(overlay);
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

    lastGeneratedContent = { slides: parsedSlidesForSave };
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
    if (refreshHistoryBtn) refreshHistoryBtn.classList.add('spinning');

    try {
        // 1. Intentar Supabase primero (más rápido y confiable)
        const res = await fetch(CONFIG.CAMPANAS_URL);
        const json = await res.json();
        if (json.status === 'success' && json.data && json.data.length > 0) {
            renderHistory(json.data.map(c => ({
                caption: c.contenido || c.nombre || '',
                status: `${c.empresa || ''}, ${c.plataforma || ''}, ${c.formato || ''}, Mode:${c.modo || ''}`,
                fecha: c.created_at || c.fecha || '',
                mediaurl: c.configuracion?.mediaUrl || '',
                empresa: c.empresa || '',
                modo: c.modo || ''
            })));
            if (refreshHistoryBtn) refreshHistoryBtn.classList.remove('spinning');
            return;
        }
    } catch (e) {
        console.warn('Supabase history fallback:', e.message);
    }

    try {
        // 2. Fallback a GAS (Google Sheets)
        const response = await fetch(CONFIG.HISTORY_URL);
        const data = await response.json();
        
        if (data.status === 'success') {
            renderHistory(data.data);
        } else {
            console.warn('GAS Error:', data.message);
            historyContainer.innerHTML = `<div class="empty-state" style="color:var(--error)">⚠️ Error: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        historyContainer.innerHTML = '<div class="empty-state">No se pudo cargar el historial.</div>';
    } finally {
        if (refreshHistoryBtn) refreshHistoryBtn.classList.remove('spinning');
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

        card.textContent = '';
        const cardImg = document.createElement('div');
        cardImg.className = 'history-card-image';
        cardImg.style.backgroundImage = `url('${imageUrl}')`;
        card.appendChild(cardImg);

        const cardContent = document.createElement('div');
        cardContent.className = 'history-card-content';

        const cardMeta = document.createElement('div');
        cardMeta.className = 'history-card-meta';
        cardMeta.textContent = item.status || 'General';
        cardContent.appendChild(cardMeta);

        const cardTitle = document.createElement('div');
        cardTitle.className = 'history-card-title';
        cardTitle.textContent = title;
        cardContent.appendChild(cardTitle);

        const cardDate = document.createElement('div');
        cardDate.className = 'history-card-date';
        cardDate.textContent = `📅 ${date}`;
        cardContent.appendChild(cardDate);

        card.appendChild(cardContent);
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
                const totalDuration = parseInt(document.getElementById('animationDuration')?.value) || 15;
                const perSlideDuration = Math.max(1, Math.ceil(totalDuration / slides.length));

                // Detectar formato para resolución del video
                const activeFormat = document.querySelector('.format-tab.active')?.dataset.format || 'Post';
                const isVertical = (activeFormat === 'Reel' || activeFormat === 'Story');

                // Capturar slides SIN elementos de UI
                const kitImages = [];
                for (let i = 0; i < slides.length; i++) {
                    const slide = slides[i];

                    // Ocultar elementos de UI
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
                            scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#0f172a'
                        });
                        kitImages.push(canvas.toDataURL('image/jpeg', 0.9));
                        downloadBtn.innerHTML = `<div class="loader" style="display:inline-block; margin-right:8px;"></div> 📷 ${i+1}/${slides.length}`;
                    } finally {
                        // Restaurar elementos de UI
                        if (voiceBtn) voiceBtn.style.visibility = 'visible';
                        if (slideControls) slideControls.style.visibility = 'visible';
                        if (visualTag) visualTag.style.visibility = 'visible';
                        if (slideNumberTag) slideNumberTag.style.visibility = 'visible';
                        if (titleTag && originalTitle) titleTag.innerText = originalTitle;
                    }
                }

                downloadBtn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px;"></div> 🚀 ENSAMBLANDO...';
                const resp = await fetch('/api/slideshow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: kitImages, effect, duration: perSlideDuration, transition: 'fade', vertical: isVertical })
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

async function generateVideoFromCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) {
        showToast('❌ No hay carrusel para convertir en video', 'error');
        return;
    }

    const btn = document.getElementById('generateVideoBtn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px; width:16px; height:16px;"></div> VIDEO...';

    const progress = document.getElementById('videoProgress');
    const fill = document.getElementById('videoProgressFill');
    const text = document.getElementById('videoProgressText');
    progress.style.display = 'flex';

    showToast(`🎬 Generando video desde ${slides.length} slides...`, 'info');

    try {
        const effect = document.getElementById('animationEffect')?.value || 'zoom';
        const totalDuration = parseInt(document.getElementById('animationDuration')?.value) || 15;
        const perSlideDuration = Math.max(1, Math.ceil(totalDuration / slides.length));
        const activeFormat = document.querySelector('.format-tab.active')?.dataset.format || 'Post';
        const isVertical = (activeFormat === 'Reel' || activeFormat === 'Story' || activeFormat === 'TikTok');

        const kitImages = [];
        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const uiEls = slide.querySelectorAll('.voice-player, .slide-controls, .slide-visual, .slide-number');
            uiEls.forEach(el => el.style.visibility = 'hidden');

            const titleTag = slide.querySelector('.slide-title');
            let originalTitle = "";
            if (titleTag) {
                originalTitle = titleTag.innerText;
                titleTag.innerText = originalTitle.replace(/^\s*\(\d+\)\s*[-.:]?\s*/, '');
            }

            try {
                const canvas = await html2canvas(slide, {
                    scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#0f172a'
                });
                kitImages.push(canvas.toDataURL('image/jpeg', 0.9));
                const pct = Math.round(((i + 1) / slides.length) * 60);
                fill.style.width = pct + '%';
                text.textContent = `Capturando slide ${i+1}/${slides.length}`;
            } finally {
                uiEls.forEach(el => el.style.visibility = 'visible');
                if (titleTag && originalTitle) titleTag.innerText = originalTitle;
            }
        }

        fill.style.width = '65%';
        text.textContent = 'Ensamblando video con FFmpeg...';
        btn.innerHTML = '<div class="loader" style="display:inline-block; margin-right:8px; width:16px; height:16px;"></div> 🚀 ENSAMBLANDO...';

        const resp = await fetch('/api/slideshow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: kitImages, effect, duration: perSlideDuration, transition: 'fade', vertical: isVertical })
        });

        fill.style.width = '90%';
        text.textContent = 'Finalizando...';

        const data = await resp.json();
        if (data.status === 'success' && data.video) {
            const b64 = data.video.split(',')[1];
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'video/mp4' });
            const company = (document.getElementById('companyName').value || 'campana').replace(/\s+/g, '_').toLowerCase();
            downloadFile(URL.createObjectURL(blob), `video_${company}_${Date.now()}.mp4`);
            fill.style.width = '100%';
            text.textContent = '✅ Video listo!';
            showToast('✅ ¡Video generado y descargado!', 'success');
        } else {
            throw new Error(data.error || 'Error del servidor');
        }
    } catch (e) {
        showToast(`⚠️ Error generando video: ${e.message}`, 'error');
        console.error(e);
        fill.style.width = '0%';
        text.textContent = `❌ Error: ${e.message}`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        setTimeout(() => { progress.style.display = 'none'; }, 5000);
    }
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
    const input = document.getElementById('companyName');
    const list = document.getElementById('companyList');
    if (!input || !list) return;
    list.innerHTML = '';
    companyConfigs.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nomempresa;
        list.appendChild(opt);
    });
}



function setupCompanyAutoFill() {
    const input = document.getElementById('companyName');
    if (!input) return;
    // ponytail: called after every mode switch; without this guard each call created
    // a brand-new closure and removeEventListener(handler) was a no-op (different
    // reference), so listeners stacked and autofill ran N times per keystroke.
    if (input.dataset.autofillBound === '1') {
        if (input.value.trim()) input.dispatchEvent(new Event('input'));
        return;
    }
    input.dataset.autofillBound = '1';
    const handler = (e) => {
        const val = e.target.value;
        const valNorm = val.trim().toLowerCase();
        const selected = companyConfigs.find(c => c.nomempresa.trim().toLowerCase() === valNorm);

        if (selected) {
            console.log("🔍 [BD] Datos encontrados para:", val, selected);
            const findVal = (keys) => {
                const foundKey = Object.keys(selected).find(k =>
                    keys.some(key => k.toLowerCase().includes(key.toLowerCase()))
                );
                return foundKey ? selected[foundKey] : null;
            };

            const rawLogo = findVal(['logo_url', 'logo']);
            if (rawLogo) {
                const p = parseLogoUrlField(rawLogo);
                const logoNorm = p.logoUrl ? normalizeDriveUrl(p.logoUrl) : '';
                const avatarNorm = p.avatarUrl ? normalizeDriveUrl(p.avatarUrl) : '';
                document.getElementById('companyLogo').value = avatarNorm ? `${logoNorm},${avatarNorm}` : logoNorm;
            } else {
                document.getElementById('companyLogo').value = '';
            }

            const tel = findVal(['telefonowhastapp', 'telefonowhasapp', 'telefono', 'tel', 'whatsapp', 'whas']);
            document.getElementById('contactPhone').value = tel || "";

            const webStr = (findVal(['enlace_oficial', 'url_oficial', 'website', 'enlace']) || '').toString().trim();
            document.getElementById('webSite').value = webStr ? (webStr.startsWith('http') ? webStr : `https://${webStr}`) : '';

            const color = findVal(['color_tema', 'color', 'tema']);
            if (color) {
                document.documentElement.style.setProperty('--primary', color);
                document.documentElement.style.setProperty('--primary-hover', color + 'dd');
                showToast(`Configuración de ${val} cargada`, 'success');
            }

            // presentacion: SI / lp: SI (origen_politicas, ADR-019) + datos del Brief para
            // BDPV/LP (ADR-026). No cambia de modo solo: solo avisa, precarga lo que BDPV
            // va a necesitar si lo usa, y habilita el botón correspondiente.
            const origenPol = parseOrigenPoliticas(findVal(['origen_politicas']));
            const lpModeBtn = document.getElementById('btnModeLp');
            const bdpvModeBtn = document.getElementById('btnModeBdpv');
            if (origenPol.presentacion.toUpperCase() === 'SI') {
                showToast(`💡 ${val} tiene marcada generación de presentación (BDPV)`, 'success');
                if (bdpvModeBtn) bdpvModeBtn.classList.add('flag-active');
            } else if (bdpvModeBtn) {
                bdpvModeBtn.classList.remove('flag-active');
            }
            if (origenPol.lp.toUpperCase() === 'SI') {
                showToast(`🌐 ${val} tiene marcada generación de landing page (LP)`, 'success');
                if (lpModeBtn) {
                    lpModeBtn.disabled = false;
                    lpModeBtn.classList.add('flag-active');
                }
            } else if (lpModeBtn) {
                lpModeBtn.disabled = true;
                lpModeBtn.classList.remove('flag-active');
            }
            const brief = parseBriefTags(rawLogo);
            autoSelectIndustriaFromBrief(brief);
            const subNichoText = document.getElementById('bdpvSubNichoText');
            if (subNichoText && !subNichoText.value && brief.nicho) subNichoText.value = brief.nicho;

            fetchEstilosVisuales();
        }
        // Don't clear fields on custom input — user may be typing their own business
    };
    input.removeEventListener('input', handler);
    input.addEventListener('input', handler);
    if (input.value.trim()) {
        handler({ target: input });
    }
}

// Pipeline Brief → MediaPlanner → BriefMarker. Se activa con el botón propio
// #videMediaPlanBtn en la sección VIDE. Usa la empresa del campo companyName
// (que ya autocompleta desde Config_Empresas) y no toca el flujo VIDE/Ai normal.
async function generateMediaPlanFromUI() {
    const company = document.getElementById('companyName')?.value?.trim() || '';
    const panel = document.getElementById('mediaPlanPanel');
    const summaryEl = document.getElementById('mediaPlanSummary');
    const piezasEl = document.getElementById('mediaPlanPiezas');
    const errEl = document.getElementById('mediaPlanError');
    const triggerBtn = document.getElementById('videMediaPlanBtn');
    const triggerLoader = triggerBtn?.querySelector('.media-plan-loader');

    if (!company) {
        showToast('❌ Escribe/Selecciona la empresa (usa el autocompletado)', 'error');
        return;
    }
    if (!panel || !summaryEl || !piezasEl || !errEl) {
        showToast('❌ Panel de plan de medios no disponible', 'error');
        return;
    }

    if (triggerBtn) triggerBtn.disabled = true;
    if (triggerLoader) triggerLoader.style.display = 'inline-block';
    panel.style.display = '';
    piezasEl.innerHTML = '';
    errEl.style.display = 'none';
    summaryEl.textContent = 'Generando plan de medios con IA...';

    try {
        const res = await fetch('/api/media-plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_empresa: company })
        });
        const data = await res.json();
        if (data.status !== 'success') throw new Error(data.message || 'Error generando plan');
        const plan = data.data;
        attachMediaPlanPanel(plan.id || plan.plan_id, plan);
        showToast('✅ Plan de medios generado — revísalo y aprueba', 'success');
    } catch (e) {
        errEl.textContent = '❌ ' + e.message;
        errEl.style.display = '';
        summaryEl.textContent = '';
        showToast('❌ ' + e.message, 'error');
    } finally {
        if (triggerBtn) triggerBtn.disabled = false;
        if (triggerLoader) triggerLoader.style.display = 'none';
    }
}

// Comparte la lógica del panel entre "generar nuevo" (generateMediaPlanFromUI) y
// "retomar viejo" (resumeMediaPlan): arma el resumen, autoselecciona industria,
// engancha Aprobar/Rechazar, y si el plan ya estaba aprobado muestra sus piezas.
function attachMediaPlanPanel(planId, plan) {
    const panel = document.getElementById('mediaPlanPanel');
    const summaryEl = document.getElementById('mediaPlanSummary');
    const piezasEl = document.getElementById('mediaPlanPiezas');
    const errEl = document.getElementById('mediaPlanError');
    const acceptBtn = document.getElementById('mediaPlanAcceptBtn');
    const rejectBtn = document.getElementById('mediaPlanRejectBtn');
    if (!panel || !summaryEl || !piezasEl || !errEl || !acceptBtn || !rejectBtn) return;

    panel.style.display = '';
    piezasEl.innerHTML = '';
    errEl.style.display = 'none';

    const pm = (plan && plan.plan_de_medios) || {};
    const camps = pm.campaigns || [];
    const lines = [];
    if (pm.summary) lines.push(`📝 ${pm.summary}`);
    camps.forEach(c => {
        lines.push(`\n📌 <b>${c.nombre || c.id || 'Campaña'}</b> — prioridad ${c.prioridad || 'n/d'}`);
        if (c.objetivo) lines.push(`   🎯 ${c.objetivo}`);
        if (c.canales) lines.push(`   📱 ${Array.isArray(c.canales) ? c.canales.join(', ') : c.canales}`);
        lines.push(`   🎬 ${(c.content_slots || []).length} piezas`);
    });
    lines.push(`\nTotal: ${plan?.total_slots ?? 'n/d'} slots · estado: ${plan?.estado || 'n/d'}`);
    summaryEl.innerHTML = lines.join('<br>');

    // Autoselección de industria/nicho desde el brief si la empresa no la tenía
    autoSelectIndustriaFromBrief(plan?.brief_normalizado);

    // Aprobar: genera piezas con BriefMarker (N llamadas IA, puede tardar).
    // Reintentable: si ya se aprobó antes y quedaron piezas con error (ej. por
    // rate limit), volver a Aprobar solo reintenta las pendientes, no repite
    // (ni re-paga) las que ya salieron bien — ver approveMediaPlan() en el server.
    acceptBtn.disabled = false;
    const scopeSel = document.getElementById('mediaPlanScope');
    const onApprove = async () => {
        if (!planId) return;
        acceptBtn.disabled = true;
        piezasEl.innerHTML = 'Generando piezas con BriefMarker (puede tardar)...';
        try {
            // El estilo visual viaja con la elección ya resuelta: si el usuario
            // eligió categoría/sub-estilo a mano manda eso; si dejó "Automático",
            // manda lo que el Director (autoPickStyleByTrend) decidió. Precedencia
            // resuelta por estiloVisualSeleccionado (ver plan-pieza-a-video.md P2).
            const res = await fetch(`/api/media-plan/${planId}/aprobar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estilo_visual: estiloVisualSeleccionado || null, cap: scopeSel ? parseInt(scopeSel.value) || 12 : 12 })
            });
            const data = await res.json();
            if (data.status !== 'success') throw new Error(data.message || 'Error aprobando');
            const r = data.data;
            const nGen = r.piezas_generadas ?? 0;
            const nErr = r.piezas_error ?? 0;
            const nTotal = r.piezas_generadas_total ?? nGen;
            piezasEl.innerHTML = `✅ <b>${nTotal}</b> piezas generadas en total${nErr ? ` · ⚠️ ${nErr} con error (click Aprobar de nuevo para reintentar)` : ''} · sin procesar: ${r.sin_procesar ?? 0}`;
            showToast(`✅ Plan aprobado: ${nTotal} piezas creativas`, 'success');
            if (!nErr) acceptBtn.disabled = true; else acceptBtn.disabled = false;

            // Lista las piezas reales y ofrece "🎬 Generar Video" por cada una,
            // reusando el MISMO motor de VIDE con el guion pre-armado de la pieza.
            await renderPlanPiezas(planId, piezasEl);
        } catch (e) {
            piezasEl.innerHTML = '';
            errEl.textContent = '❌ ' + e.message;
            errEl.style.display = '';
            showToast('❌ ' + e.message, 'error');
            acceptBtn.disabled = false;
        }
    };
    const onReject = async () => {
        if (!planId) return;
        rejectBtn.disabled = true;
        try {
            await fetch(`/api/media-plan/${planId}/rechazar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            piezasEl.innerHTML = '🗑️ Plan rechazado';
            showToast('🗑️ Plan de medios rechazado', 'info');
            acceptBtn.disabled = true;
        } catch (e) {
            showToast('❌ ' + e.message, 'error');
            rejectBtn.disabled = false;
        }
    };
    acceptBtn.onclick = onApprove;
    rejectBtn.onclick = onReject;

    // Al retomar un plan ya aprobado, mostrar sus piezas generadas de una vez
    if (plan && plan.estado === 'aprobado') {
        renderPlanPiezas(planId, piezasEl);
    }
}

// Lista las piezas de un plan aprobado y las muestra con su formato/canal/goal
// y un botón "🎬 Generar Video" por cada una. El botón reusa generateVideVideo()
// con el guion pre-armado de la pieza (creative_json.scenes) — mismo motor
// /api/video-produce de VIDE, sin pipeline nuevo.
async function renderPlanPiezas(planId, container) {
    if (!container) return;
    try {
        const res = await fetch(`/api/media-plan/${planId}/piezas`);
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.message || 'Error listando piezas');
        const piezas = (json.data || []).filter(p => p.estado === 'generado' && p.creative_json?.scenes?.length);
        if (piezas.length === 0) {
            container.innerHTML += '<div style="margin-top:0.5rem;">Sin piezas generadas aún.</div>';
            return;
        }
        const list = document.createElement('div');
        list.style.marginTop = '0.5rem';
        piezas.forEach(p => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.35rem 0;border-top:1px solid rgba(255,255,255,0.06);';
            const info = document.createElement('span');
            info.innerHTML = `${p.slot_id || p.id} · <b>${p.format || 'Reel'}</b>${p.channel ? ' · ' + p.channel : ''}${p.goal ? ' · 🎯 ' + p.goal : ''}`;
            const btn = document.createElement('button');
            btn.textContent = '🎬 Generar Video';
            btn.type = 'button';
            btn.style.cssText = 'padding:0.3rem 0.7rem;border-radius:8px;border:1px solid rgba(99,102,241,0.4);background:rgba(99,102,241,0.15);color:#a5b4fc;cursor:pointer;font-size:0.7rem;white-space:nowrap;';
            btn.onclick = () => {
                // La empresa del formulario debe seguir siendo la del plan — el
                // motor de video usa el mismo campo companyName; si cambió, se
                // genera un video con datos cruzados de otra empresa.
                const currentCompany = document.getElementById('companyName')?.value?.trim() || '';
                if (!currentCompany) {
                    showToast('❌ Selecciona la empresa en DATOS / NEGOCIO antes de generar el video', 'error');
                    return;
                }
                generateVideVideo({ escenas: p.creative_json.scenes });
            };
            row.appendChild(info);
            row.appendChild(btn);
            list.appendChild(row);
        });
        container.appendChild(list);
    } catch (e) {
        container.innerHTML += `<div style="margin-top:0.5rem;color:#f87171;">⚠️ No se pudieron cargar las piezas: ${e.message}</div>`;
    }
}

// Lista los planes recientes (botón 📂 Retomar Plan de Medios) y ofrece "Cargar"
// por cada uno. El plan completo se reabre con resumeMediaPlan(), que reusa el
// mismo attachMediaPlanPanel() del flujo "generar nuevo".
async function listRecentPlans() {
    const btn = document.getElementById('videResumePlanBtn');
    const listEl = document.getElementById('resumePlanList');
    if (!btn || !listEl) return;
    if (listEl.style.display !== 'none') { listEl.style.display = 'none'; return; }

    listEl.style.display = '';
    listEl.innerHTML = 'Cargando planes recientes...';
    try {
        const res = await fetch('/api/media-plan/recientes');
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.message || 'Error listando planes');
        const planes = json.data || [];
        if (planes.length === 0) {
            listEl.innerHTML = '<div style="padding:0.4rem;color:var(--text-dim);">Sin planes aún — genera uno primero.</div>';
            return;
        }
        listEl.innerHTML = '';
        planes.forEach(p => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.35rem 0;border-top:1px solid rgba(255,255,255,0.06);';
            const fecha = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
            const info = document.createElement('span');
            info.innerHTML = `<b>${p.empresa || p.id_empresa || 'Sin empresa'}</b> · ${p.estado || ''}${fecha ? ' · ' + fecha : ''} · ${p.total_slots ?? '?'} slots`;
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Cargar';
            loadBtn.type = 'button';
            loadBtn.style.cssText = 'padding:0.3rem 0.7rem;border-radius:8px;border:1px solid rgba(99,102,241,0.4);background:rgba(99,102,241,0.15);color:#a5b4fc;cursor:pointer;font-size:0.7rem;white-space:nowrap;';
            loadBtn.onclick = () => resumeMediaPlan(p.id);
            row.appendChild(info);
            row.appendChild(loadBtn);
            listEl.appendChild(row);
        });
    } catch (e) {
        listEl.innerHTML = `<div style="padding:0.4rem;color:#f87171;">⚠️ ${e.message}</div>`;
    }
}

// Reabre un plan existente por id: trae el plan completo y lo pinta con el mismo
// panel/flujo que un plan recién generado (resumen + Aprobar/Rechazar + piezas).
async function resumeMediaPlan(planId) {
    const listEl = document.getElementById('resumePlanList');
    try {
        const res = await fetch(`/api/media-plan/${planId}`);
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.message || 'Error obteniendo plan');
        attachMediaPlanPanel(planId, json.data);
        if (listEl) listEl.style.display = 'none';
        showToast('📂 Plan retomado', 'success');
    } catch (e) {
        showToast('❌ ' + e.message, 'error');
    }
}

// Normaliza texto para comparar con tolerancia a mayúsculas/acentos, "_" vs
// espacio, plurales simples y emoji/íconos al inicio (los <option> de industria
// llevan ícono + espacio, ej. "🔌 Electrodomésticos..." — una comparación exacta
// nunca matchea contra el texto plano del Brief, ni siquiera sin el problema de
// singular/plural). Reutilizable para cualquier matching de texto libre contra
// catálogos reales, en vez de comparar exacto por cada campo.
function matchText(input, candidates, textOf = c => c) {
    if (!input) return null;
    // Rango de marcas diacríticas combinantes (U+0300–U+036F) construido por
    // código, no como literal en el string — evita depender de que el editor
    // preserve bien caracteres combinantes invisibles dentro del archivo.
    const combiningMarks = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
    const norm = s => String(s).trim().toLowerCase()
        .normalize('NFD').replace(combiningMarks, '')
        .replace(/[_-]/g, ' ')
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .split(/\s+/).filter(Boolean).map(w => w.replace(/s$/, '')).join(' ');
    const target = norm(input);
    if (!target) return null;
    return candidates.find(c => norm(textOf(c)) === target) || null;
}

// Lee el brief_normalizado (o tipo_negocio crudo) y precarga industria/nicho/
// especialización en el formulario si aún están vacíos. No reescribe campos ya
// llenados y nunca lanza error si el brief no trae esos datos.
function autoSelectIndustriaFromBrief(brief) {
    if (!brief || typeof brief !== 'object') return;
    const setIfEmpty = (id, value) => {
        if (!value) return;
        const el = document.getElementById(id);
        if (el && !el.value) {
            const options = Array.from(el.options || []);
            const match = matchText(value, options, o => o.text) || options.find(o => o.value === value);
            if (match) { el.value = match.value; el.dispatchEvent(new Event('change')); }
        }
    };
    setIfEmpty('aiIndustry', brief.industria);
    setIfEmpty('aiNicho', brief.nicho);
    setIfEmpty('aiEspecializacion', brief.especializacion);
}

function setWorkMode(mode) {
    currentMode = mode;
    const aiBtn = document.getElementById('btnModeAi');
    const bdBtn = document.getElementById('btnModeBd');
    const bdprBtn = document.getElementById('btnModeBdpr');
    const imgBtn = document.getElementById('btnModeImg');
    const container = document.getElementById('companyInputContainer');
    const bdPhotosContainer = document.getElementById('bdPhotosContainer');
    const genText = document.querySelector('.gen-text');
    const magicIcon = document.querySelector('.magic-icon');
    const recipeSection = document.getElementById('recipeSection');
    const generateBtn = document.getElementById('generateBtn');
    const imaginationBtn = document.getElementById('imaginationBtn');
    const previewSection = document.getElementById('previewSection');
    const bdsmtSection = document.getElementById('bdsmtSection');
    const vireBtn = document.getElementById('btnModeViRe');
    const vireSection = document.getElementById('vireSection');
    const videBtn = document.getElementById('btnModeVide');
    const videSection = document.getElementById('videSection');

    // DOM references for show/hide
    const aiSection = document.querySelector('.ai-assistant-section');
    const webField = document.getElementById('webSite')?.closest('.input-group') || document.getElementById('webSite')?.parentElement?.parentElement;
    const phoneField = document.getElementById('contactPhone')?.closest('.input-group') || document.getElementById('contactPhone')?.parentElement?.parentElement;
    const captionGroup = document.getElementById('caption')?.closest('.input-group') || document.getElementById('caption')?.parentElement;
    const mediaGroup = document.getElementById('mediaUrl')?.closest('.input-group') || document.getElementById('mediaUrl')?.parentElement;
    const dateGroup = document.getElementById('postDate')?.closest('.input-group') || document.getElementById('postDate')?.parentElement;
    const formatMenu = document.querySelector('.format-tab')?.closest('.input-group');
    const platformMenu = document.querySelector('.platform-tab')?.closest('.input-group');

    aiBtn.classList.remove('active');
    bdBtn.classList.remove('active');
    if (bdprBtn) bdprBtn.classList.remove('active');
    if (imgBtn) imgBtn.classList.remove('active');
    const bdsmtBtn = document.getElementById('btnModeBdsmt');
    if (bdsmtBtn) bdsmtBtn.classList.remove('active');
    const bdpvBtn = document.getElementById('btnModeBdpv');
    if (bdpvBtn) bdpvBtn.classList.remove('active');
    const lpBtn = document.getElementById('btnModeLp');
    if (lpBtn) lpBtn.classList.remove('active');
    if (vireBtn) vireBtn.classList.remove('active');
    if (videBtn) videBtn.classList.remove('active');

    // Reset all sections to visible first
    document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(el => {
        el.style.display = '';
    });
    [webField, phoneField, captionGroup, mediaGroup, dateGroup, aiSection, bdPhotosContainer, document.querySelector('.production-options')].forEach(el => {
        if (el) el.style.display = '';
    });
    if (generateBtn) generateBtn.style.display = '';
    if (imaginationBtn) imaginationBtn.style.display = 'none';
    if (recipeSection) recipeSection.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    if (bdsmtSection) bdsmtSection.style.display = 'none';
    const bdpvSection = document.getElementById('bdpvSection');
    if (bdpvSection) bdpvSection.style.display = 'none';
    if (vireSection) vireSection.style.display = 'none';
    if (videSection) videSection.style.display = 'none';
    restoreSharedFieldsFromVire();

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
        if (genText) genText.textContent = 'Generar con IA (Incluye Imágenes)';
        if (magicIcon) magicIcon.textContent = '🪄';
        captionField.placeholder = 'La IA escribirá aquí...';
        return;
    }

    // BD y BDPR comparten: fotos de carrusel
    if (bdPhotosContainer) {
        bdPhotosContainer.style.display = 'block';
        if (typeof window.updateBdPhotosLabel === 'function') window.updateBdPhotosLabel();
    }

    if (mode === 'BD') {
        bdBtn.classList.add('active');
        console.log("📊 Modo actual: Base de Datos (Automático)");
        if (genText) genText.textContent = 'Generar con IA (Incluye Imágenes)';
        if (magicIcon) magicIcon.textContent = '🪄';
        captionField.placeholder = 'La IA escribirá aquí...';
        loadCompanies().then(() => setupCompanyAutoFill());
    } else if (mode === 'BDPR') {
        bdprBtn.classList.add('active');
        console.log("✏️ Modo actual: BD Personal/Manual");
        if (genText) genText.textContent = 'Previsualizar Campaña';
        if (magicIcon) magicIcon.textContent = '👁️';
        captionField.placeholder = 'Escribe o pega la campaña aquí...';
        loadCompanies().then(() => setupCompanyAutoFill());
    } else if (mode === 'IMG') {
        if (imgBtn) imgBtn.classList.add('active');
        console.log("🎬 Modo actual: IMG de Imaginación");

        // Company field as text input (for comments/text)
        container.innerHTML = `
            <label for="companyName">Texto para overlay del video</label>
            <input type="text" id="companyName" placeholder="Escribe el texto que aparecerá en el video...">
        `;

        // Show format & platform (determinan dimensiones del video)
        document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(el => {
            el.style.display = '';
        });

        // Hide irrelevant sections
        if (captionGroup) captionGroup.style.display = 'none';
        if (mediaGroup) mediaGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';
        if (aiSection) aiSection.style.display = 'none';
        if (bdPhotosContainer) bdPhotosContainer.style.display = 'none';
        if (generateBtn) generateBtn.style.display = 'none';
        if (imaginationBtn) imaginationBtn.style.display = '';
        if (recipeSection) recipeSection.style.display = 'block';
        if (previewSection) previewSection.style.display = 'none';
    } else if (mode === 'BDSMT') {
        if (bdsmtBtn) bdsmtBtn.classList.add('active');
        console.log("📊 Modo actual: BDSMT — Marketing Basado en Tendencias");

        // Like BD/BDPR: company select + photos
        if (bdPhotosContainer) {
            bdPhotosContainer.style.display = 'block';
            if (typeof window.updateBdPhotosLabel === 'function') window.updateBdPhotosLabel();
        }

        // Show format & platform
        document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(el => {
            el.style.display = '';
        });

        // Show BDSMT section, hide recipe, show generate button
        if (bdsmtSection) bdsmtSection.style.display = 'block';
        if (recipeSection) recipeSection.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        if (aiSection) aiSection.style.display = '';
        if (generateBtn) generateBtn.style.display = '';

        // Clear trends container on mode enter
        const trendsContainer = document.getElementById('trendsContainer');
        if (trendsContainer) {
            trendsContainer.style.display = 'none';
            trendsContainer.innerHTML = '';
        }

        // caption placeholder and generate button text
        if (genText) genText.textContent = 'Generar con IA (Basado en Tendencia)';
        if (magicIcon) magicIcon.textContent = '📊';
        captionField.placeholder = 'La IA generará contenido basado en la tendencia...';

        // Reset selected trend
        window.selectedTrend = null;

        loadCompanies().then(() => setupCompanyAutoFill());
    } else if (mode === 'BDPV') {
        if (bdpvBtn) bdpvBtn.classList.add('active');
        console.log("🎞️ Modo actual: BDPV — Presentación de Video HTML");

        // Same company photos as BD
        if (bdPhotosContainer) {
            bdPhotosContainer.style.display = 'block';
            if (typeof window.updateBdPhotosLabel === 'function') window.updateBdPhotosLabel();
        }

        // Hide format & platform (not used in BDPV)
        document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(g => {
            g.style.display = 'none';
        });

        // Hide multimedia production (voice, music, video, animation)
        const prodSection = document.querySelector('.production-options');
        if (prodSection) prodSection.style.display = 'none';

        // Hide caption, media, date (presentation generates its own content)
        if (captionGroup) captionGroup.style.display = 'none';
        if (mediaGroup) mediaGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';

        // Show BDPV section, hide recipe & BDSMT
        if (bdpvSection) bdpvSection.style.display = 'block';
        if (recipeSection) recipeSection.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        if (bdsmtSection) bdsmtSection.style.display = 'none';

        // AI assistant: only show industry/niche field
        if (aiSection) aiSection.style.display = 'block';
        // Hide conciencia, template, slides, theme within AI section
        const aiFields = aiSection ? aiSection.querySelectorAll('.input-wrapper') : [];
        aiFields.forEach((el, i) => {
            // Show all then hide specific ones by label
            el.style.display = '';
            const lbl = el.querySelector('label');
            if (lbl) {
                const txt = lbl.textContent.trim();
                if (txt.includes('Conciencia') || txt.includes('Plantilla') || txt.includes('Slides') || txt.includes('Tema')) {
                    el.style.display = 'none';
                }
            }
        });

        // Show generate button
        if (generateBtn) generateBtn.style.display = '';
        if (genText) genText.textContent = '🎞️ Generar Presentación HTML';
        if (magicIcon) magicIcon.textContent = '🎞️';
        captionField.placeholder = 'La IA generará la presentación...';

        // Load sub-nicho options from industrias
        if (typeof window.loadBdpvSubNicho === 'function') window.loadBdpvSubNicho();

        loadCompanies().then(() => setupCompanyAutoFill());
    } else if (mode === 'LP') {
        if (lpBtn) lpBtn.classList.add('active');
        console.log("🌐 Modo actual: LP — Landing Page HTML");

        // Same company photos as BD
        if (bdPhotosContainer) {
            bdPhotosContainer.style.display = 'block';
            if (typeof window.updateBdPhotosLabel === 'function') window.updateBdPhotosLabel();
        }

        // Hide format & platform (not used in LP)
        document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(g => {
            g.style.display = 'none';
        });

        // Hide multimedia production (voice, music, video, animation)
        const prodSection = document.querySelector('.production-options');
        if (prodSection) prodSection.style.display = 'none';

        // Hide caption, media, date (landing generates its own content)
        if (captionGroup) captionGroup.style.display = 'none';
        if (mediaGroup) mediaGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';

        // Reuse BDPV section (skills, sub-nicho, región, logo), hide recipe & BDSMT
        if (bdpvSection) bdpvSection.style.display = 'block';
        if (recipeSection) recipeSection.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        if (bdsmtSection) bdsmtSection.style.display = 'none';

        // AI assistant: only show industry/niche field
        if (aiSection) aiSection.style.display = 'block';
        const aiFields = aiSection ? aiSection.querySelectorAll('.input-wrapper') : [];
        aiFields.forEach((el, i) => {
            el.style.display = '';
            const lbl = el.querySelector('label');
            if (lbl) {
                const txt = lbl.textContent.trim();
                if (txt.includes('Conciencia') || txt.includes('Plantilla') || txt.includes('Slides') || txt.includes('Tema')) {
                    el.style.display = 'none';
                }
            }
        });

        // Show generate button
        if (generateBtn) generateBtn.style.display = '';
        if (genText) genText.textContent = '🌐 Generar Landing Page';
        if (magicIcon) magicIcon.textContent = '🌐';
        captionField.placeholder = 'La IA generará la landing page...';

        if (typeof window.loadBdpvSubNicho === 'function') window.loadBdpvSubNicho();

        loadCompanies().then(() => setupCompanyAutoFill());
    } else if (mode === 'ViRe') {
        if (vireBtn) vireBtn.classList.add('active');
        console.log("🎬 Modo actual: ViRe — Video con Remotion");

        // Hide everything, show only ViRe section
        if (captionGroup) captionGroup.style.display = 'none';
        if (mediaGroup) mediaGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';
        if (aiSection) aiSection.style.display = 'none';
        if (bdPhotosContainer) bdPhotosContainer.style.display = 'none';
        // Formato SÍ lo usa ViRe (define ancho/alto del render, ver
        // /api/vire-produce) — se muestra. Red social no se envía nunca al
        // backend de ViRe, así que se oculta para no sugerir que hace algo.
        document.querySelectorAll('.input-group-row:has(.mode-switch) .input-group').forEach(g => {
            g.style.display = '';
        });
        if (platformMenu) platformMenu.style.display = 'none';
        const prodSection = document.querySelector('.production-options');
        if (prodSection) prodSection.style.display = 'none';
        if (generateBtn) generateBtn.style.display = 'none';
        if (imaginationBtn) imaginationBtn.style.display = 'none';
        if (recipeSection) recipeSection.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        if (bdsmtSection) bdsmtSection.style.display = 'none';
        if (bdpvSection) bdpvSection.style.display = 'none';
        if (vireSection) vireSection.style.display = 'block';
        moveSharedFieldsIntoVire();
    } else if (mode === 'VIDE') {
        if (videBtn) videBtn.classList.add('active');
        console.log("🎬 Modo actual: VIDE — Suite Completa de Video");

        // Hide main form sections — VIDE tiene los suyos propios
        if (captionGroup) captionGroup.style.display = 'none';
        if (mediaGroup) mediaGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';
        if (aiSection) aiSection.style.display = 'none';
        if (bdPhotosContainer) bdPhotosContainer.style.display = 'none';
        if (generateBtn) generateBtn.style.display = 'none';
        if (imaginationBtn) imaginationBtn.style.display = 'none';
        if (recipeSection) recipeSection.style.display = 'none';
        if (previewSection) previewSection.style.display = 'none';
        if (bdsmtSection) bdsmtSection.style.display = 'none';
        if (bdpvSection) bdpvSection.style.display = 'none';
        if (vireSection) vireSection.style.display = 'none';
        if (videSection) videSection.style.display = 'block';
        loadCompanies().then(() => setupCompanyAutoFill());
    }
}

async function loadRecetas() {
    try {
        const res = await fetch('/api/recetas');
        const json = await res.json();
        if (json.status !== 'success' || !json.data) throw new Error('API error');
        window.recetasData = json.data;
        const select = document.getElementById('recipeSelect');
        select.innerHTML = '<option value="">-- Seleccionar receta --</option>';
        json.data.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.nombre;
            select.appendChild(opt);
        });
    } catch (e) {
        console.warn('⚠️ No se pudieron cargar recetas:', e.message);
        document.getElementById('recipeSelect').innerHTML = '<option value="">Error al cargar recetas</option>';
    }
}

async function generateImaginationVideo() {
    const empresa = document.getElementById('companyName').value.trim();
    const recipeSelect = document.getElementById('recipeSelect');
    const recipeId = recipeSelect.value;
    if (!recipeId) {
        showToast('❌ Selecciona una receta primero', 'error');
        return;
    }

    // Build overrides from form
    const overrides = {
        orden: document.getElementById('recipeOrden').value,
        duracion_total: document.getElementById('recipeDuracion').value,
        ritmo: document.getElementById('recipeRitmo').value,
        filtro: document.getElementById('recipeFiltro').value,
        transicion: document.getElementById('recipeTransicion').value,
        animacion: document.getElementById('recipeAnimacion').checked
    };

    // Get logo if uploaded
    let logo_base64 = null;
    if (uploadedLogoDataUrl) {
        logo_base64 = uploadedLogoDataUrl;
    } else {
        const logoUrl = document.getElementById('companyLogo').value.trim();
        if (logoUrl && logoUrl.startsWith('data:')) {
            logo_base64 = logoUrl;
        }
    }

    const btn = document.getElementById('imaginationBtn');
    const loader = btn?.querySelector('.img-loader');
    const btnText = btn?.querySelector('span:last-child');
    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Generando...';

    showToast('🎬 Generando video de imaginación...', 'info');

    const format = document.querySelector('.format-tab.active')?.dataset?.format || 'Reel';
    const platform = document.querySelector('.platform-tab.active')?.dataset?.platform || 'Instagram';

    try {
        const res = await fetch('/api/video-imaginacion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texto: empresa,
                receta_id: parseInt(recipeId),
                logo_base64,
                formato: format,
                plataforma: platform,
                overrides
            })
        });

        const data = await res.json();
        if (data.status !== 'success' || !data.video) {
            throw new Error(data.error || 'Error del servidor');
        }

        // Download the video
        const b64 = data.video.split(',')[1];
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'video/mp4' });
        const filename = empresa ? `imaginacion_${empresa.replace(/\s+/g, '_')}.mp4` : `imaginacion_${Date.now()}.mp4`;
        downloadFile(URL.createObjectURL(blob), filename);
        showToast('✅ Video de imaginación generado y descargado', 'success');
    } catch (e) {
        showToast(`❌ Error: ${e.message}`, 'error');
        console.error(e);
    } finally {
        if (btn) btn.disabled = false;
        if (loader) loader.style.display = 'none';
        if (btnText) btnText.textContent = 'Crear Video de Imaginación';
    }
}

// Keeps #videDuration honest: the guion's own scene timing is what actually
// gets rendered, so pasting/generating a JSON with a different total should
// update the duration field instead of leaving a stale, conflicting number.
function syncVideFieldsFromJson(jsonText) {
    try {
        const parsed = JSON.parse(jsonText);
        const escenas = Array.isArray(parsed) ? parsed : parsed.escenas;
        if (!Array.isArray(escenas) || escenas.length === 0) return;
        const total = escenas.reduce((acc, s, i) => acc + (s.duracion || 5) + (i < escenas.length - 1 ? (s.pausa_final || 0.5) : 0), 0);
        const durationInput = document.getElementById('videDuration');
        if (durationInput && total > 0) durationInput.value = Math.round(total);
        // Slides is a ceiling/guide for the AI now, not a hard count (see prompt
        // rule below), so the real scene count can differ from what was asked —
        // reflect it back instead of leaving a stale number in the field.
        const slidesInput = document.getElementById('aiSlides');
        if (slidesInput) slidesInput.value = escenas.length;
    } catch (_) { /* invalid/partial JSON mid-paste — leave fields as-is */ }
}

let estiloVisualData = null;
let estiloVisualSeleccionado = null;

async function fetchEstilosVisuales() {
    const empresa = document.getElementById('companyName')?.value?.trim();
    if (!empresa) return;
    try {
        const res = await fetch(`/api/estilos-visuales?empresa=${encodeURIComponent(empresa)}`);
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error || 'Error');
        estiloVisualData = json.data;
        showStyleSelector(estiloVisualData, empresa);
    } catch (e) {
        console.warn('[ESTILOS] No se pudieron cargar:', e.message);
    }
}

// Dos niveles en vez de mostrar las 12 sub-estilos de una vez (ocupaba mucho
// espacio): primero las 4 categorías, al elegir una se ven solo sus 3 sub-estilos.
// Mismo patrón cascada que Industria→Nicho (populateNichos()): categoría
// primero, sub-estilo se llena al elegir una — reemplaza los botones sueltos.
function showStyleSelector(categorias, empresa) {
    const wrapper = document.getElementById('estiloVisualWrapper');
    const subWrapper = document.getElementById('estiloSubWrapper');
    const catSelect = document.getElementById('videEstiloCategoria');
    const subSelect = document.getElementById('videEstiloSub');
    const info = document.getElementById('autoStyleInfo');
    if (!wrapper || !catSelect || !subSelect) return;
    wrapper.style.display = '';

    catSelect.innerHTML = '<option value="">🎯 Automático (recomendado por tendencias)</option>' +
        categorias.map(c => `<option value="${c.slug}">${c.icono || '📁'} ${c.nombre}</option>`).join('');

    catSelect.onchange = () => {
        const cat = categorias.find(c => c.slug === catSelect.value);
        if (!cat) {
            subWrapper.style.display = 'none';
            estiloVisualSeleccionado = null;
            autoPickStyleByTrend(empresa).then(r => {
                if (r) { estiloVisualSeleccionado = r; info.textContent = `Director seleccionó: ${r.cat} → ${r.sub}`; }
            });
            return;
        }
        subWrapper.style.display = '';
        subSelect.innerHTML = '<option value="">-- Seleccionar --</option>' +
            (cat.subestilos || []).map(s => `<option value="${s.slug}">${s.nombre}</option>`).join('');
        estiloVisualSeleccionado = null;
        info.textContent = '';
    };

    subSelect.onchange = () => {
        const cat = categorias.find(c => c.slug === catSelect.value);
        const sub = cat?.subestilos.find(s => s.slug === subSelect.value);
        if (!sub) { estiloVisualSeleccionado = null; info.textContent = ''; return; }
        estiloVisualSeleccionado = { id: sub.id, cat: cat.slug, sub: sub.slug, nombre: sub.nombre, keywords: sub.keywords_ia };
        info.textContent = `${cat.nombre} → ${sub.nombre}: ${sub.descripcion || ''}`;
    };

    catSelect.value = '';
    subWrapper.style.display = 'none';

    autoPickStyleByTrend(empresa).then(r => {
        if (r) {
            estiloVisualSeleccionado = r;
            info.textContent = `Director seleccionó: ${r.cat} → ${r.sub}`;
        }
    });
}

async function autoPickStyleByTrend(empresa) {
    try {
        const res = await fetch(`/api/tendencias-estilo?empresa=${encodeURIComponent(empresa)}`);
        const json = await res.json();
        if (json.status === 'success' && json.data.length > 0) {
            const top = json.data[0];
            for (const cat of (estiloVisualData || [])) {
                for (const sub of (cat.subestilos || [])) {
                    if (sub.id === top.id_subestilo) {
                        return { id: sub.id, cat: cat.slug, sub: sub.slug, nombre: sub.nombre, keywords: sub.keywords_ia };
                    }
                }
            }
        }
    } catch (_) {}
    if (estiloVisualData && estiloVisualData.length > 0) {
        const fallback = estiloVisualData.find(c => c.slug === 'latino-virales')
                      || estiloVisualData.find(c => c.slug === 'edits-beat')
                      || estiloVisualData[0];
        if (fallback && fallback.subestilos.length > 0) {
            const sub = fallback.subestilos[0];
            return { id: sub.id, cat: fallback.slug, sub: sub.slug, nombre: sub.nombre, keywords: sub.keywords_ia };
        }
    }
    return null;
}

// Phone digits read as one giant number by TTS ("ochenta y un mil...") sound
// wrong — spacing them in pairs makes it read naturally, like a person would say it.
function formatPhoneForSpeech(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.match(/.{1,2}/g).join(' ');
}

// === VIDE: Generar JSON desde Contenido + Datos ===
// Prompt de guion compartido entre VIDE y ViRe (construido a partir de
// Empresa/Sitio/Teléfono + Asistente IA) — extraído de generateVideJson()
// para que ambos motores generen con la misma coherencia/calidad sin
// mantener dos prompts que puedan desalinearse con el tiempo.
function construirPromptGuion({
    company, website, phone, logoUrl, avatarUrl,
    format, platform, style, duration, res, suggestedBpm,
    conciencia, industria, nicho, especializacion, template, slides, theme,
    modules, estiloStr, catalogoInterrupts
}) {
    return `Eres un generador de guiones publicitarios de alto impacto visual y conversión. Respondes EXCLUSIVAMENTE con un objeto JSON válido según el schema indicado.

Genera el guion publicitario completo en JSON en formato ${format} para ${platform}.

ESTRUCTURA DEL JSON REQUERIDO:
{
  "config": {
    "duracion_total": (número, en segundos. Debe ser ${duration} o menos),
    "musica": { "estilo": "${style}", "bpm": ${suggestedBpm}, "volumen": 0.8 },
    "fps": 24,
    "resolucion": { "ancho": ${res.ancho}, "alto": ${res.alto} }
  },
  "escenas": [
    {
      "id": 1,
      "titulo": "Nombre/rol de la escena (ej. Hook, Desarrollo, Cierre)",
      "texto": "Texto que se leerá en voz alta para esta escena (speech, conversacional)",
      "visual": "Descripción cinematográfica detallada para generar imagen con IA: entorno, colores, ángulo, iluminación, composición — evita descripciones genéricas",
      "texto_overlay": "Frase corta y llamativa que aparecerá en pantalla (máx 60 caracteres)",
      "duracion": (segundos que dura esta escena, entre 4 y 15),
      "pausa_inicial": (segundos de pausa antes de la escena, 0.3 a 1.0),
      "pausa_final": (segundos de pausa después de la escena, 0.3 a 1.0),
      "animacion": "zoom_in" | "ken_burns" | "fade" | "none",
      "musica_local": null | "energetic" | "relaxing" | "professional" | "cinematic",
      "pattern_interrupt": "(solo escena 1) acción o sonido disruptivo en los primeros 1.5s",
      "camara": { "plano": "Close-up | Medium Shot | Extreme Close-up | POV", "movimiento": "Whip Zoom | Static | Tracking Shot | Tilt Up/Down" },
      "sfx": "Efecto de sonido puntual de la escena (Whoosh, Glitch, Pop, Bass drop) o null"
    }
  ]
}

DATOS DE LA EMPRESA:
- Nombre: ${company || '(no especificado)'}
- Sitio web: ${website || '(no especificado)'}
- Teléfono (escribir el número exactamente así en el texto hablado, en pares, para que se lea natural): ${formatPhoneForSpeech(phone) || '(no especificado)'}
- Logo URL: ${logoUrl || '(no especificado)'}
- Avatar URL: ${avatarUrl || '(no especificado)'}

CONFIGURACIÓN DEL VIDEO:
- Estilo musical global: ${style}
- Duración total objetivo: ${duration}s
- Formato/dimensiones finales: ${format} (${res.ancho}x${res.alto}) — no cambia aunque el contenido sugiera otra cosa.
- Nivel de conciencia del mercado: ${conciencia || 'No especificado'}
- Industria: ${industria || '(no especificada)'}
- Nicho: ${nicho || '(no especificado)'}
- Especialización: ${especializacion || '(no especificada)'}
- Tipo de plantilla narrativa: ${template || 'Automático'}
- Cantidad de escenas de referencia: ${slides} (aproximado, no un límite — decide tú la cantidad real)
- Tema de la publicación: ${theme || '(no especificado)'}
- Módulos activos: ${modules.join(', ') || 'ninguno'}

ESTILO VISUAL (OBLIGATORIO):
Aplica el estilo visual "${estiloStr}" en cada escena: el "visual" de cada escena y el "texto_overlay" deben usar la estética, paleta y tratamiento visual de este estilo. No generes imágenes genéricas.

ANCLA DE IDENTIDAD VISUAL (OBLIGATORIO — método Pareto 20/80):
Antes de escribir las escenas, define UNA sola dirección y aplícala en TODAS, no una distinta por escena:
- Ritmo de montaje: cortes rápidos (<1.5s, "camara.movimiento" tipo Whip Zoom/Tracking) para conciencia alta/CTA, o plano secuencia más pausado (Static/Tilt) para conciencia baja/narrativa.
- Dirección de luz/color: elige una y sostenla en "visual" de cada escena (ej. Teal & Orange cinematográfico, alto contraste dramático, o iluminación nativa/orgánica tipo redes sociales) — coherente con "${estiloStr || template || 'el tono general'}".

ARQUETIPO DE COMUNICACIÓN (OBLIGATORIO):
Elige UNO para todo el guion y sostenlo en el tono de "texto": **El Mentor** (autoridad, datos, enseña) si la marca/tema pide credibilidad técnica; **El Antagonista** (desafía una creencia popular del nicho) si "${conciencia || 'No especificado'}" es baja (Inconsciente/Consciente_Problema) y conviene un choque de opinión; **El Par** (experiencia compartida, cercanía) si el objetivo es conexión/confianza. No mezcles arquetipos entre escenas.

ALINEACIÓN PSICOLÓGICA (OBLIGATORIO):
Adapta el gancho de la escena 1, el ángulo narrativo de "texto"/"texto_overlay" y el tono de todo el guion al estado mental exacto del cliente (${conciencia || 'No especificado'}) según esta técnica concreta:
- Inconsciente → requiere CHOQUE VISUAL: abre con algo inesperado/perturbador, el cliente ni sabe que tiene el problema.
- Consciente_Problema → requiere EMPATÍA/HISTORIA: valida el dolor con una narrativa relatable antes de ofrecer nada.
- Consciente_Solucion / Consciente_Producto / Mas_Consciente → requiere PRUEBA/DEMOSTRACIÓN: muestra el producto/resultado funcionando, datos concretos, sin rodeos.
Combínalo con la estrategia "${template || 'Automático'}". Define primero ángulo+arquetipo mentalmente y luego escribe cada escena siguiéndolos — no generes un guion genérico que ignore estas condiciones.
${catalogoInterrupts ? `\nCATÁLOGO DE PATTERN INTERRUPTS DISPONIBLES (usa uno de estos en la escena 1 si aplica, en vez de improvisar uno genérico):\n${catalogoInterrupts}\n` : ''}
REGLAS DE RETENCIÓN CINEMATOGRÁFICA (OBLIGATORIAS):
1. Tú decides cuántas escenas necesita la historia — ${slides} es solo una referencia aproximada, no un límite fijo: usa más o menos según lo que el contenido y los ${duration}s realmente pidan. No rellenes con escenas de relleno ni cortes ideas a la mitad para ajustar a un número. Cada escena con TODOS los campos del schema.
2. La SUMA de duracion de todas las escenas + pausa_inicial + pausa_final debe ser aprox ${duration} segundos. No puede exceder ${duration}.
3. ESCENA 1 (HOOK): obligatorio un "pattern_interrupt" (del catálogo si hay uno disponible arriba, si no, uno propio) y un "texto_overlay" contraintuitivo alineado con "${conciencia || 'No especificado'}".
4. Cada escena define explícitamente "camara.plano", "camara.movimiento" y "sfx" — no dejes "visual" en descripciones genéricas, y respeta la Ancla de Identidad Visual definida arriba en las 4.
5. "animacion" elige según el ritmo: zoom_in para impacto (conciencia más alta / CTA), ken_burns para narrativa (conciencia baja / storytelling), fade para transición suave.
6. "musica_local" solo si una escena necesita un estilo distinto al global; si no, null.
7. La última escena debe incluir un Call to Value (CTV) explícito con los datos de contacto (teléfono, web). Si dice el teléfono en voz alta, escríbelo en pares exactamente como viene arriba (ej. "52 81 10 46 37 21"), nunca como un número corrido.
8. Serás penalizado si el guion no es 100% relevante al tema "${theme || industria || 'la empresa'}" y a la industria/nicho especificados.
9. PROHIBIDO describir texto legible, letreros, carteles, etiquetas, nombres de producto/marca escritos, o cualquier escritura dentro de "visual" — los modelos de imagen no pueden renderizar texto correctamente y siempre sale ilegible/inventado. Describe el entorno, objetos y composición sin pedir texto visible en ningún lado de la escena.
10. Responde SOLO con el JSON, sin markdown, sin explicaciones.`;
}

async function generateVideJson() {
    const company = document.getElementById('companyName')?.value?.trim() || '';
    const website = document.getElementById('webSite')?.value?.trim() || '';
    const logoField = document.getElementById('companyLogo')?.value?.trim() || '';
    const parsedLogoUrl = parseLogoUrlField(logoField);
    const phone = document.getElementById('contactPhone')?.value?.trim() || '';
    const format = document.querySelector('.format-tab.active')?.dataset?.format || 'Reel';
    const platform = document.querySelector('.platform-tab.active')?.dataset?.platform || 'Instagram';
    const style = document.getElementById('videStyle')?.value || 'energetic';
    const duration = document.getElementById('videDuration')?.value || '30';
    const conciencia = document.getElementById('aiConciencia')?.value || '';
    const industria = document.getElementById('aiIndustry')?.value || '';
    const nicho = document.getElementById('aiNicho')?.value || '';
    const especializacion = document.getElementById('aiEspecializacion')?.value || '';
    // Misma regla que generateAIContent(): si no elige plantilla, se deriva del
    // nivel de conciencia en vez de dejar "Automático" sin ningún criterio real.
    const template = document.getElementById('aiTemplate')?.value || TEMPLATE_MAP[conciencia] || '';
    const slides = document.getElementById('aiSlides')?.value || '3';
    const theme = document.getElementById('aiTheme')?.value?.trim() || '';

    const modules = [];
    if (document.getElementById('moduleImages')?.checked) modules.push('Imágenes');
    if (document.getElementById('enableVoice')?.checked) modules.push('Voz TTS');
    if (document.getElementById('enableMusic')?.checked) modules.push('Música');
    if (document.getElementById('moduleSubtitles')?.checked) modules.push('Subtítulos');
    if (document.getElementById('enableVideo')?.checked) modules.push('Auto-Video');
    if (document.getElementById('enableAnimation')?.checked) modules.push('Animación');

    if (!company && !theme) {
        showToast('❌ Completa al menos el nombre de la empresa o el tema de la publicación.', 'error');
        return;
    }

    const btn = document.getElementById('videGenerateJsonBtn');
    const loader = btn?.querySelector('.vide-json-loader');
    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';

    showToast('🤖 Generando JSON del guion con IA...', 'info');

    const bpmMap = { energetic: 140, relaxing: 80, professional: 100, cinematic: 110 };
    const suggestedBpm = bpmMap[style] || 100;

    // Dimensiones reales por formato (mismo mapeo que FMT_DIMS en local-server-node.js):
    // el video final SIEMPRE respeta el formato seleccionado por el usuario al descargar,
    // sin importar lo que diga este campo — se incluye solo para que el guion generado
    // sea internamente consistente/veraz con lo que realmente se va a producir.
    const FMT_RES = { Post: { ancho: 1080, alto: 1080 }, Reel: { ancho: 1080, alto: 1920 }, Story: { ancho: 1080, alto: 1920 }, Banner: { ancho: 1200, alto: 628 } };
    const res = FMT_RES[format] || FMT_RES.Reel;

    const estiloStr = estiloVisualSeleccionado && estiloVisualSeleccionado.keywords
        ? `${estiloVisualSeleccionado.cat}/${estiloVisualSeleccionado.sub}: ${estiloVisualSeleccionado.keywords}`
        : (estiloVisualSeleccionado ? `${estiloVisualSeleccionado.cat}/${estiloVisualSeleccionado.sub}` : '');

    // Catálogo real (Supabase) en vez de dejar que la IA improvise un pattern
    // interrupt libre cada vez — "GENERAL" es el respaldo si el nicho no tiene
    // entradas propias todavía.
    let catalogoInterrupts = '';
    try {
        const resPI = await fetch(`/api/pattern-interrupts?nicho=${encodeURIComponent(nicho || 'GENERAL')}`);
        const jsonPI = await resPI.json();
        if (jsonPI.status === 'success' && jsonPI.data.length > 0) {
            catalogoInterrupts = jsonPI.data.map(p => `- (${p.tipo}) ${p.descripcion}`).join('\n');
        }
    } catch (_) { /* sin catálogo disponible, la IA improvisa como antes */ }

    const prompt = construirPromptGuion({
        company, website, phone, logoUrl: parsedLogoUrl.logoUrl, avatarUrl: parsedLogoUrl.avatarUrl,
        format, platform, style, duration, res, suggestedBpm,
        conciencia, industria, nicho, especializacion, template, slides, theme,
        modules, estiloStr, catalogoInterrupts
    });

    try {
        const response = await fetch(CONFIG.AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Eres un generador de guiones publicitarios. Siempre respondes exclusivamente con JSON válido siguiendo el schema exacto proporcionado.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                model: 'openrouter/free'
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        const data = await response.json();
        let rawContent = data.choices[0].message.content.trim();
        rawContent = rawContent.replace(/```json|```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch (e) {
            throw new Error('La IA no devolvió JSON válido. Intenta de nuevo.');
        }

        // Normalize old format → new format
        if (Array.isArray(parsed)) {
            parsed = {
                config: {
                    duracion_total: parseInt(duration),
                    musica: { estilo: style, bpm: suggestedBpm, volumen: 0.3 },
                    fps: 24,
                    resolucion: { ancho: 1080, alto: 1920 }
                },
                escenas: parsed.map((s, i) => ({
                    id: i + 1,
                    titulo: s.titulo || s.title || `Escena ${i + 1}`,
                    texto: s.texto || s.text || s.body || '',
                    visual: s.visual || '',
                    texto_overlay: s.texto_overlay || s.titulo || s.title || '',
                    duracion: s.duracion || Math.floor(parseInt(duration) / parsed.length),
                    pausa_inicial: s.pausa_inicial || 0.5,
                    pausa_final: s.pausa_final || 0.5,
                    animacion: s.animacion || 'fade',
                    musica_local: s.musica_local || null
                }))
            };
        }

        lastGeneratedContent = { tipo: 'VIDE', guion: parsed };
        const jsonStr = JSON.stringify(parsed, null, 2);

        const jsonTextarea = document.getElementById('videGuionJson');
        if (jsonTextarea) {
            jsonTextarea.value = jsonStr;
            jsonTextarea.style.display = '';
        }
        syncVideFieldsFromJson(jsonStr);
        const textTextarea = document.getElementById('videGuion');
        if (textTextarea) textTextarea.style.display = 'none';

        const jsonModeBtn = document.getElementById('videJsonMode');
        const textModeBtn = document.getElementById('videGuionMode');
        if (jsonModeBtn) {
            jsonModeBtn.style.background = 'rgba(99,102,241,0.15)';
            jsonModeBtn.style.borderColor = 'rgba(99,102,241,0.4)';
            jsonModeBtn.style.color = '#a5b4fc';
        }
        if (textModeBtn) {
            textModeBtn.style.background = 'rgba(255,255,255,0.05)';
            textModeBtn.style.borderColor = 'var(--glass-border)';
            textModeBtn.style.color = 'var(--text-dim)';
        }

        showToast('✅ JSON generado y listo para editar', 'success');
    } catch (e) {
        showToast(`❌ Error: ${e.message}`, 'error');
        console.error(e);
    } finally {
        if (btn) btn.disabled = false;
        if (loader) loader.style.display = 'none';
    }
}

// === VIDE: Suite Completa de Video ===
async function generateVideVideo(overrideGuion = null) {
    const company = document.getElementById('companyName')?.value?.trim() || '';
    if (!company) {
        showToast('❌ Escribe o selecciona una empresa/marca en DATOS / NEGOCIO', 'error');
        document.getElementById('companyName')?.focus();
        return;
    }

    // Resolve guion: guion pre-armado (ej. pieza del MediaPlanner/BriefMarker),
    // text mode o JSON mode. Un guion pre-armado salta la lectura de los
    // textareas de VIDE — mismo /api/video-produce, mismo panel de revisión.
    const isJsonMode = document.getElementById('videGuionJson')?.style.display !== 'none';
    let guion;
    // Refleja exactamente lo que se manda a /api/video-produce — no depende de
    // lastGeneratedContent, que solo se llena si el usuario pasó por "Generar
    // JSON" (en modo texto libre quedaría con el guion de una generación previa).
    let guionParaGuardar;
    if (overrideGuion) {
        guion = JSON.stringify(overrideGuion, null, 2);
        guionParaGuardar = { tipo: 'VIDE', guion: overrideGuion, origen: 'briefmarker' };
    } else if (isJsonMode) {
        const jsonText = document.getElementById('videGuionJson')?.value?.trim();
        if (!jsonText) {
            showToast('❌ Pega el JSON del guion', 'error');
            document.getElementById('videGuionJson')?.focus();
            return;
        }
        try {
            const parsed = JSON.parse(jsonText);
            guion = JSON.stringify(parsed, null, 2);
            guionParaGuardar = { tipo: 'VIDE', guion: parsed };
        } catch (e) {
            showToast('❌ JSON inválido: ' + e.message, 'error');
            return;
        }
    } else {
        guion = document.getElementById('videGuion')?.value?.trim();
        if (!guion) {
            showToast('❌ Escribe un guion para el video', 'error');
            document.getElementById('videGuion')?.focus();
            return;
        }
        guionParaGuardar = { tipo: 'VIDE', guion_texto: guion };
    }

    const style = document.getElementById('videStyle')?.value || 'energetic';
    const duration = parseInt(document.getElementById('videDuration')?.value) || 30;
    const voice = document.getElementById('videVoice')?.value || 'es-MX-DaliaNeural';

    // Collect selected modules from unified Producción Multimedia
    const modules = [];
    if (document.getElementById('moduleImages')?.checked) modules.push('images');
    if (document.getElementById('enableVoice')?.checked) modules.push('voice');
    if (document.getElementById('enableMusic')?.checked) modules.push('music');
    if (document.getElementById('moduleSubtitles')?.checked) modules.push('subtitles');
    if (modules.length === 0) {
        showToast('❌ Selecciona al menos un módulo', 'error');
        return;
    }

    let logoUrlValue = '';
    let avatarUrlValue = '';
    if (uploadedLogoDataUrl) {
        logoUrlValue = uploadedLogoDataUrl;
    } else {
        const parsedLogo = parseLogoUrlField(document.getElementById('companyLogo')?.value?.trim() || '');
        logoUrlValue = parsedLogo.logoUrl;
        avatarUrlValue = parsedLogo.avatarUrl;
    }

    const btn = document.getElementById('videGenerateBtn');
    const loader = btn?.querySelector('.vide-loader');
    const btnText = btn?.querySelector('span:last-child');
    const progressDiv = document.getElementById('videProgress');
    const progressBar = document.getElementById('videProgressBar');
    const progressLabel = document.getElementById('videProgressLabel');
    const progressPct = document.getElementById('videProgressPct');
    const stepsDiv = document.getElementById('videSteps');

    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Generando...';
    if (progressDiv) progressDiv.style.display = 'block';

    const updateProgress = (pct, label, step) => {
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressPct) progressPct.textContent = pct + '%';
        if (progressLabel) progressLabel.textContent = label;
        if (step) {
            if (stepsDiv) stepsDiv.innerHTML += `<div>✅ ${step}</div>`;
        }
    };

    showToast('🎬 Generando video completo...', 'info');
    updateProgress(5, 'Iniciando...', null);

    const format = document.querySelector('.format-tab.active')?.dataset?.format || 'Reel';
    const platform = document.querySelector('.platform-tab.active')?.dataset?.platform || 'Instagram';

    try {
        updateProgress(10, 'Enviando al servidor...', null);
        const res = await fetch('/api/video-produce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: company,
                sitio_web: document.getElementById('webSite')?.value?.trim() || '',
                logo_url: logoUrlValue,
                avatar_url: avatarUrlValue,
                telefono: document.getElementById('contactPhone')?.value?.trim() || '',
                guion,
                style,
                duration,
                voice,
                modules,
                format,
                platform
            })
        });

        updateProgress(50, 'Procesando en servidor...', null);

        const data = await res.json();
        if (data.status !== 'success') {
            throw new Error(data.error || data.message || 'Error del servidor');
        }

        updateProgress(90, 'Descargando video...', null);

        if (data.video) {
            const b64 = data.video.split(',')[1];
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'video/mp4' });
            const filename = company ? `vide_${company.replace(/\s+/g, '_')}_${Date.now()}.mp4` : `vide_${Date.now()}.mp4`;

            // Panel de revisión: el video se reproduce, no se descarga solo.
            // El usuario decide Aceptar (descarga + guarda en Supabase/Sheets)
            // o Rechazar (no se guarda nada).
            window.lastVideoBlob = blob;
            window.lastVideoBlobUrl = URL.createObjectURL(blob);
            const reviewPanel = document.getElementById('videReviewPanel');
            const reviewPlayer = document.getElementById('videReviewPlayer');
            if (reviewPanel && reviewPlayer) {
                reviewPlayer.src = window.lastVideoBlobUrl;
                reviewPanel.style.display = 'block';
            }
            updateProgress(100, '¡Listo!', 'Revisa el video y decide');

            const acceptBtn = document.getElementById('videAcceptBtn');
            const rejectBtn = document.getElementById('videRejectBtn');
            acceptBtn.onclick = async () => {
                downloadFile(window.lastVideoBlobUrl, filename);
                try {
                    await fetch(CONFIG.CAMPANAS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: `camp_${Date.now()}`,
                            empresa: company,
                            nombre: `Video ${company}`.substring(0, 100),
                            tema: document.getElementById('aiTheme')?.value?.trim() || '',
                            formato: format,
                            plataforma: platform,
                            modo: 'VIDE',
                            contenido: 'Video generado',
                            estado: 'aceptado',
                            configuracion: { style, duration, voice, modules },
                            contenido_json: guionParaGuardar || {}
                        })
                    });
                    showToast('✅ Campaña de video guardada', 'success');
                } catch (e) {
                    showToast('❌ Video descargado pero no se pudo guardar: ' + e.message, 'error');
                }
                if (reviewPanel) reviewPanel.style.display = 'none';
            };
            rejectBtn.onclick = () => {
                if (window.lastVideoBlobUrl) URL.revokeObjectURL(window.lastVideoBlobUrl);
                window.lastVideoBlobUrl = null;
                window.lastVideoBlob = null;
                if (reviewPanel) reviewPanel.style.display = 'none';
                showToast('❌ Video rechazado, no se guardó', 'info');
            };
            showToast('✅ Video generado — revisa y acepta para guardar', 'success');

            // Alimenta al Director con uso real: un video generado de verdad con
            // este estilo cuenta como la señal de tendencia más honesta que hay.
            if (estiloVisualSeleccionado?.id && company) {
                fetch('/api/tendencias-estilo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_subestilo: estiloVisualSeleccionado.id, empresa: company })
                }).catch(() => {});
            }
        } else if (data.steps) {
            updateProgress(100, 'Pasos completados', null);
            data.steps.forEach(s => {
                if (stepsDiv) stepsDiv.innerHTML += `<div>📌 ${s}</div>`;
            });
            showToast('✅ Proceso completado (ver pasos)', 'success');
        }
    } catch (e) {
        showToast(`❌ Error: ${e.message}`, 'error');
        console.error(e);
        updateProgress(0, 'Error: ' + e.message, null);
    } finally {
        if (btn) btn.disabled = false;
        if (loader) loader.style.display = 'none';
        if (btnText) btnText.textContent = 'Generar Video Completo';
    }
}

// Convierte un prompt libre en un guion {config, escenas[]} via IA (openrouter/free),
// sin depender de empresa/BD — mismo schema que consume /api/vire-produce.
// "CreatorEngine" de ViRe: arma el guion completo (config + escenas) desde
// DATOS/NEGOCIO + Asistente IA, sin que el usuario tenga que escribir un
// prompt libre — mismo generador que usa VIDE (construirPromptGuion), mismo
// entorno (CONFIG.AI_URL), sin dependencias nuevas. Devuelve el objeto guion
// ya parseado, o lanza si falta información mínima o la IA falla.
async function generarGuionDesdeAsistente() {
    const company = document.getElementById('companyName')?.value?.trim() || '';
    const website = document.getElementById('webSite')?.value?.trim() || '';
    const logoField = document.getElementById('companyLogo')?.value?.trim() || '';
    const parsedLogoUrl = parseLogoUrlField(logoField);
    const phone = document.getElementById('contactPhone')?.value?.trim() || '';
    const format = document.querySelector('.format-tab.active')?.dataset?.format || 'Reel';
    const style = document.getElementById('videStyle')?.value || 'energetic';
    const duration = document.getElementById('videDuration')?.value || '30';
    const conciencia = document.getElementById('aiConciencia')?.value || '';
    const industria = document.getElementById('aiIndustry')?.value || '';
    const nicho = document.getElementById('aiNicho')?.value || '';
    const especializacion = document.getElementById('aiEspecializacion')?.value || '';
    const template = document.getElementById('aiTemplate')?.value || TEMPLATE_MAP[conciencia] || '';
    const slides = document.getElementById('aiSlides')?.value || '3';
    const theme = document.getElementById('aiTheme')?.value?.trim() || '';

    if (!company && !theme) {
        throw new Error('Completa el nombre de la empresa (DATOS/NEGOCIO) o el tema de la publicación (Asistente IA) antes de generar');
    }

    const modules = [];
    if (document.getElementById('enableVoice')?.checked) modules.push('Voz TTS');
    if (document.getElementById('enableMusic')?.checked) modules.push('Música');

    const bpmMap = { energetic: 140, relaxing: 80, professional: 100, cinematic: 110 };
    const suggestedBpm = bpmMap[style] || 100;
    const FMT_RES = { Post: { ancho: 1080, alto: 1080 }, Reel: { ancho: 1080, alto: 1920 }, Story: { ancho: 1080, alto: 1920 }, Banner: { ancho: 1200, alto: 628 } };
    const res = FMT_RES[format] || FMT_RES.Reel;

    const estiloStr = estiloVisualSeleccionado && estiloVisualSeleccionado.keywords
        ? `${estiloVisualSeleccionado.cat}/${estiloVisualSeleccionado.sub}: ${estiloVisualSeleccionado.keywords}`
        : (estiloVisualSeleccionado ? `${estiloVisualSeleccionado.cat}/${estiloVisualSeleccionado.sub}` : '');

    let catalogoInterrupts = '';
    try {
        const resPI = await fetch(`/api/pattern-interrupts?nicho=${encodeURIComponent(nicho || 'GENERAL')}`);
        const jsonPI = await resPI.json();
        if (jsonPI.status === 'success' && jsonPI.data.length > 0) {
            catalogoInterrupts = jsonPI.data.map(p => `- (${p.tipo}) ${p.descripcion}`).join('\n');
        }
    } catch (_) { /* sin catálogo disponible, la IA improvisa */ }

    const prompt = construirPromptGuion({
        company, website, phone, logoUrl: parsedLogoUrl.logoUrl, avatarUrl: parsedLogoUrl.avatarUrl,
        format, platform: 'Instagram', style, duration, res, suggestedBpm,
        conciencia, industria, nicho, especializacion, template, slides, theme,
        modules, estiloStr, catalogoInterrupts
    });

    const response = await fetch(CONFIG.AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: 'Eres un generador de guiones publicitarios. Siempre respondes exclusivamente con JSON válido siguiendo el schema exacto proporcionado.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            model: 'openrouter/free'
        })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
    }
    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(rawContent);
    } catch (e) {
        throw new Error('La IA no devolvió JSON válido. Intenta de nuevo.');
    }
    if (Array.isArray(parsed)) {
        parsed = {
            config: { duracion_total: parseInt(duration), musica: { estilo: style, bpm: suggestedBpm, volumen: 0.8 }, fps: 24, resolucion: { ancho: res.ancho, alto: res.alto } },
            escenas: parsed.map((s, i) => ({
                id: i + 1,
                titulo: s.titulo || s.title || `Escena ${i + 1}`,
                texto: s.texto || s.text || s.body || '',
                visual: s.visual || '',
                texto_overlay: s.texto_overlay || s.titulo || s.title || '',
                duracion: s.duracion || Math.floor(parseInt(duration) / parsed.length),
                pausa_inicial: s.pausa_inicial || 0.5,
                pausa_final: s.pausa_final || 0.5,
                animacion: s.animacion || 'fade',
                musica_local: s.musica_local || null
            }))
        };
    }
    return parsed;
}

async function generarGuionDesdePrompt(prompt, duration = 30, musicStyle = 'cinematic') {
    const FMT_RES = { Post: { ancho: 1080, alto: 1080 }, Reel: { ancho: 1080, alto: 1920 }, Story: { ancho: 1080, alto: 1920 }, Banner: { ancho: 1200, alto: 628 } };
    const res = FMT_RES.Reel;

    const promptIA = `Eres un director de video. Convierte el siguiente prompt libre del usuario en un guion publicitario en EXACTAMENTE este JSON, sin markdown ni explicaciones:

{
  "config": {
    "duracion_total": ${duration},
    "musica": { "estilo": "${musicStyle}", "bpm": 110, "volumen": 0.8 },
    "fps": 24,
    "resolucion": { "ancho": ${res.ancho}, "alto": ${res.alto} }
  },
  "escenas": [
    {
      "id": 1,
      "titulo": "Nombre de la escena",
      "texto": "Texto que se narra en voz alta (speech, conversacional)",
      "visual": "Descripción cinematográfica para generar imagen IA: entorno, colores, ángulo, iluminación, composición",
      "texto_overlay": "Frase corta en pantalla (máx 60 caracteres)",
      "duracion": 5,
      "pausa_inicial": 0.5,
      "pausa_final": 0.5,
      "animacion": "zoom_in" o "ken_burns" o "fade",
      "musica_local": null,
      "pattern_interrupt": "",
      "camara": { "plano": "Close-up", "movimiento": "Whip Zoom" },
      "sfx": null
    }
  ],
  "ajustes_detectados": {
    "formato": "Post o Reel o Story o Banner, o null si el usuario no lo especifica",
    "duracion_segundos": "number, o null si el usuario no especifica duracion",
    "voz": "true si el usuario pide narracion/voz, false si pide explicitamente SIN voz/narracion, null si no lo menciona",
    "musica_instrumental": "true si el usuario pide musica instrumental/de fondo, null si no lo menciona"
  }
}

REGLAS:
1. Divide la historia del prompt en varias escenas que expliquen cada paso/proceso.
2. Cada escena con TODOS los campos del schema.
3. La SUMA de duracion de las escenas + pausas no excede ${duration}s.
4. "visual" describe la imagen generada IA del paso (una imagen por escena) coherente al estilo pedido; NO describas texto legible, letreros ni logos (los modelos de imagen no los renderizan bien).
5. Escena 1 abre con un hook visual fuerte; la última incluye una llamada a la acción.
6. "ajustes_detectados": completa cada campo SOLO si el usuario lo especifica explícitamente en su prompt (ej. "vertical 9:16" -> Reel, "40 segundos" -> 40, "sin narración ni voces" -> voz:false, "música instrumental" -> musica_instrumental:true). Si no lo menciona, deja ese campo en null. No inventes valores.
7. Responde SOLO con el JSON.

PROMPT DEL USUARIO:
${prompt}`;

    const response = await fetch(CONFIG.AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: 'Eres un director de video. Siempre respondes exclusivamente con JSON válido siguiendo el schema exacto.' },
                { role: 'user', content: promptIA }
            ],
            temperature: 0.7,
            model: 'openrouter/free'
        })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
    }
    const data = await response.json();
    let rawContent = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    let parsed = JSON.parse(rawContent);
    if (Array.isArray(parsed)) {
        parsed = {
            config: { duracion_total: duration, musica: { estilo: musicStyle, bpm: 110, volumen: 0.8 }, fps: 24, resolucion: { ancho: res.ancho, alto: res.alto } },
            escenas: parsed.map((s, i) => ({
                id: i + 1,
                titulo: s.titulo || s.title || `Escena ${i + 1}`,
                texto: s.texto || s.text || s.body || '',
                visual: s.visual || '',
                texto_overlay: s.texto_overlay || s.titulo || s.title || '',
                duracion: s.duracion || Math.floor(duration / parsed.length),
                pausa_inicial: s.pausa_inicial || 0.5,
                pausa_final: s.pausa_final || 0.5,
                animacion: s.animacion || 'fade',
                musica_local: s.musica_local || null
            }))
        };
    }
    // El estilo musical elegido en el Asistente IA siempre gana, aunque la IA
    // haya devuelto otro valor de ejemplo en config.musica.estilo.
    parsed.config = parsed.config || {};
    parsed.config.musica = { ...parsed.config.musica, estilo: musicStyle };
    parsed.ajustes_detectados = {
        formato: null, duracion_segundos: null, voz: null, musica_instrumental: null,
        ...(parsed.ajustes_detectados || {})
    };
    return parsed;
}

// Aplica al UI de ViRe lo que la IA detectó explícitamente en el prompt libre
// (formato/segundos/voz/música) y avisa con un toast qué se ajustó — así el
// usuario no tiene que tocar las pestañas/campos compartidos a mano.
function aplicarAjustesDetectados(ajustes) {
    if (!ajustes) return;
    const cambios = [];

    const formatosValidos = { Post: '1:1', Reel: '9:16', Story: '9:16', Banner: '1200×628' };
    if (ajustes.formato && formatosValidos[ajustes.formato]) {
        const tabActivo = document.querySelector('.format-tab.active')?.dataset?.format;
        if (tabActivo !== ajustes.formato) {
            document.querySelector(`.format-tab[data-format="${ajustes.formato}"]`)?.click();
            cambios.push(`${ajustes.formato} (${formatosValidos[ajustes.formato]})`);
        }
    }

    const segundos = parseInt(ajustes.duracion_segundos);
    if (segundos > 0) {
        const durationInput = document.getElementById('videDuration');
        if (durationInput && parseInt(durationInput.value) !== segundos) {
            durationInput.value = segundos;
            cambios.push(`${segundos}s`);
        }
    }

    const vozDesactivada = ajustes.voz === false || ajustes.voz === 'false';
    if (vozDesactivada) {
        const voiceCheckbox = document.getElementById('enableVoice');
        if (voiceCheckbox?.checked) {
            voiceCheckbox.checked = false;
            cambios.push('sin voz');
        }
    }

    const musicaPedida = ajustes.musica_instrumental === true || ajustes.musica_instrumental === 'true';
    if (musicaPedida) {
        const musicCheckbox = document.getElementById('enableMusic');
        if (musicCheckbox && !musicCheckbox.checked) {
            musicCheckbox.checked = true;
            cambios.push('música activada');
        }
    }

    if (cambios.length) {
        showToast(`🔎 Ajustado desde tu prompt: ${cambios.join(', ')}`, 'info');
    }
}

async function generateViReVideo() {
    if (vireGenerationInProgress) {
        showToast('⏳ Ya hay una generación de ViRe en curso, espera a que termine (o cancélala)', 'info');
        return;
    }
    if (vireJsonGenerating) {
        showToast('⏳ Espera a que termine de generarse el guion JSON antes de renderizar', 'info');
        return;
    }
    vireGenerationInProgress = true;

    const company = document.getElementById('companyName')?.value?.trim() || 'Campaña';

    const isPromptMode = document.getElementById('virePrompt')?.style.display !== 'none';
    let guion;
    if (isPromptMode) {
        const prompt = document.getElementById('virePrompt')?.value?.trim();
        if (!prompt) {
            showToast('❌ Escribe tu prompt completo', 'error');
            document.getElementById('virePrompt')?.focus();
            vireGenerationInProgress = false;
            return;
        }
        const duration = parseInt(document.getElementById('videDuration')?.value) || 30;
        const musicStyle = document.getElementById('videStyle')?.value || 'cinematic';
        showToast('🤖 Convirtiendo prompt a escenas con IA...', 'info');
        try {
            const guionObj = await generarGuionDesdePrompt(prompt, duration, musicStyle);
            aplicarAjustesDetectados(guionObj.ajustes_detectados);
            guion = JSON.stringify(guionObj, null, 2);
        } catch (e) {
            showToast(`❌ Error generando guion: ${e.message}`, 'error');
            console.error(e);
            vireGenerationInProgress = false;
            return;
        }
    } else {
        guion = document.getElementById('vireGuionJson')?.value?.trim();
        if (!guion) {
            showToast('❌ Pega el JSON del guion (escenas)', 'error');
            document.getElementById('vireGuionJson')?.focus();
            vireGenerationInProgress = false;
            return;
        }
        try {
            JSON.parse(guion);
        } catch (e) {
            showToast('❌ JSON inválido: ' + e.message, 'error');
            vireGenerationInProgress = false;
            return;
        }
    }

    const duration = parseInt(document.getElementById('videDuration')?.value) || 30;
    const enableMusic = document.getElementById('enableMusic')?.checked || false;
    const enableVoice = document.getElementById('enableVoice')?.checked ?? true;
    const format = document.querySelector('.format-tab.active')?.dataset?.format || 'Reel';
    const style = document.getElementById('videStyle')?.value || 'energetic';
    const voice = document.getElementById('videVoice')?.value || 'es-MX-DaliaNeural';

    const btn = document.getElementById('vireGenerateBtn');
    const loader = btn?.querySelector('.vire-loader');
    const btnText = btn?.querySelector('span:last-child');
    const progressDiv = document.getElementById('vireProgress');
    const progressLabel = document.getElementById('vireProgressLabel');
    const progressBar = document.getElementById('vireProgressBar');
    const imagePreview = document.getElementById('vireImagePreview');
    const resultDiv = document.getElementById('vireResult');

    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Renderizando...';
    if (progressDiv) progressDiv.style.display = 'block';
    if (progressLabel) progressLabel.textContent = 'Iniciando...';
    if (progressBar) progressBar.style.width = '2%';
    if (imagePreview) imagePreview.innerHTML = '';
    if (resultDiv) { resultDiv.style.display = 'none'; resultDiv.innerHTML = ''; }

    showToast('🎬 Enviando a ViRe (Remotion)...', 'info');

    try {
        const res = await fetch('/api/vire-produce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                empresa: company,
                sitio_web: document.getElementById('webSite')?.value?.trim() || '',
                telefono: document.getElementById('contactPhone')?.value?.trim() || '',
                guion,
                duration,
                format,
                style,
                voice,
                enableMusic,
                enableVoice
            })
        });

        const data = await res.json();
        if (data.status !== 'accepted' || !data.jobId) {
            throw new Error(data.error || 'Error del servidor');
        }

        vireCurrentJobId = data.jobId;
        await pollVireJob(data.jobId, { progressLabel, progressBar, imagePreview, resultDiv, company });
    } catch (e) {
        showToast(`❌ Error ViRe: ${e.message}`, 'error');
        console.error(e);
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div style="font-size:0.8rem;color:#f87171;">❌ ${e.message}</div>`;
        }
    } finally {
        vireCurrentJobId = null;
        vireGenerationInProgress = false;
        if (btn) btn.disabled = false;
        if (loader) loader.style.display = 'none';
        if (btnText) btnText.textContent = 'Generar con ViRe';
        if (progressDiv) progressDiv.style.display = 'none';
    }
}

// Pollea /api/vire-status hasta que el job termine (done/error/cancelled),
// actualizando el label + barra + grid de thumbnails en tiempo real — así se
// puede ver un preview de las imágenes antes de que el render termine.
const VIRE_STAGE_LABELS = { starting: 'Iniciando...', voices: 'Generando voces...' };
function pollVireJob(jobId, { progressLabel, progressBar, imagePreview, resultDiv, company }) {
    return new Promise((resolve, reject) => {
        let intervalId;
        const tick = async () => {
            let data;
            try {
                const res = await fetch(`/api/vire-status?jobId=${jobId}`);
                data = await res.json();
            } catch (e) {
                clearInterval(intervalId);
                reject(new Error('No se pudo consultar el progreso del render'));
                return;
            }
            if (data.status !== 'ok') {
                clearInterval(intervalId);
                reject(new Error(data.error || 'Job no encontrado'));
                return;
            }

            if (imagePreview && data.images?.length) {
                imagePreview.innerHTML = data.images.map(img => img.url
                    ? `<img src="${img.url}" title="${(img.prompt || '').replace(/"/g, '&quot;')}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid var(--glass-border);">`
                    : '<div style="width:64px;height:64px;border-radius:6px;background:rgba(255,255,255,0.05);"></div>'
                ).join('');
            }

            if (progressLabel) {
                if (data.stage === 'images') progressLabel.textContent = `Generando imágenes (${data.images.length}/${data.imageTotal})...`;
                else if (data.stage === 'render') progressLabel.textContent = `Renderizando video (${data.percent}%)...`;
                else progressLabel.textContent = VIRE_STAGE_LABELS[data.stage] || data.stage;
            }
            if (progressBar) {
                let pct = 2;
                if (data.stage === 'voices') pct = 5;
                else if (data.stage === 'images') pct = 10 + (data.imageTotal ? (data.images.length / data.imageTotal) * 20 : 0);
                else if (data.stage === 'render') pct = 30 + (data.percent / 100) * 70;
                else if (data.stage === 'done') pct = 100;
                progressBar.style.width = `${Math.round(pct)}%`;
            }

            if (data.stage === 'done') {
                clearInterval(intervalId);
                const videoUrl = `/api/vire-result?jobId=${jobId}`;
                if (resultDiv) {
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = `
                        <video controls src="${videoUrl}" style="width:100%;border-radius:8px;margin-bottom:0.5rem;"></video>
                        <a href="${videoUrl}" download="vire_${company.replace(/\s+/g, '_')}_${Date.now()}.mp4" class="secondary-btn" style="display:block;text-align:center;font-size:0.8rem;padding:0.5rem;text-decoration:none;">⬇️ Descargar</a>`;
                }
                showToast('✅ Video ViRe listo', 'success');
                resolve();
            } else if (data.stage === 'error') {
                clearInterval(intervalId);
                reject(new Error(data.error || 'Render falló'));
            } else if (data.stage === 'cancelled') {
                clearInterval(intervalId);
                showToast('⏹️ Render cancelado', 'info');
                resolve();
            }
        };
        intervalId = setInterval(tick, 2000);
        tick();
    });
}

async function ejecutarAgente() {
    const btn = document.getElementById('agentBtn');
    const loader = btn?.querySelector('.agent-loader');
    const btnText = btn?.querySelector('span:last-child');
    if (btn) btn.disabled = true;
    if (loader) loader.style.display = 'inline-block';
    if (btnText) btnText.textContent = 'Buscando tendencias...';

    showToast('🤖 Agente buscando tendencias...', 'info');

    try {
        const res = await fetch('/api/agent/tendencias', { method: 'POST' });
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.message || 'Error del agente');

        const datos = json.data;
        const nuevas = datos.filter(d => d.receta.nueva);
        const total = datos.length;

        let msg = `✅ ${total} tendencias procesadas`;
        if (nuevas.length > 0) {
            msg += `, ${nuevas.length} receta${nuevas.length > 1 ? 's' : ''} nueva${nuevas.length > 1 ? 's' : ''} creada${nuevas.length > 1 ? 's' : ''}`;
        }
        showToast(msg, 'success');

        // Mostrar resultados detallados en consola y toast
        datos.forEach(d => {
            console.log(`📌 ${d.tendencia.titulo} → ${d.receta.nombre}${d.receta.nueva ? ' 🆕' : ''}`);
        });

        // Recargar recetas si se crearon nuevas
        if (nuevas.length > 0) {
            setTimeout(loadRecetas, 1000);
        }
    } catch (e) {
        showToast(`❌ ${e.message}`, 'error');
        console.error(e);
    } finally {
        if (btn) btn.disabled = false;
        if (loader) loader.style.display = 'none';
        if (btnText) btnText.textContent = 'Buscar Tendencias';
    }
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
    const parsedLogo = parseLogoUrlField(document.getElementById('companyLogo').value.trim());
    const userLogoUrl = parsedLogo.logoUrl ? await resolveLogoUrl(normalizeDriveUrl(parsedLogo.logoUrl)) : null;
    const userAvatarUrl = parsedLogo.avatarUrl ? await resolveLogoUrl(normalizeDriveUrl(parsedLogo.avatarUrl)) : null;
    const industry = aiNicho ? aiNicho.value : aiIndustry.value;
    const theme = aiTheme.value;

    data.slides.forEach((slide, index) => {
        const slideEl = document.createElement('div');
        slideEl.className = `carousel-slide ${isReel ? 'reel-mode' : ''}`;

        const slideId = `slide-img-${index}-${Date.now()}`;
        const slideTitle = slide.title || `Slide ${index + 1}`;
        const slideBody = slide.body || '';
        const slideVisual = slide.visual || slide.image_prompt || 'Professional photo';

        slideEl.textContent = '';
        const loaderDiv2 = document.createElement('div');
        loaderDiv2.id = `loader-${slideId}`;
        loaderDiv2.className = 'image-loading-state';
        loaderDiv2.innerHTML = '<div class="clock-loader"></div><div class="loading-text">BUSCANDO MEJOR OPCIÓN...</div>';
        slideEl.appendChild(loaderDiv2);

        if (userLogoUrl) {
            const logoImg2 = document.createElement('img');
            logoImg2.src = userLogoUrl;
            logoImg2.className = 'slide-logo';
            logoImg2.alt = 'logo';
            slideEl.appendChild(logoImg2);
        }

        if (userAvatarUrl) {
            const avatarImg2 = document.createElement('img');
            avatarImg2.src = userAvatarUrl;
            avatarImg2.className = 'slide-avatar';
            avatarImg2.alt = 'avatar';
            avatarImg2.style.cssText = 'position:absolute;bottom:100px;right:15px;width:70px;height:70px;border-radius:50%;border:3px solid rgba(255,255,255,0.8);object-fit:cover;z-index:10;box-shadow:0 4px 15px rgba(0,0,0,0.3);';
            slideEl.appendChild(avatarImg2);
        }

        const slideImage2 = document.createElement('div');
        slideImage2.className = 'slide-image';
        slideImage2.id = slideId;
        slideEl.appendChild(slideImage2);

        const overlay2 = document.createElement('div');
        overlay2.className = 'slide-overlay';

        const controls = document.createElement('div');
        controls.className = 'slide-controls';
        controls.style.cssText = 'position:absolute;top:1rem;right:1rem;display:flex;gap:0.5rem;z-index:10;';

        const voiceBtn2 = document.createElement('button');
        voiceBtn2.className = 'voice-btn';
        voiceBtn2.title = 'Escuchar';
        voiceBtn2.textContent = '\u{1F50A}';
        voiceBtn2.addEventListener('click', function() { speakText(slideBody, this); });
        controls.appendChild(voiceBtn2);

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-img-btn';
        refreshBtn.title = 'Cambiar Foto';
        refreshBtn.textContent = '\u{1F504}';
        Object.assign(refreshBtn.style, { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.3s' });
        refreshBtn.addEventListener('mouseenter', function() { this.style.background = 'var(--primary)'; this.style.borderColor = 'var(--primary)'; });
        refreshBtn.addEventListener('mouseleave', function() { this.style.background = 'rgba(255,255,255,0.2)'; this.style.borderColor = 'rgba(255,255,255,0.3)'; });
        refreshBtn.addEventListener('click', function() { regenerateSlideImage(slideId, slideVisual, industry, theme); });
        controls.appendChild(refreshBtn);

        const animBtn = document.createElement('button');
        animBtn.className = 'anim-btn';
        animBtn.title = 'Descargar Video Animado';
        animBtn.textContent = '\u{1F3AC}';
        const animDisplay = document.getElementById('enableAnimation')?.checked ? 'flex' : 'none';
        Object.assign(animBtn.style, { background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: animDisplay, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)', transition: 'all 0.3s', fontSize: '0.8rem' });
        animBtn.addEventListener('mouseenter', function() { this.style.background = 'var(--accent-color)'; this.style.borderColor = 'var(--accent-color)'; });
        animBtn.addEventListener('mouseleave', function() { this.style.background = 'rgba(245,158,11,0.2)'; this.style.borderColor = 'rgba(245,158,11,0.3)'; });
        animBtn.addEventListener('click', function() { downloadAnimatedVideo(slideId, index); });
        controls.appendChild(animBtn);
        overlay2.appendChild(controls);

        const slideNum2 = document.createElement('div');
        slideNum2.className = 'slide-number';
        slideNum2.textContent = `Slide ${index + 1}`;
        overlay2.appendChild(slideNum2);

        const slideTitle2 = document.createElement('div');
        slideTitle2.className = 'slide-title';
        slideTitle2.textContent = slideTitle;
        overlay2.appendChild(slideTitle2);

        const slideBody2 = document.createElement('div');
        slideBody2.className = 'slide-body';
        slideBody2.textContent = slideBody;
        overlay2.appendChild(slideBody2);

        const slideVisual2 = document.createElement('div');
        slideVisual2.className = 'slide-visual';
        slideVisual2.style.cssText = 'font-size:0.65rem;background:rgba(255,255,0,0.15);border:1px solid rgba(255,255,0,0.3);padding:5px;border-radius:4px;color:yellow;margin-top:0.5rem;';
        const sourceSpan = document.createElement('span');
        sourceSpan.id = `source-${slideId}`;
        sourceSpan.style.cssText = 'float:right;opacity:0.7;border:1px solid;padding:1px 4px;border-radius:3px;font-size:0.5rem;margin-left:5px;';
        sourceSpan.textContent = '[Buscando...]';
        slideVisual2.appendChild(sourceSpan);
        const conceptText = document.createTextNode(`🎨 Concepto: ${slideVisual}`);
        slideVisual2.appendChild(conceptText);
        overlay2.appendChild(slideVisual2);

        slideEl.appendChild(overlay2);
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

// --- ACTIVACIÓN DE BOTONES DE MODO ---
document.getElementById('btnModeAi')?.addEventListener('click', () => setWorkMode('Ai'));
document.getElementById('btnModeBd')?.addEventListener('click', () => setWorkMode('BD'));
document.getElementById('btnModeBdpv')?.addEventListener('click', () => setWorkMode('BDPV'));
document.getElementById('btnModeViRe')?.addEventListener('click', () => setWorkMode('ViRe'));

// Carga inicial de empresas si está en modo BD
loadCompanies().then(() => { setupCompanyAutoFill(); fetchEstilosVisuales(); });

// --- ANIMACIÓN DE FOTO (FFmpeg backend) ---
async function downloadAnimatedVideo(slideId, index) {
    const toggle = document.getElementById('enableAnimation');
    if (!toggle?.checked) return;

    const effect = document.getElementById('animationEffect')?.value || 'zoom';
    const duration = 5; // single slide fixed at 5s
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

            const activeFormat = document.querySelector('.format-tab.active')?.dataset.format || 'Post';
            const isVertical = (activeFormat === 'Reel' || activeFormat === 'Story');

            const response = await fetch('/api/animate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64, effect, duration, vertical: isVertical })
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
        el.innerHTML = logs.map(l => `<div>${escapeHtml(l)}</div>`).join('');
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
