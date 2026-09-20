import React from 'react';
import { GLOSSARY_REYNOSA } from '../../data/glossary';

interface GlossaryScreenProps {
  onBack: () => void;
}

export const GlossaryScreen: React.FC<GlossaryScreenProps> = ({ onBack }) => {
  return (
    <div className="space-y-4 pb-14">
      <div className="flex items-center gap-3 px-1">
        <button onClick={onBack} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
          <span className="material-symbols-outlined text-text-primary">arrow_back</span>
        </button>
        <h1 className="text-headline-lg font-bold text-text-primary">Glossario Reynosa</h1>
      </div>

      <p className="text-body-sm text-text-muted px-1">
        Términos técnicos y locale utilizados en la plataforma.
      </p>

      <div className="space-y-3">
        {GLOSSARY_REYNOSA.map((entry, i) => (
          <section key={i} className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg font-bold text-text-primary">{entry.term}</h3>
              {entry.localName !== entry.term && (
                <span className="text-label-sm text-primary bg-trust-blue-light px-2 py-0.5 rounded-full font-medium">
                  {entry.localName}
                </span>
              )}
            </div>
            <p className="text-body-sm text-text-muted leading-relaxed">{entry.definition}</p>
            <p className="text-label-sm text-escrow-shield italic">"{entry.example}"</p>
          </section>
        ))}
      </div>
    </div>
  );
};
