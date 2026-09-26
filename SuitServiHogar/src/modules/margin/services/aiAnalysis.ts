// AI Job Analysis — PRD #8/#9/#10/#27/#30.
// La IA INTERPRETA; el pricingEngine CALCULA. Si la IA falla, todo sigue en modo manual.

export interface JobAnalysis {
  job_type: string;
  complexity: 'baja' | 'media' | 'alta';
  estimated_hours: number;
  materials: { name: string; est_cost_mxn: number }[];
  missing_information: string[];
  risks: string[];
  questions: string[]; // PRD: máximo 5
  scope: { included: string[]; exclusions: string[]; assumptions: string[] };
}

const AI_ENDPOINT = '/api/ai/analyze';

const asStr = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);
const asNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const asList = (v: unknown, max: number) =>
  Array.isArray(v) ? v.map((x) => asStr(x)).filter(Boolean).slice(0, max) : [];

function sanitize(raw: any): JobAnalysis | null {
  if (!raw || typeof raw !== 'object') return null;
  const complexity = asStr(raw.complexity, 'media').toLowerCase();
  return {
    job_type: asStr(raw.job_type, 'Servicio general'),
    complexity: (['baja', 'media', 'alta'] as const).includes(complexity as any) ? (complexity as any) : 'media',
    estimated_hours: asNum(raw.estimated_hours),
    materials: Array.isArray(raw.materials)
      ? raw.materials
          .map((m: any) => ({ name: asStr(m?.name), est_cost_mxn: asNum(m?.est_cost_mxn) }))
          .filter((m: any) => m.name)
          .slice(0, 12)
      : [],
    missing_information: asList(raw.missing_information, 10),
    risks: asList(raw.risks, 10),
    questions: asList(raw.questions, 5),
    scope: {
      included: asList(raw.scope?.included, 12),
      exclusions: asList(raw.scope?.exclusions, 12),
      assumptions: asList(raw.scope?.assumptions, 12),
    },
  };
}

/** Devuelve null si la IA no está disponible — el caller cae a entrada manual (PRD #30). */
export async function analyzeJob(description: string): Promise<JobAnalysis | null> {
  const text = description.trim();
  if (!text) return null;
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return sanitize(data.analysis);
  } catch {
    return null;
  }
}
