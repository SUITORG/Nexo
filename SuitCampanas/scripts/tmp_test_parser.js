const fs = require('fs');
const src = fs.readFileSync('local-server-node.js', 'utf8');
const start = src.indexOf('const BRIEF_LIST_FIELDS');
const end = src.indexOf('\n}', src.indexOf('function parseBrief'));
if (start < 0 || end < 0) { console.log('parseBrief no encontrado'); process.exit(1); }
eval(src.slice(start, end + 2));

const BRIEF = 'Autoridad en Kitchen-Tech |galeria: no_galeria|industria: Electrodoméstico y Bienes de Consumo Premium |nicho:Robots de Cocina Multifunción |especializacion: Asesoría de cocina inteligente |vendes: Thermomix |audiencia: mujeres del noreste de Mexico entusiastas |dolor: poco tiempo para cocinar, falta de organización, falta de creatividad en la cocina |PCP: hacer felices en la cocina, ahorro de tiempo, testimonios |lograr: ventas |vivir: TikTok |LAVTFU:https://a.com/x,https://a.com/y,,, |PM: 31000.00,15% |objecion: es caro, no tengo tiempo |competidores:|tono: dinamico|PS: |RLP: decir que el anuncio fue creado con AI';

const p = parseBrief(BRIEF);
console.log(JSON.stringify(p, null, 1));

const checks = [
  ['etiqueta_legado', p.etiqueta_legado === 'Autoridad en Kitchen-Tech'],
  ['usa_galeria false', p.usa_galeria === false],
  ['producto', p.producto === 'Thermomix'],
  ['objetivo', p.objetivo === 'ventas'],
  ['canal_principal', p.canal_principal === 'TikTok'],
  ['dolor array 3', Array.isArray(p.dolor) && p.dolor.length === 3],
  ['promesa_beneficio_prueba 3', Array.isArray(p.promesa_beneficio_prueba) && p.promesa_beneficio_prueba.length === 3],
  ['activos 2', Array.isArray(p.activos) && p.activos.length === 2],
  ['precio_margen', p.precio_margen && p.precio_margen.precio === '31000.00' && p.precio_margen.margen === '15%'],
  ['objeciones 2', Array.isArray(p.objeciones) && p.objeciones.length === 2],
  ['no PS', !('PS' in p) && p.prueba_social === undefined],
  ['restricciones_legales', typeof p.restricciones_legales === 'string' && p.restricciones_legales.includes('AI')],
  ['no competidores vacios', !('competidores' in p)]
];

let ok = true;
for (const [name, pass] of checks) {
  console.log((pass ? 'PASS ' : 'FAIL ') + name);
  if (!pass) ok = false;
}
console.log(ok ? 'ALL_ASSERTS_PASS' : 'ASSERT_FAIL');
process.exit(ok ? 0 : 1);
