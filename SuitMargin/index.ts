// SuitMargin - Main Exports
// SaaS de Inteligencia de Precios para técnicos

// Services
export * from './services/pricingEngine';
export * from './services/aiAnalysis';
export * from './services/learningLoop';

// Components
export { ProfitGuard } from './components/ProfitGuard';
export { QuoteGenerator } from './components/QuoteGenerator';
export { InsightsDashboard } from './components/InsightsDashboard';

// Types
export type {
  BusinessConfig,
  EstimateInputs,
  PriceBreakdown,
  PriceOutput,
  ProfitGuardResult,
  JobAnalysisInput,
  JobAnalysisOutput,
  SmartQuestion,
  LearningDataPoint,
  JobComparison,
  Insight,
} from './services/pricingEngine';

export type {
  JobAnalysisInput as AIJobAnalysisInput,
  JobAnalysisOutput as AIJobAnalysisOutput,
  SmartQuestion as AISmartQuestion,
} from './services/aiAnalysis';

export type {
  LearningDataPoint as LearningDataPointType,
  JobComparison as JobComparisonType,
} from './services/learningLoop';

export type {
  QuoteData as QuoteDataType,
} from './components/QuoteGenerator';

export type {
  Insight as InsightType,
} from './components/InsightsDashboard';

// Database schema path
export const SCHEMA_PATH = './db/schema.sql';

// Version
export const SUITMARGIN_VERSION = '0.1.0';