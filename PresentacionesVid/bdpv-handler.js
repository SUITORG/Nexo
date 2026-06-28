/* ===========================================
   BDPV UI Handler — Frontend lógica
   Cargado desde CampanasAi/index.html
   =========================================== */

window.loadBdpvSubNicho = function () {
    const sel = document.getElementById('bdpvSubNicho');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Desde industria seleccionada --</option>';

    // Try loading from industrias.json
    fetch('config/industrias.json')
        .then(r => r.json())
        .then(data => {
            if (!data.clasificacion) return;
            // Add all subclasificaciones as options
            data.clasificacion.forEach(cat => {
                if (!cat.subclasificaciones) return;
                cat.subclasificaciones.forEach(sub => {
                    const opt = document.createElement('option');
                    opt.value = sub.valor;
                    opt.textContent = sub.etiqueta;
                    opt.setAttribute('data-categoria', cat.categoria);
                    sel.appendChild(opt);
                });
            });
        })
        .catch(() => {
            // Fallback to hardcoded options
            const fallbacks = [
                'Instalación Residencial', 'Instalación Comercial/Industrial',
                'Mantenimiento y Reparación', 'Venta de Equipos',
                'Off-Grid y Autoconsumo', 'Financiamiento y Subsidios',
                'Innovación Tecnológica', 'Consultoría Energética',
                'Distribución Mayorista', 'Ingeniería de Proyectos'
            ];
            fallbacks.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        });

    // Auto-select sub-nicho when industry changes
    const industrySel = document.getElementById('aiIndustry');
    if (industrySel) {
        industrySel.addEventListener('change', function () {
            const selected = this.options[this.selectedIndex];
            const text = selected ? selected.textContent : '';
            // Find matching sub-nicho
            Array.from(sel.options).forEach(opt => {
                const cat = opt.getAttribute('data-categoria') || '';
                if (cat && text.includes(cat)) {
                    sel.value = opt.value;
                }
            });
        });
    }
};

/* ===========================================
   Unsplash photo pool for auto-fill
   =========================================== */
const UNSPLASH_ENERGY_POOL = [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=70',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=70',
    'https://images.unsplash.com/photo-1519552928909-672ca2c4d6a6?w=600&q=70',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=70',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=70',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=70',
    'https://images.unsplash.com/photo-1497440001374-f69e08f3a6f8?w=600&q=70',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=70',
    'https://images.unsplash.com/photo-1579389083078-4e7018379f82?w=600&q=70',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=70'
];

window.getBdpvAutoPhotos = function (count) {
    const shuffled = [...UNSPLASH_ENERGY_POOL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.max(count, 4));
};

/* ===========================================
   Attach BDPV generate event on DOM ready
   =========================================== */
document.addEventListener('DOMContentLoaded', function () {
    // Photo preview for BDPV mode uses existing bdPhotosInput
    const bdpvAutoToggle = document.getElementById('bdpvAutoPhotos');
    if (bdpvAutoToggle) {
        bdpvAutoToggle.addEventListener('change', function () {
            const label = document.getElementById('bdPhotosLabel');
            if (label) {
                label.textContent = this.checked
                    ? 'Fotos del Carrusel (Locales + Auto-completado)'
                    : 'Fotos del Carrusel (Solo manual)';
            }
        });
    }

    // Sync sub-nicho text input with select
    const subNichoSel = document.getElementById('bdpvSubNicho');
    const subNichoText = document.getElementById('bdpvSubNichoText');
    if (subNichoSel && subNichoText) {
        subNichoSel.addEventListener('change', function () {
            if (this.value) subNichoText.value = this.options[this.selectedIndex].textContent;
        });
        subNichoText.addEventListener('input', function () {
            if (this.value) subNichoSel.value = '';
        });
    }
});
