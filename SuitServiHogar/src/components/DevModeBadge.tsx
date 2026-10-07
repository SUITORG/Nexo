import { isDevMode } from '../config/devMode';

export function DevModeBadge() {
  if (!isDevMode()) return null;
  return (
    <div
      data-testid="modo-prueba-badge"
      className="fixed top-2 right-2 z-[100] pointer-events-none bg-amber-400 text-black border border-black/30 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider shadow select-none"
    >
      MODO PRUEBA
    </div>
  );
}
