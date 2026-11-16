const ESTADOS = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

const DEST_LABEL = { capital: 'capital de trabajo', equipo: 'equipo/maquinaria', expansion: 'expansión/local', innovacion: 'innovación/tecnología', marketing: 'marketing/publicidad', inventario: 'inventario', otro: 'otro' };

const CATALOGO = [
  {
    id: 'impulso-nl', nombre: 'Impulso Nuevo León (FOCRECE)', tipo: 'gob-estatal', cobertura: 'Nuevo León',
    monto: [6000, 30000000], destinos: ['capital', 'equipo', 'expansion', 'inventario'],
    formalidad: ['cualquiera'], min_anios: 0.5,
    donde: 'Fideicomiso FOCRECE · Info@impulsonuevoleon.gob.mx · (81) 2512-0094 · Módulo Cintermex (Obrera) y Centro de Atención PyME (Edificio Páez, 5 de Mayo 521 Ote., Monterrey) · impulsonuevoleon.gob.mx',
    desc: 'Créditos MIPYME con garantía del Estado vía bancos aliados: microcréditos (grupal e individual), capital de trabajo, equipamiento productivo, factoraje internacional y segmento FIFA 2026 (turismo, restaurantes, transporte, logística).',
    pros: ['Garantía estatal → menos exigencia de aval que la banca directa', 'Atiende desde microempresa y personas físicas con actividad empresarial', 'Tasas preferenciales vía bancos participantes', 'Microcrédito desde $6,000 con solo 6-12 meses de operación'],
    contras: ['Requiere registro en Nuevo León y expediente completo', 'Plazos y montos varían según el banco intermediario', 'Cola de atención en convocatorias fuertes']
  },
  {
    id: 'nafin-estados', nombre: 'Impulso NAFIN + Estados (vía FOCRECE)', tipo: 'gob-federal', cobertura: 'Nuevo León',
    monto: [100000, 5000000], destinos: ['capital', 'equipo', 'expansion'],
    formalidad: ['constituida', 'resico'], min_anios: 2,
    donde: 'Nacional Financiera · 800 2000 215 · info@nafin.gob.mx · solicita Cédula de Validación en la ventanilla estatal (Impulso NL) y aplica con el banco de tu preferencia · nafin.com',
    desc: 'Crédito federal con garantía compartida: hasta $5 MDP, 60 meses, tasa hasta 14.75% anual fija, sin comisión por apertura ni penalización por prepago, hasta 6 meses de gracia.',
    pros: ['Condiciones claras y competitivas (tasa fija, sin comisión de apertura)', 'Hasta 2.5 MDP solo con aval y obligado solidario', 'Puedes elegir tu banco intermediario'],
    contras: ['Pide empresa formalmente constituida y preferentemente 2 años de operación', 'Cédula de Validación = trámite estatal previo', 'Revisa buen historial en Buró de Crédito antes de solicitar']
  },
  {
    id: 'nafin-mujeres', nombre: 'Crédito Mujeres Empresarias (NAFIN / Impulso NL)', tipo: 'gob-federal', cobertura: 'nacional',
    monto: [50000, 2000000], destinos: ['capital', 'equipo', 'inventario'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'Nacional Financiera · 800 2000 215 · también visible en impulsonuevoleon.gob.mx (Crédito para Mujeres Empresarias)',
    desc: 'Línea de financiamiento para negocios liderados por mujeres empresarias, con acompañamiento y condiciones preferenciales.',
    pros: ['Diseñado para mujeres empresarias (menor competencia por cupo)', 'Suele incluir acompañamiento/asesoría', 'Aplica para capital de trabajo e inversión'],
    contras: ['Convocatorias y cupos por entidad; verificar vigencia', 'Requiere documentación fiscal al corriente']
  },
  {
    id: 'impulso-nl-estrategicos', nombre: 'Impulso NL + NAFIN/Bancomext/FIFOMI (sectores estratégicos y exportación)', tipo: 'gob-estatal', cobertura: 'Nuevo León',
    monto: [500000, 30000000], destinos: ['capital', 'equipo', 'expansion'],
    formalidad: ['constituida', 'resico'], min_anios: 2,
    donde: 'Impulso Nuevo León · Info@impulsonuevoleon.gob.mx · (81) 2512-0094 · Torre Administrativa del Gob. de NL (Washington 2000 Ote., Col. Obrera, Monterrey)',
    desc: 'Financiamiento para cadenas de suministro automotriz, electro-movilidad y electrónico; créditos a la exportación ("Hecho en NL"), proveedores locales, PyMe Verde sustentable, turismo (FIFA 2026) y minería. Hasta $30 MDP; 3 años capital de trabajo / 15 años activos fijos.',
    pros: ['Montos altos con plazos largos para activos fijos', 'Si eres proveedor de industria automotriz/electrónica es tu línea natural', 'Incluye factoraje y asistencia técnica (FIFOMI)'],
    contras: ['Perfil exigente: cadena de suministro formal con trazabilidad', 'Expediente financiero de 2 años', 'Proceso con la estatal + banca: varias semanas']
  },
  {
    id: 'turismo-fifa', nombre: 'Financiamiento turístico "Camino a FIFA 2026" (Impulso NL)', tipo: 'gob-estatal', cobertura: 'Nuevo León',
    monto: [100000, 5000000], destinos: ['capital', 'equipo', 'expansion', 'marketing'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'Impulso Nuevo León · impulsonuevoleon.gob.mx · Info@impulsonuevoleon.gob.mx · (81) 2512-0094',
    desc: 'Segmento especial para hoteles, restaurantes, gastronomía, movilidad/transporte y logística vinculada al impacto económico del Mundial 2026 en NL.',
    pros: ['Momento estratégico: el Estado prioriza esta cadena de valor', 'Útil para adecuación de espacios y capital de trabajo', 'Abarca restaurantes y transporte, no solo hotelería'],
    contras: ['Ventana ligada al evento; convocatoria con fechas', 'Competencia creciente en el sector turístico estatal']
  },
  {
    id: 'micro-palabra', nombre: 'Microcrédito a la Palabra Grupal (FOCRECE)', tipo: 'gob-estatal', cobertura: 'Nuevo León',
    monto: [6000, 100000], destinos: ['capital', 'inventario'],
    formalidad: ['informal', 'resico', 'constituida'], min_anios: 0.5,
    donde: 'FOCRECE / Impulso Nuevo León · (81) 2512-0094 · Info@impulsonuevoleon.gob.mx',
    desc: 'Crédito grupal solidario para grupos de mujeres (12-40 personas, 21-75 años): capital de trabajo, primer ciclo $6,000-8,000 hasta $100,000, pagos semanales a 16 semanas. Incluye Seguro Saldo Deudor gratis.',
    pros: ['Sin garantía real: avala el grupo solidario', 'Ideal si estás informal o sin historial crediticio', 'Pago oportuno abre ciclos mayores'],
    contras: ['Solo mujeres en grupo solidario', 'Montos chicos; no sirve para inversión grande', 'Pagos semanales exigen flujo constante']
  },
  {
    id: 'micro-individual', nombre: 'Microcrédito Individual (FOCRECE)', tipo: 'gob-estatal', cobertura: 'Nuevo León',
    monto: [10000, 70000], destinos: ['capital', 'equipo', 'inventario'],
    formalidad: ['informal', 'resico', 'constituida'], min_anios: 1,
    donde: 'FOCRECE / Impulso Nuevo León · (81) 2512-0094 · Info@impulsonuevoleon.gob.mx',
    desc: 'Microcrédito individual para hombres y mujeres de 21 a 74 años: capital de trabajo y activos fijos, primer ciclo $10,000-30,000 hasta $70,000 máximo.',
    pros: ['Accesible sin empresa constituida', 'Buena puerta de entrada para crear historial crediticio', 'Trámite local y acompañado'],
    contras: ['Monto máximo bajo ($70,000)', 'Pide 12 meses de antigüedad del negocio']
  },
  {
    id: 'factoraje-nafin', nombre: 'Factoraje y cuentas por cobrar (NAFIN / FIFOMI)', tipo: 'gob-federal', cobertura: 'nacional',
    monto: [100000, 10000000], destinos: ['capital', 'inventario'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'Nacional Financiera · 800 2000 215 · nafin.com (Factoraje) · FIFOMI para actividades mineras',
    desc: 'Adelanto de tus facturas por cobrar: conviertes ventas a crédito en efectivo inmediato sin endeudarte a plazo largo.',
    pros: ['El "colateral" es tu propia factura: no pide aval extra', 'Rápido comparado con un crédito tradicional', 'Escala con tus ventas'],
    contras: ['Solo sirve si ya vendes a crédito con facturas formales', 'Costo = descuento sobre la factura', 'Tus clientes deben ser buenos pagadores']
  },
  {
    id: 'banca-pyme', nombre: 'Líneas PyME de banca comercial (Banregio, BBVA, Banorte, Santander, Bajío...)', tipo: 'banco', cobertura: 'nacional',
    monto: [200000, 30000000], destinos: ['capital', 'equipo', 'expansion', 'inventario'],
    formalidad: ['constituida', 'resico'], min_anios: 2,
    donde: 'Sucursal de tu banco o portal PyME de cada institución; en NL, Banregio y Banco del Bajío tienen foco regional fuerte',
    desc: 'Crédito comercial tradicional: capital de trabajo, arrendamiento financiero (leasing), créditos de equipo y líneas revolventes.',
    pros: ['Montos y plazos más amplios que el crédito de gobierno', 'Si ya tienes relación bancaria, el proceso se agiliza', 'Leasing sin descapitalizarte'],
    contras: ['Exige estados financieros, aval y/o garantía real', 'Historial crediticio limpio es requisito casi duro', 'Tasas altas si tu perfil es riesgoso']
  },
  {
    id: 'fira', nombre: 'FIRA — financiamiento agropecuario', tipo: 'gob-federal', cobertura: 'nacional',
    monto: [50000, 15000000], destinos: ['capital', 'equipo', 'expansion'],
    formalidad: ['constituida', 'resico', 'informal'], min_anios: 1,
    donde: 'FIRA (fira.gob.mx) y bancos afiliados · también oficinas de SADER estatal',
    desc: 'Créditos para agricultura, ganadería, avicultura, acuacultura y agroindustria: siembra, maquinaria, riego, infraestructura.',
    pros: ['La línea natural para giro agro con mejores tasas', 'Cubre temporada (capital de trabajo) e inversión', 'Incluye asistencia técnica'],
    contras: ['Solo giros agro / agroindustria', 'Avalúos y garantías (prenda/hipoteca) frecuentes', 'Ciclos ligados a calendario agrícola']
  },
  {
    id: 'fund-corporativas', nombre: 'Fundaciones corporativas (BBVA, Telefónica, Walmart, Harp Helú...)', tipo: 'fundacion', cobertura: 'nacional',
    monto: [50000, 500000], destinos: ['innovacion', 'marketing', 'expansion'],
    formalidad: ['cualquiera'], min_anios: 0,
    donde: 'Portales de cada fundación (fundacionbbva.org, fundaciontelefonica.com, fundacionwalmart.org, fundacionharp.org.mx) y sus convocatorias anuales',
    desc: 'Convocatorias de apoyo a emprendimiento, impacto social, inclusión y sustentabilidad: premios, donativos y programas de aceleración.',
    pros: ['No es deuda: premios/donativos que no pagas', 'Validan tu marca (sello de fundación reconocida)', 'Muchas aceptan negocios en etapas tempranas'],
    contras: ['Convocatorias con fechas y cupo limitado', 'Piden propuesta de impacto, no solo rentabilidad', 'Proceso competitivo y de selección por jurado']
  },
  {
    id: 'posible', nombre: 'POSiBLE (Fundación Televisa + Fundación Coppel)', tipo: 'fundacion', cobertura: 'nacional',
    monto: [0, 0], destinos: ['innovacion', 'marketing', 'expansion'],
    formalidad: ['cualquiera'], min_anios: 0.5,
    donde: 'posible.org.mx · registro en línea + modelo de negocio a revisión',
    desc: 'Programa nacional de emprendimiento: formación aplicada, mentoría, herramientas de IA y comunidad. Convocatorias nacionales y por estado (2026: Edomex, Oaxaca, Yucatán, Zacatecas). NO otorga dinero.',
    pros: ['Gratuito y sin cuotas; accesible desde 6 meses de operación', 'Mentoría y red de contactos con alto valor real', 'Fortalece tu caso antes de pedir crédito'],
    contras: ['No entrega recursos económicos (solo capacidades)', 'Exige dedicación de tiempo a formación', 'Cupos por estado/convocatoria']
  },
  {
    id: 'cultivadoras', nombre: 'Cultivadoras de Agua y Clima (Fundación Azteca + HEINEKEN + GIZ)', tipo: 'fundacion', cobertura: 'nacional',
    monto: [55000, 230000], destinos: ['innovacion', 'expansion', 'marketing'],
    formalidad: ['cualquiera'], min_anios: 0,
    donde: 'fundacionazteca.org (convocatoria Cultivadoras) · emprende.ambiental@fundacionazteca.org',
    desc: 'Para mujeres mexicanas con proyectos de agua, biodiversidad o clima: premios de $230,000 / $100,000 / $55,000 + aceleración y conexión con aliados. Convocatoria con fecha límite anual (2026: 10 de mayo).',
    pros: ['Dinero no reembolsable + acompañamiento', 'Alto valor de red (HEINEKEN, GIZ, fundaciones)', 'Proyectos pequeños pueden competir'],
    contras: ['Solo mujeres y proyectos con impacto ambiental claro', 'Ventana anual breve; si la cierras, espera al siguiente ciclo', 'Proceso de selección por panel']
  },
  {
    id: 'backing-rest', nombre: 'Backing International Small Restaurants (Fundación Placemaking + American Express)', tipo: 'fundacion', cobertura: 'Ciudad de México',
    monto: [200000, 200000], destinos: ['expansion', 'marketing', 'equipo'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'Convocatoria anual vía Fundación Placemaking / The Place Institute · (2026: registro hasta 16 de noviembre)',
    desc: 'Apoyo no reembolsable de $10,000 USD para renovar espacios de restaurantes, cafeterías y bares independientes de la CDMX. 10 seleccionados por edición.',
    pros: ['Dinero no reembolsable para mejora física', 'Ediciones anteriores reportan +11% ingresos promedio', 'Visibilidad con American Express'],
    contras: ['Solo CDMX y solo giros gastronómicos', 'Muy pocos cupos (10 por edición)', 'Piden propuesta concreta de mejora e impacto comunitario']
  },
  {
    id: 'osc-tichi', nombre: 'Fundación Tichi Muñoz (proyectos comunitarios)', tipo: 'fundacion', cobertura: 'nacional',
    monto: [50000, 400000], destinos: ['otro', 'expansion'],
    formalidad: ['cualquiera'], min_anios: 0,
    donde: 'ftm.org.mx (Convocatoria anual) · apoyos a OSC donatarias autorizadas',
    desc: 'Financia proyectos comunitarios de organizaciones donatarias (AC/IAP) con al menos dos fuentes de financiamiento. Hasta $400,000 por proyecto de 6-12 meses.',
    pros: ['Monto relevante para proyectos de impacto', 'No exige giro comercial específico'],
    contras: ['Solo OSC donatarias autorizadas (no empresas comunes)', 'No financia compra de bienes como rubro único', 'Piden diagnóstico comunitario con participación de beneficiarios']
  },
  {
    id: 'crowdfunding', nombre: 'Crowdfunding mexicano (PlayBusiness, Ideame)', tipo: 'plataforma', cobertura: 'nacional',
    monto: [100000, 5000000], destinos: ['capital', 'expansion', 'innovacion', 'marketing'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'playbusiness.mx · ideame.mx (registro y campaña en línea)',
    desc: 'Capital de la comunidad: equity crowdfunding (PlayBusiness, inversión a cambio de participación) o recompensas/preventa (Ideame).',
    pros: ['Sin aval bancario ni garantía real', 'La campaña es marketing: validas producto mientras juntas capital', 'Puedes superar la meta si tu comunidad responde'],
    contras: ['Preparar y promover la campaña toma semanas de trabajo', 'En equity cedes participación de tu empresa', 'Si no llegas a la meta, el esfuerzo no se paga']
  },
  {
    id: 'camaras', nombre: 'Cámaras empresariales (CAINTRA, CANACINTRA, COPARMEX)', tipo: 'camara', cobertura: 'nacional',
    monto: [0, 0], destinos: ['marketing', 'innovacion', 'otro'],
    formalidad: ['cualquiera'], min_anios: 0,
    donde: 'CAINTRA (caintra.org.mx, foco NL) · CANACINTRA · COPARMEX — comités de PyME y vinculación',
    desc: 'No dan crédito directo: dan acceso a programas con aliados, mentorías, ferias, patrocinios de eventos y representación gremial. En NL, CAINTRA es la vía fuerte de industria de transformación.',
    pros: ['Networking con empresas grandes (posibles proveedores/clientes)', 'Acceso a convocatorias y descuentos por membresía', 'Aval institucional que respalda tu solicitud ante terceros'],
    contras: ['Cuota de membresía', 'No es financiamiento directo', 'El valor depende de tu participación activa']
  },
  {
    id: 'innovacion', nombre: 'Fondos de innovación (CONAHCYT / estatales de innovación)', tipo: 'gob-federal', cobertura: 'nacional',
    monto: [100000, 3000000], destinos: ['innovacion'],
    formalidad: ['constituida', 'resico'], min_anios: 1,
    donde: 'conahcyt.mx (convocatorias de innovación) · en NL: programas de innovación de la Secretaría de Economía / IDENL',
    desc: 'Apoyos no reembolsables y estímulos para proyectos de I+D+i, tecnología y desarrollo de producto con componente innovador.',
    pros: ['No reembolsable si cumples el proyecto', 'Prestigio que abre otras puertas de inversión', 'Ideal para software, biotecnología y producto técnico'],
    contras: ['Convocatorias estrictas: informes técnicos y evidencia de innovación', 'Reintegro si no cumples el proyecto', 'Ciclos largos de evaluación']
  }
];

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function el(id) { return document.getElementById(id); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtMXN(v) {
  if (!v) return '—';
  return '$' + Math.round(v).toLocaleString('es-MX') + ' MXN';
}

function leerPerfil() {
  const monto = el('monto').value.split(',').map(Number);
  return {
    giro: el('giro').value,
    estado: el('estado').value,
    anios: parseFloat(el('anios').value),
    formalidad: el('formalidad').value,
    empleados: parseInt(el('empleados').value, 10),
    ingresos: parseFloat(el('ingresos').value),
    monto: monto,
    destinos: Array.from(document.querySelectorAll('#destinos label.on')).map(l => l.dataset.v),
    urgencia: el('urgencia').value
  };
}

function scorePrograma(p, perfil) {
  let s = 0;
  const why = [];
  const cobN = norm(p.cobertura);
  if (cobN === 'nacional' || cobN === 'nuevo leon' && norm(perfil.estado) === 'nuevo leon') {
    s += cobN === 'nacional' ? 10 : 25;
    if (cobN !== 'nacional') why.push('cobertura exacta en tu estado');
  } else if (cobN === norm(perfil.estado)) {
    s += 25;
    why.push('cobertura exacta en tu estado');
  } else {
    s -= 20;
    why.push('solo ' + p.cobertura + ' — verifica si aplica en tu zona');
  }
  const ov = p.destinos.filter(d => perfil.destinos.includes(d));
  s += ov.length * 8;
  if (ov.length) why.push('aplica para ' + ov.map(d => DEST_LABEL[d]).join(', '));
  const pm = p.monto;
  if (pm[1] === 0) {
    s += 4;
    why.push('apoyo no monetario (capacidades/vinculación)');
  } else if (perfil.monto[0] >= pm[0] * 0.5 && perfil.monto[1] <= pm[1] * 1.5) {
    s += 8;
    why.push('tu monto cabe en su rango (' + fmtMXN(pm[0]) + '–' + fmtMXN(pm[1]) + ')');
  } else {
    s -= 6;
    why.push('rango del programa: ' + fmtMXN(pm[0]) + '–' + fmtMXN(pm[1]));
  }
  if (p.formalidad.includes('cualquiera') || p.formalidad.includes(perfil.formalidad)) {
    s += 8;
    why.push('acepta tu situación fiscal');
  } else {
    s -= 15;
    why.push('pide ' + p.formalidad.join(' o '));
  }
  if (perfil.anios >= p.min_anios) {
    s += 5;
    if (p.min_anios) why.push('cumples antigüedad (' + p.min_anios + '+ años)');
  } else {
    s -= 12;
    why.push('pide ' + p.min_anios + ' años mínimo');
  }
  return { s, why };
}

function diagnostico(perfil) {
  const dest = perfil.destinos.map(d => DEST_LABEL[d]).join(' y ') || 'capital de trabajo';
  const tipos = [];
  if (perfil.destinos.includes('capital') || perfil.destinos.includes('inventario')) tipos.push('crédito de capital de trabajo (FOCRECE/banca/factoraje)');
  if (perfil.destinos.includes('equipo')) tipos.push('crédito de equipamiento o arrendamiento financiero');
  if (perfil.destinos.includes('expansion')) tipos.push('financiamiento a plazo largo (Nafin/FOCRECE) o inversión');
  if (perfil.destinos.includes('innovacion')) tipos.push('fondos de innovación y convocatorias de fundaciones');
  if (perfil.destinos.includes('marketing')) tipos.push('patrocinios, fundaciones y microcrédito');
  const montoTxt = fmtMXN(perfil.monto[0]) + '–' + fmtMXN(perfil.monto[1]);
  return `<h2>Diagnóstico de tu caso</h2>
  <div class="card">
    <p>Tu problema es de <b>${escapeHtml(dest)}</b> por <b>${montoTxt}</b>, con un negocio de <b>${perfil.anios >= 2 ? perfil.anios + ' años' : 'menos de 2 años'}</b> en <b>${escapeHtml(perfil.estado)}</b> (${escapeHtml(perfil.formalidad)}, ${perfil.empleados} empleados, ingresos ~${fmtMXN(perfil.ingresos * 1000000)}/año).</p>
    <p class="muted" style="margin-top:6px">Tipo de apoyo recomendado: ${escapeHtml(tipos.join(' · ') || 'microcrédito como puerta de entrada')}. Tu prioridad: ${perfil.urgencia === 'alta' ? 'velocidad (microcrédito/FOCRECE primero, banca en paralelo)' : perfil.urgencia === 'media' ? 'condiciones (compara estatal vs. banca con garantía)' : 'mejor costo (aplica a estatales y fondos no reembolsables primero)'}.</p>
  </div>`;
}

function renderRecomendaciones(perfil, lista) {
  const top = lista.slice(0, 6);
  return `<h2>Dónde acercarte (mejores coincidencias)</h2>` + top.map((r, i) => {
    const p = r.p;
    const tagCls = p.tipo.startsWith('gob') ? 'gob' : p.tipo === 'banco' ? 'banco' : p.tipo === 'fundacion' ? 'fund' : 'plat';
    const tagTxt = { 'gob-estatal': 'Gobierno estatal', 'gob-federal': 'Gobierno federal', banco: 'Banca', fundacion: 'Fundación', plataforma: 'Plataforma', camara: 'Cámara' }[p.tipo] || p.tipo;
    return `<div class="card">
      <h3>${i + 1}. ${escapeHtml(p.nombre)} <span class="tag ${tagCls}">${tagTxt}</span> <span class="match">coincidencia ${r.s} pts</span></h3>
      <p class="kv">${escapeHtml(p.desc)}</p>
      <p class="kv" style="margin-top:6px"><b>Monto:</b> ${p.monto[1] ? fmtMXN(p.monto[0]) + ' – ' + fmtMXN(p.monto[1]) : 'no monetario'} · <b>Cobertura:</b> ${escapeHtml(p.cobertura)}</p>
      <p class="kv"><b>Dónde acercarte:</b> ${escapeHtml(p.donde)}</p>
      <div class="badges">${r.why.slice(0, 4).map(w => `<span class="badge ok">${escapeHtml(w)}</span>`).join('')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
        <div><b class="match">PROS</b><ul class="pro">${p.pros.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
        <div><b style="color:var(--bad)">CONTRAS</b><ul class="con">${p.contras.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      </div>
    </div>`;
  }).join('');
}

function prosPerfil(perfil) {
  const pros = [];
  if (perfil.anios >= 2) pros.push('Llevas ' + (perfil.anios >= 7 ? 'más de 5' : perfil.anios) + ' años operando: demuestra permanencia y resiliencia');
  if (perfil.formalidad === 'constituida') pros.push('Empresa constituida: acceso a banca y programas federales');
  if (perfil.formalidad === 'resico') pros.push('Estás en RESICO/PF con actividad empresarial: facturas y comprobas ingresos ante el SAT');
  if (perfil.empleados >= 3) pros.push('Generas empleo (' + perfil.empleados + ' personas): argumento fuerte en programas públicos');
  if (perfil.ingresos >= 1) pros.push('Ingresos anuales de ~' + fmtMXN(perfil.ingresos * 1000000) + ': hay flujo demostrable para pagar una parcialidad');
  if (perfil.destinos.includes('equipo') || perfil.destinos.includes('expansion')) pros.push('El destino es inversión productiva (equipo/expansión), no gasto: los evaluadores lo premian');
  if (perfil.destinos.includes('innovacion')) pros.push('Componente de innovación: calificas a fondos y convocatorias especiales');
  if (!pros.length) pros.push('Tienes un objetivo concreto y cuantificado: eso ya te pone por delante de la mayoría de solicitantes');
  return pros;
}

function contrasPerfil(perfil) {
  const contras = [];
  const blind = [];
  if (perfil.formalidad === 'informal') {
    contras.push('Sin formalizar: la banca y los programas federales te cierran la puerta hoy');
    blind.push('Blindaje: formalízate (RESICO es rápido y barato) y aplica a microcrédito/FOCRECE mientras; lleva tu registro de ventas aunque sea en hoja de cálculo');
  }
  if (perfil.anios < 2) {
    contras.push('Menos de 2 años: muchos programas piden 24 meses y verán riesgo de supervivencia');
    blind.push('Blindaje: presenta tu historial de ventas mes a mes y un plan de uso del recurso; enfócate en microcréditos que piden 6-12 meses');
  }
  if (perfil.monto[1] > perfil.ingresos * 1000000 * 2 && perfil.ingresos < 6) {
    contras.push('El monto pedido es grande respecto a tus ingresos: sonará desproporcionado');
    blind.push('Blindaje: recalcula a un monto mínimo viable o divide la solicitud por etapas (primero lo urgente, luego la expansión)');
  }
  if (perfil.urgencia === 'alta') {
    contras.push('Con urgencia <1 mes, la banca tradicional no llega (3-8 semanas típicas)');
    blind.push('Blindaje: ve primero por microcrédito FOCRECE/factoraje (días) y corre la banca en paralelo como plan B');
  }
  if (perfil.formalidad !== 'informal' && !contras.length) contras.push('Todo expediente toma tiempo: tu principal enemigo es el calendario, no tu perfil');
  return { contras, blind };
}

function preguntasEntrevista(perfil, top) {
  const p = [];
  p.push({ q: '¿Para qué necesitas exactamente el recurso?', r: 'Responde con destino y monto: "' + (perfil.destinos.map(d => DEST_LABEL[d]).join(' y ') || 'capital de trabajo') + ', ' + fmtMXN(perfil.monto[0]) + ' a ' + fmtMXN(perfil.monto[1]) + '. Con eso ' + (perfil.destinos.includes('equipo') ? 'compro equipo que eleva mi capacidad de producción' : perfil.destinos.includes('expansion') ? 'abro/amplío mi operación' : 'financio inventario y operación sin frenar ventas') + '."' });
  p.push({ q: '¿Cómo lo vas a pagar?', r: 'Liga el pago al destino: "el recurso genera el flujo que cubre la parcialidad — mis ingresos actuales son ~' + fmtMXN(perfil.ingresos * 1000000) + '/año y este uso incrementa ventas/corta costos".' });
  if (perfil.formalidad === 'informal') {
    p.push({ q: '¿Estás al corriente con el SAT / por qué no estás constituido?', r: 'No lo esquives: "estoy en proceso de formalización (RESICO); mi negocio ya opera y tengo registro de ventas; el apoyo es justamente lo que me consolida".' });
  } else {
    p.push({ q: '¿Qué garantías o avales puedes ofrecer?', r: 'Menciona lo disponible (equipo, aval, obligado solidario) y nota que en Impulso NAFIN hasta 2.5 MDP basta aval y obligado solidario, y que FOCRECE tiene garantía estatal.' });
  }
  p.push({ q: '¿Tienes historial crediticio?', r: 'Si tienes: "sí, sin atrasos, adjunto mi reporte de Buró". Si no: "aún sin historial formal — por eso empiezo con este programa que acepta perfiles nuevos y así lo construyo".' });
  p.push({ q: '¿Qué pasa si el proyecto no sale?', r: 'Transmite control: "mi plan B es ' + (perfil.urgencia === 'alta' ? 'reducir el monto a lo mínimo viable' : 'ajustar plazos con ventas de la temporada') + '; no me endeudo más allá de mi capacidad de pago".' });
  if (top && top.length && top[0].p.id) {
    p.push({ q: '¿Por qué este programa en particular?', r: 'Usa las razones de coincidencia de tu opción #1: "' + top[0].why.slice(0, 2).join('; ') + '".' });
  }
  return p;
}

function renderArgumentario(perfil, lista) {
  const top = lista.slice(0, 3);
  const { contras, blind } = contrasPerfil(perfil);
  const pros = prosPerfil(perfil);
  const preguntas = preguntasEntrevista(perfil, top);
  const hoy = new Date().toLocaleDateString('es-MX');
  const texto = [
    'ARGUMENTARIO PARA TUS ENTREVISTAS — ' + hoy,
    '='.repeat(52),
    '',
    'TU CASO EN 3 LÍNEAS',
    'Negocio de ' + (perfil.giro) + ' en ' + perfil.estado + ', ' + (perfil.anios >= 7 ? 'más de 5' : perfil.anios) + ' años operando (' + perfil.formalidad + ', ' + perfil.empleados + ' empleados, ~' + fmtMXN(perfil.ingresos * 1000000) + '/año). Necesito ' + fmtMXN(perfil.monto[0]) + '–' + fmtMXN(perfil.monto[1]) + ' para ' + (perfil.destinos.map(d => DEST_LABEL[d]).join(' y ') || 'capital de trabajo') + '. Prioridad: ' + (perfil.urgencia === 'alta' ? 'inmediata (<1 mes)' : perfil.urgencia === 'media' ? 'corta (1-3 meses)' : 'sin urgencia, comparando opciones') + '.',
    '',
    'LO QUE DEBES MENCIONAR A TU FAVOR (PROS)',
    ...pros.map(x => '✓ ' + x),
    '',
    'LO QUE VERÁN EN CONTRA — Y CÓMO BLINDARLO',
    ...contras.map((x, i) => '✗ ' + x + (blind[i] ? '\n   → ' + blind[i] : '')),
    '',
    'PREGUNTAS PROBABLES Y CÓMO RESPONDER',
    ...preguntas.map((x, i) => (i + 1) + '. ' + x.q + '\n   → ' + x.r),
    '',
    'QUÉ LLEVAR A LA ENTREVISTA',
    '· Identificación oficial y comprobante de domicilio',
    '· Constancia de situación fiscal (SAT)' + (perfil.formalidad === 'informal' ? ' — si no tienes, formalízate primero (RESICO)' : ''),
    '· Estados financieros o registro de ventas de los últimos ' + (perfil.anios >= 2 ? '2 años' : '12 meses'),
    '· Reporte de Buró de Crédito actualizado',
    '· Plan de uso del recurso en 1 página: destino, monto, cómo genera el pago',
    '· Estados de cuenta bancarios recientes',
    '',
    'TUS MEJORES PUERTAS HOY',
    ...top.map((r, i) => (i + 1) + '. ' + r.p.nombre + ' — ' + r.p.donde.split('·')[0].trim()),
    '',
    'CIERRE (palabras para cerrar la plática)',
    '"No busco solo dinero: busco la mejor condición para crecer sin poner en riesgo el negocio. Con ' + fmtMXN(perfil.monto[0]) + '–' + fmtMXN(perfil.monto[1]) + ' en ' + (perfil.destinos.map(d => DEST_LABEL[d]).join(' y ') || 'capital de trabajo') + ', el retorno cubre el pago y deja margen. ¿Cuál es el siguiente paso para avanzar con ustedes?"',
    '',
    'Nota: información orientativa (catálogo verificado 2026-11). Confirma requisitos y vigencia directamente con cada institución.'
  ].join('\n');

  return `<h2>Escrito pros y contras para tus entrevistas</h2>
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
    <button id="btn-copiar">Copiar argumentario</button>
    <span class="muted">Pégalo en tus notas o compártelo con quien te acompañe</span>
  </div>
  <div class="argumentario" id="arg-texto">${escapeHtml(texto)}</div>`;
}

function analizar() {
  const perfil = leerPerfil();
  if (!perfil.destinos.length) {
    el('diagnostico').innerHTML = '<p class="muted">Selecciona al menos un destino para el recurso.</p>';
    return;
  }
  const lista = CATALOGO.map(p => ({ p, ...scorePrograma(p, perfil) })).sort((a, b) => b.s - a.s);
  el('diagnostico').innerHTML = diagnostico(perfil);
  el('recomendaciones').innerHTML = renderRecomendaciones(perfil, lista);
  el('argumentario').innerHTML = renderArgumentario(perfil, lista);
  const bc = el('btn-copiar');
  if (bc) bc.addEventListener('click', () => {
    const txt = el('arg-texto').textContent;
    const ok = () => { bc.textContent = 'Copiado ✓'; setTimeout(() => { bc.textContent = 'Copiar argumentario'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(() => fallbackCopy(txt, ok));
    else fallbackCopy(txt, ok);
  });
  try { localStorage.setItem('acp_perfil', JSON.stringify(perfil)); } catch (e) {}
}

function fallbackCopy(txt, ok) {
  const t = document.createElement('textarea');
  t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select();
  try { document.execCommand('copy'); ok(); } catch (e) {}
  t.remove();
}

function limpiar() {
  ['diagnostico', 'recomendaciones', 'argumentario'].forEach(id => { el(id).innerHTML = ''; });
}

function init() {
  el('estado').innerHTML = ESTADOS.map(e => `<option${e === 'Nuevo León' ? ' selected' : ''}>${e}</option>`).join('');
  document.querySelectorAll('#destinos label').forEach(l => l.addEventListener('click', () => {
    setTimeout(() => l.classList.toggle('on', l.querySelector('input').checked), 0);
  }));
  el('btn-analizar').addEventListener('click', analizar);
  el('btn-nuevo').addEventListener('click', limpiar);
  try {
    const saved = JSON.parse(localStorage.getItem('acp_perfil') || 'null');
    if (saved && saved.estado) {
      el('estado').value = saved.estado;
      el('giro').value = saved.giro;
      el('formalidad').value = saved.formalidad;
      el('urgencia').value = saved.urgencia;
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);
