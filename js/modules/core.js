/**
 * SuitOrg Core Module - v16.5.5
 * ---------------------------------------------------------
 * Sincronización: 2026-03-25 04:30 PM (Self-Recovery)
 * ---------------------------------------------------------
 * Responsabilidad: Estado global, carga de datos y utilidades base.
 */
var app = {
    // --- APP CONFIG ---
    version: "260424-0953", // Sistema Inteligente (v260424-0953) - Secure Proxy 🛡️
    PAUSE_SUPABASE: false, // ✅ Supabase ACTIVO - Migración v16.7.0
    // Se cargan desde js/modules/config.js (inyectado en deploy)
    apiUrl: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.apiUrl || "").trim() : '',
    apiToken: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.apiToken || "").trim() : '',
    config: {
        engine: "OPENROUTER",
        openRouterKey: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.openRouterKey || "").trim() : '',
        defaultModel: "mistralai/mistral-7b-instruct:free",
        aiMaxTokens: 1000,
        aiTemperature: 0.7
    },
    sbUrl: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.sbUrl || "https://egyxgnlnzanxpqyuvmsg.supabase.co").trim() : 'https://egyxgnlnzanxpqyuvmsg.supabase.co',
    sbKey: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.sbKey || "").trim() : '',
    openRouterKey: (typeof SUIT_CONFIG !== 'undefined') ? String(SUIT_CONFIG.openRouterKey || "").trim() : '',
    data: {
        Config_Empresas: [],
        Usuarios: [],
        Leads: [],
        Catalogo: [],
        Proyectos: [],
        Config_Roles: [],
        Config_Flujo_Proyecto: [],
        Config_Galeria: [],
        Empresa_Documentos: [],
        Logs: [],
        Prompts_IA: [],
        Config_SEO: [],
        Cuotas_Pagos: [],
        Config_Paginas: [],
        Config_IA_Notebooks: [],
        // Config_Auth: [], // Huerfana
        // Logs: [], // Huerfana
        // Logs_Chat_IA: [], // Huerfana
        // Memoria_IA_Snapshots: [], // Huerfana
        // Logs_Consultas_SOP: [] // Huerfana
    },
    state: {
        currentUser: null,
        companyId: null,
        dbEngine: 'GSHEETS', // Valor por defecto.
        cameFromOrbit: false,
        isFood: false,
        lastActivity: Date.now(),
        currentAgent: null,
        chatHistory: [],
        cart: [],
        deliveryMethod: 'PICKUP',
        posFilter: 'PEDIDO-RECIBIDO',
        reportPaymentFilter: 'TODOS',
        activeReportSubtype: 'general',
        _isUpdatingStatus: false,
        _recentStatusCache: {},
        _chartSales: null,
        _chartPay: null,
        _consoleStarted: false,
        currentLeadId: null
    },
    utils: {
        fixDriveUrl: (url) => {
            if (!url) return "";
            const sUrl = url.toString().trim();
            // 1. Detectar si es una URL de Drive estándar o el formato obsoleto 'uc?id='
            const idMatch = sUrl.match(/\/d\/([^\/?#]+)/) ||
                sUrl.match(/[?&]id=([^&?#]+)/) ||
                sUrl.match(/\/file\/d\/([^\/?#]+)/) ||
                sUrl.match(/\/open\?id=([^&?#]+)/);

            if (idMatch && idMatch[1] && (sUrl.includes('google.com') || sUrl.includes('drive.google.com'))) {
                return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
            }
            // 2. Si no es URL pero parece un ID de Drive (aprox 33 chars y sin puntos/slashes)
            if (!sUrl.includes('/') && !sUrl.includes('.') && sUrl.length > 20) {
                return `https://lh3.googleusercontent.com/d/${sUrl}`;
            }
            return sUrl;
        },
        getEffectivePrice: (p) => {
            if (!p) return 0;
            const reg = parseFloat(p.precio) || 0;
            const off = parseFloat(p.precio_oferta || p.Precio_Oferta) || 0;
            return (reg > 0 && off > 0) ? Math.min(reg, off) : (off || reg || 0);
        },
        playNotification: () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) { }
        },
        playBuzz: () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
            } catch (e) { }
        },

        playClick: () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.05);
            } catch (e) { }
        },
        getCoId: (p) => {
            return (p.id_empresa || p.empresa || p.company || "SuitOrg").toString().trim().toUpperCase();
        },
        sanitizeString: (str) => {
            if (typeof str !== 'string') return str;
            return str
                .replace(/ñƒ³/g, "ó").replace(/ñƒâ€œ/g, "Ó").replace(/ñƒ¡/g, "á")
                .replace(/ñƒ©/g, "é").replace(/ñƒ­/g, "í").replace(/ñƒº/g, "ú")
                .replace(/ñƒâ€°/g, "É").replace(/ñ‚©/g, "©").replace(/ñ‚¡/g, "¡")
                .replace(/ñƒ/g, "ñ").replace(/ñš/g, "Ú")
                .replace(/Ã¡/g, "á").replace(/Ã©/g, "é").replace(/Ã\xad/g, "í")
                .replace(/Ã³/g, "ó").replace(/Ãº/g, "ú").replace(/Ã±/g, "ñ")
                .trim();
        },
        // --- MAESTRO DEL TIEMPO (v5.2.0 Inmortal) ---
        getTimestamp: () => {
            // Formato ISO 8601 para registros de precisión
            return new Date().toISOString();
        },
        getDate: () => {
            // Formato estándar YYYY-MM-DD para campos base
            return new Date().toLocaleDateString('en-CA');
        }
    },
    loadEnvConfig: async () => {
        try {
            const res = await fetch('/api/config', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status} - El servidor no tiene el endpoint /api/config`);
            const cfg = await res.json();
            
            if (cfg.sbUrl && cfg.sbKey) {
                app.sbUrl = cfg.sbUrl;
                app.sbKey = cfg.sbKey;
                if (cfg.openRouterKey) app.openRouterKey = cfg.openRouterKey;
                console.log('🔑 [ENV] Configuración de llaves cargada exitosamente.');
            } else {
                console.warn('⚠️ [ENV] El servidor respondió pero las llaves están vacías. Revisa tu archivo .env');
            }
        } catch (e) {
            console.error('❌ [ENV_FAIL] Error al cargar configuración:', e.message);
            // Fallback: usa valores de config.js (SUIT_CONFIG) si existe
            if (typeof SUIT_CONFIG !== 'undefined' && SUIT_CONFIG.sbUrl) {
                app.sbUrl = SUIT_CONFIG.sbUrl;
                app.sbKey = SUIT_CONFIG.sbKey;
                console.warn('⚠️ [ENV] Usando fallback de config.js');
            }
        }
    },
    init: async () => {
        try {
            console.log("🚀 Iniciando Orquestador EVASOL...");

            // 0. Cargar recursos externos (.env)
            await app.loadEnvConfig();

            // 1. Inicializar Router (Observador de Hash)
            if (app.router && app.router.init) app.router.init();

            const urlParams = new URLSearchParams(window.location.search);
            const coParam = urlParams.get('co') || urlParams.get('id');
            if (coParam) app.state.companyId = coParam.trim().toUpperCase();

            if (app.ui && app.ui.bindEvents) app.ui.bindEvents();
            if (app.monitor && app.monitor.start) app.monitor.start();

            const loaded = await app.loadData();
            const loader = document.getElementById('transition-loader');
            if (loader) loader.classList.add('hidden'); // Use hidden class instead of remove if preferred, but for now just fix the ID.

            // --- ESPERA DE MÓDULOS (v6.5.3 Blindaje Total) ---
            // Aseguramos que public.js y otros módulos se hayan inyectado correctamente en el objeto app
            let modulesReady = false;
            let retries = 0;
            while (!modulesReady && retries < 10) {
                if (app.public && app.public.renderHome && app.ui && app.ui.applyTheme) {
                    modulesReady = true;
                } else {
                    console.warn(`⏳ Esperando módulos... Intento ${retries + 1}/10`);
                    await new Promise(resolve => setTimeout(resolve, 150));
                    retries++;
                }
            }

            if (loaded) {
                // --- ULTRA DEBUG MODE (v5.3.5) ---
                console.log("🔍 [DATA_CHECK] Estructura de Config_Empresas:");
                console.table(app.data.Config_Empresas.slice(0, 2)); // Solo ver los primeros 2
                if (app.data.Config_Empresas[0]) {
                    console.log("📄 LLAVES DETECTADAS EN EXCEL:", Object.keys(app.data.Config_Empresas[0]).join(', '));
                }

                // Determine Principal Context
                const mainBiz = (app.data.Config_Empresas || []).find(c => {
                    const isPri = c.es_principal || c.esprincipal || c.Es_Principal || c.esPrincipal;
                    return String(isPri).toUpperCase() === 'TRUE' || isPri === true || isPri === 1;
                });

                // --- REDIRECCIONADOR MAESTRO (v6.3.0) ---
                // Intentar buscar por id_empresa O por alias_seo
                let company = app.data.Config_Empresas.find(c =>
                    String(c.id_empresa).toUpperCase() === String(app.state.companyId).toUpperCase() ||
                    (c.alias_seo && String(c.alias_seo).toLowerCase() === String(app.state.companyId).toLowerCase())
                );

                // Si se encontró por alias, normalizar el state.companyId al ID técnico
                if (company && company.alias_seo && String(company.alias_seo).toLowerCase() === String(app.state.companyId).toLowerCase()) {
                    console.log(`🔗 Redirección Maestro: [${app.state.companyId}] -> [${company.id_empresa}]`);
                    
                    // --- MAQUILLAJE ELITE (v16.8.0) ---
                    // Si tenemos Alias SEO, lo usamos para limpiar la URL del navegador
                    const cleanPath = `/${company.alias_seo}`;
                    if (window.location.pathname !== cleanPath) {
                        window.history.replaceState({}, '', cleanPath);
                    }
                    app.state.companyId = company.id_empresa;
                }

                const hasUrlParam = !!coParam;

                // If it's the first visit follow the "Main Biz" rule (v5.3.7)
                // REFUERZO v6.2.7: El parámetro 'co' manda sobre cualquier otra lógica de inicio
                if (!hasUrlParam && mainBiz) {
                    const currentHash = window.location.hash;
                    if (!currentHash || currentHash === "" || currentHash === "#orbit") {
                        const mode = (mainBiz.modo_sitio || 'HUB').toString().toUpperCase();
                        if (mode !== 'HUB') {
                            console.log("🚀 Redirección Automática a Empresa Principal:", mainBiz.id_empresa);
                            app.state.companyId = mainBiz.id_empresa;
                            company = mainBiz;
                            // En lugar de ensuciar con #home, mantenemos la URL limpia si tiene alias
                            const dest = company.alias_seo ? `/${company.alias_seo}` : `/#home`;
                            window.history.replaceState({}, '', dest);
                        }
                    }
                }

                // Standard Resolution
                const isHubMode = (window.location.hash === '#orbit' || (!window.location.hash && !hasUrlParam && !mainBiz)) && !hasUrlParam;

                if (isHubMode) {
                    console.log("🌌 Hub Mode Active - Rendering Orbit");
                    app.state.companyId = null;
                    window.location.hash = '#orbit';
                    if (app.ui && app.ui.renderOrbit) app.ui.renderOrbit();
                    company = null;
                } else if (!company && hasUrlParam) {
                    // Logic for manual links
                    console.warn(`[V5.3.2] Identity Lock: Company ${coParam} not yet in cache, preserving ID.`);
                    app.state.companyId = coParam.trim().toUpperCase();
                } else if (!company && !hasUrlParam) {
                    // Fallback unchanged if no main biz and no param
                    company = app.data.Config_Empresas[0];
                    if (company) app.state.companyId = company.id_empresa;
                }

                if (company) {
                    app.state.dbEngine = company.db_engine || company.dbengine || 'GSHEETS';
                    if (app.ui && app.ui.applyTheme) app.ui.applyTheme(company);
                }

                // --- RE-ENRUTADO POST-CARGA (v6.5.2) ---
                if (app.router && app.router.handleRoute) {
                    console.log("🔄 Re-sincronizando ruta tras carga de datos...");
                    app.router.handleRoute();
                }

                if (app.pos && app.pos.loadCart) app.pos.loadCart();
                app.checkBackendVersion();

                // Cargar galería UNA SOLA VEZ al inicio (no en cada sync del watchdog)
                if (app.state.companyId && app.loadGalleryFromStorage) {
                    app.loadGalleryFromStorage(app.state.companyId);
                }
            } else {
                console.error("[INIT_FAILED] DATA_LOAD_FAILED");
                alert(`Error de conexión con la base de datos.`);
            }
        } catch (err) {
            console.error("CRITICAL_INIT_ERROR:", err);
            alert("Error crítico en el arranque: " + err.message);
        }
    },
    checkBackendVersion: async () => {
        const text = document.getElementById('gs-version-text');
        if (!text) return;
        try {
            const res = await fetch(`${app.apiUrl}?action=ping&token=${app.apiToken}`);
            const data = await res.json();
            if (data.version) {
                const backendVer = data.version.split(/\s+/)[0].replace('v', '').trim();
                const frontendVer = app.version.replace('v', '').trim();
                text.innerText = "V: " + data.version;
                if (backendVer === frontendVer) text.style.color = "#00e676";
                else text.style.color = "#ffb300";
            }
        } catch (e) {
            text.innerText = "V: OFFLINE";
            text.style.color = "red";
        }
    },
    loadData: async () => {
        try {
            const fetchId = app.state.companyId || "SuitOrg";

            // 1. CARGA DE CONFIGURACIÓN MAESTRA (Siempre desde Google Sheets)
            const masterUrl = `${app.apiUrl}?action=getAll&id_empresa=${fetchId}&token=${app.apiToken}`;
            const masterRes = await fetch(masterUrl);
            const masterData = await masterRes.json();

            if (masterData.status === 'ERROR' || masterData.error) throw new Error(masterData.message || masterData.error);

            // Sanitizar datos maestros
            const sanitizedMaster = JSON.parse(JSON.stringify(masterData), (key, value) =>
                typeof value === 'string' ? app.utils.sanitizeString(value) : value
            );

            // 2. DETECTAR MOTOR DE DATOS
            const currentBiz = (sanitizedMaster.Config_Empresas || []).find(c =>
                String(c.id_empresa).toUpperCase() === String(fetchId).toUpperCase()
            ) || sanitizedMaster.Config_Empresas[0];

            const dbEngine = (currentBiz?.db_engine || currentBiz?.dbengine || 'GSHEETS').toUpperCase();
            console.log(`[DB_ENGINE] Motor Detectado: ${dbEngine} para ${fetchId}`);

            let finalData = sanitizedMaster;

            app.data = finalData;

            // 🚀 ESTRATEGIA DE VELOCIDAD 1% (v16.7.14) - CARGA EN PARALELO
            // No esperamos uno por uno, pedimos todo al mismo tiempo
            if (dbEngine === 'SUPABASE' && !app.PAUSE_SUPABASE) {
                const supabaseData = await app.loadFromSupabase(fetchId);
                app.data = { ...app.data, ...supabaseData };
                app.data.Config_Empresas = sanitizedMaster.Config_Empresas; 
                app.data.Usuarios = sanitizedMaster.Usuarios;
                app.state.dbEngine = 'SUPABASE';
            }

            if (app.ui && app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
            return true;
        } catch (e) {
            console.error("[DATA_LOAD_CRITICAL]", e);
            return false;
        }
    },
    // EVASOL - CORE MODULE (v16.7.0 - MIGRACIÓN COMPLETA SUPABASE)
    loadFromSupabase: async (coId) => {
        console.log(`⚡ [SECURE_DB] Cargando tablas vía Proxy para ${coId}...`);

        const tables = [
            'Catalogo', 'Leads', 'Proyectos', 'Pagos', 'Proyectos_Pagos',
            'Proyectos_Etapas', 'Proyectos_Bitacora', 'Config_Flujo_Proyecto',
            'Proyectos_Materiales', 'Prompts_IA', 'Logs_Chat_IA',
            'Memoria_IA_Snapshots', 'Logs', 'Config_Galeria',
            'Empresa_Galeria', 'Empresa_Documentos', 'Reservaciones',
            'Config_SEO', 'Config_Paginas', 'Cuotas_Pagos', 'Config_IA_Notebooks'
        ];

        const results = {};
        try {
            await Promise.all(tables.map(async (table) => {
                // Pasamos coId como filtro de consulta al proxy
                const url = `/api/db/${table}?id_empresa=${coId}`;
                const res = await fetch(url);
                if (res.ok) {
                    const raw = await res.json();
                    results[table] = JSON.parse(JSON.stringify(raw), (key, value) =>
                        typeof value === 'string' ? app.utils.sanitizeString(value) : value
                    );
                    console.log(`  ✓ ${table}: ${results[table].length} registros`);
                } else {
                    console.warn(`  ⚠️ [SECURE_DB] Error en tabla ${table}: ${res.status}`);
                    results[table] = [];
                }
            }));
            return results;
        } catch (err) {
            console.error("❌ [SECURE_DB_FAIL]", err);
            return {};
        }
    },

    /**
     * EVASOL - STORAGE ENGINE (v16.7.13)
     * Automatización total para galerías sin copy-paste.
     */
    _lastGalleryCompanyId: null,
    loadGalleryFromStorage: async (coId) => {
        if (!coId) return;
        // Cache: solo escanear UNA VEZ por empresa por sesión
        if (app._lastGalleryCompanyId === coId) {
            console.log(`📸 [STORAGE] Usando caché para ${coId} (ya escaneado)`);
            return;
        }
        app._lastGalleryCompanyId = coId;
        // Configuración desde el estado global (v16.7.17)
        const SB_URL = app.sbUrl;
        const SB_KEY = app.sbKey || (typeof SUIT_CONFIG !== 'undefined' ? SUIT_CONFIG.sbKey : '');
        const bucket = 'galeria-privada';
        const path = coId.toUpperCase();

        if (!SB_URL || !SB_KEY) {
            console.warn("⚠️ [STORAGE] Falta configuración de Supabase (URL/KEY)");
            return;
        }

        console.log(`📸 [STORAGE] Escaneando bucket '${bucket}' para el tenant: ${path}...`);

            try {
            const res = await fetch(`${SB_URL}/storage/v1/object/list/${bucket}`, {
                method: 'POST',
                headers: {
                    'apikey': SB_KEY,
                    'Authorization': `Bearer ${SB_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prefix: path, limit: 30, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
            });

            if (res.ok) {
                const rawFiles = await res.json();
                // Filtro Élite: Destruir ".emptyFolderPlaceholder" y subcarpetas sin ID
                let files = rawFiles.filter(f => f.id && f.name && !f.name.includes('emptyFolder'));
                
                // Ordenar por las 20 más recientes (v16.7.24)
                files.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                files = files.slice(0, 20);
                
                console.log(`  ✓ Storage: ${files.length} fotos recientes detectadas en ${path} (Autoplay)`);

                // Convertir archivos de storage al formato que espera el componente Gallery
                const storagePhotos = files.map(f => ({
                    id_empresa: coId,
                    foto_url: `${SB_URL}/storage/v1/object/public/${bucket}/${path}/${f.name}`,
                    orden: 1,
                    titulo: f.name.replace(/_/g, ' ').replace(/\.[^/.]+$/, "") // Nombre limpio
                }));

                // Integrar con el caché global de galerías
                if (!app.data.Config_Galeria) app.data.Config_Galeria = [];
                // Evitar duplicados si ya existen o combinar
                app.data.Config_Galeria = [...storagePhotos, ...app.data.Config_Galeria.filter(g => g.id_empresa !== coId)];
            } else {
                console.warn(`  ⚠️ [STORAGE] No se pudo leer el bucket. Asegúrate que sea público.`);
            }
        } catch (e) {
            console.error("[STORAGE_REFRESH_ERROR]", e);
        }
    },
    switchCompany: async (newId) => {
        // 1. Mostrar Loader de Transición
        const loader = document.getElementById('transition-loader');
        if (loader) {
            loader.classList.remove('hidden');
            const msg = document.getElementById('loader-msg');
            if (msg) msg.innerText = `Accediendo a ${newId}...`;
        }

        // 2. Limpieza Agresiva de UI
        const menu = document.getElementById('menu-public');
        if (menu) menu.innerHTML = '';

        // Limpiar secciones de contenido dinámico previas
        ['story-h2', 'story-h3', 'story-content', 'story-img'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.tagName === 'IMG') el.src = '';
                else el.innerHTML = '';
            }
        });

        const orbitView = document.getElementById('view-orbit');
        if (orbitView) orbitView.classList.add('hidden');

            if (app.pos && app.pos.saveCart) app.pos.saveCart(); // Guardar el anterior por seguridad
            app.state.companyId = newId;
            app.state.isFood = false;

            const success = await app.loadData();
            if (success) {
                const company = app.data.Config_Empresas.find(c => c.id_empresa === newId);
                if (app.ui.applyTheme) app.ui.applyTheme(company);
                
                app.loadGalleryFromStorage(newId);
                if (app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();

                if (app.pos && app.pos.loadCart) app.pos.loadCart(); // Cargar la nueva sesión aislada
                
                // --- NAVEGACIÓN LIMPIA (v16.8.1) ---
                if (company.alias_seo) {
                    window.history.replaceState({}, '', `/${company.alias_seo}`);
                    // Forzamos al router a procesar la vista de inicio
                    if (app.router && app.router.handleRoute) app.router.handleRoute();
                } else {
                    window.location.hash = "#home";
                }

            if (app.ui.updateConsole) app.ui.updateConsole(`TENANT_SWITCH: ${newId}`);
        }

        // 3. Ocultar Loader
        if (loader) {
            setTimeout(() => loader.classList.add('hidden'), 800);
        }
    },
    createAgentTask: async (taskType, params) => {
        const SB_URL = 'https://hmrpotibipxhsnowgjvq.supabase.co';
        const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcnBvdGliaXB4aHNub3dnanZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzAxMzQsImV4cCI6MjA4ODk0NjEzNH0.6Ftmwtbw5Prp-TQhMkmGivo6CDVV8QDP_Xj1OJZ7G5w';

        try {
            const res = await fetch(`${SB_URL}/rest/v1/Agent_Tasks`, {
                method: 'POST',
                headers: {
                    'apikey': SB_KEY,
                    'Authorization': `Bearer ${SB_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    id_empresa: app.state.companyId,
                    task_type: taskType,
                    parameters: params,
                    status: 'PENDING'
                })
            });
            if (res.ok) {
                const data = await res.json();
                return data[0]?.id;
            }
            return null;
        } catch (e) {
            console.error("❌ [AGENT_TASK_FAIL]", e);
            return null;
        }
    },
    saveRecord: async (tabla, registro, campoId) => {
        registro.id_empresa = registro.id_empresa || app.state.companyId;

        if (app.state.dbEngine === 'SUPABASE' && !app.PAUSE_SUPABASE) {
            try {
                // v17.0.0: Guardado Seguro vía Proxy
                const res = await fetch(`/api/db/${tabla}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registro)
                });

                if (res.ok) {
                    const saved = await res.json();
                    console.log(`✅ [SECURE_WRITE] ${tabla} → ${registro[campoId]}`);
                    return { ok: true, data: saved.data };
                } else {
                    const err = await res.json();
                    console.warn(`⚠️ [SECURE_WRITE] Error en ${tabla}:`, err);
                    return { ok: false, error: err.error || "Fallo en Proxy" };
                }
            } catch (e) {
                console.error(`❌ [SECURE_WRITE_FAIL] ${tabla}`, e);
                return { ok: false, error: e.message };
            }
        } else {
            console.log(`[GAS WRITE] ${tabla} → motor no es SUPABASE, sin acción.`);
            return { ok: false, error: 'Motor no es SUPABASE' };
        }
    }
};
