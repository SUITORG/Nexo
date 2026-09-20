// tests/unit/simple.test.ts
// Simple passing tests to verify test infrastructure works

import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
  it('vitest runs', () => {
    expect(true).toBe(true);
  });

  it('basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('string operations', () => {
    expect('hola'.toUpperCase()).toBe('HOLA');
  });
});

describe('Constants', () => {
  it('EXCHANGE_RATE_MXN_USD exists', async () => {
    const { EXCHANGE_RATE_MXN_USD } = await import('@/lib/constants');
    expect(typeof EXCHANGE_RATE_MXN_USD).toBe('number');
    expect(EXCHANGE_RATE_MXN_USD).toBeGreaterThan(0);
  });
});

describe('Exchange Rate Service', () => {
  it('fetchRealRate returns fallback when no API key', async () => {
    const { fetchRealRate } = await import('@/services/exchangeRate');
    const rate = await fetchRealRate();
    expect(rate).toBe(18.0);
  });

  it('getRate caches result', async () => {
    const { getRate, clearRateCache } = await import('@/services/exchangeRate');
    clearRateCache();
    const rate1 = await getRate();
    const rate2 = await getRate();
    expect(rate1).toBe(rate2);
  });
});