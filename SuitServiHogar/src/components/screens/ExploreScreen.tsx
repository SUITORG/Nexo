import React, { useState } from 'react';
import { Currency, Technician } from '../../types';

interface ExploreScreenProps {
  currency: Currency;
  selectedColonia: string;
  onSelectColoniaClick: () => void;
  onToggleCurrency: (curr: Currency) => void;
  onSelectTechnician: (tech: Technician) => void;
  onBookTechnician: (tech: Technician) => void;
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (cat: string) => void;
  technicians: Technician[];
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  currency,
  selectedColonia,
  onSelectColoniaClick,
  onToggleCurrency,
  onSelectTechnician,
  onBookTechnician,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  technicians
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('5km');
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);

  const categories = [
    { id: 'climas', name: 'Climas / Minisplits', count: 24, icon: 'ac_unit' },
    { id: 'plomeria', name: 'Plomería', count: 18, icon: 'plumbing' },
    { id: 'electricidad', name: 'Electricidad', count: 12, icon: 'bolt' },
    { id: 'cerrajeria', name: 'Cerrajería', count: 9, icon: 'key' },
    { id: 'electro', name: 'Línea Blanca', count: 7, icon: 'kitchen' },
    { id: 'herreria', name: 'Herrería & Portones', count: 5, icon: 'fence' },
    { id: 'pintores', name: 'Pintores', count: 15, icon: 'format_paint' },
    { id: 'albaniles', name: 'Albañiles', count: 12, icon: 'construction' },
    { id: 'yeseros', name: 'Yeseros', count: 8, icon: 'wall_art' },
    { id: 'impermeabilizante', name: 'Impermeabilizante', count: 6, icon: 'water_drop' },
    { id: 'jardineria', name: 'Jardinería', count: 10, icon: 'yard' },
    { id: 'escombro', name: 'Recoger Escombro', count: 4, icon: 'delete_sweep' },
    { id: 'carpinteria', name: 'Carpintería', count: 8, icon: 'table_chart' }
  ];

  const displayedCategories = showAllSpecialties ? categories : categories.slice(0, 3);

  // Filter technicians based on search & category
  const filteredTechs = technicians.filter((tech) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        tech.name.toLowerCase().includes(q) ||
        tech.title.toLowerCase().includes(q) ||
        tech.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedCategoryFilter === 'plomeria') {
      return tech.id === 'carlos-mendoza';
    }
    if (selectedCategoryFilter === 'electricidad') {
      return tech.id === 'hector-villarreal';
    }
    if (selectedCategoryFilter === 'climas') {
      return tech.id === 'roberto-garza' || tech.id === 'juan-carlos-mendez';
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-14">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <div className="relative flex-1 flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-text-muted text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej. Fuga de agua, minisplit, corto..."
            className="w-full pl-10 pr-24 py-2.5 bg-surface-card border border-border-subtle rounded-xl text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
          />
          <button
            onClick={() =>
              setSelectedDistance((prev) =>
                prev === '5km' ? '10km' : prev === '10km' ? '15km' : '5km'
              )
            }
            className="absolute right-2 px-2.5 py-1 bg-trust-blue-light text-primary rounded-lg text-label-sm font-bold flex items-center gap-1 hover:bg-primary hover:text-white transition-colors border border-primary/20"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            Radio {selectedDistance}
          </button>
        </div>
      </div>

      {/* Sector Sub-header */}
      <div className="flex items-center justify-between text-body-sm px-1">
        <div className="flex items-center space-x-1.5 text-text-muted">
          <span className="material-symbols-outlined text-escrow-shield text-[16px]">verified</span>
          <span className="font-medium">Sector Maquiladoras & Residencial</span>
        </div>
        <button
          onClick={onSelectColoniaClick}
          className="text-primary font-bold hover:underline"
        >
          Cambiar colonia
        </button>
      </div>

      {/* Tabulador de Precios Regulado */}
      <section className="bg-surface-card rounded-xl p-3.5 border border-border-subtle shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-label-lg font-bold text-text-primary">Tabulador de Precios</h2>
              <span className="text-label-sm font-bold bg-trust-blue-light text-primary px-2 py-0.5 rounded-full border border-primary/20">
                Regulado
              </span>
            </div>
            <p className="text-body-sm text-text-muted mt-0.5">
              Tipo de cambio fronterizo ref: <span className="font-bold text-text-primary">$18.80 MXN / USD</span>
            </p>
          </div>

          {/* Currency Toggle inside tabulador */}
          <div className="flex items-center bg-trust-blue-light rounded-lg p-1 border border-border-subtle">
            <button
              onClick={() => onToggleCurrency('MXN')}
              className={`px-3 py-1 text-label-md rounded font-bold transition-all ${
                currency === 'MXN'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              MXN $
            </button>
            <button
              onClick={() => onToggleCurrency('USD')}
              className={`px-3 py-1 text-label-md rounded font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              USD $
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-label-sm">
          <div className="flex items-center space-x-1.5 text-escrow-shield font-medium">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>Garantía de Depósito Escrow Stripe Connect</span>
          </div>
          <span className="text-primary font-bold">Tarifa Blindada</span>
        </div>
      </section>

      {/* Especialidades Activas */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm font-bold text-text-primary">Especialidades Activas</h2>
          <button
            onClick={() => setShowAllSpecialties(!showAllSpecialties)}
            className="text-body-sm font-bold text-primary hover:underline"
          >
            {showAllSpecialties ? 'Menos' : 'Ver todas (12)'}
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll">
          {displayedCategories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  onSelectCategoryFilter(isSelected ? '' : cat.id)
                }
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-label-md font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface-card text-text-primary border border-border-subtle hover:bg-surface-alt'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
                <span
                  className={`text-label-sm px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-container text-text-muted'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filtro Antifraude & Seguridad Física */}
      <section className="bg-emerald-safe-bg/60 border border-secondary-container rounded-xl p-3.5 flex items-start space-x-3 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-secondary text-white flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
        </div>
        <div>
          <h3 className="text-label-lg font-bold text-text-primary">
            Filtro Antifraude & Seguridad Física
          </h3>
          <p className="text-body-sm text-text-muted mt-0.5 leading-relaxed">
            Técnicos auditados en domicilio fiscal de Reynosa con retención SAT (2.1% ISR / 8% IVA) y fondo Escrow asegurado.
          </p>
        </div>
      </section>

      {/* Técnicos de Confianza Disponibles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-headline-sm font-bold text-text-primary">
              Técnicos de Confianza Disponibles
            </h2>
            <p className="text-body-sm text-text-muted">
              Mostrando profesionales con certificación domiciliaria activa
            </p>
          </div>
          <span className="text-label-sm font-bold bg-trust-blue-light text-primary px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
            {selectedColonia} ({filteredTechs.length})
          </span>
        </div>

        {/* List of Cards */}
        <div className="space-y-3.5">
          {filteredTechs.map((tech) => (
            <div
              key={tech.id}
              className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs hover:shadow-sm transition-all duration-150 space-y-3"
            >
              {/* Top Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-label-sm font-bold px-2 py-0.5 rounded-full bg-amber-rating-bg text-tertiary-container border border-tertiary-fixed-dim">
                  <span className="material-symbols-outlined text-[13px]">military_tech</span>
                  Técnico Certificado de Confianza
                </span>
                <span className="inline-flex items-center gap-1 text-label-sm font-bold px-2 py-0.5 rounded-full bg-emerald-safe-bg text-escrow-shield border border-secondary-container">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Depósito Escrow Protegido
                </span>
              </div>

              {/* Technician Info */}
              <div className="flex items-start space-x-3">
                <div className="relative shrink-0">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-surface-card shadow-xs"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 text-[10px] flex items-center justify-center border border-surface-card">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-headline-sm font-bold text-text-primary truncate">
                      {tech.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-label-md font-bold text-text-primary bg-surface-alt px-1.5 py-0.5 rounded">
                      <span className="material-symbols-outlined text-tertiary-container text-[16px] material-symbols-fill">
                        star
                      </span>
                      <span>{tech.rating.toFixed(1)}</span>
                      <span className="text-text-muted font-normal">({tech.reviewCount})</span>
                    </div>
                  </div>

                  <p className="text-body-sm font-semibold text-primary mt-0.5">
                    {tech.title}
                  </p>

                  <div className="flex items-center space-x-2 text-body-sm text-text-muted mt-1">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">near_me</span>
                      {tech.distance}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      INE + Biometría
                    </span>
                  </div>
                </div>
              </div>

              {/* Skill Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tech.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-label-sm font-medium px-2 py-0.5 rounded bg-surface-alt text-text-muted border border-border-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Price Box */}
              <div className="bg-surface-alt rounded-lg p-3 border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase block">
                    TARIFA OFICIAL TABULADOR
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-headline-lg font-bold text-text-primary tracking-tight">
                      ${tech.priceMxn.toFixed(2)} MXN
                    </span>
                    <span className="text-body-sm font-semibold text-text-muted">
                      /~${tech.priceUsd.toFixed(2)} USD
                    </span>
                  </div>
                  <p className="text-body-sm text-text-muted mt-0.5">
                    {tech.priceDescription}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block text-label-sm font-bold text-escrow-shield bg-emerald-safe-bg border border-secondary-container px-2 py-1 rounded">
                    {tech.availabilityBadge}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSelectTechnician(tech)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-surface-card hover:bg-surface-alt text-primary border border-primary/30 rounded-lg text-label-md font-bold transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>Ver Perfil</span>
                </button>
                <button
                  onClick={() => onBookTechnician(tech)}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-primary hover:bg-trust-blue-dark text-white rounded-lg text-label-md font-bold shadow-xs transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                  <span>Contratar Garantía</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escrow Educational Footer Card */}
      <section className="bg-emerald-safe-bg/40 border border-secondary/30 rounded-xl p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center space-x-2 text-escrow-shield">
          <span className="material-symbols-outlined text-[22px]">verified</span>
          <h3 className="text-headline-sm font-bold text-text-primary">
            ¿Cómo funciona la Garantía Escrow Fronteriza?
          </h3>
        </div>
        <p className="text-body-md text-text-muted leading-relaxed">
          Tu pago permanece protegido en una cuenta inmutable de Stripe Connect. El técnico inicia el servicio y el dinero solo se libera cuando confirmes la conformidad del trabajo mediante fotos de evidencia.
        </p>

        <div className="flex items-center space-x-4 pt-1 text-label-sm text-secondary font-bold">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Sin cobros ocultos
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Facturación CFDI 4.0
          </span>
        </div>
      </section>
    </div>
  );
};
