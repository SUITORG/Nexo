import React from 'react';
import { Technician } from '../../types';

interface TechnicianProfileModalProps {
  technician: Technician | null;
  onClose: () => void;
  onBook: (tech: Technician) => void;
}

export const TechnicianProfileModal: React.FC<TechnicianProfileModalProps> = ({
  technician,
  onClose,
  onBook
}) => {
  if (!technician) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-surface-card w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto border border-border-subtle shadow-xl animate-slide-up">
        {/* Modal Header */}
        <div className="sticky top-0 bg-surface-card/95 backdrop-blur-sm border-b border-border-subtle p-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
            <h2 className="text-headline-sm font-bold text-text-primary">
              Expediente del Profesional
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-surface-container flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Technician Profile Card */}
          <div className="flex items-start space-x-3.5">
            <div className="relative">
              <img
                src={technician.avatar}
                alt={technician.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full p-1 text-[11px] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[13px] material-symbols-fill">verified</span>
              </span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-sm font-bold text-text-primary">
                  {technician.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-label-sm font-bold bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px] text-tertiary-container material-symbols-fill">
                    star
                  </span>
                  {technician.rating.toFixed(1)} ({technician.reviewCount})
                </span>
              </div>
              <p className="text-body-sm font-bold text-primary mt-0.5">
                {technician.title}
              </p>
              <p className="text-body-sm text-text-muted mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-escrow-shield">location_on</span>
                {technician.distance} • Nivel {technician.level || 4} de Confianza
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 text-label-sm font-bold px-2.5 py-1 rounded-full bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim">
              <span className="material-symbols-outlined text-[14px]">military_tech</span>
              Técnico Certificado de Confianza
            </span>
            <span className="inline-flex items-center gap-1 text-label-sm font-bold px-2.5 py-1 rounded-full bg-emerald-safe-bg text-escrow-shield border border-secondary-container">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Depósito Escrow Protegido
            </span>
            <span className="inline-flex items-center gap-1 text-label-sm font-bold px-2.5 py-1 rounded-full bg-trust-blue-light text-primary border border-border-subtle">
              <span className="material-symbols-outlined text-[14px]">home_pin</span>
              Auditado Presencialmente Reynosa
            </span>
          </div>

          {/* Bio */}
          {technician.bio && (
            <div className="p-3 bg-surface-alt rounded-xl border border-border-subtle">
              <h4 className="text-label-sm font-bold uppercase text-text-muted mb-1">
                Perfil y Arraigo Local
              </h4>
              <p className="text-body-sm text-text-primary leading-relaxed">{technician.bio}</p>
            </div>
          )}

          {/* Certifications list */}
          {technician.certifications && (
            <div className="space-y-2">
              <h4 className="text-label-md font-bold text-text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                <span>Documentos & Cotejos Verificados</span>
              </h4>
              <div className="space-y-1.5">
                {technician.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-safe-bg/60 border border-secondary-container/60 text-body-sm"
                  >
                    <span className="font-semibold text-text-primary">{cert}</span>
                    <span className="text-label-sm font-bold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check</span> Validado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Box */}
          <div className="bg-surface-alt rounded-xl p-3.5 border border-border-subtle flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Tarifa Oficial Tabulador
              </span>
              <div className="text-headline-lg font-bold text-text-primary">
                ${technician.priceMxn.toFixed(2)} MXN
              </div>
              <span className="text-body-sm text-text-muted">
                ~${technician.priceUsd.toFixed(2)} USD (Fijado sin fluctuación)
              </span>
            </div>
            <div className="text-right">
              <span className="text-label-sm font-bold text-escrow-shield bg-emerald-safe-bg border border-secondary-container px-2.5 py-1 rounded-md block">
                {technician.availabilityBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="sticky bottom-0 bg-surface-card p-4 border-t border-border-subtle flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-border-subtle font-label-md font-bold text-text-primary hover:bg-surface-alt transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              onBook(technician);
            }}
            className="flex-2 py-3 px-4 rounded-xl bg-primary hover:bg-trust-blue-dark text-white font-label-md font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Contratar con Garantía Escrow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
