/**
 * EVASOL - UI GLUE PLAYER (v4.7.0)
 * Responsabilidad: Actuar como capa de compatibilidad y orquestar sub-módulos.
 */
app.ui = {
    // --- CORE SYSTEM UI ---
    updateConsole: (msg, isError = false) => {
        const el = document.getElementById('sb-console');
        const txt = document.getElementById('console-text');
        if (el && txt) {
            txt.innerText = "> " + msg;
            txt.style.color = isError ? "#f44" : "#0f0";
            if (isError) el.classList.add('error');
            else el.classList.remove('error');
        }
        // Log History
        if (!app.state.logHistory) app.state.logHistory = JSON.parse(localStorage.getItem('suit_log_history') || '[]');
        const time = new Date().toLocaleTimeString();
        app.state.logHistory.unshift(`[${time}] ${isError ? 'ERROR: ' : ''}${msg}`);
        if (app.state.logHistory.length > 50) app.state.logHistory.pop();
        localStorage.setItem('suit_log_history', JSON.stringify(app.state.logHistory));

        const panelList = document.getElementById('log-list');
        if (panelList) app.ui.toggleLogs(true);
    },

    scrollGallery: (direction) => {
        const grid = document.getElementById('company-gallery-grid');
        if (!grid) return;
        // Detectar el ancho de la primera tarjeta disponible (o la clase huge)
        const item = grid.querySelector('.gallery-item-huge') || grid.children[0];
        const scrollAmount = item ? (item.offsetWidth + 20) : grid.clientWidth * 0.8;
        grid.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    },

    toggleLogs: (onlyUpdate = false) => {
        let panel = document.getElementById('sys-log-panel');
        if (!panel) return; // Se crea en index.html o dinámicamente si falatara
        if (!onlyUpdate) panel.classList.toggle('hidden');
        if (panel.classList.contains('hidden') && !onlyUpdate) return;

        const list = document.getElementById('log-list');
        if (list) {
            const h = app.state.logHistory || [];
            list.innerHTML = h.map(l => {
                const color = l.includes('ERROR') ? '#f44' : (l.includes('SYNC') ? '#00e676' : '#0f0');
                return `<div style="border-bottom:1px solid #222; padding:4px; color:${color}; line-height:1.4;">${l}</div>`;
            }).join('');
        }
    },

    updateEstandarBarraST: () => {
        const now = new Date();
        const timeEl = document.getElementById('sb-time');
        const dateEl = document.getElementById('sb-date');
        if (dateEl) dateEl.innerText = now.getFullYear().toString().slice(-2) + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
        if (timeEl) timeEl.innerText = `-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

        const user = app.state.currentUser;
        const userSpan = document.getElementById('sb-user');
        const levelSpan = document.getElementById('sb-level');
        if (userSpan) {
            userSpan.innerHTML = user ? `<i class="fa-solid fa-user text-accent"></i> ${user.nombre || 'Personal'}` : `<i class="fa-solid fa-user-secret"></i> Visitante`;
            if (levelSpan) levelSpan.innerText = user ? (user.nivel_acceso || "0") : "0";
        }

        const versionEl = document.getElementById('gs-version-text');
        if (versionEl) versionEl.innerText = `V: ${app.version}`;
    },

    applyTheme: (company) => {
        if (!company) return;
        const bizType = (company?.tipo_negocio || "").toString().toLowerCase();
        const bizId = (company?.id_empresa || "").toString().toUpperCase();
        const keywords = ['alimentos', 'comida', 'restaurante', 'snack', 'food', 'pfm', 'pmp', 'hmp', 'bite'];
        const isFood = keywords.some(k => bizType.includes(k) || bizId.includes(k));
        app.state.isFood = isFood;

        document.title = `${company.nomempresa} | ${isFood ? 'Suit.Bite' : 'Suit.Org'}`;
        document.getElementById('header-title').innerText = company.nomempresa;

        const logoValue = company.logo_url || company.url_logo;
        if (logoValue) {
            const fixed = app.utils.fixDriveUrl(logoValue);
            const el = document.getElementById('header-logo');
            if (el) {
                el.src = fixed;
                document.getElementById('logo-container')?.classList.remove('hidden');
                // Detección Marca Personal (Circular) v5.7.6
                if (bizId.includes('ROBERTO')) {
                    el.classList.add('personal-brand-logo');
                } else {
                    el.classList.remove('personal-brand-logo');
                }
            }
        }

        if (company.color_tema) document.documentElement.style.setProperty('--primary-color', company.color_tema);

        // Delegate Public Rendering (v6.5.3 Secured)
        if (app.public) {
            if (app.public.renderHome) app.public.renderHome(company);
            if (app.public.renderGallery) app.public.renderGallery();
            if (app.public.renderSEO) app.public.renderSEO();
            if (app.public.renderFooter) app.public.renderFooter(company);
        }
    },

    // --- BRIDGES (Compatibility with Router/App) ---
    renderPOS: () => app.pos.renderPOS(),
    renderStaffPOS: () => app.pos.renderStaffPOS(),
    filterPOS: (status) => app.pos.filterPOS(status),
    updateExternalOrderAlert: () => app.pos.updateExternalOrderAlert(),

    renderLeads: () => app.admin.renderLeads(),
    openLeadModal: (id) => app.admin.openLeadModal(id),
    saveLead: (e) => app.admin.saveLead(e),
    deleteLead: (id) => app.admin.deleteLead(id),

    renderProjects: () => app.admin.renderProjects(),
    openProjectModal: () => app.admin.openProjectModal(),
    saveProject: (e) => app.admin.saveProject(e),
    openProjectDetails: (id) => app.admin.openProjectDetails(id),
    deleteProject: (id) => app.admin.deleteProject(id),
    addProjectStage: (id) => app.admin.addProjectStage(id),
    toggleStage: (id, name, done) => app.admin.toggleStage(id, name, done),
    addProjectPayment: (id) => app.admin.addProjectPayment(id),
    addProjectManualLog: (id) => app.admin.addProjectManualLog(id),

    renderCatalog: () => app.admin.renderCatalog(),
    openProductModal: (id) => app.admin.openProductModal(id),
    saveProduct: (e) => app.admin.saveProduct(e),
    deleteProduct: (id, name) => app.admin.deleteProduct(id, name),
    editProductStock: (id) => app.admin.editProductStock(id),

    renderKnowledge: () => app.admin.renderKnowledge(),
    saveKnowledgeManual: (e) => app.admin.saveKnowledgeManual(e),
    syncKnowledge: () => app.admin.syncKnowledge(),

    renderQuotas: () => app.admin.renderQuotas(),
    renderDashboard: () => app.admin.renderDashboard(),
    renderReport: () => app.admin.renderReport(),
    handleReportTypeChange: () => app.admin.handleReportTypeChange(),
    setReportMode: (m) => app.admin.setReportMode(m),
    selectReportType: (t, b) => app.admin.selectReportType(t, b),
    exportReport: (fmt) => app.admin.exportReport(fmt),
    renderBusinessDashboard: () => app.admin.renderBusinessDashboard(),

    renderReservations: () => {
        const container = document.getElementById('view-reservations');
        if (!container) return;
        const data = app.data.Reservaciones || [];
        const coId = app.state.companyId;

        container.innerHTML = `
            <div class="admin-header">
                <h2><i class="fas fa-calendar-alt"></i> Control de Citas</h2>
                <p>Gestiona las reservaciones del sitio web.</p>
            </div>
            <div class="table-container shadow-premium">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Fecha/Hora</th>
                            <th>Cliente</th>
                            <th>WhatsApp</th>
                            <th>Servicio</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.filter(r => r.id_empresa === coId).map(r => {
            const fecha = r.fecha_cita ? r.fecha_cita.toString().replace('T', ' ') : 'Pendiente';
            return `
                                <tr>
                                    <td><b>${fecha}</b></td>
                                    <td>${r.nombre_cliente || 'N/A'}</td>
                                    <td><a href="https://wa.me/${r.whatsapp || ''}" target="_blank">${r.whatsapp || 'Sin Tel'}</a></td>
                                    <td><span class="badge-accent">${r.servicio || 'General'}</span></td>
                                    <td><span class="status-pill ${(r.status || 'PENDIENTE').toLowerCase()}">${r.status || 'PENDIENTE'}</span></td>
                                </tr>
                            `;
        }).join('') || '<tr><td colspan="5">No hay citas registradas.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    },

    // --- PUBLIC BRIDGE ---
    renderOrbit: () => app.public.renderOrbit(),
    renderPillars: (c) => app.public.renderPillars(c),
    renderFoodMenu: () => app.public.renderFoodMenu(),
    renderSEO: () => app.public.renderSEO(),
    renderHome: (c) => app.public.renderHome(c),
    renderGallery: () => app.public.renderGallery(),
    renderFooter: (c) => app.public.renderFooter(c),
    showAboutUs: () => app.public.showAboutUs(),
    showPolicies: () => app.public.showPolicies(),
    showReviews: () => app.public.showReviews(),
    showLocation: () => app.public.showLocation(),
    closeInfoModal: (id) => app.public.closeInfoModal(id),
    renderContact: () => app.public.renderContact(),

    // --- AGENTS BRIDGE ---
    openAgentsModal: () => app.agents.openAgentsModal(),

    // --- POS EXTRA BRIDGE ---
    printTicket: (o, c) => app.pos.printTicket(o, c),
    setPublicPaymentMethod: (m) => app.pos.setPublicPaymentMethod(m),
    setPosPaymentMethod: (m) => app.pos.setPosPaymentMethod(m),
    toggleMobileTicket: (s) => app.public.toggleMobileTicket(s),

    syncTopLuxDrive: async () => {
        app.ui.updateConsole("DRIVE_SYNCING...");
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'syncDrive', token: app.apiToken })
            });
            const data = await res.json();
            if (data.success) {
                app.ui.updateConsole("DRIVE_OK");
                alert("✅ Estructura de Google Drive sincronizada correctamente.");
            } else {
                app.ui.updateConsole("DRIVE_FAIL", true);
                alert("❌ Error: " + data.message);
            }
        } catch (e) {
            app.ui.updateConsole("DRIVE_CONN_ERR", true);
            alert("Error de conexión al sincronizar Drive.");
        }
    },

    refreshData: async (v) => {
        app.ui.updateConsole(`SYNC_${v || 'ALL'}`);
        await app.loadData();
        if (v === 'leads') app.admin.renderLeads();
        else if (v === 'projects') app.admin.renderProjects();
        else if (v === 'catalog') app.admin.renderCatalog();
        else {
            app.admin.renderLeads();
            app.admin.renderProjects();
            app.admin.renderCatalog();
        }
    },

    // --- SHARED MODALS ---
    showLogin: () => app.auth.showLogin(),
    showOtpEntry: (i, s, c) => app.pos.showOtpEntry(i, s, c),
    verifyOtp: () => app.pos.verifyOtp(),
    closeOtpModal: () => app.pos.closeOtpModal(),

    // --- UTILS ---
    fileToBase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = e => reject(e);
    }),

    bindEvents: () => {
        if (app.events?.init) app.events.init();
    }
};
