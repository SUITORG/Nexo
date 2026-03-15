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

    scrollGallery: (direction) => app.ui.scrollGalleryBySlot(direction, (window.innerWidth <= 600 ? 1 : (window.innerWidth <= 1024 ? 2 : 4))),

    scrollGalleryBySlot: (direction, visibleSlots) => {
        const grid = document.getElementById('company-gallery-grid');
        if (!grid) return;
        
        const slots = grid.querySelectorAll('.gallery-slot');
        if (slots.length === 0) return;

        const slotWidth = slots[0].offsetWidth;
        const currentScroll = grid.scrollLeft;
        const maxScroll = grid.scrollWidth - grid.clientWidth;

        let targetScroll = currentScroll + (direction * slotWidth);

        // Lógica de loop infinito por slot
        if (targetScroll > maxScroll + 10) {
            targetScroll = 0;
        } else if (targetScroll < -10) {
            targetScroll = maxScroll;
        }

        grid.scrollTo({
            left: targetScroll,
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

        // --- BOTÓN AGENT BROWSER MANUAL (v14.0.3) ---
        app.ui.renderAgentAuditButton();
    },

    renderAgentAuditButton: () => {
        const statusBar = document.querySelector('.sb-right');
        if (!statusBar) return;

        // Eliminar botón previo si existe
        const oldBtn = document.getElementById('sb-ia-audit-btn');
        if (oldBtn) oldBtn.remove();

        const biz = app.data.Config_Empresas.find(c => String(c.id_empresa).toUpperCase() === String(app.state.companyId).toUpperCase());
        const isAgentEnabled = (biz?.agent_enabled || "").toString().toUpperCase() === 'TRUE';
        const isAdmin = app.state.currentUser && app.state.currentUser.nivel_acceso >= 10;

        // Solo mostrar si está habilitado en base de datos y el usuario es ADMIN/DIOS
        if (isAgentEnabled && isAdmin) {
            const btn = document.createElement('span');
            btn.id = 'sb-ia-audit-btn';
            btn.style.cssText = `
                background: var(--primary-color, #034c3c);
                padding: 2px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.65rem;
                font-weight: bold;
                margin-right: 10px;
                border: 1px solid rgba(255,255,255,0.2);
                transition: 0.3s;
                color: #00e676;
            `;
            btn.innerHTML = `<i class="fa-solid fa-robot"></i> AUDIT IA`;
            btn.title = "Lanzar auditoría visual con Agente IA";
            btn.onclick = () => app.ui.triggerAgentAudit();
            
            statusBar.insertBefore(btn, statusBar.firstChild);
        }
    },

    triggerAgentAudit: async () => {
        const btn = document.getElementById('sb-ia-audit-btn');
        if (!btn) return;

        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ENVIANDO...`;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';

        const taskId = await app.createAgentTask('VISION_AUDIT', { url: window.location.href });

        if (taskId) {
            btn.innerHTML = `<i class="fa-solid fa-fire"></i> LANZADO!`;
            btn.style.background = "#00e676";
            btn.style.color = "#000";
            app.ui.updateConsole("AGENT_TASK_CREATED: " + taskId);
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.background = '';
                btn.style.color = '#00e676';
            }, 3000);
        } else {
            btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ERROR`;
            btn.style.background = "#f44";
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.background = '';
            }, 3000);
        }
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

    syncSupabase: async () => {
        app.ui.updateConsole("SUPABASE_SYNCING...");
        const btn = document.getElementById('btn-sync-supabase');
        if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'syncSupabase', id_empresa: app.state.companyId, token: app.apiToken })
            });
            const data = await res.json();
            if (data.success) {
                app.ui.updateConsole("SUPABASE_OK");
                let msg = "✅ Sincronización a Supabase completada.\n\nResultados:\n";
                for (const [table, status] of Object.entries(data.results || {})) {
                    msg += `- ${table}: ${status}\n`;
                }
                alert(msg);
            } else {
                app.ui.updateConsole("SUPABASE_FAIL", true);
                alert("❌ Error al sincronizar: " + (data.error || "Desconocido"));
            }
        } catch (e) {
            app.ui.updateConsole("SUPABASE_CONN_ERR", true);
            alert("Error de red al conectar con Google Apps Script para la sincronización.");
        } finally {
            if(btn) btn.innerHTML = '<i class="fas fa-database"></i> Sincronizar Supabase';
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
