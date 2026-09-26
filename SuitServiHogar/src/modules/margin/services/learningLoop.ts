// Estimated vs Actual + AI Learning Loop — PRD #19/#20/#21.
// ponytail: persistencia en localStorage (sin tabla nueva); migrar a Supabase si SuitMargin crece

export interface MarginJob {
  id: string;
  jobType: string;
  jobTitle: string;
  description: string;
  createdAt: string;
  status: 'estimate' | 'quote_sent' | 'completed';
  estimatedHours: number;
  estimatedCostMxn: number;
  recommendedPriceMxn: number;
  quotedPriceMxn: number;
  actualHours?: number;
  actualCostMxn?: number;
  actualRevenueMxn?: number;
}

const STORE_KEY = 'sh_margin_jobs';

export function loadJobs(): MarginJob[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJob(job: MarginJob): MarginJob[] {
  const jobs = loadJobs().filter((j) => j.id !== job.id);
  jobs.unshift(job);
  localStorage.setItem(STORE_KEY, JSON.stringify(jobs.slice(0, 200)));
  return loadJobs();
}

export interface Comparison {
  hoursDeltaPct: number | null;
  costDeltaPct: number | null;
  profitMxn: number;
  marginPct: number;
}

export function compareEstimate(job: MarginJob): Comparison | null {
  if (job.status !== 'completed' || job.actualHours == null || job.actualCostMxn == null) return null;
  const revenue = job.actualRevenueMxn ?? job.quotedPriceMxn;
  const pct = (actual: number, estimated: number) =>
    estimated > 0 ? Math.round(((actual - estimated) / estimated) * 1000) / 10 : null;
  const profit = Math.round((revenue - job.actualCostMxn) * 100) / 100;
  return {
    hoursDeltaPct: pct(job.actualHours, job.estimatedHours),
    costDeltaPct: pct(job.actualCostMxn, job.estimatedCostMxn),
    profitMxn: profit,
    marginPct: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
  };
}

const MIN_SAMPLES = 5;

/**
 * PRD #20/#22: nunca afirmar estadísticas sin datos suficientes.
 * Devuelve [] si no hay al menos MIN_SAMPLES trabajos del mismo tipo.
 */
export function buildInsights(jobs: MarginJob[]): string[] {
  const completed = jobs.filter((j) => compareEstimate(j));
  if (completed.length < MIN_SAMPLES) return [];

  const insights: string[] = [];

  const byType = new Map<string, MarginJob[]>();
  for (const j of completed) byType.set(j.jobType, [...(byType.get(j.jobType) || []), j]);

  for (const [type, group] of byType) {
    if (group.length < MIN_SAMPLES) continue;
    const deltas = group.map((j) => compareEstimate(j)!.hoursDeltaPct).filter((d): d is number => d != null);
    const avg = Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
    if (avg >= 10) {
      insights.push(`Tus últimos ${group.length} trabajos de ${type.toLowerCase()} tomaron ~${avg}% más horas de lo estimado.`);
    } else if (avg <= -10) {
      insights.push(`En ${type.toLowerCase()} estás sobreestimando el tiempo: en promedio ${Math.abs(avg)}% menos horas de las previstas.`);
    }
  }

  const lowMargin = completed.filter((j) => {
    const c = compareEstimate(j)!;
    return c.marginPct > 0 && c.marginPct < 15;
  });
  if (lowMargin.length >= 3) {
    insights.push(`${lowMargin.length} trabajos recientes cerraron con margen menor al 15%. Revisa tu precio mínimo.`);
  }

  const underpriced = completed.filter((j) => j.quotedPriceMxn < j.recommendedPriceMxn);
  if (underpriced.length >= 3) {
    const protectedSum = Math.round(underpriced.reduce((a, j) => a + (j.recommendedPriceMxn - j.quotedPriceMxn), 0));
    insights.push(`Cotizaste por debajo de tu recomendación en ${underpriced.length} trabajos: ~${protectedSum} MXN de margen protegido si seguías el precio recomendado.`);
  }

  return insights;
}

/** PRD #32 — Profit Protected (estimación, no dinero ganado). */
export function profitProtected(jobs: MarginJob[]): number {
  return Math.round(
    jobs.reduce((sum, j) => sum + Math.max(0, j.recommendedPriceMxn - j.quotedPriceMxn), 0)
  );
}
