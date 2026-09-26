import React, { useState } from 'react';

const isLocal =
  import.meta.env.DEV ||
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

const ROLES = [
  { role: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
  { role: 'client', label: 'Cliente', icon: 'person' },
  { role: 'technician', label: 'Técnico', icon: 'engineering' },
] as const;

const openSession = (role: string, index: number) => {
  const w = Math.floor(screen.availWidth / 3);
  const url = `${window.location.origin}${window.location.pathname}?devMode=true&devAutoLogin=${role}`;
  window.open(
    url,
    `qa-${role}`,
    `popup,width=${w},height=${screen.availHeight},left=${index * w},top=0`
  );
};

export const DevSessions: React.FC = () => {
  const [open, setOpen] = useState(false);
  if (!isLocal) return null;

  return (
    <div className="fixed bottom-36 left-4 z-50">
      {open && (
        <div className="bg-surface-card border border-border-subtle shadow-elevated rounded-xl p-3 w-48 mb-2 space-y-2">
          <p className="text-label-md text-text-primary font-bold">Sesiones QA</p>
          {ROLES.map((r, i) => (
            <button
              key={r.role}
              onClick={() => openSession(r.role, i)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-surface-alt border border-border-subtle rounded-lg text-body-sm text-text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
              {r.label}
            </button>
          ))}
          <button
            onClick={() => ROLES.forEach((r, i) => openSession(r.role, i))}
            className="w-full py-2 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:bg-trust-blue-dark transition-colors"
          >
            Abrir las 3
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-surface-card border border-border-subtle text-primary rounded-full shadow-elevated flex items-center justify-center transition-transform active:scale-95"
        title="Sesiones QA"
      >
        <span className="material-symbols-outlined text-[22px]">{open ? 'close' : 'open_in_new'}</span>
      </button>
    </div>
  );
};
