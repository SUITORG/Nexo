import React, { useMemo, useState, useEffect } from 'react';
import { DEFAULT_ESTIMATE_INPUT, EstimateInput, calculateEstimate, checkProfit } from './services/pricingEngine';
import { JobAnalysis, analyzeJob } from './services/aiAnalysis';
import { MarginJob, loadJobs, saveJob, compareEstimate } from './services/learningLoop';
import { Quote, QuoteGenerator, newQuoteId } from './components/QuoteGenerator';
import { ProfitGuard } from './components/ProfitGuard';
import { InsightsDashboard } from './components/InsightsDashboard';
import { formatPrice } from '../../lib/constants';

interface MarginScreenProps {
  onBack: () => void;
}

const PROFILE_KEY = 'sh_margin_profile';

const DEFAULT_PROFILE = {
  businessName: 'Mi Negocio',
  phone: '',
  email: '',
  laborCostPerHour: 350,
  targetMarginPct: 30,
  minimumJobPriceMxn: 500,
  overheadPct: 15,
  taxPct: 16,
  travelMxn: 0,
};

type AiState = 'idle' | 'loading' | 'ok' | 'manual';

const numField = (v: string) => (v.trim() === '' ? 0 : Number(v));

export const MarginScreen: React.FC<MarginScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'nuevo' | 'dashboard'>('nuevo');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [jobs, setJobs] = useState<MarginJob[]>([]);

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [aiState, setAiState] = useState<AiState>('idle');
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState<EstimateInput>({ ...DEFAULT_ESTIMATE_INPUT, ...DEFAULT_PROFILE });
  const [chosenPrice, setChosenPrice] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showActuals, setShowActuals] = useState(false);
  const [actuals, setActuals] = useState({ hours: '', cost: '', revenue: '' });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PROFILE_KEY);
      if (p) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(p) });
    } catch { /* perfil por defecto */ }
    setJobs(loadJobs());
  }, []);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = (next: typeof DEFAULT_PROFILE) => {
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setInput((prev) => ({ ...prev, ...next }));
  };

  const result = useMemo(() => calculateEstimate(input), [input]);
  const price = numField(chosenPrice) || result.recommendedPriceMxn;
  const check = checkProfit(price, result, input.targetMarginPct);

  const runAnalysis = async () => {
    if (!desc.trim()) return notify('Escribe primero una descripción del trabajo.');
    setAiState('loading');
    const found = await analyzeJob(desc);
    if (!found) {
      setAiState('manual');
      notify('IA no disponible: completa los datos manualmente.');
      return;
    }
    setAnalysis(found);
    setAnswers(found.questions.map(() => ''));
    setInput((prev) => ({
      ...prev,
      laborHours: found.estimated_hours,
      materialsMxn: materialsSum(found),
    }));
    setAiState('ok');
  };

  const buildQuote = () => {
    if (!customer.name.trim()) return notify('Captura el nombre del cliente.');
    setQuote({
      publicId: newQuoteId(),
      createdAt: new Date().toISOString(),
      business: { name: profile.businessName, phone: profile.phone, email: profile.email },
      customer,
      jobTitle: title || analysis?.job_type || 'Servicio',
      jobDescription: [desc, ...answers.filter(Boolean).map((a, i) => `${analysis?.questions[i] ?? ''} ${a}`)].join('\n'),
      scope: analysis?.scope ?? { included: [desc], exclusions: [], assumptions: [] },
      materials: (analysis?.materials ?? []).map((m) => ({ name: m.name, costMxn: m.est_cost_mxn })),
      priceMxn: price,
      timelineDays: Math.max(1, Math.ceil(input.laborHours / 4)),
      expiresInDays: 15,
    });
  };

  const completeJob = () => {
    const job: MarginJob = {
      id: newQuoteId(),
      jobType: analysis?.job_type || 'General',
      jobTitle: title || analysis?.job_type || 'Servicio',
      description: desc,
      createdAt: new Date().toISOString(),
      status: 'completed',
      estimatedHours: input.laborHours,
      estimatedCostMxn: result.estimatedCostMxn,
      recommendedPriceMxn: result.recommendedPriceMxn,
      quotedPriceMxn: price,
      actualHours: numField(actuals.hours) || undefined,
      actualCostMxn: numField(actuals.cost) || undefined,
      actualRevenueMxn: numField(actuals.revenue) || price,
    };
    setJobs(saveJob(job));
    setShowActuals(false);
    setQuote(null);
    setTab('dashboard');
    notify('Trabajo guardado. Comparando estimado vs real.');
  };

  const field = (label: string, value: string, onChange: (v: string) => void, prefix = '$') => (
    <label className="block">
      <span className="text-label-sm text-text-muted">{label}</span>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-body-sm text-text-muted">{prefix}</span>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-2 rounded-lg border border-border-subtle bg-surface-card text-body-md text-text-primary"
        />
      </div>
    </label>
  );

  if (quote) {
    return (
      <div className="px-4 py-5 max-w-lg mx-auto">
        <QuoteGenerator
          quote={quote}
          onBack={() => setQuote(null)}
          onShare={() => notify('Enlace público copiado.')}
        />
        {!showActuals && (
          <button
            onClick={() => setShowActuals(true)}
            className="mt-3 w-full h-11 bg-secondary text-on-secondary rounded-xl text-label-md font-bold print:hidden"
          >
            Marcar trabajo como completado
          </button>
        )}
        {showActuals && (
          <div className="mt-3 bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-3 print:hidden">
            <h3 className="text-label-lg font-bold text-text-primary">Resultados reales</h3>
            {field('Horas reales', actuals.hours, (v) => setActuals({ ...actuals, hours: v }), 'h')}
            {field('Costo real materiales', actuals.cost, (v) => setActuals({ ...actuals, cost: v }))}
            {field('Ingreso final cobrado', actuals.revenue, (v) => setActuals({ ...actuals, revenue: v }))}
            <button onClick={completeJob} className="w-full h-11 bg-primary text-on-primary rounded-xl text-label-md font-bold">
              Guardar y comparar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-label-md text-primary font-bold">
          <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span> Perfil
        </button>
        <div className="flex bg-surface-alt rounded-lg p-0.5 border border-border-subtle">
          {(['nuevo', 'dashboard'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-label-sm rounded-md font-bold ${tab === t ? 'bg-primary text-on-primary' : 'text-text-muted'}`}
            >
              {t === 'nuevo' ? 'Nuevo trabajo' : 'Dashboard'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' ? (
        <InsightsDashboard jobs={jobs} />
      ) : (
        <>
          {/* Perfil de negocio */}
          <details className="bg-surface-card rounded-2xl border border-border-subtle p-4">
            <summary className="text-label-md font-bold text-text-primary cursor-pointer">
              Configuración de precios ({formatPrice(profile.laborCostPerHour)}/h · margen {profile.targetMarginPct}%)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {field('Costo por hora', String(profile.laborCostPerHour), (v) => saveProfile({ ...profile, laborCostPerHour: numField(v) }))}
              {field('Precio mínimo de trabajo', String(profile.minimumJobPriceMxn), (v) => saveProfile({ ...profile, minimumJobPriceMxn: numField(v) }))}
              <label className="block">
                <span className="text-label-sm text-text-muted">Margen objetivo %</span>
                <input type="number" value={profile.targetMarginPct} onChange={(e) => saveProfile({ ...profile, targetMarginPct: numField(e.target.value) })}
                  className="w-full h-10 px-2 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-md" />
              </label>
              <label className="block">
                <span className="text-label-sm text-text-muted">Overhead %</span>
                <input type="number" value={profile.overheadPct} onChange={(e) => saveProfile({ ...profile, overheadPct: numField(e.target.value) })}
                  className="w-full h-10 px-2 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-md" />
              </label>
            </div>
          </details>

          {/* Trabajo */}
          <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-3">
            <h3 className="text-label-lg font-bold text-text-primary">1. Describe el trabajo</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2">
                <span className="text-label-sm text-text-muted">Cliente</span>
                <input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full h-10 px-2 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-md" />
              </label>
              <label className="block col-span-2">
                <span className="text-label-sm text-text-muted">Título del trabajo</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pintar interior 3 recámaras"
                  className="w-full h-10 px-2 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-md" />
              </label>
              <label className="block col-span-2">
                <span className="text-label-sm text-text-muted">Descripción</span>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                  placeholder="Necesito pintar el interior de una casa de 3 recámaras..."
                  className="w-full px-2 py-2 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-md resize-none" />
              </label>
            </div>
            <button
              onClick={runAnalysis}
              disabled={aiState === 'loading'}
              className="w-full h-11 bg-trust-blue-light text-primary rounded-xl text-label-md font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {aiState === 'loading' ? 'Analizando...' : aiState === 'manual' ? 'Reintentar análisis IA' : 'Analizar con IA'}
            </button>
            {aiState === 'manual' && (
              <p className="text-body-sm text-error">Sin IA: llena horas y materiales a mano en el paso 2.</p>
            )}
            {aiState === 'manual' && (
              <div className="grid grid-cols-2 gap-3">
                {field('Horas estimadas', String(input.laborHours), (v) => setInput({ ...input, laborHours: numField(v) }), 'h')}
                {field('Materiales', String(input.materialsMxn), (v) => setInput({ ...input, materialsMxn: numField(v) }))}
              </div>
            )}
          </div>

          {/* Preguntas IA */}
          {aiState === 'ok' && analysis && analysis.questions.length > 0 && (
            <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-3">
              <h3 className="text-label-lg font-bold text-text-primary">2. Preguntas para mejorar la cotización</h3>
              <p className="text-body-sm text-text-muted">{analysis.job_type} · complejidad {analysis.complexity}</p>
              {analysis.questions.map((q, i) => (
                <label key={i} className="block">
                  <span className="text-body-sm text-text-primary">{i + 1}. {q}</span>
                  <input
                    value={answers[i] ?? ''}
                    onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                    className="w-full h-10 px-2 mt-1 rounded-lg border border-border-subtle bg-surface-card text-body-md"
                  />
                </label>
              ))}
              {analysis.missing_information.length > 0 && (
                <p className="text-body-sm text-text-muted">Sin datos de: {analysis.missing_information.join(', ')}</p>
              )}
            </div>
          )}

          {/* Estimación */}
          <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-3">
            <h3 className="text-label-lg font-bold text-text-primary">3. Estimación (editable)</h3>
            <div className="grid grid-cols-2 gap-3">
              {field('Horas', String(input.laborHours), (v) => setInput({ ...input, laborHours: numField(v) }), 'h')}
              {field('Tarifa/hora', String(input.laborCostPerHour), (v) => setInput({ ...input, laborCostPerHour: numField(v) }))}
              {field('Materiales', String(input.materialsMxn), (v) => setInput({ ...input, materialsMxn: numField(v) }))}
              {field('Viáticos', String(input.travelMxn), (v) => setInput({ ...input, travelMxn: numField(v) }))}
              {field('Equipo', String(input.equipmentMxn), (v) => setInput({ ...input, equipmentMxn: numField(v) }))}
              {field('Utilidad deseada', String(input.targetMarginPct), (v) => setInput({ ...input, targetMarginPct: numField(v) }), '%')}
            </div>

            <div className="rounded-xl bg-surface-alt border border-border-subtle p-3 space-y-1 text-body-sm">
              <Row label="Mano de obra" value={formatPrice(result.laborMxn)} />
              <Row label="Materiales (con utilidad)" value={formatPrice(result.materialsMxn)} />
              <Row label="Overhead" value={formatPrice(result.overheadMxn)} />
              <Row label="Costo total estimado" value={formatPrice(result.estimatedCostMxn)} strong />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'Mínimo', v: result.minimumPriceMxn },
                { k: 'Recomendado', v: result.recommendedPriceMxn },
                { k: 'Premium', v: result.premiumPriceMxn },
              ].map((lvl) => (
                <div key={lvl.k} className={`rounded-xl border p-2 text-center ${lvl.k === 'Recomendado' ? 'border-primary bg-trust-blue-light' : 'border-border-subtle bg-surface-alt'}`}>
                  <p className="text-label-sm text-text-muted">{lvl.k}</p>
                  <p className="text-body-md font-bold text-text-primary">{formatPrice(lvl.v)}</p>
                </div>
              ))}
            </div>

            <label className="block">
              <span className="text-label-sm text-text-muted">Precio que vas a cotizar (AI estimate, editable)</span>
              <input
                type="number"
                inputMode="decimal"
                value={chosenPrice}
                placeholder={String(result.recommendedPriceMxn)}
                onChange={(e) => setChosenPrice(e.target.value)}
                className="w-full h-11 px-3 mt-0.5 rounded-lg border border-border-subtle bg-surface-card text-body-lg font-bold text-text-primary"
              />
            </label>

            <ProfitGuard
              chosenPriceMxn={price}
              result={result}
              check={check}
              targetMarginPct={input.targetMarginPct}
              recommendedPriceMxn={result.recommendedPriceMxn}
            />

            <button onClick={buildQuote} className="w-full h-11 bg-primary text-on-primary rounded-xl text-label-md font-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">description</span> Generar cotización
            </button>
          </div>

          {jobs.length > 0 && (
            <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 space-y-2">
              <h3 className="text-label-lg font-bold text-text-primary">Trabajos recientes</h3>
              {jobs.slice(0, 5).map((j) => {
                const cmp = compareEstimate(j);
                return (
                  <div key={j.id} className="flex justify-between text-body-sm">
                    <span className="text-text-secondary truncate pr-2">{j.jobTitle}</span>
                    <span className="font-semibold text-text-primary">
                      {cmp ? `${cmp.marginPct}% · ${cmp.hoursDeltaPct != null ? `${cmp.hoursDeltaPct > 0 ? '+' : ''}${cmp.hoursDeltaPct}% hrs` : '—'}` : 'estimado'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full text-label-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex justify-between">
    <span className={strong ? 'font-bold text-text-primary' : 'text-text-muted'}>{label}</span>
    <span className={strong ? 'font-bold text-text-primary' : 'text-text-primary'}>{value}</span>
  </div>
);

function materialsSum(a: JobAnalysis): number {
  return a.materials.reduce((sum, m) => sum + m.est_cost_mxn, 0);
}
