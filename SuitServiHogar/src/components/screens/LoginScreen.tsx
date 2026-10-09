import React, { useState } from 'react';
import { signInWithGoogle, signInWithPhonePassword, registerPhone } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (isGuest?: boolean) => void;
  onNavigate: (screen: 'privacy' | 'terms') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleGoogleLogin = async () => {
    if (!acceptedLegal) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedLegal || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        if (password !== password2) throw new Error('Las contraseñas no coinciden');
        await registerPhone(phone, password, displayName);
      } else {
        await signInWithPhonePassword(phone, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'No se pudo iniciar sesión');
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (!acceptedLegal) return;
    onLoginSuccess(true);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <span className="material-symbols-outlined text-white text-[32px]">handyman</span>
          </div>
          <h1 className="text-headline-lg text-text-primary font-bold">ServiciosHogar</h1>
          <p className="text-body-md text-text-muted">
            Reynosa • Técnicos verificados, precios regulados
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-safe-bg text-escrow-shield flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
            </div>
            <span className="text-body-sm text-text-primary">Técnicos auditados con INE y biometría</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-trust-blue-light text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </div>
            <span className="text-body-sm text-text-primary">Pago protegido con garantía Escrow</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">price_change</span>
            </div>
            <span className="text-body-sm text-text-primary">Precios fijos en MXN y USD</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="bg-danger-flag/10 border border-danger-flag/30 text-danger-flag text-body-sm p-3 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Legal Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
              className="peer sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              acceptedLegal
                ? 'bg-primary border-primary'
                : 'border-border-subtle group-hover:border-primary/50'
            }`}>
              {acceptedLegal && (
                <span className="material-symbols-outlined text-white text-[14px]">check</span>
              )}
            </div>
          </div>
          <span className="text-body-sm text-text-muted leading-tight">
            He leído y acepto los{' '}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
              className="text-primary font-bold hover:underline"
            >
              Términos y Condiciones
            </button>{' '}
            y la{' '}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
              className="text-primary font-bold hover:underline"
            >
              Política de Privacidad
            </button>
          </span>
        </label>

        {/* Phone / Register tabs */}
        <div className="bg-surface-card rounded-xl p-4 border border-border-subtle space-y-4">
          <div className="grid grid-cols-2 gap-1 bg-surface rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 rounded-md text-label-md font-bold transition-colors ${
                mode === 'login' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2 rounded-md text-label-md font-bold transition-colors ${
                mode === 'register' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label htmlFor="reg-name" className="text-label-sm font-bold text-text-primary">Nombre</label>
                <input
                  id="reg-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="mt-1 w-full border border-border-subtle rounded-lg px-3 py-2.5 text-body-md bg-surface focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div>
              <label htmlFor="phone-input" className="text-label-sm font-bold text-text-primary">Teléfono (México)</label>
              <div className="mt-1 flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-border-subtle rounded-l-lg bg-surface text-body-md text-text-muted font-bold">+52</span>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="899 123 4567"
                  className="w-full border border-border-subtle rounded-r-lg px-3 py-2.5 text-body-md bg-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass-input" className="text-label-sm font-bold text-text-primary">Contraseña</label>
              <div className="mt-1 relative">
                <input
                  id="pass-input"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="10+ caracteres, letras y números"
                  className="w-full border border-border-subtle rounded-lg px-3 py-2.5 pr-10 text-body-md bg-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="pass2-input" className="text-label-sm font-bold text-text-primary">Repite la contraseña</label>
                <input
                  id="pass2-input"
                  type={showPass ? 'text' : 'password'}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Misma contraseña"
                  className="mt-1 w-full border border-border-subtle rounded-lg px-3 py-2.5 text-body-md bg-surface focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !acceptedLegal}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary font-label-lg py-3 px-4 rounded-lg flex items-center justify-center transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : mode === 'register' ? (
                'Crear cuenta y entrar'
              ) : (
                'Entrar con teléfono'
              )}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-label-sm text-text-muted">
          <div className="flex-1 h-px bg-border-subtle" />
          <span>o continúa con</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading || !acceptedLegal}
          className="w-full bg-white hover:bg-gray-50 text-gray-700 font-label-lg py-3 px-4 rounded-lg border border-gray-300 shadow-xs flex items-center justify-center space-x-3 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>

        {/* Skip for now */}
        <button
          onClick={handleGuestLogin}
          disabled={!acceptedLegal}
          className="w-full text-text-muted text-body-sm py-2 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar sin sesión →
        </button>
      </div>
    </div>
  );
};
