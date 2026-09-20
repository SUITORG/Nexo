# SuitMargin — Inteligencia de Precios para Técnicos

SaaS B2B para técnicos de servicios del hogar (plomeros, electricistas, pintores, HVAC, etc.) que necesitan cotizar rentablemente.

**Core Value:** *"Ayudarte a saber cuánto cobrar antes de aceptar un trabajo."*

---

## Arquitectura

```
SuitMargin/
├── services/
│   ├── pricingEngine.ts      # Motor matemático central (calculateEstimate, Profit Guard)
│   ├── aiAnalysis.ts         # IA: analiza trabajo + genera preguntas inteligentes (máx 5)
│   └── learningLoop.ts       # Estimado vs Real + factores de ajuste automáticos
├── components/
│   ├── ProfitGuard.tsx       # Alerta visual si precio < mínimo
│   ├── QuoteGenerator.tsx    # Cotización web/PDF + enlace público
│   └── InsightsDashboard.tsx # AI Business Insights + KPIs
├── db/
│   └── schema.sql            # Multi-tenant: sm_businesses, sm_jobs, sm_estimates, sm_quotes, sm_job_results, sm_ai_insights
├── tests/
│   └── pricingEngine.test.ts # Vitest: márgenes, precios, Profit Guard
└── index.ts                  # Exports principales
```

---

## Separación Obligatoria (Regla de Oro)

> **La IA interpreta, el motor matemático calcula.**

| IA (`aiAnalysis.ts`) | Motor (`pricingEngine.ts`) |
|---|---|
| Clasifica tipo de trabajo | Calcula costos mano de obra |
| Detecta dimensiones | Calcula materiales + markup |
| Identifica riesgos | Aplica overhead + tax |
| Genera preguntas (máx 5) | Calcula 3 precios: Mín/Rec/Prem |
| Detecta info faltante | Profit Guard (alerta margen) |

**Nunca** dejar que el LLM determine precio final sin pasar por `calculateEstimate()`.

---

## Flujo Principal

```
1. Técnico crea Job (título, descripción, fotos)
       ↓
2. AI analiza → jobType, complejidad, materiales, preguntas (≤5)
       ↓
3. Técnico responde preguntas → complete inputs
       ↓
4. Pricing Engine calcula:
   - Breakdown: labor, materiales, viaje, equipo, overhead, tax
   - 3 precios: Mínimo (protege margen), Recomendado (margen objetivo), Premium (+15%)
   - Profit Guard: alerta si técnico edita precio < mínimo
       ↓
5. Quote Generator → Scope of Work + 3 precios + PDF + enlace público /quote/{id}
       ↓
6. Cliente ve/acepta/rechaza → tracked (viewed_at, accepted_at)
       ↓
7. Job completado → técnico ingresa horas/materiales reales
       ↓
8. Learning Loop compara Estimado vs Real → genera factores de ajuste
       ↓
9. AI Insights Dashboard: "Tus trabajos de pintura tardan 18% más"
```

---

## Instalación

```bash
cd SuitMargin
npm install
```

**Variables de entorno requeridas:**
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FIXER_KEY=...          # Para tipo de cambio real (opcional)
```

**Base de datos:** Ejecutar `db/schema.sql` en Supabase (RLS multi-tenant incluido).

---

## Uso Básico

```typescript
import {
  calculateEstimate,
  checkProfitGuard,
  analyzeJob,
  compareEstimatedVsActual,
  ProfitGuard,
  QuoteGenerator,
  InsightsDashboard,
} from '@suitorg/suitmargin';

// 1. Config del negocio
const config = {
  laborCostPerHour: 80,
  targetMarginPct: 30,
  minimumJobPrice: 500,
  travelFee: 150,
  taxPct: 16,
  overheadPct: 10,
};

// 2. Calcular estimación
const estimate = calculateEstimate(config, {
  laborHours: 4,
  materialsCost: 1200,
  materialMarkupPct: 20,
  travelCost: 100,
  equipmentCost: 200,
});

// 3. Profit Guard
const guard = checkProfitGuard(proposedPrice, estimate);
if (!guard.safe) alert(guard.message);

// 5. React Components
<ProfitGuard proposedPrice={price} estimate={estimate} onPriceChange={setPrice} />
<QuoteGenerator data={quoteData} mode="public" onAccept={...} />
<InsightsDashboard insights={insights} kpis={kpis} />
```

---

## Tests

```bash
npm test           # Vitest: pricingEngine (márgenes, Profit Guard, formatPrice)
npm run typecheck  # TSC strict
```

---

## Migración desde SuitServiHogar

| SuitServiHogar | SuitMargin |
|---|---|
| Marketplace (cliente ↔ técnico) | SaaS herramienta técnico |
| Tabulador fijo | Pricing Engine dinámico |
| Sin análisis IA | AI Job Analysis + Smart Questions |
| Sin Profit Guard | Profit Guard obligatorio |
| Sin learning | Learning Loop (estimado vs real) |
| Sin insights | AI Business Insights |

**Integración:** `sh_technicians` ↔ `sm_businesses.owner_id` (mismo usuario, dos vistas).

---

## Roadmap (PRD JobMargin)

- [x] **Phase 1-4**: Pricing Engine, Profit Guard, AI Analysis, Quote Generator
- [ ] **Phase 5**: Job Completion + Estimated vs Actual
- [ ] **Phase 6**: Learning Loop + Auto-ajuste
- [ ] **Phase 7**: AI Insights Dashboard
- [ ] **Phase 8**: Multi-tenant auth + onboarding wizard
- [ ] **Phase 9**: PDF export real (pdf-lib) + WhatsApp share
- [ ] **Phase 10**: Voice input (Web Speech API) para descripción de trabajo

---

## Licencia

MIT — SuitOrg 2026