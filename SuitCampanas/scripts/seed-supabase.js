const supabase = require('../lib/supabase');
const fs = require('fs');
const path = require('path');

const industriasPath = path.join(__dirname, '../config/industrias.json');
const { clasificacion } = JSON.parse(fs.readFileSync(industriasPath, 'utf8'));

async function seed() {
  console.log(`📦 Seed: ${clasificacion.length} categorías para migrar...`);

  for (const cat of clasificacion) {
    const { data: existing } = await supabase
      .from('industrias')
      .select('id')
      .eq('categoria', cat.categoria)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭️  "${cat.categoria}" ya existe (id=${existing.id}), saltando`);
      continue;
    }

    const { data: industria, error: err } = await supabase
      .from('industrias')
      .insert({
        categoria: cat.categoria,
        icono: cat.icono || '📦',
        descripcion: cat.descripcion || ''
      })
      .select()
      .single();

    if (err) {
      console.error(`  ❌ Error creando "${cat.categoria}": ${err.message}`);
      continue;
    }

    console.log(`  ✅ "${cat.categoria}" creada (id=${industria.id})`);

    if (cat.subclasificaciones && cat.subclasificaciones.length > 0) {
      const nichos = cat.subclasificaciones.map(n => ({
        industria_id: industria.id,
        valor: n.valor,
        etiqueta: n.etiqueta,
        sinonimos: n.sinonimos || [],
        especializaciones: n.especializaciones || []
      }));

      const { error: errN } = await supabase.from('nichos').insert(nichos);
      if (errN) {
        console.error(`    ❌ Error insertando nichos: ${errN.message}`);
      } else {
        console.log(`    ✅ ${nichos.length} nichos insertados`);
      }
    }
  }

  console.log('✅ Seed completado');
}

async function seedRecetas() {
  console.log('📦 Seed: Recetas de video...');
  const { data: existing } = await supabase.from('recetas').select('id').limit(1);
  if (existing && existing.length > 0) {
    console.log('  ⏭️  Ya hay recetas, saltando seed de recetas');
    return;
  }

  const recetas = [
    { nombre: 'Mix Rapido', orden: 'aleatorio', duracion_total: '30', ritmo: '0.5', filtro: 'ninguno', transicion: 'corte_brusco', animacion: false },
    { nombre: 'Cine Vintage', orden: 'secuencial', duracion_total: '60', ritmo: '2', filtro: 'vintage', transicion: 'fundido', animacion: true },
    { nombre: 'Show Vibrante', orden: 'aleatorio', duracion_total: '30', ritmo: 'musica', filtro: 'colores_vivos', transicion: 'barrido_derecha', animacion: false },
    { nombre: 'Slow Elegance', orden: 'secuencial', duracion_total: '60', ritmo: '2', filtro: 'blanco_y_negro', transicion: 'zoom', animacion: true },
    { nombre: 'Sorpresa Total', orden: 'aleatorio', duracion_total: '30', ritmo: 'musica', filtro: 'ninguno', transicion: 'fundido', animacion: true }
  ];

  const { error } = await supabase.from('recetas').insert(recetas);
  if (error) {
    console.error(`  ❌ Error insertando recetas: ${error.message}`);
  } else {
    console.log(`  ✅ ${recetas.length} recetas insertadas`);
  }
}

seed().then(seedRecetas).catch(console.error);

// Nota: Para crear la tabla `tendencias` en Supabase, usa este SQL:
/* 
CREATE TABLE IF NOT EXISTS tendencias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo TEXT NOT NULL,
    categoria TEXT DEFAULT 'Otro',
    descripcion TEXT DEFAULT '',
    fuente TEXT DEFAULT 'ia',
    receta_id BIGINT REFERENCES recetas(id),
    video_url TEXT,
    metadata JSONB DEFAULT '{}',
    publicado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
*/
