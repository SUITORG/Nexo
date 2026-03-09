/**
 * 
 * Responsabilidad: Estado global, carga de datos y utilidades base.
 */
const app = {
    // --- APP CONFIG ---
    version: '6.2.1', // v6.2.1: Multi-Engine db_engine support.

    // Se cargan desde js/modules/config.js (ignorado en git)
    apiUrl: (typeof SUIT_CONFIG !== 'undefined') ? SUIT_CONFIG.apiUrl : '',
    apiToken: (typeof SUIT_CONFIG !== 'undefined') ? SUIT_CONFIG.apiToken : '',
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
        Config_Paginas: []
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
            const idMatch = sUrl.match(/\/d\/([^\/?#]+)/) || sUrl.match(/[?&]id=([^&?#]+)/) || sUrl.match(/\/file\/d\/([^\/?#]+)/);
            if (idMatch && idMatch[1] && (sUrl.includes('google.com') || sUrl.includes('drive.google.com'))) {
                return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
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
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
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
    init: async () => {
        try {
            console.log("🚀 Iniciando Orquestador EVASOL...");

            // 1. Inicializar Router Primero (Seguridad de Enrutado)
            if (app.router && app.router.init) app.router.init();

            if (window.location.hash === '#orbit' || !window.location.hash) {
                const orbit = document.getElementById('view-orbit');
                if (orbit) orbit.classList.remove('hidden');
            }

            const urlParams = new URLSearchParams(window.location.search);
            const coParam = urlParams.get('co') || urlParams.get('id');
            if (coParam) app.state.companyId = coParam.trim().toUpperCase();

            if (app.ui && app.ui.bindEvents) app.ui.bindEvents();
            if (app.monitor && app.monitor.start) app.monitor.start();

            const loaded = await app.loadData();
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.remove();

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

                let company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const hasUrlParam = !!coParam;

                // If it's the first visit follow the "Main Biz" rule (v5.3.7)
                if (!hasUrlParam && mainBiz) {
                    const currentHash = window.location.hash;
                    // Solo redireccionamos si no hay hash o si estamos en el hub por defecto
                    if (!currentHash || currentHash === "" || currentHash === "#orbit") {
                        const mode = (mainBiz.modo_sitio || 'HUB').toString().toUpperCase();
                        if (mode !== 'HUB') {
                            console.log("🚀 Redirección Automática a Empresa Principal:", mainBiz.id_empresa);
                            app.state.companyId = mainBiz.id_empresa;
                            company = mainBiz;
                            window.location.hash = '#home';
                        }
                    }
                }

                // Standard Resolution
                const isHubMode = window.location.hash === '#orbit' || (!window.location.hash && !hasUrlParam && !mainBiz);

                if (isHubMode) {
                    console.log("🌌 Hub Mode Active - Rendering Orbit");
                    app.state.companyId = null;
                    window.location.hash = '#orbit';
                    if (app.ui.renderOrbit) app.ui.renderOrbit();
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
                    if (app.ui.applyTheme) app.ui.applyTheme(company);
                }
                if (app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
                app.checkBackendVersion();
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
            const url = `${app.apiUrl}?action=getAll&id_empresa=${fetchId}&token=${app.apiToken}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
            const data = await response.json();
            if (data.status === 'ERROR' || data.error) throw new Error(data.message || data.error);

            const sanitizedData = JSON.parse(JSON.stringify(data), (key, value) =>
                typeof value === 'string' ? app.utils.sanitizeString(value) : value
            );

            let localCache = JSON.parse(localStorage.getItem('suit_status_cache') || '{}');
            if (sanitizedData.Proyectos && localCache) {
                const now = Date.now();
                sanitizedData.Proyectos.forEach(p => {
                    const id = (p.id_proyecto || "").toString().trim().toUpperCase();
                    const cached = localCache[id];
                    if (cached) {
                        const localTs = cached.ts;
                        const age = now - localTs;
                        const serverTs = p.fecha_estatus ? new Date(p.fecha_estatus).getTime() : 0;
                        if (age < 120000 || (serverTs && serverTs < localTs)) {
                            if (p.status !== cached.status) {
                                p.status = cached.status;
                                p.estado = cached.status;
                                p.estatus = cached.status;
                            }
                        }
                    }
                });
            }
            app.data = sanitizedData;
            return true;
        } catch (e) {
            console.error("[DATA_LOAD_CRITICAL]", e);
            return false;
        }
    },
    switchCompany: async (newId) => {
        console.log(`🔄 Cambiando a inquilino: ${newId}`);

        // 1. Limpieza Agresiva de UI
        const menu = document.getElementById('menu-public');
        if (menu) menu.innerHTML = '';

        const orbitView = document.getElementById('view-orbit');
        if (orbitView) orbitView.classList.add('hidden');

        app.state.companyId = newId;
        app.state.isFood = false;

        const success = await app.loadData();
        if (success) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === newId);
            if (app.ui.applyTheme) app.ui.applyTheme(company);

            window.location.hash = "#home";
            if (app.router && app.router.handleRoute) app.router.handleRoute();

            if (app.ui.updateConsole) app.ui.updateConsole(`TENANT_SWITCH: ${newId}`);
        }
    }
};
