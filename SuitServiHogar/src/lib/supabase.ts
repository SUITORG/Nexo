import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

const isLocalHost =
  (typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) ||
  import.meta.env.DEV;

// Local: sesión en sessionStorage (aislada por pestaña → multi-sesión QA).
// Prod: localStorage (persistente).

// QA multi-rol: cada ventana (?devAutoLogin=client|technician|admin) usa su
// propio storageKey para que el BroadcastChannel de auth-js (nombre = storageKey)
// no cruce eventos SIGNED_IN entre roles — si no, la última ventana en loguear
// pisa el rol de las otras 3 (bug: todas quedaban en TÉCNICO).
const devRole =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('devAutoLogin')
    : null;
const devStorageKey =
  isLocalHost && devRole ? `sb-qa-${devRole}` : undefined;

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: isLocalHost ? window.sessionStorage : window.localStorage,
    ...(devStorageKey ? { storageKey: devStorageKey } : {}),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
