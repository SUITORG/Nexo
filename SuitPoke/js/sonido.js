/* SuitPoke — efectos de sonido con WebAudio (sin archivos de audio) */
(function () {
  'use strict';
  let ctx = null, activo = localStorage.getItem('sp_sonido') !== 'off';

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tono(freq, dur, tipo, vol, when) {
    if (!activo) return;
    const c = ac(), t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo || 'square'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function ruido(dur, vol) {
    if (!activo) return;
    const c = ac(), t = c.currentTime;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol || 0.2;
    src.connect(g).connect(c.destination); src.start(t);
  }

  const S = {
    click() { tono(660, 0.06, 'square', 0.08); },
    robar() { tono(880, 0.07, 'triangle', 0.1); tono(1320, 0.08, 'triangle', 0.08, 0.06); },
    arrojar() { ruido(0.18, 0.15); tono(220, 0.15, 'sawtooth', 0.1); },
    hit() { ruido(0.25, 0.3); tono(90, 0.25, 'sine', 0.3); },
    critico() { ruido(0.3, 0.35); [440, 554, 659, 880].forEach((f, i) => tono(f, 0.15, 'square', 0.12, i * 0.05)); },
    bloqueo() { tono(180, 0.12, 'square', 0.15); tono(140, 0.2, 'square', 0.12, 0.05); },
    robo() { [740, 988, 1244].forEach((f, i) => tono(f, 0.1, 'triangle', 0.12, i * 0.07)); },
    fuera() { [330, 262, 196, 131].forEach((f, i) => tono(f, 0.2, 'sawtooth', 0.14, i * 0.12)); },
    turno() { tono(523, 0.09, 'sine', 0.12); tono(784, 0.1, 'sine', 0.1, 0.08); },
    pasar() { tono(300, 0.1, 'sine', 0.08); },
    ganar() { [523, 659, 784, 1047, 1319].forEach((f, i) => tono(f, 0.25, 'square', 0.12, i * 0.12)); },
    perder() { [392, 349, 294, 220].forEach((f, i) => tono(f, 0.3, 'sawtooth', 0.1, i * 0.18)); }
  };

  window.Sonido = {
    play(nombre) { try { if (S[nombre]) S[nombre](); } catch (e) { /* audio bloqueado hasta primer gesto */ } },
    alternar() {
      activo = !activo;
      localStorage.setItem('sp_sonido', activo ? 'on' : 'off');
      if (activo) S.click();
      return activo;
    },
    estaActivo() { return activo; }
  };
})();
