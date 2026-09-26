import React from 'react';
import { MarginJob, buildInsights, compareEstimate, profitProtected } from '../services/learningLoop';
import { formatPrice } from '../../../lib/constants';

interface InsightsDashboardProps {
  jobs: MarginJob[];
}

/** PRD #21/#22/#32 — métricas simples + insights; sin datos suficientes no se afirma nada. */
export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ jobs }) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonth = jobs.filter((j) => new Date(j.createdAt) >= monthStart);
  const quotes = jobs.filter((j) => j.status !== 'estimate');
  const completed = jobs.filter((j) => compareEstimate(j));
  const margins = completed.map((j) => compareEstimate(j)!.marginPct);
  const avgMargin = margins.length ? Math.round((margins.reduce((a, b) => a + b, 0) / margins.length) * 10) / 10 : null;
  const revenue = completed.reduce((a, j) => a + (j.actualRevenueMxn ?? j.quotedPriceMxn), 0);
  const profit = completed.reduce((a, j) => a + compareEstimate(j)!.profitMxn, 0);
  const warnings = jobs.filter((j) => j.quotedPriceMxn < j.recommendedPriceMxn).length;
  const insights = buildInsights(jobs);

  const kpi = (label: string, value: string) => (
    <div className="bg-surface-alt rounded-xl border border-border-subtle p-3">
      <p className="text-label-sm text-text-muted">{label}</p>
      <p className="text-headline-sm font-bold text-text-primary">{value}</p>
    </div>
  );

  const weakest = [...completed]
    .sort((a, b) => compareEstimate(a)!.marginPct - compareEstimate(b)!.marginPct)
    .slice(0, 3);
  const strongest = [...completed]
    .sort((a, b) => compareEstimate(b)!.marginPct - compareEstimate(a)!.marginPct)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {kpi('Trabajos este mes', String(thisMonth.length))}
        {kpi('Cotizaciones enviadas', String(quotes.length))}
        {kpi('Completados', String(completed.length))}
        {kpi('Ingreso real', formatPrice(revenue))}
        {kpi('Utilidad real', formatPrice(profit))}
        {kpi('Margen promedio', avgMargin == null ? '—' : `${avgMargin}%`)}
        {kpi('Profit warnings', String(warnings))}
        {kpi('Margen protegido', formatPrice(profitProtected(jobs)))}
      </div>

      <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-2">
        <h3 className="text-label-lg font-bold text-text-primary flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
          AI Business Insights
        </h3>
        {insights.length === 0 ? (
          <p className="text-body-sm text-text-muted">
            Aún no hay suficientes trabajos completados para darte conclusiones. Completa al menos 5
            trabajos con tus datos reales y el sistema aprenderá de ellos.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {insights.map((i, idx) => (
              <li key={idx} className="text-body-sm text-text-primary flex gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] mt-0.5">lightbulb</span>
                {i}
              </li>
            ))}
          </ul>
        )}
      </div>

      {completed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Márgenes más débiles', list: weakest },
            { title: 'Márgenes más fuertes', list: strongest },
          ].map((block) => (
            <div key={block.title} className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-2">
              <h4 className="text-label-md font-bold text-text-primary">{block.title}</h4>
              {block.list.map((j) => (
                <div key={j.id} className="flex justify-between text-body-sm">
                  <span className="text-text-secondary truncate pr-2">{j.jobTitle || j.jobType}</span>
                  <span className="font-semibold text-text-primary">{compareEstimate(j)!.marginPct}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
