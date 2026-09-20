import React, { useState } from 'react';

interface ScheduleVisitModalProps {
  onClose: () => void;
  onScheduled: (date: string, time: string) => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  onClose,
  onScheduled
}) => {
  const [date, setDate] = useState('16 Octubre 2024');
  const [time, setTime] = useState('10:00 AM - 12:00 PM');
  const [address, setAddress] = useState('Calle Praxedis Balboa #412, Col. Las Fuentes');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduled(date, time);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface-card w-full max-w-md rounded-2xl border border-border-subtle shadow-xl overflow-hidden animate-scale-up space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
            <h3 className="text-headline-sm font-bold text-text-primary">
              Agendar Auditoría Domiciliaria
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-surface-container flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-body-sm text-text-muted">
          Un inspector acreditado de ServiciosHogar visitará tu domicilio o taller en Reynosa para verificar herramientas de trabajo, comprobante de domicilio y arraigo local.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-label-sm font-bold text-text-muted uppercase block mb-1">
              Dirección de Taller / Domicilio
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-body-sm bg-surface-alt border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-label-sm font-bold text-text-muted uppercase block mb-1">
                Fecha de Visita
              </label>
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-body-sm bg-surface-alt border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="16 Octubre 2024">Mañana, 16 Oct</option>
                <option value="17 Octubre 2024">Jueves, 17 Oct</option>
                <option value="18 Octubre 2024">Viernes, 18 Oct</option>
                <option value="19 Octubre 2024">Sábado, 19 Oct</option>
              </select>
            </div>

            <div>
              <label className="text-label-sm font-bold text-text-muted uppercase block mb-1">
                Horario Preferido
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-body-sm bg-surface-alt border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-safe-bg/60 border border-secondary-container rounded-lg text-body-sm text-text-primary flex items-start gap-2">
            <span className="material-symbols-outlined text-escrow-shield text-[18px] shrink-0 mt-0.5">
              verified
            </span>
            <p className="leading-snug">
              Al aprobarse la auditoría física, se activará de inmediato tu sello dorado de <strong>Técnico Certificado de Confianza</strong> y el split 85/15.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border-subtle font-label-md font-bold text-text-primary hover:bg-surface-alt transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-trust-blue-dark text-white font-label-md font-bold shadow-xs transition-all active:scale-98"
            >
              Confirmar Cita de Auditoría
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
