/* SuitOrg Agents Controller - v15.8.9
 * ---------------------------------------------------------
 * Sincronización: 2026-03-21 10:28 AM (v15.8.9 Cerebral Sync)
 * ---------------------------------------------------------
 */
app.agents = {
    // --- UTILS (v16.10.28) ---
    normalizeModelName: (m) => {
        if (!m || typeof m !== 'string' || m.includes('/')) return m;
        const low = m.toLowerCase();
        if (low.includes('gemini')) return 'google/' + m;
        if (low.includes('gpt')) return 'openai/' + m;
        if (low.includes('claude')) return 'anthropic/' + m;
        if (low.includes('qwen')) return 'alibaba/' + m;
        if (low.includes('llama')) return 'meta-llama/' + m;
        return m;
    },

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
    run: (agentKey) => {
        const agent = (app.data.Agentes || app.data.Prompts_IA || []).find(a =>
            a.id_agente === agentKey || a.id === agentKey
        );
        if (!agent) return;
        // Solo bloquear agentes internos (Staff) — los públicos pasan directo
        const esPublico = String(agent.publico || agent.tipo || "").toUpperCase() === 'PUBLICO';
        if (!esPublico && !app.state.currentUser && !app.state.user) {
            console.warn("⚠️ [AGENTS] Agente interno requiere sesión.");
            if (app.ui && app.ui.showLogin) app.ui.showLogin();
            return;
        }
        app.agents.select(agent.id_agente);
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
        
        // --- 🧹 LIMPIEZA Y SINCRONIZACIÓN DEL VECTOR DE SESIÓN (v16.10.23) ---
        app.state.leadVector = {}; 
        localStorage.removeItem(`suit_lead_vec_${vid}`);
        
        try {
            // Sincronizar con backend por si ya somos un Lead Oficial
            const leadRes = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ action: 'getLeadByVisitor', id_visitante: vid, token: app.apiToken })
            });
            const leadData = await leadRes.json();
            if (leadData.success && leadData.lead) {
                console.log("🔄 [SYNC] Lead Oficial encontrado. Cargando al Vector de Sesión:", leadData.lead.id_lead);
                app.state.leadVector = { ...leadData.lead };
                localStorage.setItem(`suit_lead_vec_${vid}`, JSON.stringify(app.state.leadVector));
            } else {
                console.log("🆕 [SYNC] Visitante nuevo o sin datos. Vector inicializado en limpio.");
            }
        } catch (e) {
            console.warn("⚠️ [SYNC] API inaccesible para sincronizar vector inicial.");
        }
        
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
        
        // --- COLOREAR CHAT INSTITUCIONAL (v16.7.28) ---
        const company = app.data.Config_Empresas.find(c => (c.id_empresa || "").toUpperCase() === app.state.companyId.toUpperCase());
        if (company && company.color_tema) {
            const raw = company.color_tema;
            // Generar versión Light (Pastel) para fondo
            document.documentElement.style.setProperty('--chat-bg', `${raw}15`); // Opacidad 15 hex (aprox 8%)
        } else {
            document.documentElement.style.setProperty('--chat-bg', '#f9f9f9');
        }

        document.getElementById('ai-chat-modal').classList.remove('hidden');
    },

    fetchMemory: async (vid, agtId = null) => {
        try {
            const user = app.state.currentUser || {};
            const body = {
                action: 'getAiMemory',
                id_visitante: vid,
                id_empresa: app.state.companyId,
                nombre: app.state.currentUser?.nombre || '',
                telefono: app.state.currentUser?.telefono || '',
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
            // Intentar extraer lead desde el resumen
            const phoneInResumen = resumen.match(/(\d{10})/);
            const nameInResumen = resumen.match(/(?:detectado:|nombre:|cliente:)\s*([A-ZÁÉÍÓÚa-záéíóúñÑ]{2,}\s+[A-ZÁÉÍÓÚa-záéíóúñÑ]{2,}(?:\s+[A-ZÁÉÍÓÚa-záéíóúñÑ]{2,})?)/i);
            if (phoneInResumen && nameInResumen) {
                console.log('🎯 [MEMORY→LEAD] Extrayendo lead desde memoria...');
                setTimeout(() => app.agents.saveLead({
                    nombre: nameInResumen[1].trim(),
                    telefono: phoneInResumen[1]
                }), 1500);
            }
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
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (result.success) {
                console.log(`✅ [LOG_IA] ${role} grabado`);
            } else {
                console.warn(`⚠️ [LOG_IA] GAS respondió sin éxito:`, result);
            }
        } catch (e) {
            console.error('❌ [LOG_IA] Error:', e);
        }
    },

    closeChat: () => {
        // 🛑 GUARDADO FORZOSO AL CERRAR (v16.10.18)
        if (app.state.leadVector && Object.keys(app.state.leadVector).length > 0) {
            console.log('🚪 [CLOSE_CHAT] Guardado forzoso al cerrar...');
            app.agents.saveLead(app.state.leadVector);
        }
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
            // Lista Híbrida de Rescate (v16.7.28) - PRIORIDAD: OPENROUTER
            const company = (app.data.Config_Empresas || []).find(c => c.id_empresa === app.state.companyId);
            const savedModels = (company?.usa_soporte_ia || '').toString().split(',').map(m => m.trim()).filter(m => m && !['TRUE','FALSE','NO',''].includes(m.toUpperCase()));
            const fallbackModels = ['meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-small-3.1:free', 'openrouter/free'];
            const modelIds = savedModels.length ? savedModels : fallbackModels;
            const models = modelIds.map(id => ({ id, type: 'OPENROUTER' }));
            
            let best = null;
            app.ui.updateConsole(`DIAGNOSING HYBRID MODELS...`);

            for (let m of models) {
                app.ui.updateConsole(`TESTING (${m.type}): ${m.id}...`);
                try {
                    let result;
                    if (m.type === 'OPENROUTER') {
                        result = await app.agents.callOpenRouterAI(m.id, "ping", "Responde solo con la palabra OK.");
                    } else {
                        const testRes = await fetch(app.apiUrl, {
                            method: 'POST',
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({
                                action: 'askGemini',
                                message: 'health-check-ping',
                                model: m.id,
                                token: app.apiToken
                            })
                        });
                        result = await testRes.json();
                    }

                    if (result.success && !result.error) {
                        best = m.id;
                        break; 
                    }
                } catch (e) { console.warn(`Model ${m.id} failed diagnostic.`); }
            }

            if (best) {
                app.state._aiModel = best;
                localStorage.setItem('evasol_ai_model', best);
                app.ui.updateConsole("AI_READY");
                const ts = new Date().toISOString().slice(0,16).replace('T',' ');
                console.log(`[AI_MODEL_OK] ${ts} | empresa: ${app.state.companyId} | modelo: ${best}`);
                alert(`✅ IA REPARADA: Modelo "${best}" activado.\n\nCopia este modelo a usa_soporte_ia en GSheets:\n${best}`);
            } else {
                alert("❌ Fallo total: Ni Gemini ni OpenRouter responden. Revisa tus API Keys.");
                app.ui.updateConsole("AI_FAIL", true);
            }
        } catch (e) {
            console.error(e);
            alert("Error crítico durante el diagnóstico.");
        } finally {
            if (btn) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        }
    },

    triggerMicroAuthRepair: () => {
        // Acceso directo sin contraseña (v16.10.12 - Solicitud de Usuario)
        app.agents.diagnoseAi();
    },
    sendMessage: async () => {
        const input = document.getElementById('chat-user-input');
        const text = input.value.trim();
        if (!text || !app.state.currentAgent) return;
        // 1. Add User Message to UI & Persist
        app.agents.addMessageToUI('user', text);
        app.agents.logInteraction('user', text); // fire-and-forget
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

            // --- INYECTOR DE RELOJ Y MODELO DINÁMICO (v16.7.28) ---
            const currentCo = app.data.Config_Empresas.find(c => String(c.id_empresa).toUpperCase() === String(app.state.companyId).toUpperCase());
            const clockContext = `\n\n[RELOJ_SISTEMA]: Hoy es ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Hora local: ${new Date().toLocaleTimeString('es-MX')}. Usa esta fecha para cálculos de edad y vigencia de derechos.`;
            
            // Priorizar lista de modelos desde Config_Empresas (usa_soporte_ia)
            // v16.10.28: Enviamos la lista completa normalizada para habilitar el Fallback en el Backend
            const rawModels = (currentCo?.usa_soporte_ia || app.state._aiModel || localStorage.getItem('evasol_ai_model') || "gemini-1.5-flash").toString();
            let selectedModels = rawModels.replace(/,\s*no$/i, '').split(',').map(m => app.agents.normalizeModelName(m.trim())).join(',');
            
            const finalSystemPrompt = app.state.currentAgent.prompt_base + crmContext + clockContext;
            console.log('🔍 [IA_ENGINE] Enviando solicitud al backend con fallback:', selectedModels);
            console.log('🔍 [DEBUG_PROMPT] Prompt completo:', finalSystemPrompt);

            // --- MOTOR UNIFICADO (BACKEND-FIRST) ---
            app.ui.updateConsole(`AI_SYNC: ${selectedModels.split(',')[0].toUpperCase()}`);
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: action,
                    id_empresa: app.state.companyId || 'SYSTEM',
                    usuario: app.state.currentUser ? app.state.currentUser.nombre : 'Visitante',
                    agentId: app.state.currentAgent.id_agente,
                    promptBase: finalSystemPrompt,
                    history: app.state.chatHistory,
                    message: text,
                    ai_config: selectedModels, // Enviamos el vector completo
                    token: app.apiToken
                })
            });
            data = await response.json();
            if (data.success) {
                app.agents.addMessageToUI('ai', data.answer);
                app.state.chatHistory.push({ role: 'model', content: data.answer });
                
                // Persistencia de Respuesta
                setTimeout(() => app.agents.logInteraction('model', data.answer), 500); // fire-and-forget con delay

                // --- DETECTOR DE INTENCIONES (Fix 2) ---
                app.agents.processIntent(data.answer, text);


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
                    setTimeout(() => app.agents.saveMemory(vid, `Interés detectado: ${lowerText.substring(0, 50)}...`, context), 1000); // fire-and-forget
                } else if (app.state.chatHistory.length % 3 === 0) {
                    const vid = app.agents.getVisitorId();
                    const summary = app.state.chatHistory.slice(-4).map(h => h.content).join(' | ');
                    setTimeout(() => app.agents.saveMemory(vid, "Resumen parcial: " + summary.substring(0, 400)), 1000); // fire-and-forget
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
            // Detectar intenciones delegando a processIntent (Fix 2)
            if (text.includes('{') || /nombre|telefono|whatsapp/i.test(text)) {
                // El procesamiento se hace ahora en sendMessage tras recibir la respuesta
            }
            // Close chat automatically if AI says a closing phrase
            const lowerText = text.toLowerCase();
            const closePhrases = ["cerrando pantalla", "cerrando chat", "finalizar esta sesión", "finalizar la sesión", "hasta pronto", "que tengas un excelente día"];
            if (closePhrases.some(p => lowerText.includes(p))) {
                setTimeout(() => {
                    if (app.state.currentAgent) app.agents.closeChat();
                }, 5000);
            }
            
            if (silent) {
                msgDiv.innerHTML = text.replace(/\n/g, '<br>');
            } else {
                const cleanText = text.replace(/\[LEAD\][\s\S]*?\[\/LEAD\]/g, '').trim();
                app.agents.humanTyping(msgDiv, cleanText);
            }
        } else {
            msgDiv.style.background = 'var(--primary-color)';
            msgDiv.style.color = 'white';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.innerText = text;
        }
        historyDiv.appendChild(msgDiv);
        if (!silent) historyDiv.scrollTop = historyDiv.scrollHeight;
    },

    humanTyping: async (element, fullText) => {
        let current = "";
        const mistakes = ["q", "w", "e", "r", "a", "s", "d", "f"]; // Teclas cercanas comunes
        
        for (let i = 0; i < fullText.length; i++) {
            // Probabilidad de error (1.5%) - Solo en medio del texto
            if (Math.random() < 0.015 && i > 10 && i < fullText.length - 10) {
                const wrongChar = mistakes[Math.floor(Math.random() * mistakes.length)];
                element.innerHTML = (current + wrongChar).replace(/\n/g, '<br>');
                await new Promise(r => setTimeout(r, 150 + Math.random() * 200)); // Pausa de "Ups"
                
                // Borrar el error (Efecto Backspace)
                element.innerHTML = current.replace(/\n/g, '<br>');
                await new Promise(r => setTimeout(r, 300 + Math.random() * 200)); // Pausa de corrección
            }

            current += fullText[i];
            element.innerHTML = current.replace(/\n/g, '<br>');
            
            // Velocidad variable (Mecanografía realista)
            const speed = fullText[i] === ' ' ? 80 : (15 + Math.random() * 40);
            await new Promise(r => setTimeout(r, speed));

            // Auto-scroll durante el tecleo
            const history = document.getElementById('chat-history');
            if (history) history.scrollTop = history.scrollHeight;
        }
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

    processIntent: (response, userMessage) => {
        const datos = {};
        
        // --- EXTRACCIÓN POR TAGS [LEAD] (v16.10.30) ---
        const jsonMatch = response.match(/\[LEAD\]([\s\S]*?)\[\/LEAD\]/);
        if (jsonMatch) {
            try {
                const aiData = JSON.parse(jsonMatch[1].trim());
                if (aiData.nombre || aiData.telefono || aiData.email) {
                    console.log('🤖 [IA_INTENT] JSON detectado en tags:', aiData);
                    Object.assign(datos, aiData);
                }
            } catch (e) {
                console.warn('⚠️ [IA_INTENT] Error al parsear tags [LEAD]:', e.message);
            }
        }
        const msg = userMessage.trim();
        
        // 📅 FECHA NACIMIENTO: DD/MM/AAAA (se detecta PRIMERO para no confundir con nombres)
        const fechaMatch = msg.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
        if (fechaMatch) {
            const dia = parseInt(fechaMatch[1]);
            const mes = parseInt(fechaMatch[2]) - 1;
            const anio = parseInt(fechaMatch[3]);
            const fechaNac = new Date(anio, mes, dia);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const cumpleEsteAnio = new Date(hoy.getFullYear(), mes, dia);
            if (hoy < cumpleEsteAnio) edad--;
            datos.fecha_nacimiento = `${String(dia).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${anio}`;
            datos.edad = edad;
            console.log(`📅 [INTENT] Fecha nacimiento: ${datos.fecha_nacimiento} → Edad: ${edad}`);
        }
        
        // 👤 NOMBRE (método multicapa):
        // Capa 1: Con palabras clave "soy/llamo/nombre es" (v16.10.23: permite 1 sola palabra)
        const nameMatch1 = msg.match(/(?:soy|llamo|me\s+dicen|nombre\s+es|nombre\s+completo\s+es)\s+([A-ZÁÉÍÓÚñ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚñ][a-záéíóúñ]+)*)/i);
        
        // Capa 2: Mensaje corto que parece solo un nombre (1-4 palabras capitalizadas)
        const soloNombre = !fechaMatch && !msg.includes('@') && !msg.match(/\d{8,}/) && msg.length < 50;
        const nameMatch2 = soloNombre ? msg.match(/^([A-ZÁÉÍÓÚñ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚñ][a-záéíóúñ]+){0,3})$/) : null;
        
        // Capa 3: Nombre detectado al inicio de un mensaje mixto (ej: "Juan Perez 811...")
        const nameMatch3 = msg.match(/^([A-Za-záéíóúñÁÉÍÓÚÑ]+(?:\s+[A-Za-záéíóúñÁÉÍÓÚÑ]+){1,3})/);
        
        // --- 🛡️ FILTRO DE PALABRAS PROHIBIDAS (v16.10.26) ---
        const blacklist = ["Deseo", "Quiero", "Hola", "Buenas", "Necesito", "Tengo", "Solicito", "Busco", "Vengo", "La", "El", "Los", "Las", "Mi", "Su", "Un", "Una", "Oye", "Mira"];
        
        let nombreCapturado = null;
        if (nameMatch1) nombreCapturado = nameMatch1[1].trim();
        else if (nameMatch2 && !datos.nombre) nombreCapturado = nameMatch2[1].trim();
        else if (nameMatch3 && !datos.nombre) {
            const candidato = nameMatch3[1].trim();
            const primeraPalabra = candidato.split(' ')[0];
            // Solo capturar si la primera palabra no está en la lista negra
            if (!blacklist.some(b => b.toLowerCase() === primeraPalabra.toLowerCase())) {
                nombreCapturado = candidato;
            }
        }

        if (nombreCapturado) {
            // Auto-capitalizar cada palabra
            datos.nombre = nombreCapturado.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
        
        // 📞 TELÉFONO: 10 dígitos con posibles separadores
        const phoneMatch = msg.match(/(\d[\d\s\-]{8,}\d)/);
        if (phoneMatch) {
            const tel = phoneMatch[1].replace(/[\s\-]/g, '');
            if (tel.length >= 10) datos.telefono = tel;
        }
        
        // 📧 EMAIL
        const emailMatch = msg.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
        if (emailMatch) datos.email = emailMatch[1].toLowerCase();
        
        // 🔢 NSS: 11 dígitos (solo si menciona "nss")
        if (msg.toLowerCase().includes('nss')) {
            const nssMatch = msg.match(/\b(\d{11})\b/);
            if (nssMatch) datos.nss = nssMatch[1];
        }
        
        // 🪪 CURP: 18 caracteres (solo si menciona "curp")
        if (msg.toLowerCase().includes('curp')) {
            const curpMatch = msg.match(/\b([A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d)\b/i);
            if (curpMatch) datos.curp = curpMatch[1].toUpperCase();
        }
        
        // 🏛️ RFC: formato estándar
        const rfcMatch = msg.match(/\b([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})\b/i);
        if (rfcMatch) datos.rfc = rfcMatch[1].toUpperCase();
        
        // 👥 REFERIDO: Detección flexible (v16.10.18 - Sin palabras clave)
        // Opción 1: Con palabras clave (bidireccional)
        const refMatch1 = msg.match(/(?:recomendó|refirió|mandó|vengo\s+de\s+parte\s+de)\s+([A-ZÁÉÍÓÚñ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚñ][a-záéíóúñ]+)*)/i);
        const refMatch2 = msg.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:me\s+recomendó|me\s+refirió|me\s+mandó|me\s+invitó)/i);

        // Opción 2: Si el mensaje es SOLO un nombre (1-4 palabras capitalizadas, sin verbos)
        // Ej: "Josefina", "el señor Juan", "la señora María Ortiz"
        const esSoloNombre = msg.length < 60 &&
                             !msg.match(/(?:quiero|deseo|necesito|busco|voy|venimos|fui|fue)/i) &&
                             msg.match(/^(?:el\s+|la\s+|los\s+|las\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3}$/i);

        // Opción 3: Verificar si viene de una pregunta de referido en el historial
        const lastBotMsg = (app.state.chatHistory || []).filter(m => m.role === 'assistant').pop();
        const botPreguntoReferido = lastBotMsg && lastBotMsg.content &&
            lastBotMsg.content.match(/(?:quién\s+te\s+refirió|de\s+parte\s+de\s+quién|quién\s+te\s+mandó|referido|recomendó)/i);

        if (refMatch1) {
            datos.referido_por = refMatch1[1].trim();
            console.log('👥 [REFERIDO] Detectado (patrón 1 - keyword):', datos.referido_por);
        } else if (refMatch2) {
            datos.referido_por = refMatch2[1].trim();
            console.log('👥 [REFERIDO] Detectado (patrón 2 - inverso):', datos.referido_por);
        } else if (esSoloNombre && botPreguntoReferido) {
            // El usuario respondió con solo el nombre después de que el bot preguntó
            datos.referido_por = msg.trim();
            console.log('👥 [REFERIDO] Detectado (respuesta directa):', datos.referido_por);
        } else if (esSoloNombre && !datos.nombre) {
            // Si no hay nombre aún y es solo un nombre, asumimos que es el referido
            // (el nombre del usuario ya debería haberse capturado antes)
            if ((app.state.leadVector?.nombre || app.data.Leads?.find(l => l.id_visitante === app.agents.getVisitorId())?.nombre)) {
                datos.referido_por = msg.trim();
                console.log('👥 [REFERIDO] Detectado (nombre sin contexto):', datos.referido_por);
            }
        }
        
        // Guardar si hay datos útiles (v16.10.18 - Guardado Inteligente)
        if (Object.keys(datos).length > 0) {
            console.log('🎯 [INTENT] Datos detectados:', datos);

            // Sincronizar con el Vector de Sesión
            if (!app.state.leadVector) {
                const saved = localStorage.getItem(`suit_lead_vec_${app.agents.getVisitorId()}`);
                app.state.leadVector = saved ? JSON.parse(saved) : {};
            }

            // Merge de los nuevos datos capturados al vector
            app.state.leadVector = { ...app.state.leadVector, ...datos };

            // Persistencia del vector en localStorage
            localStorage.setItem(`suit_lead_vec_${app.agents.getVisitorId()}`, JSON.stringify(app.state.leadVector));

            // 🛑 NO guardar inmediatamente - esperar a tener datos completos
            // Guardar solo si tenemos nombre + (telefono O email)
            const tieneNombre = !!app.state.leadVector.nombre;
            const tieneContacto = !!app.state.leadVector.telefono || !!app.state.leadVector.email;

            if (tieneNombre && tieneContacto) {
                console.log('✅ [INTENT] Datos completos, disparando guardado...');
                app.agents.saveLead(app.state.leadVector);
            } else {
                console.log('⏳ [INTENT] Esperando más datos (nombre:', tieneNombre, '| contacto:', tieneContacto, ')');
            }
        }
    },

    saveLead: async (leadData) => {
        const vid = app.agents.getVisitorId();
        // 🛡️ CERROJO POR VISITANTE (no por contenido): Cualquier disparo del mismo
        // visitante en menos de 6s se bloquea, sin importar si trae email, nombre o teléfono.
        const ahora = Date.now();
        const tiempoUltimo = app.state._lastLeadTime?.[vid] || 0;
        const VENTANA_MS = 6000; // 6s: cubre processIntent + saveMemory (1.5s delay) + margen

        if (app.state._isSavingLead) {
            console.warn(`⛔ [SAVE_LEAD] Cerrojo activo para ${vid}. Ignorando disparo duplicado.`);
            return;
        }
        if ((ahora - tiempoUltimo) < VENTANA_MS) {
            console.log(`🛑 [SAVE_LEAD] Ventana de ${VENTANA_MS/1000}s activa para ${vid}. Disparo ignorado.`);
            return;
        }

        app.state._isSavingLead = true;
        if (!app.state._lastLeadTime) app.state._lastLeadTime = {};
        app.state._lastLeadTime[vid] = ahora;

        // Asegurar que el vector esté inicializado si saveLead se llama externamente
        const finalData = { ...(app.state.leadVector || {}), ...leadData };
        
        console.log('💾 [SAVE_LEAD] Procesando Vector Atómico:', finalData);
        try {
            console.log('🔑 [SAVE_LEAD] Visitante ID:', vid);
            
            // BUSCAR por id_visitante PRIMERO (cache local)
            let existe = (app.data.Leads || []).find(l => String(l.id_visitante) === String(vid));
            console.log('🔍 [SAVE_LEAD] Búsqueda en cache:', existe ? `Encontrado: ${existe.id_lead}` : 'No encontrado');
            console.log('🔍 [SAVE_LEAD] Leads en cache:', app.data.Leads?.length || 0, 'registros');

            // Si no está en cache, consultar backend (SIEMPRE)
            if (!existe && vid) {
                console.log('🌐 [SAVE_LEAD] Consultando backend para id_visitante:', vid, '| id_empresa:', app.state.companyId);
                try {
                    const res = await fetch(app.apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                            action: 'getLeadByVisitor',
                            id_visitante: vid,
                            id_empresa: app.state.companyId,
                            token: app.apiToken
                        })
                    });
                    const data = await res.json();
                    console.log('🌐 [SAVE_LEAD] Respuesta backend:', JSON.stringify(data));
                    if (data.success && data.lead) {
                        existe = data.lead;
                        console.log('✅ [SAVE_LEAD] Encontrado en backend:', existe.id_lead);
                    }
                } catch (e) { 
                    console.warn('⚠️ [SAVE_LEAD] Backend no respondió (normal si no existe)'); 
                }
            }
            
            // Preparar datos (merge) — String() defensivo por datos numéricos de GSheets
            // 🛡️ VALIDACIÓN: Si existe.nombre parece asunto (empieza con verbo), usar finalData
            const nombreCorrupto = existe?.nombre && existe.nombre.match(/^(?:Deseo|Quiero|Necesito|Solicito|Busco|Aumentar|Obtener)/i);
            const nombre   = String(finalData.nombre || (nombreCorrupto ? '' : existe?.nombre) || '').trim();
            const telefono = String(finalData.telefono || existe?.telefono || '').replace(/[\s\-]/g, '');
            const email    = String(finalData.email    || existe?.email    || '').toLowerCase().trim();
            const nss      = String(finalData.nss      || existe?.nss      || '').trim();
            const rfc      = String(finalData.rfc      || existe?.rfc      || '').trim();
            const curp     = String(finalData.curp     || existe?.curp     || '').trim();
            const referido = String(finalData.referido_por || existe?.referido_por || '').trim();
            const fechaNac = String(finalData.fecha_nacimiento || existe?.fecha_nacimiento || '').trim();

            // 📅 FORMATO EDAD: "Fecha , Edad" (Solicitud de Usuario)
            let edadValue = '';
            const numEdad = finalData.edad ?? existe?.edad ?? '';
            if (fechaNac && numEdad) {
                edadValue = `${fechaNac} , ${numEdad}`;
            } else {
                edadValue = numEdad;
            }

            // 📝 BODY
            const body = String(finalData.body || existe?.body || '').trim();

            // 🔍 DEBUG: Verificar origen de datos (v16.10.17)
            console.log('🔬 [DEBUG] finalData.email:', finalData.email, '| existe.email:', existe?.email, '| email final:', email);
            console.log('🔬 [DEBUG] finalData.referido_por:', finalData.referido_por, '| existe.referido_por:', existe?.referido_por, '| referido final:', referido);
            if (nombreCorrupto) console.warn('⚠️ [SAVE_LEAD] Lead corrupto detectado, usando nombre del vector:', nombre);

            // Calcular nivel CRM
            let nivel_crm = 'FRIO';
            if (nombre && telefono) nivel_crm = 'TIBIO';
            if (nombre && (telefono || email)) nivel_crm = 'CALIENTE';
            
            if (existe) {
                // ♻️ ACTUALIZAR (v16.10.17 - Payload Normalizado + Fecha Forzada)
                console.log(`♻️ [SAVE_LEAD] Actualizando: ${existe.id_lead} → ${nivel_crm}`);
                const payload = {
                    id_lead:          existe.id_lead,
                    id_visitante:     existe.id_visitante || vid,
                    nombre:           nombre,
                    telefono:         telefono,
                    email:            email || undefined,  // Forzar inclusión si existe
                    nss:              nss,
                    rfc:              rfc,
                    curp:             curp,
                    body:             body,
                    referido_por:     referido || undefined,  // Forzar inclusión si existe
                    fecha_nacimiento: fechaNac || undefined,
                    edad:             edadValue !== '' ? edadValue : undefined,
                    nivel_crm:        nivel_crm,
                    status:           existe.status || 'NUEVO',
                    fecha:            new Date().toISOString()  // Forzar fecha de actualización
                };
                // Eliminar campos vacíos (null/undefined/'') antes de enviar
                Object.keys(payload).forEach(k => {
                    if (payload[k] === null || payload[k] === '' || payload[k] === undefined) {
                        delete payload[k];
                    }
                });
                console.log('📦 [PAYLOAD UPDATE] Enviando:', JSON.stringify(payload, null, 2));

                // 📤 Enviar UPDATE al backend
                const updateBody = {
                    action: 'updateLead',
                    lead: payload,
                    token: app.apiToken,
                    id_empresa: app.state.companyId
                };
                console.log('📤 [SAVE_LEAD] Body completo:', JSON.stringify(updateBody));

                const updateRes = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(updateBody)
                });
                const updateData = await updateRes.json();
                console.log('📥 [SAVE_LEAD] Respuesta backend:', JSON.stringify(updateData));

                if (!updateData.success) {
                    console.error('❌ [SAVE_LEAD] Backend rechazó el update:', updateData.error || JSON.stringify(updateData));

                    // --- 🚁 FALLBACK DE RESCATE (v16.10.26) ---
                    if (JSON.stringify(updateData).includes("ACTION_WAITING")) {
                        console.warn("⚠️ [SAVE_LEAD] Backend no reconoce acción, intentando createLead...");
                        const createBody = {
                            action: 'createLead',
                            lead: payload,
                            token: app.apiToken,
                            id_empresa: app.state.companyId
                        };
                        const createRes = await fetch(app.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain' },
                            body: JSON.stringify(createBody)
                        });
                        const createData = await createRes.json();
                        console.log('📥 [SAVE_LEAD] Respuesta createLead:', JSON.stringify(createData));
                    }
                } else {
                    // Actualizar cache solo si backend confirmó
                    const idx = app.data.Leads.findIndex(l => l.id_lead === existe.id_lead);
                    if (idx >= 0) app.data.Leads[idx] = { ...existe, ...payload };
                    console.log(`✅ [SAVE_LEAD] Lead actualizado en GSheets: ${JSON.stringify(payload)}`);
                }
                
            } else {
                // 🆕 CREAR NUEVO (v16.10.17 - Payload Normalizado + Debug)
                console.log(`🆕 [SAVE_LEAD] Creando nuevo lead → ${nivel_crm}`);
                const payload = {
                    id_lead: `LEAD-${Date.now()}`,
                    id_empresa: app.state.companyId,
                    id_visitante: vid,
                    nombre: nombre,
                    telefono: telefono,
                    email: email || undefined,  // Forzar inclusión
                    nss: nss,
                    rfc: rfc,
                    curp: curp,
                    body: body,
                    referido_por: referido || undefined,  // Forzar inclusión
                    fecha_nacimiento: fechaNac || undefined,
                    edad: edadValue,
                    status: 'NUEVO',
                    nivel_crm: nivel_crm,
                    fecha: new Date().toISOString()
                };
                // Eliminar campos vacíos antes de enviar
                Object.keys(payload).forEach(k => {
                    if (payload[k] === null || payload[k] === '' || payload[k] === undefined) {
                        delete payload[k];
                    }
                });
                console.log('📦 [PAYLOAD CREATE] Enviando:', JSON.stringify(payload, null, 2));
                
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify({ 
                        action: 'createLead', 
                        lead: payload, 
                        token: app.apiToken 
                    })
                });
                
                app.data.Leads.push(payload);
                app.state.currentLeadId = payload.id_lead;
                
                console.log(`✅ [SAVE_LEAD] Creado: ${payload.id_lead}`);
            }
            
        } catch (err) { 
            console.error('❌ [SAVE_LEAD] Error:', err);
        } finally {
            // Liberar cerrojo con pequeño delay para asegurar propagación de estado
            setTimeout(() => { app.state._isSavingLead = false; }, 500);
        }
    },

    // --- DEBUG DESDE CONSOLA (v16.10.18) ---
    debugLead: (vid) => {
        console.log('🔍 [DEBUG LEAD] Buscando:', vid);
        console.log('📦 Vector:', app.state.leadVector);
        console.log('💾 localStorage:', JSON.parse(localStorage.getItem('suit_lead_vec_' + vid)));
        const enCache = (app.data.Leads || []).find(l => String(l.id_visitante) === String(vid));
        console.log('📋 En cache:', enCache);
        fetch(app.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'getLeadByVisitor', id_visitante: vid, id_empresa: app.state.companyId, token: app.apiToken })
        }).then(r => r.json()).then(d => console.log('🌐 Backend:', d));
    },

    // --- GUARDADO MANUAL DESDE CONSOLA (v16.10.18) ---
    forceSave: () => {
        if (app.state.leadVector && Object.keys(app.state.leadVector).length > 0) {
            console.log('💾 [FORCE_SAVE] Guardando vector:', app.state.leadVector);
            app.agents.saveLead(app.state.leadVector);
        } else {
            console.warn('⚠️ [FORCE_SAVE] No hay datos en el vector');
        }
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

        const company = (app.data.Config_Empresas || []).find(c => c.id_empresa === app.state.companyId);
        const rawList = (company?.usa_soporte_ia || 'openai/gpt-3.5-turbo').toString().split(',').map(m => m.trim()).filter(m => m && m.toUpperCase() !== 'NO' && m.toUpperCase() !== 'TRUE' && m.toUpperCase() !== 'FALSE');
        const modelList = rawList.map(m => app.agents.normalizeModelName(m));
        const currentModel = app.state._aiModel || localStorage.getItem('evasol_ai_model') || modelList[0];

        try {
            // v17.0.0: Usar Proxy Seguro en lugar de llamada directa
            const res = await fetch("/api/ai/chat", {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: currentModel,
                    messages: [{ role: "user", content: "ping" }]
                })
            });
            const data = await res.json();
            const isOk = res.ok && (data.choices && data.choices[0] || data.id); // Algunos modelos devuelven ID directo
            if (isOk) {
                app.state._aiModel = currentModel;
                localStorage.setItem('evasol_ai_model', currentModel);
                circle.className = 'ai-status-circle online';
                circle.title = `IA Conectada (${currentModel})`;
            } else {
                console.warn(`[AI_HEALTH] Model ${currentModel} failed. Rotating...`);
                let found = false;
                for (let m of modelList) {
                    if (m === currentModel) continue;
                    try {
                        const testRes = await fetch("/api/ai/chat", {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                model: m,
                                messages: [{ role: "user", content: "ping" }]
                            })
                        });
                        const testData = await testRes.json();
                        if (testRes.ok && (testData.choices && testData.choices[0] || testData.id)) {
                            app.state._aiModel = m;
                            localStorage.setItem('evasol_ai_model', m);
                            circle.className = 'ai-status-circle online';
                            circle.title = `IA Reconectada (${m})`;
                            app.ui.updateConsole(`AI_ROTATED_TO: ${m}`);
                            found = true;
                            break;
                        }
                    } catch (e) { }
                }
                if (!found) {
                    circle.className = 'ai-status-circle offline';
                    circle.title = 'IA Desconectada (Todos los modelos fallaron).';
                    app.ui.updateConsole('AI_TOTAL_FAIL', true);
                }
            }
        } catch (e) {
            circle.className = 'ai-status-circle offline';
            circle.title = 'Error de Red: No hay respuesta del backend.';
            app.ui.updateConsole('AI_NET_ERR', true);
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
    },

    callOpenRouterAI: async (model, userMessage, promptBase) => {
        try {
            // 1. Preparar Mensajes
            const messages = [
                { role: "system", content: promptBase },
                ...app.state.chatHistory.map(h => ({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.content
                })),
                { role: "user", content: userMessage }
            ];

            // 2. Ejecutar Llamada a través del Proxy Seguro del Servidor (v17.0.0)
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return {
                    success: true,
                    answer: data.choices[0].message.content
                };
            } else {
                return {
                    success: false,
                    error: data.error?.message || "Error desconocido a través del Proxy local."
                };
            }
        } catch (e) {
            console.error("[PROXY_AI_ERROR]", e);
            return { success: false, error: "Fallo de comunicación con el Proxy de Seguridad local." };
        }
    }
};
