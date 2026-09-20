import React from 'react';
import { Currency, ScreenId } from '../types';
import { OnlineStatusIndicator } from './OnlineStatusBanner';

interface HeaderProps {
  currentScreen: ScreenId;
  selectedColonia: string;
  currency: Currency;
  onSelectColoniaClick: () => void;
  onToggleCurrency: (curr: Currency) => void;
  onBack?: () => void;
  onShare?: () => void;
  user?: any;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  selectedColonia,
  currency,
  onSelectColoniaClick,
  onToggleCurrency,
  onBack,
  onShare,
  user,
  onLogout,
}) => {
  const isDetailScreen = currentScreen === 'solicitud' || currentScreen === 'escrow';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 h-14 max-w-lg mx-auto bg-surface-container-lowest border-b border-border-subtle shadow-xs">
      <div className="flex items-center space-x-2 overflow-hidden">
        {isDetailScreen && onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-primary hover:bg-trust-blue-light rounded-lg transition-colors active:scale-95 duration-100 flex items-center justify-center"
            title="Regresar"
            aria-label="Regresar"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>
        )}

        <button
          onClick={onSelectColoniaClick}
          className="flex items-center space-x-1.5 text-left group hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
          <span className="text-headline-sm text-primary font-bold tracking-tight truncate max-w-[190px] sm:max-w-none">
            Reynosa • {selectedColonia}
          </span>
          <span className="material-symbols-outlined text-text-muted text-[18px] group-hover:text-primary transition-colors">
            expand_more
          </span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {currentScreen === 'inicio' && (
          <span className="text-label-sm font-bold text-escrow-shield bg-emerald-safe-bg border border-secondary-container px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Oficial
          </span>
        )}

        {currentScreen === 'explorar' && (
          <span className="text-label-sm font-semibold text-primary bg-trust-blue-light border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">explore</span>
            GPS ±200m
          </span>
        )}

        {/* Currency Switcher Pill + Online Status */}
        <div className="flex items-center space-x-2">
          <OnlineStatusIndicator heartbeatUrl="/" heartbeatInterval={30000} />
          
          <div className="flex items-center bg-trust-blue-light rounded-full p-0.5 border border-border-subtle">
            <button
              onClick={() => onToggleCurrency('MXN')}
              className={`px-2 py-0.5 text-label-sm rounded-full font-bold transition-all ${
                currency === 'MXN'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              MXN
            </button>
            <button
              onClick={() => onToggleCurrency('USD')}
              className={`px-2 py-0.5 text-label-sm rounded-full font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              USD
            </button>
          </div>
        </div>

        {currentScreen === 'escrow' && onShare && (
          <button
            onClick={onShare}
            className="p-1 text-primary hover:bg-trust-blue-light rounded-lg transition-colors"
            title="Compartir comprobante"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        )}

        {/* User Avatar / Login */}
        {user ? (
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-label-sm font-bold hover:opacity-80 transition-opacity"
            title="Cerrar sesión"
          >
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </button>
        ) : (
          <button
            onClick={() => {}}
            className="p-1 text-primary hover:bg-trust-blue-light rounded-lg transition-colors"
            title="Iniciar sesión"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;