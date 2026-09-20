// SuitMargin - Estimated vs Actual + AI Learning Loop
// Compara estimado vs real y mejora futuras recomendaciones

import { calculateEstimate, PriceOutput } from './pricingEngine';

export interface JobComparison {
  jobId: string;
  category: string;
  estimated: PriceOutput;
  actual: {
    hours: number;
    materialCost: number;
    additionalExpenses: number;
    revenue: number;
  };
  variance: {
    hoursPct: number;
    materialsPct: number;
    costPct: number;
    marginPct: number;
  };
  insights: string[];
}

export interface LearningDataPoint {
  category: string;
  estimatedHours: number;
  actualHours: number;
  estimatedMaterials: number;
  actualMaterials: number;
  timestamp: number;
}

/**
 * Compara estimado vs real para un trabajo completado
 */
export function compareEstimatedVsActual(
  estimated: PriceOutput,
  actual: JobComparison['actual']
): JobComparison['variance'] & { insights: string[] } {
  const estimatedCost = estimated.breakdown.totalEstimatedCost;
  const estimatedHours = estimated.breakdown.labor.hours;
  const estimatedMaterials = estimated.breakdown.materials.total;

  const actualCost = actual.hours * (estimated.breakdown.labor.cost / estimatedHours) +
                     actual.materialCost +
                     actual.additionalExpenses;

  const hoursVariance = ((actual.hours - estimatedHours) / estimatedHours) * 100;
  const materialsVariance = ((actual.materialCost - estimatedMaterials) / estimatedMaterials) * 100;
  const costVariance = ((actualCost - estimatedCost) / estimatedCost) * 100;
  const actualMargin = ((actual.revenue - actualCost) / actual.revenue) * 100;
  const estimatedMargin = estimated.estimatedMarginPct;
  const marginVariance = actualMargin - estimatedMargin;

  const insights: string[] = [];

  if (hoursVariance > 20) {
    insights.push(`⏱️ Horas reales ${hoursVariance.toFixed(0)}% sobre lo estimado. Considera aumentar factor de complejidad.`);
  } else if (hoursVariance < -20) {
    insights.push(`⏱️ Terminaste ${Math.abs(hoursVariance).toFixed(0)}% más rápido. Buena eficiencia.`);
  }

  if (materialsVariance > 25) {
    insights.push(`📦 Materiales ${materialsVariance.toFixed(0)}% sobre lo estimado. Revisa cálculo de m²/rendimiento.`);
  } else if (materialsVariance < -25) {
    insights.push(`📦 Materiales ${Math.abs(materialsVariance).toFixed(0)}% bajo lo estimado. Buen aprovechamiento.`);
  }

  if (marginVariance < -10) {
    insights.push(`📉 Margen real ${Math.abs(marginVariance).toFixed(1)}% bajo objetivo. Precio fue muy bajo o costos subestimados.`);
  } else if (marginVariance > 10) {
    insights.push(`📈 Margen real ${marginVariance.toFixed(1)}% sobre objetivo. Excelente pricing.`);
  }

  return {
    hoursPct: Math.round(hoursVariance * 100) / 100,
    materialsPct: Math.round(materialsVariance * 100) / 100,
    costPct: Math.round(costVariance * 100) / 100,
    marginPct: Math.round(marginVariance * 100) / 100,
    insights,
  };
}

/**
 * Genera factores de ajuste basados en historial
 * Retorna multiplicadores para aplicar a futuras estimaciones
 */
export function generateAdjustmentFactors(
  history: LearningDataPoint[],
  category: string
): { hoursMultiplier: number; materialsMultiplier: number; confidence: number } {
  const categoryHistory = history.filter(h => h.category === category);

  if (categoryHistory.length < 3) {
    return { hoursMultiplier: 1.0, materialsMultiplier: 1.0, confidence: 0 };
  }

  // Últimos 10 trabajos de la categoría
  const recent = categoryHistory.slice(-10);

  const avgHoursRatio = recent.reduce((sum, h) => sum + h.actualHours / h.estimatedHours, 0) / recent.length;
  const avgMaterialsRatio = recent.reduce((sum, h) => sum + h.actualMaterials / h.estimatedMaterials, 0) / recent.length;

  // Confianza basada en consistencia (std dev)
  const hoursRatios = recent.map(h => h.actualHours / h.estimatedHours);
  const hoursStdDev = Math.sqrt(
    hoursRatios.reduce((sum, r) => sum + Math.pow(r - avgHoursRatio, 2), 0) / hoursRatios.length
  );
  const confidence = Math.max(0, 1 - hoursStdDev);

  return {
    hoursMultiplier: Math.round(avgHoursRatio * 100) / 100,
    materialsMultiplier: Math.round(avgMaterialsRatio * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Aplica factores de aprendizaje a una nueva estimación
 */
export function applyLearningAdjustments(
  baseEstimate: PriceOutput,
  adjustments: { hoursMultiplier: number; materialsMultiplier: number }
): PriceOutput {
  const adjusted = { ...baseEstimate };

  // Ajustar horas de mano de obra
  adjusted.breakdown.labor.hours = Math.round(
    baseEstimate.breakdown.labor.hours * adjustments.hoursMultiplier * 10
  ) / 10;
  adjusted.breakdown.labor.cost = adjusted.breakdown.labor.hours *
    (baseEstimate.breakdown.labor.cost / baseEstimate.breakdown.labor.hours);

  // Ajustar materiales
  adjusted.breakdown.materials.total = baseEstimate.breakdown.materials.total * adjustments.materialsMultiplier;
  adjusted.breakdown.materials.base = baseEstimate.breakdown.materials.base * adjustments.materialsMultiplier;
  adjusted.breakdown.materials.markup = adjusted.breakdown.materials.total - adjusted.breakdown.materials.base;

  // Recalcular totales
  const subtotal = adjusted.breakdown.labor.cost +
                   adjusted.breakdown.materials.total +
                   adjusted.breakdown.travel +
                   adjusted.breakdown.equipment;

  adjusted.breakdown.overhead = subtotal * (adjusted.breakdown.overhead / subtotal);
  const taxableBase = subtotal + adjusted.breakdown.overhead;
  adjusted.breakdown.tax = taxableBase * (adjusted.breakdown.tax / taxableBase);

  adjusted.breakdown.totalEstimatedCost = subtotal + adjusted.breakdown.overhead + adjusted.breakdown.tax;

  // Recalcular precios
  const targetMargin = (baseEstimate.recommendedPrice - baseEstimate.breakdown.totalEstimatedCost) / baseEstimate.recommendedPrice;
  adjusted.recommendedPrice = adjusted.breakdown.totalEstimatedCost / (1 - targetMargin);
  adjusted.minimumPrice = Math.max(adjusted.recommendedPrice, baseEstimate.minimumPrice);
  adjusted.premiumPrice = adjusted.recommendedPrice * 1.15;

  adjusted.estimatedProfit = adjusted.recommendedPrice - adjusted.breakdown.totalEstimatedCost;
  adjusted.estimatedMarginPct = (adjusted.estimatedProfit / adjusted.recommendedPrice) * 100;

  return adjusted;
}

/**
 * Genera mensaje de aprendizaje para mostrar al usuario
 */
export function generateLearningMessage(
  adjustments: { hoursMultiplier: number; materialsMultiplier: number; confidence: number },
  category: string,
  sampleSize: number
): string {
  if (adjustments.confidence < 0.3 || sampleSize < 3) {
    return `Basado en ${sampleSize} trabajos previos de ${category}. Necesitas al menos 3 para ajustes automáticos.`;
  }

  const hoursMsg = adjustments.hoursMultiplier > 1.1
    ? `tus trabajos de ${category} tardan ~${Math.round((adjustments.hoursMultiplier - 1) * 100)}% más de lo estimado`
    : adjustments.hoursMultiplier < 0.9
      ? `terminas ~${Math.round((1 - adjustments.hoursMultiplier) * 100)}% más rápido`
      : 'tus estimaciones de tiempo son precisas';

  const materialsMsg = adjustments.materialsMultiplier > 1.1
    ? `gastas ~${Math.round((adjustments.materialsMultiplier - 1) * 100)}% más en materiales`
    : adjustments.materialsMultiplier < 0.9
      ? `aprovechas bien los materiales (~${Math.round((1 - adjustments.materialsMultiplier) * 100)}% menos)`
      : 'tu cálculo de materiales es preciso';

  return `🧠 IA aprendió: ${hoursMsg} y ${materialsMsg} (confianza: ${Math.round(adjustments.confidence * 100)}%, n=${sampleSize}).`;
}