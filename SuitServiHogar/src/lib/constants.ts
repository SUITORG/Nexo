export const COLONIAS_REYNOSA = [
  'Las Fuentes',
  'Las Cumbres',
  'Jarachina Norte',
  'Jarachina Sur',
  'Ribereña',
  'Del Prado',
  'Hidalgo',
  'Petrolera',
  'Aztlán',
  'Cañada',
  'Villa Florida',
  'Sector Maquiladoras Puente Pharr'
] as const;

export const EXCHANGE_RATE_MXN_USD = 18.0; // fallback inicial

export { getRateSync, getRate as fetchExchangeRate, clearRateCache } from '../services/exchangeRate';

export function formatPrice(mxn: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(mxn);
}
