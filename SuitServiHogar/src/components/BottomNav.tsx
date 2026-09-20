import React from 'react';
import { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'explorar', label: 'Explorar', icon: 'search' },
    { id: 'escrow', label: 'Garantía Escrow', icon: 'shield_with_heart' },
    { id: 'perfil', label: 'Perfil', icon: 'person' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2 max-w-lg mx-auto bg-surface-container-lowest border-t border-border-subtle shadow-md">
      {navItems.map((item) => {
        const isActive =
          currentScreen === item.id ||
          (item.id === 'explorar' && currentScreen === 'solicitud');

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${
              isActive
                ? 'bg-trust-blue-light text-primary rounded-lg px-3.5 py-1.5 font-label-sm font-bold shadow-xs'
                : 'text-text-muted hover:bg-surface-container-low px-3 py-1.5 font-label-sm'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${
                isActive ? 'material-symbols-fill text-primary' : 'text-text-muted'
              }`}
            >
              {item.icon}
            </span>
            <span className="mt-0.5 text-[11px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
