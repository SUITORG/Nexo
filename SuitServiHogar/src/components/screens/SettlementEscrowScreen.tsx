import React, { useState } from 'react';

const DEFAULT_SETTLEMENT = {
  ref: 'CXT-SH-2024-1027',
  issuedAt: '27 de Octubre, 2024 • 16:45 hrs',
  netEarningsMxn: 1432.32,
  netEarningsUsd: 76.19,
  exchangeRate: 18.80,
  bankClabe: '012180012345678901',
  bankName: 'Banorte Reynosa',
  serviceConcept: 'Instalación Minisplit 3Ton',
  location: 'Col. Las Fuentes, Reynosa, Tamps.',
  customerName: 'María López',
  grossClientPaymentMxn: 2100.00,
  commissionPercent: 15,
  platformCommissionMxn: 315.00,
  satIsrPercent: 1.1,
  satIsrPlatformMxn: 23.10,
  satIvaPercent: 8,
  satIvaRetentionMxn: 127.68,
  satTotalWithheldMxn: 150.78,
};

interface SettlementEscrowScreenProps {
  onBack?: () => void;
  onDownloadPdf: () => void;
  onDownloadXml: () => void;
  onViewMonthlyEarnings: () => void;
  onAskClarification: () => void;
  onShare: () => void;
  settlementData?: typeof DEFAULT_SETTLEMENT;
}

export const SettlementEscrowScreen: React.FC<SettlementEscrowScreenProps> = ({
  onBack,
  onDownloadPdf,
  onDownloadXml,
  onViewMonthlyEarnings,
  onAskClarification,
  onShare,
  settlementData
}) => {
  const data = settlementData || DEFAULT_SETTLEMENT;
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handlePdf = () => {
    setDownloadSuccess('Comprobante CFDI 4.0 (PDF) generado exitosamente.');
    setTimeout(() => setDownloadSuccess(null), 3500);
    onDownloadPdf();
  };

  const handleXml = () => {
    setDownloadSuccess('Archivo XML SAT timbrado descargado.');
    setTimeout(() => setDownloadSuccess(null), 3500);
    onDownloadXml();
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Sub-Nav Contextual Status Banner */}
      <div className="pt-1 flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-lg text-primary hover:bg-trust-blue-light transition-colors active:scale-95 duration-100 flex items-center"
              title="Regresar"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-headline-sm text-primary font-bold tracking-tight">
                Liquidación de Servicio
              </span>
              <span className="bg-surface-container-high px-2 py-0.5 rounded text-label-sm font-bold text-primary font-mono">
                {data.ref}
              </span>
            </div>
            <p className="text-body-sm text-text-muted">
              Corte emitido: {data.issuedAt}
            </p>
          </div>
        </div>

        <button
          onClick={onShare}
          className="flex items-center gap-1 text-primary hover:bg-trust-blue-light p-2 rounded-lg text-label-md transition-colors"
          title="Compartir comprobante"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-safe-bg text-escrow-shield border border-secondary-container rounded-lg text-body-sm font-bold flex items-center gap-2 animate-fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Escrow Release Status Chip */}
      <div className="bg-emerald-safe-bg border border-secondary/20 rounded-xl p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-[18px] material-symbols-fill">
              check_circle
            </span>
          </div>
          <div>
            <p className="text-label-md text-secondary font-bold">
              Servicio Concretado & Escrow Liberado
            </p>
            <p className="text-body-sm text-text-muted">
              Fondos asegurados transferidos vía SPEI / Stripe Connect
            </p>
          </div>
        </div>
        <span className="text-label-sm font-bold bg-secondary text-white px-2 py-1 rounded-full uppercase tracking-wider">
          SPEI OK
        </span>
      </div>

      {/* Card Principal: Resumen de Depósito Neto */}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-label-md text-text-muted uppercase tracking-wider font-bold">
              Ganancia Neta Transferida a Banco
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-display-lg-mobile text-primary tracking-tight font-extrabold">
                ${data.netEarningsMxn.toFixed(2)}
              </span>
              <span className="text-label-lg font-bold text-text-muted">MXN</span>
            </div>
            <p className="text-body-sm text-text-muted mt-0.5">
              Aprox.{' '}
              <span className="font-semibold text-primary">~${data.netEarningsUsd.toFixed(2)} USD</span>{' '}
              (T.C. Fronterizo {data.exchangeRate.toFixed(2)} MXN/USD)
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-label-sm bg-secondary/10 text-secondary border border-secondary/30 px-2.5 py-1 rounded-full font-bold">
              <span className="material-symbols-outlined text-[14px] material-symbols-fill">
                verified
              </span>
              Enviado SPEI
            </span>
            <p className="text-label-sm text-text-muted mt-1.5 font-mono">
              CLABE {data.bankClabe}
            </p>
            <p className="text-label-sm text-text-muted font-medium">{data.bankName}</p>
          </div>
        </div>

        {/* Detalle Rápido Servicio */}
        <div className="bg-surface-alt rounded-lg p-3 border border-border-subtle grid grid-cols-2 gap-3 text-left">
          <div>
            <span className="text-label-sm text-text-muted block font-medium">
              Concepto de Trabajo
            </span>
            <span className="text-body-md font-bold text-text-primary">
              {data.serviceConcept}
            </span>
            <span className="text-body-sm text-text-muted block">{data.location}</span>
          </div>
          <div>
            <span className="text-label-sm text-text-muted block font-medium">
              Cliente Verificado
            </span>
            <span className="text-body-md font-bold text-text-primary">
              {data.customerName}
            </span>
            <span className="text-label-sm text-secondary font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Escrow 100% Protegido
            </span>
          </div>
        </div>
      </section>

      {/* Desglose Financiero: Matemática Clara */}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">calculate</span>
            <h2 className="text-headline-sm text-primary font-bold">
              Matemática Clara de tu Ganancia
            </h2>
          </div>
          <span className="text-label-sm text-secondary bg-emerald-safe-bg px-2 py-0.5 rounded font-bold border border-secondary/20">
            Auditoría 100% Transparente
          </span>
        </div>

        {/* Líneas de desglose */}
        <div className="divide-y divide-border-subtle text-body-md space-y-2.5">
          {/* Monto Bruto */}
          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="font-bold text-text-primary">Precio Total Pagado por Cliente</span>
              <p className="text-body-sm text-text-muted">
                Cobrado en custodia Escrow (Stripe Connect)
              </p>
            </div>
            <span className="font-bold text-text-primary text-currency-display">
              ${data.grossClientPaymentMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Comisión Plataforma */}
          <div className="flex justify-between items-start pt-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-text-primary">
                  Comisión de Intermediación Tecnológica
                </span>
                <span className="text-label-sm bg-trust-blue-light text-primary px-1.5 py-0.2 rounded font-bold border border-primary/20">
                  {data.commissionPercent}%
                </span>
              </div>
              <p className="text-body-sm text-text-muted">
                ServiciosHogar Reynosa (Factura con IVA trasladado)
              </p>
              <div className="flex items-center gap-1 text-label-sm text-primary pt-0.5">
                <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                <span>Incluye soporte 24/7, app, validación física y seguro</span>
              </div>
            </div>
            <span className="font-bold text-error text-headline-sm whitespace-nowrap">
              -${data.platformCommissionMxn.toFixed(2)} MXN
            </span>
          </div>

          {/* Bloque Retenciones Fiscales SAT */}
          <div className="pt-3">
            <div className="bg-surface-container-low rounded-lg p-3.5 border border-primary-fixed space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    account_balance
                  </span>
                  <span className="text-label-lg text-primary font-bold">
                    Retenciones Fiscales por Ley (SAT)
                  </span>
                </div>
                <span className="text-label-sm bg-primary text-white px-2 py-0.5 rounded font-bold">
                  Régimen Plataformas
                </span>
              </div>

              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Por mandato del SAT (Art. 113-A LISR), la plataforma retiene y entera directamente estos montos a la federación con tu RFC.{' '}
                <strong>Esto NO es un cobro de ServiciosHogar</strong>; es tu cumplimiento fiscal automatizado sin recargos.
              </p>

              {/* Retención ISR */}
              <div className="flex justify-between items-center bg-surface-card p-2.5 rounded-lg border border-border-subtle">
                <div>
                  <span className="text-label-md text-text-primary block font-bold">
                    Retención ISR Plataformas ({data.satIsrPercent}%)
                  </span>
                  <span className="text-body-sm text-text-muted">
                    Calculado sobre ingreso del servicio (${data.grossClientPaymentMxn.toFixed(2)})
                  </span>
                </div>
                <span className="font-bold text-error text-body-md">
                  -${data.satIsrPlatformMxn.toFixed(2)} MXN
                </span>
              </div>

              {/* Retención IVA */}
              <div className="flex justify-between items-center bg-surface-card p-2.5 rounded-lg border border-border-subtle">
                <div>
                  <span className="text-label-md text-text-primary block font-bold">
                    Retención IVA ({data.satIvaPercent}% - 50% trasladado)
                  </span>
                  <span className="text-body-sm text-text-muted">
                    Acreditable en tu declaración mensual
                  </span>
                </div>
                <span className="font-bold text-error text-body-md">
                  -${data.satIvaRetentionMxn.toFixed(2)} MXN
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 px-1 text-label-md text-text-muted">
                <span>Total Enterado a Hacienda por este servicio:</span>
                <span className="font-bold text-text-primary">
                  -${data.satTotalWithheldMxn.toFixed(2)} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Total Líquido Final */}
          <div className="flex justify-between items-center pt-3">
            <div>
              <span className="text-headline-sm text-primary font-extrabold block">
                Ganancia Neta Disponible
              </span>
              <span className="text-body-sm text-text-muted">
                Total líquido acreditado en tu cuenta
              </span>
            </div>
            <div className="text-right">
              <span className="text-headline-md text-secondary font-extrabold">
                ${data.netEarningsMxn.toFixed(2)} MXN
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Comprobante Fiscal de Retención */}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">description</span>
            <h3 className="text-headline-sm text-primary font-bold">
              Comprobante Fiscal de Retención
            </h3>
          </div>
          <span className="text-label-sm font-bold text-text-muted bg-surface-alt px-2 py-0.5 rounded border border-border-subtle">
            CFDI 4.0
          </span>
        </div>

        <p className="text-body-sm text-text-muted">
          Tu constancia individual de retenciones e información de pagos está lista. Puedes exportarla para tu contador o deducciones personales.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handlePdf}
            className="flex items-center justify-center gap-2 bg-trust-blue-light hover:bg-surface-container text-primary border border-primary/20 py-2.5 px-3 rounded-lg text-label-md font-bold transition-colors active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span>Descargar PDF</span>
          </button>
          <button
            onClick={handleXml}
            className="flex items-center justify-center gap-2 bg-surface-alt hover:bg-surface-container-high text-on-surface border border-border-subtle py-2.5 px-3 rounded-lg text-label-md font-bold transition-colors active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            <span>Archivo XML</span>
          </button>
        </div>
      </section>

      {/* Marco Legal: Contratista Independiente */}
      <section className="bg-surface-alt rounded-xl border border-border-subtle p-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-text-muted mt-0.5 text-[22px] shrink-0">
            gavel
          </span>
          <div className="space-y-1">
            <h4 className="text-label-md text-text-primary font-bold uppercase tracking-wider">
              Aviso de Relación Comercial Independiente
            </h4>
            <p className="text-body-sm text-text-muted leading-relaxed">
              ServiciosHogar Reynosa actúa exclusivamente como intermediario tecnológico y plataforma de conexión entre clientes finales y técnicos profesionales.{' '}
              <strong>No existe relación de subordinación ni vínculo laboral patronal</strong>; el técnico opera bajo su propia responsabilidad como prestador de servicios independiente formal, disponiendo libremente de su tiempo, tarifas y herramientas.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-label-sm text-primary font-medium">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Cumplimiento con Resolución Miscelánea Fiscal SAT & Stripe Connect Escrow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Botones de Acción Principal / Reportes */}
      <div className="pt-2 space-y-2.5">
        <button
          onClick={onViewMonthlyEarnings}
          className="w-full bg-primary hover:bg-trust-blue-dark text-white py-3.5 px-4 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          <span>Ver Mis Ganancias Acumuladas del Mes</span>
        </button>

        <button
          onClick={onAskClarification}
          className="w-full bg-surface-card hover:bg-trust-blue-light text-primary border border-border-subtle py-3 px-4 rounded-xl font-label-md font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          <span>Aclaración sobre este Desglose o Retención</span>
        </button>
      </div>
    </div>
  );
};
