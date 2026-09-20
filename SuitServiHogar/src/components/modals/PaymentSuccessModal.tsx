import React from 'react';
import { EscrowOrder } from '../../types';

interface PaymentSuccessModalProps {
  order: EscrowOrder;
  onViewSettlement: () => void;
  onClose: () => void;
  onOpenChat?: () => void;
  onReview?: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  order,
  onViewSettlement,
  onClose,
  onOpenChat,
  onReview
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface-card w-full max-w-md rounded-2xl border border-border-subtle shadow-2xl overflow-hidden animate-scale-up space-y-4 p-5 text-center">
        {/* Animated Check */}
        <div className="w-16 h-16 rounded-full bg-emerald-safe-bg text-secondary border-2 border-secondary-container flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-[36px] material-symbols-fill">
            check_circle
          </span>
        </div>

        <div>
          <span className="text-label-sm font-bold bg-emerald-safe-bg text-escrow-shield border border-secondary-container px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Escrow Protegido • Stripe Connect
          </span>
          <h3 className="text-headline-md font-bold text-text-primary mt-2">
            ¡Custodia Escrow Activada!
          </h3>
          <p className="text-body-md text-text-muted mt-1 leading-relaxed">
            Tu pago de <strong className="text-text-primary">${order.totalMxn.toFixed(2)} MXN</strong> está resguardado en custodia digital inmutable.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-surface-alt rounded-xl p-3.5 border border-border-subtle text-left space-y-2">
          <div className="flex justify-between items-center text-body-sm">
            <span className="text-text-muted">Orden de Servicio:</span>
            <span className="font-mono font-bold text-primary">{order.id}</span>
          </div>
          <div className="flex justify-between items-center text-body-sm">
            <span className="text-text-muted">Técnico Asignado:</span>
            <span className="font-bold text-text-primary">{order.technician.name}</span>
          </div>
          <div className="flex justify-between items-center text-body-sm">
            <span className="text-text-muted">Horario Coordinado:</span>
            <span className="font-bold text-text-primary">
              {order.date} • {order.timeWindow}
            </span>
          </div>
          <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
            <div>
              <span className="text-[11px] font-bold text-text-muted uppercase block">
                PIN de Liberación al Técnico
              </span>
              <span className="text-headline-sm font-bold font-mono tracking-widest text-primary">
                8821
              </span>
            </div>
            <span className="text-label-sm text-secondary bg-emerald-safe-bg border border-secondary/30 px-2 py-1 rounded font-bold">
              Solo dar al terminar
            </span>
          </div>
        </div>

        <div className="p-3 bg-trust-blue-light/70 rounded-xl text-body-sm text-text-primary text-left flex items-start gap-2 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
            shield
          </span>
          <p className="leading-snug">
            El técnico iniciará el traslado. Tu dirección exacta se liberará únicamente cuando esté en ruta hacia tu domicilio.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onViewSettlement}
            className="w-full py-3 px-4 bg-primary hover:bg-trust-blue-dark text-white rounded-xl font-label-md font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Ver Desglose de Liquidación Escrow</span>
          </button>
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full py-2.5 px-4 bg-trust-blue-light hover:bg-primary/10 text-primary rounded-xl font-label-md font-bold flex items-center justify-center gap-2 transition-colors border border-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Chat con {order.technician.name}</span>
            </button>
          )}
          {onReview && (
            <button
              onClick={onReview}
              className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-dark rounded-xl font-label-md font-bold flex items-center justify-center gap-2 transition-colors border border-amber-500/20"
            >
              <span className="material-symbols-outlined text-[18px]">star</span>
              <span>Calificar a {order.technician.name}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-surface-alt hover:bg-surface-container text-text-muted hover:text-text-primary rounded-xl font-label-md font-semibold transition-colors"
          >
            Regresar al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};
