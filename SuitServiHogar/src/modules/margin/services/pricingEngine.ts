// Pricing Engine central — PRD #11/#12/#29.
// REGLA: la IA solo interpreta. Todo precio pasa por aquí. Nunca el LLM fija precios.

export interface EstimateInput {
  laborHours: number;
  laborCostPerHour: number;
  materialsMxn: number;
  materialMarkupPct: number;
  travelMxn: number;
  equipmentMxn: number;
  overheadPct: number;
  taxPct: number;
  targetMarginPct: number;
  minimumJobPriceMxn: number;
}

export interface EstimateResult {
  laborMxn: number;
  materialsMxn: number;
  travelMxn: number;
  equipmentMxn: number;
  overheadMxn: number;
  estimatedCostMxn: number;
  minimumPriceMxn: number;
  recommendedPriceMxn: number;
  premiumPriceMxn: number;
  recommendedWithTaxMxn: number;
  estimatedProfitMxn: number;
  estimatedMarginPct: number;
}

export const DEFAULT_ESTIMATE_INPUT: EstimateInput = {
  laborHours: 0,
  laborCostPerHour: 350,
  materialsMxn: 0,
  materialMarkupPct: 20,
  travelMxn: 0,
  equipmentMxn: 0,
  overheadPct: 15,
  taxPct: 16,
  targetMarginPct: 30,
  minimumJobPriceMxn: 500,
};

const PREMIUM_UPLIFT = 0.18; // ponytail: fijo 18%, mover a sh_config si clientes piden ajustarlo

const round2 = (n: number) => Math.round(n * 100) / 100;

const num = (v: unknown, min = 0) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return n < min ? min : n;
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function calculateEstimate(input: Partial<EstimateInput>): EstimateResult {
  const i = { ...DEFAULT_ESTIMATE_INPUT, ...input };

  const laborHours = num(i.laborHours);
  const laborCostPerHour = num(i.laborCostPerHour);
  const materials = num(i.materialsMxn) * (1 + clamp(num(i.materialMarkupPct), 0, 1000) / 100);
  const travel = num(i.travelMxn);
  const equipment = num(i.equipmentMxn);

  const labor = laborHours * laborCostPerHour;
  const baseCost = labor + materials + travel + equipment;
  const overhead = baseCost * clamp(num(i.overheadPct), 0, 500) / 100;
  const estimatedCost = round2(baseCost + overhead);

  const targetMargin = clamp(num(i.targetMarginPct, 1), 1, 95);
  const recommended = round2(estimatedCost / (1 - targetMargin / 100));
  const minimum = round2(Math.max(num(i.minimumJobPriceMxn), estimatedCost));
  const premium = round2(recommended * (1 + PREMIUM_UPLIFT));
  const profit = round2(recommended - estimatedCost);
  const marginPct = recommended > 0 ? round2((profit / recommended) * 100) : 0;

  return {
    laborMxn: round2(labor),
    materialsMxn: round2(materials),
    travelMxn: round2(travel),
    equipmentMxn: round2(equipment),
    overheadMxn: round2(overhead),
    estimatedCostMxn: estimatedCost,
    minimumPriceMxn: minimum,
    recommendedPriceMxn: recommended,
    premiumPriceMxn: premium,
    recommendedWithTaxMxn: round2(recommended * (1 + clamp(num(i.taxPct), 0, 100) / 100)),
    estimatedProfitMxn: profit,
    estimatedMarginPct: marginPct,
  };
}

export interface ProfitCheck {
  belowTarget: boolean;
  belowMinimum: boolean;
  profitMxn: number;
  marginPct: number;
  protectedMxn: number;
}

/** PRD #13 Profit Guard: compara el precio elegido contra costo y margen objetivo. */
export function checkProfit(priceMxn: number, result: EstimateResult, targetMarginPct: number): ProfitCheck {
  const price = num(priceMxn);
  const profit = round2(price - result.estimatedCostMxn);
  const marginPct = price > 0 ? round2((profit / price) * 100) : 0;
  const target = clamp(num(targetMarginPct, 1), 1, 95);
  return {
    belowMinimum: price < result.minimumPriceMxn,
    belowTarget: marginPct < target,
    profitMxn: profit,
    marginPct,
    protectedMxn: round2(Math.max(0, result.recommendedPriceMxn - price)),
  };
}
