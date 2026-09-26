import { describe, it, expect } from 'vitest';
import { calculateEstimate, checkProfit, DEFAULT_ESTIMATE_INPUT } from '@/modules/margin/services/pricingEngine';

const base = {
  laborHours: 12,
  laborCostPerHour: 40,
  materialsMxn: 400,
  materialMarkupPct: 0,
  travelMxn: 50,
  equipmentMxn: 40,
  overheadPct: 10,
  taxPct: 16,
  targetMarginPct: 35,
  minimumJobPriceMxn: 500,
};

describe('pricingEngine.calculateEstimate', () => {
  it('cuadra el ejemplo del PRD (costo ~1070, recomendado ~1650, margen 35%)', () => {
    const r = calculateEstimate(base);
    // 480 (labor) + 400 (materiales) + 50 + 40 = 970 base; overhead 10% = 97 → 1067
    expect(r.estimatedCostMxn).toBe(1067);
    expect(r.recommendedPriceMxn).toBe(1641.54); // 1067 / (1 - 0.35)
    expect(r.estimatedMarginPct).toBeCloseTo(35, 1);
  });

  it('mínimo nunca baja del costo ni del precio mínimo del negocio', () => {
    const r = calculateEstimate({ ...base, minimumJobPriceMxn: 99999, laborHours: 0, materialsMxn: 0 });
    expect(r.minimumPriceMxn).toBe(99999);
    const r2 = calculateEstimate({ ...base, minimumJobPriceMxn: 100 });
    expect(r2.minimumPriceMxn).toBeGreaterThanOrEqual(r2.estimatedCostMxn);
  });

  it('premium >= recomendado', () => {
    const r = calculateEstimate(base);
    expect(r.premiumPriceMxn).toBeGreaterThan(r.recommendedPriceMxn);
  });

  it('entradas basura no producen NaN ni negativos', () => {
    const r = calculateEstimate({
      laborHours: -5,
      laborCostPerHour: NaN,
      materialsMxn: Infinity,
      targetMarginPct: 1000,
      overheadPct: -20,
      taxPct: NaN,
    });
    for (const v of Object.values(r)) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
    expect(r.estimatedCostMxn).toBe(0);
    expect(r.recommendedPriceMxn).toBe(0);
  });

  it('defaults completos', () => {
    const r = calculateEstimate({});
    expect(r.estimatedCostMxn).toBe(calculateEstimate(DEFAULT_ESTIMATE_INPUT).estimatedCostMxn);
  });
});

describe('pricingEngine.checkProfit (Profit Guard)', () => {
  it('marca bajo margen cuando el precio elegido es menor al recomendado', () => {
    const r = calculateEstimate(base);
    const low = checkProfit(r.recommendedPriceMxn * 0.8, r, base.targetMarginPct);
    expect(low.belowTarget).toBe(true);
    expect(low.protectedMxn).toBeGreaterThan(0);
  });

  it('precio recomendado no dispara la alerta', () => {
    const r = calculateEstimate(base);
    const ok = checkProfit(r.recommendedPriceMxn, r, base.targetMarginPct);
    expect(ok.belowTarget).toBe(false);
    expect(ok.belowMinimum).toBe(false);
  });

  it('precio por debajo del costo marca belowMinimum', () => {
    const r = calculateEstimate(base);
    const bad = checkProfit(1, r, base.targetMarginPct);
    expect(bad.belowMinimum).toBe(true);
    expect(bad.profitMxn).toBeLessThan(0);
  });
});
