class CampañaManager {
    constructor() {
        this.form = document.getElementById('campañaForm');
        this.loader = document.getElementById('loader');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.campañasList = document.getElementById('campañasList');
        this.ultimaData = [];

        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.loadCampañas();
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const campaña = {
            id: `camp_${Date.now()}`,
            empresa: formData.get('empresa'),
            nombre: formData.get('nombre'),
            tema: formData.get('tema'),
            formato: formData.get('formato'),
            fecha_creacion: new Date().toISOString().split('T')[0],
            estado: 'generando',
            configuracion: {
                numero_laminas: parseInt(formData.get('numero_laminas')),
                publico: formData.get('publico')
            }
        };

        this.showLoader(true);
        this.showNotification('Diseñando Campaña con IA...');

        try {
            await this.saveCampaña(campaña);
            this.loadCampañas();

            const contenido = await this.generarContenidoReal(campaña);
            campaña.estado = 'completo';
            campaña.guion = contenido;

            await this.updateCampaña(campaña);
            this.loadCampañas();
            this.showNotification('¡Diseño Visual Completo!');
            this.form.reset();
        } catch (error) {
            console.error(error);
            this.showNotification('Error en la fábrica de IA', 'error');
        } finally {
            this.showLoader(false);
        }
    }

    async generarContenidoReal(campaña) {
        this.showNotification('Leyendo estrategia desde Google Sheets...');
        
        try {
            // 1. Consulta vía Proxy Local Filtrado (v19.0.0)
            const res = await fetch(`/api/sheets/prompts?industria=${campaña.industria}`);
            const promptData = await res.json();
            
            // Tomamos el primer resultado encontrado por el servidor
            let machote = promptData[0]?.contenido || "Actúa como Director Creativo. Genera un guion para ${empresa} sobre ${tema}. Responde en JSON con array 'escenas'.";
            
            if (!promptData[0]) console.warn("⚠️ [SHEETS_DEBUG] Industria no encontrada en el servidor.");

            // 2. Inyección de variables dinámicas
            const promptFinal = machote
                .replace(/\${empresa}/g, campaña.empresa)
                .replace(/\${tema}/g, campaña.tema)
                .replace(/\${publico}/g, campaña.configuracion.publico)
                .replace(/\${nombre_campana}/g, campaña.nombre)
                .replace(/\${numero_laminas}/g, campaña.configuracion.numero_laminas);

            console.log("⚡ [PROMPT_FINAL]:", promptFinal);

            // 3. Petición a Gemini vía nuestro Proxy Local
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: "user", content: promptFinal }]
                })
            });

            console.log("🔍 STATUS:", response.status, response.statusText);
            const rawText = await response.text();
            console.log("🔍 RAW RESPONSE:", rawText);
            const aiData = JSON.parse(rawText);
            const raw = aiData.choices?.[0]?.message?.content || "";
            
            console.log("🔍 RAW GEMINI:", raw);
            console.log("🔍 AI DATA:", JSON.stringify(aiData));
            
            const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(clean);

        } catch (error) {
            console.error("❌ Error en flujo directo Sheets:", error);
            throw error;
        }
    }

    async saveCampaña(campaña) {
        const res = await fetch('database/campañas.json');
        const data = await res.json();
        data.campañas.push(campaña);
        await this.persistirEnDisco(data);
    }

    async updateCampaña(campaña) {
        const res = await fetch('database/campañas.json');
        const data = await res.json();
        const idx = data.campañas.findIndex(c => c.id === campaña.id);
        if (idx !== -1) {
            data.campañas[idx] = campaña;
            await this.persistirEnDisco(data);
        }
    }

    async persistirEnDisco(data) {
        await fetch('/api/local/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'Campañas/database/campañas.json', data: data })
        });
    }

    async borrarCampaña(id) {
        if(!confirm('¿Eliminar campaña?')) return;
        const res = await fetch('database/campañas.json');
        const data = await res.json();
        data.campañas = data.campañas.filter(c => c.id !== id);
        await this.persistirEnDisco(data);
        this.loadCampañas();
    }

    async loadCampañas() {
        const res = await fetch('database/campañas.json', { cache: 'no-store' });
        const data = await res.json();
        this.ultimaData = data.campañas || [];
        this.renderCampañas(this.ultimaData);
    }

    renderCampañas(campañas) {
        const estados = {
            generando: { class: 'status-generando', text: 'Diseñando...' },
            completo: { class: 'status-completo', text: 'Listo' }
        };

        this.campañasList.innerHTML = [...campañas].reverse().map(c => {
            const est = estados[c.estado] || { class: 'status-borrador', text: 'Borrador' };
            const btnVer = c.estado === 'completo' ? `<button class="btn-small" onclick="manager.verDetalle('${c.id}')"><i class="fas fa-mobile-alt"></i> Previsualizar</button>` : '';
            return `
                <div class="status-item">
                    <div><strong>${c.empresa}</strong><br><small>${c.nombre} (${c.formato})</small></div>
                    <div style="text-align:right">
                        <span class="status-badge ${est.class}">${est.text}</span>
                        <div style="margin-top:5px; display:flex; gap:5px; justify-content:flex-end;">
                            ${btnVer}
                            <button class="btn-delete" onclick="manager.borrarCampaña('${c.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    verDetalle(id) {
        const c = this.ultimaData.find(x => x.id === id);
        if (!c || !c.guion.escenas) return;

        const modalContenido = document.getElementById('modalContenido');
        const htmlEscenas = c.guion.escenas.map(e => `
            <div class="mockup-scene">
               <div class="phone-frame">
                  <div class="phone-screen" style="background-image: url('https://loremflickr.com/400/700/${c.formato},${e.keywords?e.keywords.replace(/ /g,','):'content'}?random=${e.id}')">
                     <div class="screen-overlay">${e.texto_pantalla}</div>
                  </div>
               </div>
               <div class="scene-notes">
                  <h3>LÁMINA ${e.id}</h3>
                  <p><strong><i class="fas fa-eye"></i> Visual:</strong> ${e.visual_desc}</p>
                  <p><strong><i class="fas fa-comment"></i> Caption:</strong> ${e.locucion}</p>
               </div>
            </div>
        `).join('');

        modalContenido.innerHTML = `<div class="storyboard-v2">${htmlEscenas}</div>`;
        document.getElementById('detalleModal').style.display = 'flex';
    }

    cerrarModal() { document.getElementById('detalleModal').style.display = 'none'; }
    showLoader(s) { this.loader.style.display = s ? 'inline-block' : 'none'; }
    showNotification(m, t='success') {
        this.notificationText.textContent = m;
        this.notification.className = `notification ${t} show`;
        setTimeout(() => this.notification.classList.remove('show'), 3000);
    }
}

let manager;
document.addEventListener('DOMContentLoaded', () => { manager = new CampañaManager(); });