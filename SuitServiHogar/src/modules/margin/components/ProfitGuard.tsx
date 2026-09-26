import React from 'react';
import { EstimateResult, ProfitCheck } from '../services/pricingEngine';
import { formatPrice } from '../../../lib/constants';

interface ProfitGuardProps {
  chosenPriceMxn: number;
  result: EstimateResult;
  check: ProfitCheck;
  targetMarginPct: number;
  recommendedPriceMxn: number;
}

/** PRD #13 — el usuario conserva el control; la alerta informa, no bloquea. */
export const ProfitGuard: React.FC<ProfitGuardProps> = ({
  chosenPriceMxn,
  result,
  check,
  targetMarginPct,
  recommendedPriceMxn,
}) => {
  if (!check.belowTarget && !check.belowMinimum) {
    return (
      <div className="rounded-xl border border-emerald-safe-bg bg-emerald-safe-bg/40 p-4 flex items-start gap-2">
        <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
        <div>
          <p className="text-label-md font-bold text-text-primary">Precio saludable</p>
          <p className="text-body-sm text-text-muted">
            Margen estimado {check.marginPct.toFixed(1)}% (objetivo {targetMarginPct}%).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-error/40 bg-error/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-error text-[20px]">warning</span>
        <div>
          <p className="text-label-md font-bold text-error">Profit Warning</p>
          <p className="text-body-sm text-text-primary">
            {check.belowMinimum
              ? 'Este precio no cubre tu costo estimado. Estarías trabajando en pérdida.'
              : 'Este precio está por debajo de tu margen objetivo.'}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-body-sm">
        <div className="flex justify-between"><dt className="text-text-muted">Revenue</dt><dd className="font-semibold text-text-primary">{formatPrice(chosenPriceMxn)}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Costo</dt><dd className="font-semibold text-text-primary">{formatPrice(result.estimatedCostMxn)}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Utilidad</dt><dd className={`font-semibold ${check.profitMxn < 0 ? 'text-error' : 'text-text-primary'}`}>{formatPrice(check.profitMxn)}</dd></div>
        <div className="flex justify-between"><dt className="text-text-muted">Margen</dt><dd className="font-semibold text-text-primary">{check.marginPct.toFixed(1)}%</dd></div>
      </dl>

      <p className="text-body-sm text-text-primary">
        {check.protectedMxn > 0
          ? `Bajar ${formatPrice(check.protectedMxn)} dejaría tu margen muy por debajo del objetivo de ${targetMarginPct}%. Precio recomendado: ${formatPrice(recommendedPriceMxn)}.`
          : `Margen objetivo: ${targetMarginPct}%. Precio recomendado: ${formatPrice(recommendedPriceMxn)}.`}
      </p>
    </div>
  );
};
