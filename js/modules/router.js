/**
 * EVASOL - ROUTER MODULE
 * Responsabilidad: Manejo de navegación por Hash, protección de rutas (RBAC).
 */
app.router = {
    init: () => {
        window.addEventListener('hashchange', app.router.handleRoute);
        app.router.handleRoute(); // Carga inicial
    },
    handleRoute: () => {
        const hash = window.location.hash || '#orbit';

        console.log(`🧭 Ruta detectada: ${hash}`);
        // Ocultar todas las secciones antes de mostrar la activa
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        // PROTECCIÓN DE RUTAS (RBAC Lite)
        const protectedRoutes = ['#dashboard', '#leads', '#projects', '#catalog', '#agents', '#knowledge', '#pos', '#staff-pos', '#reports'];
        if (protectedRoutes.includes(hash) && !app.state.currentUser) {
            console.warn("🛡️ Acceso denegado: Usuario no autenticado.");
            window.location.hash = '#home';
            return;
        }

        // IDENTITY PROTECTION: Block Hub in WHITE Mode (v5.3.3)
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
            '#staff-pos': 'view-staff-pos',
            '#pos': 'view-pos',
            '#reports': 'view-reports'
        };
        const targetId = viewMap[hash];
        if (targetId) {
            const el = document.getElementById(targetId);
            if (el) el.classList.remove('hidden');
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

        // Control del botón flotante de WhatsApp
        const waFloat = document.getElementById('whatsapp-float');
        if (waFloat) {
            if (hash === '#orbit' || !app.state.companyId) waFloat.classList.add('hidden');
            else waFloat.classList.remove('hidden');
        }
        window.scrollTo(0, 0);
    }
};
