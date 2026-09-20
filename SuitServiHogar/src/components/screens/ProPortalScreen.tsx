import React, { useState, useEffect } from 'react';
import { ScreenId } from '../../types';
import { supabase } from '../../lib/supabase';
import { getReferralCode, createReferralCode, getMyReferralStats } from '../../services/referralService';

interface ProPortalScreenProps {
  onScheduleVisit: () => void;
  onUploadDoc: () => void;
  onWhatsAppHelp: () => void;
  onNavigate: (screen: ScreenId) => void;
  isTechnician?: boolean;
}

export const ProPortalScreen: React.FC<ProPortalScreenProps> = ({
  onScheduleVisit,
  onUploadDoc,
  onWhatsAppHelp,
  onNavigate,
  isTechnician = false
}) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ totalReferrals: 0, completedReferrals: 0, pendingReward: 0 });
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const refType = isTechnician ? 'technician' : 'client';
      let code = await getReferralCode(refType, user.id);
      if (!code) {
        code = await createReferralCode(refType, user.id, isTechnician ? 150 : 100);
      }
      if (code) setReferralCode(code);
      const stats = await getMyReferralStats(refType, user.id);
      if (stats) setReferralStats({ totalReferrals: stats.totalReferrals, completedReferrals: stats.completedReferrals, pendingReward: stats.totalRewardsMxn });
    })();
  }, [isTechnician]);

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 pb-14">
      {/* Portal Aliados Pro Welcome Header with Status & Availability */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-trust-blue-light text-primary rounded-full mb-1">
              <span className="material-symbols-outlined text-[14px]">handyman</span>
              <span className="text-label-sm font-bold">ALIADO TÉCNICO PRO</span>
            </div>
            <h1 className="text-headline-sm text-text-primary font-bold">Portal Aliados Pro</h1>
            <p className="text-body-sm text-text-muted">ServiciosHogar Reynosa • Hub Operativo</p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-label-sm text-text-muted mb-1 font-medium">Disponibilidad</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
            </label>
            <span className="text-label-sm font-semibold mt-1 flex items-center gap-1">
              {isAvailable ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="text-secondary font-bold">Activo</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  <span className="text-text-muted font-medium">En pausa</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Verified Technician Preview Banner */}
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-headline-sm">
                AR
              </div>
              <span className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-0.5 text-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] material-symbols-fill">verified</span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-label-lg text-text-primary font-bold">Ing. Antonio Reyes</span>
                <span className="px-1.5 py-0.2 rounded text-label-sm font-bold bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim">
                  ★ 4.98
                </span>
              </div>
              <p className="text-body-sm text-text-muted">Climatización & Electricidad Industrial</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-label-sm px-2 py-0.5 rounded-full bg-trust-blue-light text-primary font-bold border border-primary/20">
              ID: REY-9482
            </span>
          </div>
        </div>
      </section>

      {/* Earnings & Certainty Bento Card */}
      <section className="bg-gradient-to-br from-primary to-trust-blue-dark text-on-primary rounded-xl p-4 shadow-md relative overflow-hidden space-y-3">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container rounded-full opacity-30 pointer-events-none"></div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-1.5 bg-surface-card/10 px-2.5 py-1 rounded-full border border-surface-card/20">
              <span className="material-symbols-outlined text-secondary-fixed text-[14px] material-symbols-fill">
                lock
              </span>
              <span className="text-label-sm text-surface-container-lowest font-semibold">
                Depósito en Garantía Escrow
              </span>
            </div>
            <span className="text-label-sm text-surface-container-highest opacity-90 font-medium">
              Liquidación Semanal
            </span>
          </div>

          <div>
            <p className="text-body-sm text-surface-container-highest font-medium">
              Proyección Estimada Mensual
            </p>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-display-lg-mobile text-white tracking-tight font-bold">
                $22,000
              </span>
              <span className="text-headline-sm text-surface-container-highest font-semibold">
                MXN
              </span>
              <span className="text-label-md text-primary-fixed-dim ml-1 font-semibold">
                (~$1,220 USD)
              </span>
            </div>
          </div>

          <p className="text-body-md text-surface-container-low leading-snug">
            Pagos 100% garantizados bajo custodia bancaria previa. Sin regateos al terminar la labor, sin cuentas incobrables en Reynosa.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-card/15">
            <div className="bg-surface-card/10 p-2 rounded-lg border border-surface-card/10">
              <span className="text-label-sm text-surface-container-highest block">Retención SAT</span>
              <span className="text-label-lg text-white font-bold">2.1% ISR</span>
            </div>
            <div className="bg-surface-card/10 p-2 rounded-lg border border-surface-card/10">
              <span className="text-label-sm text-surface-container-highest block">Tu Ganancia</span>
              <span className="text-label-lg text-secondary-fixed font-bold">85% Neto</span>
            </div>
            <div className="bg-surface-card/10 p-2 rounded-lg border border-surface-card/10">
              <span className="text-label-sm text-surface-container-highest block">Seguro RC</span>
              <span className="text-label-lg text-white font-bold">Incluido ✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Vetting Stepper Process Card */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">shield_person</span>
            <h2 className="text-headline-sm text-text-primary font-bold">Certificación Física Local</h2>
          </div>
          <span className="text-label-sm px-2 py-0.5 rounded-full bg-emerald-safe-bg text-escrow-shield font-bold border border-secondary-container">
            Nivel 2 de 3
          </span>
        </div>

        <p className="text-body-sm text-text-muted">
          El protocolo 'Deep-Vetting' protege tu prestigio profesional contra competidores informales y te da preferencia en hogares de maquila en Reynosa.
        </p>

        {/* Stepper Component */}
        <div className="space-y-3 pt-1">
          {/* Step 1: Completed */}
          <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-emerald-safe-bg/60 border border-secondary-container/70">
            <div className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-label-lg text-text-primary font-bold">
                  Identificación Oficial & Biometría
                </h3>
                <span className="text-label-sm text-secondary font-bold">Completado ✓</span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5">
                INE vigente, cotejo biométrico facial y Carta de No Antecedentes Penales de Tamaulipas validada.
              </p>
            </div>
          </div>

          {/* Step 2: In Progress */}
          <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-trust-blue-light/70 border border-primary/20 relative">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-label-lg text-primary font-bold">
                  Verificación Domiciliaria en Reynosa
                </h3>
                <span className="text-label-sm text-primary font-bold">En Proceso ⏱</span>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Visita presencial del equipo auditor de ServiciosHogar a tu taller o residencia en Reynosa para inspección de herramienta y arraigo local.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={onScheduleVisit}
                  className="bg-primary text-white px-3 py-1.5 rounded-lg text-label-md font-bold hover:bg-trust-blue-dark transition-colors flex items-center gap-1 shadow-xs active:scale-95 duration-100"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Agendar Fecha de Visita</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Pending Lock */}
          <div className="flex items-start space-x-3 p-2.5 rounded-lg bg-surface-container-low border border-border-subtle opacity-80">
            <div className="w-7 h-7 rounded-full bg-surface-dim text-outline flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-label-lg text-text-muted font-bold">
                  Activación de Insignia de Confianza
                </h3>
                <span className="text-label-sm text-text-muted">Bloqueado</span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5">
                Sello dorado de 'Técnico Certificado de Confianza', 3x más solicitudes de servicio y posicionamiento orgánico preferente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAT Tax Compliance Module */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-escrow-shield text-[20px]">account_balance</span>
            <h2 className="text-headline-sm text-text-primary font-bold">Claridad Fiscal SAT México</h2>
          </div>
          <span className="text-label-sm bg-surface-container-high text-primary px-2 py-0.5 rounded font-bold">
            Régimen Plataformas
          </span>
        </div>

        <p className="text-body-md text-text-muted leading-relaxed">
          Cumplimiento automático con retenciones legales sin complicaciones contables. Tu dinero ingresa formalizado a tu cuenta bancaria.
        </p>

        {/* Tax breakdown cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-text-muted uppercase font-bold">Retención ISR</span>
              <span className="text-label-sm text-secondary font-bold">Tasa Reducida</span>
            </div>
            <div className="text-currency-display text-text-primary mt-1 font-bold">2.1%</div>
            <p className="text-body-sm text-text-muted mt-1">
              Con RFC registrado (frente al 20% de tasa castigo sin RFC).
            </p>
          </div>

          <div className="p-3 bg-surface-alt rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-text-muted uppercase font-bold">Retención IVA</span>
              <span className="text-label-sm text-primary font-bold">50% Trasladado</span>
            </div>
            <div className="text-currency-display text-text-primary mt-1 font-bold">8.0%</div>
            <p className="text-body-sm text-text-muted mt-1">
              Directo a declaración prellenada mensual del SAT.
            </p>
          </div>
        </div>

        <div className="bg-trust-blue-light/60 p-3 rounded-lg border border-primary/15 flex items-start space-x-2.5">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">receipt_long</span>
          <div className="text-body-sm text-text-primary leading-snug">
            <span className="font-bold text-label-md">CFDI Mensual Automatizado:</span> ServiciosHogar emite y timbra mensualmente el Complemento de Servicios de Plataformas Tecnológicas sin que tengas que pagar un contador externo.
          </div>
        </div>
      </section>

      {/* Benefits of the Partnership */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <h2 className="text-headline-sm text-text-primary font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">handshake</span>
          <span>Ventajas de la Alianza ServiciosHogar</span>
        </h2>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Benefit 1 */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border-subtle bg-surface-card">
            <div className="w-8 h-8 rounded-full bg-emerald-safe-bg text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">percent</span>
            </div>
            <div>
              <h3 className="text-label-lg text-text-primary font-bold">85% Neto para el Técnico (Split 85/15)</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Sin cobro de membresías mensuales. Solo aportas el 15% de comisión sobre trabajos concretados y pagados con éxito.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border-subtle bg-surface-card">
            <div className="w-8 h-8 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </div>
            <div>
              <h3 className="text-label-lg text-text-primary font-bold">Póliza de Seguro de Responsabilidad Civil</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Protección de cobertura contra daños a terceros en propiedades residenciales e industriales durante tu servicio activo.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border-subtle bg-surface-card">
            <div className="w-8 h-8 rounded-full bg-amber-rating-bg text-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">group_add</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-label-lg text-text-primary font-bold">Bono de $150.00 MXN por Referido</h3>
                <span className="text-label-sm bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.2 rounded font-bold">
                  Ilimitado
                </span>
              </div>
              <p className="text-body-sm text-text-muted mt-0.5">
                Gana $150 MXN directos por cada colega plomero, electricista o cerrajero en Reynosa que complete su verificación y 1er trabajo.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border-subtle bg-surface-card">
            <div className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">thumbs_up_down</span>
            </div>
            <div>
              <h3 className="text-label-lg text-text-primary font-bold">Calificación Recíproca & Chat de Evidencia</h3>
              <p className="text-body-sm text-text-muted mt-0.5">
                Tú también evalúas al cliente. Teléfonos enmascarados y fotos de evidencia para protegerte de reportes abusivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reseñas de Clientes */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-amber-dark text-[20px]">star</span>
            <h2 className="text-headline-sm text-text-primary font-bold">Reseñas de Clientes</h2>
          </div>
          <span className="text-label-sm bg-amber-500/10 text-amber-dark px-2 py-0.5 rounded font-bold">
            {isTechnician ? 'Recibidas' : 'Enviadas'}
          </span>
        </div>

        <p className="text-body-sm text-text-muted leading-relaxed">
          {isTechnician
            ? 'Calificaciones y comentarios de tus clientes. Un buen desempeño te da acceso al Distintivo de Confianza.'
            : 'Tus evaluaciones a técnicos. Tu opinión ayuda a mantener la calidad del servicio.'}
        </p>

        <div className="bg-surface-alt rounded-lg p-3 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-headline-md font-bold text-text-primary block">4.8</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={`material-symbols-outlined text-[14px] ${s <= 4 ? 'material-symbols-fill text-amber-dark' : 'text-amber-dark/30'}`}>star</span>
                ))}
              </div>
              <span className="text-[10px] text-text-muted">Promedio</span>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted w-3">{star}</span>
                  <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-amber-dark rounded-full" style={{ width: star >= 4 ? '85%' : star === 3 ? '10%' : '5%' }} />
                  </div>
                  <span className="text-[10px] text-text-muted w-6 text-right">{star >= 4 ? (star === 5 ? '68%' : '17%') : star === 3 ? '10%' : '5%'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Expediente Digital del Técnico */}
      <section className="p-4 bg-trust-blue-light/60 rounded-xl border border-primary/20 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-primary text-[20px]">upload_file</span>
          <h3 className="text-headline-sm text-text-primary font-bold">Expediente Digital del Técnico</h3>
        </div>
        <p className="text-body-sm text-text-muted">
          Carga tus constancias de capacitación técnica (DC-3 STPS, diplomas o certificaciones de marcas) para acelerar tu distintivo dorado.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUploadDoc}
            className="flex items-center justify-center space-x-1.5 p-2.5 bg-surface-card border border-border-subtle rounded-lg text-label-md font-bold text-text-primary hover:bg-surface-container transition-colors active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">add_a_photo</span>
            <span>Subir Documento</span>
          </button>
          <button
            onClick={onWhatsAppHelp}
            className="flex items-center justify-center space-x-1.5 p-2.5 bg-surface-card border border-border-subtle rounded-lg text-label-md font-bold text-text-primary hover:bg-surface-container transition-colors active:scale-95 duration-100"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">support_agent</span>
            <span>Dudas por WhatsApp</span>
          </button>
        </div>
      </section>

      {/* Mis Órdenes - NUEVO */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-escrow-shield text-[20px]">assignment</span>
            <h2 className="text-headline-sm text-text-primary font-bold">Mis Órdenes de Servicio</h2>
          </div>
        </div>
        <p className="text-body-sm text-text-muted">
          Gestiona tus servicios asignados: inicia ruta, llega al domicilio, sube evidencia y libera fondos con PIN del cliente.
        </p>
        <button
          onClick={() => onNavigate('tecnico')}
          className="w-full bg-escrow-shield hover:bg-emerald-safe text-white py-3 px-4 rounded-lg font-bold text-label-lg flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">list_alt</span>
          <span>Ver Mis Órdenes</span>
        </button>
      </section>

      {/* Programa de Referidos */}
      <section className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="material-symbols-outlined text-amber-dark text-[20px]">group_add</span>
          <h2 className="text-headline-sm text-text-primary font-bold">Programa de Referidos</h2>
        </div>
        <p className="text-body-sm text-text-muted">
          {isTechnician
            ? 'Invita a otros técnicos y gana $150 MXN por cada referido que complete su primer servicio.'
            : 'Comparte tu código y gana $100 MXN de descuento en tu próximo servicio por cada referido.'}
        </p>

        {referralCode && (
          <div className="bg-surface-alt rounded-lg p-3 border border-border-subtle">
            <p className="text-label-sm text-text-muted mb-1">Tu código de referido:</p>
            <div className="flex items-center gap-2">
              <span className="text-headline-sm font-bold text-primary tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-label-sm font-bold active:scale-95 transition-transform"
              >
                {copiedCode ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-alt rounded-lg p-2 text-center">
            <span className="text-headline-sm font-bold text-primary block">{referralStats.totalReferrals}</span>
            <span className="text-label-sm text-text-muted">Referidos totales</span>
          </div>
          <div className="bg-surface-alt rounded-lg p-2 text-center">
            <span className="text-headline-sm font-bold text-escrow-shield block">{referralStats.completedReferrals}</span>
            <span className="text-label-sm text-text-muted">Completados</span>
          </div>
        </div>

        <button
          onClick={() => {
            const text = isTechnician
              ? `Únete como técnico en SuitServiHogar y gana por servicio. Usa mi código: ${referralCode}`
              : `Obtén servicios técnicos de confianza en Reynosa. Usa mi código ${referralCode} para $100 MXN de descuento.`;
            navigator.share?.({ title: 'SuitServiHogar', text });
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-alt border border-border-subtle rounded-lg text-label-md font-bold text-text-primary active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>Compartir código</span>
        </button>
      </section>

      {/* Primary Action CTA Button */}
      <div className="pt-2 pb-4 space-y-2">
        <button
          onClick={onScheduleVisit}
          className="w-full h-12 bg-primary hover:bg-trust-blue-dark text-on-primary font-label-lg font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-transform duration-100 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">home_pin</span>
          <span>Agendar Visita de Verificación Domiciliaria</span>
        </button>
        <p className="text-center text-label-sm text-text-muted">
          Disponibilidad en sectores: Las Fuentes, Jarachina, Ribereña, Del Prado e Hidalgo.
        </p>
      </div>

      <button
        onClick={() => onNavigate('glossary')}
        className="w-full bg-surface-alt hover:bg-border-subtle py-3 rounded-lg text-label-md text-text-secondary font-medium flex items-center gap-2 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">menu_book</span>
        <span>Glossario Reynosa</span>
      </button>

      {isTechnician && (
        <button
          onClick={() => onNavigate('admin')}
          className="w-full bg-trust-blue-light hover:bg-trust-blue py-3 rounded-lg text-label-md text-primary font-medium flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
          <span>Panel de Administración</span>
        </button>
      )}
    </div>
  );
};
