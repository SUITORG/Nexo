import React from 'react';
import { Currency, ScreenId, ServiceCategory } from '../../types';
import { getRateSync } from '../../lib/constants';

interface HomeScreenProps {
  currency: Currency;
  onNavigate: (screen: ScreenId) => void;
  onSelectCategory: (categoryId: string) => void;
  onRequestService: () => void;
  categories: ServiceCategory[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currency,
  onNavigate,
  onSelectCategory,
  onRequestService,
  categories
}) => {
  const rate = getRateSync();
  const formatPrice = (priceMxn: number) => {
    if (currency === 'USD') {
      const usd = (priceMxn / rate).toFixed(0);
      return `$${usd} USD`;
    }
    return `$${priceMxn} MXN`;
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Hero Section */}
      <section className="bg-surface-card rounded-xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-3">
        {/* Verification Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-safe-bg text-escrow-shield border border-secondary-container rounded-full text-label-sm font-bold">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            INE & Biometría Verificada
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-trust-blue-light text-primary border border-border-subtle rounded-full text-label-sm font-bold">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            Auditoría Domiciliaria Reynosa
          </span>
        </div>

        {/* Hero Title & Description */}
        <div>
          <h1 className="text-headline-lg text-primary font-bold leading-tight tracking-tight">
            Tu hogar en manos expertas y 100% verificadas en Reynosa
          </h1>
          <p className="text-body-md text-text-muted mt-2 leading-relaxed">
            Eliminamos la desconfianza urbana y los sobreprecios. Técnicos locales auditados presencialmente, garantía con retención Escrow y tarifas reguladas para familias y maquiladoras.
          </p>
        </div>

        {/* CTA Card */}
        <div className="bg-surface-alt rounded-lg p-3.5 border border-border-subtle space-y-2">
          <button
            onClick={onRequestService}
            className="w-full bg-primary hover:bg-trust-blue-dark text-on-primary font-label-lg py-3 px-4 rounded-lg flex items-center justify-between shadow-xs active:scale-98 transition-all duration-150"
          >
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[20px]">handyman</span>
              <span className="font-bold">Solicitar un Servicio de Confianza</span>
            </div>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>

          <div className="flex items-center space-x-1.5 text-label-sm text-escrow-shield font-medium pt-0.5">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Precios fijos sin sorpresas y garantía Escrow retenida en custodia.</span>
          </div>
        </div>
      </section>

      {/* Tipo de Cambio Fronterizo Banner */}
      <section className="bg-surface-card rounded-lg p-3 border border-border-subtle shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
          </div>
          <div>
            <span className="text-label-sm text-text-muted uppercase tracking-wider block font-bold">
              Tipo de Cambio Diario Fronterizo
            </span>
            <span className="text-body-sm text-text-primary font-semibold">
              1 USD ≈ $17.80 MXN • Fijado sin fluctuación en sitio
            </span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('explorar')}
          className="px-2.5 py-1 rounded bg-trust-blue-light text-primary text-label-sm font-bold border border-primary/20 hover:bg-primary hover:text-white transition-colors"
        >
          Tabulador SAT
        </button>
      </section>

      {/* Servicios de Urgencia 24/7 */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-danger-flag text-[20px]">emergency</span>
            <h2 className="text-headline-sm text-text-primary font-bold">Servicios de Urgencia 24/7</h2>
          </div>
          <span className="text-label-sm font-bold text-escrow-shield bg-emerald-safe-bg border border-secondary-container px-2 py-0.5 rounded-full">
            Respuesta &lt;35 min
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate('explorar');
              }}
              className="bg-surface-card rounded-lg p-3 border border-border-subtle hover:border-primary/40 shadow-xs transition-all duration-150 cursor-pointer hover:shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-trust-blue-light text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  </div>
                  <span className="text-label-sm text-text-muted bg-surface-alt px-1.5 py-0.5 rounded font-medium">
                    {cat.count} activos
                  </span>
                </div>
                <h3 className="text-label-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-body-sm text-text-muted mt-0.5">{cat.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-label-md font-bold text-secondary">
                  Desde {formatPrice(cat.basePriceMxn)}
                </span>
                <span className="material-symbols-outlined text-text-muted text-[16px] group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* El Blindaje ServiciosHogar */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
          <h2 className="text-headline-sm text-text-primary font-bold">El Blindaje ServiciosHogar</h2>
        </div>
        <p className="text-body-sm text-text-muted">
          Diseñado específicamente para mitigar riesgos patrimoniales en Reynosa:
        </p>

        <div className="space-y-2.5">
          {/* Item 1 */}
          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">fingerprint</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-label-lg font-bold text-text-primary">Deep-Vetting Presencial</h3>
                <span className="text-label-sm font-bold bg-emerald-safe-bg text-escrow-shield px-1.5 py-0.2 rounded border border-secondary-container">
                  Auditado
                </span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5 leading-relaxed">
                Validación física del domicilio del técnico en Reynosa, antecedentes no penales cotejados e identificación biométrica con INE.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-safe-bg text-escrow-shield flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-label-lg font-bold text-text-primary">Garantía Escrow (Pago Protegido)</h3>
                <span className="text-label-sm font-bold bg-primary text-on-primary px-1.5 py-0.2 rounded">
                  Stripe Connect
                </span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5 leading-relaxed">
                Tu dinero se resguarda en custodia digital segura. No se libera al técnico hasta que confirmes tu satisfacción total con fotos de evidencia.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">price_change</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-label-lg font-bold text-text-primary">Tabulador Bimonetario Cero Sorpresas</h3>
                <span className="text-label-sm font-bold bg-tertiary-fixed text-on-tertiary-fixed-variant px-1.5 py-0.2 rounded border border-tertiary-fixed-dim">
                  Precios Regulados
                </span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5 leading-relaxed">
                Sin cobros abusivos al llegar a tu puerta. Tarifas fijas y transparentes tanto en Pesos Mexicanos (MXN) como en Dólares (USD).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Convocatoria de Prestadores */}
      <section className="bg-gradient-to-br from-primary to-trust-blue-dark text-on-primary rounded-xl p-4 shadow-sm space-y-3">
        <div className="inline-flex items-center space-x-1 bg-surface-card/10 px-2.5 py-0.5 rounded-full border border-surface-card/20">
          <span className="material-symbols-outlined text-secondary-fixed text-[14px]">campaign</span>
          <span className="text-label-sm text-secondary-fixed font-bold tracking-wider uppercase">
            Convocatoria de Prestadores
          </span>
        </div>

        <div>
          <h2 className="text-headline-sm font-bold text-white">¿Eres Profesional o Técnico?</h2>
          <p className="text-body-sm text-surface-container-low mt-1 leading-relaxed">
            Multiplica tus ingresos con cobro garantizado semanal, clientes pre-filtrados y retención simplificada ante el SAT (ISR 2.1% e IVA 8%).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-label-sm">
          <div className="flex items-center space-x-1.5 bg-surface-card/10 p-2 rounded border border-surface-card/10">
            <span className="material-symbols-outlined text-secondary-fixed text-[16px]">check_circle</span>
            <span className="font-semibold text-white">Bono $150 MXN por referido</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-surface-card/10 p-2 rounded border border-surface-card/10">
            <span className="material-symbols-outlined text-tertiary-fixed-dim text-[16px]">star</span>
            <span className="font-semibold text-white">Distintivo de Confianza 5★</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('perfil')}
          className="w-full bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed font-label-lg font-bold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all active:scale-98"
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Registrarme como Técnico Certificado</span>
        </button>

        <p className="text-center text-label-sm text-surface-container-highest opacity-90">
          Validación presencial en nuestras oficinas de Col. Las Fuentes en menos de 24 horas.
        </p>
      </section>

      {/* Privacidad Geográfica Blindada */}
      <section className="bg-surface-card rounded-lg p-3 border border-border-subtle flex items-start space-x-2.5 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[18px]">security</span>
        </div>
        <div className="flex-1">
          <h4 className="text-label-md font-bold text-text-primary">Privacidad Geográfica Blindada</h4>
          <p className="text-body-sm text-text-muted mt-0.5">
            Tu ubicación exacta solo se comparte en un radio de 200m y se revela al confirmar el técnico asignado.
          </p>
        </div>
        <span className="material-symbols-outlined text-text-muted text-[18px]">info</span>
      </section>
    </div>
  );
};
