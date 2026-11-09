// Sonidos de estado — Web Audio API nativa, sin dependencias ni assets.
// Disparados SIEMPRE tras un click (política de autoplay: resume() en el gesto).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface NoteOpts {
  freq: number;
  at?: number;      // desplazamiento en segundos desde el inicio
  dur?: number;     // duración total en segundos
  type?: OscillatorType;
  gain?: number;
  cutoff?: number;  // lowpass opcional (Hz)
  detune?: number;  // cents, para brillo
}

function note({ freq, at = 0, dur = 0.7, type = 'triangle', gain = 0.15, cutoff, detune = 0 }: NoteOpts) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + at;

  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  const last: AudioNode = env;
  if (cutoff) {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    osc.connect(lp);
    lp.connect(env);
  } else {
    osc.connect(env);
  }
  env.connect(ac.destination);
  void last;

  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** "Escarcela" — liberación de Escrow: arpegio ascendente pentatónico +
 *  brillo final. Sensación de caja fuerte abriéndose. */
export function sfxLiberar() {
  const PENTA = [523.25, 587.33, 659.25, 783.99]; // C5 D5 E5 G5
  PENTA.forEach((f, i) => {
    note({ freq: f, at: i * 0.09, dur: 0.7, type: 'triangle', gain: 0.14 });
    note({ freq: f * 2, at: i * 0.09, dur: 0.45, type: 'sine', gain: 0.05, detune: 6 });
  });
  note({ freq: 1046.5, at: 0.42, dur: 1.1, type: 'sine', gain: 0.09, detune: -4 }); // C6 shimmer
}

/** "Sello" — orden completada: quinta descendente D3→A2 con cola.
 *  Sensación de sello cayendo / puerta cerrándose. */
export function sfxCerrar() {
  note({ freq: 146.83, at: 0, dur: 0.32, type: 'sine', gain: 0.2, cutoff: 900 });
  note({ freq: 110, at: 0.16, dur: 0.9, type: 'sine', gain: 0.18, cutoff: 700 });
}


/** "Nuevo servicio" — tres notas ascendentes con brillo, timbre de taller.
 *  Distinto de sfxLiberar/sfxCerrar: no suena a caja fuerte ni a sello. */
export function sfxNuevoServicio() {
  const NOTES = [392.0, 493.88, 587.33]; // G4 B4 D5
  NOTES.forEach((f, i) => {
    note({ freq: f, at: i * 0.12, dur: 0.55, type: 'triangle', gain: 0.16 });
    note({ freq: f * 2, at: i * 0.12, dur: 0.3, type: 'sine', gain: 0.04, detune: 4 });
  });
}

/** "Mensaje nuevo" — dos notas suaves y cortas. */
export function sfxMensaje() {
  note({ freq: 659.25, at: 0, dur: 0.22, type: 'sine', gain: 0.12 });
  note({ freq: 880.0, at: 0.11, dur: 0.32, type: 'sine', gain: 0.1 });
}

/** "Ajuste pendiente" — cuatro notas ascendentes, para el cliente. */
export function sfxAjustePendiente() {
  const NOTES = [523.25, 659.25, 783.99, 1046.5];
  NOTES.forEach((f, i) => {
    note({ freq: f, at: i * 0.1, dur: 0.4, type: 'triangle', gain: 0.12 });
  });
}
