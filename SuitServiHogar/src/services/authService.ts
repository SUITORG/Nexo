import { supabase } from '../lib/supabase';
import { normalizePhoneMX, phoneToEmail, validPassword } from '../lib/phone';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getTechnicianByEmail(email: string) {
  const { data, error } = await supabase
    .from('sh_technicians')
    .select('*')
    .ilike('email', email)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Login teléfono + contraseña (email sintético, ver src/lib/phone.js) ───

export async function signInWithPhonePassword(phoneRaw: string, password: string) {
  const phone = normalizePhoneMX(phoneRaw);
  if (!phone) throw new Error('Teléfono inválido (México, 10 dígitos)');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: phoneToEmail(phone),
    password,
  });
  if (error) throw new Error('Teléfono o contraseña incorrectos');
  return data;
}

export async function registerPhone(phoneRaw: string, password: string, displayName: string) {
  const phone = normalizePhoneMX(phoneRaw);
  if (!phone) throw new Error('Teléfono inválido (México, 10 dígitos)');
  if (!validPassword(password)) {
    throw new Error('La contraseña debe tener 10+ caracteres, letras y números');
  }
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, displayName }),
  });
  const body = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) throw new Error(body?.error || 'No se pudo crear la cuenta');
  const { error } = await supabase.auth.signInWithPassword({ email: phoneToEmail(phone), password });
  if (error) throw new Error('Cuenta creada, pero no se pudo iniciar sesión. Intenta de nuevo.');
}
