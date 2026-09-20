// SuitMargin - Pricing Engine (Core)
// Separación obligatoria: IA interpreta, motor matemático calcula

export interface BusinessConfig {
  laborCostPerHour: number;
  targetMarginPct: number;
  minimumJobPrice: number;
  travelFee: number;
  taxPct: number;
  overheadPct: number;
}

export interface EstimateInputs {
  laborHours: number;
  materialsCost: number;
  materialMarkupPct: number;
  travelCost: number;
  equipmentCost: number;
}

export interface PriceBreakdown {
  labor: { hours: number; cost: number };
  materials: { base: number; markup: number; total: number };
  travel: number;
  equipment: number;
  overhead: number;
  tax: number;
  totalEstimatedCost: number;
}

export interface PriceOutput {
  breakdown: PriceBreakdown;
  minimumPrice: number;
  recommendedPrice: number;
  premiumPrice: number;
  estimatedProfit: number;
  estimatedMarginPct: number;
}

/**
 * Motor de precios central - NUNCA dejar que la IA determine precio final
 * calculateEstimate() es la única función que calcula precios
 */
export function calculateEstimate(
  config: BusinessConfig,
  inputs: EstimateInputs
): PriceOutput {
  const {
    laborCostPerHour,
    targetMarginPct,
    minimumJobPrice,
    travelFee,
    taxPct,
    overheadPct,
  } = config;

  const {
    laborHours,
    materialsCost,
    materialMarkupPct,
    travelCost,
    equipmentCost,
  } = inputs;

  // LABOR
  const laborCost = laborHours * laborCostPerHour;

  // MATERIALS
  const materialsMarkup = materialsCost * (materialMarkupPct / 100);
  const materialsTotal = materialsCost + materialsMarkup;

  // TRAVEL (usa el mayor entre calculado y fee mínimo)
  const travel = Math.max(travelCost, travelFee);

  // SUBTOTAL antes de overhead/tax
  const subtotal = laborCost + materialsTotal + travel + equipmentCost;

  // OVERHEAD
  const overhead = subtotal * (overheadPct / 100);

  // TAX (sobre subtotal + overhead)
  const taxableBase = subtotal + overhead;
  const tax = taxableBase * (taxPct / 100);

  // TOTAL ESTIMATED COST
  const totalEstimatedCost = subtotal + overhead + tax;

  // PRICES
  const minimumPrice = Math.max(totalEstimatedCost / (1 - targetMarginPct / 100), minimumJobPrice);
  const recommendedPrice = totalEstimatedCost / (1 - targetMarginPct / 100);
  const premiumPrice = recommendedPrice * 1.15; // 15% premium

  const estimatedProfit = recommendedPrice - totalEstimatedCost;
  const estimatedMarginPct = (estimatedProfit / recommendedPrice) * 100;

  return {
    breakdown: {
      labor: { hours: laborHours, cost: laborCost },
      materials: { base: materialsCost, markup: materialsMarkup, total: materialsTotal },
      travel,
      equipment: equipmentCost,
      overhead,
      tax,
      totalEstimatedCost,
    },
    minimumPrice: Math.round(minimumPrice * 100) / 100,
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    premiumPrice: Math.round(premiumPrice * 100) / 100,
    estimatedProfit: Math.round(estimatedProfit * 100) / 100,
    estimatedMarginPct: Math.round(estimatedMarginPct * 100) / 100,
  };
}

/**
 * Validación de Profit Guard
 * Retorna alerta si el precio propuesto está por debajo del mínimo
 */
export interface ProfitGuardResult {
  safe: boolean;
  message?: string;
  details?: {
    proposedPrice: number;
    minimumPrice: number;
    recommendedPrice: number;
    estimatedCost: number;
    estimatedProfit: number;
    estimatedMarginPct: number;
    targetMarginPct: number;
  };
}

export function checkProfitGuard(
  proposedPrice: number,
  estimate: PriceOutput
): ProfitGuardResult {
  if (proposedPrice >= estimate.minimumPrice) {
    return { safe: true };
  }

  const shortfall = estimate.minimumPrice - proposedPrice;
  const proposedMargin = ((proposedPrice - estimate.breakdown.totalEstimatedCost) / proposedPrice) * 100;

  return {
    safe: false,
    message: `⚠️ Profit Warning: Este precio está $${shortfall.toFixed(2)} por debajo de tu mínimo.`,
    details: {
      proposedPrice,
      minimumPrice: estimate.minimumPrice,
      recommendedPrice: estimate.recommendedPrice,
      estimatedCost: estimate.breakdown.totalEstimatedCost,
      estimatedProfit: proposedPrice - estimate.breakdown.totalEstimatedCost,
      estimatedMarginPct: Math.round(proposedMargin * 100) / 100,
      targetMarginPct: estimate.breakdown.totalEstimatedCost > 0
        ? Math.round(((estimate.recommendedPrice - estimate.breakdown.totalEstimatedCost) / estimate.recommendedPrice) * 100 * 100) / 100
        : 0,
    },
  };
}

/**
 * Formateo para mostrar en UI
 */
export function formatPrice(price: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}