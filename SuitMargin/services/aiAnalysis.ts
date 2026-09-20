// SuitMargin - AI Job Analysis Service
// IA interpreta, NUNCA calcula precios

export interface JobAnalysisInput {
  title: string;
  description: string;
  photos?: string[];
  address?: string;
  category?: string;
}

export interface JobAnalysisOutput {
  jobType: string;
  subtype?: string;
  knownDimensions: Record<string, number>;
  roomCount?: number;
  potentialMaterials: string[];
  complexity: 'low' | 'medium' | 'high';
  risks: string[];
  missingInformation: string[];
  possibleExtras: string[];
  estimatedHoursRange: { min: number; max: number };
  confidence: number; // 0-1
}

export interface SmartQuestion {
  id: string;
  question: string;
  field: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  options?: string[];
  required: boolean;
  reason: string;
}

/**
 * Análisis de trabajo por IA
 * Solo interpreta y clasifica - NO calcula precios
 */
export async function analyzeJob(input: JobAnalysisInput): Promise<JobAnalysisOutput> {
  // En producción: llamada a OpenAI/Claude con function calling
  // Aquí: mock basado en palabras clave para desarrollo

  const text = `${input.title} ${input.description}`.toLowerCase();

  // Detección básica por categoría
  const categoryMap: Record<string, Partial<JobAnalysisOutput>> = {
    plomer: {
      jobType: 'Plomería',
      subtype: text.includes('fuga') ? 'Reparación de fuga' :
               text.includes('instal') ? 'Instalación' : 'Mantenimiento',
      potentialMaterials: ['Tubería PVC', 'Conexiones', 'Cemento PVC', 'Teflón', 'Válvulas'],
      complexity: text.includes('fuga') ? 'medium' : 'low',
      estimatedHoursRange: { min: 1, max: 4 },
    },
    electric: {
      jobType: 'Electricidad',
      subtype: text.includes('corto') ? 'Cortocircuito' :
               text.includes('tablero') ? 'Tablero eléctrico' : 'Instalación general',
      potentialMaterials: ['Cable THHN', 'Breakers', 'Conduit', 'Cajas de registro', 'Tomacorrientes'],
      complexity: 'high',
      estimatedHoursRange: { min: 2, max: 8 },
    },
    pintur: {
      jobType: 'Pintura',
      subtype: text.includes('interior') ? 'Interior' : 'Exterior',
      potentialMaterials: ['Pintura vinílica', 'Sellador', 'Brochas/rodillos', 'Cinta de pintor', 'Plásticos protectores'],
      complexity: 'low',
      estimatedHoursRange: { min: 4, max: 16 },
    },
    jardin: {
      jobType: 'Jardinería',
      subtype: text.includes('poda') ? 'Poda' : 'Mantenimiento',
      potentialMaterials: ['Fertilizante', 'Semilla/cesped', 'Herramientas de poda'],
      complexity: 'low',
      estimatedHoursRange: { min: 1, max: 6 },
    },
    limpiez: {
      jobType: 'Limpieza',
      subtype: text.includes('profunda') ? 'Limpieza profunda' : 'Mantenimiento',
      potentialMaterials: ['Desinfectante', 'Detergentes', 'Paños microfibra', 'Aspiradora'],
      complexity: 'low',
      estimatedHoursRange: { min: 2, max: 8 },
    },
    hvac: {
      jobType: 'HVAC',
      subtype: text.includes('minisplit') ? 'Minisplit' : 'Aire central',
      potentialMaterials: ['Gas refrigerante', 'Filtros', 'Tubería de cobre', 'Aislamiento'],
      complexity: 'high',
      estimatedHoursRange: { min: 2, max: 6 },
    },
  };

  // Match categoría
  let matched: Partial<JobAnalysisOutput> = {};
  for (const [key, value] of Object.entries(categoryMap)) {
    if (text.includes(key)) {
      matched = value;
      break;
    }
  }

  // Detectar habitaciones
  const roomMatch = text.match(/(\d+)\s*(habitacion|recamara|cuarto|baño|sala|cocina)/);
  const roomCount = roomMatch ? parseInt(roomMatch[1]) : undefined;

  // Detectar dimensiones
  const dimMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*(m2|metros|mts|ft|pies)/g);
  const knownDimensions: Record<string, number> = {};
  for (const m of dimMatches) {
    knownDimensions[m[2]] = parseFloat(m[1]);
  }

  // Generar preguntas inteligentes (máx 5)
  const questions = generateSmartQuestions(text, matched.jobType || 'Servicio', roomCount);

  return {
    jobType: matched.jobType || 'Servicio general',
    subtype: matched.subtype,
    knownDimensions,
    roomCount,
    potentialMaterials: matched.potentialMaterials || ['Materiales varios'],
    complexity: matched.complexity || 'medium',
    risks: generateRisks(text, matched.complexity || 'medium'),
    missingInformation: identifyMissingInfo(text, matched.jobType || 'Servicio', roomCount),
    possibleExtras: generateExtras(matched.jobType || 'Servicio'),
    estimatedHoursRange: matched.estimatedHoursRange || { min: 2, max: 8 },
    confidence: matched.jobType ? 0.8 : 0.4,
  };
}

function generateSmartQuestions(text: string, jobType: string, roomCount?: number): SmartQuestion[] {
  const questions: SmartQuestion[] = [];

  // Preguntas base por tipo
  const baseQuestions: Record<string, SmartQuestion[]> = {
    Plomería: [
      { id: 'q1', question: '¿Es una fuga visible o hay que localizarla?', field: 'leak_type', type: 'select', options: ['Visible', 'Oculta (requiere detección)', 'No sé'], required: true, reason: 'Afecta horas y materiales' },
      { id: 'q2', question: '¿Qué tipo de tubería?', field: 'pipe_type', type: 'select', options: ['PVC', 'Cobre', 'Galvanizado', 'PEX', 'No sé'], required: true, reason: 'Materiales y herramientas distintas' },
    ],
    Electricidad: [
      { id: 'q1', question: '¿Cuál es el voltaje del circuito?', field: 'voltage', type: 'select', options: ['127V', '220V', 'Ambos', 'No sé'], required: true, reason: 'Seguridad y materiales' },
      { id: 'q2', question: '¿Requiere permiso o inspección?', field: 'permit', type: 'boolean', required: false, reason: 'Tiempo y costo adicional' },
    ],
    Pintura: [
      { id: 'q1', question: '¿Las paredes están pintadas o son nuevas?', field: 'wall_condition', type: 'select', options: ['Pintadas (buen estado)', 'Pintadas (mal estado)', 'Nuevas (yeso/tablaroca)', 'No sé'], required: true, reason: 'Preparación de superficie' },
      { id: 'q2', question: '¿Incluye techos y puertas?', field: 'include_ceilings_doors', type: 'boolean', required: false, reason: 'Afecta metros cuadrados y tiempo' },
    ],
  };

  // Agregar preguntas base
  const typeQuestions = baseQuestions[jobType] || [];
  questions.push(...typeQuestions.slice(0, 3));

  // Preguntas contextuales
  if (!roomCount) {
    questions.push({
      id: `q_rooms_${Date.now()}`,
      question: '¿Cuántas habitaciones/áreas incluye el trabajo?',
      field: 'room_count',
      type: 'number',
      required: true,
      reason: 'Base para calcular metros y tiempo',
    });
  }

  if (!text.includes('material') && !text.includes('pintura') && !text.includes('tubo')) {
    questions.push({
      id: `q_materials_${Date.now()}`,
      question: '¿Tienes los materiales o los compro yo?',
      field: 'materials_provided',
      type: 'select',
      options: ['Los compro yo', 'Los tiene el cliente', 'Mitad y mitad'],
      required: true,
      reason: 'Define costo de materiales y logística',
    });
  }

  // Pregunta de acceso
  questions.push({
    id: `q_access_${Date.now()}`,
    question: '¿Hay acceso fácil al área de trabajo?',
    field: 'easy_access',
    type: 'select',
    options: ['Sí, acceso directo', 'Parcial (escaleras/pasillos)', 'Difícil (techo/espacio reducido)'],
    required: false,
    reason: 'Afecta tiempo de setup y equipo necesario',
  });

  return questions.slice(0, 5).map((q, i) => ({ ...q, id: q.id || `q${i}` }));
}

function generateRisks(text: string, complexity: string): string[] {
  const risks: string[] = [];

  if (complexity === 'high') risks.push('Requiere certificación/licencia especializada');
  if (text.includes('fuga') && !text.includes('visible')) risks.push('Fuga oculta: posible daño estructural');
  if (text.includes('electric') && !text.includes('apagad')) risks.push('Riesgo eléctrico: verificar corte de energía');
  if (text.includes('altura') || text.includes('techo') || text.includes('segundo piso')) risks.push('Trabajo en altura: requerir escalera/andamio');
  if (!text.includes('permiso') && (text.includes('gas') || text.includes('electric'))) risks.push('Puede requerir permiso municipal');

  return risks.length ? risks : ['Riesgo estándar del oficio'];
}

function identifyMissingInfo(text: string, jobType: string, roomCount?: number): string[] {
  const missing: string[] = [];

  if (!roomCount) missing.push('Número de habitaciones/áreas');
  if (!text.includes('material') && !text.includes('suministr')) missing.push('Quién provee materiales');
  if (!text.includes('acceso') && !text.includes('facil')) missing.push('Condiciones de acceso al sitio');
  if (jobType === 'Pintura' && !text.includes('techo') && !text.includes('puert')) missing.push('Si incluye techos/puertas');
  if (jobType === 'Plomería' && !text.includes('tuber')) missing.push('Tipo de tubería existente');

  return missing;
}

function generateExtras(jobType: string): string[] {
  const extrasMap: Record<string, string[]> = {
    Plomería: ['Limpieza de drenaje preventiva', 'Instalación de filtro de agua', 'Revisión de calentador'],
    Electricidad: ['Instalación de tomacorrientes USB', 'Protector de sobretensión', 'Iluminación LED'],
    Pintura: ['Impermeabilización', 'Reparación de grietas', 'Barnizado de madera'],
    Jardinería: ['Sistema de riego', 'Fertilización estacional', 'Control de plagas'],
    Limpieza: ['Limpieza de alfombras', 'Pulido de pisos', 'Desinfección electrostática'],
    HVAC: ['Limpieza de ductos', 'Contrato de mantenimiento anual', 'Termostato inteligente'],
  };

  return extrasMap[jobType] || ['Servicio adicional relacionado'];
}