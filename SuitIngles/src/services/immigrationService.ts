// Immigration Service - Real USCIS Interview Questions
// Source: Official USCIS (U.S. Citizenship and Immigration Services)

export interface ImmigrationQuestion {
  id: string
  question: string
  questionEs: string
  answer: string
  answerEs: string
  notes: string[]
  category: 'general' | 'history' | 'civics' | 'english' | 'documents'
  difficulty: 'basic' | 'intermediate' | 'advanced'
}

// Real USCIS Naturalization Interview Questions
// Source: USCIS.gov Official Study Materials
export const USCIS_QUESTIONS: ImmigrationQuestion[] = [
  // === GENERAL QUESTIONS ===
  {
    id: 'uscis-001',
    question: 'What is your full legal name?',
    questionEs: '¿Cuál es tu nombre legal completo?',
    answer: 'My full legal name is [Your Name].',
    answerEs: 'Mi nombre legal completo es [Tu Nombre].',
    notes: ['Legal name = el nombre que aparece en tu pasaporte o documentos legales'],
    category: 'general',
    difficulty: 'basic'
  },
  {
    id: 'uscis-002',
    question: 'Where were you born?',
    questionEs: '¿Dónde naciste?',
    answer: 'I was born in [Country].',
    answerEs: 'Nací en [País].',
    notes: ['I was born in... = Nací en... (pasado simple pasiva)'],
    category: 'general',
    difficulty: 'basic'
  },
  {
    id: 'uscis-003',
    question: 'When did you come to the United States?',
    questionEs: '¿Cuándo llegaste a los Estados Unidos?',
    answer: 'I came to the United States on [Date].',
    answerEs: 'Llegué a los Estados Unidos el [Fecha].',
    notes: ['I came to... = Llegué a... (pasado simple)'],
    category: 'general',
    difficulty: 'basic'
  },
  {
    id: 'uscis-004',
    question: 'What is your current address?',
    questionEs: '¿Cuál es tu dirección actual?',
    answer: 'My current address is [Address].',
    answerEs: 'Mi dirección actual es [Dirección].',
    notes: ['Current = actual. Address = dirección'],
    category: 'general',
    difficulty: 'basic'
  },
  {
    id: 'uscis-005',
    question: 'Do you have any children?',
    questionEs: '¿Tienes hijos?',
    answer: 'Yes, I have [number] children. / No, I do not have any children.',
    answerEs: 'Sí, tengo [número] hijos. / No, no tengo hijos.',
    notes: ['Do you have...? = ¿Tienes...?', 'Any = alguno (en preguntas y negaciones)'],
    category: 'general',
    difficulty: 'basic'
  },
  {
    id: 'uscis-006',
    question: 'Are you married?',
    questionEs: '¿Estás casado/a?',
    answer: 'Yes, I am married. / No, I am single. / No, I am divorced.',
    answerEs: 'Sí, estoy casado/a. / No, soy soltero/a. / No, estoy divorciado/a.',
    notes: ['Married = casado, Single = soltero, Divorced = divorciado'],
    category: 'general',
    difficulty: 'basic'
  },

  // === CIVICS QUESTIONS ===
  {
    id: 'uscis-007',
    question: 'What is the capital of the United States?',
    questionEs: '¿Cuál es la capital de los Estados Unidos?',
    answer: 'Washington, D.C.',
    answerEs: 'Washington, D.C.',
    notes: ['Capital = capital (ciudad)', 'D.C. = District of Columbia'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-008',
    question: 'What are the colors of the American flag?',
    questionEs: '¿Cuáles son los colores de la bandera americana?',
    answer: 'Red, white, and blue.',
    answerEs: 'Rojo, blanco y azul.',
    notes: ['Red = rojo, White = blanco, Blue = azul'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-009',
    question: 'What is the national anthem of the United States?',
    questionEs: '¿Cuál es el himno nacional de los Estados Unidos?',
    answer: 'The Star-Spangled Banner.',
    answerEs: 'The Star-Spangled Banner (La Bandera de las Estrellas).',
    notes: ['National anthem = himno nacional'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-010',
    question: 'Who is the President of the United States?',
    questionEs: '¿Quién es el Presidente de los Estados Unidos?',
    answer: 'The President is [Current President Name].',
    answerEs: 'El Presidente es [Nombre del Presidente actual].',
    notes: ['President = presidente (siempre mayúscula)'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-011',
    question: 'What holiday is celebrated on the Fourth of July?',
    questionEs: '¿Qué festividad se celebra el 4 de julio?',
    answer: 'Independence Day.',
    answerEs: 'El Día de la Independencia.',
    notes: ['Independence Day = Día de la Independencia (1776)'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-012',
    question: 'What did Martin Luther King Jr. do?',
    questionEs: '¿Qué hizo Martin Luther King Jr.?',
    answer: 'He fought for civil rights. / He had a dream.',
    answerEs: 'Luchó por los derechos civiles. / Tuvo un sueño.',
    notes: ['Civil rights = derechos civiles', 'I have a dream = Tengo un sueño (discurso famoso)'],
    category: 'civics',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-013',
    question: 'How many U.S. Senators are there?',
    questionEs: '¿Cuántos Senadores de EE.UU. hay?',
    answer: 'One hundred (100).',
    answerEs: 'Cien (100).',
    notes: ['2 senadores por cada estado = 50 estados × 2 = 100'],
    category: 'civics',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-014',
    question: 'What is the Supreme Court?',
    questionEs: '¿Qué es la Corte Suprema?',
    answer: 'The Supreme Court is the highest court in the United States.',
    answerEs: 'La Corte Suprema es el tribunal más alto de los Estados Unidos.',
    notes: ['Supreme Court = Corte Suprema', 'Highest = más alto'],
    category: 'civics',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-015',
    question: 'What are the two major political parties in the United States?',
    questionEs: '¿Cuáles son los dos partidos políticos principales en los Estados Unidos?',
    answer: 'The Democratic Party and the Republican Party.',
    answerEs: 'El Partido Demócrata y el Partido Republicano.',
    notes: ['Democratic = demócrata, Republican = republicano'],
    category: 'civics',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-016',
    question: 'What is the Constitution?',
    questionEs: '¿Qué es la Constitución?',
    answer: 'The Constitution is the supreme law of the United States.',
    answerEs: 'La Constitución es la ley suprema de los Estados Unidos.',
    notes: ['Constitution = Constitución, Supreme law = ley suprema'],
    category: 'civics',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-017',
    question: 'What are the first ten amendments to the Constitution called?',
    questionEs: '¿Cómo se llaman las primeras diez enmiendas a la Constitución?',
    answer: 'The Bill of Rights.',
    answerEs: 'La Carta de Derechos.',
    notes: ['Bill of Rights = Carta de Derechos (1791)'],
    category: 'civics',
    difficulty: 'advanced'
  },
  {
    id: 'uscis-018',
    question: 'What is the ocean on the West Coast of the United States?',
    questionEs: '¿Qué océano está en la costa oeste de los Estados Unidos?',
    answer: 'The Pacific Ocean.',
    answerEs: 'El Océano Pacífico.',
    notes: ['Pacific = Pacífico, Atlantic = Atlántico (costa este)'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-019',
    question: 'What is the ocean on the East Coast of the United States?',
    questionEs: '¿Qué océano está en la costa este de los Estados Unidos?',
    answer: 'The Atlantic Ocean.',
    answerEs: 'El Océano Atlántico.',
    notes: ['Atlantic = Atlántico'],
    category: 'civics',
    difficulty: 'basic'
  },
  {
    id: 'uscis-020',
    question: 'Name one of the two longest rivers in the United States.',
    questionEs: 'Nombra uno de los dos ríos más largos de los Estados Unidos.',
    answer: 'The Missouri River. / The Mississippi River.',
    answerEs: 'El río Missouri. / El río Mississippi.',
    notes: ['Missouri y Mississippi son los dos ríos más largos'],
    category: 'civics',
    difficulty: 'intermediate'
  },

  // === HISTORY QUESTIONS ===
  {
    id: 'uscis-021',
    question: 'When do we celebrate Independence Day?',
    questionEs: '¿Cuándo celebramos el Día de la Independencia?',
    answer: 'July 4th.',
    answerEs: '4 de julio.',
    notes: ['July = julio, 4th = cuarto (cuarto de julio)'],
    category: 'history',
    difficulty: 'basic'
  },
  {
    id: 'uscis-022',
    question: 'Who wrote the Declaration of Independence?',
    questionEs: '¿Quién escribió la Declaración de Independencia?',
    answer: 'Thomas Jefferson.',
    answerEs: 'Thomas Jefferson.',
    notes: ['Declaration of Independence = Declaración de Independencia (1776)'],
    category: 'history',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-023',
    question: 'What was one important thing that Abraham Lincoln did?',
    questionEs: '¿Qué cosa importante hizo Abraham Lincoln?',
    answer: 'He freed the slaves. / He saved the Union.',
    answerEs: 'Liberó a los esclavos. / Salvó la Unión.',
    notes: ['Freed = liberó, Slaves = esclavos, Union = Unión'],
    category: 'history',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-024',
    question: 'What did the Declaration of Independence do?',
    questionEs: '¿Qué hizo la Declaración de Independencia?',
    answer: 'It declared our independence from Great Britain.',
    answerEs: 'Declaró nuestra independencia de Gran Bretaña.',
    notes: ['Declared = declaró, Independence = independencia'],
    category: 'history',
    difficulty: 'intermediate'
  },
  {
    id: 'uscis-025',
    question: 'What is the reason we have a Congress?',
    questionEs: '¿Cuál es la razón por la que tenemos un Congreso?',
    answer: 'To make laws.',
    answerEs: 'Para hacer leyes.',
    notes: ['Make laws = hacer leyes'],
    category: 'history',
    difficulty: 'basic'
  },

  // === ENGLISH QUESTIONS ===
  {
    id: 'uscis-026',
    question: 'Can you read this sentence?',
    questionEs: '¿Puedes leer esta oración?',
    answer: 'Yes, I can read it.',
    answerEs: 'Sí, puedo leerla.',
    notes: ['Can you...? = ¿Puedes...? (habilidad)'],
    category: 'english',
    difficulty: 'basic'
  },
  {
    id: 'uscis-027',
    question: 'Can you write this sentence?',
    questionEs: '¿Puedes escribir esta oración?',
    answer: 'Yes, I can write it.',
    answerEs: 'Sí, puedo escribirla.',
    notes: ['Write = escribir'],
    category: 'english',
    difficulty: 'basic'
  },
  {
    id: 'uscis-028',
    question: 'What does "civilian" mean?',
    questionEs: '¿Qué significa "civilian"?',
    answer: 'A civilian is a person who is not in the military.',
    answerEs: 'Un civil es una persona que no está en el ejército.',
    notes: ['Civilian = civil (no militar)'],
    category: 'english',
    difficulty: 'intermediate'
  },

  // === DOCUMENTS QUESTIONS ===
  {
    id: 'uscis-029',
    question: 'Can you show me your green card?',
    questionEs: '¿Puedes mostrarme tu green card?',
    answer: 'Yes, here it is.',
    answerEs: 'Sí, aquí está.',
    notes: ['Green card = tarjeta de residencia permanente'],
    category: 'documents',
    difficulty: 'basic'
  },
  {
    id: 'uscis-030',
    question: 'Do you have your passport?',
    questionEs: '¿Tienes tu pasaporte?',
    answer: 'Yes, I have my passport with me.',
    answerEs: 'Sí, tengo mi pasaporte conmigo.',
    notes: ['Passport = pasaporte'],
    category: 'documents',
    difficulty: 'basic'
  }
]

// Get questions by category
export function getQuestionsByCategory(category: ImmigrationQuestion['category']): ImmigrationQuestion[] {
  return USCIS_QUESTIONS.filter(q => q.category === category)
}

// Get questions by difficulty
export function getQuestionsByDifficulty(difficulty: ImmigrationQuestion['difficulty']): ImmigrationQuestion[] {
  return USCIS_QUESTIONS.filter(q => q.difficulty === difficulty)
}

// Get random questions (for practice)
export function getRandomQuestions(count: number): ImmigrationQuestion[] {
  const shuffled = [...USCIS_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// Get all categories with counts
export function getCategoriesWithCounts(): { category: string; count: number }[] {
  const categories = ['general', 'civics', 'history', 'english', 'documents'] as const
  return categories.map(cat => ({
    category: cat,
    count: USCIS_QUESTIONS.filter(q => q.category === cat).length
  }))
}
