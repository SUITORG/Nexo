// SuitMargin - Quote Generator Component
// Genera cotización profesional web + PDF

import React from 'react';
import { formatPrice } from '../services/pricingEngine';

interface QuoteData {
  business: {
    name: string;
    logo?: string;
    phone: string;
    email: string;
    address: string;
    category: string;
  };
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  job: {
    title: string;
    description: string;
    address: string;
    timelineDays: number;
  };
  estimate: {
    breakdown: any;
    minimumPrice: number;
    recommendedPrice: number;
    premiumPrice: number;
    estimatedMarginPct: number;
  };
  scopeOfWork: string;
  includedMaterials: string[];
  exclusions: string[];
  terms: string;
  quoteId: string;
  expiresAt: string;
}

export const QuoteGenerator: React.FC<{
  data: QuoteData;
  onAccept?: () => void;
  onDecline?: () => void;
  mode?: 'view' | 'edit' | 'public';
}> = ({ data, onAccept, onDecline, mode = 'view' }) => {
  const { business, customer, job, estimate, scopeOfWork, includedMaterials, exclusions, terms, quoteId, expiresAt } = data;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-6 space-y-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 pb-4">
        <div>
          {business.logo && <img src={business.logo} alt={business.name} className="h-12 w-auto mb-2" />}
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-600 text-sm">{business.category} • {business.phone} • {business.email}</p>
          <p className="text-gray-500 text-xs mt-1">{business.address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Cotización</p>
          <p className="font-mono text-sm text-gray-900">#{quoteId.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-1">Expira: {new Date(expiresAt).toLocaleDateString('es-MX')}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-900">Cliente</p>
          <p>{customer.name}</p>
          <p className="text-gray-600">{customer.phone}</p>
          {customer.email && <p className="text-gray-600">{customer.email}</p>}
          <p className="text-gray-600">{customer.address}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-gray-900">Servicio</p>
          <p className="font-medium">{job.title}</p>
          <p className="text-gray-600">{job.address}</p>
          <p className="text-gray-600">{job.timelineDays} días estimados</p>
        </div>
      </div>

      {/* Scope of Work */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">Alcance del Trabajo</h3>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{scopeOfWork}</div>
      </div>

      {/* Materials */}
      {(includedMaterials.length > 0 || exclusions.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {includedMaterials.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Materiales Incluidos
              </h4>
              <ul className="text-sm space-y-1">
                {includedMaterials.map((m, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-emerald-600 text-xs">check</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exclusions.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <h4 className="font-medium text-rose-800 mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">block</span>
                Exclusiones
              </h4>
              <ul className="text-sm space-y-1">
                {exclusions.map((e, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-rose-600 text-xs">close</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Price Options */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Opciones de Precio</h3>
        <p className="text-sm text-gray-600">AI Estimate — Ajustable manualmente</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mínimo', price: estimate.minimumPrice, color: 'amber', desc: 'Protege tu margen', icon: 'shield' },
            { label: 'Recomendado', price: estimate.recommendedPrice, color: 'emerald', desc: `Margen ${estimate.estimatedMarginPct}%`, icon: 'star', featured: true },
            { label: 'Premium', price: estimate.premiumPrice, color: 'blue', desc: 'Incluye extras', icon: 'diamond' },
          ].map((opt, i) => (
            <div
              key={i}
              className={`relative rounded-xl p-4 text-center transition-all ${
                opt.featured ? 'ring-2 ring-emerald-500 scale-105 z-10' : ''
              } bg-white border ${
                opt.color === 'amber' ? 'border-amber-300' :
                opt.color === 'emerald' ? 'border-emerald-300' : 'border-blue-300'
              }`}
            >
              {opt.featured && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                  RECOMENDADO
                </span>
              )}
              <span className="material-symbols-outlined text-2xl text-gray-400 mb-2 block">{opt.icon}</span>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{opt.label}</p>
              <p className="text-2xl font-bold text-gray-900 my-1">{formatPrice(opt.price)}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </div>
          ))}
        </div>

        {/* Cost Breakdown */}
        <details className="group border-t border-gray-200 pt-4">
          <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-700">
            <span>Ver desglose de costos</span>
            <span className="material-symbols-outlined text-gray-400 transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ['Mano de obra', formatPrice(estimate.breakdown.labor.cost), `${estimate.breakdown.labor.hours} hrs`],
              ['Materiales', formatPrice(estimate.breakdown.materials.total), `(base: ${formatPrice(estimate.breakdown.materials.base)} + markup: ${formatPrice(estimate.breakdown.materials.markup)})`],
              ['Traslado', formatPrice(estimate.breakdown.travel), ''],
              ['Equipo', formatPrice(estimate.breakdown.equipment), ''],
              ['Gastos generales', formatPrice(estimate.breakdown.overhead), `${estimate.breakdown.overhead > 0 ? '10%' : '0%'}`],
              ['Impuestos', formatPrice(estimate.breakdown.tax), '16% IVA'],
            ].map(([label, value, detail], i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium">{label}</span>
                  {detail && <span className="text-gray-500 ml-2 text-xs">{detail}</span>}
                </div>
                <span className="font-mono font-bold text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-lg">
              <span>Costo Total Estimado</span>
              <span className="font-mono">{formatPrice(estimate.breakdown.totalEstimatedCost)}</span>
            </div>
          </div>
        </details>
      </div>

      {/* Terms */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-medium text-gray-900 mb-2">Términos y Condiciones</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{terms}</p>
      </div>

      {/* Acceptance (public mode) */}
      {mode === 'public' && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onDecline}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
          >
            Aceptar Cotización
          </button>
        </div>
      )}
    </div>
  );
};