app.pos = {
    addToCart: (id) => {
        const userRole = (app.state.currentUser?.id_rol || "").toString().toUpperCase();
        if (userRole === 'DELIVERY' || (app.state.currentUser?.nombre || "").toUpperCase().includes('REPARTIDOR')) {
            return; 
        }
        const prod = app.data.Catalogo.find(p => p.id_producto === id);
        if (!prod) return;
        if (parseInt(prod.stock) <= 0) {
            alert("Sin inventario para este producto.");
            return;
        }
        const inCart = app.state.cart.find(i => i.id === id);
        if (inCart) {
            if (inCart.qty >= parseInt(prod.stock)) {
                alert("No hay más stock disponible.");
                return;
            }
            inCart.qty++;
        } else {
            const price = app.utils.getEffectivePrice(prod);
            app.state.cart.push({ id: prod.id_producto, name: prod.nombre, price: price, qty: 1 });
        }
        app.pos.updateCartVisuals();
        app.pos.saveCart();
    },
    removeFromCart: (id) => {
        const idx = app.state.cart.findIndex(i => i.id === id);
        if (idx > -1) {
            app.state.cart[idx].qty--;
            if (app.state.cart[idx].qty <= 0) app.state.cart.splice(idx, 1);
        }
        app.pos.updateCartVisuals();
        app.pos.saveCart();
    },
    clearCart: () => {
        app.state.cart = [];
        app.state.deliveryMethod = 'DOMICILIO';
        app.state.currentLeadId = null; // Reset CRM match
        // Reset Payment & Field Defaults
        app.ui.setPosPaymentMethod('Efectivo');
        const pFolio = document.getElementById('pos-pay-folio');
        if (pFolio) pFolio.value = '';
        // Sync UI buttons (Reset to Delivery)
        document.querySelectorAll('.delivery-opt, .delivery-opt-staff').forEach(btn => {
            if (btn.id === 'staff-delivery-dom' || btn.dataset.method === 'DOMICILIO') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        app.pos.updateCartVisuals();
        app.pos.renderExpressTicket();
        app.pos.saveCart();
        if (app.ui && app.ui.toggleMobileTicket) app.ui.toggleMobileTicket(false);
    },
    updateCartVisuals: () => {
        let subtotal = 0;
        let count = 0;
        document.querySelectorAll('.food-qty').forEach(el => el.innerText = '0');
        app.state.cart.forEach(item => {
            subtotal += item.price * item.qty;
            count += item.qty;
            const qtyDisplays = document.querySelectorAll(`[id="qty-${item.id}"]`);
            qtyDisplays.forEach(el => el.innerText = item.qty);
        });
        // Delivery Logic
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const deliveryFee = parseFloat(company?.costo_envio || 0);
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        // v4.7.2 Fix: Si el carrito está vacío, el total DEBE ser $0.00 (ignora fee de envío)
        const total = count > 0 ? (subtotal + (isDelivery ? deliveryFee : 0)) : 0;

        // Standard POS Visuals (Mobile/Client)
        const totalEl = document.getElementById('cart-total');
        if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
        const countEl = document.getElementById('cart-count-badge');
        if (countEl) {
            countEl.innerText = count;
            countEl.classList.toggle('hidden', count === 0);
        }
        // Ticket Sidebar Visuals (Staff)
        const ticketTotalEl = document.getElementById('ticket-total');
        if (ticketTotalEl) ticketTotalEl.innerText = `$${total.toFixed(2)}`;
        const ticketSubtotalEl = document.getElementById('ticket-subtotal');
        if (ticketSubtotalEl) ticketSubtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        const ticketCountEl = document.getElementById('ticket-count');
        if (ticketCountEl) ticketCountEl.innerText = count;
        const staffDevFeeEl = document.getElementById('staff-delivery-fee');
        if (staffDevFeeEl) staffDevFeeEl.innerText = `$${deliveryFee.toFixed(2)}`;
        const staffDevRow = document.getElementById('staff-delivery-row');
        if (staffDevRow) staffDevRow.classList.toggle('hidden', !isDelivery);
        // Mobile Floating Trigger Visuals (PFM)
        const mobileTrigger = document.getElementById('mobile-ticket-trigger');
        if (mobileTrigger) {
            mobileTrigger.classList.remove('cart-pulse');
            void mobileTrigger.offsetWidth; // Trigger reflow
            mobileTrigger.classList.add('cart-pulse');
        }
        const mobileTotalEl = document.getElementById('mobile-cart-total');
        if (mobileTotalEl) mobileTotalEl.innerText = `$${total.toFixed(2)}`;
        const mobileBadgeEl = document.getElementById('mobile-cart-badge');
        if (mobileBadgeEl) {
            mobileBadgeEl.innerText = count;
            mobileBadgeEl.classList.toggle('hidden', count === 0);
        }
        app.pos.renderTicketContent();
        app.pos.updateLastSaleDisplay();
    },
    renderTicketContent: () => {
        const container = document.getElementById('ticket-items');
        if (!container) return;
        // Update Ticket Logo to match current company
        const logoEl = document.getElementById('ticket-logo');
        const currentCo = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        if (logoEl && currentCo) {
            const logoUrl = currentCo.logo_url || currentCo.url_logo;
            if (logoUrl) {
                logoEl.src = app.utils.fixDriveUrl(logoUrl);
                logoEl.classList.remove('hidden');
            } else {
                logoEl.classList.add('hidden');
            }
        }
        if (app.state.cart.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Carrito vacñÂƒÂ­o</p>';
            return;
        }
        container.innerHTML = app.state.cart.map(item => `
                <div class="ticket-item">
                    <div class="ticket-item-name">${item.name} x${item.qty}</div>
                    <div class="ticket-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                </div>
            `).join('');
        const dateEl = document.getElementById('ticket-date');
        if (dateEl) dateEl.innerText = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    checkoutStaff: async () => {
        if (app.state.cart.length === 0) return alert("Elegir productos primero.");
        const isPickup = app.state.deliveryMethod === 'PICKUP';
        // Get Express/Customer data from staff sidebar
        const sName = document.getElementById('pos-cust-name').value;
        const sPhone = document.getElementById('pos-cust-phone').value;
        const sAddress = document.getElementById('pos-cust-address').value;
        const sNotes = document.getElementById('pos-cust-notes')?.value || "";
        if (!isPickup && (!sName || !sAddress)) {
            return alert("Para envñÂƒÂ­os es necesario el nombre y direcciñÂƒÂ³n del cliente.");
        }
        const finalName = sName || "Venta en Mostrador";
        const finalPhone = sPhone || "N/A";
        const finalAddress = sAddress || (isPickup ? "Venta Local" : "");
        // Map to main checkout inputs (modal inputs are used as bridge)
        const mainName = document.getElementById('cust-name');
        const mainPhone = document.getElementById('cust-phone');
        const mainAddress = document.getElementById('cust-address');
        const mainNotes = document.getElementById('cust-notes');
        if (mainName) mainName.value = finalName;
        if (mainPhone) mainPhone.value = finalPhone;
        if (mainAddress) mainAddress.value = finalAddress;
        if (mainNotes) mainNotes.value = sNotes;
        const method = document.getElementById('pos-pay-method').value;
        const folio = document.getElementById('pos-pay-folio').value || '';
        document.getElementById('pay-method').value = method;
        document.getElementById('pay-confirm').value = folio;
        const isStaffSale = true; // Hardcoded here because we ARE in checkoutStaff
        const btn = document.getElementById('btn-pos-checkout');
        if (btn) {
            btn.classList.add('blink-confirm');
            setTimeout(() => btn.classList.remove('blink-confirm'), 600);
        }
        await app.pos.checkout(true);
        // Clear sidebar fields after success
        document.getElementById('pos-cust-name').value = '';
        document.getElementById('pos-cust-phone').value = '';
        document.getElementById('pos-cust-address').value = '';
        const nEl = document.getElementById('pos-cust-notes');
        if (nEl) nEl.value = '';
        // Clear Cash Control (v5.7.1)
        const cashIn = document.getElementById('pos-cash-input');
        if (cashIn) cashIn.value = '';
        const cashCh = document.getElementById('pos-cash-change');
        if (cashCh) cashCh.innerText = '$0.00';

        // Ensure folio is also cleared here just in case
        const pFolio = document.getElementById('pos-pay-folio');
        if (pFolio) pFolio.value = '';
        // Re-sync UI (Reset to Efectivo)
        app.ui.setPosPaymentMethod('Efectivo');
        app.pos.setDeliveryMethod('DOMICILIO');
        // Auto-close staff sidebar immediately on success
        if (app.ui && app.ui.toggleMobileTicket) {
            app.ui.toggleMobileTicket(false);
        }
    },
    updateLastSaleDisplay: () => {
        const el = document.getElementById('ticket-last-val');
        if (!el) return;
        // Use the standard table name Proyectos_Pagos
        const myProjectIds = (app.data.Proyectos || [])
            .filter(p => p.id_empresa === app.state.companyId)
            .map(p => p.id_proyecto);
        const payments = (app.data.Proyectos_Pagos || [])
            .filter(pay => myProjectIds.includes(pay.id_proyecto));
        if (payments.length === 0) {
            el.innerText = "$0.00";
            return;
        }
        // Robust Sort: Date first, then index in original array (for same-second sales)
        const sorted = [...payments].sort((a, b) => {
            const dateA = new Date(a.fecha_pago || 0).getTime();
            const dateB = new Date(b.fecha_pago || 0).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return payments.indexOf(b) - payments.indexOf(a);
        });
        const lastOne = sorted[0];
        el.innerText = lastOne ? `$${parseFloat(lastOne.monto).toFixed(2)}` : "$0.00";
    },
    checkout: async (forcedStaff = false) => {
        if (app.state.cart.length === 0) return alert("El carrito estñÂƒ¡ vacñÂƒÂ­o.");
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address')?.value || '';
        const notes = document.getElementById('cust-notes')?.value || '';
        const method = document.getElementById('pay-method').value;
        const confirmNum = document.getElementById('pay-confirm')?.value || '';
        // Priority for staff detection: manually forced or via URL hash
        const isStaffSale = forcedStaff || (window.location.hash === '#staff-pos') || (name === "Venta en Mostrador");
        const isPickup = app.state.deliveryMethod === 'PICKUP';
        if (!name || (!isStaffSale && !phone) || (!isStaffSale && !isPickup && !address)) {
            return alert("Por favor completa los campos obligatorios (*).");
        }
        // UI Feedback: Detect which button to animate (Public vs Staff)
        const btnStaff = document.getElementById('btn-pos-checkout');
        const btnPublic = document.getElementById('btn-confirm-order');
        const btn = isStaffSale ? btnStaff : btnPublic;
        const originalText = btn ? btn.innerText : "...";
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            btn.disabled = true;
        }
        // 1. Create Lead (o buscar existente)
        const leadData = {
            id_empresa: app.state.companyId,
            nombre: name,
            telefono: phone,
            direccion: address,
            origen: isStaffSale ? 'APP-POS-COUNTER' : 'APP-ORDER',
            nivel_crm: (name && name !== "Venta en Mostrador" && address) ? 1 : 0,
            fecha: app.utils.getTimestamp()
        };
        // Inyectar ID si el cliente ya existe para evitar duplicado (v5.1.1)
        if (app.state.currentLeadId) {
            leadData.id_lead = app.state.currentLeadId;
        }
        const cartSubtotal = app.state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const deliveryFee = isPickup ? 0 : (parseFloat(company?.costo_envio) || 0);
        const cartTotal = cartSubtotal + deliveryFee;
        // NEW TRANSACTIVE FLOW (v3.6.2)
        // One single call for everything: Lead + Project + Payment + Stock
        app.ui.updateConsole("SYNCING_ORDER...");
        const stockUpdates = [];
        app.state.cart.forEach(item => {
            const prod = app.data.Catalogo.find(p => String(p.id_producto) === String(item.id));
            if (prod) {
                const newStock = Math.max(0, (parseInt(prod.stock) || 0) - item.qty);
                prod.stock = newStock; // Update local memory immediately
                stockUpdates.push({ id_producto: String(item.id), id_empresa: app.state.companyId, stock: newStock });
            }
        });
        const keywords = ['Alimentos', 'Comida', 'Restaurante', 'Snack', 'Food', 'PFM', 'PMP', 'HMP'];
        const bizType = (company?.tipo_negocio || "").toString();
        const bizId = (app.state.companyId || "").toString().toUpperCase();
        const isFood = keywords.some(k => bizType.includes(k) || bizId.includes(k));

        const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE" || company?.usa_otp_entrega === "1" || isFood;
        let generatedOtp = "";
        if (useOtp) {
            generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
            app.state._currentOrderOtp = generatedOtp;
        }
        const fullOrderPayload = {
            action: 'processFullOrder',
            token: app.apiToken,
            lead: leadData,
            project: {
                id_empresa: app.state.companyId,
                nombre_proyecto: `Pedido ${company?.nomempresa || "POS"} - ${name}`,
                direccion: address,
                telefono: phone,
                descripcion: `DIR: ${address} | TEL: ${phone} | NOTAS: ${notes}`,
                line_items: JSON.stringify(app.state.cart),
                codigo_otp: generatedOtp,
                estatus: "PEDIDO-RECIBIDO",
                estado: "PEDIDO-RECIBIDO",
                status: "PEDIDO-RECIBIDO"
            },
            payment: {
                id_empresa: app.state.companyId,
                monto: cartTotal,
                concepto: `Venta POS - ${name}`,
                metodo_pago: method,
                folio: confirmNum || "CAJA",
                referencia: isStaffSale ? "STAFF" : "CLIENTE-URL",
                pago_con: document.getElementById('pos-cash-input')?.value || 0,
                cambio: (document.getElementById('pos-cash-change')?.innerText || "$0.00").replace('$', '')
            },
            stockUpdates: stockUpdates
        };
        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(fullOrderPayload)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Error en el servidor");
            app.state.lastOrderId = result.newOrderId;
            // 5. Success UI & Cleanup
            if (isStaffSale) {
                const printNow = confirm("¡Pedido registrado exitosamente!\n\n¿Deseas imprimir el ticket físico?");
                if (printNow) {
                    try {
                        app.ui.printTicket({ name: name, costo_envio: deliveryFee }, [...app.state.cart]);
                    } catch (pErr) {
                        console.error("Print error:", pErr);
                    }
                }
                app.pos.clearCart();
                app.pos.saveCart();
                app.pos.closeCheckout();
            } else {
                app.pos.nextStep(3);
            }
            app.ui.updateConsole("ORDER_SUCCESS");
            // Refresh Data in background
            app.loadData().then(() => {
                if (window.location.hash === '#pos') app.ui.renderPOS();
                if (window.location.hash === '#staff-pos') app.ui.renderStaffPOS();
                app.pos.updateLastSaleDisplay();
            });
        } catch (e) {
            console.error("Order Transaction Error:", e);
            app.ui.updateConsole("TRANS_FAIL", true);
            alert("Hubo un error al procesar tu pedido. Por favor intenta de nuevo.");
        } finally {
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    },
    renderCartSummary: () => {
        const container = document.getElementById('cart-list-summary');
        if (!container) return;
        if (app.state.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">Carrito vacñÂƒÂ­o</p>';
            return;
        }
        let total = 0;
        const itemsHtml = app.state.cart.map(item => {
            const subtotal = item.price * item.qty;
            total += subtotal;
            return `
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 4px 0; border-bottom: 1px dashed #eee;">
                        <span>${item.qty}x ${item.name}</span>
                        <span style="font-weight:bold;">$${subtotal.toFixed(2)}</span>
                    </div>
                `;
        }).join('');
        container.innerHTML = `
                <div style="background:#f9f9f9; padding:10px; border-radius:8px; margin-bottom:15px; border: 1px solid #eee;">
                    ${itemsHtml}
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:bold; color:var(--primary-color); font-size:1rem; border-top: 2px solid #eee; padding-top:5px;">
                        <span>TOTAL</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            `;
    },
    handlePayMethodChange: () => {
        const method = document.getElementById('pay-method').value;
        const confirmBlock = document.getElementById('confirm-block');
        const bankDisplay = document.getElementById('bank-info-display');
        const bankText = document.getElementById('bank-details-text');
        // Toggle NñÂ‚Â° ConfirmaciñÂƒÂ³n block
        if (confirmBlock) confirmBlock.classList.toggle('hidden', method !== 'Transferencia');
        // Toggle & Populate Bank Info
        if (bankDisplay && bankText) {
            if (method === 'Transferencia') {
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                // Support multiple casing formats for bank information
                const bName = company.infobanco || company.Info_Banco || company.info_banco;
                const bAcc = company.infocuenta || company.Info_Cuenta || company.info_cuenta || "Pendiente";
                const bNom = company.infonom || company.InfoNom || company.info_nom || company.Info_Nom || "";
                if (company && bName) {
                    bankText.innerHTML = `
                            <div style="font-weight:bold; margin-bottom:4px;">${bName}</div>
                            <div style="font-size:1.1rem; letter-spacing:1px; margin-bottom:4px;">${bAcc}</div>
                            ${bNom ? `<div style="font-size:0.8rem; opacity:0.8;">Titular: ${bNom}</div>` : ''}
                        `;
                    bankDisplay.classList.remove('hidden');
                } else {
                    bankText.innerText = "Datos bancarios no configurados.";
                    bankDisplay.classList.remove('hidden');
                }
            } else {
                bankDisplay.classList.add('hidden');
            }
        }
    },
    openCheckout: () => {
        if (app.state.cart.length === 0) return alert("El carrito está vacío.");
        // Reset to Step 1 and defaults
        app.pos.setDeliveryMethod('DOMICILIO');
        app.pos.nextStep(1);
        document.getElementById('checkout-modal').classList.remove('hidden');
        // Render Express Ticket (Step 1)
        app.pos.renderExpressTicket();
        // Initial pay method check
        app.pos.handlePayMethodChange();
    },
    nextStep: (n) => {
        // Hide all steps
        document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));
        // Show requested step
        const target = document.getElementById(`checkout-step-${n}`);
        if (target) target.classList.remove('hidden');
        // Handle Step 3 OTP & OTS display
        if (n === 3) {
            const otsVal = document.getElementById('ots-folio-value');
            if (otsVal && app.state.lastOrderId) {
                otsVal.innerText = "#" + app.state.lastOrderId;
            }

            const otpBanner = document.getElementById('otp-success-banner');
            const otpVal = document.getElementById('otp-success-value');
            if (otpBanner && otpVal) {
                if (app.state._currentOrderOtp) {
                    otpVal.innerText = app.state._currentOrderOtp;
                    otpBanner.classList.remove('hidden');
                } else {
                    otpBanner.classList.add('hidden');
                }
            }
        }
        // Update dots
        const dot = document.getElementById(`step-dot-${n}`);
        if (dot) dot.classList.add('active');
    },
    closeCheckout: () => {
        document.getElementById('checkout-modal').classList.add('hidden');
        // Uber Eats Style: Always clear if we finished or if explicitly closed after success
        const isStep3 = !document.getElementById('checkout-step-3').classList.contains('hidden');
        if (isStep3) {
            app.pos.clearCart();
            // Clear fields to avoid data persistence
            document.getElementById('cust-name').value = '';
            document.getElementById('cust-phone').value = '';
            document.getElementById('cust-address').value = '';
            document.getElementById('cust-notes').value = '';
            document.getElementById('pay-method').value = 'Efectivo';
            document.getElementById('pay-confirm').value = '';
            document.getElementById('bank-info-display').classList.add('hidden');
            document.getElementById('confirm-block').classList.add('hidden');
            // Return to home/inicio
            window.location.hash = '#home';
        }
    },
    renderExpressTicket: () => {
        const container = document.getElementById('express-ticket-items');
        const totalEl = document.getElementById('express-ticket-total');
        const subtotalEl = document.getElementById('express-ticket-subtotal');
        const deliveryFeeEl = document.getElementById('express-delivery-fee');
        const deliveryRow = document.getElementById('express-delivery-row');
        const dateEl = document.getElementById('express-ticket-date');
        const logoEl = document.getElementById('express-ticket-logo');
        if (!container) return;
        // Date
        if (dateEl) dateEl.innerText = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Logo
        const co = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        if (logoEl && co) {
            const logoUrl = co.logo_url || co.url_logo;
            if (logoUrl) {
                logoEl.src = app.utils.fixDriveUrl(logoUrl);
                logoEl.classList.remove('hidden');
            } else {
                logoEl.classList.add('hidden');
            }
        }
        // Items
        let subtotal = 0;
        container.innerHTML = app.state.cart.map(item => {
            const sub = item.price * item.qty;
            subtotal += sub;
            return `
                    <div class="ticket-item-express">
                        <span class="ticket-item-name">${item.name} x${item.qty}</span>
                        <span class="ticket-item-price">$${sub.toFixed(2)}</span>
                    </div>
                `;
        }).join('');
        const deliveryFee = parseFloat(co?.costo_envio || 0);
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        if (deliveryFeeEl) deliveryFeeEl.innerText = `$${deliveryFee.toFixed(2)}`;
        if (deliveryRow) deliveryRow.classList.toggle('hidden', !isDelivery);
        const total = subtotal + (isDelivery ? deliveryFee : 0);
        if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
    },
    setDeliveryMethod: (method) => {
        app.state.deliveryMethod = method;
        // Update UI buttons (Public & Staff)
        document.querySelectorAll('.delivery-opt, .delivery-opt-staff').forEach(btn => {
            if (btn.id === 'staff-delivery-pickup') btn.classList.toggle('active', method === 'PICKUP');
            else if (btn.id === 'staff-delivery-dom') btn.classList.toggle('active', method === 'DOMICILIO');
            else btn.classList.toggle('active', btn.dataset.method === method);
        });
        // Toggle address field visibility in checkout (Public)
        const addressField = document.getElementById('address-block');
        if (addressField) addressField.classList.toggle('hidden', method === 'PICKUP');
        // Toggle address field visibility in POS (Staff)
        const posAddress = document.getElementById('pos-cust-address');
        if (posAddress) posAddress.classList.toggle('hidden', method === 'PICKUP');
        app.pos.updateCartVisuals();
        app.pos.renderExpressTicket();
    },
    sendWhatsApp: () => {
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;
        const notes = document.getElementById('cust-notes')?.value || '';
        const method = document.getElementById('pay-method').value;
        const confirmNum = document.getElementById('pay-confirm')?.value || 'N/A';
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        // Safeguard: use UI total or calculate from cart if UI failed
        let cartTotalText = document.getElementById('express-ticket-total')?.innerText || "$0.00";
        let cartTotal = parseFloat(cartTotalText.replace('$', '')) || 0;
        const itemsText = app.state.cart.map(c => `• *${c.name}* x${c.qty} _(${(c.price * c.qty).toFixed(2)})_`).join('\n');
        const co = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const businessPhone = co?.telefonowhatsapp || "5218120731000";
        const brandName = co?.nomempresa || "Nuestra Tienda";
        let waMsg =
            `🛵 *NUEVA ORDEN: ${brandName}*\n` +
            `🆔 *Folio:* ${app.state.lastOrderId || 'REC-PROCESO'}\n`;

        if (app.state._currentOrderOtp) {
            waMsg += `🔑 *Clave de Entrega:* ${app.state._currentOrderOtp}\n`;
        }

        waMsg += `🗓️ *Fecha:* ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
            `----------------------------\n` +
            `👤 *Cliente:* ${name}\n` +
            `📞 *Tel:* ${phone}\n` +
            `🚚 *Entrega:* ${isDelivery ? 'A DOMICILIO' : 'RECOGER EN LOCAL'}\n`;
        if (isDelivery) {
            waMsg += `📍 *Dir:* ${address}\n`;
        }
        if (notes) {
            waMsg += `📝 *Notas:* ${notes}\n`;
        }
        waMsg += `----------------------------\n` +
            `📦 *PRODUCTOS:*\n${itemsText}\n` +
            `----------------------------\n` +
            `💳 *Método de Pago:* ${method}\n`;
        if (method === 'Transferencia') {
            waMsg += `✅ *Confirmación:* ${confirmNum}\n`;
        }
        waMsg +=
            `💰 *TOTAL A PAGAR: $${cartTotal.toFixed(2)}*\n\n` +
            `_Favor de confirmar mi pedido. Gracias._`;
        const encodedMsg = encodeURIComponent(waMsg);
        window.open(`https://wa.me/${businessPhone}?text=${encodedMsg}`, '_blank');
        // Final cleanup after successful handoff to WhatsApp
        app.pos.closeCheckout();
    },
    openStaffCheckout: () => {
        if (app.state.cart.length === 0) return alert("Elegir productos primero.");
        // Fill simulated customer info for quick staff sale
        document.getElementById('cust-name').value = "Venta en Mostrador";
        document.getElementById('cust-phone').value = "N/A";
        document.getElementById('pay-method').value = "Efectivo";
        // For staff, we just open step 2 directly or handled simplified
        app.pos.nextStep(2);
        document.getElementById('checkout-modal').classList.remove('hidden');
        app.pos.handlePayMethodChange();
    },
    updateOrderStatus: async (id, newStatus, skipOtp = false) => {
        const timestamp = app.utils.getTimestamp();
        console.log(`[LOG ${timestamp}] Action: UPDATE_STATUS | ID: ${id} | New: ${newStatus} | SkipOTP: ${skipOtp}`);

        // 1. Logs visibles para el usuario (Diagnóstico Solicitado)
        app.ui.updateConsole(`CHANGE_STATUS: ${id.slice(-4)} -> ${newStatus}`);
        console.log(`[POS] Requesting update for ${id} to ${newStatus}`);

        // --- OTP CHECK ---
        if (newStatus === 'ENTREGADO' && !skipOtp) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const order = app.data.Proyectos.find(p => (p.id_proyecto || "").toString().trim().toUpperCase() === id.toString().trim().toUpperCase());
            const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE" || company?.usa_otp_entrega === "1";

            // Si requiere OTP y lo tiene asignado
            if (useOtp && order?.codigo_otp) {
                console.log(`[LOG ${timestamp}] OTP Required: ${order.codigo_otp}`);
                app.ui.showOtpEntry(id, newStatus, String(order.codigo_otp).trim());
                return; // Stop here, wait for OTP modal
            }
        }

        app.state._isUpdatingStatus = true;

        // --- OPTIMISTIC UI UPDATE (Instant Feedback) ---
        // Actualizamos memoria local INMEDIATAMENTE, sin esperar al servidor.
        const orderIndex = app.data.Proyectos.findIndex(p => (p.id_proyecto || "").toString().trim().toUpperCase() === id.toString().trim().toUpperCase());
        let previousStatus = "";

        if (orderIndex > -1) {
            previousStatus = app.data.Proyectos[orderIndex].status || ""; // Guardar para rollback si falla

            const s = newStatus;
            app.data.Proyectos[orderIndex].status = s;
            app.data.Proyectos[orderIndex].estado = s;
            app.data.Proyectos[orderIndex].estatus = s; // Normalize local state too

            // Persistent Cache Update (v4.6.5)
            const localCache = JSON.parse(localStorage.getItem('suit_status_cache') || '{}');
            localCache[id] = { status: newStatus, ts: Date.now() };
            localStorage.setItem('suit_status_cache', JSON.stringify(localCache));
            app.state._recentStatusCache = localCache;

            console.log(`[LOG ${app.utils.getTimestamp()}] Optimistic Update Applied. Rendering POS...`);

            // Renderizado Inmediato
            if (window.location.hash === '#pos') {
                app.ui.renderPOS();
                app.ui.updateExternalOrderAlert();
            }
        }

        try {
            // Background Sync
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'updateProjectStatus',
                    id: id,
                    id_empresa: app.state.companyId,
                    status: newStatus,
                    token: app.apiToken
                })
            });
            const result = await response.json();

            if (!result.success) throw new Error(result.error || "Server failed to update status");

            console.log(`[LOG ${new Date().toLocaleTimeString()}] Server Sync Success.`);
            app.ui.updateConsole(`[${new Date().toLocaleTimeString()}] SERVER_SYNC_OK`);

            setTimeout(() => { app.state._isUpdatingStatus = false; }, 10000); // v4.6.6: Extended cooldown to 10s for slow Sheets sync

        } catch (e) {
            console.error("[POS_ERROR] Status Update Failed:", e);
            app.state._isUpdatingStatus = false;
            app.ui.updateConsole(`ERROR_SYNC_REVERTING...`, true);
            alert("Error de conexión. Se revertirá el cambio.");

            // ROLLBACK if failed
            if (orderIndex > -1 && previousStatus) {
                app.data.Proyectos[orderIndex].status = previousStatus;
                app.data.Proyectos[orderIndex].estado = previousStatus;
                if (window.location.hash === '#pos') app.ui.renderPOS();
            }
        }
    },
    showLastSale: () => {
        const myProjectIds = app.data.Proyectos
            .filter(p => p.id_empresa === app.state.companyId)
            .map(p => p.id_proyecto);
        const lastOne = (app.data.Proyectos_Pagos || [])
            .filter(pay => myProjectIds.includes(pay.id_proyecto))
            .sort((a, b) => new Date(b.fecha_pago || 0) - new Date(a.fecha_pago || 0))[0];
        if (lastOne) {
            alert(`DETALLE ÚLTIMA VENTA:\n----------------------\nID: ${lastOne.id_pago}\nConcepto: ${lastOne.concepto}\nMonto: $${lastOne.monto}\nMétodo: ${lastOne.metodo_pago}\nFecha: ${new Date(lastOne.fecha_pago).toLocaleString()}`);
        } else {
            alert("No hay ventas registradas aún.");
        }
    },

    // --- POS UI & RENDERING (Migrated from ui.js) ---
    togglePosFolio: () => {
        const method = document.getElementById('pos-pay-method').value;
        const folioBlock = document.getElementById('pos-folio-container');
        const bankBlock = document.getElementById('pos-bank-info-display');
        if (!folioBlock || !bankBlock) return;

        if (method === 'Transferencia') {
            folioBlock.classList.remove('hidden');
            bankBlock.classList.remove('hidden');
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const bName = company?.infobanco || company?.Info_Banco || "Pendiente";
            const bAcc = company?.infocuenta || company?.Info_Cuenta || "";
            document.getElementById('pos-bank-details-text').innerText = `${bName}: ${bAcc}`;
        } else if (method === 'Terminal') {
            folioBlock.classList.remove('hidden');
            bankBlock.classList.add('hidden');
        } else {
            folioBlock.classList.add('hidden');
            bankBlock.classList.add('hidden');
        }
    },

    setPosPaymentMethod: (method) => {
        const select = document.getElementById('pos-pay-method');
        if (select) select.value = method;
        app.pos.togglePosFolio();
        // Sync Visual Buttons in Staff sidebar
        const sidebar = document.getElementById('pos-ticket-sidebar');
        if (sidebar) {
            sidebar.querySelectorAll('.pay-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.value === method);
            });
        }
    },

    setPublicPaymentMethod: (method) => {
        const select = document.getElementById('pay-method');
        if (select) select.value = method;
        if (app.pos.handlePayMethodChange) app.pos.handlePayMethodChange();
        // Sync Visual Buttons
        document.querySelectorAll('.pay-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === method);
        });
    },

    autoLookupCustomer: () => {
        const phone = document.getElementById('cust-phone').value.trim();
        const msg = document.getElementById('search-msg');
        if (msg) msg.style.opacity = phone.length > 5 ? '1' : '0';

        if (phone.length < 10) {
            app.state.currentLeadId = null;
            return;
        }

        // BñÂºsqueda local en Leads (v5.1.0)
        const lead = (app.data.Leads || []).find(l => {
            const lPh = (l.telefono || "").toString().replace(/\D/g, "");
            const sPh = phone.replace(/\D/g, "");
            return lPh.endsWith(sPh) && sPh.length >= 10;
        });

        if (lead) {
            app.state.currentLeadId = lead.id_lead || lead.id || null;
            const nameIn = document.getElementById('cust-name');
            const addrIn = document.getElementById('cust-address');

            if (nameIn && !nameIn.value) {
                nameIn.value = lead.nombre || "";
                nameIn.style.backgroundColor = 'rgba(0, 230, 118, 0.1)';
                setTimeout(() => nameIn.style.backgroundColor = '', 2000);
            }
            if (addrIn && !addrIn.value && lead.direccion) {
                addrIn.value = lead.direccion;
                addrIn.style.backgroundColor = 'rgba(0, 230, 118, 0.1)';
                setTimeout(() => addrIn.style.backgroundColor = '', 2000);
            }
            if (msg) {
                msg.innerHTML = `✅ ¡Cliente reconocido! (${lead.nombre})`;
                msg.style.color = '#00e676';
            }
        } else {
            app.state.currentLeadId = null;
        }
    },

    filterPOS: (status) => {
        const buttons = document.querySelectorAll('.pos-filter-btn');
        buttons.forEach(btn => {
            if (btn.dataset.status === status) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        app.pos.renderPOS();
    },

    renderPOS: () => {
        const container = document.getElementById('pos-orders-grid');
        if (!container) return;
        container.innerHTML = '';

        const activeFilterBtn = document.querySelector('.pos-filter-btn.active');
        const currentFilter = activeFilterBtn ? activeFilterBtn.dataset.status : 'TODOS';

        const user = app.state.currentUser;
        const userRole = (user?.id_rol || "").toString().toUpperCase();
        const isAdmin = userRole === 'DIOS' || parseInt(user?.nivel_acceso) >= 10;
        const isDelivery = userRole === 'DELIVERY' || userRole === 'REPARTIDOR';

        // Filter: Multi-tenant + Date (Standard YY-MM-DD)
        const todayStr = new Date().toLocaleDateString('en-CA');

        // --- CONTADORES DE FILTROS (v4.7.8) ---
        const allForCounters = (app.data.Proyectos || []).filter(p => {
            const isMyCompany = app.utils.getCoId(p) === app.state.companyId.toString().trim().toUpperCase();
            const pDate = new Date(p.fecha_inicio);
            const isToday = !isNaN(pDate.getTime()) && pDate.toLocaleDateString('en-CA') === todayStr;
            const status = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');
            // STRICT: Only today's items (v4.7.9)
            return isMyCompany && isToday;
        });

        const counts = { 'RECIBIDO': 0, 'COCINA': 0, 'LISTO': 0, 'ENTREGADO': 0 };
        allForCounters.forEach(p => {
            const s = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');
            if (s.includes('RECIBIDO') || s.includes('NUEVO')) counts['RECIBIDO']++;
            else if (s.includes('COCINA') || s.includes('PREPARA')) counts['COCINA']++;
            else if (s.includes('LISTO') || s.includes('CAMINO') || s.includes('RUTA')) counts['LISTO']++;
            else if (s.includes('ENTREGADO') || s.includes('FINAL')) counts['ENTREGADO']++;
        });

        const bRecibido = document.getElementById('filter-btn-recibido'); if (bRecibido) bRecibido.innerText = `Nuevos (${counts['RECIBIDO']})`;
        const bCocina = document.getElementById('filter-btn-cocina'); if (bCocina) bCocina.innerText = `En Cocina (${counts['COCINA']})`;
        const bListo = document.getElementById('filter-btn-listo'); if (bListo) bListo.innerText = `Próximos (${counts['LISTO']})`;
        const bDone = document.getElementById('filter-btn-entregado'); if (bDone) bDone.innerText = `Entregados (${counts['ENTREGADO']})`;

        let list = (app.data.Proyectos || []).filter(p => {
            const isMyCompany = app.utils.getCoId(p) === app.state.companyId.toString().trim().toUpperCase();
            const pDate = new Date(p.fecha_inicio);
            const isToday = !isNaN(pDate.getTime()) && pDate.toLocaleDateString('en-CA') === todayStr;

            // STRICT: Only today's items (v4.7.9)
            return isMyCompany && isToday;
        });

        // Apply visual filter
        if (currentFilter !== 'TODOS') {
            list = list.filter(p => {
                const s = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');
                const isDelivered = s.includes('ENTREGADO') || s.includes('FINAL');

                if (currentFilter === 'ENTREGADO') return isDelivered;
                if (isDelivered) return false; // Exclude from all other tabs

                if (currentFilter === 'NUEVOS' || currentFilter === 'PEDIDO-RECIBIDO') return s.includes('RECIBIDO') || s.includes('NUEVO');
                if (currentFilter === 'COCINA' || currentFilter === 'EN-COCINA') return s.includes('COCINA') || s.includes('PREPARA');
                if (currentFilter === 'LISTOS' || currentFilter === 'LISTO-ENTREGA') return s.includes('LISTO') || s.includes('CAMINO') || s.includes('RUTA');
                if (currentFilter === 'CAMINO' || currentFilter === 'EN-CAMINO') return s.includes('CAMINO') || s.includes('RUTA');
                return true;
            });
        }

        // Sort: Newest first
        list.sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));

        list.forEach(p => {
            const status = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');
            const card = document.createElement('div');
            card.className = `order-card ${status.toLowerCase()}`;
            const items = JSON.parse(p.line_items || '[]');

            // External Source Detection
            const pay = (app.data.Proyectos_Pagos || []).find(pay => pay.id_proyecto === p.id_proyecto);
            const isWeb = pay?.referencia === 'CLIENTE-URL' || (p.nombre_proyecto || "").includes('WEB-OTS');

            // --- RBAC: STAFF vs DELIVERY (OTP Privacy) ---
            const code = String(p.codigo_otp || "").trim();
            const showOtp = code && (isAdmin || !isDelivery);
            const otpDisplay = code ? (showOtp ? `🔑 <b>${code}</b>` : `🔑 <span class="otp-blur">****</span>`) : '';

            card.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${p.id_proyecto.slice(-4)}</span>
                    ${isWeb ? '<span class="badge web">WEB</span>' : '<span class="badge pos">LOCAL</span>'}
                    <span class="order-time">${new Date(p.fecha_inicio).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })} ${new Date(p.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="order-customer">
                    <i class="fas fa-user"></i> ${p.nombre_cliente || p.nombre_proyecto.split('-')[1] || 'Cliente'}
                </div>
                <!-- OTS Info Layout (v4.7.5 Robust Rendering) -->
                <div class="order-ots-info" style="font-size:0.8rem; margin:5px 0; border-top:1px dashed #eee; padding-top:5px;">
                    <div class="ots-item">
                        <a href="https://maps.google.com/?q=${encodeURIComponent(p.direccion || p.descripcion || '')}" target="_blank" style="text-decoration:none; color:inherit;">
                            <i class="fas fa-map-marker-alt"></i> ${p.direccion || (p.descripcion?.includes('DIR:') ? p.descripcion.split('|')[0].replace('DIR:', '').trim() : 'Entrega en Local')}
                        </a>
                    </div>
                    <div class="ots-item">
                        <a href="tel:${p.telefono || ''}" style="text-decoration:none; color:inherit;">
                            <i class="fas fa-phone"></i> ${p.telefono || (p.descripcion?.includes('TEL:') ? p.descripcion.split('|')[1].replace('TEL:', '').trim() : 'N/A')}
                        </a>
                    </div>
                </div>
                <div class="order-items">
                    ${items.map(i => `<div>${i.qty}x ${i.name}</div>`).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">$${items.reduce((sum, i) => sum + (i.price * i.qty), 0).toFixed(2)}</div>
                    ${status.includes('ENTREGADO') ? '<div class="order-status-delivered" style="color: #27ae60; font-size: 1.4rem; font-weight: 900; text-align: right; letter-spacing: -1px; animation: fadeIn 0.5s ease;">ENTREGADO ✅</div>' : `<div class="order-otp">${otpDisplay}</div>`}
                </div>
                <div class="order-actions">
                    ${app.pos.getPosActionButtons(p.id_proyecto, status, code)}
                </div>
            `;
            container.appendChild(card);
        });
    },

    getPosActionButtons: (id, status, otp) => {
        const user = app.state.currentUser;
        const role = (user?.id_rol || "").toString().toUpperCase();
        const level = parseInt(user?.nivel_acceso || 0);
        const isDelivery = role === 'DELIVERY' || role === 'REPARTIDOR';
        const isAdmin = role === 'DIOS' || level >= 10;

        let btns = '';
        const statusUpper = status.toUpperCase();

        // RBAC: Si es Staff (Nivel >= 2), permitir flujo completo (v4.7.6)
        const isStaff = !isDelivery && level >= 2;
        const canCook = isStaff || isAdmin;
        const canDispatch = isStaff || isAdmin || isDelivery; // v4.7.8: Delivery puede despachar y entregar

        if (statusUpper.includes('RECIBIDO') || statusUpper.includes('NUEVO')) {
            if (canCook) btns += `<button class="btn-pos btn-prep" onclick="app.pos.updateOrderStatus('${id}', 'EN-COCINA')">COCINAR</button>`;
        } else if (statusUpper.includes('COCINA') || statusUpper.includes('PREPARA')) {
            if (isStaff || isAdmin) btns += `<button class="btn-pos btn-new" onclick="app.pos.updateOrderStatus('${id}', 'PEDIDO-RECIBIDO')">REVERTIR</button>`;
            if (canCook) btns += `<button class="btn-pos btn-ready" onclick="app.pos.updateOrderStatus('${id}', 'LISTO-ENTREGA')">LISTO</button>`;
        } else if (statusUpper.includes('LISTO')) {
            if (isStaff || isAdmin) btns += `<button class="btn-pos btn-prep" onclick="app.pos.updateOrderStatus('${id}', 'EN-COCINA')">COCINA</button>`;
            if (canDispatch) btns += `<button class="btn-pos btn-route" onclick="app.pos.updateOrderStatus('${id}', 'EN-CAMINO')">RUTA</button>`;
        } else if (statusUpper.includes('CAMINO') || statusUpper.includes('RUTA')) {
            if (isStaff || isAdmin) btns += `<button class="btn-pos btn-ready" onclick="app.pos.updateOrderStatus('${id}', 'LISTO-ENTREGA')">REGRESAR</button>`;
            if (canDispatch) btns += `<button class="btn-pos btn-done" onclick="app.pos.updateOrderStatus('${id}', 'ENTREGADO')">ENTREGAR</button>`;
        }
        return btns;
    },

    updateExternalOrderAlert: () => {
        const container = document.getElementById('pos-alerts-container');
        const countBlueEl = document.getElementById('pos-external-count');
        const countOrangeEl = document.getElementById('pos-delivery-count');
        const countGreenEl = document.getElementById('pos-done-count');
        if (!container || !countBlueEl || !countOrangeEl || !countGreenEl) return;

        if (app.state.isFood) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const projects = app.data.Proyectos || [];
            let countNewWeb = 0, countPendingDelivery = 0, countDone = 0;

            projects.forEach(p => {
                const isMyCompany = app.utils.getCoId(p) === app.state.companyId.toString().trim().toUpperCase();
                const pDate = new Date(p.fecha_inicio);
                const isToday = !isNaN(pDate.getTime()) && pDate.toLocaleDateString('en-CA') === todayStr;
                if (!isMyCompany || !isToday) return;

                const status = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');
                const isExternal = (app.data.Proyectos_Pagos || []).some(pay => pay.id_proyecto === p.id_proyecto && pay.referencia === 'CLIENTE-URL');

                if (isExternal && (status.includes('RECIBIDO') || status.includes('NUEVO'))) countNewWeb++;
                if (status.includes('LISTO') || status.includes('CAMINO')) countPendingDelivery++;
                if (status.includes('ENTREGADO') || status.includes('FINALIZADO')) countDone++;
            });

            if (countNewWeb > (app.state.lastExternalCount || 0)) app.utils.playNotification();
            app.state.lastExternalCount = countNewWeb;
            countBlueEl.innerText = countNewWeb;
            countOrangeEl.innerText = countPendingDelivery;
            countGreenEl.innerText = countDone;
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    },

    renderStaffPOS: () => {
        const container = document.getElementById('staff-pos-grid');
        const sideNav = document.getElementById('staff-pos-side-nav');
        if (!container) return;
        container.innerHTML = '';
        if (sideNav) sideNav.innerHTML = '';

        const items = (app.data.Catalogo || []).filter(p => {
            const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
            const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
            const isActive = (p.activo == true || p.activo == 1 || p.activo === "TRUE" || p.activo === "1");
            return pCo === sCo && isActive;
        });

        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px; color:#999; grid-column:1/-1;">No hay productos para vender.</div>';
            return;
        }

        const categories = {};
        items.forEach(p => {
            const cat = (p.categoria || "General").trim();
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(p);
        });

        Object.keys(categories).forEach((catName, index) => {
            const catId = `staff-cat-${index}`;
            if (sideNav) {
                const navItem = document.createElement('div');
                navItem.className = 'pos-cat-item' + (index === 0 ? ' active' : '');
                navItem.innerText = catName;
                navItem.onclick = () => {
                    document.querySelectorAll('.pos-cat-item').forEach(el => el.classList.remove('active'));
                    navItem.classList.add('active');
                    document.getElementById(catId).scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Auto-close on mobile
                    if (window.innerWidth <= 900) app.pos.toggleStaffNav(false);
                };
                sideNav.appendChild(navItem);
            }

            const section = document.createElement('div');
            section.id = catId;
            section.className = 'staff-pos-section';
            section.innerHTML = `<h3 class="food-category-title">${catName}</h3><div class="food-grid"></div>`;
            const grid = section.querySelector('.food-grid');

            categories[catName].forEach(p => {
                const card = document.createElement('div');
                card.className = 'food-card';
                const stock = parseInt(p.stock) || 0;
                const img = p.imagen_url ? app.utils.fixDriveUrl(p.imagen_url) : 'https://lh3.googleusercontent.com/d/1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
                const price = app.utils.getEffectivePrice(p);

                const promo = (p.etiqueta_promo || "").toString().trim();

                card.innerHTML = `
                    <div class="food-img-container">
                        ${promo ? `<div class="promo-ribbon">${promo}</div>` : ''}
                        <img src="${img}" class="food-img">
                    </div>
                    <div class="food-info">
                        <div class="food-title-row">
                            <h3>${p.nombre}</h3>
                            <div class="stock-badge ${stock <= 5 ? 'stock-low' : 'stock-ok'}">${stock} DISP.</div>
                            <span class="price">$${price}</span>
                        </div>
                        <div class="food-actions">
                            <button onclick="app.pos.removeFromCart('${p.id_producto}')"><i class="fas fa-minus"></i></button>
                            <span id="qty-${p.id_producto}" class="food-qty">${app.state.cart.find(i => i.id === p.id_producto)?.qty || 0}</span>
                            <button onclick="app.pos.addToCart('${p.id_producto}')"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>`;
                grid.appendChild(card);
            });
            container.appendChild(section);
        });
        app.pos.updateCartVisuals();
    },

    toggleStaffNav: (show) => {
        const nav = document.getElementById('staff-pos-side-nav-container');
        const overlay = document.querySelector('.pos-nav-overlay');
        if (nav) nav.classList.toggle('mobile-active', show);
        if (overlay) overlay.classList.toggle('active', show);
    },

    // --- CATALOG MANAGEMENT REMOVED (Now in admin.js) ---








    fileToBase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    }),

    // --- OTP LOGIC (v4.7.0) ---
    showOtpEntry: (id, targetStatus, correctOtp) => {
        app.state._otpContext = { id, targetStatus, correctOtp };
        const modal = document.getElementById('otp-modal');
        const input = document.getElementById('otp-entry-input');
        if (modal && input) {
            input.value = '';
            modal.classList.remove('hidden');
            setTimeout(() => input.focus(), 200);
            input.onkeydown = (e) => { if (e.key === 'Enter') app.pos.verifyOtp(); };
        }
    },
    verifyOtp: async () => {
        const ctx = app.state._otpContext;
        const input = document.getElementById('otp-entry-input');
        if (!ctx || !input) return;
        const inputValue = input.value.trim();
        const correctOtp = String(ctx.correctOtp).trim();
        const folioDigits = ctx.id.split('-').pop(); // Permite validar con folio (ej: 251) o OTP

        if (inputValue === correctOtp || inputValue === folioDigits) {
            document.getElementById('otp-modal').classList.add('hidden');
            await app.pos.updateOrderStatus(ctx.id, ctx.targetStatus, true);
        } else {
            alert("❌ Código incorrecto.");
            input.value = '';
        }
    },
    closeOtpModal: () => {
        document.getElementById('otp-modal').classList.add('hidden');
        app.state._otpContext = null;
    },

    // --- PRINTER BRIDGE ---
    printTicket: (orderData = null, cartItems = null) => {
        const iframe = document.getElementById('print-iframe');
        if (!iframe) return;
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const items = cartItems || app.state.cart;
        const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) * i.qty), 0);
        const fee = orderData?.costo_envio || (app.state.deliveryMethod === 'DOMICILIO' ? (parseFloat(company?.costo_envio) || 0) : 0);
        const total = subtotal + fee;
        const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; padding: 10px; width: 75mm; }
                        h2 { text-align: center; margin: 5px 0; font-size: 18px; }
                        p { margin: 2px 0; }
                        .center { text-align: center; }
                        .divider { border-top: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 3px 0; }
                        .total-row { font-weight: bold; font-size: 16px; margin-top: 5px; }
                        .footer { font-size: 11px; text-align: center; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2>${company?.nomempresa || 'POS TICKET'}</h2>
                        <p>${company?.direccion || ''}</p>
                        <p>${company?.telefono || ''}</p>
                    </div>
                    <div class="divider"></div>
                    <p><b>FECHA:</b> ${new Date().toLocaleString()}</p>
                    <p><b>CLIENTE:</b> ${orderData?.name || 'Mostrador'}</p>
                    <div class="divider"></div>
                    ${items.map(i => `
                        <div class="row">
                            <span>${i.qty}x ${i.name.slice(0, 20)}</span>
                            <span>$${(parseFloat(i.price) * i.qty).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="divider"></div>
                    <div class="row"><span>SUBTOTAL</span><span>$${subtotal.toFixed(2)}</span></div>
                    ${fee > 0 ? `<div class="row"><span>ENVÍO</span><span>$${fee.toFixed(2)}</span></div>` : ''}
                    <div class="row total-row"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
                    <div class="divider"></div>
                    <div class="footer">
                        <p>¡GRACIAS POR SU PREFERENCIA!</p>
                        <p>SuitOrg Cloud v${app.version}</p>
                    </div>
                </body>
                </html>
            `;
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 600);
    },

    // --- CASH CONTROL LOGIC (v5.7.1) ---
    updateStaffChange: () => {
        const input = document.getElementById('pos-cash-input');
        const display = document.getElementById('pos-cash-change');
        const totalEl = document.getElementById('ticket-total');
        if (!input || !display || !totalEl) return;

        const total = parseFloat(totalEl.innerText.replace('$', '')) || 0;
        const paid = parseFloat(input.value) || 0;
        const change = Math.max(0, paid - total);

        display.innerText = `$${change.toFixed(2)}`;
        display.style.color = paid >= total ? '#27ae60' : '#e74c3c';
    },

    // --- AISLAMIENTO DE SESIÓN (v16.3.0) ---
    saveCart: () => {
        if (!app.state.companyId) return;
        const key = `suit_cart_${app.state.companyId.toString().toUpperCase()}`;
        const data = {
            cart: app.state.cart,
            delivery: app.state.deliveryMethod,
            ts: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[POS] Carrito blindado y guardado para: ${app.state.companyId}`);
    },

    loadCart: () => {
        if (!app.state.companyId) return;
        const key = `suit_cart_${app.state.companyId.toString().toUpperCase()}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                app.state.cart = data.cart || [];
                app.state.deliveryMethod = data.delivery || 'DOMICILIO';
                console.log(`[POS] Sesión recuperada para: ${app.state.companyId}`);
            } catch (e) {
                console.warn("[POS] Error al cargar carrito aislado:", e);
                app.state.cart = [];
            }
        } else {
            app.state.cart = [];
            console.log(`[POS] Nueva sesión iniciada para: ${app.state.companyId}`);
        }
        if (app.pos.updateCartVisuals) app.pos.updateCartVisuals();
    }
};
