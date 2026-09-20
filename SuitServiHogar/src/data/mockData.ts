import { Technician, ServiceCategory, EscrowOrder } from '../types';

export const COLONIAS_REYNOSA = [
  'Las Fuentes',
  'Las Cumbres',
  'Jarachina Norte',
  'Jarachina Sur',
  'Ribereña',
  'Del Prado',
  'Hidalgo',
  'Petrolera',
  'Aztlán',
  'Cañada',
  'Villa Florida',
  'Sector Maquiladoras Puente Pharr'
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'climas',
    name: 'Climas y HVAC',
    count: 18,
    icon: 'mode_fan',
    basePriceMxn: 450,
    subtitle: 'Mantenimiento y gas',
    description: 'Servicio técnico especializado para minisplits convencionales e inverter, recargas de refrigerante R410A y mantenimientos químicos.'
  },
  {
    id: 'plomeria',
    name: 'Plomería Express',
    count: 14,
    icon: 'plumbing',
    basePriceMxn: 380,
    subtitle: 'Fugas, tinacos e hidros',
    description: 'Atención a fugas de agua no visibles, instalación de presurizadores, bombas sumergibles y termofusión con Tuboplus.'
  },
  {
    id: 'electricidad',
    name: 'Electricidad 220V/110V',
    count: 12,
    icon: 'bolt',
    basePriceMxn: 400,
    subtitle: 'Cortos y centros de carga',
    description: 'Balanceo de fases 220V para equipos de climatización, reemplazo de pastillas térmicas y tierra física industrial y residencial.'
  },
  {
    id: 'herreria',
    name: 'Herrería & Portones',
    count: 5,
    icon: 'fence',
    basePriceMxn: 600,
    subtitle: 'Portones y estructuras',
    description: 'Soldadura de portones, rejas, estructuras metálicas y reparaciones de herrería residencial e industrial.'
  },
  {
    id: 'pintores',
    name: 'Pintores',
    count: 15,
    icon: 'format_paint',
    basePriceMxn: 350,
    subtitle: 'Interiores y exteriores',
    description: 'Pintura residencial y comercial, preparación de superficies, impermeabilización de fachadas y acabados decorativos.'
  },
  {
    id: 'albaniles',
    name: 'Albañiles',
    count: 12,
    icon: 'construction',
    basePriceMxn: 500,
    subtitle: 'Obra civil y acabados',
    description: 'Construcción de muros, repello, pisos, azoteas, ampliaciones y acabados de concreto para residencias y maquiladoras.'
  },
  {
    id: 'yeseros',
    name: 'Yeseros',
    count: 8,
    icon: 'wall_art',
    basePriceMxn: 400,
    subtitle: 'Drywall y plafones',
    description: 'Instalación y reparación de tablaroca, plafones de yeso, cielos falsos y acabados de grano fino para interiores.'
  },
  {
    id: 'impermeabilizante',
    name: 'Impermeabilizante',
    count: 6,
    icon: 'water_drop',
    basePriceMxn: 450,
    subtitle: 'Techos y azoteas',
    description: 'Aplicación de impermeabilizantes en techos, azoteas, tanques de agua y muros con daño por humedad o filtraciones.'
  },
  {
    id: 'jardineria',
    name: 'Jardinería',
    count: 10,
    icon: 'yard',
    basePriceMxn: 300,
    subtitle: 'Poda y mantenimiento',
    description: 'Poda de árboles, jardines, instalación de riego, fertilización y mantenimiento de áreas verdes residenciales.'
  },
  {
    id: 'escombro',
    name: 'Recoger Escombro',
    count: 4,
    icon: 'delete_sweep',
    basePriceMxn: 600,
    subtitle: 'Limpieza y acarreo',
    description: 'Retiro de escombro, materiales de construcción, desechos voluminosos y limpieza general de predios y terrenos.'
  },
  {
    id: 'carpinteria',
    name: 'Carpintería',
    count: 8,
    icon: 'table_chart',
    basePriceMxn: 450,
    subtitle: 'Muebles y estructuras',
    description: 'Fabricación y reparación de muebles, puertas, ventanas, cocinas integrales y estructuras de madera a medida.'
  }
];

export const TECHNICIANS_DATA: Technician[] = [
  {
    id: 'roberto-garza',
    name: 'Ing. Roberto Garza',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
    title: 'Especialista en Climas & Minisplits Inverter',
    rating: 4.9,
    reviewCount: 84,
    distance: '~1.2 km en Las Fuentes',
    colonia: 'Las Fuentes',
    verifiedBadges: ['Técnico Certificado de Confianza', 'Depósito Escrow Protegido'],
    tags: ['Mantenimiento Preventivo', 'Carga Gas R410A', 'Tarjetas Inverter'],
    priceMxn: 450,
    priceUsd: 24,
    priceDescription: 'Diagnóstico y revisión técnica menor',
    availabilityBadge: 'Disponibilidad Hoy',
    yearsExperience: 8,
    level: 4,
    bio: 'Ingeniero Mecatrónico certificado con especialidad en sistemas de climatización residencial e industrial en la zona fronteriza de Reynosa. Auditoría domiciliaria completada.',
    certifications: ['DC-3 STPS Climatización', 'Certificación Inverter Daikin/Mirage', 'Cotejo Biométrico INE Tamaulipas']
  },
  {
    id: 'carlos-mendoza',
    name: 'Carlos Mendoza R.',
    avatar: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80',
    title: 'Plomería Residencial & Presurizadores',
    rating: 5.0,
    reviewCount: 92,
    distance: '~2.4 km (Radio Aztlán)',
    colonia: 'Aztlán',
    verifiedBadges: ['Técnico Certificado de Confianza', 'Fondo en Custodia Escrow'],
    tags: ['Tinacos & Cisternas', 'Bombas de Agua', 'Termofusión Tuboplus'],
    priceMxn: 380,
    priceUsd: 20.2,
    priceDescription: 'Inspección de fuga y reparación inicial',
    availabilityBadge: 'En ruta cercana',
    yearsExperience: 11,
    level: 5,
    bio: 'Plomero técnico de alta confianza en Reynosa. Especialista en presurización de agua para colonias con baja presión de red y termofusión libre de filtraciones.',
    certifications: ['Certificación Rotoplas', 'Termofusión Hidráulica Tuboplus', 'Carta No Antecedentes Tamaulipas']
  },
  {
    id: 'hector-villarreal',
    name: 'Téc. Héctor Villarreal',
    avatar: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80',
    title: 'Electricista Certificado 110V / 220V',
    rating: 4.9,
    reviewCount: 67,
    distance: '~3.1 km (Col. Petrolera)',
    colonia: 'Petrolera',
    verifiedBadges: ['Técnico Certificado de Confianza', 'Depósito Escrow Protegido'],
    tags: ['Sobrecargas & Cortos', 'Centro de Carga 220V', 'Lámparas LED & Tierra Física'],
    priceMxn: 400,
    priceUsd: 21.3,
    priceDescription: 'Revisión de líneas y diagnóstico de carga',
    availabilityBadge: 'Citas Disponibles',
    yearsExperience: 7,
    level: 3,
    bio: 'Instalaciones eléctricas residenciales bajo norma NOM-001-SEDE. Experiencia en plantas maquiladoras de Reynosa y cuadros de mando domiciliarios.',
    certifications: ['Técnico Electricista CBTIS', 'RFC Activo con Régimen SAT', 'Constancia Domiciliaria Reynosa']
  },
  {
    id: 'juan-carlos-mendez',
    name: 'Juan Carlos Méndez',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    title: 'Climatización & Minisplits',
    rating: 4.97,
    reviewCount: 142,
    distance: 'Sector Las Cumbres, Reynosa',
    colonia: 'Las Cumbres',
    verifiedBadges: ['Distintivo Técnico Certificado de Confianza (10+ servicios con 5★) Nivel 4'],
    tags: ['Mantenimiento Minisplit 1.5 Ton', 'Limpieza Química', 'Revisión de Amperaje'],
    priceMxn: 650,
    priceUsd: 35,
    priceDescription: 'Mantenimiento preventivo completo con desincrustante ecológico',
    availabilityBadge: 'Cita en ruta',
    yearsExperience: 9,
    level: 4,
    bio: 'Técnico certificado con más de 9 años de experiencia en Reynosa. Reconocido con Nivel 4 por auditoría presencial y más de 140 servicios calificados con 5 estrellas.',
    certifications: ['DC-3 STPS', 'INE Cotejada Presencialmente', 'Inspección Domiciliaria Aprobada']
  }
];

export const INITIAL_ORDER: EscrowOrder = {
  id: '#REY-88219',
  serviceTitle: 'Mantenimiento preventivo Minisplit 1.5 Ton',
  serviceDescription: 'Limpieza química de serpentines, turbina, charola y revisión de amperaje.',
  technician: TECHNICIANS_DATA[3], // Juan Carlos Méndez
  clientId: 'guest',
  date: 'Mañana, 15 Mar',
  timeWindow: '09:00 - 11:30 AM',
  basePriceMxn: 650,
  basePriceUsd: 35,
  guaranteePriceMxn: 0,
  satRetentionMxn: 0,
  totalMxn: 650,
  totalUsd: 35,
  exchangeRate: 18.57,
  status: 'draft',
  evidencePhotos: [
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80'
  ],
  zoneName: 'Col. Las Fuentes Secc. 2',
  street: 'Av. Monterrey',
  number: '1245',
  gpsLat: 26.0729,
  gpsLng: -98.3075
};

export const SETTLEMENT_ORDER_DATA = {
  ref: '#REY-88219',
  issuedAt: '24 Oct 2024 • 18:42 hrs',
  customerName: 'Ing. Gabriel Garza',
  serviceConcept: 'Mantenimiento Minisplit',
  location: 'Residencial Las Fuentes',
  grossClientPaymentMxn: 650.0,
  platformCommissionMxn: 97.5,
  commissionPercent: 15,
  satIsrPlatformMxn: 13.65,
  satIsrPercent: 2.1,
  satIvaRetentionMxn: 44.83,
  satIvaPercent: 8.0,
  satTotalWithheldMxn: 58.48,
  netEarningsMxn: 493.02,
  netEarningsUsd: 27.39,
  exchangeRate: 18.0, // fallback; runtime usa getRateSync()
  bankClabe: '•••• 4912',
  bankName: 'BBVA México'
};
