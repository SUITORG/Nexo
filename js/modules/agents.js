/* SuitOrg Agents Controller - v15.8.9
 * ---------------------------------------------------------
 * Sincronización: 2026-03-21 10:28 AM (v15.8.9 Cerebral Sync)
 * ---------------------------------------------------------
 */
app.agents = {
    getVisitorId: () => {
        // v16.4.2: Session Isolation for Admin vs User Context
        const user = app.state.currentUser;
        if (user && (user.nivel_acceso >= 10 || user.id_rol === 'DIOS')) {
            return 'ADMIN-' + (user.username || 'SUDO');
        }

        let vid = localStorage.getItem('suit_visitor_id');
        if (!vid) {
            vid = 'VISIT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem('suit_visitor_id', vid);
        }
        return vid;
    },
    run: (agentName) => {
        const box = document.getElementById('agent-output-box');
        const output = document.getElementById('agent-response');
        const title = document.getElementById('agent-title');
        box.classList.remove('hidden');
        title.innerText = `⏳ ${agentName} pensando...`;
        output.value = "Conectando con la red neuronal de EVASOL...";
        setTimeout(() => {
            title.innerText = `✅ Respuesta del ${agentName}`;
            let response = "";
            const leads = app.data.Leads.length;
            const projs = app.data.Proyectos.length;
            const docs = app.data.Empresa_Documentos.length;
            if (agentName === 'Escritor') {
                response = `[BORRADOR GENERADO]\n\nBasado en la estructura de EVASOL y los ${docs} documentos sincronizados, estoy listo para redactar.`;
            } else if (agentName === 'Analista') {
                response = `[ANÁLISIS DE DATOS REAL]\n\n📊 Resumen de Operaciones:\n- Leads: ${leads}\n- Proyectos: ${projs}\n- Base de Conocimiento: ${docs} archivos.`;
            } else if (agentName === 'Marketing') {
                response = `[ESTRATEGIA]\n\nUsando el nombre "${app.state.companyId}", podemos lanzar una campaña resaltando nuestros ${projs} proyectos exitosos.`;
            } else if (agentName === 'Negocio') {
                response = `[INTELIGENCIA DE NEGOCIO]\n\nDetecto ${docs} documentos. Si sincronizas el 'Acta Constitutiva', podré detallar la estructura legal.`;
            }
            output.value = response;
        }, 1000);
    },
    select: async (agtId) => {
        const agt = (app.data.Prompts_IA || []).find(a => a.id_agente === agtId);
        if (!agt) {
            console.error(`AGENT_NOT_FOUND: ${agtId}. Please run Repair DB in Maintenance.`);
            if (agtId === 'AGT-001') {
                alert("El sistema de soporte se está inicializando. Por favor, asegúrate de haber 'Reparado la Base de Datos' en el panel de Staff.");
            }
            return;
        }
        app.state.currentAgent = agt;
        // --- SISTEMA DE MEMORIA PERSISTENTE BACKEND (v15.8.7) ---
        const vid = app.agents.getVisitorId();
        const agtIdLocal = agtId;
        
        // Mostrar Loading mientras recuperamos info
        const historyDiv = document.getElementById('chat-history');
        if (historyDiv) historyDiv.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fas fa-spinner fa-spin"></i> Recuperando memoria...</div>';

        // Intentar recuperar memoria del Backend (Sheets/Supabase)
        const res = await app.agents.fetchMemory(vid, agtIdLocal);

        historyDiv.innerHTML = ''; // Limpiar
        
        if (res && res.history && res.history.length > 0) {
            app.state.chatHistory = res.history.map(h => ({ role: h.role, content: h.content }));
            app.state.currentConvId = res.memory.id_conversacion;

            const recoveryNotice = document.createElement('div');
            recoveryNotice.innerHTML = `<i class="fas fa-cloud"></i> Sesión recuperada de la nube (ID: ${app.state.currentConvId})`;
            recoveryNotice.className = "ai-msg";
            recoveryNotice.style.cssText = "background:rgba(0,0,0,0.05); font-size:0.7rem; color:var(--primary-color); padding:5px 10px; border-radius:10px; border:none; width:fit-content; margin:0 auto 10px auto; opacity:0.8;";
            historyDiv.appendChild(recoveryNotice);

            app.state.chatHistory.forEach(h => {
                const roleId = h.role === 'user' ? 'user' : 'ai';
                app.agents.addMessageToUI(roleId, h.content, true);
            });
            historyDiv.scrollTop = historyDiv.scrollHeight;
        } else {
            app.state.chatHistory = [];
            app.state.currentConvId = 'CHAT-' + Date.now().toString(36).toUpperCase();
            
            historyDiv.innerHTML = `
                <div class="ai-msg" style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-color); max-width: 80%; align-self: flex-start; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    Hola, soy tu <b>${agt.nombre}</b>. ¿En qué puedo apoyarte hoy?
                </div>
            `;
        }
        
        // Si tenemos un resumen previo, saludar con contexto
        if (res && res.memory && res.memory.resumen_semantico) {
            setTimeout(() => {
                app.agents.addMessageToUI('ai', `¡Hola de nuevo! Recordando nuestra plática anterior: <i>"${res.memory.resumen_semantico}"</i>. ¿Cómo va todo con eso?`);
            }, 800);
        }

        // Monitor de inactividad específico para el chat
        app.state._lastChatActivity = Date.now();
        if (app.state._chatTimer) clearInterval(app.state._chatTimer);
        app.state._chatTimer = setInterval(() => {
            if (!app.state.currentAgent) {
                clearInterval(app.state._chatTimer);
                return;
            }
            const idleSeconds = (Date.now() - app.state._lastChatActivity) / 1000;
            if (idleSeconds > 180) { // 3 minutos
                if (app.state.currentAgent) {
                    app.agents.addMessageToUI('ai', `Sesión pausada por inactividad. Estaré aquí si necesitas algo más.`);
                    app.agents.closeChat();
                }
            }
        }, 10000);

        document.getElementById('agent-display-name').innerText = agt.nombre;
        document.getElementById('ai-chat-modal').classList.remove('hidden');
    },

    fetchMemory: async (vid, agtId = null) => {
        try {
            const user = app.state.currentUser || {};
            const body = {
                action: 'getAiMemory',
                id_visitante: vid,
                id_empresa: app.state.companyId,
                nombre: user.nombre,
                telefono: user.telefono || user.whatsapp,
                token: app.apiToken
            };
            
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            return data.success ? { memory: data.memory, history: data.history } : null;
        } catch (e) { console.error("Memory fetch failed:", e); return null; }
    },

    saveMemory: async (vid, resumen, contextData = {}) => {
        try {
            const body = {
                action: 'saveAiMemory',
                id_conversacion: app.state.currentConvId,
                id_visitante: vid,
                id_empresa: app.state.companyId,
                resumen: resumen,
                contexto: contextData,
                agente_id: app.state.currentAgent?.id_agente,
                token: app.apiToken
            };

            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(body)
            });
        } catch (e) { console.error("Memory save failed:", e); }
    },

    logInteraction: async (role, content) => {
        try {
            const body = {
                action: 'saveAiConversation',
                id_conversacion: app.state.currentConvId,
                id_visitante: app.agents.getVisitorId(),
                id_empresa: app.state.companyId,
                agente_id: app.state.currentAgent?.id_agente,
                role: role,
                content: content,
                token: app.apiToken
            };
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(body)
            });
        } catch (e) { console.error("IA Log failed:", e); }
    },

    closeChat: () => {
        document.getElementById('ai-chat-modal').classList.add('hidden');
        // app.state.currentAgent = null; // Mantenemos el agente cargado para persistencia de sesión
    },
    handleFileUpload: async (input) => {
        if (input.files && input.files[0]) {
            app.state.chatFileBuffer = await app.ui.fileToBase64(input.files[0]);
            const btn = document.getElementById('btn-attach-chat');
            btn.innerHTML = '<i class="fas fa-check" style="color:green;"></i>';
            // Auto focus back to input
            document.getElementById('chat-user-input').focus();
        }
    },
    diagnoseAi: async () => {
        app.ui.updateConsole("AI_DIAGNOSING...");
        
        // --- ANIMACIÓN DE BOTÓN (v15.8.1) ---
        const btn = document.querySelector('button[onclick="app.agents.diagnoseAi()"]');
        const originalHtml = btn ? btn.innerHTML : '<i class="fas fa-stethoscope"></i> Diagnosticar IA';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ESCANEANDO...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
        }

        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'listAiModels', token: app.apiToken })
            });
            const data = await res.json();
            if (data.success) {
                const models = data.models || [];
                let best = null;
                app.ui.updateConsole(`SCANNING ${models.length} MODELS...`);

                // Stress Test: Intentar hablar con cada uno
                for (let m of models) {
                    if (!m.includes('flash') && !m.includes('pro')) continue; // Ignorar embeddings o experimentales
                    app.ui.updateConsole(`TRYING: ${m}...`);
                    try {
                        const testRes = await fetch(app.apiUrl, {
                            method: 'POST',
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({
                                action: 'askGemini',
                                message: 'ping',
                                model: m,
                                token: app.apiToken
                            })
                        });
                        const testData = await testRes.json();
                        if (testData.success && !testData.error) {
                            best = m;
                            break; // Encontramos el ganador
                        }
                    } catch (e) { console.warn(`Model ${m} failed test.`); }
                }

                if (best) {
                    app.state._aiModel = best;
                    localStorage.setItem('evasol_ai_model', best);
                    alert(`✅ DIAGNÓSTICO MAESTRO FINALIZADO.\n\nEl modelo "${best}" es 100% compatible con tu cuenta de Google.\n\nConfiguración activada y guardada.`);
                    app.ui.updateConsole("AI_READY");
                } else {
                    alert("❌ Error: Se detectaron modelos pero ninguno respondió al test. Revisa tu GEMINI_API_KEY o cuotas en Google Console.");
                    app.ui.updateConsole("AI_FAIL", true);
                }
            } else {
                alert("❌ Error de Diagnóstico: " + data.error);
                app.ui.updateConsole("AI_FAIL", true);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al diagnosticar IA.");
        } finally {
            if (btn) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        }
    },
    sendMessage: async () => {
        const input = document.getElementById('chat-user-input');
        const text = input.value.trim();
        if (!text || !app.state.currentAgent) return;
        // 1. Add User Message to UI & Persist
        app.agents.addMessageToUI('user', text);
        app.agents.logInteraction('user', text);
        input.value = '';
        app.state._lastChatActivity = Date.now();
        // 2. Prepare History for AI
        app.state.chatHistory.push({ role: 'user', content: text });
        // 3. Show Loading
        document.getElementById('ai-loading').classList.remove('hidden');
        document.getElementById('btn-send-chat').disabled = true;
        app.ui.updateConsole("AI_PROCESSING...");
        try {
            // --- INYECTOR DE CONTEXTO MAESTRO (v16.5.0) ---
            // Se elimina la dependencia de NotebookLM para favorecer la estabilidad 100% local (Excel-Driven)
            const action = 'askGemini'; 

            // --- DETECCIÓN DE ESTATUS CRM (v16.5.0) ---
            const vid = app.agents.getVisitorId();
            const currentLead = (app.data.Leads || []).find(l => l.id_visitante === vid || (app.state.currentUser && l.telefono === app.state.currentUser.telefono));
            let crmContext = "";
            if (currentLead) {
                const missingFields = [];
                if (!currentLead.email) missingFields.push("Email");
                if (!currentLead.direccion) missingFields.push("Dirección");
                if (missingFields.length > 0) {
                    crmContext = `\n\n[SISTEMA CRM]: El usuario ya es un LEAD (${currentLead.id_lead}). Falta capturar: ${missingFields.join(', ')}. Tu misión es obtener estos datos sutilmente.`;
                }
            }

            // 4. Call Backend Proxy
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: action,
                    id_empresa: app.state.companyId || 'SYSTEM',
                    usuario: app.state.currentUser ? app.state.currentUser.nombre : 'Visitante',
                    agentId: app.state.currentAgent.id_agente,
                    promptBase: app.state.currentAgent.prompt_base + crmContext,
                    history: app.state.chatHistory,
                    message: text,
                    model: app.state._aiModel || localStorage.getItem('evasol_ai_model') || "gemini-1.5-flash",
                    token: app.apiToken
                })
            });
            const data = await response.json();
            if (data.success) {
                app.agents.addMessageToUI('ai', data.answer);
                app.state.chatHistory.push({ role: 'model', content: data.answer });
                
                // Persistencia de Respuesta
                app.agents.logInteraction('model', data.answer);

                // --- DETECCIÓN DE DATOS PARA MEMORIA SEMÁNTICA (v15.8.9) ---
                const lowerText = text.toLowerCase();
                const possiblePhone = text.match(/\d{8,10}/);
                const interestKeywords = ["asesoria", "pension", "modalidad 40", "imss", "ley 73", "inversion", "ahorro"];
                const hasInterest = interestKeywords.some(k => lowerText.includes(k));

                if (lowerText.includes("me llamo") || lowerText.includes("mi nombre es") || possiblePhone || hasInterest) {
                    const vid = app.agents.getVisitorId();
                    const context = {
                        nombre: text.substring(0, 50),
                        telefono: possiblePhone ? possiblePhone[0] : null,
                        interes: hasInterest ? "ACTIVO" : "PENDIENTE",
                        last_interaction: new Date()
                    };
                    app.agents.saveMemory(vid, `Interés detectado: ${lowerText.substring(0, 50)}...`, context);
                } else if (app.state.chatHistory.length % 3 === 0) {
                    const vid = app.agents.getVisitorId();
                    const summary = app.state.chatHistory.slice(-4).map(h => h.content).join(' | ');
                    app.agents.saveMemory(vid, "Resumen parcial: " + summary.substring(0, 400));
                }

                if (app.state.chatHistory.length >= 8) {
                    const currentId = (app.state.companyId || "").trim().toUpperCase();
                    const company = app.data.Config_Empresas.find(c => (c.id_empresa || "").toUpperCase() === currentId);

                    if (company) {
                        let targetPhone = "";
                        const useStandard = (company.usa_features_estandar === "TRUE" || company.usa_features_estandar === true);

                        if (useStandard) {
                            const seoItem = (app.data.Config_SEO || []).find(s => (s.id_empresa || "").toUpperCase() === currentId && s.wa_directo);
                            if (seoItem) targetPhone = seoItem.wa_directo;
                        }

                        if (!targetPhone) targetPhone = company.telefonowhatsapp || "8129552094"; 

                        let cleanPhone = targetPhone.toString().replace(/\D/g, '');
                        if (cleanPhone.length === 10) cleanPhone = "52" + cleanPhone; 

                        const lastFive = app.state.chatHistory.slice(-5).map(h => h.content).join(' | ');
                        const waText = encodeURIComponent(`Hola ${company.nomempresa}, estuve hablando con su IA sobre: "${lastFive.substring(0, 100)}...". Me gustaría hablar con un experto.`);

                        const waBtn = `<div style="margin-top:10px; text-align:center;">
                            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn-primary" style="background:#25d366; font-size:0.8rem; padding:5px 10px; text-decoration:none; display:inline-block; border-radius:15px; border:none; color:white; font-weight:bold; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);">
                            <i class="fab fa-whatsapp"></i> Hablar con un Experto de ${company.nomempresa}
                            </a>
                        </div>`;
                        app.agents.addMessageToUI('ai', waBtn);
                    }
                }

                // REMOVIDO: Sincronización Supabase directa desde front (Ahora vía Backend Sync en GAS)
            } else {
                let fullError = data.error || "No se pudo conectar con la IA.";
                if (data.detail) fullError += "\n\nDetalle técnico: " + data.detail;
                app.agents.addMessageToUI('ai', "❌ Error: " + fullError);
            }
        } catch (e) {
            console.error(e);
            app.ui.updateConsole("AI_CONN_FAIL", true);
            app.agents.addMessageToUI('ai', "❌ Error de conexión con el servidor.");
        } finally {
            document.getElementById('ai-loading').classList.add('hidden');
            document.getElementById('btn-send-chat').disabled = false;
        }
    },
    addMessageToUI: (role, text, silent = false) => {
        const historyDiv = document.getElementById('chat-history');
        const msgDiv = document.createElement('div');
        const isAi = role === 'ai';
        msgDiv.className = isAi ? 'ai-msg' : 'user-msg';
        // Inline Styles for simplicity
        msgDiv.style.padding = '12px';
        msgDiv.style.borderRadius = '8px';
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
        msgDiv.style.marginBottom = '10px';
        if (isAi) {
            msgDiv.style.background = 'white';
            msgDiv.style.borderLeft = '4px solid var(--primary-color)';
            msgDiv.style.alignSelf = 'flex-start';
            // Detect JSON for automatic ticket triggering
            if (text.includes('{') && text.includes('}')) {
                try {
                    const potentialJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
                    const ticket = JSON.parse(potentialJson);
                    if (ticket.nombre && (ticket.queja || ticket.reporte)) {
                        app.agents.sendSupportTicket(ticket);
                        msgDiv.innerHTML = "✅ Reporte generado y enviado con éxito. Cerrando chat...";
                        historyDiv.appendChild(msgDiv);
                        return;
                    }
                } catch (e) { }
            }
            // Close chat automatically if AI says a closing phrase
            const lowerText = text.toLowerCase();
            const closePhrases = ["cerrando pantalla", "cerrando chat", "finalizar esta sesión", "finalizar la sesión", "hasta pronto", "que tengas un excelente día"];
            if (closePhrases.some(p => lowerText.includes(p))) {
                setTimeout(() => {
                    if (app.state.currentAgent) app.agents.closeChat();
                }, 5000);
            }
            msgDiv.innerHTML = text.replace(/\n/g, '<br>'); // Simple break formatting
        } else {
            msgDiv.style.background = 'var(--primary-color)';
            msgDiv.style.color = 'white';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.innerText = text;
        }
        historyDiv.appendChild(msgDiv);
        if (!silent) historyDiv.scrollTop = historyDiv.scrollHeight;
    },
    sendSupportTicket: async (ticketData) => {
        app.ui.updateConsole("SENDING_TICKET...");
        try {
            const currentCo = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'createSupportTicket',
                    ticket: {
                        id_empresa: app.state.companyId,
                        nombre: ticketData.nombre,
                        telefono: ticketData.telefono,
                        email: ticketData.email || currentCo?.email || "n/a",
                        queja: ticketData.queja || ticketData.reporte
                    },
                    token: app.apiToken
                })
            });
            const res = await response.json();
            if (res.success) {
                app.ui.updateConsole("TICKET_SENT");
                setTimeout(() => {
                    app.agents.closeChat();
                    alert("¡Gracias! Tu reporte ha sido enviado al equipo de soporte.");
                }, 1500);
            }
        } catch (e) { console.error(e); }
    },

    openAgentsModal: () => {
        console.log("Abriendo Agentes AI...");
        const user = app.state.currentUser;
        const agentsGrid = document.getElementById('agents-grid');
        if (!agentsGrid) {
            console.error("No se encontró el grid de agentes (#agents-grid)");
            return;
        }

        if (!app.data.Prompts_IA || !Array.isArray(app.data.Prompts_IA)) {
            console.warn("La tabla Prompts_IA no está cargada.");
            agentsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No se encontraron agentes configurados.</p>';
        } else {
            const availableAgents = app.data.Prompts_IA.filter(a => {
                const matchAccess = (parseInt(a.nivel_acceso) || 0) <= user.nivel_acceso;
                const isEnabled = (a.habilitado === true || a.habilitado === "TRUE");
                const matchCo = (a.id_empresa || "").toString().trim().toUpperCase() === app.state.companyId.toUpperCase() || (a.id_empresa || "").toString().trim().toUpperCase() === "GLOBAL";
                return matchAccess && isEnabled && matchCo;
            });
            if (availableAgents.length === 0) {
                agentsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No hay agentes disponibles.</p>';
            } else {
                agentsGrid.innerHTML = availableAgents.map(agt => `
                        <div class="feature-card" onclick="app.agents.select('${agt.id_agente}')" style="cursor:pointer; border:1px solid var(--primary-color);">
                            <i class="fas ${app.agents.getAgentIcon(agt.nombre)}"></i>
                            <h3>${agt.nombre}</h3>
                            <p>${(agt.prompt_base || "").substring(0, 60)}...</p>
                            ${(agt.recibe_files === true || agt.recibe_files === "TRUE") ? '<small style="background:#4caf50; color:white; padding:2px 5px; border-radius:4px; font-size:0.6rem;">Soporta Archivos</small>' : ''}
                        </div>
                    `).join('');
            }
        }
        window.location.hash = "#agents";
    },

    getAgentIcon: (name) => {
        const icons = {
            "Diseñador": "fa-palette",
            "Ventas": "fa-comments-dollar",
            "Cotizador": "fa-calculator",
            "Marketing": "fa-bullhorn",
            "Pilares": "fa-landmark",
            "Corporativo": "fa-file-contract",
            "Analista": "fa-chart-line",
            "Clasificador": "fa-sitemap",
            "Servicio": "fa-headset",
            "Asistente": "fa-robot",
            "Director": "fa-crown"
        };
        for (let key in icons) if (name.toLowerCase().includes(key.toLowerCase())) return icons[key];
        return "fa-brain";
    },

    // --- HEALTH CHECK ENGINE (v15.8.0) ---
    checkAiHealth: async () => {
        const circle = document.getElementById('sb-ai-health');
        if (!circle) return;

        // Evitar verificaciones redundantes si ya está ONLINE hace poco
        if (circle.classList.contains('online') && (Date.now() - (app.state._lastAiHealthCheck || 0) < 60000)) return;
        
        app.state._lastAiHealthCheck = Date.now();
        circle.className = 'ai-status-circle warning';
        circle.title = "Verificando conexión con IA...";

        try {
            const currentModel = app.state._aiModel || localStorage.getItem('evasol_ai_model') || "gemini-1.5-flash";
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'askGemini',
                    message: 'health-check-ping',
                    model: currentModel,
                    token: app.apiToken
                })
            });
            const data = await res.json();

            if (data.success && !data.error) {
                circle.className = 'ai-status-circle online';
                circle.title = `IA Conectada (${currentModel})`;
            } else {
                // --- DETECCIÓN DE CUOTA EXCEDIDA (v15.8.1) ---
                const detail = (data.detail || "").toString().toLowerCase();
                const errorMsg = (data.error || "").toString().toLowerCase();
                
                if (detail.includes("quota") || detail.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
                    circle.className = 'ai-status-circle warning';
                    circle.title = "Cuota de IA saturada. Espera unos segundos (Rate Limit).";
                    app.ui.updateConsole("AI_QUOTA_REACHED");
                    return; // No intentar auto-fix si es solo por cuota
                }

                // Si el modelo específico falló por otra razón, intentar diagnosticar uno nuevo automáticamente
                console.warn(`[AI_HEALTH] Model ${currentModel} failed. Attempting auto-fix...`);
                circle.title = "Enlace roto detectado. Intentando reconectar...";
                
                // --- AUTO-FIX LINK ENGINE ---
                const diagRes = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'listAiModels', token: app.apiToken })
                });
                const diagData = await diagRes.json();
                
                if (diagData.success && diagData.models && diagData.models.length > 0) {
                    // Buscar el primer flash disponible (son los más estables para chat)
                    const backupModel = diagData.models.find(m => m.includes('flash')) || diagData.models[0];
                    app.state._aiModel = backupModel;
                    localStorage.setItem('evasol_ai_model', backupModel);
                    
                    circle.className = 'ai-status-circle online';
                    circle.title = `IA Reconectada (${backupModel})`;
                    app.ui.updateConsole(`AI_LINK_FIXED: ${backupModel}`);
                } else {
                    circle.className = 'ai-status-circle offline';
                    circle.title = "Error de Enlace: No se encontraron modelos compatibles.";
                    app.ui.updateConsole("AI_LINK_BROKEN", true);
                }
            }
        } catch (e) {
            circle.className = 'ai-status-circle offline';
            circle.title = "Error de Red: No hay respuesta del backend.";
            app.ui.updateConsole("AI_NET_ERR", true);
        }
    },
    updateAiProgress: (percent, status) => {
        const wrapper = document.getElementById('ai-progress-wrapper');
        const fill = document.getElementById('ai-progress-fill');
        const statusEl = document.getElementById('ai-progress-status');
        const percentEl = document.getElementById('ai-progress-percent');
        
        if (wrapper) wrapper.classList.remove('hidden');
        if (fill) fill.style.width = `${percent}%`;
        if (statusEl) statusEl.innerText = status.toUpperCase();
        if (percentEl) percentEl.innerText = `${Math.round(percent)}%`;
        
        if (percent >= 100) {
            setTimeout(() => { if (wrapper) wrapper.classList.add('hidden'); }, 3000);
        }
    },

    // --- MOTOR DE CONSULTORÍA ESTRATÉGICA (v16.4.0) ---
    generateMarketingPlan: async () => {
        const id = app.state.companyId;
        app.agents.updateAiProgress(10, 'Iniciando Consultoría...');

        const company = app.data.Config_Empresas.find(c => String(c.id_empresa).toUpperCase() === String(id).toUpperCase());
        const seoData = (app.data.Config_SEO || []).filter(s => String(s.id_empresa).toUpperCase() === String(id).toUpperCase());
        const pagesData = (app.data.Config_Paginas || []).filter(p => String(p.id_empresa).toUpperCase() === String(id).toUpperCase());
        const notebook = (app.data.Config_IA_Notebooks || []).find(n => String(n.id_empresa).toUpperCase() === String(id).toUpperCase());
        const notebookId = notebook ? notebook.notebook_id : (company?.id_notebooklm || "N/A");

        if (!company) {
            app.agents.updateAiProgress(0, 'Error: Empresa no encontrada');
            throw new Error("Datos de empresa no encontrados.");
        }

        app.agents.updateAiProgress(20, 'Cargando Conocimiento de Negocio...');

        // 1. Consolidar la "Maleta de Contexto" para la IA
        const businessIdentity = `
            IDENTIDAD: ${company.nomempresa} (${company.giro_comercial || 'Servicios'})
            SLOGAN: ${company.slogan_empresa || ''}
            DESCRIPCIÓN: ${company.descripcion || ''}
            PILARES SEO: ${seoData.map(s => s.titulo).join(', ')}
            KEYWORDS OBJETIVO: ${seoData.map(s => s.keywords_coma).join(', ')}
            SERVICIOS DETALLADOS (PÁGINAS): ${pagesData.map(p => p.id_pagina).join(', ')}
            NOTEBOOK_REF: ${notebookId}
        `;

        const marketingPrompt = `
            ACTÚA COMO UN CONSULTOR DE MARKETING ESTRATÉGICO DE ÉLITE.
            Tu misión es generar un PLAN DE MARKETING INTEGRAL para el negocio detallado a continuación.
            
            ${businessIdentity}
            
            GUÍA DE ACCIÓN:
            1. Analiza su Propuesta de Valor única.
            2. Define el Buyer Persona (quién compra estos servicios).
            3. Redacta 3 Estrategias de Marketing Digital de alto impacto.
            4. Sugiere mejoras para su posicionamiento SEO basado en sus keywords actuales.
            
            Usa el conocimiento profundo de tus fuentes (NotebookLM) para ser extremadamente preciso. 
            No generes generalidades; genera acciones concretas para este inquilino específico.
        `;

        app.agents.updateAiProgress(40, 'Conectando con Agente Estratégico...');
        await app.agents.select('AGT-001'); 
        
        const chatBox = document.getElementById('chat-history');
        if (chatBox) chatBox.innerHTML = ''; 
        
        app.agents.addMessageToUI('ai', `🚀 <b>Iniciando Consultoría para ${company.nomempresa}...</b><br>Analizando datos de Excel y catálogos locales.`);
        
        app.agents.updateAiProgress(60, 'IA está Redactando Estrategia...');
        document.getElementById('ai-loading').classList.remove('hidden');
        document.getElementById('btn-send-chat').disabled = true;

        // --- ANTICIPACIÓN DE ERRORES: TIMEOUT (v15.9.9) ---
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos límite

        try {
            // DETECCIÓN DE DATOS DE CATÁLOGO (v16.5.0)
            const catalog = (app.data.Catalogo || []).filter(p => String(p.id_empresa).toUpperCase() === String(id).toUpperCase()).slice(0, 15);
            const catalogContext = catalog.length > 0 ? "PRODUCTOS/SERVICIOS REALES: " + catalog.map(p => `${p.nombre} ($${p.precio})`).join(', ') : "Sin catálogo cargado.";

            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                signal: controller.signal,
                body: JSON.stringify({
                    action: 'askGemini',
                    id_empresa: id,
                    usuario: app.state.currentUser.nombre,
                    message: `${marketingPrompt}\n\nDATOS DE INVENTARIO: ${catalogContext}\n\nMENSAJE_CONTROL: Genera el Plan de Marketing Estratégico detallado arriba usando ÚNICAMENTE estos datos locales.`,
                    token: app.apiToken
                })
            });
            
            clearTimeout(timeoutId);
            const data = await response.json();
            
            if (data.success) {
                app.agents.updateAiProgress(90, 'Finalizando reporte...');
                app.agents.addMessageToUI('ai', data.answer);
                app.agents.updateAiProgress(100, 'Consultoría Finalizada (Local Sync OK)');
            } else {
                app.agents.updateAiProgress(0, 'Error en IA');
                app.agents.addMessageToUI('ai', "❌ Error: " + (data.error || "Falla técnica en backend."));
            }
        } catch (e) {
            clearTimeout(timeoutId);
            console.error(e);
            app.agents.updateAiProgress(0, 'Fallo de Conexión');
            const errorMsg = e.name === 'AbortError' ? "⏱️ La IA tardó demasiado en responder (Timeout). Reintenta en unos momentos." : "❌ Error de conexión crítica con el motor estratégico local.";
            app.agents.addMessageToUI('ai', errorMsg);
        } finally {
            document.getElementById('ai-loading').classList.add('hidden');
            document.getElementById('btn-send-chat').disabled = false;
        }
    }
};
