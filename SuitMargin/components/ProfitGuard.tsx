// SuitMargin - Profit Guard Component
// Alerta visual cuando el técnico intenta poner un precio bajo

import React from 'react';
import { checkProfitGuard, ProfitGuardResult, formatPrice } from '../services/pricingEngine';

interface ProfitGuardProps {
  proposedPrice: number;
  estimate: ReturnType<typeof import('../services/pricingEngine').calculateEstimate>;
  onPriceChange?: (price: number) => void;
}

export const ProfitGuard: React.FC<ProfitGuardProps> = ({
  proposedPrice,
  estimate,
  onPriceChange,
}) => {
  const result = checkProfitGuard(proposedPrice, estimate);

  if (result.safe) return null;

  const { details } = result!;

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
        <h3 className="text-amber-800 font-bold text-lg">{result.message}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-amber-700 font-medium">Tu precio</p>
          <p className="text-xl font-bold text-red-600">{formatPrice(details!.proposedPrice)}</p>
          <p className="text-xs text-amber-600">Margen: {details!.estimatedMarginPct}%</p>
        </div>
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-amber-700 font-medium">Mínimo seguro</p>
          <p className="text-xl font-bold text-emerald-600">{formatPrice(details!.minimumPrice)}</p>
          <p className="text-xs text-amber-600">Margen objetivo: {details!.targetMarginPct}%</p>
        </div>
      </div>

      <div className="bg-white/70 rounded-lg p-3 text-sm space-y-1">
        <p className="font-medium text-amber-800">Desglose del costo real:</p>
        <div className="flex justify-between text-xs">
          <span>Costo estimado</span>
          <span className="font-mono">{formatPrice(details!.estimatedCost)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Ganancia con tu precio</span>
          <span className="font-mono text-red-600">{formatPrice(details!.estimatedProfit)}</span>
        </div>
      </div>

      {onPriceChange && (
        <button
          onClick={() => onPriceChange(details!.recommendedPrice)}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
        >
          Usar precio recomendado: {formatPrice(details!.recommendedPrice)}
        </button>
      )}
    </div>
  );
};