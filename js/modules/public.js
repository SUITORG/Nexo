/**
 * EVASOL - PUBLIC MODULE (v4.6.7)
 * Responsabilidad: Vistas públicas, Landing Page, SEO, Menú y Órbita.
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
                        <p style="font-size: 0.9rem; line-height: 1.4;">${company.descripcion || 'Información no disponible.'}</p>
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
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">1. PROTECCIÓN DE DATOS</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">${company?.nomempresa || 'La empresa'} garantiza que sus datos personales son tratados bajo estrictas medidas de seguridad.</p>
                    </section>
                    <section style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">2. TÉRMINOS COMERCIALES</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">Toda orden genera un compromiso de servicio. Precios incluyen impuestos.</p>
                    </section>
                    <section>
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">3. POLÍTICAS PERSONALIZADAS</h4>
                        <p style="font-size: 0.85rem; color: #444; line-height: 1.4; white-space: pre-wrap;">${company?.politicas || 'Políticas base del sistema activas.'}</p>
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
                            <small style="display:block; margin-top:5px; color:#888;">- Juan Pérez</small>
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
            const address = company.direccion || "Dirección no disponible.";
            const mapUrl = company.ubicacion_url || "";

            let mapIframe = `<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height:250px; display:flex; align-items:center; justify-content:center; border-radius:12px; margin-bottom:20px; color:#adb5bd; flex-direction:column; border: 1px solid #dee2e6;">
                                <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom:15px; color: var(--accent-color);"></i>
                                <p style="font-weight:700; color:#495057;">Mapa Interactivo</p>
                                <p style="font-size:0.8rem; padding: 0 40px; text-align: center; line-height: 1.4;">Para ver el mapa interactivo aquí, usa el enlace de "Insertar Mapa" (Embed) de Google Maps.</p>
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
                    <h3 style="color:var(--primary-color); margin-bottom:5px;">Visítanos en:</h3>
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
        const urlId = (app.state.companyId || "").toString().trim().toUpperCase();
        const company = companyData || app.data.Config_Empresas.find(c => c.id_empresa === urlId);

        if (!company) return console.error("[RENDER_HOME] No company data found for ID:", urlId);

        // Autodetectar modo comida (v5.0.3 Fix: UI restoration)
        const keywords = ['Alimentos', 'Comida', 'Restaurante', 'Snack', 'Food', 'PFM', 'PMP', 'HMP'];
        const bizType = (company.tipo_negocio || "").toString();
        const bizId = urlId;
        const isFood = keywords.some(k => bizType.includes(k) || bizId.includes(k));
        app.state.isFood = isFood;

        const sloganEl = document.getElementById('hero-slogan');
        const subEl = document.getElementById('hero-sub');
        const heroBanner = document.getElementById('hero-banner-main');
        const actions = document.getElementById('hero-actions-container');
        const standardFeatures = document.getElementById('standard-features-grid');
        const industrialSeo = document.getElementById('seo-matrix-section');
        const foodAreaSpec = document.getElementById('food-app-area');
        const foodTitle = document.getElementById('food-menu-title');
        const foodSubtitle = document.getElementById('food-menu-subtitle');
        const menuPublic = document.getElementById('menu-public');
        if (menuPublic) {
            menuPublic.classList.remove('hub-active');
        }

        // Forzar visibilidad y reset de clases (v5.0.3 Security Fix)
        const isPersonal = bizType.toUpperCase().includes('MARCA PERSONAL');
        const viewHome = document.getElementById('view-home');
        if (viewHome) {
            viewHome.classList.toggle('is-personal-brand', isPersonal && window.innerWidth > 768);
        }

        if (heroBanner) {
            heroBanner.classList.remove('hidden');
            heroBanner.style.display = 'block';
        }

        // --- RENDER PERSONAL BRAND HERO (v5.9.0) ---
        const personalNode = document.getElementById('hero-personal-node');
        if (personalNode && isPersonal && window.innerWidth > 768) {
            const photo = company.foto_agente || company.logo_url || '';
            const slogan = company.slogan || "";
            const msg1 = company.mensaje1 || "";
            const msg2 = company.mensaje2 || "";
            const desc = company.descripcion || "Ayudo a profesionales a escalar su impacto y libertad.";

            personalNode.innerHTML = `
                <div class="personal-left">
                    <div class="photo-wrapper" style="position:relative; display:flex;">
                        <img src="${app.utils.fixDriveUrl(photo)}" alt="${company.nomempresa}">
                        <div class="personal-photo-overlay">
                            ${slogan ? `<div class="overlay-slogan">${slogan}</div>` : ''}
                            ${msg1 ? `<div class="overlay-msg1">${msg1}</div>` : ''}
                            ${msg2 ? `<div class="overlay-msg2">${msg2}</div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="personal-right">
                    <h1>${slogan || company.nomempresa}</h1>
                    <p>${desc}</p>
                    <div class="personal-checks">
                        <div class="check-item"><i class="fas fa-check-circle"></i> Mayor Libertad</div>
                        <div class="check-item"><i class="fas fa-check-circle"></i> Más Ingresos</div>
                        <div class="check-item"><i class="fas fa-check-circle"></i> Autoridad Digital</div>
                        <div class="check-item"><i class="fas fa-check-circle"></i> Sistema Probado</div>
                    </div>
                    <form class="personal-cta-box" onsubmit="event.preventDefault(); window.location.hash='#contact';">
                        <input type="email" placeholder="Tu correo electrónico..." required>
                        <button type="submit">¡EMPEZAR!</button>
                    </form>
                </div>
                <div class="as-seen-bar">
                    <span style="font-size: 0.8rem; font-weight: 800; color: #000; margin-right: 20px;">AS SEEN IN:</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Forbes_logo.svg/1280px-Forbes_logo.svg.png" style="height: 18px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Entrepreneur_magazine_logo.svg/1280px-Entrepreneur_magazine_logo.svg.png" style="height: 18px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/CNBC_logo.svg/1280px-CNBC_logo.svg.png" style="height: 25px;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Inc._magazine_logo.svg/1280px-Inc._magazine_logo.svg.png" style="height: 25px;">
                </div>
            `;
        }

        const showForm = company.formulario === 'TRUE' || company.formulario === true;

        if (isFood) {
            // Prioridad: foto_agente -> logo_url -> Default (v5.7.7)
            const bgUrl = company.foto_agente || company.logo_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80';

            // Ajustamos el gradiente para asegurar legibilidad del texto sobre cualquier foto
            heroBanner.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('${app.utils.fixDriveUrl(bgUrl)}')`;
            heroBanner.style.backgroundAttachment = 'scroll';
            heroBanner.style.backgroundPosition = 'center center';
            heroBanner.style.backgroundSize = 'cover';
            heroBanner.style.backgroundRepeat = 'no-repeat';
            heroBanner.style.display = 'block';

            const sloganText = company.slogan || "Sabor Premium";
            const subText = company.mensaje1 || company.descripcion || "Excelencia en cada platillo.";
            const extraText = company.mensaje2 || "";
            const extraEl = document.getElementById('hero-extra-msg');

            if (sloganEl) sloganEl.innerText = sloganText;
            if (subEl) subEl.innerText = subText;
            if (extraEl) {
                extraEl.innerText = extraText;
                extraEl.classList.toggle('hidden', !extraText);
            }
            if (heroBanner) heroBanner.classList.add('reduced');

            if (foodTitle) foodTitle.innerText = sloganText;
            if (foodSubtitle) foodSubtitle.innerText = subText;

            if (actions) {
                const showSupport = company.usa_soporte_ia === 'TRUE' || company.usa_soporte_ia === true;
                const showRes = company.usa_reservaciones === 'TRUE' || company.usa_reservaciones === true;
                const agentId = (urlId === 'EVASOL') ? 'EVASOL_SR_ENG' : 'AGT-001';

                let btns = '';
                if (showSupport) btns += `<button class="btn-support" onclick="app.agents.select('${agentId}')"><i class="fas fa-headset"></i> Atención e IA</button>`;
                if (showRes) btns += `<button class="btn-primary" onclick="app.public.showReservationModal()"><i class="fas fa-calendar-check"></i> Reservar Cita</button>`;

                actions.innerHTML = btns;
            }

            if (menuPublic) {
                const siteMode = (company.modo_sitio || "HUB").toString().toUpperCase();
                const isIsolated = (company.is_isolated === 'TRUE' || company.is_isolated === true || company.is_isolated === "1");
                const showHubLink = siteMode !== "WHITE" && !isIsolated && app.state.cameFromOrbit;

                // Camuflaje Sutil (v6.1.5): Beige pero FUNCIONAL
                const hubStyle = showHubLink ? "" : "color: #f5f5dc !important; opacity: 0.7;";
                const hubHtml = `<li><a href="#orbit" style="${hubStyle}"><i class="fas fa-planet-ring"></i> Hub</a></li>`;

                menuPublic.innerHTML = `
                    ${hubHtml}
                    <li><a href="#home">Inicio</a></li>
                    <li>
                        <a href="#food-app-area" class="btn-express-nav-special" style="background: var(--accent-color); color: #000; padding: 5px 15px; border-radius: 50px; font-weight: bold; display: flex; align-items: center; gap: 5px; text-decoration: none;">
                            <i class="fas fa-utensils"></i> Pedido Express
                        </a>
                    </li>
                    ${showForm ? `<li><a href="#contact">Contacto</a></li>` : ''}
                    <li><a class="nav-login-btn" href="#login"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }

            // v5.0.3: No ocultar la landing (standardFeatures) para food businesses si el usuario quiere mantenerla.
            if (standardFeatures) standardFeatures.classList.remove('hidden');
            app.public.renderFoodMenu();
        } else {
            if (menuPublic) {
                const siteMode = (company.modo_sitio || "HUB").toString().toUpperCase();
                const isIsolated = (company.is_isolated === 'TRUE' || company.is_isolated === true || company.is_isolated === "1");
                const showFullHub = siteMode !== "WHITE" && !isIsolated && app.state.cameFromOrbit;

                let hubHtml = '';
                if (siteMode !== "WHITE") {
                    // Camuflaje Sutil (v6.1.5): Beige pero FUNCIONAL
                    const hubStyle = showFullHub ? "" : "color: #f5f5dc !important; opacity: 0.7;";
                    hubHtml = `<li><a href="#orbit" style="${hubStyle}"><i class="fas fa-planet-ring"></i> Hub</a></li>`;
                }

                menuPublic.innerHTML = `
                    ${hubHtml}
                    <li><a href="#home">Inicio</a></li>
                    ${showForm ? `<li><a href="#contact">Contacto</a></li>` : ''}
                    <li><a class="nav-login-btn" href="#login"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }

            const heroUrl = company.foto_agente || company.logo_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80';
            heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${app.utils.fixDriveUrl(heroUrl)}')`;
            heroBanner.style.backgroundAttachment = 'fixed';
            if (heroBanner) heroBanner.classList.remove('reduced');
            const extraEl = document.getElementById('hero-extra-msg');
            if (extraEl) extraEl.classList.add('hidden');
            if (sloganEl) sloganEl.innerText = company.slogan || "Soluciones Industriales";
            if (subEl) subEl.innerText = company.mensaje1 || company.descripcion || "Eficiencia y Calidad.";
            if (actions) {
                const showSupport = company.usa_soporte_ia === 'TRUE' || company.usa_soporte_ia === true;
                const showRes = company.usa_reservaciones === 'TRUE' || company.usa_reservaciones === true;
                const agentId = (urlId === 'EVASOL') ? 'EVASOL_SR_ENG' : 'AGT-001';
                actions.innerHTML = `
                    <button class="btn-primary" onclick="window.location.hash='#contact'">Cotizar Ahora</button>
                    ${showRes ? `<button class="btn-accent" onclick="app.public.showReservationModal()" style="background:#5c6bc0; color:white;"><i class="fas fa-calendar-alt"></i> Reservar</button>` : ''}
                    ${showSupport ? `<button class="btn-support" onclick="app.agents.select('${agentId}')"><i class="fas fa-headset"></i> Soporte IA</button>` : ''}
                `;
            }
            if (standardFeatures) standardFeatures.classList.remove('hidden');
        }

        // Asegurar visibilidad de secciones críticas (v5.0.3)
        if (industrialSeo) {
            industrialSeo.classList.remove('hidden');
            industrialSeo.style.display = 'block';
        }

        // --- SUITORG ONBOARDING INJECTION (v5.3.9) ---
        const onboardSection = document.getElementById('suit-onboarding-section');
        if (onboardSection) {
            if (urlId === 'SUITORG') {
                onboardSection.classList.remove('hidden');
                app.public.renderSuitOnboarding();
            } else {
                onboardSection.classList.add('hidden');
            }
        }

        // Forzar visibilidad de la sección Home en el router si el hash es correcto
        const homeSection = document.getElementById('view-home');
        if (homeSection && window.location.hash === '#home') {
            homeSection.classList.remove('hidden');
        }

        // Hide monitor for non-food
        const monLinks = document.querySelectorAll('.nav-monitor-link');
        monLinks.forEach(link => {
            link.parentElement.style.display = isFood ? 'block' : 'none';
        });

        // --- QR CODE INJECTION (v6.0.7) ---
        const existingQr = document.getElementById('hero-qr-dynamic');
        if (existingQr) existingQr.remove();

        const qrTarget = isPersonal ? personalNode : heroBanner;
        const themeColor = company.color_tema || 'var(--primary-color)';
        const showQrFlag = company.usa_qr_sitio === 'TRUE' || company.usa_qr_sitio === true || company.usa_qr_sitio === "1";

        if (qrTarget && showQrFlag) {
            const siteUrl = window.location.origin + window.location.pathname + "?co=" + urlId + "#home";
            const qrContainer = document.createElement('div');
            qrContainer.id = 'hero-qr-dynamic';
            qrContainer.className = 'hero-qr-float';
            qrContainer.style.cssText = `
                position: absolute; 
                bottom: 20px; 
                left: 20px; 
                background: rgba(255,255,255,0.9); 
                padding: 8px; 
                border-radius: 12px; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.3); 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 5px; 
                z-index: 100; 
                backdrop-filter: blur(5px);
                border: 2px solid ${themeColor};
                cursor: pointer;
                transition: transform 0.3s ease;
            `;
            qrContainer.setAttribute('title', 'Click para copiar enlace del sitio');
            qrContainer.onclick = () => {
                navigator.clipboard.writeText(siteUrl);
                if (app.ui.runConsoleSim) app.ui.runConsoleSim("URL COPIADA: " + urlId);
                else alert("Enlace copiado: " + siteUrl);
            };

            qrContainer.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(siteUrl)}" 
                     style="width: 65px; height: 65px; display: block; image-rendering: pixelated; border-radius: 4px;"
                     alt="QR SITIO">
                <span style="font-size: 0.5rem; font-weight: 800; color: #333; letter-spacing: 0.5px;">SITIO OFICIAL</span>
            `;
            qrTarget.appendChild(qrContainer);
        }

        // --- DYNAMIC CONTENT ENGINE (v6.2.0) ---
        app.public.renderDynamicContent();
    },

    renderDynamicContent: () => {
        const urlId = String(app.state.companyId || "").trim().toUpperCase();
        const pages = app.data.Config_Paginas || [];
        console.log(`[DEBUG_CONTENT] Búsqueda: Co ${urlId}, Hash: ${window.location.hash || '#home'}, Páginas: ${pages.length}`);

        // Buscar página por empresa y contexto
        const rawHash = window.location.hash.replace('#', '') || 'home';
        const hash = rawHash.trim().toLowerCase();

        const pageData = pages.find(p => {
            const coMatch = String(p.id_empresa || "").trim().toUpperCase() === urlId;
            const pgMatch = String(p.id_pagina || "").trim().toLowerCase() === hash;
            return coMatch && pgMatch;
        });

        console.log(`[DEBUG_RENDER] Resultado: ${pageData ? 'ENCONTRADA' : 'NO_ENCONTRADA'}`);

        const section = document.getElementById('dynamic-story-section');
        const heroBanner = document.getElementById('hero-banner-main');
        if (!section) return;

        if (!pageData) {
            section.classList.add('hidden');
            section.style.display = 'none';
            if (heroBanner && hash === 'home') heroBanner.style.display = 'block';
            return;
        }

        const company = app.data.Config_Empresas.find(c => c.id_empresa === urlId) || {};

        // --- OCULTAR HERO ESTÁNDAR SI ES SUBPÁGINA (v6.2.0) ---
        if (heroBanner && hash !== 'home') {
            heroBanner.style.display = 'none';
        }

        try {
            const meta = typeof pageData.meta_json === 'string' ? JSON.parse(pageData.meta_json) : pageData.meta_json;
            const schema = typeof pageData.schema_json === 'string' ? JSON.parse(pageData.schema_json) : pageData.schema_json;
            const content = typeof pageData.contenido_json === 'string' ? JSON.parse(pageData.contenido_json) : pageData.contenido_json;

            // 1. Inyectar Meta (v6.2.0)
            if (meta && meta.title) document.title = meta.title;
            if (meta && meta.description) {
                let metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', meta.description);

                // INYECCIÓN OPEN GRAPH DINÁMICA v6.2.6 (PARA ROBOTS QUE LEEN JS)
                let ogTitle = document.querySelector('meta[property="og:title"]');
                let ogDesc = document.querySelector('meta[property="og:description"]');
                let ogImg = document.querySelector('meta[property="og:image"]');

                if (ogTitle && meta.title) ogTitle.setAttribute('content', meta.title);
                if (ogDesc && meta.description) ogDesc.setAttribute('content', meta.description);
                if (ogImg) {
                    const sceneImg = content.imagen_url || company.foto_Agente || company.logo_url;
                    ogImg.setAttribute('content', app.utils.fixDriveUrl(sceneImg));
                }
            }

            // 2. Inyectar Schema (v6.2.0) - REFUERZO SEGURIDAD v6.2.4
            if (schema) {
                let scriptId = `schema-${urlId}-${hash}`;
                let existing = document.getElementById(scriptId);
                if (existing) existing.remove(); // Evitar duplicados al navegar

                try {
                    const script = document.createElement('script');
                    script.id = scriptId;
                    script.type = 'application/ld+json';
                    // Limpieza básica de caracteres que rompen JSON si vinieran de Excel
                    const cleanSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
                    script.text = JSON.stringify(cleanSchema);
                    document.head.appendChild(script);
                } catch (e) {
                    console.warn("[SEO_SCHEMA] Error inyectando Schema:", e);
                }
            }

            // 3. Renderizar Contenido Visual
            if (content) {
                console.log("[DEBUG_RENDER] Pintando contenido dinámico v6.2.2...");
                section.classList.remove('hidden');
                section.style.display = 'grid'; // Force Grid
                section.style.visibility = 'visible';
                section.style.opacity = '1';
                section.style.border = '1px solid rgba(0,0,0,0.05)'; // Borde sutil de control

                const h2 = document.getElementById('story-h2');
                const h3 = document.getElementById('story-h3');
                const body = document.getElementById('story-content');
                const actions = document.getElementById('story-actions');
                const img = document.getElementById('story-img');
                const imgContainer = document.querySelector('.story-image-container');

                // Imagen de acompañamiento
                if (img) {
                    const fallback = company.foto_Agente || company.foto_agente || company.logo_url;
                    const finalImg = app.utils.fixDriveUrl(content.imagen_url || fallback);
                    if (finalImg) {
                        img.src = finalImg;
                        img.style.display = 'block';
                        if (imgContainer) imgContainer.style.display = 'block';
                        section.style.gridTemplateColumns = '1fr 1fr';
                    } else {
                        img.style.display = 'none';
                        if (imgContainer) imgContainer.style.display = 'none';
                        section.style.gridTemplateColumns = '1fr'; // Full width if no image
                    }
                }

                if (h2) {
                    h2.innerHTML = content.H1 || content.H2_1 || content.H2_3 || "Sin Título";
                    h2.style.color = "#111"; // Negro intenso
                    h2.style.display = 'block';
                }

                if (h3) {
                    // Subtítulo: Prioriza H3_1 pero acepta H2_1 o H2_3 si no se usaron en el título
                    let sub = content.H3_1 || "";
                    if (!sub && content.H2_1 && content.H2_1 !== h2.innerText) sub = content.H2_1;
                    if (!sub && content.H2_3 && content.H2_3 !== h2.innerText) sub = content.H2_3;

                    h3.innerHTML = sub;
                    h3.style.color = "#d32f2f"; // Rojo SuitOrg para destacar
                    h3.style.display = h3.innerHTML ? 'block' : 'none';
                }

                if (body) {
                    body.style.color = "#333";
                    body.style.display = 'block';

                    // AGRUPACIÓN INTELIGENTE DE PÁRRAFOS (v6.2.4)
                    let paragraphs = [];
                    if (content.p_intro) paragraphs.push(content.p_intro);
                    if (content.p_mision) paragraphs.push(`<strong>Nuestra Misión:</strong> ${content.p_mision}`);
                    if (content.p_problema) paragraphs.push(content.p_problema);
                    if (content.p_que_es) paragraphs.push(content.p_que_es);

                    body.innerHTML = paragraphs.join('<br><br>') || "Cargando narrativa...";
                }

                if (actions) {
                    actions.innerHTML = "";
                    const themeColor = company.color_tema || '#004d40';
                    const ctaText = content.cta_texto || 'Saber Más';
                    actions.innerHTML += `<button class="btn-primary" onclick="window.location.hash='#contact'" style="padding:15px 35px; border-radius:50px; background:${themeColor}; cursor:pointer; border:none; color:white; font-weight:bold;">${ctaText}</button>`;

                    const wa = content.whatsapp_url || `https://wa.me/${company.telefonowhatsapp}`;
                    if (wa && wa.includes('wa.me')) {
                        const secondaryText = content.cta_secundario || 'WhatsApp';
                        actions.innerHTML += `<button class="btn-secondary" onclick="window.open('${wa}', '_blank')" style="padding:15px 35px; border-radius:50px; background:white; color:#333; border:1px solid #ddd; cursor:pointer;">${secondaryText}</button>`;
                    }
                }
            } else {
                section.classList.add('hidden');
                section.style.display = 'none';
            }

        } catch (e) {
            console.error("[DYNAMIC_CONTENT] Error parsing JSON:", e);
            section.classList.add('hidden');
            section.style.display = 'none';
        }
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
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">Día y Hora</label>
                        <input type="datetime-local" id="res-date" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">Tu Nombre</label>
                        <input type="text" id="res-name" placeholder="¿Cómo te llamas?" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">WhatsApp</label>
                        <input type="tel" id="res-wa" placeholder="Para confirmación" required style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                    </div>
                    <div class="form-group">
                        <label style="font-size:0.8rem; font-weight:bold; color:#555;">Servicio / Motivo</label>
                        <select id="res-service" style="width:100%; padding:12px; border:2px solid #f0f0f0; border-radius:15px;">
                            <option>Información General</option>
                            <option>Cotización</option>
                            <option>Soporte Técnico</option>
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
                alert("¡Cita agendada con éxito! Te contactaremos por WhatsApp.");
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
            container.innerHTML += `<div class="seo-grid"></div>`;
            grid = container.querySelector('.seo-grid');
        } else {
            grid.innerHTML = '';
        }

        seoData.sort((a, b) => (parseInt(a.orden) || 99) - (parseInt(b.orden) || 99));

        seoData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feature-card seo-card-premium';

            // Lógica de Identidad Dinámica (v5.7.5)
            const brandColor = item.hex_color || 'var(--primary-color)';
            const waNumber = item.wa_directo || company.telefonowhatsapp || '';
            const mail = item.mail_directo || company.email || '';

            const hasPhoto = item.foto_url || item.url_foto || item.imagen_url;
            const bgStyle = hasPhoto ? `background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url('${app.utils.fixDriveUrl(hasPhoto)}'); background-size: cover; background-position: center; border: none;` : `border: 2px solid ${brandColor}; box-shadow: 0 4px 15px ${brandColor}22;`;

            const keywords = (item.keywords_coma || "").split(',').map(k => k.trim()).filter(k => k);
            const keywordHtml = keywords.map(k => `<span class="seo-tag" style="border-color:${brandColor}; color:${hasPhoto ? 'white' : brandColor}; background:${hasPhoto ? 'rgba(255,255,255,0.1)' : brandColor + '11'}">${k}</span>`).join('');

            card.style.cssText = bgStyle;


            card.innerHTML = `
                <div class="seo-card-inner" style="position:relative;">
                    <div class="seo-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; margin-bottom:15px;">
                        <!-- IZQUIERDA: ICONOS DE CONTACTO + QR (v6.0.2 Prueba) -->
                        <div style="display:flex; flex-direction:column; align-items:flex-start; gap:10px; z-index:10; margin-top:5px;">
                            <div style="display:flex; gap:8px;">
                                ${mail ? `<a href="mailto:${mail}" class="seo-action-icon" title="Enviar Correo" onclick="event.stopPropagation();"><i class="fas fa-envelope" style="color: white !important;"></i></a>` : ''}
                                ${waNumber ? `<a href="https://wa.me/${waNumber.toString().replace(/\D/g, '')}?text=Hola! Vengo del sitio de ${company.nomempresa} y me interesa: ${item.titulo}" target="_blank" class="seo-action-icon" title="WhatsApp Directo" onclick="event.stopPropagation();"><i class="fab fa-whatsapp" style="color: #25D366 !important;"></i></a>` : ''}
                            </div>
                            
                            <!-- QR CODE Lateral -->
                            ${waNumber ? `
                                <div class="seo-qr-container" style="background:white; padding:4px; border-radius:6px; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid ${brandColor}; cursor:pointer;" title="Escanea para contacto directo" onclick="event.stopPropagation(); window.open('https://wa.me/${waNumber.toString().replace(/\D/g, '')}', '_blank')">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://wa.me/' + waNumber.toString().replace(/\D/g, '') + '?text=Hola! Deseo informacion de: ' + item.titulo)}" 
                                         alt="QR Contacto" style="width:60px; height:60px; display:block; image-rendering: pixelated;"
                                         onerror="this.src='https://qrickit.com/api/qr?d=${encodeURIComponent('https://wa.me/' + waNumber.toString().replace(/\D/g, '') + '?text=Hola! Deseo informacion de: ' + item.titulo)}&addtext=${encodeURIComponent(company.nomempresa)}&txtcolor=444444'">
                                </div>
                            ` : ''}
                        </div>

                        <!-- CENTRO: TITULO (Limpio) -->
                        <div class="seo-title-group" style="flex:1; text-align:center; padding:0 15px; display:flex; flex-direction:column; align-items:center;">
                            <h4 style="color:${brandColor}; ${hasPhoto ? 'text-shadow:0 0 10px rgba(0,0,0,0.8), 0 0 5px white;' : ''} font-weight:800; margin:0; font-size:1.1rem; line-height:1.2;">
                                ${item.titulo}
                            </h4>
                            <small style="color:${hasPhoto ? 'rgba(255,255,255,0.8)' : '#888'}; display:block; margin-top:5px;">${item.division || item.categoria || 'Servicio ' + company.nomempresa}</small>
                        </div>

                        <!-- DERECHA: ICONO DE CONFIG_SEO -->
                        <div class="seo-config-icon" style="background:${brandColor}; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px ${brandColor}88; flex-shrink:0;">
                            <i class="${item.icono || 'fas fa-shield-alt'}" style="color:white !important; font-size:1rem !important;"></i>
                        </div>
                    </div>
                    <p class="seo-desc" style="${hasPhoto ? 'color:rgba(255,255,255,0.9);' : 'color:#555;'} font-size:0.85rem; margin:15px 0;">${item.descripcion || ''}</p>
                    <div class="seo-tags">${keywordHtml}</div>
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
                    const img = p.imagen_url ? app.utils.fixDriveUrl(p.imagen_url) : 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
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
        if (hLogo) hLogo.src = "https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv";
        document.documentElement.style.setProperty('--primary-color', '#004d40'); // SuitOrg Teal base

        const container = document.getElementById('orbit-bubbles');
        if (!container) return;
        container.innerHTML = '';
        const companies = (app.data.Config_Empresas || []).filter(co => {
            const isHabil = (co.habilitado === 'TRUE' || co.habilitado === true || co.habilitado === "1");
            const isProd = (co.modo === 'PROD');
            // Nota: En la Órbita se ven todos los activos/producción. El aislamiento (is_isolated)
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
        if (screenW < 768) scaleFactor = 0.4; // Móvil: -60%
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
                     onerror="this.src='https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv'">
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

        // --- ACTUALIZACIÓN MENÚ HUB (Inyectar Inquilinos) ---
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
                <a class="btn-link" onclick="app.public.showLocation()">Ubicación</a>
                <a class="btn-link" onclick="app.public.showReviews()">Opiniones</a>
                <a class="btn-link" onclick="window.location.hash='#pillars'">Pilares</a>
                <a class="btn-link" onclick="app.public.showAboutUs()">Nosotros</a>
                <a class="btn-link" onclick="app.public.showPolicies()">Políticas</a>
                ${showForm ? `<a class="btn-link" onclick="window.location.hash='#contact'">Contáctanos</a>` : ''}
                ${siteMode === 'HYBRID' ? `<a class="btn-link" onclick="window.location.hash='#orbit'" style="opacity:0.4; font-size:0.6rem !important;">• Hub</a>` : ''}
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
            { title: 'MISIÓN', text: company.mision, icon: 'fa-bullseye' },
            { title: 'VISIÓN', text: company.vision, icon: 'fa-eye' },
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
        const grid = document.getElementById('company-gallery-grid');
        if (!grid) return;
        const imgs = (app.data.Config_Galeria || []).filter(img => img.id_empresa === app.state.companyId);
        if (imgs.length === 0) {
            grid.innerHTML = '';
            return;
        }
        grid.innerHTML = imgs.map(img => `
            <div class="gallery-item">
                <img src="${app.utils.fixDriveUrl(img.url_imagen || img.imagen_url)}" alt="${img.titulo}" class="gallery-img">
                <div class="gallery-info"><h4>${img.titulo || 'Item'}</h4></div>
            </div>`).join('');
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
                <p>Por el momento este negocio no recibe solicitudes vía formulario.</p>
                <button class="btn-primary" onclick="window.location.hash='#home'">Volver al Inicio</button>
            </div>`;
            return;
        }

        const isInsurance = (company.tipo_negocio || "").toString().toUpperCase().includes('SEGUROS') || (company.tipo_negocio || "").toString().toUpperCase().includes('FINANZAS');

        container.innerHTML = `
            <div class="form-container">
                <h2>${isInsurance ? 'Solicitud de Asesoría' : 'Contáctanos'}</h2>
                <p>${isInsurance ? 'Personaliza tu protección. Un experto de TopLux Finance te contactará.' : 'Déjanos tus datos y un asesor se comunicará contigo.'}</p>
                <form id="public-lead-form">
                    <div class="form-group">
                        <label>Teléfono / WhatsApp *</label>
                        <input type="tel" id="lead-phone" required placeholder="Ej: 521...">
                    </div>
                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" id="lead-name" required>
                    </div>

                    ${isInsurance ? `
                    <div class="form-group">
                        <label>¿Qué deseas proteger? *</label>
                        <select id="lead-subtype" required onchange="app.public.toggleInsuranceFields(this.value)" style="width:100%; padding:12px; border-radius:12px; border:1px solid #ddd;">
                            <option value="">Selecciona una opción...</option>
                            <option value="GMM">Gastos Médicos Mayores (Salud)</option>
                            <option value="PPR">Plan Personal de Retiro (PPR)</option>
                            <option value="AUTO">Seguro de Auto / Flotilla</option>
                            <option value="VIDA">Seguro de Vida / Invalidez</option>
                            <option value="NEGOCIO">Seguro PyME / Empresarial</option>
                        </select>
                    </div>
                    <!-- Campos Dinámicos de Seguros (v6.1.7) -->
                    <div id="insurance-dynamic-fields" style="margin-top:20px; border-left:4px solid var(--primary-color); padding-left:15px;" class="hidden">
                        <!-- Inyectado por toggleInsuranceFields -->
                    </div>
                    ` : ''}

                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="lead-email">
                    </div>
                    <div class="form-group">
                        <label>Dirección *</label>
                        <input type="text" id="lead-address" required placeholder="Calle, Número, Colonia..." autocomplete="off">
                    </div>
                    
                    ${finalBilling ? `
                    <div id="billing-fields" style="background: rgba(0, 210, 255, 0.05); padding: 15px; border-radius: 12px; border: 1px dashed var(--primary-color); margin: 20px 0;">
                        <h4 style="margin-top:0; color:var(--primary-color); font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">
                            <i class="fas fa-file-invoice"></i> Datos de Facturación (Opcional)
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
                            <label>Dirección Comercial</label>
                            <input type="text" id="lead-billing-address" placeholder="Calle, Número, CP, Ciudad">
                        </div>
                    </div>
                    ` : ''}

                    <div id="contact-msg" class="success-msg hidden" style="margin-bottom:15px; text-align:center; color:var(--primary-color); font-weight:bold;"></div>
                    <button type="submit" class="btn-primary w-100" id="btn-submit-contact">
                        ${isInsurance ? 'Solicitar Cotización Virtual' : 'Enviar Información'} <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
                    </button>
                </form>
            </div>
        `;

        // --- Lógica de Auto-rellenado (v5.2.4) ---
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
                        msg.innerText = "¡Bienvenido de nuevo! Hemos cargado tus datos.";
                        msg.classList.remove('hidden');
                        setTimeout(() => msg.classList.add('hidden'), 3000);
                    }
                }
            });
        }

        // Re-bind el evento ya que el DOM del form cambió
        const publicLeadForm = document.getElementById('public-lead-form');
        if (publicLeadForm) {
            publicLeadForm.onsubmit = async (e) => {
                e.preventDefault();

                // --- Lógica de Captura Dinámica de Seguros (v6.1.7) ---
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
                    <div class="form-group"><label>¿Fuma? *</label><select id="ins-fuma" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"><option value="NO">No</option><option value="SI">Sí</option></select></div>
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
                    <div class="form-group"><label>Código Postal de circulación *</label><input type="text" id="ins-cp" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"></div>
                    <div class="form-group"><label>Uso del vehículo</label><select id="ins-uso" style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee;"><option value="PARTICULAR">Particular</option><option value="PLATAFORMA">Plataforma (Uber/Didi)</option><option value="CARGA">Carga/Reparto</option></select></div>
                `;
                break;
            default:
                html = `<div class="form-group"><label>Describe brevemente tu necesidad *</label><textarea id="ins-desc" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #eee; height:80px;"></textarea></div>`;
        }

        container.innerHTML = `<h4 style="font-size:0.75rem; color:#888; text-transform:uppercase; margin-bottom:15px;">Información para ${type}</h4> ${html}`;
    },

    renderSuitOnboarding: () => {
        const container = document.getElementById('onboarding-form-container');
        if (!container) return;

        container.innerHTML = `
            <form id="onboarding-form" class="minimalist-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-group" title="El nombre comercial que tus clientes recordarán.">
                    <label><i class="fas fa-store"></i> Nombre del Negocio *</label>
                    <input type="text" id="onb-name" required placeholder="Ej: Mi Cafetería Gourmet">
                </div>
                <div class="form-group" title="Define las reglas y diseño inicial de tu sitio.">
                    <label><i class="fas fa-tags"></i> Tipo de Negocio</label>
                    <select id="onb-type" onchange="app.public.autoFillOnboarding(this.value)">
                        <option value="">Selecciona una categoría...</option>
                        <option value="Food/Snacks">Food (Restaurantes, Cafés, Bebidas)</option>
                        <option value="Servicios">Servicios (Consultoría, Limpieza, Talleres)</option>
                        <option value="Hospedaje">Hospedaje (Hoteles, AirBnb, Cabañas)</option>
                        <option value="Industrial/Proyectos">Industrial (Construcción, Fábricas, Ingeniería)</option>
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
                <div class="form-group" title="Link de tu logotipo (puedes pegarlo aquí).">
                    <label><i class="fas fa-image"></i> URL del Logotipo</label>
                    <input type="text" id="onb-logo" placeholder="https://ejemplo.com/mi-logo.png">
                </div>

                <div class="form-group" style="grid-column: span 2;" title="Aparecerá en el pie de página y mapa.">
                    <label><i class="fas fa-map-marker-alt"></i> Dirección Física</label>
                    <input type="text" id="onb-address" placeholder="Ej: Av. Principal 123, Monterrey">
                </div>
                
                <div id="onb-advanced" class="form-row" style="grid-column: span 2; display: none; flex-direction: column; gap: 15px; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 12px; border: 1px dashed #ddd;">
                    <p style="font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; color: var(--primary-color);">INTELIGENCIA DE MARCA (Auto-rellenada):</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Misión Sugerida</label>
                            <textarea id="onb-mision" style="height: 50px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; opacity: 0.6;">Visión Sugerida</label>
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
                            <label style="font-size: 0.75rem; opacity: 0.6;">Políticas de Servicio</label>
                            <textarea id="onb-politicas" style="height: 40px; font-size: 0.75rem; width: 100%;"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-group" style="grid-column: span 2; margin-top: 10px;">
                    <button type="submit" class="btn-primary w-100" style="height: 55px; font-size: 1.2rem; font-weight: bold; border-radius: 50px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                        <i class="fas fa-rocket"></i> GENERAR MI SITIO WEB GRATIS
                    </button>
                    <p style="font-size: 0.75rem; text-align: center; margin-top: 10px; opacity: 0.5;">
                        * Al registrarte aceptas un periodo de prueba de 20 días. Sitio quedará en borrador hasta activación manual.
                    </p>
                </div>
            </form>
            <div id="onb-success" class="hidden" style="text-align: center; padding: 40px;">
                <i class="fas fa-check-circle fa-4x" style="color: #2ecc71; margin-bottom: 20px;"></i>
                <h3 style="font-size: 1.8rem; margin-bottom: 10px;">¡Borrador Creado con Éxito!</h3>
                <p id="onb-msg-final" style="margin-bottom: 30px;">Tu sitio está listo para previsualización.</p>
                <div style="display: flex; gap:15px; justify-content: center;">
                    <button id="btn-see-site" class="btn-primary" style="padding: 12px 30px; border-radius: 50px;">VER MI PÁGINA</button>
                    <a id="btn-wa-activate" class="btn-support" target="_blank" style="padding: 12px 30px; border-radius: 50px; background: #25D366; text-decoration: none; color: white; display: flex; align-items: center; gap: 8px;">
                         <i class="fab fa-whatsapp"></i> CONTACTAR A ACTIVACIÓN
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
                m: "Cocinamos con pasión para regalar momentos inolvidables a través del sabor.",
                v: "Ser la opción favorita de comida en la ciudad, reconocida por frescura y calidad.",
                val: "Sabor, Higiene, Pasión, Servicio.",
                imp: "Apoyar a productores locales y fomentar la alimentación consciente.",
                pol: "Garantía de sabor o cambio de platillo. Entrega puntual."
            },
            'Servicios': {
                m: "Brindar soluciones profesionales que simplifiquen la vida y multipliquen los resultados de nuestros clientes.",
                v: "Ser líderes regionales en consultoría, basados en la confianza y la innovación constante.",
                val: "Integridad, Excelencia, Innovación, Enfoque al cliente.",
                imp: "Impulsar el crecimiento económico de negocios locales.",
                pol: "Atención personalizada 24/7. Satisfacción garantizada."
            },
            'Industrial/Proyectos': {
                m: "Construir hoy la infraestructura del mañana con los más altos estándares de ingeniería y seguridad.",
                v: "Ser el aliado estratégico indispensable para grandes obras y desarrollos industriales.",
                val: "Seguridad, Precisión, Durabilidad, Cumplimiento.",
                imp: "Crear empleos seguros y desarrollo urbano sostenible.",
                pol: "Certificación de calidad en cada etapa. Garantía de obra."
            },
            'Hospedaje': {
                m: "Ofrecer un refugio de confort y descanso que haga sentir a nuestros huéspedes como en casa.",
                v: "Ser el referente de hospitalidad y calidez, brindando experiencias memorables de alojamiento.",
                val: "Hospitalidad, Calidez, Limpieza, Confianza.",
                imp: "Promover el turismo local responsable y la cultura de la región.",
                pol: "Check-in flexible bajo disponibilidad. Estándares de higiene rigurosos."
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
                const waMsg = `¡Hola! Acabo de registrar mi negocio [${bizData.nomempresa}] con ID [${result.newBusinessId}]. Me gustaría continuar con la configuración.`;
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
 * 🔐 CLIENT VAULT MODULE (v6.1.7)
 * Manejo de documentos sensibles en Google Drive
 */
app.vault = {
    refresh: async () => {
        const grid = document.getElementById('vault-files-grid');
        if (!grid) return;
        if (!app.state.currentUser || !app.state.companyId) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Inicia sesión para ver tus documentos.</p>';
            return;
        }

        // Validar si el cliente tiene acceso (Nivel 1 o superior)
        if (app.state.currentUser.nivel_acceso < 1) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:red;">Acceso Restringido.</p>';
            return;
        }

        // --- DINÁMICA DE REQUISITOS (v6.1.8) ---
        const vaultUploadArea = document.getElementById('vault-upload-area');
        if (vaultUploadArea && !document.getElementById('vault-requirements')) {
            const userLead = (app.data.Leads || []).find(l => l.email === app.state.currentUser.email);
            const subtype = userLead ? (userLead.subtipo_negocio || '').toUpperCase() : '';

            let reqs = ['INE (Escaneada por ambos lados)', 'Comprobante de Domicilio (Vigente)'];
            if (subtype.includes('GMM')) reqs.push('Informe Médico actual', 'Historial clínico');
            if (subtype.includes('AUTO')) reqs.push('Factura del auto', 'Póliza anterior (si aplica)');
            if (subtype.includes('PPR')) reqs.push('CURP', 'Constancia de situación fiscal');

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

        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Consultando Bóveda...</p>';

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
                grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; opacity:0.5; padding:20px;">No hay documentos cargados aún.</p>';
            }
        } catch (e) {
            grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:red;">Error de conexión.</p>';
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
        status.innerText = "¡Archivos enviados a revisión!";
        setTimeout(() => status.classList.add('hidden'), 3500);
        app.vault.refresh();
    }
};
