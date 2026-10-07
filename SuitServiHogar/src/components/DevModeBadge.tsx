import { isDevMode } from '../config/devMode';

export type ProfileRole = 'client' | 'technician' | 'admin';

const PROFILES: Record<ProfileRole, { label: string; icon: string }> = {
  client: { label: 'Cliente', icon: 'person' },
  technician: { label: 'T\u00e9cnico', icon: 'handyman' },
  admin: { label: 'Administrador', icon: 'admin_panel_settings' },
};

export function DevModeBadge({ role = 'client' }: { role?: ProfileRole }) {
  if (!isDevMode()) return null;
  const profile = PROFILES[role] ?? PROFILES.client;
  return (
    <div className="fixed top-2 right-2 z-[100] pointer-events-none flex flex-col items-end gap-1.5 select-none">
      <div
        data-testid="perfil-badge"
        className="flex items-center gap-1.5 bg-primary text-on-primary border-2 border-white/40 rounded-full px-3 py-1 text-sm font-extrabold uppercase tracking-wider shadow-lg"
      >
        <span className="material-symbols-outlined text-[20px]">{profile.icon}</span>
        {profile.label}
      </div>
      <div
        data-testid="modo-prueba-badge"
        className="bg-text-primary text-white border border-white/20 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider shadow"
      >
        MODO PRUEBA
      </div>
    </div>
  );
}
