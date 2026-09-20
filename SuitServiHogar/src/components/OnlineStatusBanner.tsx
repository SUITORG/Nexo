import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

/**
 * Banner global que aparece cuando la app está offline
 * Se renderiza fijo en la parte superior
 */
export const OnlineStatusBanner: React.FC<{ 
  heartbeatUrl?: string;
  heartbeatInterval?: number;
}> = ({ heartbeatUrl, heartbeatInterval }) => {
  const { isOnline, wasOffline } = useOnlineStatus({ 
    heartbeatUrl, 
    heartbeatInterval 
  });

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline ? 'bg-emerald-600' : 'bg-amber-600'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium">
        <span className="material-symbols-outlined text-[18px]">
          {isOnline ? 'wifi' : 'wifi_off'}
        </span>
        <span>
          {isOnline 
            ? 'Conexión restablecida ✓' 
            : 'Sin conexión — Los cambios se sincronizarán al reconectar'}
        </span>
        {wasOffline && isOnline && (
          <span className="ml-2 text-xs opacity-80">
            Sincronizando...
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Indicador pequeño para usar en Header/BottomNav
 * Solo icono + tooltip
 */
export const OnlineStatusIndicator: React.FC<{ 
  heartbeatUrl?: string;
  heartbeatInterval?: number;
}> = ({ heartbeatUrl, heartbeatInterval }) => {
  const { isOnline, wasOffline } = useOnlineStatus({ 
    heartbeatUrl, 
    heartbeatInterval 
  });

  return (
    <div className="flex items-center gap-1" title={isOnline ? 'En línea' : 'Sin conexión'}>
      <span className={`material-symbols-outlined text-[18px] ${
        isOnline ? 'text-emerald-600' : 'text-amber-600'
      }`}>
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
      {wasOffline && isOnline && (
        <span className="text-[10px] text-emerald-600 font-bold animate-pulse">●</span>
      )}
    </div>
  );
}