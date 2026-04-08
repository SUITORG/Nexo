/* SuitOrg Core - Orquestador Maestro (v16.3.8)
 * ---------------------------------------------------------
 * Responsabilidad: Estado Global, Carga de Datos y Ruteo.
 * ---------------------------------------------------------
 */

const app = {
    // 1. CONFIGURACIÓN BASE
    apiUrl: 'https://script.google.com/macros/s/AKfycbzA29wJoxRcHnhyWin2WJKR1_U1oJNVRrKLA3of-aKVOsOxajw-hR4CrEStAFsjtBBF/exec', 
    apiToken: 'PROTON-77-X', // Token Maestro de Orquestación

    // --- CONFIGURACIÓN SUPABASE (v16.7.26 - env-config) ---
    // Valores cargados dinámicamente desde /api/config al arrancar.
    // Fallback: usa SUIT_CONFIG si el servidor no expone el endpoint.
    sbUrl: null,
    sbKey: null,

    // 2. ESTADO GLOBAL (Inmutable en tiempo de ejecución)
    state: {
        version: 'v16.3.8',
        companyId: null,      // Detectado por URL (?id=...)
        dbEngine: 'GSHEETS',  // Fallback seguro
        isLoadingData: false,
        lastSync: null,
        currentUser: null,    // Persistencia de sesión
        userRole: 'PUBLIC',
        accessLevel: 0,
        isIsolated: false     // Modo Privacidad B2B
    },

    // 3. CONTENEDOR DE DATOS (Single Source of Truth)
    data: {
        Config_Auth: [],
        Config_Empresas: [],
        Config_Roles: [],
        Usuarios: [],
        Leads: [],
        Proyectos: [],
        Proyectos_Etapas: [],
        Proyectos_Pagos: [],
        Proyectos_Bitacora: [],
        Config_SEO: [],
        Prompts_IA: [],
        Catalogo: [],
        Logs: [],
        Pagos: [],
        Cuotas_Pagos: [],
        Config_Reportes: [],
        Config_Dashboard: [],
        Config_Flujo_Proyecto: [],
        Config_Galeria: [],
        Config_Paginas: [],
        Empresa_Documentos: [],
        Reservaciones: [],
        Logs_Chat_IA: [],
        Memoria_IA_Snapshots: [],
        Logs_Consultas_SOP: []
    },

    // 4a. CARGA DE CONFIGURACIÓN DESDE SERVIDOR
    loadEnvConfig: async () => {
        try {
            const res = await fetch('/api/config', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const cfg = await res.json();
            if (cfg.sbUrl)  app.sbUrl = cfg.sbUrl;
            if (cfg.sbKey)  app.sbKey = cfg.sbKey;
            console.log('🔑 [ENV] Supabase config cargada desde /api/config');
        } catch (e) {
            // Fallback: usa valores de config.js (SUIT_CONFIG) si existe
            if (typeof SUIT_CONFIG !== 'undefined' && SUIT_CONFIG.sbUrl) {
                app.sbUrl = SUIT_CONFIG.sbUrl;
                app.sbKey = SUIT_CONFIG.sbKey;
                console.warn('⚠️ [ENV] /api/config no disponible, usando fallback de config.js');
            } else {
                console.warn('⚠️ [ENV] Sin config de Supabase. El cliente no se inicializará.');
            }
        }
    },

    // 4b. MOTOR DE INICIALIZACIÓN
    init: async () => {
        try {
            console.log("🚀 Iniciando Orquestador EVASOL...");
            await app.loadEnvConfig(); // ← Carga sbUrl/sbKey antes de todo

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

            // --- INICIALIZACIÓN SUPABASE (v16.7.26) ---
            if (app.sbUrl && app.sbKey && typeof window.supabase !== 'undefined') {
                app.supabase = window.supabase.createClient(app.sbUrl, app.sbKey);
                console.log("🔥 Suitorg Cloud (Supabase) Conectado.");
            } else if (!app.sbUrl || !app.sbKey) {
                console.warn("⚠️ Supabase NO inicializado: faltan sbUrl o sbKey.");
            }

            const loaded = await app.loadData();
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.remove();

            // --- ESPERA DE MÓDULOS (v6.5.3 Blindaje Total) ---
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
                // Determine Principal Context
                const mainBiz = (app.data.Config_Empresas || []).find(c => {
                    const isPri = c.es_principal || c.esprincipal || c.Es_Principal || c.esPrincipal;
                    return String(isPri).toUpperCase() === 'TRUE' || isPri === true || isPri === 1;
                });

                // --- REDIRECCIONADOR MAESTRO (v6.3.0) ---
                let company = app.data.Config_Empresas.find(c =>
                    String(c.id_empresa).toUpperCase() === String(app.state.companyId).toUpperCase() ||
                    (c.alias_seo && String(c.alias_seo).toLowerCase() === String(app.state.companyId).toLowerCase())
                );

                if (company && company.alias_seo && String(company.alias_seo).toLowerCase() === String(app.state.companyId).toLowerCase()) {
                    app.state.companyId = company.id_empresa;
                }

                const hasUrlParam = !!coParam;

                if (!hasUrlParam && mainBiz) {
                    const currentHash = window.location.hash;
                    if (!currentHash || currentHash === "" || currentHash === "#orbit") {
                        const mode = (mainBiz.modo_sitio || 'HUB').toString().toUpperCase();
                        if (mode !== 'HUB') {
                            app.state.companyId = mainBiz.id_empresa;
                            company = mainBiz;
                            window.location.hash = '#home';
                        }
                    }
                }

                const isHubMode = (window.location.hash === '#orbit' || (!window.location.hash && !hasUrlParam && !mainBiz)) && !hasUrlParam;

                if (isHubMode) {
                    app.state.companyId = null;
                    window.location.hash = '#orbit';
                    if (app.public && app.public.renderOrbit) app.public.renderOrbit();
                    company = null;
                } else if (!company && hasUrlParam) {
                    app.state.companyId = coParam.trim().toUpperCase();
                } else if (!company && !hasUrlParam) {
                    company = app.data.Config_Empresas[0];
                    if (company) app.state.companyId = company.id_empresa;
                }

                if (company) {
                    app.state.dbEngine = company.db_engine || company.dbengine || 'GSHEETS';
                    if (app.ui && app.ui.applyTheme) app.ui.applyTheme(company);
                }

                if (app.router && app.router.handleRoute) app.router.handleRoute();
                if (app.ui && app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
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

    // 5. CARGA DE DATOS (Mecanismo Resiliente)
    loadData: async () => {
        if (app.state.isLoadingData) {
            console.warn("🛡️ [CORTAFUEGOS] Petición duplicada bloqueada.");
            return false;
        }
        
        app.state.isLoadingData = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const fetchId = app.state.companyId || "SuitOrg";
const url = `${app.apiUrl}?action=getAll&id_empresa=${fetchId}&token=${app.apiToken}&t=${Date.now()}`;

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
            
            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (jsonErr) {
                throw new Error("Respuesta del servidor corrupta.");
            }

            if (data.status === 'ERROR' || data.error) throw new Error(data.message || data.error);
            app.state.isLoadingData = false;

            const sanitizedData = JSON.parse(JSON.stringify(data), (key, value) =>
                typeof value === 'string' ? app.utils.sanitizeString(value) : value
            );

            // Log de origen del backend si está disponible
            if (sanitizedData.backend_log) {
                console.log("📊 [BACKEND_SYNC] Origen de Datos:", sanitizedData.backend_log);
            }

            app.data = sanitizedData;
            return true;
        } catch (e) {
            app.state.isLoadingData = false;
            console.error("[DATA_LOAD_CRITICAL]", e);
            // DIAGNÓSTICO DETALLADO PARA EL USUARIO:
            console.error("DIAGNOSTICO_FAIL_DETALLADO:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
            return false;
        }
    },

    switchCompany: async (newId) => {
        const loader = document.getElementById('transition-loader');
        if (loader) loader.classList.remove('hidden');
        
        app.state.companyId = newId.trim().toUpperCase();
        const success = await app.loadData();
        
        if (success) {
            const company = app.data.Config_Empresas.find(c => String(c.id_empresa).toUpperCase() === app.state.companyId);
            if (company) {
                app.state.dbEngine = company.db_engine || 'GSHEETS';
                if (app.ui && app.ui.applyTheme) app.ui.applyTheme(company);
            }
            if (app.router && app.router.handleRoute) app.router.handleRoute();
            if (app.ui && app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
        }
        
        if (loader) loader.classList.add('hidden');
    },

    checkBackendVersion: () => {
        if (app.data && app.data.version) {
            console.log(`📡 Backend Version: ${app.data.version} | UI Version: ${app.state.version}`);
            const verEl = document.getElementById('st-version');
            if (verEl) verEl.innerText = `V: ${app.state.version} ${app.data.version}`;
        }
    },

    utils: {
        sanitizeString: (str) => {
            if (!str || typeof str !== 'string') return str;
            return str
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
                .trim();
        }
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
