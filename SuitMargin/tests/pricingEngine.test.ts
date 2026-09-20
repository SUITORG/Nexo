// SuitMargin - Tests para Pricing Engine
// Verifica cálculos de margen, precios y Profit Guard

import { describe, it, expect } from 'vitest';
import { calculateEstimate, checkProfitGuard, formatPrice } from '../services/pricingEngine';

const defaultConfig = {
  laborCostPerHour: 80,
  targetMarginPct: 30,
  minimumJobPrice: 500,
  travelFee: 150,
  taxPct: 16,
  overheadPct: 10,
};

describe('Pricing Engine', () => {
  it('calcula estimate básico correctamente', () => {
    const inputs = {
      laborHours: 4,
      materialsCost: 1200,
      materialMarkupPct: 20,
      travelCost: 100,
      equipmentCost: 200,
    };

    const result = calculateEstimate(defaultConfig, inputs);

    // Labor: 4 * 80 = 320
    // Materials: 1200 + 240 = 1440
    // Travel: max(100, 150) = 150
    // Equipment: 200
    // Subtotal: 320 + 1440 + 150 + 200 = 2110
    // Overhead: 2110 * 0.10 = 211
    // Taxable: 2110 + 211 = 2321
    // Tax: 2321 * 0.16 = 371.36
    // Total Cost: 2110 + 211 + 371.36 = 2692.36

    expect(result.breakdown.labor.cost).toBe(320);
    expect(result.breakdown.materials.total).toBe(1440);
    expect(result.breakdown.travel).toBe(150);
    expect(result.breakdown.equipment).toBe(200);
    expect(result.breakdown.overhead).toBe(211);
    expect(result.breakdown.tax).toBeCloseTo(371.36, 1);
    expect(result.breakdown.totalEstimatedCost).toBeCloseTo(2692.36, 1);

    // Precios con margen 30%
    // Recommended = 2692.36 / 0.7 = 3846.23
    expect(result.recommendedPrice).toBeCloseTo(3846.23, 1);
    expect(result.minimumPrice).toBeCloseTo(3846.23, 1); // > minimumJobPrice
    expect(result.premiumPrice).toBeCloseTo(3846.23 * 1.15, 1);
    expect(result.estimatedMarginPct).toBeCloseTo(30, 1);
  });

  it('aplica minimumJobPrice cuando el cálculo da menor', () => {
    const config = { ...defaultConfig, minimumJobPrice: 5000 };
    const inputs = {
      laborHours: 1,
      materialsCost: 100,
      materialMarkupPct: 10,
      travelCost: 50,
      equipmentCost: 0,
    };

    const result = calculateEstimate(config, inputs);

    // Costos bajos, pero mínimo fuerza precio alto
    expect(result.minimumPrice).toBe(5000);
    expect(result.recommendedPrice).toBeGreaterThanOrEqual(5000);
  });

  it('usa travelFee mínimo cuando travelCost es menor', () => {
    const inputs = {
      laborHours: 2,
      materialsCost: 500,
      materialMarkupPct: 20,
      travelCost: 50, // menor que travelFee (150)
      equipmentCost: 0,
    };

    const result = calculateEstimate(defaultConfig, inputs);
    expect(result.breakdown.travel).toBe(150); // travelFee
  });

  it('Profit Guard detecta precio bajo', () => {
    const inputs = {
      laborHours: 4,
      materialsCost: 1200,
      materialMarkupPct: 20,
      travelCost: 100,
      equipmentCost: 200,
    };

    const estimate = calculateEstimate(defaultConfig, inputs);
    const guard = checkProfitGuard(3000, estimate); // 3000 < minimum ~3846

    expect(guard.safe).toBe(false);
    expect(guard.message).toContain('Profit Warning');
    expect(guard.details?.proposedPrice).toBe(3000);
    expect(guard.details?.minimumPrice).toBeCloseTo(estimate.minimumPrice, 1);
  });

  it('Profit Guard permite precio igual o mayor al mínimo', () => {
    const inputs = {
      laborHours: 4,
      materialsCost: 1200,
      materialMarkupPct: 20,
      travelCost: 100,
      equipmentCost: 200,
    };

    const estimate = calculateEstimate(defaultConfig, inputs);
    const guard = checkProfitGuard(estimate.recommendedPrice, estimate);

    expect(guard.safe).toBe(true);
  });

  it('formatPrice formatea MXN correctamente', () => {
    expect(formatPrice(1500)).toBe('$1,500.00');
    expect(formatPrice(1500.5)).toBe('$1,500.50');
    expect(formatPrice(1000000)).toBe('$1,000,000.00');
  });

  it('maneja costos cero', () => {
    const inputs = {
      laborHours: 0,
      materialsCost: 0,
      materialMarkupPct: 0,
      travelCost: 0,
      equipmentCost: 0,
    };

    const config = { ...defaultConfig, minimumJobPrice: 500 };
    const result = calculateEstimate(config, inputs);

    // Solo overhead y tax sobre 0 = 0, pero minimumJobPrice fuerza 500
    expect(result.breakdown.totalEstimatedCost).toBe(0);
    expect(result.minimumPrice).toBe(500);
  });
});