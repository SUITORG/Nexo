export interface DevConfig {
  enabled: boolean;
  autoLogin: 'technician' | 'client' | 'admin' | null;
  seedData: boolean;
  mockStripe: boolean;
  mockExchangeRate: boolean;
}

const DEV_MODE_KEY = 'devMode';
const DEV_AUTO_LOGIN_KEY = 'devAutoLogin';
const DEV_SEED_DATA_KEY = 'devSeedData';
const DEV_MOCK_STRIPE_KEY = 'devMockStripe';
const DEV_MOCK_EXCHANGE_RATE_KEY = 'devMockExchangeRate';

function getEnv(key: string): string | undefined {
  // URL param primero: cada pestaña puede traer su propio rol (?devAutoLogin=admin)
  // aunque localStorage (compartido entre pestañas) tenga otro valor.
  return import.meta.env[key] || 
         (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(key) : undefined) ||
         (typeof window !== 'undefined' ? localStorage.getItem(key) : undefined);
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '';
}

export function isDevMode(): boolean {
  // Candado anti-producción: en build PROD fuera de localhost nunca hay modo prueba,
  // aunque alguien deje VITE_DEV_* en el build o localStorage.
  if (import.meta.env.PROD && !isLocalhost()) return false;
  return getEnv('VITE_DEV_MODE') === 'true' || 
         getEnv(DEV_MODE_KEY) === 'true';
}

export function getDevConfig(): DevConfig {
  if (!isDevMode()) {
    return { enabled: false, autoLogin: null, seedData: false, mockStripe: false, mockExchangeRate: false };
  }
  return {
    enabled: true,
    autoLogin: (getEnv('VITE_DEV_AUTO_LOGIN') || 
                getEnv(DEV_AUTO_LOGIN_KEY) || 
                null) as 'technician' | 'client' | 'admin' | null,
    seedData: getEnv('VITE_DEV_SEED_DATA') === 'true' || 
              getEnv(DEV_SEED_DATA_KEY) === 'true',
    mockStripe: getEnv('VITE_DEV_MOCK_STRIPE') === 'true' || 
                getEnv(DEV_MOCK_STRIPE_KEY) === 'true',
    mockExchangeRate: getEnv('VITE_DEV_MOCK_EXCHANGE_RATE') === 'true' || 
                      getEnv(DEV_MOCK_EXCHANGE_RATE_KEY) === 'true',
  };
}

export function setDevMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(DEV_MODE_KEY, 'true');
  } else {
    localStorage.removeItem(DEV_MODE_KEY);
    localStorage.removeItem(DEV_AUTO_LOGIN_KEY);
    localStorage.removeItem(DEV_SEED_DATA_KEY);
    localStorage.removeItem(DEV_MOCK_STRIPE_KEY);
    localStorage.removeItem(DEV_MOCK_EXCHANGE_RATE_KEY);
  }
}

export function setDevAutoLogin(role: 'technician' | 'client' | 'admin' | null) {
  if (role) {
    localStorage.setItem(DEV_AUTO_LOGIN_KEY, role);
  } else {
    localStorage.removeItem(DEV_AUTO_LOGIN_KEY);
  }
}

export function setDevSeedData(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(DEV_SEED_DATA_KEY, 'true');
  } else {
    localStorage.removeItem(DEV_SEED_DATA_KEY);
  }
}

export function setDevMockStripe(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(DEV_MOCK_STRIPE_KEY, 'true');
  } else {
    localStorage.removeItem(DEV_MOCK_STRIPE_KEY);
  }
}

export function setDevMockExchangeRate(enabled: boolean) {
  if (enabled) {
    localStorage.setItem(DEV_MOCK_EXCHANGE_RATE_KEY, 'true');
  } else {
    localStorage.removeItem(DEV_MOCK_EXCHANGE_RATE_KEY);
  }
}

export function getDevStatus() {
  return {
    devMode: localStorage.getItem(DEV_MODE_KEY),
    autoLogin: localStorage.getItem(DEV_AUTO_LOGIN_KEY),
    seedData: localStorage.getItem(DEV_SEED_DATA_KEY),
    mockStripe: localStorage.getItem(DEV_MOCK_STRIPE_KEY),
    mockExchangeRate: localStorage.getItem(DEV_MOCK_EXCHANGE_RATE_KEY),
    envVars: {
      VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE,
      VITE_DEV_AUTO_LOGIN: import.meta.env.VITE_DEV_AUTO_LOGIN,
      VITE_DEV_SEED_DATA: import.meta.env.VITE_DEV_SEED_DATA,
      VITE_DEV_MOCK_STRIPE: import.meta.env.VITE_DEV_MOCK_STRIPE,
      VITE_DEV_MOCK_EXCHANGE_RATE: import.meta.env.VITE_DEV_MOCK_EXCHANGE_RATE,
    }
  };
}