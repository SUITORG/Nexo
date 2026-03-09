/**
 * EVASOL - ROUTER MODULE
 * Responsabilidad: Manejo de navegación por Hash, protección de rutas (RBAC).
 */
app.router = {
    // Glosario Técnico:
    // - **v6.1.0** (2026-03-05): **"Calendar & Reservations Engine"**.
    //     - **Backend:** Integración nativa con Google Calendar API. Creación automática de calendarios por empresa.
    //     - **UI Pública:** Formulario de reservación dinámico y botón condicional en Hero.
    //     - **Staff UI:** Módulo de 'Citas' para gestión administrativa de reservas.
    //     - **Database:** Nueva tabla `Reservaciones` y parámetro `usa_reservaciones` en `Config_Empresas`.
    // - **v6.0.7** (2026-03-05): **"Dynamic Identity & QR Engine"**.
    init: () => {
        window.addEventListener('hashchange', app.router.handleRoute);
        app.router.handleRoute(); // Carga inicial
    },
    navigate: (hash) => {
        window.location.hash = hash;
    },
    handleRoute: () => {
        const hash = window.location.hash || '#orbit';

        console.log(`🧭 Ruta detectada: ${hash}`);
        if (hash === '#orbit') app.state.cameFromOrbit = true;
        // Ocultar todas las secciones antes de mostrar la activa
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        // PROTECCIÓN DE RUTAS (RBAC Lite)
        const protectedRoutes = ['#dashboard', '#leads', '#projects', '#reservations', '#catalog', '#agents', '#knowledge', '#pos', '#staff-pos', '#reports', '#vault'];
        if (protectedRoutes.includes(hash) && !app.state.currentUser) {
            console.warn("🛡️ Acceso denegado: Usuario no autenticado.");
            window.location.hash = '#home';
            return;
        }

        // IDENTITY PROTECTION: Block Hub in WHITE Mode (v6.1.5)
        if (hash === '#orbit') {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const mode = (company?.modo_sitio || "HUB").toString().toUpperCase();

            if (mode === 'WHITE') {
                console.warn("🛡️ Acceso denegado: Hub desactivado para este sitio (MODO WHITE).");
                window.location.hash = '#home';
                return;
            }
        }
        // LÓGICA DE VISIBILIDAD POR HASH
        const viewMap = {
            '#home': 'view-home',
            '#food-app-area': 'view-express',
            '#pillars': 'view-pillars',
            '#contact': 'view-contact',
            '#dashboard': 'view-dashboard',
            '#agents': 'view-agents',
            '#leads': 'view-leads',
            '#projects': 'view-projects',
            '#catalog': 'view-catalog',
            '#orbit': 'view-orbit',
            '#knowledge': 'view-knowledge',
            '#reservations': 'view-reservations',
            '#staff-pos': 'view-staff-pos',
            '#pos': 'view-pos',
            '#reports': 'view-reports',
            '#vault': 'view-vault'
        };
        const targetId = viewMap[hash];
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) el.classList.remove('hidden');
        } else {
            // --- DETECCION DE PAGINAS DINAMICAS (v6.2.0) ---
            const cleanHash = hash.replace('#', '').toLowerCase();
            const isDynamic = (app.data.Config_Paginas || []).some(p =>
                String(p.id_pagina).toLowerCase() === cleanHash &&
                String(p.id_empresa).toUpperCase() === String(app.state.companyId).toUpperCase()
            );

            if (isDynamic) {
                const el = document.getElementById('view-home');
                if (el) el.classList.remove('hidden');
                // Forzar renderizado de home con contexto dinámico
                if (app.ui.renderHome) app.ui.renderHome();
            }
        }

        // LÓGICA ESPECÍFICA POR VISTA
        if (hash === '#home') {
            const foodArea = document.getElementById('food-app-area');
            if (foodArea) foodArea.style.display = 'none';

            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (company && app.ui.renderHome) app.ui.renderHome(company);

            // Force re-render of SEO matrix when returning to Home
            if (app.ui.renderSEO) {
                setTimeout(() => app.ui.renderSEO(), 100);
            }
        }

        if (hash === '#food-app-area') {
            const foodArea = document.getElementById('food-app-area');
            if (foodArea) foodArea.style.display = 'block';
            if (app.ui.renderFoodMenu) app.ui.renderFoodMenu();
        }

        if (hash === '#orbit' && app.ui.renderOrbit) {
            app.ui.renderOrbit();
        }
        if (hash === '#pillars' && app.ui.renderPillars) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (company) app.ui.renderPillars(company);
        }
        if (hash === '#leads' && app.ui.renderLeads) app.ui.renderLeads();
        if (hash === '#projects' && app.ui.renderProjects) app.ui.renderProjects();
        if (hash === '#catalog' && app.ui.renderCatalog) app.ui.renderCatalog();
        if (hash === '#knowledge' && app.ui.renderKnowledge) app.ui.renderKnowledge();
        if (hash === '#reservations' && app.ui.renderReservations) app.ui.renderReservations();
        if (hash === '#staff-pos' && app.ui.renderStaffPOS) app.ui.renderStaffPOS();
        if (hash === '#pos' && app.ui.renderPOS) {
            const user = app.state.currentUser;
            const userRole = (user?.id_rol || user?.rol || "").toString().trim().toUpperCase();
            const deliveryKeywords = ['DELIVERY', 'REPARTIDOR', 'CHOFER', 'DRIVER', 'MOTO', 'RIDER'];
            const isDelivery = deliveryKeywords.some(k => userRole.includes(k));

            if (isDelivery) {
                app.state.posFilter = 'LISTO-ENTREGA';
            }
            app.ui.renderPOS();
        }
        if (hash === '#contact' && app.ui.renderContact) app.ui.renderContact();
        if (hash === '#reports' && app.ui.handleReportTypeChange) app.ui.handleReportTypeChange();
        if (hash === '#vault' && app.vault?.refresh) app.vault.refresh();

        // Control del botón flotante de WhatsApp
        const waFloat = document.getElementById('whatsapp-float');
        if (waFloat) {
            if (hash === '#orbit' || !app.state.companyId) waFloat.classList.add('hidden');
            else waFloat.classList.remove('hidden');
        }
        window.scrollTo(0, 0);
    }
};
