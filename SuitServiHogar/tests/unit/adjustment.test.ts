import { describe, it, expect } from 'vitest';
import { validExtraAmountMxn, adjustTotals, MIN_EXTRA_PESOS } from '../../src/lib/adjustment';

describe('adjustment (ajuste in-situ req #44)', () => {
  it('valida el monto adicional en pesos', () => {
    expect(MIN_EXTRA_PESOS).toBe(10);
    expect(validExtraAmountMxn(10)).toBe(true);
    expect(validExtraAmountMxn(300)).toBe(true);
    expect(validExtraAmountMxn(9)).toBe(false);
    expect(validExtraAmountMxn(300.5)).toBe(false);
    expect(validExtraAmountMxn('300')).toBe(false);
    expect(validExtraAmountMxn(-50)).toBe(false);
    expect(validExtraAmountMxn(NaN)).toBe(false);
  });

  it('suma el extra al total MXN y al USD con la tasa de la orden', () => {
    const r = adjustTotals({ total_mxn: 850, total_usd: 47.22, exchange_rate: 18 }, 300);
    expect(r.agreedMxn).toBe(1150);
    expect(r.totalUsd).toBeCloseTo(63.89, 2); // 47.22 + 300/18
  });

  it('rate faltante cae a 18 (default del proyecto)', () => {
    const r = adjustTotals({ total_mxn: 850, total_usd: 47.22 }, 180);
    expect(r.agreedMxn).toBe(1030);
    expect(r.totalUsd).toBeCloseTo(57.22, 2); // 47.22 + 10
  });

  it('coacciona montos string de Supabase (NUMERIC → string)', () => {
    const r = adjustTotals({ total_mxn: '850', total_usd: '47.22', exchange_rate: 18 }, 150);
    expect(r.agreedMxn).toBe(1000);
    expect(r.totalUsd).toBeCloseTo(55.55, 2); // 47.22 + 8.333 → 55.55
  });
});
