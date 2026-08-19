// ADR-026: reemplaza la versión anterior de este scratch test (pre-ADR-025,
// usaba las etiquetas superadas PCP/LAVTFU con solo 2 slots). Prueba parseBrief()
// contra el vector real de NOET en logo_url (formato final ADR-025) y contra el
// fallback legado de tipo_negocio.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'local-server-node.js'), 'utf8');
const start = src.indexOf('const BRIEF_LIST_FIELDS');
const end = src.indexOf('\n}', src.indexOf('function parseBrief'));
if (start < 0 || end < 0) { console.log('parseBrief no encontrado'); process.exit(1); }
eval(src.slice(start, end + 2));

const NOET = 'industria: Electrodoméstico y Bienes de Consumo Premium|nicho: Robots de Cocina Multifunción|especializacion: Asesoría de cocina inteligente|vendes: Thermomix|audiencia: mujeres del noreste de México entusiastas, dinámicas, curiosas o deportistas de 27 a 55 años con poder adquisitivo medio-alto|dolor: poco tiempo para cocinar, falta de organización, falta de creatividad en la cocina|PBP: hacer felices en la cocina a los demás, ahorro de tiempo, testimonios en redes sociales por usar la Thermomix|lograr: ventas|vivir: TikTok|LAPVTFU: https://drive.google.com/file/d/1EjjQcFue202gyvGqWg71k9UZDqlttxc5/view?usp=sharing,https://drive.google.com/file/d/1S2cfLV45-eX8TI0YvFtnFFmfotXkK-Q1/view?usp=sharing,https://drive.google.com/file/d/1S2cfLV45-eX8TI0YvFtnFFmfotXkK-Q1/view?usp=sharing,,,,|PM: 31000.00,15%|objecion: es caro, no tengo tiempo para citas, no soy capaz de usar aplicaciones, incredulidad|competidores: |tono: dinámico|PS: Cientos de mujeres como tú, pasando más tiempo con su familia|RLP: decir que el anuncio fue creado con AI|oferta: 12 Meses sin intereses en tarjetas participantes|descripcion: Thermo Mix, último modelo TM7+|cta: Quiero mi demo!';

const p = parseBrief(NOET);

const checks = [
  ['industria (segmento 0, sin etiqueta_legado colgado)', p.industria === 'Electrodoméstico y Bienes de Consumo Premium' && p.etiqueta_legado === ''],
  ['nicho', p.nicho === 'Robots de Cocina Multifunción'],
  ['producto (vendes)', p.producto === 'Thermomix'],
  ['dolor: lista de 3', Array.isArray(p.dolor) && p.dolor.length === 3],
  ['PBP: texto libre, no lista', typeof p.pbp === 'string' && p.pbp.includes('testimonios')],
  ['objetivo (lograr)', p.objetivo === 'ventas'],
  ['canal_principal (vivir)', p.canal_principal === 'TikTok'],
  ['activos: objeto posicional, no array compactado', !Array.isArray(p.activos) && typeof p.activos === 'object'],
  ['activos.logo', p.activos.logo.includes('1EjjQcFue')],
  ['activos.avatar (slot 2, propio, no fallback aquí)', p.activos.avatar.includes('1S2cfLV45')],
  ['activos.fotoPersonal (slot 3, no se pierde entre los vacíos)', p.activos.fotoPersonal.includes('1S2cfLV45')],
  ['activos.videos vacío (slot 4, sin desalinear)', p.activos.videos === ''],
  ['precio_margen (PM)', p.precio_margen.precio === '31000.00' && p.precio_margen.margen === '15%'],
  ['objeciones: lista de 4', Array.isArray(p.objeciones) && p.objeciones.length === 4],
  ['no competidores vacíos', !('competidores' in p)],
  ['prueba_social (PS)', p.prueba_social.includes('familia')],
  ['restricciones_legales (RLP)', p.restricciones_legales.includes('AI')],
  ['oferta', p.oferta.includes('12 Meses')],
  ['cta', p.cta === 'Quiero mi demo!']
];

const LEGADO = parseBrief('Autoridad en Kitchen-Tech,no_galeria');
checks.push(['legado tipo_negocio post-ADR-025 sigue cayendo a etiqueta_legado', LEGADO.etiqueta_legado === 'Autoridad en Kitchen-Tech,no_galeria' && LEGADO.industria === undefined]);

let ok = true;
for (const [name, pass] of checks) {
  console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass) ok = false;
}
console.log(ok ? 'ALL_ASSERTS_PASS' : 'ASSERT_FAIL');
process.exit(ok ? 0 : 1);
