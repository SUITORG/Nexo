const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============================================================
// NUEVAS INDUSTRIAS (13-17)
// ============================================================
const NEW_INDUSTRIES = [
  {
    categoria: 'Bienes Raíces',
    icono: '🏠',
    descripcion: 'Venta, renta, desarrollo y administración de propiedades inmobiliarias',
    nichos: [
      {
        valor: 'venta_renta_residencial',
        etiqueta: 'Venta y Renta Residencial',
        sinonimos: ['casa', 'departamento', 'terreno', 'vivienda', 'hipoteca', 'inmobiliaria'],
        especializaciones: ['Casas', 'Departamentos', 'Terrenos', 'Departamentos', 'Fraccionamientos', 'Hipotecas']
      },
      {
        valor: 'venta_renta_comercial',
        etiqueta: 'Venta y Renta Comercial',
        sinonimos: ['local', 'oficina', 'nave industrial', 'plaza', 'comercial'],
        especializaciones: ['Locales Comerciales', 'Oficinas', 'Naves Industriales', 'Plazas Comerciales', 'Coworking']
      },
      {
        valor: 'desarrollo_inmobiliario',
        etiqueta: 'Desarrollo Inmobiliario',
        sinonimos: ['constructora', 'desarrolladora', 'proyecto', 'obra', 'edificación'],
        especializaciones: ['Proyectos Residenciales', 'Proyectos Comerciales', 'Urbanización', 'Remodelación', 'Construcción']
      },
      {
        valor: 'fideicomiso_inmobiliario',
        etiqueta: 'Fideicomiso y Inversión',
        sinonimos: ['fideicomiso', 'inversión', 'plusvalía', 'rentabilidad', 'fondo'],
        especializaciones: ['Fideicomisos', 'Inversión Predial', 'Valuación', 'Plusvalía', 'Fondos de Inversión']
      },
      {
        valor: 'administracion_propiedades',
        etiqueta: 'Administración de Propiedades',
        sinonimos: ['administración', 'condominio', 'mantenimiento', 'cobro', 'arrendamiento'],
        especializaciones: ['Condominios', 'Mantenimiento', 'Cobro de Renta', 'Gestión de Arrendamiento', 'Auditoría']
      }
    ]
  },
  {
    categoria: 'Jardinería y Paisajismo',
    icono: '🌿',
    descripcion: 'Diseño, mantenimiento y cuidado de jardines, áreas verdes y paisajismo',
    nichos: [
      {
        valor: 'diseño_paisajismo',
        etiqueta: 'Diseño de Paisajismo',
        sinonimos: ['paisajismo', 'diseño jardín', 'arquitectura paisaje', 'jardín'],
        especializaciones: ['Diseño de Jardines', 'Paisajismo Residencial', 'Paisajismo Comercial', 'Jardines Verticales', 'Paisajismo Sustentable']
      },
      {
        valor: 'mantenimiento_jardines',
        etiqueta: 'Mantenimiento de Jardines',
        sinonimos: ['mantenimiento', 'corte', 'poda', 'césped', 'jardín'],
        especializaciones: ['Corte de Césped', 'Poda de Árboles', 'Fertilización', 'Control de Plagas', 'Riego']
      },
      {
        valor: 'arboricultura',
        etiqueta: 'Arboricultura',
        sinonimos: ['árbol', 'arbolado', 'poda', 'tala', 'arborista'],
        especializaciones: ['Poda de Arborización', 'Diagnóstico de Árboles', 'Tala Segura', 'Tratamiento Fitopatológico', 'Certificación Arborista']
      },
      {
        valor: 'jardines_verticales',
        etiqueta: 'Jardines Verticales y Techos Verdes',
        sinonimos: ['vertical', 'techos verdes', 'pared verde', 'maceta', 'interior'],
        especializaciones: ['Jardines Verticales', 'Techos Verdes', 'Paisajismo Interior', 'Sistemas de Riego', 'Macetas Decorativas']
      },
      {
        valor: 'vivero_plantas',
        etiqueta: 'Vivero y Plantas',
        sinonimos: ['vivero', 'planta', 'flor', 'semilla', 'maceta'],
        especializaciones: ['Venta de Plantas', 'Semillas y Bulbos', 'Macetas y Accesorios', 'Asesoría de Plantas', 'Plantas de Sombra']
      }
    ]
  },
  {
    categoria: 'Análisis Clínicos y Laboratorio',
    icono: '🔬',
    descripcion: 'Laboratorios clínicos, análisis de sangre, estudios diagnósticos y medicina preventiva',
    nichos: [
      {
        valor: 'laboratorio_clinico',
        etiqueta: 'Laboratorio Clínico',
        sinonimos: ['análisis', 'sangre', 'orina', 'biometría', 'química sanguínea'],
        especializaciones: ['Biometría Hemática', 'Química Sanguínea', 'Examen General de Orina', 'Perfil Lipídico', 'Hemoglobina Glucosilada', 'Marcadores Tumorales']
      },
      {
        valor: 'laboratorio_especializado',
        etiqueta: 'Laboratorio Especializado',
        sinonimos: ['especializado', 'genética', 'hormonal', 'citología', 'biopsia'],
        especializaciones: ['Análisis Hormonales', 'Pruebas Genéticas', 'Citología', 'Biopsia', 'Pruebas de Alimentación', 'Farmacogenética']
      },
      {
        valor: 'diagnostico_imagen',
        etiqueta: 'Diagnóstico por Imagen',
        sinonimos: ['rayos x', 'ultrasonido', 'resonancia', 'tomografía', 'ecografía'],
        especializaciones: ['Rayos X', 'Ultrasonido', 'Tomografía', 'Resonancia Magnética', 'Mamografía', 'Densitometría Ósea']
      },
      {
        valor: 'medicina_preventiva',
        etiqueta: 'Medicina Preventiva y Chequeos',
        sinonimos: ['preventivo', 'chequeo', 'check-up', 'examen', 'peritaje'],
        especializaciones: ['Chequeos Generales', 'Peritajes Médicos', 'Evaluaciones Preoperatorias', 'Seguimiento Postoperatorio', 'Medicina del Trabajo']
      },
      {
        valor: 'diagnostico_molecular',
        etiqueta: 'Diagnóstico Molecular y PCR',
        sinonimos: ['pcr', 'molecular', 'covid', 'viruela', 'patógeno'],
        especializaciones: ['PCR COVID-19', 'PCR Influenza', 'Detección de Virus', 'Diagnóstico Molecular', 'Genómica']
      }
    ]
  },
  {
    categoria: 'Veterinaria y Cuidado Animal',
    icono: '🐾',
    descripcion: 'Servicios veterinarios, cuidado de mascotas, grooming, hotel y peluquería animal',
    nichos: [
      {
        valor: 'veterinaria_general',
        etiqueta: 'Veterinaria General',
        sinonimos: ['veterinaria', 'veterinario', 'mascota', 'perro', 'gato'],
        especializaciones: ['Medicina General', 'Vacunación', 'Desparasitación', 'Cirugía Menor', 'Urgencias', 'Esterilización']
      },
      {
        valor: 'veterinaria_especialista',
        etiqueta: 'Veterinaria Especialista',
        sinonimos: ['especialista', 'cardiología', 'dermatología', 'oncología', 'oftalmología'],
        especializaciones: ['Dermatología Veterinaria', 'Cardiología Veterinaria', 'Oncología Veterinaria', 'Oftalmología', 'Ortopedia', 'Neurología']
      },
      {
        valor: 'grooming_peluqueria',
        etiqueta: 'Grooming y Peluquería',
        sinonimos: ['grooming', 'peluquería', 'baño', 'corte', 'estética'],
        especializaciones: ['Baño y Corte', 'Estética Canina', 'Tratamiento Capilar', 'Corte de Uñas', 'Limpieza de Oídos', 'Perfumación']
      },
      {
        valor: 'hotel_mascotas',
        etiqueta: 'Hotel y Guardería de Mascotas',
        sinonimos: ['hotel', 'guardería', 'hospedaje', 'pensionado', 'daycare'],
        especializaciones: ['Hotel Canino', 'Guardería Diurna', 'Pensionado', 'Cuidado Nocturno', 'Vacaciones para Mascotas']
      },
      {
        valor: 'adiestramiento_comportamiento',
        etiqueta: 'Adiestramiento y Comportamiento',
        sinonimos: ['adiestramiento', 'entrenamiento', 'obediencia', 'comportamiento', 'conducta'],
        especializaciones: ['Obediencia Básica', 'Adiestramiento Avanzado', 'Terapia de Comportamiento', 'Socialización', 'Detección de Drogas']
      },
      {
        valor: 'pet_shop_accesorios',
        etiqueta: 'Pet Shop y Accesorios',
        sinonimos: ['tienda', 'accesorios', 'alimento', 'juguetes', 'pet shop'],
        especializaciones: ['Alimentos Premium', 'Accesorios', 'Juguetes', 'Ropa para Mascotas', 'Transportadoras', 'Higiene']
      }
    ]
  },
  {
    categoria: 'Guardería y Cuidado Infantil',
    icono: '👶',
    descripcion: 'Guarderías, estancias infantiles, educación temprana y cuidado de niños',
    nichos: [
      {
        valor: 'guarderia',
        etiqueta: 'Guardería',
        sinonimos: ['guardería', 'estancia', 'niños', 'bebé', 'daycare'],
        especializaciones: ['Guardería Maternal', 'Estancia Infantil', 'Cuidado Diurno', 'Horario Flexible', 'Alimentación Incluida']
      },
      {
        valor: 'educacion_preescolar',
        etiqueta: 'Educación Preescolar',
        sinonimos: ['preescolar', 'kinder', 'jardín de niños', 'educación inicial'],
        especializaciones: ['Kínder', 'Preescolar', 'Educación Montessori', 'Educación Waldorf', 'Educación Bilingüe']
      },
      {
        valor: 'actividades_extracurriculares',
        etiqueta: 'Actividades Extracurriculares Infantiles',
        sinonimos: ['extracurricular', 'deporte', 'música', 'baile', 'natación'],
        especializaciones: ['Natación Infantil', 'Música y Ritmo', 'Danza', 'Artes Marciales', 'Pintura', 'Robótica Infantil']
      },
      {
        valor: 'psicologia_infantil',
        etiqueta: 'Psicología y Desarrollo Infantil',
        sinonimos: ['psicología', 'terapia', 'desarrollo', 'neuropsicología', 'autoestima'],
        especializaciones: ['Terapia Psicológica', 'Desarrollo Cognitivo', 'Neuropsicología Infantil', 'Terapia de Lenguaje', 'Integración Sensorial']
      },
      {
        valor: 'eventos_infantiles',
        etiqueta: 'Eventos y Fiestas Infantiles',
        sinonimos: ['fiesta', 'cumpleaños', 'eventos', 'animación', 'diversión'],
        especializaciones: ['Fiestas de Cumpleaños', 'Eventos Temáticos', 'Animación Infantil', 'Magia y Shows', 'Inflables y Juegos']
      }
    ]
  }
];

// ============================================================
// NICHOS EXTRA PARA INDUSTRIAS EXISTENTES
// ============================================================
const EXTRA_NICHES = [
  // Salud y Bienestar (id: 2)
  {
    industria_id: 2,
    valor: 'terapia_fisica_rehabilitacion',
    etiqueta: 'Terapia Física y Rehabilitación',
    sinonimos: ['fisioterapia', 'rehabilitación', 'fisical', 'recuperación', 'terapia física'],
    especializaciones: ['Fisioterapia', 'Rehabilitación Deportiva', 'Terapia Ocupacional', 'Rehabilitación Cardíaca', 'Terapia Respiratoria']
  },
  {
    industria_id: 2,
    valor: 'nutricion_dietetica',
    etiqueta: 'Nutrición y Dietética',
    sinonimos: ['nutriólogo', 'dieta', 'nutrición', 'alimentación', 'bajar de peso'],
    especializaciones: ['Nutrición Clínica', 'Dietética', 'Nutrición Deportiva', 'Nutrición Pediátrica', 'Control de Peso']
  },
  // Tecnología (id: 3)
  {
    industria_id: 3,
    valor: 'desarrollo_web_mobile',
    etiqueta: 'Desarrollo Web y Móvil',
    sinonimos: ['web', 'app', 'desarrollo', 'programación', 'software'],
    especializaciones: ['Desarrollo Web', 'Apps Móviles', 'E-commerce', 'Sistemas ERP', 'APIs y Backend']
  },
  {
    industria_id: 3,
    valor: 'ciberseguridad',
    etiqueta: 'Ciberseguridad',
    sinonimos: ['seguridad', 'hacker', 'firewall', 'protección', 'ciberseguridad'],
    especializaciones: ['Auditoría de Seguridad', 'Pentesting', 'Protección de Datos', 'Firewall y Antivirus', 'Cumplimiento Normativo']
  },
  // Comercio y Ventas (id: 6)
  {
    industria_id: 6,
    valor: 'venta_en_linea_ecommerce',
    etiqueta: 'Venta en Línea / E-commerce',
    sinonimos: ['tienda online', 'e-commerce', 'marketplace', 'venta digital', 'dropshipping'],
    especializaciones: ['Tienda Online', 'Marketplace', 'Dropshipping', 'Ventas por Redes Sociales', 'Funnels de Venta']
  },
  // Alimentos y Hospitalidad (id: 7)
  {
    industria_id: 7,
    valor: 'restaurante_cafeteria',
    etiqueta: 'Restaurante y Cafetería',
    sinonimos: ['restaurante', 'café', 'comida', 'cocina', 'gastronomía'],
    especializaciones: ['Restaurante Formal', 'Cafetería', 'Comida Rápida', 'Cocina Mexicana', 'Cocina Internacional']
  },
  {
    industria_id: 7,
    valor: 'hoteleria_turismo',
    etiqueta: 'Hotelería y Turismo',
    sinonimos: ['hotel', 'turismo', 'hospedaje', 'viaje', 'viajes'],
    especializaciones: ['Hotel', 'Hostal', 'Casa de Huéspedes', 'Agencia de Viajes', 'Turismo de Aventura']
  }
];

async function insertIndustries() {
  console.log('[SEED] Insertando nuevas industrias...');
  
  for (const ind of NEW_INDUSTRIES) {
    // Check if exists
    const { data: existing } = await supabase
      .from('industrias')
      .select('id')
      .eq('categoria', ind.categoria)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[SKIP] "${ind.categoria}" ya existe (id: ${existing[0].id})`);
      continue;
    }

    // Insert industry
    const { data: newInd, error: errInd } = await supabase
      .from('industrias')
      .insert({ categoria: ind.categoria, icono: ind.icono, descripcion: ind.descripcion })
      .select()
      .single();

    if (errInd) {
      console.error(`[ERROR] Industria "${ind.categoria}":`, errInd.message);
      continue;
    }
    console.log(`[OK] Industria "${ind.categoria}" → id: ${newInd.id}`);

    // Insert niches
    if (ind.nichos && ind.nichos.length > 0) {
      const nichosData = ind.nichos.map(n => ({
        industria_id: newInd.id,
        valor: n.valor,
        etiqueta: n.etiqueta,
        sinonimos: n.sinonimos,
        especializaciones: n.especializaciones,
        activo: true
      }));
      const { error: errN } = await supabase.from('nichos').insert(nichosData);
      if (errN) {
        console.error(`[ERROR] Nichos de "${ind.categoria}":`, errN.message);
      } else {
        console.log(`  → ${ind.nichos.length} nichos insertados`);
      }
    }
  }
}

async function insertExtraNiches() {
  console.log('\n[SEED] Insertando nichos extra en industrias existentes...');
  
  for (const n of EXTRA_NICHES) {
    // Check if niche exists
    const { data: existing } = await supabase
      .from('nichos')
      .select('id')
      .eq('valor', n.valor)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[SKIP] "${n.etiqueta}" ya existe`);
      continue;
    }

    const { error } = await supabase.from('nichos').insert({
      industria_id: n.industria_id,
      valor: n.valor,
      etiqueta: n.etiqueta,
      sinonimos: n.sinonimos,
      especializaciones: n.especializaciones,
      activo: true
    });

    if (error) {
      console.error(`[ERROR] "${n.etiqueta}":`, error.message);
    } else {
      console.log(`[OK] "${n.etiqueta}" → industria ${n.industria_id}`);
    }
  }
}

(async () => {
  await insertIndustries();
  await insertExtraNiches();
  console.log('\n[DONE] Listo');
})();
