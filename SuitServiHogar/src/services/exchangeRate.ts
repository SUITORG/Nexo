const FIXER_KEY = import.meta.env.VITE_FIXER_KEY;
const BASE = 'MXN';
const SYMBOLS = 'USD';
const CACHE_TTL = 3_600_000; // 1 hora

export async function fetchRealRate(): Promise<number> {
  if (!FIXER_KEY) return 18.0;
  try {
    const res = await fetch(`https://data.fixer.io/api/latest?access_key=${FIXER_KEY}&base=${BASE}&symbols=${SYMBOLS}`);
    const data = await res.json();
    if (data.success && data.rates?.USD) return data.rates.USD;
  } catch {}
  return 18.0;
}

export async function getRate(): Promise<number> {
  const cached = localStorage.getItem('fx_rate');
  const ts = Number(localStorage.getItem('fx_ts') || 0);
  if (cached && Date.now() - ts < CACHE_TTL) return Number(cached);
  
  const rate = await fetchRealRate();
  localStorage.setItem('fx_rate', String(rate));
  localStorage.setItem('fx_ts', String(Date.now()));
  return rate;
}

/**
 * Versión sincrónica: lee del cache localStorage.
 * Úsala en render sync (JSX, cálculos inmediatos).
 * Primera carga será 18.0 hasta que getRate() complete.
 */
export function getRateSync(): number {
  const cached = localStorage.getItem('fx_rate');
  const ts = Number(localStorage.getItem('fx_ts') || 0);
  if (cached && Date.now() - ts < CACHE_TTL) return Number(cached);
  return 18.0;
}

export function clearRateCache() {
  localStorage.removeItem('fx_rate');
  localStorage.removeItem('fx_ts');
}