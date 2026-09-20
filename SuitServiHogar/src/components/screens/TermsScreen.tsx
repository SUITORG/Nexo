import React from 'react';
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from '../../data/legal/terms';

interface TermsScreenProps {
  onBack: () => void;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-alt transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-text-primary">arrow_back</span>
          </button>
          <div>
            <h1 className="text-headline-lg text-text-primary font-bold">Términos y Condiciones</h1>
            <p className="text-label-sm text-text-muted">Última actualización: {TERMS_LAST_UPDATED}</p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle">
          <p className="text-body-md text-text-primary">
            Al utilizar ServiciosHogar Reynosa, usted acepta estos Términos y Condiciones.
            Lea cuidadosamente antes de continuar.
          </p>
        </div>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, i) => (
          <div key={i} className="bg-surface-card rounded-xl p-4 border border-border-subtle space-y-3">
            <h2 className="text-label-lg text-text-primary font-bold">{section.title}</h2>
            <div className="text-body-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {section.content}
            </div>
          </div>
        ))}

        {/* Footer */}
        <button
          onClick={onBack}
          className="w-full py-3 bg-primary hover:bg-trust-blue-dark text-on-primary rounded-lg font-label-lg transition-all active:scale-98"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
