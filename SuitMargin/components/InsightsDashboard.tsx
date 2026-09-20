// SuitMargin - AI Business Insights Dashboard
// "You may be underestimating labor on painting jobs."

import React from 'react';
import { formatPrice } from '../services/pricingEngine';

interface Insight {
  type: 'margin_warning' | 'labor_underestimate' | 'category_performance' | 'pricing_recommendation';
  title: string;
  description: string;
  data: any;
  confidencePct: number;
  action?: { label: string; onClick: () => void };
}

interface InsightsDashboardProps {
  insights: Insight[];
  kpis: {
    jobsThisMonth: number;
    quotesSent: number;
    quotesAccepted: number;
    revenue: number;
    estimatedProfit: number;
    actualProfit: number;
    avgMargin: number;
    profitWarnings: number;
  };
}

const ICONS: Record<Insight['type'], string> = {
  margin_warning: 'warning',
  labor_underestimate: 'schedule',
  category_performance: 'trending_up',
  pricing_recommendation: 'attach_money',
};

const COLORS: Record<Insight['type'], { bg: string; border: string; text: string; icon: string }> = {
  margin_warning: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', icon: 'text-rose-600' },
  labor_underestimate: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: 'text-amber-600' },
  category_performance: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', icon: 'text-emerald-600' },
  pricing_recommendation: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'text-blue-600' },
};

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ insights, kpis }) => {
  return (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Trabajos mes', value: kpis.jobsThisMonth, icon: 'work', color: 'blue' },
          { label: 'Cotizaciones', value: `${kpis.quotesSent} / ${kpis.quotesAccepted}`, icon: 'description', color: 'emerald' },
          { label: 'Ingresos', value: formatPrice(kpis.revenue), icon: 'attach_money', color: 'amber' },
          { label: 'Margen real', value: `${kpis.avgMargin.toFixed(1)}%`, icon: 'trending_up', color: kpis.avgMargin >= 25 ? 'emerald' : 'rose' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-${kpi.color}-600`}>{kpi.icon}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Profit Warnings */}
      {kpis.profitWarnings > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-2xl">warning</span>
            <h3 className="text-rose-800 font-bold text-lg">{kpis.profitWarnings} trabajos perdiendo margen este mes</h3>
          </div>
          <p className="text-rose-700 mt-1 text-sm">Revisa la sección "Jobs losing margin" abajo.</p>
        </div>
      )}

      {/* Insights */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">psychology</span>
          AI Business Insights
        </h2>

        {insights.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">psychology</span>
            <p>Completa más trabajos para generar insights personalizados.</p>
            <p className="text-xs mt-1">Necesitas al menos 3 trabajos completados por categoría.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const style = COLORS[insight.type];
              return (
                <div key={i} className={`${style.bg} ${style.border} border rounded-xl p-4 space-y-2`}>
                  <div className="flex items-start gap-3">
                    <span className={`material-symbols-outlined ${style.icon} text-2xl shrink-0 mt-0.5`}>
                      {ICONS[insight.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className={`${style.text} font-bold text-base`}>{insight.title}</h3>
                      <p className={`${style.text} text-sm mt-0.5`}>{insight.description}</p>
                      {insight.data && (
                        <div className="mt-2 text-xs font-mono text-gray-500">
                          {Object.entries(insight.data).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-gray-400">{k}:</span>
                              <span>{typeof v === 'number' ? v.toFixed(1) : v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${style.icon.replace('text-', 'bg-')}`}
                            style={{ width: `${insight.confidencePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {insight.confidencePct}% confianza
                        </span>
                      </div>
                      {insight.action && (
                        <button
                          onClick={insight.action.onClick}
                          className={`mt-2 px-3 py-1 text-xs font-bold rounded-lg ${style.icon.replace('text-', 'bg-')} text-white hover:opacity-90 transition-opacity`}
                        >
                          {insight.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top/Bottom Margin Jobs */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-sm">trending_up</span>
              Mejores márgenes
            </h4>
            <p className="text-emerald-700 text-sm">Tus trabajos de plomería de emergencia tienen margen promedio 42%.</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <h4 className="font-bold text-rose-800 mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-rose-600 text-sm">trending_down</span>
              Trabajos perdiendo margen
            </h4>
            <p className="text-rose-700 text-sm">3 trabajos de pintura interior con margen <15%. Revisa estimación de horas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};