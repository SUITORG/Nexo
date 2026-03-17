app.agents = {
    getVisitorId: () => {
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
    select: (agtId) => {
        const agt = (app.data.Prompts_IA || []).find(a => a.id_agente === agtId);
        if (!agt) {
            console.error(`AGENT_NOT_FOUND: ${agtId}. Please run Repair DB in Maintenance.`);
            if (agtId === 'AGT-001') {
                alert("El sistema de soporte se está inicializando. Por favor, asegúrate de haber 'Reparado la Base de Datos' en el panel de Staff.");
            }
            return;
        }
        app.state.currentAgent = agt;
        app.state.chatHistory = []; // Reset history for new session
        document.getElementById('agent-display-name').innerText = agt.nombre;
        document.getElementById('ai-chat-modal').classList.remove('hidden');
        const historyDiv = document.getElementById('chat-history');
        historyDiv.innerHTML = `
    <div class="ai-msg" style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-color); max-width: 80%; align-self: flex-start; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        Hola, soy tu <b>${agt.nombre}</b>. ¿En qué puedo apoyarte hoy?
    </div>
    `;
        // Scroll to chat top
        historyDiv.scrollTop = 0;
        // Inactivity monitor for the chat specifically
        app.state._lastChatActivity = Date.now();
        const checkInactivity = setInterval(() => {
            if (!app.state.currentAgent) {
                clearInterval(checkInactivity);
                return;
            }
            const idleSeconds = (Date.now() - app.state._lastChatActivity) / 1000;
            if (idleSeconds > 180) { // 180 seconds (3 min) of idle in chat = auto close
                if (app.state.currentAgent) {
                    app.agents.addMessageToUI('ai', `Sesión pausada por inactividad. Estaré aquí si necesitas algo más.`);
                    app.agents.closeChat();
                }
            }
        }, 10000); // 10s check interval 

        // Inyectar Memoria de Supabase (UNIVERSAL v4.16.0)
        const isSupabase = (app.state.dbEngine || "").toUpperCase() === 'SUPABASE';
        if (isSupabase && SUIT_CONFIG.sbUrl) {
            const vid = app.agents.getVisitorId();
            app.agents.fetchMemory(vid).then(memory => {
                if (memory && memory.ultimo_resumen) {
                    setTimeout(() => {
                        app.agents.addMessageToUI('ai', `¡Hola de nuevo! Veo que en nuestra última plática nos quedamos en: <i>"${memory.ultimo_resumen}"</i>. ¿Cómo va todo con eso?`);
                        app.state.chatHistory.push({ role: 'model', content: `Reconocimiento: El cliente regresó. Resumen anterior: ${memory.ultimo_resumen}` });
                    }, 1000);
                }
            });
        }
    },

    fetchMemory: async (vid) => {
        try {
            const url = `${SUIT_CONFIG.sbUrl}/rest/v1/paper_memoria_leads?id_visitante=eq.${vid}&select=*`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    "apikey": SUIT_CONFIG.sbKey,
                    "Authorization": "Bearer " + SUIT_CONFIG.sbKey
                }
            });
            const data = await res.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (e) { console.error("Memory fetch failed:", e); return null; }
    },

    saveMemory: async (vid, resumen, dataObj = {}) => {
        try {
            const url = `${SUIT_CONFIG.sbUrl}/rest/v1/paper_memoria_leads`;
            const payload = {
                id_visitante: vid,
                ultimo_resumen: resumen,
                fecha_actualizacion: new Date().toISOString(),
                ...dataObj
            };
            await fetch(url, {
                method: 'POST',
                headers: {
                    "apikey": SUIT_CONFIG.sbKey,
                    "Authorization": "Bearer " + SUIT_CONFIG.sbKey,
                    "Content-Type": "application/json",
                    "Prefer": "resolution=merge-duplicates"
                },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.error("Memory save failed:", e); }
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
        }
    },
    sendMessage: async () => {
        const input = document.getElementById('chat-user-input');
        const text = input.value.trim();
        if (!text || !app.state.currentAgent) return;
        // 1. Add User Message to UI
        app.agents.addMessageToUI('user', text);
        input.value = '';
        app.state._lastChatActivity = Date.now();
        // 2. Prepare History for AI
        app.state.chatHistory.push({ role: 'user', content: text });
        // 3. Show Loading
        document.getElementById('ai-loading').classList.remove('hidden');
        document.getElementById('btn-send-chat').disabled = true;
        app.ui.updateConsole("AI_PROCESSING...");
        try {
            // 4. Call Backend Proxy
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'askGemini',
                    id_empresa: app.state.companyId || 'SYSTEM',
                    usuario: app.state.currentUser ? app.state.currentUser.nombre : 'Visitante',
                    agentId: app.state.currentAgent.id_agente,
                    promptBase: app.state.currentAgent.prompt_base,
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

                // Inyectar botón de WhatsApp dinámico con jerarquía de contacto (v5.8.9)
                if (app.state.chatHistory.length >= 4) {
                    const currentId = (app.state.companyId || "").trim().toUpperCase();
                    const company = app.data.Config_Empresas.find(c => (c.id_empresa || "").toUpperCase() === currentId);

                    if (company) {
                        let targetPhone = "";
                        const useStandard = (company.usa_features_estandar === "TRUE" || company.usa_features_estandar === true);

                        // Jerarquía Nivel 1: SEO (Solo si usa features estándar)
                        if (useStandard) {
                            const seoItem = (app.data.Config_SEO || []).find(s => (s.id_empresa || "").toUpperCase() === currentId && s.wa_directo);
                            if (seoItem) targetPhone = seoItem.wa_directo;
                        }

                        // Jerarquía Nivel 2: Fallback a Teléfono de Empresa
                        if (!targetPhone) targetPhone = company.telefonowhatsapp || "8129552094"; // Fallback final de emergencia

                        // Limpieza y Formateo Internacional (v5.8.9)
                        let cleanPhone = targetPhone.toString().replace(/\D/g, '');
                        if (cleanPhone.length === 10) cleanPhone = "52" + cleanPhone; // Auto-fix para México si falta prefijo

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

                // --- Sincronización de Memoria DYNAMICA (v4.16.0) ---
                if ((app.state.dbEngine || "").toUpperCase() === 'SUPABASE') {
                    const vid = app.agents.getVisitorId();
                    const lastMsgs = app.state.chatHistory.slice(-2).map(h => h.content).join(' ');
                    // Disparamos el guardado de forma asíncrona (no bloqueante)
                    app.agents.saveMemory(vid, lastMsgs.substring(0, 200));
                }
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
    addMessageToUI: (role, text) => {
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
        historyDiv.scrollTop = historyDiv.scrollHeight;
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
    }
};
