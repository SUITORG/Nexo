/**
 * EVASOL - PUBLIC MODULE (v4.6.7)
 * Responsabilidad: Vistas p├║blicas, Landing Page, SEO, Men├║ y ├ôrbita.
 */
app.public = {
    // --- INFO MODALS ---
    showAboutUs: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('about-content');
        if (content && company) {
            // Social Links HTML
            let socialHtml = '';
            if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" style="color:#1877F2; font-size:1.5rem;"><i class="fab fa-facebook"></i></a>`;
            if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" style="color:#E4405F; font-size:1.5rem;"><i class="fab fa-instagram"></i></a>`;
            if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" style="color:#000000; font-size:1.5rem;"><i class="fab fa-tiktok"></i></a>`;

            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${company.logo_url ? app.utils.fixDriveUrl(company.logo_url) : ''}" style="max-width: 120px; border-radius: 12px; margin-bottom: 10px;">
                    <h2 style="color: var(--primary-color); margin:0;">${company.nomempresa}</h2>
                    <p style="font-style: italic; color: #666; font-size: 0.9rem;">"${company.slogan || ''}"</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fas fa-info-circle"></i> Acerca de</h4>
                        <p style="font-size: 0.9rem; line-height: 1.4;">${company.descripcion || 'Informaci├│n no disponible.'}</p>
                    </div>
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fab fa-whatsapp"></i> WhatsApp</h4>
                        <p><a href="https://wa.me/${company.telefonowhatsapp}" target="_blank" style="color: inherit; text-decoration: none;">+${company.telefonowhatsapp || '-'}</a></p>
                    </div>
                    ${socialHtml ? `
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 10px;"><i class="fas fa-share-alt"></i> Redes Sociales</h4>
                        <div style="display: flex; gap: 20px;">${socialHtml}</div>
                    </div>` : ''}
                </div>`;
        }
        const modal = document.getElementById('about-modal-overlay');
        if (modal) modal.classList.remove('hidden');
    },

    showPolicies: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('policies-content');
        if (content) {
            content.innerHTML = `
                <div style="max-height: 400px; overflow-y: auto; padding-right: 15px;">
                    <section style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">1. PROTECCI├ôN DE DATOS</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">${company?.nomempresa || 'La empresa'} garantiza que sus datos personales son tratados bajo estrictas medidas de seguridad.</p>
                    </section>
                    <section style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">2. T├ëRMINOS COMERCIALES</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">Toda orden genera un compromiso de servicio. Precios incluyen impuestos.</p>
                    </section>
                    <section>
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">3. POL├ìTICAS PERSONALIZADAS</h4>
                        <p style="font-size: 0.85rem; color: #444; line-height: 1.4; white-space: pre-wrap;">${company?.politicas || 'Pol├¡ticas base del sistema activas.'}</p>
                    </section>
                </div>`;
        }
        const modal = document.getElementById('policies-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },

    showReviews: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('reviews-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <h2 style="color:var(--primary-color); margin-bottom:5px;">${company?.nomempresa || 'Negocio'}</h2>
                    <div style="color:gold; font-size:1.5rem; margin-bottom:20px;">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                        <span style="color:#666; font-size:1rem; margin-left:10px;">4.8/5</span>
                    </div>
                    <div style="text-align:left; display:flex; flex-direction:column; gap:15px;">
                        <div style="background:#f9f9f9; padding:15px; border-radius:10px; border-left:4px solid var(--primary-color);">
                            <p style="margin:0; font-style:italic; font-size:0.9rem;">"Excelente servicio y calidad en los productos. Altamente recomendados."</p>
                            <small style="display:block; margin-top:5px; color:#888;">- Juan P├®rez</small>
                        </div>
                    </div>
                </div>`;
        }
        const modal = document.getElementById('reviews-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },

    showLocation: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('location-content');
        if (content && company) {
            const address = company.direccion || "Direcci├│n no disponible.";
            const mapUrl = company.ubicacion_url || "";

            let mapIframe = `<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height:250px; display:flex; align-items:center; justify-content:center; border-radius:12px; margin-bottom:20px; color:#adb5bd; flex-direction:column; border: 1px solid #dee2e6;">
                                <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom:15px; color: var(--accent-color);"></i>
                                <p style="font-weight:700; color:#495057;">Mapa Interactivo</p>
                                <p style="font-size:0.8rem; padding: 0 40px; text-align: center; line-height: 1.4;">Para ver el mapa interactivo aqu├¡, usa el enlace de "Insertar Mapa" (Embed) de Google Maps.</p>
                             </div>`;

            if (mapUrl.includes('google.com/maps/embed') || mapUrl.includes('https://www.google.com/maps/embed')) {
                mapIframe = `<iframe 
                    src="${mapUrl}" 
                    width="100%" height="350" style="border:0; border-radius:12px; margin-bottom:20px;" 
                    allowfullscreen="" loading="lazy"></iframe>`;
            }

            content.innerHTML = `
                <div style="text-align: center;">
                    ${mapIframe}
                    <h3 style="color:var(--primary-color); margin-bottom:5px;">Vis├¡tanos en:</h3>
                    <p style="font-size:1.1rem; color:#444; margin-bottom:20px; line-height: 1.5;">${address}</p>
                    <a href="${mapUrl}" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none; padding:12px 25px; font-size:1rem; border-radius: 50px;">
                        <i class="fas fa-map-marker-alt"></i> Abrir en Google Maps
                    </a>
                </div>`;
        }
        const modal = document.getElementById('location-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },



    closeInfoModal: (modalId) => {
        const el = document.getElementById(modalId);
        if (el) el.classList.add('hidden');
        app.public.stopInfoInactivityTimer();
    },

    _infoTimer: null,
    startInfoInactivityTimer: () => {
        app.public.stopInfoInactivityTimer();
        let seconds = 30;
        app.public._infoTimer = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                app.public.stopInfoInactivityTimer();
                document.querySelectorAll('.modal-overlay').forEach(m => {
                    if (['about-modal-overlay', 'policies-modal-overlay', 'reviews-modal-overlay', 'location-modal-overlay'].includes(m.id)) {
                        m.classList.add('hidden');
                    }
                });
                window.location.hash = '#home';
            }
        }, 1000);

        const resetFn = () => { seconds = 30; };
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
            m.addEventListener('mousemove', resetFn, { once: true });
            m.addEventListener('click', resetFn, { once: true });
        });
    },

    stopInfoInactivityTimer: () => {
        if (app.public._infoTimer) clearInterval(app.public._infoTimer);
        app.public._infoTimer = null;
    },

    // --- RENDERERS ---
    renderHome: (companyData) => {
        const rawId = (app.state.companyId || "").toString().trim().toUpperCase();
        const urlId = rawId; // ID T├®cnico (ej: ROBERTO_V)
        
        const company = companyData || app.data.Config_Empresas.find(c => {
            const cId = String(c.id_empresa || "").toUpperCase();
            const cAlias = String(c.alias_seo || "").toUpperCase();
            return cId === urlId || cAlias === urlId || cId.replace(/_/g, "") === urlId.replace(/_/g, "");
        });

        if (!company) return console.error("[RENDER_HOME] No company data found for ID:", rawId);

        // --- DYNAMIC CONTENT ENGINE (v6.5.2) ---
        const rawHash = window.location.hash.replace('#', '') || 'home';
        const hash = rawHash.trim().toLowerCase();
        
        const pageData = (app.data.Config_Paginas || []).find(p => {
            const pCoId = String(p.id_empresa || "").toUpperCase();
            const pPgId = String(p.id_pagina || "").trim().toLowerCase();
            // Comparaci├│n robusta (soporta ROBERTOV y ROBERTO_V)
            return (pCoId === urlId || pCoId.replace(/_/g, "") === urlId.replace(/_/g, "")) && pPgId === hash;
        });

        // Si es una sub-p├ígina din├ímica (no home)
        if (pageData && hash !== 'home') {
            const heroBanner = document.getElementById('hero-banner-main');
            const personalNode = document.getElementById('hero-personal-node');
            if (heroBanner) heroBanner.style.display = 'none';
            if (personalNode) personalNode.style.display = 'none';
            
            // Forzar visibilidad de la secci├│n home ya que el contenido din├ímico vive dentro
            const viewHome = document.getElementById('view-home');
            if (viewHome) {
                viewHome.classList.remove('hidden');
                viewHome.style.display = 'block';
            }

            app.public.renderDynamicContent(pageData);
            return; 
        }

        // Renderizado HOME Est├índar (PFM/PMP/Industrial)
        const bizType = (company.tipo_negocio || "").toString().toUpperCase();
        const isFood = ['ALIMENTOS', 'COMIDA', 'RESTAURANTE', 'FOOD'].some(k => bizType.includes(k));
        const isPersonal = bizType.includes("MARCA PERSONAL");
        app.state.isFood = isFood;

        const sloganEl = document.getElementById('hero-slogan');
        const subEl = document.getElementById('hero-sub');
        const heroBanner = document.getElementById('hero-banner-main');
        const personalNode = document.getElementById('hero-personal-node');
        const actions = document.getElementById('hero-actions-container');
        const menuPublic = document.getElementById('menu-public');

        // --- L├ôGICA DE IDENTIDAD (v6.6.0) ---
        if (isPersonal) {
            document.body.classList.add('is-personal-brand');
            if (personalNode) {
                personalNode.innerHTML = `
                    <div class="ui-container" style="min-height:92vh; display:flex; align-items:center; padding-top:100px; padding-bottom:100px; background:var(--personal-bg);">
                        <div class="ui-grid" style="align-items:center; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));">
                            <!-- LADO IZQUIERDO: FOTO + QR IZQUIERDO -->
                            <div class="personal-left ui-overlay-container" style="position:relative; width:100%; max-width:620px; justify-self: center; border-radius:32px; box-shadow:0 40px 80px rgba(0,0,0,0.22); overflow:hidden;">
                                <img src="${app.utils.fixDriveUrl(company.foto_agente || company.logo_url)}" alt="${company.nomempresa}" style="width:100%; display:block; border-radius:32px; transition: transform 0.5s ease;">
                                <div class="ui-overlay-full" style="padding: 40px; display:flex; flex-direction:column; justify-content:space-between;">
                                    <!-- SUPERIOR IZQUIERDA: NOMBRE EMPRESA -->
                                    <div class="ui-text-premium" style="align-self:flex-start; font-size:var(--font-size-small); text-transform:uppercase; border-left:4px solid var(--accent-color, #ffd700); padding-left:14px; letter-spacing:1px; background:rgba(0,0,0,0.4); padding-right:10px; border-radius:0 20px 20px 0;">${company.nomempresa}</div>
                                    
                                    <!-- CENTRO: MENSAJE 1 -->
                                    <div class="ui-text-premium" style="align-self:center; text-align:center; font-size:var(--font-size-h2); line-height:1.1; width:90%;">${company.mensaje1 || ''}</div>
                                    
                                    <!-- INFERIOR DERECHA: MENSAJE 2 (Restored) -->
                                    <div class="ui-text-premium" style="align-self:flex-end; text-align:right; font-size:var(--font-size-h3); color:var(--accent-color, #ffd700); opacity:1; filter: drop-shadow(0 2px 10px rgba(0,0,0,0.8));">${company.mensaje2 || ''}</div>
                                </div>
                                <!-- QR OFICIAL IZQUIERDO (v6.6.1) -->
                                <div class="banner-qr-official" style="position:absolute; bottom:20px; left:20px; background:white; padding:10px; border-radius:15px; display:flex; flex-direction:column; align-items:center; pointer-events:auto; cursor:help; box-shadow:0 15px 35px rgba(0,0,0,0.3); z-index:20; border: 1px solid rgba(0,0,0,0.05);">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + window.location.pathname)}" style="width:45px; height:45px; image-rendering:pixelated;">
                                    <span style="font-size:0.5rem; color:#000; font-weight:900; text-transform:uppercase; margin-top:5px; letter-spacing:0.5px;">${company.nomempresa}</span>
                                </div>
                            </div>
                            <!-- LADO DERECHO: SLOGAN + CONFIG_PAGINAS -->
                            <div class="personal-right" style="display:flex; flex-direction:column; gap:var(--ui-gap); text-align:left; max-width: 650px; justify-self: start;">
                                <h1 class="ui-text-premium" style="font-size:var(--font-size-h1); color: #111; line-height:1; margin:0; letter-spacing:-1px;">${company.slogan || company.nomempresa}</h1>
                                
                                ${pageData ? `
                                    <div class="personal-dynamic-content" style="display:flex; flex-direction:column; gap:15px;">
                                        ${pageData.subtitulo ? `<h2 style="font-size:var(--font-size-h3); color:var(--primary-color); margin:0;">${pageData.subtitulo}</h2>` : ''}
                                        <div style="font-size:var(--font-size-body); line-height:1.8; color:#333; opacity:0.9;">
                                            ${pageData.contenido || company.descripcion || ''}
                                        </div>
                                    </div>
                                ` : `
                                    <p style="font-size:var(--font-size-body); line-height:1.8; color:#333; margin:0; opacity:0.9;">${company.descripcion || 'Especialista en soluciones integrales.'}</p>
                                `}

                                <div class="hero-actions" style="display:flex; gap:20px; margin-top:15px;">
                                    <button class="btn-primary" style="padding: 20px 45px; border-radius: 50px; font-weight:800; font-size:1.1rem; box-shadow: 0 15px 30px var(--primary-color)44;" onclick="window.location.hash='#contact'">Agendar Consulta</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                personalNode.style.display = 'block';
            }
            if (heroBanner) heroBanner.style.display = 'none';
        } else {
            document.body.classList.remove('is-personal-brand');
            if (personalNode) personalNode.style.display = 'none';
            if (heroBanner) {
                heroBanner.classList.remove('hidden');
                heroBanner.style.display = 'block';
                const bgUrl = company.foto_agente || company.logo_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
                heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('${app.utils.fixDriveUrl(bgUrl)}')`;
                heroBanner.style.backgroundSize = 'cover';

                // Inyectar QR Oficial + NomEmpresa en Banner Est├índar
                if (!heroBanner.querySelector('.banner-qr-official')) {
                    const qrBox = document.createElement('div');
                    qrBox.className = 'banner-qr-official';
                    qrBox.style.cssText = "position:absolute; bottom:30px; left:30px; background:white; padding:8px; border-radius:12px; display:flex; flex-direction:column; align-items:center; gap:4px; box-shadow:0 10px 40px rgba(0,0,0,0.5); z-index:10; border:1px solid #eee;";
                    qrBox.innerHTML = `
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + window.location.pathname)}" style="width:65px; height:65px; image-rendering:pixelated;">
                        <span style="color:black; font-size:0.6rem; font-weight:900; text-transform:uppercase; letter-spacing:0.5px;">${company.nomempresa}</span>
                    `;
                    heroBanner.appendChild(qrBox);
                }
            }
        }

        if (sloganEl) sloganEl.innerText = company.slogan || company.nomempresa;
        if (subEl) subEl.innerText = company.mensaje1 || company.descripcion || "Bienvenido.";
        
        if (actions && !isPersonal) {
            actions.innerHTML = isFood ? 
                `<button class="btn-primary" onclick="window.location.hash='#food-app-area'"><i class="fas fa-utensils"></i> Men├║ Digital</button>` :
                `<button class="btn-primary" onclick="window.location.hash='#contact'">Contactar</button>`;
        }

        if (menuPublic) {
            const isIsolated = (company.is_isolated === 'TRUE' || company.is_isolated === true || company.is_isolated === "1");
            menuPublic.innerHTML = `
                ${!isIsolated ? '<li><a href="#orbit"><i class="fas fa-planet-ring"></i> Hub</a></li>' : ''}
                <li><a href="#home">Inicio</a></li>
                ${isFood ? '<li><a href="#food-app-area" class="btn-express-nav"><i class="fas fa-utensils"></i> Pedido Express</a></li>' : ''}
                ${company.formulario ? `<li><a href="#contact">Contacto</a></li>` : ''}
                <li><a href="#login"><i class="fas fa-user-lock"></i> Staff</a></li>
            `;
        }

        // Renderizar Matriz SEO (v6.6.0)
        if (app.public.renderSEO) app.public.renderSEO();

        // AJUSTE DE ESPACIOS INTELIGENTES (v6.6.1)
        const storySection = document.getElementById('dynamic-story-section');
        const gallerySection = document.getElementById('company-gallery-section');
        if (gallerySection) {
            // Si la secci├│n de historia est├í oculta, pegamos la galer├¡a a la matriz SEO
            if (!storySection || storySection.classList.contains('hidden')) {
                gallerySection.style.marginTop = "var(--ui-gap, 32px)";
                gallerySection.style.borderTop = "none";
                gallerySection.style.paddingTop = "0";
            } else {
                gallerySection.style.marginTop = "var(--ui-section-margin, 100px)";
            }
        }
    },

    renderDynamicContent: (pageData) => {
        const section = document.getElementById('dynamic-story-section');
        if (!section || !pageData) return;

        try {
            // Mapeo Inteligente de Campos (v6.5.2)
            const rawContent = typeof pageData.contenido_json === 'string' ? JSON.parse(pageData.contenido_json) : pageData.contenido_json;
            const content = {};
            // Normalizar a min├║sculas para b├║squeda f├ícil
            Object.keys(rawContent).forEach(k => content[k.toLowerCase()] = rawContent[k]);

            const h2 = document.getElementById('story-h2');
            const h3 = document.getElementById('story-h3');
            const body = document.getElementById('story-content');
            const img = document.getElementById('story-img');
            const imgContainer = document.querySelector('.story-image-container');

            if (h2) h2.innerHTML = content.h1 || content.titulo || "Informaci├│n";
            if (h3) h3.innerHTML = content.h2_1 || content.subtitulo || "";
            
            if (body) {
                let txt = content.p_intro || content.texto || content.descripcion || "";
                if (content.p_mision) txt += `<br><br><strong>Misi├│n:</strong> ${content.p_mision}`;
                body.innerHTML = txt || "Contenido disponible pr├│ximamente.";
            }

            if (img) {
                const finalImg = app.utils.fixDriveUrl(content.imagen_url || pageData.foto_url);
                img.src = finalImg;
                if (imgContainer) imgContainer.style.display = finalImg ? 'block' : 'none';
                section.style.gridTemplateColumns = finalImg ? '1fr 1fr' : '1fr';
            }

            section.classList.remove('hidden');
            section.style.display = 'grid';
            section.style.visibility = 'visible';
            section.style.opacity = '1';

        } catch (e) { console.error("[RENDER_DYNAMIC] Error:", e); }
    },

    showReservationModal: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        let overlay = document.getElementById('reservation-modal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'reservation-modal';
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = "1000";
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="modal-content" style="max-width:400px; padding:30px; border-radius:30px;">
                <h2 style="color:var(--primary-color); margin-bottom:10px;"><i class="fas fa-calendar-star"></i> Nueva Reserva</h2>
                <p style="font-size:0.9rem; color:#666; margin-bottom:20px;">Agenda tu cita con ${company.nomempresa} hoy mismo.</p>
                
                <form id="res-form" style="display:flex; flex-direction:column; gap:15px; text-align:left;">
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">D├¡a y Hora</label>
                        <input type="datetime-local" id="res-date" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">Tu Nombre</label>
                        <input type="text" id="res-name" placeholder="┬┐C├│mo te llamas?" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">WhatsApp</label>
                        <input type="tel" id="res-wa" placeholder="Para confirmaci├│n" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">Servicio / Motivo</label>
                        <select id="res-service" style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                            <option>Informaci├│n General</option>
                            <option>Cotizaci├│n</option>
                            <option>Soporte T├®cnico</option>
                        </select>
                    </div>
                    
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('reservation-modal').classList.add('hidden')" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">Confirmar Cita</button>
                    </div>
                </form>
            </div>
        `;

        overlay.classList.remove('hidden');
        document.getElementById('res-form').onsubmit = (e) => {
            e.preventDefault();
            app.public.submitReservation();
        };
    },

    submitReservation: async () => {
        const btn = document.querySelector('#res-form button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "Procesando...";
        btn.disabled = true;

        const data = {
            action: "createReservation",
            reservation: {
                id_empresa: app.state.companyId,
                fecha_cita: document.getElementById('res-date').value,
                nombre_cliente: document.getElementById('res-name').value,
                whatsapp: document.getElementById('res-wa').value,
                servicio: document.getElementById('res-service').value
            }
        };

        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(data)
            });
            const res = await response.json();
            if (res.success) {
                alert("┬íCita agendada con ├®xito! Te contactaremos por WhatsApp.");
                document.getElementById('reservation-modal').classList.add('hidden');
            } else {
                throw new Error(res.error || "Error desconocido");
            }
        } catch (err) {
            alert("Error al reservar: " + err.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    renderSEO: () => {
        const container = document.getElementById('seo-matrix-section');
        if (!container) return;
        const targetId = String(app.state.companyId || "").trim().toUpperCase();
        const company = app.data.Config_Empresas.find(c => c.id_empresa === targetId);
        const seoData = (app.data.Config_SEO || []).filter(item => String(item.id_empresa || "").trim().toUpperCase() === targetId);

        if (seoData.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.style.display = "block";

        const mainTitle = container.querySelector('h2');
        const mainSub = container.querySelector('p');
        if (mainTitle) mainTitle.style.display = 'none';
        if (mainSub) mainSub.style.display = 'none';


        let grid = container.querySelector('.seo-grid');
        if (!grid) {
            container.innerHTML += `<div class="seo-grid ui-grid" style="margin-top: var(--ui-section-margin); padding-bottom: var(--ui-section-margin);"></div>`;
            grid = container.querySelector('.seo-grid');
        } else {
            grid.innerHTML = '';
            grid.className = "seo-grid ui-grid";
            grid.style.marginTop = "var(--ui-section-margin)";
            grid.style.paddingBottom = "var(--ui-section-margin)";
        }

        seoData.sort((a, b) => (parseInt(a.orden) || 99) - (parseInt(b.orden) || 99));

        seoData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feature-card seo-card-premium';

            const brandColor = item.hex_color || 'var(--primary-color)';
            const waNumber = item.wa_directo || company.telefonowhatsapp || '';
            const mail = item.mail_directo || company.email || '';

            const hasPhoto = item.foto_url || item.url_foto || item.imagen_url;
            const bgStyle = hasPhoto ? `background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url('${app.utils.fixDriveUrl(hasPhoto)}'); background-size: cover; background-position: center; border: none;` : `border: 2px solid ${brandColor}; box-shadow: 0 4px 15px ${brandColor}22;`;

            const keywords = (item.keywords_coma || "").split(',').map(k => k.trim()).filter(k => k);
            const keywordHtml = keywords.map(k => `<span class="seo-tag" style="border-color:${brandColor}; color:${hasPhoto ? 'white' : brandColor}; background:${hasPhoto ? 'rgba(255,255,255,0.1)' : brandColor + '11'}">${k}</span>`).join('');

            card.style.cssText = bgStyle;

            card.innerHTML = `
                <div class="seo-card-inner" style="position:relative; height:100%; min-height:520px; display:flex; flex-direction:column; padding:30px; box-sizing:border-box;">
                    <div class="seo-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; margin-bottom:20px; gap:15px;">
                        
                        <!-- LADO IZQUIERDO: QR + ICONOS (v6.6.3 Restored) -->
                        <div style="display:flex; flex-direction:column; align-items:flex-start; gap:12px; z-index:10;">
                            ${waNumber ? `
                                <div class="seo-qr-container" style="background:white; padding:5px; border-radius:10px; box-shadow:0 8px 15px rgba(0,0,0,0.25); border:2px solid ${brandColor}; cursor:pointer;" onclick="event.stopPropagation(); window.open('https://wa.me/${waNumber.toString().replace(/\D/g, '')}?text=Hola! Me interesa informacion de: ${item.titulo}', '_blank')">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://wa.me/' + waNumber.toString().replace(/\D/g, '') + '?text=Hola! Me interesa informacion de: ' + item.titulo)}" 
                                         alt="QR Contacto" style="width:60px; height:60px; display:block; image-rendering:pixelated;">
                                </div>
                            ` : ''}
                            
                            <div style="display:flex; gap:10px; padding-left:5px;">
                                ${mail ? `<a href="mailto:${mail}" class="seo-action-icon" title="Enviar Correo" onclick="event.stopPropagation();" style="font-size:1.2rem; color: ${hasPhoto ? 'white' : brandColor} !important;"><i class="fas fa-envelope"></i></a>` : ''}
                                ${waNumber ? `<a href="https://wa.me/${waNumber.toString().replace(/\D/g, '')}?text=Hola! Me interesa informacion de: ${item.titulo}" target="_blank" class="seo-action-icon" title="WhatsApp Directo" onclick="event.stopPropagation();" style="font-size:1.2rem; color:#25D366 !important;"><i class="fab fa-whatsapp"></i></a>` : ''}
                            </div>
                        </div>

                        <!-- LADO DERECHO: TITULOS E ICONO DE TIPO -->
                        <div style="flex:1; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
                            <div style="background:${brandColor}; color:white; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(0,0,0,0.2);">
                                <i class="${item.icono || 'fas fa-star'}" style="font-size:1.2rem; color:white !important;"></i>
                            </div>
                            <div style="text-align:right;">
                                <h4 style="color:${brandColor}; ${hasPhoto ? 'text-shadow:0 2px 4px rgba(0,0,0,0.8); color:white;' : ''} font-weight:900; margin:0; font-size:1.5rem; line-height:1.1;">
                                    ${item.titulo}
                                </h4>
                                <small style="color:${hasPhoto ? 'rgba(255,255,255,0.9)' : '#888'}; font-size:0.85rem; display:block; margin-top:5px; text-transform:uppercase; letter-spacing:1px; font-weight:700;">${item.division || item.categoria || ''}</small>
                            </div>
                        </div>
                    </div>
                    
                    <p style="font-size:1rem; color:${hasPhoto ? 'white' : '#444'}; margin:20px 0; text-align:left; flex-grow:1; line-height:1.7; opacity:0.95;">${item.descripcion || ''}</p>
                    
                    <!-- KEYWORDS CENTRADAS (v6.6.4 Fixed) -->
                    <div class="seo-tags" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:auto; padding-top:15px; border-top:1px solid ${hasPhoto ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};">
                        ${keywordHtml}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderFoodMenu: () => {
        const container = document.getElementById('food-menu-grid');
        const tabsContainer = document.getElementById('food-category-tabs');
        const searchInput = document.getElementById('food-search-input');
        if (!container) return;

        const render = (searchTerm = "") => {
            container.innerHTML = '';
            if (tabsContainer) tabsContainer.innerHTML = '';
            let items = (app.data.Catalogo || []).filter(p => {
                const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
                const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
                const isActive = p.activo === true || p.activo === "TRUE" || p.activo === "1" || p.activo === 1;
                const matchesSearch = !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                return (pCo === sCo || pCo === "GLOBAL") && isActive && matchesSearch;
            });

            if (items.length === 0) {
                container.innerHTML = `<div class="empty-msg">No hay productos.</div>`;
                return;
            }

            const categories = {};
            items.forEach(p => {
                const cat = (p.categoria || "General").trim();
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            });

            Object.keys(categories).forEach(catName => {
                if (tabsContainer) {
                    const tab = document.createElement('div');
                    tab.className = 'food-tab';
                    tab.innerText = catName;
                    tab.onclick = () => document.getElementById(`cat-${catName}`).scrollIntoView({ behavior: 'smooth' });
                    tabsContainer.appendChild(tab);
                }
                const section = document.createElement('div');
                section.id = `cat-${catName}`;
                section.className = 'food-category-section';
                section.innerHTML = `<h3 class="food-category-title">${catName}</h3><div class="food-grid"></div>`;
                const grid = section.querySelector('.food-grid');

                categories[catName].forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'food-card';
                    const img = p.imagen_url ? app.utils.fixDriveUrl(p.imagen_url) : 'https://lh3.googleusercontent.com/d/1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
                    const price = app.utils.getEffectivePrice(p);
                    const stock = parseInt(p.stock) || 0;
                    const promo = (p.etiqueta_promo || "").toString().trim();

                    card.innerHTML = `
                        <div class="food-img-container">
                            ${promo ? `<div class="promo-ribbon" style="position:absolute; top:10px; left:-5px; background:#f39c12; color:white; padding:2px 10px; font-size:0.6rem; font-weight:bold; z-index:2; border-radius:0 10px 10px 0; box-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${promo}</div>` : ''}
                            <img src="${img}" alt="${p.nombre}" class="food-img">
                        </div>
                        <div class="food-info">
                            <div class="food-title-row">
                                <h3>${p.nombre}</h3>
                                <div class="price">$${price}</div>
                            </div>
                            <p class="food-desc">${p.descripcion || ''}</p>
                            <div class="food-actions">
                                <button onclick="app.pos.removeFromCart('${p.id_producto}')"><i class="fas fa-minus"></i></button>
                                <span class="food-qty" id="qty-${p.id_producto}">${app.state.cart.find(i => i.id === p.id_producto)?.qty || 0}</span>
                                <button onclick="app.pos.addToCart('${p.id_producto}')"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
                container.appendChild(section);
            });
            app.pos.updateCartVisuals();
        };
        render();
        if (searchInput) searchInput.oninput = (e) => render(e.target.value);
    },

    renderOrbit: () => {
        // --- Hub Identity Reset (v5.3.1) ---
        document.title = "SuitOrg | Orbit Hub";
        const hTitle = document.getElementById('header-title');
        const hLogo = document.getElementById('header-logo');
        if (hTitle) hTitle.innerText = "SuitOrg";
        if (hLogo) hLogo.src = "https://lh3.googleusercontent.com/d/1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv";
        document.documentElement.style.setProperty('--primary-color', '#004d40'); // SuitOrg Teal base

        const container = document.getElementById('orbit-bubbles');
        if (!container) return;
        container.innerHTML = '';
        const companies = (app.data.Config_Empresas || []).filter(co => {
            const isHabil = (co.habilitado === 'TRUE' || co.habilitado === true || co.habilitado === "1");
            const isProd = (co.modo === 'PROD');
            // Nota: En la ├ôrbita se ven todos los activos/producci├│n. El aislamiento (is_isolated)
            // solo afecta la salida del sitio hacia el Hub una vez dentro.
            return isHabil && isProd;
        }).sort((a, b) => {
            const aPri = (a.es_principal === 'TRUE' || a.es_principal === true || a.es_principal === "1") ? 1 : 0;
            const bPri = (b.es_principal === 'TRUE' || b.es_principal === true || b.es_principal === "1") ? 1 : 0;
            if (aPri !== bPri) return bPri - aPri; // Principales primero
            return (a.nomempresa || "").localeCompare(b.nomempresa || "");
        });
        const priorityId = app.state.companyId;

        const bubbles = [];
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (app.public._orbitRAF) cancelAnimationFrame(app.public._orbitRAF);

        const screenW = window.innerWidth;
        let scaleFactor = 1.0;
        if (screenW < 768) scaleFactor = 0.4; // M├│vil: -60%
        else if (screenW < 1024) scaleFactor = 0.6; // Tablet: -40%

        companies.forEach((co) => {
            const isPriority = co.id_empresa === priorityId;
            const isEvasol = (co.id_empresa === 'EVASOL' || co.nomempresa.toUpperCase().includes('EVASOL'));

            // --- RESPONSIVE SCALING (v5.8.8) ---
            const baseSize = isEvasol ? 220 : 180;
            const size = baseSize * scaleFactor;
            const radius = size / 2;

            const bubbleEl = document.createElement('div');
            bubbleEl.className = `enterprise-bubble ${isPriority ? 'priority' : 'shaded'}`;
            const themeColor = co.color_tema || '#00d2ff';
            const gradient = isEvasol
                ? `radial-gradient(circle at 30% 30%, ${themeColor}, #000, #001a14)`
                : `radial-gradient(circle at 30% 30%, ${themeColor}, #000)`;

            const evasolStyles = isEvasol ? `
                box-shadow: 0 0 ${50 * scaleFactor}px rgba(0, 255, 157, 0.4), inset 0 0 ${20 * scaleFactor}px rgba(255,255,255,0.1); 
                border: ${2 * scaleFactor}px solid rgba(0, 255, 157, 0.6); 
                z-index: 50;
            ` : `box-shadow: 0 ${10 * scaleFactor}px ${30 * scaleFactor}px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);`;

            bubbleEl.style.cssText = `width:${size}px; height:${size}px; --accent-color:${themeColor}; background:${gradient}; position:absolute; animation:none; transform:none; transition:none; ${evasolStyles}`;


            const bubbleImg = co.logo_url || co.url_logo || co.foto_agente || '';
            const logoFilter = isEvasol ? `filter: drop-shadow(0 0 ${15 * scaleFactor}px rgba(255,255,255,0.8)) brightness(1.2) contrast(1.1);` : `filter: drop-shadow(0 0 ${10 * scaleFactor}px rgba(255, 255, 255, 0.4)) brightness(1.1);`;

            const baseFont = isEvasol ? 1.0 : 0.85;
            const nameFontSize = Math.max(baseFont * scaleFactor, 0.6);

            bubbleEl.innerHTML = `
                <img src="${bubbleImg ? app.utils.fixDriveUrl(bubbleImg) : ''}" class="bubble-logo" 
                     style="width: ${isEvasol ? '85%' : '75%'}; ${logoFilter}"
                     onerror="this.src='https://lh3.googleusercontent.com/d/1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv'">
                <span class="bubble-name" style="font-size:${nameFontSize}rem; font-weight: 800;">${co.nomempresa}</span>
            `;

            bubbleEl.onclick = () => app.switchCompany(co.id_empresa);
            container.appendChild(bubbleEl);

            bubbles.push({
                el: bubbleEl,
                x: Math.random() * (width - size),
                y: Math.random() * (height - height * 0.2),
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: radius,
                size: size
            });
        });

        // --- ACTUALIZACI├ôN MEN├Ü HUB (Inyectar Inquilinos) ---
        const menuPublic = document.getElementById('menu-public');
        if (menuPublic) {
            menuPublic.classList.add('hub-active');
            menuPublic.innerHTML = `
                <li style="padding: 10px 15px; font-weight: 800; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 10px; font-size: 0.8rem; letter-spacing: 1px;">
                    <i class="fas fa-planet-ring"></i> DIRECTORIO HUB
                </li>
            ` + companies.map(co => `
                <li>
                    <a href="javascript:void(0)" onclick="app.switchCompany('${co.id_empresa}')">
                        <i class="fas fa-chevron-right" style="font-size: 0.7rem; opacity: 0.5;"></i> ${co.nomempresa}
                    </a>
                </li>
            `).join('') + `
            <li style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <a href="#login" onclick="app.ui.showLogin(); return false;">
                        <i class="fas fa-user-lock"></i> Staff Login
                    </a>
                </li>
            `;
        }

        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            bubbles.forEach((b1, i) => {
                b1.x += b1.vx;
                b1.y += b1.vy;

                if (b1.x <= 0) { b1.x = 0; b1.vx *= -1; }
                if (b1.x + b1.size >= w) { b1.x = w - b1.size; b1.vx *= -1; }
                if (b1.y <= 0) { b1.y = 0; b1.vy *= -1; }
                if (b1.y + b1.size >= h) { b1.y = h - b1.size; b1.vy *= -1; }

                const targetX = w / 2 - b1.radius;
                const targetY = h / 2 - b1.radius;
                b1.vx += (targetX - b1.x) * 0.00003;
                b1.vy += (targetY - b1.y) * 0.00003;

                for (let j = i + 1; j < bubbles.length; j++) {
                    const b2 = bubbles[j];
                    const dx = (b2.x + b2.radius) - (b1.x + b1.radius);
                    const dy = (b2.y + b2.radius) - (b1.y + b1.radius);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDist = b1.radius + b2.radius;

                    if (distance < minDist) {
                        const angle = Math.atan2(dy, dx);
                        const sin = Math.sin(angle);
                        const cos = Math.cos(angle);

                        const vx1 = b1.vx * cos + b1.vy * sin;
                        const vy1 = b1.vy * cos - b1.vx * sin;
                        const vx2 = b2.vx * cos + b2.vy * sin;
                        const vy2 = b2.vy * cos - b2.vx * sin;

                        const vx1Final = vx2;
                        const vx2Final = vx1;

                        b1.vx = vx1Final * cos - vy1 * sin;
                        b1.vy = vy1 * cos + vx1Final * sin;
                        b2.vx = vx2Final * cos - vy2 * sin;
                        b2.vy = vy2 * cos + vx2Final * sin;

                        const overlap = minDist - distance;
                        b1.x -= cos * overlap / 2;
                        b1.y -= sin * overlap / 2;
                        b2.x += cos * overlap / 2;
                        b2.y += sin * overlap / 2;
                    }
                }

                b1.el.style.left = `${b1.x}px`;
                b1.el.style.top = `${b1.y}px`;
            });

            if (window.location.hash === '#orbit') {
                app.public._orbitRAF = requestAnimationFrame(update);
            }
        };

        app.public._orbitRAF = requestAnimationFrame(update);
    },

    renderFooter: (company) => {
        const footerCopy = document.getElementById('footer-copy');
        if (footerCopy) {
            footerCopy.innerHTML = `&copy; ${new Date().getFullYear()} ${company.nomempresa}. Todos los derechos reservados. | ${company.id_empresa}`;
        }

        const container = document.getElementById('footer-links-container');
        if (!container) return;

        let socialHtml = '';
        if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" class="social-icon facebook" title="Facebook"><i class="fab fa-facebook-f"></i></a>`;
        if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" class="social-icon instagram" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" class="social-icon tiktok" title="TikTok"><i class="fab fa-tiktok"></i></a>`;

        const showForm = company.formulario === 'TRUE' || company.formulario === true;

        const siteMode = (company.modo_sitio || "HUB").toString().toUpperCase();

        container.innerHTML = `
            <div class="footer-links-sub">
                <a class="btn-link" onclick="app.public.showLocation()">Ubicaci├│n</a>
                <a class="btn-link" onclick="app.public.showReviews()">Opiniones</a>
                <a class="btn-link" onclick="window.location.hash='#pillars'">Pilares</a>
                <a class="btn-link" onclick="app.public.showAboutUs()">Nosotros</a>
                <a class="btn-link" onclick="app.public.showPolicies()">Pol├¡ticas</a>
                ${showForm ? `<a class="btn-link" onclick="window.location.hash='#contact'">Cont├íctanos</a>` : ''}
                ${siteMode === 'HYBRID' ? `<a class="btn-link" onclick="window.location.hash='#orbit'" style="opacity:0.4; font-size:0.6rem !important;">ÔÇó Hub</a>` : ''}
            </div>

            <div class="footer-social">
                ${socialHtml}
            </div>
        `;

        const btn = document.getElementById('whatsapp-float');
        if (btn && company.telefonowhatsapp) btn.href = `https://wa.me/${company.telefonowhatsapp}`;
    },

    renderPillars: (company) => {
        const container = document.getElementById('pillars-container');
        if (!container) return;
        const pillars = [
            { title: 'MISI├ôN', text: company.mision, icon: 'fa-bullseye' },
            { title: 'VISI├ôN', text: company.vision, icon: 'fa-eye' },
            { title: 'VALORES', text: company.valores, icon: 'fa-handshake' },
            { title: 'IMPACTO', text: company.impacto, icon: 'fa-chart-line' }
        ];
        container.innerHTML = pillars.map(p => `
            <div class="pillar-card">
                <div class="pillar-icon"><i class="fas ${p.icon}"></i></div>
                <h3>${p.title}</h3>
                <p>${p.text || 'Pendiente.'}</p>
            </div>`).join('');
    },

    renderGallery: () => {
        const section = document.getElementById('company-gallery-section');
        const grid = document.getElementById('company-gallery-grid');
        if (!grid || !section) return;
        
        const imgs = (app.data.Config_Galeria || []).filter(img => 
            String(img.id_empresa || "").trim().toUpperCase() === String(app.state.companyId || "").trim().toUpperCase()
        );

        if (imgs.length === 0) {
            section.classList.add('hidden');
            section.style.display = 'none';
            return;
        }

        section.classList.remove('hidden');
        section.style.display = 'block';

        // Estructura Horizonte Total (v6.6.8 - Breaking the Grid)
        // Limpiamos estilos inyectados previos si existen
        const oldStyle = document.getElementById('ui-gallery-breakout');
        if (oldStyle) oldStyle.remove();

        // Aplicamos nuevas clases de style.css
        const wrapper = section.querySelector('.gallery-wrapper');
        if (wrapper) {
            wrapper.className = "gallery-breakout-container";
        }

        grid.className = "gallery-horizon-grid";
        grid.style = ""; // Limpiar estilos inline previos
        
        grid.innerHTML = imgs.map(img => `
            <div class="gallery-item-huge">
                <img src="${app.utils.fixDriveUrl(img.url_imagen || img.imagen_url)}" 
                     alt="${img.titulo}" 
                     class="gallery-img">
                <div class="ui-overlay-full" style="justify-content:flex-end; padding:30px; background:linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.85)); pointer-events:none;">
                    <div class="ui-text-premium" style="font-size:1.2rem; border-left:5px solid var(--accent-color, #ffd700); padding-left:18px; line-height:1;">
                        ${img.titulo || 'Proyecto'}
                    </div>
                </div>
            </div>`).join('');

        const prevBtn = section.querySelector('.gallery-arrow.prev');
        const nextBtn = section.querySelector('.gallery-arrow.next');
        if (prevBtn) prevBtn.className = "gallery-huge-btn prev";
        if (nextBtn) nextBtn.className = "gallery-huge-btn next";
    },

    toggleMobileTicket: (show) => {
        const sidebar = document.getElementById('pos-ticket-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-active', show);
    },

    renderContact: () => {
        const container = document.getElementById('view-contact');
        if (!container) return;

        const urlId = (app.state.companyId || "").toString().trim().toUpperCase();
        const company = app.data.Config_Empresas.find(c => c.id_empresa === urlId);
        if (!company) return;

        const showForm = (company.formulario || "").toString().toUpperCase() === 'TRUE';
        const needsBilling = (company.Facturacion || "").toString().toUpperCase() === 'TRUE';
        const needsInvoice = (company.factura || "").toString().toUpperCase() === 'TRUE';
        const finalBilling = needsBilling || needsInvoice;

        if (!showForm) {
            container.innerHTML = `<div class="form-container" style="text-align:center; padding:50px;">
                <i class="fas fa-comment-slash fa-3x" style="color:#ccc; margin-bottom:20px;"></i>
                <h2>Contacto Desactivado</h2>
                <p>Por el momento este negocio no recibe solicitudes v├¡a formulario.</p>
                <button class="btn-primary" onclick="window.location.hash='#home'">Volver al Inicio</button>
            </div>`;
            return;
        }

        const isInsurance = (company.tipo_negocio || "").toString().toUpperCase().includes('SEGUROS') || (company.tipo_negocio || "").toString().toUpperCase().includes('FINANZAS');

        container.innerHTML = `
            <div class="form-container">
                <h2>${isInsurance ? 'Solicitud de Asesor├¡a' : 'Cont├íctanos'}</h2>
                <p>${isInsurance ? 'Personaliza tu protecci├│n. Un experto de TopLux Finance te contactar├í.' : 'D├®janos tus datos y un asesor se comunicar├í contigo.'}</p>
                <form id="public-lead-form">
                    <div class="form-group">
                        <label>Tel├®fono / WhatsApp *</label>
                        <input type="tel" id="lead-phone" required placeholder="Ej: 521...">
                    </div>
                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" id="lead-name" required>
                    </div>

                    ${isInsurance ? `
                    <div class="form-group">
                        <label>┬┐Qu├® deseas proteger? *</label>
                        <select id="lead-subtype" required onchange="app.public.toggleInsuranceFields(this.value)" style="width:100%; padding:12px; border-radius:12px; border:1px solid #ddd;">
                            <option value="">Selecciona una opci├│n...</option>
                            <option value="GMM">Gastos M├®dicos Mayores (Salud)</option>
                            <option value="PPR">Plan Personal de Retiro (PPR)</option>
                            <option value="AUTO">Seguro de Auto / Flotilla</option>
                            <option value="VIDA">Seguro de Vida / Invalidez</option>
                            <option value="NEGOCIO">Seguro PyME / Empresarial</option>
                        </select>
                    </div>
                    <!-- Campos Din├ímicos de Seguros (v6.1.7) -->
                    <div id="insurance-dynamic-fields" style="margin-top:20px; border-left:4px solid var(--primary-color); padding-left:15px;" class="hidden">
                        <!-- Inyectado por toggleInsuranceFields -->
                    </div>
                    ` : ''}

                    <div class="form-group">
                        <label>Correo Electr├│nico</label>
                        <input type="email" id="lead-email">
                    </div>
                    <div class="form-group">
                        <label>Direcci├│n *</label>
                        <input type="text" id="lead-address" required placeholder="Calle, N├║mero, Colonia..." autocomplete="off">
                    </div>
                    
                    ${finalBilling ? `
                    <div id="billing-fields" style="background: rgba(0, 210, 255, 0.05); padding: 15px; border-radius: 12px; border: 1px dashed var(--primary-color); margin: 20px 0;">
                        <h4 style="margin-top:0; color:var(--primary-color); font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">
                            <i class="fas fa-file-invoice"></i> Datos de Facturaci├│n (Opcional)
                        </h4>
                        <div class="form-group">
                            <label>RFC / Tax ID</label>
                            <input type="text" id="lead-rfc" placeholder="RFC123456789">
                        </div>
                        <div class="form-group">
                            <label>Nombre del Negocio</label>
                            <input type="text" id="lead-business" placeholder="Nombre Comercial o Fiscal">
                        </div>
                        <div class="form-group">
                            <label>Direcci├│n Comercial</label>
                            <input type="text" id="lead-billing-address" placeholder="Calle, N├║mero, CP, Ciudad">
                        </div>
                    </div>
                    ` : ''}

                    <div id="contact-msg" class="success-msg hidden" style="margin-bottom:15px; text-align:center; color:var(--primary-color); font-weight:bold;"></div>
                    <button type="submit" class="btn-primary w-100" id="btn-submit-contact">
                        ${isInsurance ? 'Solicitar Cotizaci├│n Virtual' : 'Enviar Informaci├│n'} <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
                    </button>
                </form>
            </div>
        `;

        // --- L├│gica de Auto-rellenado (v5.2.4) ---
        const elPhone = document.getElementById('lead-phone');
        if (elPhone) {
            elPhone.addEventListener('blur', () => {
                const phone = elPhone.value.trim();
                if (phone.length < 8) return;

                const existing = (app.data.Leads || []).find(l =>
                    (l.telefono || "").toString().includes(phone) &&
                    (l.id_empresa || "").toString().toUpperCase() === urlId
                );

                if (existing) {
                    console.log("[CRM] Cliente existente encontrado, auto-rellenando...");
                    const elName = document.getElementById('lead-name');
                    const elEmail = document.getElementById('lead-email');
                    const elAddr = document.getElementById('lead-address');
                    const elRfc = document.getElementById('lead-rfc');
                    const elBiz = document.getElementById('lead-business');
                    const elBillDir = document.getElementById('lead-billing-address');

                    if (elName) elName.value = existing.nombre || '';
                    if (elEmail) elEmail.value = existing.email || '';
                    if (elAddr) elAddr.value = existing.direccion || '';
                    if (elRfc) elRfc.value = existing.rfc || '';
                    if (elBiz) elBiz.value = existing.negocio || '';
                    if (elBillDir) elBillDir.value = existing.direccion_comercial || '';

                    // Notificar visualmente
                    const msg = document.getElementById('contact-msg');
                    if (msg) {
                        msg.innerText = "┬íBienvenido de nuevo! Hemos cargado tus datos.";
                        msg.classList.remove('hidden');
                        setTimeout(() => msg.classList.add('hidden'), 3000);
                    }
                }
            });
        }

        // Re-bind el evento ya que el DOM del form cambi├│
        const publicLeadForm = document.getElementById('public-lead-form');
        if (publicLeadForm) {
            publicLeadForm.onsubmit = async (e) => {
                e.preventDefault();

                // --- L├│gica de Captura Din├ímica de Seguros (v6.1.7) ---
                if (isInsurance) {
                    const subtypeEl = document.getElementById('lead-subtype');
                    const dynamicFields = document.getElementById('insurance-dynamic-fields');
                    if (subtypeEl && dynamicFields) {
                        const subtype = subtypeEl.value;
                        const inputs = dynamicFields.querySelectorAll('input, select, textarea');
                        let bodyDetails = `[SOLICITUD ${subtype}] \n`;
                        inputs.forEach(input => {
                            const label = input.previousElementSibling ? input.previousElementSibling.innerText : input.name;
                            bodyDetails += `${label}: ${input.value} \n`;
                        });

                        // Inyectamos los valores en campos ocultos o variables temporales para el handler
                        app.state._currentLeadSubtype = subtype;
                        app.state._currentLeadBody = bodyDetails;
                    }
                }

                if (app.events && app.events._handlePublicLead) app.events._handlePublicLead(e);
            };
        }
    },

    // --- Auxiliar para Seguros (v6.1.7) ---
    toggleInsuranceFields: (type) => {
        const container = document.getElementById('insurance-dynamic-fields');
        if (!container) return;

        if (!type) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }

        container.classList.remove('hidden');
        let html = '';

        switch (type) {
            case 'GMM':
                html = `
                    <div class="form-group"><label>Edad del titular *</label><input type="number" id="ins-edad" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>┬┐Fuma? *</label><select id="ins-fuma" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"><option value="NO">No</option><option value="SI">S├¡</option></select></div>
                    <div class="form-group"><label>Padecimientos o enfermedades preexistentes</label><textarea id="ins-padece" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee; height:60px;"></textarea></div>
                `;
                break;
            case 'PPR':
                html = `
                    <div class="form-group"><label>Edad Actual *</label><input type="number" id="ins-edad-actual" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>Edad deseada de retiro *</label><input type="number" id="ins-edad-retiro" required value="65" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>Presupuesto mensual estimado para ahorro</label><input type="text" id="ins-ahorro" placeholder="$2,000 - $5,000" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                `;
                break;
            case 'AUTO':
                html = `
                    <div class="form-group"><label>Marca y Modelo del Auto *</label><input type="text" id="ins-auto" required placeholder="Ej: BMW X3 2023" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>C├│digo Postal de circulaci├│n *</label><input type="text" id="ins-cp" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>Uso del veh├¡culo</label><select id="ins-uso" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"><option value="PARTICULAR">Particular</option><option value="PLATAFORMA">Plataforma (Uber/Didi)</option><option value="CARGA">Carga/Reparto</option></select></div>
                `;
                break;
            default:
                html = `<div class="form-group"><label>Describe brevemente tu necesidad *</label><textarea id="ins-desc" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee; height:80px;"></textarea></div>`;
        }

        container.innerHTML = `<h4 style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:15px;">Informaci├│n para ${type}</h4> ${html}`;
    },

    renderSuitOnboarding: () => {
        const container = document.getElementById('onboarding-form-container');
        if (!container) return;

        container.innerHTML = `
            <form id="onboarding-form" class="minimalist-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group" title="El nombre comercial que tus clientes recordar├ín.">
                    <label><i class="fas fa-store"></i> Nombre del Negocio *</label>
                    <input type="text" id="onb-name" required placeholder="Ej: Mi Cafeter├¡a Gourmet">
                </div>
                <div class="form-group" title="Define las reglas y dise├▒o inicial de tu sitio.">
                    <label><i class="fas fa-tags"></i> Tipo de Negocio</label>
                    <select id="onb-type" onchange="app.public.autoFillOnboarding(this.value)">
                        <option value="">Selecciona una categor├¡a...</option>
                        <option value="Food/Snacks">Food (Restaurantes, Caf├®s, Bebidas)</option>
                        <option value="Servicios">Servicios (Consultor├¡a, Limpieza, Talleres)</option>
                        <option value="Hospedaje">Hospedaje (Hoteles, AirBnb, Caba├▒as)</option>
                        <option value="Industrial/Proyectos">Industrial (Construcci├│n, F├íbricas, Ingenier├¡a)</option>
                    </select>
                </div>
                <div class="form-group" title="Usado para que tus clientes te contacten con un clic.">
                    <label><i class="fab fa-whatsapp"></i> WhatsApp Comercial *</label>
                    <input type="tel" id="onb-phone" required placeholder="528114400000">
                </div>
                <div class="form-group" title="La frase que define tu marca en el encabezado.">
                    <label><i class="fas fa-quote-left"></i> Slogan</label>
                    <input type="text" id="onb-slogan" placeholder="Ej: Calidad que se nota">
                </div>
                <div class="form-group" title="Correo para contacto oficial.">
                    <label><i class="fas fa-envelope"></i> Correo Empresarial *</label>
                    <input type="email" id="onb-email" required placeholder="contacto@minegocio.com">
                </div>

                <!-- NEW FIELDS (v5.4.0) -->
                <div class="form-group" title="El color principal de tu sitio web.">
                    <label><i class="fas fa-palette"></i> Color de Marca</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="color" id="onb-color" value="#004d40" style="width: 50px; height: 40px; border: none; padding: 0; cursor: pointer; border-radius: 8px;">
                        <span style="font-size: 0.8rem; opacity: 0.6;">Elige tu color</span>
                    </div>
                </div>
                <div class="form-group" title="Link de tu logotipo (puedes pegarlo aqu├¡).">
                    <label><i class="fas fa-image"></i> URL del Logotipo</label>
                    <input type="text" id="onb-logo" placeholder="https://ejemplo.com/mi-logo.png">
                </div>

                <div class="form-group" style="grid-column: span 2;" title="Aparecer├í en el pie de p├ígina y mapa.">
                    <label><i class="fas fa-map-marker-alt"></i> Direcci├│n F├¡sica</label>
                    <input type="text" id="onb-address" placeholder="Ej: Av. Principal 123, Monterrey">
                </div>
                
                <div id="onb-advanced" class="form-row" style="grid-column: span 2; display: none; flex-direction: column; gap: 15px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px; border: 1px dashed #ddd;">
                    <p style="font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; color: var(--primary-color);">INTELIGENCIA DE MARCA (Auto-rellenada):</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Misi├│n Sugerida</label>
                            <textarea id="onb-mision" style="height: 50px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Visi├│n Sugerida</label>
                            <textarea id="onb-vision" style="height: 50px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Valores</label>
                            <textarea id="onb-valores" style="height: 40px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Impacto Social</label>
                            <textarea id="onb-impacto" style="height: 40px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                        <div style="grid-column: span 2;">
                            <label style="font-size: 0.75rem; opacity: 0.6;">Pol├¡ticas de Servicio</label>
                            <textarea id="onb-politicas" style="height: 40px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="grid-column: span 2; margin-top: 10px;">
                    <button type="submit" class="btn-primary w-100" style="height: 55px; font-size: 1.2rem; font-weight: bold; border-radius: 50px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                        <i class="fas fa-rocket"></i> GENERAR MI SITIO WEB GRATIS
                    </button>
                    <p style="font-size: 0.75rem; text-align: center; margin-top: 10px; opacity: 0.5;">
                        * Al registrarte aceptas un periodo de prueba de 20 d├¡as. Sitio quedar├í en borrador hasta activaci├│n manual.
                    </p>
                </div>
            </form>
            <div id="onb-success" class="hidden" style="text-align: center; padding: 40px;">
                <i class="fas fa-check-circle fa-4x" style="color: #2ecc71; margin-bottom: 20px;"></i>
                <h3 style="font-size: 1.8rem; margin-bottom: 10px;">┬íBorrador Creado con ├ëxito!</h3>
                <p id="onb-msg-final" style="margin-bottom: 30px;">Tu sitio est├í listo para previsualizaci├│n.</p>
                <div style="display: flex; gap:15px; justify-content: center;">
                    <button id="btn-see-site" class="btn-primary" style="padding: 12px 30px; border-radius: 50px;">VER MI P├üGINA</button>
                    <a id="btn-wa-activate" class="btn-support" target="_blank" style="padding: 12px 30px; border-radius: 50px; background: #25D366; text-decoration: none; color: white; display: flex; align-items: center; gap: 8px;">
                         <i class="fab fa-whatsapp"></i> CONTACTAR A ACTIVACI├ôN
                    </a>
                </div>
            </div>
        `;

        const form = document.getElementById('onboarding-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await app.public.submitOnboarding(e);
            };
        }
    },

    autoFillOnboarding: (type) => {
        const adv = document.getElementById('onb-advanced');
        const fields = {
            m: document.getElementById('onb-mision'),
            v: document.getElementById('onb-vision'),
            val: document.getElementById('onb-valores'),
            imp: document.getElementById('onb-impacto'),
            pol: document.getElementById('onb-politicas')
        };
        if (!adv || !fields.m) return;

        adv.style.display = type ? 'flex' : 'none';

        const templates = {
            'Food/Snacks': {
                m: "Cocinamos con pasi├│n para regalar momentos inolvidables a trav├®s del sabor.",
                v: "Ser la opci├│n favorita de comida en la ciudad, reconocida por frescura y calidad.",
                val: "Sabor, Higiene, Pasi├│n, Servicio.",
                imp: "Apoyar a productores locales y fomentar la alimentaci├│n consciente.",
                pol: "Garant├¡a de sabor o cambio de platillo. Entrega puntual."
            },
            'Servicios': {
                m: "Brindar soluciones profesionales que simplifiquen la vida y multipliquen los resultados de nuestros clientes.",
                v: "Ser l├¡deres regionales en consultor├¡a, basados en la confianza y la innovaci├│n constante.",
                val: "Integridad, Excelencia, Innovaci├│n, Enfoque al cliente.",
                imp: "Impulsar el crecimiento econ├│mico de negocios locales.",
                pol: "Atenci├│n personalizada 24/7. Satisfacci├│n garantizada."
            },
            'Industrial/Proyectos': {
                m: "Construir hoy la infraestructura del ma├▒ana con los m├ís altos est├índares de ingenier├¡a y seguridad.",
                v: "Ser el aliado estrat├®gico indispensable para grandes obras y desarrollos industriales.",
                val: "Seguridad, Precisi├│n, Durabilidad, Cumplimiento.",
                imp: "Crear empleos seguros y desarrollo urbano sostenible.",
                pol: "Certificaci├│n de calidad en cada etapa. Garant├¡a de obra."
            },
            'Hospedaje': {
                m: "Ofrecer un refugio de confort y descanso que haga sentir a nuestros hu├®spedes como en casa.",
                v: "Ser el referente de hospitalidad y calidez, brindando experiencias memorables de alojamiento.",
                val: "Hospitalidad, Calidez, Limpieza, Confianza.",
                imp: "Promover el turismo local responsable y la cultura de la regi├│n.",
                pol: "Check-in flexible bajo disponibilidad. Est├índares de higiene rigurosos."
            }
        };

        if (templates[type]) {
            fields.m.value = templates[type].m;
            fields.v.value = templates[type].v;
            fields.val.value = templates[type].val;
            fields.imp.value = templates[type].imp;
            fields.pol.value = templates[type].pol;
        }
    },

    submitOnboarding: async (e) => {
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CREANDO ECOSISTEMA...';

        const bizData = {
            id_empresa: document.getElementById('onb-name').value.trim().toUpperCase(),
            nomempresa: document.getElementById('onb-name').value,
            tipo_negocio: document.getElementById('onb-type').value,
            telefonowhatsapp: document.getElementById('onb-phone').value,
            correoempresarial: document.getElementById('onb-email').value,
            slogan: document.getElementById('onb-slogan').value,
            direccion: document.getElementById('onb-address').value,
            color_tema: document.getElementById('onb-color').value,
            logourl: document.getElementById('onb-logo').value,
            mision: document.getElementById('onb-mision').value,
            vision: document.getElementById('onb-vision').value,
            valores: document.getElementById('onb-valores').value,
            impacto: document.getElementById('onb-impacto').value,
            politicas: document.getElementById('onb-politicas').value,
            modo: 'PROD',
            formulario: 'TRUE',
            usa_soporte_ia: 'FALSE',
            usa_qr_sitio: 'FALSE',
            usa_reservaciones: 'FALSE'
        };

        const response = await fetch(app.apiUrl, {
            method: 'POST',
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ action: 'createBusiness', business: bizData, token: app.apiToken })
        });
        const result = await response.json();

        if (result && result.success) {
            document.getElementById('onboarding-form').classList.add('hidden');
            const success = document.getElementById('onb-success');
            success.classList.remove('hidden');

            const btnSee = document.getElementById('btn-see-site');
            const btnWa = document.getElementById('btn-wa-activate');

            if (btnSee) {
                btnSee.innerHTML = `<i class="fab fa-whatsapp"></i> CONTACTAR A PERSONAL SUIT.ORG`;
                const waMsg = `┬íHola! Acabo de registrar mi negocio [${bizData.nomempresa}] con ID [${result.newBusinessId}]. Me gustar├¡a continuar con la configuraci├│n.`;
                btnSee.onclick = () => { window.open(`https://wa.me/528129552094?text=${encodeURIComponent(waMsg)}`, '_blank'); };
                btnSee.style.background = "#25D366";
            }
            if (btnWa) {
                btnWa.classList.add('hidden');
            }
        } else {
            alert("Error al crear el borrador. Intente de nuevo.");
            btn.disabled = false;
            btn.innerText = 'GENERAR MI SITIO WEB GRATIS';
        }
    }
};

/**
 * ­ƒöÉ CLIENT VAULT MODULE (v6.1.7)
 * Manejo de documentos sensibles en Google Drive
 */
app.vault = {
    refresh: async () => {
        const grid = document.getElementById('vault-files-grid');
        if (!grid) return;
        if (!app.state.currentUser || !app.state.companyId) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Inicia sesi├│n para ver tus documentos.</p>';
            return;
        }

        // Validar si el cliente tiene acceso (Nivel 1 o superior)
        if (app.state.currentUser.nivel_acceso < 1) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:red;">Acceso Restringido.</p>';
            return;
        }

        // --- DIN├üMICA DE REQUISITOS (v6.1.8) ---
        const vaultUploadArea = document.getElementById('vault-upload-area');
        if (vaultUploadArea && !document.getElementById('vault-requirements')) {
            const userLead = (app.data.Leads || []).find(l => l.email === app.state.currentUser.email);
            const subtype = userLead ? (userLead.subtipo_negocio || '').toUpperCase() : '';

            let reqs = ['INE (Escaneada por ambos lados)', 'Comprobante de Domicilio (Vigente)'];
            if (subtype.includes('GMM')) reqs.push('Informe M├®dico actual', 'Historial cl├¡nico');
            if (subtype.includes('AUTO')) reqs.push('Factura del auto', 'P├│liza anterior (si aplica)');
            if (subtype.includes('PPR')) reqs.push('CURP', 'Constancia de situaci├│n fiscal');

            const reqHtml = `
                <div id="vault-requirements" style="background: #fdfae7; border: 1px solid #f1e05a; padding: 15px; border-radius: 12px; margin-bottom: 25px; text-align: left;">
                    <h5 style="margin:0 0 10px 0; color:#85702a;"><i class="fas fa-list-check"></i> Documentos pendientes para tu solicitud ${subtype}:</h5>
                    <ul style="margin:0; padding-left:20px; font-size:0.8rem; color:#555;">
                        ${reqs.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
            vaultUploadArea.insertAdjacentHTML('beforebegin', reqHtml);
        }

        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Consultando B├│veda...</p>';

        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'getCustomerDocs',
                    leadName: app.state.currentUser.nombre,
                    token: app.apiToken
                })
            });
            const data = await res.json();
            if (data.success && data.files && data.files.length > 0) {
                grid.innerHTML = data.files.map(f => `
                    <div class="file-card" style="padding:15px; border:1px solid #eee; border-radius:12px; text-align:center; transition:0.3s; background:white;">
                        <i class="fas ${app.vault.getFileIcon(f.tipo)} fa-2x" style="color:var(--primary-color); margin-bottom:10px;"></i>
                        <h4 style="font-size:0.75rem; margin:0; word-break:break-all; color:#333;">${f.nombre}</h4>
                        <a href="${f.url}" target="_blank" style="display:inline-block; margin-top:10px; font-size:0.7rem; color:var(--primary-color); text-decoration:none; font-weight:bold;">ABRIR</a>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; opacity:0.5; padding:20px;">No hay documentos cargados a├║n.</p>';
            }
        } catch (e) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:red;">Error de conexi├│n.</p>';
        }
    },

    getFileIcon: (mime) => {
        if (!mime) return 'fa-file-alt';
        const m = mime.toLowerCase();
        if (m.includes('image')) return 'fa-file-image';
        if (m.includes('pdf')) return 'fa-file-pdf';
        if (m.includes('word') || m.includes('officedocument')) return 'fa-file-word';
        return 'fa-file-alt';
    },

    handleFiles: async (files) => {
        const status = document.getElementById('vault-status');
        if (!files || !files.length) return;

        status.classList.remove('hidden');
        status.style.background = '#e3f2fd';
        status.style.display = 'block';
        status.innerText = `Subiendo ${files.length} archivos...`;

        for (let file of files) {
            try {
                const base64 = await app.ui.fileToBase64(file);
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'uploadToVault',
                        lead: {
                            nombre: app.state.currentUser.nombre,
                            id_lead: app.state.currentUser.id_lead || 'N/A'
                        },
                        fileName: file.name,
                        fileType: file.type,
                        fileData: base64,
                        token: app.apiToken
                    })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
            } catch (e) {
                status.style.background = '#ffebee';
                status.innerText = `Error: ${e.message}`;
                return;
            }
        }

        status.style.background = '#e8f5e9';
        status.innerText = "┬íArchivos enviados a revisi├│n!";
        setTimeout(() => status.classList.add('hidden'), 3500);
        app.vault.refresh();
    }
};
