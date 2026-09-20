import { useState, useEffect } from 'react';

/**
 * Hook para detectar estado de conexión online/offline
 * Usa navigator.onLine + eventos online/offline + heartbeat opcional
 */
export function useOnlineStatus(options?: {
  /** URL para heartbeat (default: '/' - misma origen) */
  heartbeatUrl?: string;
  /** Intervalo heartbeat en ms (default: 30000 = 30s) */
  heartbeatInterval?: number;
  /** Timeout fetch en ms (default: 5000) */
  heartbeatTimeout?: number;
}): { isOnline: boolean; wasOffline: boolean } {
  const {
    heartbeatUrl = '/',
    heartbeatInterval = 30_000,
    heartbeatTimeout = 5_000,
  } = options || {};

  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Listener nativo del navegador
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Heartbeat opcional para detectar conectividad real (no solo interfaz de red)
    let heartbeatTimer: ReturnType<typeof setInterval>;
    
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(heartbeatUrl, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const online = res.ok || res.status === 404; // 404 = servidor responde
        
        if (online !== isOnline) {
          setIsOnline(online);
          if (!online) setWasOffline(true);
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
          setWasOffline(true);
        }
      }
    };

    // Verificación inicial
    checkConnectivity();

    // Heartbeat periódico
    heartbeatTimer = setInterval(checkConnectivity, heartbeatInterval);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    };
  }, [heartbeatUrl, heartbeatInterval, isOnline]);

  return { isOnline, wasOffline };
}

/**
 * Hook simplificado: solo navigator.onLine (sin heartbeat)
 * Para casos donde no se quiere overhead de red
 */
export function useOnlineStatusSimple(): { isOnline: boolean; wasOffline: boolean } {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}