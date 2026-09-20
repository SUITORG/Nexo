import { supabase } from '../lib/supabase';

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
    .eq('activo', true)
    .single();

  if (error || !data) return null;
  return data;
}
