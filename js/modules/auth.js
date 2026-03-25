/**
 * EVASOL - AUTH MODULE
 * Responsabilidad: Gestión de sesiones, login, logout y lógica de créditos.
 */
app.auth = {
    login: (userOrEmail, password) => {
        console.log("🔑 Intentando login para:", userOrEmail);
        const userOrEmailClean = (userOrEmail || "").toString().trim().toLowerCase();
        const getVal = (obj, keys) => {
            const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
            return foundKey ? (obj[foundKey] || "").toString().trim() : "";
        };
        const user = (app.data.Usuarios || []).find(u => {
            const email = getVal(u, ['email', 'correo', 'mail']);
            const username = getVal(u, ['username', 'usuario', 'user', 'login']);
            const nombre = getVal(u, ['nombre', 'name', 'full_name']);
            const uCoId = getVal(u, ['id_empresa', 'empresa', 'company']).toUpperCase();
            const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();

            // v5.2.6: Estabilidad de Identidad
            const matchId = (email.toLowerCase() === userOrEmailClean ||
                username.toLowerCase() === userOrEmailClean ||
                nombre.toLowerCase() === userOrEmailClean);

            // Permite login si la empresa coincide o el usuario es Global (DIOS)
            const matchCo = (uCoId === sCoId || uCoId === "GLOBAL");
            return matchId && matchCo;
        });
        if (!user) {
            // v4.7.7: Warning específico para Hub vs Empresa
            const existsAnywhere = (app.data.Usuarios || []).some(u => {
                const email = getVal(u, ['email', 'correo', 'mail']);
                const username = getVal(u, ['username', 'usuario', 'user', 'login']);
                return (email.toLowerCase() === userOrEmailClean || username.toLowerCase() === userOrEmailClean);
            });
            if (existsAnywhere) return { success: false, msg: "⚠️ Usuario existe pero no está asignado a esta empresa o sección." };
            return { success: false, msg: "❌ Usuario no encontrado." };
        }

        const sheetPass = getVal(user, ['password', 'contraseña', 'pass', 'clave']);
        if (sheetPass !== (password || "").toString().trim()) {
            return { success: false, msg: "❌ Contraseña incorrecta." };
        }

        // v4.7.7: Validación de Vigencia (Estandar #5)
        const fechaLimiteStr = getVal(user, ['fecha_limite_acceso', 'limite', 'expira']);
        if (fechaLimiteStr) {
            const limite = new Date(fechaLimiteStr);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (limite < hoy) {
                console.warn("🚫 Acceso denegado: Licencia/Vigencia expirada el", fechaLimiteStr);
                return { success: false, msg: `⚠️ ACCESO EXPIRADO (${fechaLimiteStr}). Contacte a soporte.` };
            }
        }
        // Resolución de permisos
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const origenPoliticas = (company && company.origen_politicas) || "ROL";
        const modoCreditos = (company && company.modo_creditos) || "USUARIO";
        let effectiveLevel = parseInt(getVal(user, ['nivel_acceso', 'nivel', 'access_level'])) || 0;
        let effectiveModules = "";
        let effectiveCredits = parseInt(getVal(user, ['creditos', 'credits'])) || 0;
        if (origenPoliticas === "ROL" && app.data.Config_Roles) {
            const uRoleId = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
            const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();
            const roleData = app.data.Config_Roles.find(r => {
                const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
                const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
                return rRoleId === uRoleId && (rCoId === sCoId || rCoId === "GLOBAL");
            });
            if (roleData) {
                effectiveLevel = parseInt(getVal(roleData, ['nivel_acceso', 'nivel'])) || effectiveLevel;
                effectiveModules = getVal(roleData, ['modulos_visibles', 'permisos', 'modulos']);
                if (modoCreditos !== "GLOBAL") effectiveCredits = parseInt(getVal(roleData, ['creditos_base', 'creditos'])) || 0;
            }
        }
        user.nivel_acceso = effectiveLevel;
        user.modulos_visibles = effectiveModules;
        // LOGIN EXITOSO
        app.state.currentUser = user;
        if (app.auth.setLoggedInState) app.auth.setLoggedInState(user);
        window.location.hash = "#dashboard";
        return { success: true };
    },
    logout: () => {
        const currentBizId = app.state.companyId;
        console.log("🚪 Cerrando sesión para:", currentBizId);
        app.state.currentUser = null;
        if (app.auth.setLoggedOutState) app.auth.setLoggedOutState();
        
        // v16.5.3: El redireccionado a #home ahora se asegura de que el hash cambie limpiamente
        window.location.hash = "#home";
        if (app.router && app.router.handleRoute) app.router.handleRoute();
    },
    showLogin: () => {
        const modal = document.getElementById('login-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            const userIn = document.getElementById('login-user');
            if (userIn) userIn.focus();
        }
    },
    setLoggedInState: (user) => {
        const getVal = (obj, keys) => {
            const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
            return foundKey ? (obj[foundKey] || "").toString().trim() : "";
        };
        // Estandarización de Rol en Memoria (v4.7.5)
        user.id_rol = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
        user.nivel_acceso = parseInt(getVal(user, ['nivel_acceso', 'nivel', 'access_level'])) || 0;

        document.getElementById('status-bar').classList.remove('hidden');
        if (app.ui && app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
        document.getElementById('menu-public').classList.add('hidden');
        document.getElementById('menu-staff').classList.remove('hidden');
        document.getElementById('login-modal-overlay').classList.add('hidden');
        document.getElementById('main-footer')?.classList.add('hidden');
        document.getElementById('whatsapp-float')?.classList.add('hidden');

        // Dynamic Menu Filtering (RBAC)
        const userRole = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
        const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();

        const roleConfig = (app.data.Config_Roles || []).find(r => {
            const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
            const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
            return rRoleId === userRole && (rCoId === sCoId || rCoId === "GLOBAL");
        });

        const visibleModulesRaw = (roleConfig?.modulos_visibles || user.modulos_visibles || "").toLowerCase();
        const modulesArray = visibleModulesRaw.split(/[\s,;]+/).map(m => m.replace('#', '').trim()).filter(m => m !== "");
        app.state.visibleModules = modulesArray;

        let isAdmin = parseInt(user.nivel_acceso) >= 10 || userRole === 'DIOS';
        let isStaff = parseInt(user.nivel_acceso) >= 2 || userRole === 'DIOS';
        const isDelivery = userRole === 'DELIVERY' || userRole === 'REPARTIDOR';

        const menuItems = document.querySelectorAll('#menu-staff li');
        menuItems.forEach(li => {
            const link = li.querySelector('a');
            if (!link || link.id === 'btn-logout' || link.getAttribute('href') === '#logout') return;
            const targetHash = (link.getAttribute('href') || "").toLowerCase();
            const targetBase = targetHash.replace('#', '');

            const isExplicitlyAllowed = modulesArray.includes(targetBase);
            const isCorePage = targetBase === "dashboard" || targetBase === "home";
            const isVault = targetBase === "vault";
            let isAllowed = isAdmin || isExplicitlyAllowed || isCorePage || (isVault && level >= 1);

            if (isDelivery) {
                isAllowed = (targetBase === "pos");
            } else if (!isAllowed && modulesArray.length === 0) {
                isAllowed = isStaff && (targetBase === "pos" || targetBase === "leads" || targetBase === "projects" || targetBase === "catalog");
            }

            if (isAllowed) li.classList.remove('hidden');
            else li.classList.add('hidden');
        });

        const sbIndicator = document.getElementById('sb-indicator');
        if (sbIndicator && isStaff) {
            sbIndicator.innerHTML = `<a href="#pos" style="color:inherit; text-decoration:none;"><i class="fas fa-desktop"></i> MONITOR</a>`;
        }

        // Dashboard Values
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const isGlobal = (company && company.modo_creditos) === "GLOBAL";

        const dashView = document.getElementById('view-dashboard');
        if (dashView) {
            const dashModules = dashView.querySelectorAll('.feature-card');
            dashModules.forEach(card => {
                const btn = card.querySelector('button');
                const onclickStr = btn?.getAttribute('onclick') || "";
                const match = onclickStr.match(/#([a-z-]+)/);
                const targetHash = match ? `#${match[1]}` : "";
                const targetBase = targetHash.replace('#', '').toLowerCase();
                if (isAdmin || modulesArray.includes(targetBase) || targetBase === "dashboard" || targetBase === "home") {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }
        const dashCredits = document.getElementById('dash-credits');
        if (dashCredits) dashCredits.innerText = isGlobal ? (company.creditos_totales || 0) : user.creditos;
        const dashCreditMode = document.getElementById('dash-credit-mode');
        if (dashCreditMode) dashCreditMode.innerText = isGlobal ? "Pool Global de Empresa" : "Créditos Personales";
        const dashLeads = document.getElementById('dash-leads');
        if (dashLeads) dashLeads.innerText = app.data.Leads ? app.data.Leads.length : 0;

        // Dynamic Agents Button - Granular RBAC
        const level = parseInt(user.nivel_acceso) || 0;
        const isGod = user.rol === 'DIOS' || level >= 10;
        const canMaintain = isGod || level >= 9 || modulesArray.includes('mantenimiento');
        const hasAIAccess = isGod || (level >= 5 && (modulesArray.includes('agents') || modulesArray.includes('knowledge')));
        const godTools = document.getElementById('god-tools');
        if (godTools) {
            if (hasAIAccess || canMaintain) {
                godTools.classList.remove('hidden');
                godTools.querySelector('h3').innerText = user.rol === 'DIOS' ? 'GOD MODE' : 'HERRAMIENTAS IA';
                const btnMnt = document.getElementById('btn-dash-maintenance');
                const btnAgt = document.getElementById('btn-dash-agents');
                if (btnMnt) canMaintain ? btnMnt.classList.remove('hidden') : btnMnt.classList.add('hidden');
                if (btnAgt) hasAIAccess ? btnAgt.classList.remove('hidden') : btnAgt.classList.add('hidden');
            } else {
                godTools.classList.add('hidden');
            }
        }

        // GATED ACTION BUTTONS
        const isSenior = isGod || level >= 8 || modulesArray.includes('projects');
        const isJunior = isGod || level >= 7 || modulesArray.includes('leads');
        const btnLead = document.getElementById('btn-show-lead-modal');
        if (btnLead) isJunior ? btnLead.classList.remove('hidden') : btnLead.classList.add('hidden');
        const btnProject = document.getElementById('btn-show-project-modal');
        if (btnProject) isSenior ? btnProject.classList.remove('hidden') : btnProject.classList.add('hidden');
        const btnProduct = document.getElementById('btn-show-product-modal');
        if (btnProduct) (isSenior || modulesArray.includes('catalog_add')) ? btnProduct.classList.remove('hidden') : btnProduct.classList.add('hidden');
        const btnSync = document.getElementById('btn-sync-drive');
        if (btnSync) isSenior ? btnSync.classList.remove('hidden') : btnSync.classList.add('hidden');

        const mntTools = document.getElementById('admin-maintenance-tools');
        if (mntTools) {
            if (canMaintain) {
                mntTools.classList.remove('hidden');
                const isSystemAdmin = user.rol === 'DIOS' || parseInt(user.nivel_acceso) >= 10;
                const btnRepair = document.getElementById('admin-tool-repair-db');
                const btnLogs = document.getElementById('admin-tool-logs');
                if (btnRepair) isSystemAdmin ? btnRepair.classList.remove('hidden') : btnRepair.classList.add('hidden');
                if (btnLogs) isSystemAdmin ? btnLogs.classList.remove('hidden') : btnLogs.classList.add('hidden');
            } else {
                mntTools.classList.add('hidden');
            }
        }

        const isDeliveryRole = userRole === 'DELIVERY' || (user.nombre || "").toUpperCase().includes('REPARTIDOR');
        const cartBar = document.getElementById('cart-float-bar');
        if (cartBar) {
            if (isDeliveryRole) cartBar.classList.add('hidden');
            else cartBar.classList.remove('hidden');
        }
    },
    setLoggedOutState: () => {
        document.getElementById('sb-user').innerHTML = '<i class="fas fa-user-secret"></i> Visitante';
        const levelSpan = document.getElementById('sb-level');
        if (levelSpan) levelSpan.innerText = "0";
        const indicator = document.getElementById('sb-indicator');
        if (indicator) indicator.innerHTML = `<i class="fas fa-microchip"></i> BS-T:`;
        document.getElementById('menu-public').classList.remove('hidden');
        document.getElementById('menu-staff').classList.add('hidden');
        document.getElementById('god-tools')?.classList.add('hidden');
        document.getElementById('main-footer')?.classList.remove('hidden');
        document.getElementById('whatsapp-float')?.classList.remove('hidden');
        document.getElementById('cart-float-bar')?.classList.remove('hidden');
    }
};
