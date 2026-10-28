// src/lib/adjustment.js — Re-cotización / Ajuste in-situ (req #44)
// Fuente única de la matemática del ajuste. Lo importan server.js (endpoints)
// y los unit tests. Unidad: PESOS (sh_orders.total_mxn es pesos — verificado
// en BD 2026-10-08: 850, total_usd 47.22 = 850/18). Stripe recibe centavos.

export const MIN_EXTRA_PESOS = 10;

export function validExtraAmountMxn(pesos) {
  return Number.isInteger(pesos) && pesos >= MIN_EXTRA_PESOS;
}

// order: { total_mxn, total_usd, exchange_rate } — extra en pesos.
export function adjustTotals(order, extraPesos) {
  const agreedMxn = Math.round(Number(order.total_mxn) + extraPesos);
  const rate = Number(order.exchange_rate) || 18;
  const totalUsd = Math.round(((Number(order.total_usd) || 0) + extraPesos / rate) * 100) / 100;
  return { agreedMxn, totalUsd };
}
