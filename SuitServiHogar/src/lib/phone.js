// Validación de teléfono MX + política de contraseña.
// Fuente única: la importan server.js (Node) y authService.ts (Vite).
// ponytail: solo México (+52). Más países = parametrizar prefijos en sh_config.

/**
 * Normaliza a E.164 MX (+52 + 10 dígitos). Devuelve null si no es válido.
 * @param {string} raw
 * @returns {string|null}
 */
export function normalizePhoneMX(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  let local = null;
  if (digits.length === 13 && digits.startsWith('521')) local = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith('52')) local = digits.slice(2);
  else if (digits.length === 10) local = digits;
  if (!local || !/^[1-9]\d{9}$/.test(local)) return null;
  return '+52' + local;
}

/**
 * Email sintético estable a partir del teléfono (login/registro en Supabase).
 * @param {string} phone E.164
 * @returns {string}
 */
export function phoneToEmail(phone) {
  return `p${String(phone).replace(/\+/g, '')}@phone.servicioshogar.mx`;
}

/**
 * Política de contraseña: 10-128 caracteres, letras y números.
 * @param {string} pw
 * @returns {boolean}
 */
export function validPassword(pw) {
  return typeof pw === 'string' && pw.length >= 10 && pw.length <= 128 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}
