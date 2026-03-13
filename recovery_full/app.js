/**
 * EVASOL - ORCHESTRATOR LEGACY ADAPTER (v4.4.1)
 * Responsabilidad: Mantener compatibilidad con funciones de mantenimiento y monitoreo.
 */
Object.assign(app, {
    // -------------------------------------------------------------------------
    // MAINTENANCE (GOD MODE)
    // -------------------------------------------------------------------------
    maintenance: {
        resetCompany: () => {
            if (!confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará leads y proyectos.")) return;
            app.data.Leads = [];
            if (app.ui.renderLeads) app.ui.renderLeads();
            alert("Sistema reiniciado (Simulación).");
        },
        viewLogs: () => {
            console.table(app.data.Logs || []);
            alert("Logs impresos en consola");
        }
    },
    // -------------------------------------------------------------------------
    // MONITOR (WATCHDOG)
    // -------------------------------------------------------------------------
    monitor: {
        start: () => {
            let syncCounter = 0;
            setInterval(async () => {
                const now = Date.now();
                const diff = (now - app.state.lastActivity) / 1000;

                // --- PUBLIC INACTIVITY RESET (v4.7.2) ---
                // Si es un visitante (sin login) y está inactivo por más de 5 min (300s)
                // lo devolvemos al inicio (Orbit Hub)
                if (!app.state.currentUser && diff > 300) {
                    if (window.location.hash && window.location.hash !== '#orbit') {
                        app.ui.updateConsole("RESET: Inactividad Visitante");
                        window.location.hash = '#orbit';
                        location.reload(); // Hard reload to clear everything
                        return;
                    }
                }

                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const modo = (company && company.modo_creditos) || "USUARIO";
                const timeoutLimit = (modo === "DIARIO" || modo === "GLOBAL") ? 28800 : 120;
                if (app.state.currentUser && diff > timeoutLimit) {
                    app.ui.updateConsole(`TIMEOUT: ${timeoutLimit}s excedido.`, true);
                    alert(`Sesión cerrada por inactividad (${timeoutLimit}s).`);
                    app.auth.logout();
                    return;
                }
                syncCounter++;
                if (syncCounter >= 3) {
                    syncCounter = 0;
                    if (app.state._isUpdatingStatus) return;
                    const success = await app.loadData();
                    if (success) {
                        if (app.ui.updateExternalOrderAlert) app.ui.updateExternalOrderAlert();
                        if (window.location.hash === '#pos' || window.location.hash === '#pos-monitor') {
                            if (app.ui.renderPOS) app.ui.renderPOS();
                        }
                    }
                }
            }, 2500); // Sincronización cada 7.5s (v5.2.5 Optimized)
        }
    }
});
/**
 * Inicialización inicial cuando el DOM esté listo.
 * Nota: app.init está definido en core.js
 */
window.addEventListener('DOMContentLoaded', app.init);
