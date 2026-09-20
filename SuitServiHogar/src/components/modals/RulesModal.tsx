import React from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface-card w-full max-w-md rounded-2xl border border-border-subtle shadow-xl overflow-hidden animate-scale-up space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[22px]">gavel</span>
            <h3 className="text-headline-sm font-bold text-text-primary">
              Reglas del Protocolo Antifuga
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-surface-container flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-body-sm text-text-muted">
          <div className="p-3 bg-surface-alt rounded-xl border border-border-subtle">
            <h4 className="font-bold text-text-primary mb-1">1. Registro de Estado Previo</h4>
            <p>
              Toda orden debe contener fotografía de la placa, modelo y estado físico actual del equipo o avería. Esto impide que el técnico cobre conceptos no autorizados a su llegada.
            </p>
          </div>

          <div className="p-3 bg-surface-alt rounded-xl border border-border-subtle">
            <h4 className="font-bold text-text-primary mb-1">2. Tarifa Congelada sin Sorpresas</h4>
            <p>
              Si la falla coincide con la evidencia enviada, el técnico no puede exigir pagos extras en efectivo. Cualquier adición debe formalizarse vía la plataforma.
            </p>
          </div>

          <div className="p-3 bg-surface-alt rounded-xl border border-border-subtle">
            <h4 className="font-bold text-text-primary mb-1">3. Cadena de Custodia Inmutable</h4>
            <p>
              Las fotos quedan registradas con huella criptográfica de tiempo y coordenadas aproximadas de la zona para resolver cualquier disputa de fondos en Stripe Connect.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-trust-blue-dark text-white font-label-md font-bold transition-all active:scale-98"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
