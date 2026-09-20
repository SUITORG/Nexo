import React, { useState } from 'react';
import { COLONIAS_REYNOSA } from '../../data/mockData';

interface ColoniaSelectorModalProps {
  selectedColonia: string;
  onSelect: (colonia: string) => void;
  onClose: () => void;
}

export const ColoniaSelectorModal: React.FC<ColoniaSelectorModalProps> = ({
  selectedColonia,
  onSelect,
  onClose
}) => {
  const [query, setQuery] = useState('');

  const filtered = COLONIAS_REYNOSA.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface-card w-full max-w-md rounded-2xl border border-border-subtle shadow-xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
            <h3 className="text-headline-sm font-bold text-text-primary">
              Seleccionar Colonia en Reynosa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-surface-container flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border-subtle">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar sector, colonia o parque industrial..."
              className="w-full pl-9 pr-3 py-2 text-body-sm bg-surface-alt border border-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-border-subtle">
          {filtered.map((colonia) => {
            const isSelected = colonia === selectedColonia;
            return (
              <button
                key={colonia}
                onClick={() => {
                  onSelect(colonia);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-trust-blue-light text-primary font-bold'
                    : 'hover:bg-surface-alt text-text-primary'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected ? 'text-primary' : 'text-text-muted'
                    }`}
                  >
                    home
                  </span>
                  <span className="text-body-md">{colonia}</span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-surface-alt border-t border-border-subtle text-body-sm text-text-muted text-center flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-escrow-shield">verified</span>
          <span>Cobertura de técnicos con auditoría física en Reynosa, Tamaulipas.</span>
        </div>
      </div>
    </div>
  );
};
