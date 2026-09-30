/* SuitPoke — motor de juego (compartido servidor/cliente, cero dependencias) */
(function (global) {
  'use strict';

  // Anillo de 6 elementos: cada uno vence al siguiente (fuego→planta→agua→rayo→tierra→fantasma→fuego)
  const ELEMENTOS = ['fuego', 'planta', 'agua', 'rayo', 'tierra', 'fantasma'];
  const VALENCIA = { fuego: 'planta', planta: 'agua', agua: 'rayo', rayo: 'tierra', tierra: 'fantasma', fantasma: 'fuego' };
  const EMOJI = { fuego: '🔥', planta: '🌱', agua: '💧', rayo: '⚡', tierra: '🪨', fantasma: '👻' };

  // Mazo base: 30 cartas originales (5 por elemento). h: habilidad especial
  const MAZO = [
    { id: 1, n: 'Vulcanix', e: 'fuego', p: 7, d: 3 }, { id: 2, n: 'Brascus', e: 'fuego', p: 4, d: 2 },
    { id: 3, n: 'Ignaro', e: 'fuego', p: 5, d: 3 }, { id: 4, n: 'Pirovex', e: 'fuego', p: 6, d: 1, h: 'critico' },
    { id: 5, n: 'Cinabrio', e: 'fuego', p: 3, d: 4 },
    { id: 6, n: 'Tideon', e: 'agua', p: 7, d: 3 }, { id: 7, n: 'Marea', e: 'agua', p: 4, d: 4 },
    { id: 8, n: 'Nixina', e: 'agua', p: 5, d: 2 }, { id: 9, n: 'Coralfin', e: 'agua', p: 3, d: 5, h: 'escudo' },
    { id: 10, n: 'Ondara', e: 'agua', p: 6, d: 2, h: 'robo' },
    { id: 11, n: 'Verdania', e: 'planta', p: 7, d: 3 }, { id: 12, n: 'Musgoth', e: 'planta', p: 4, d: 4 },
    { id: 13, n: 'Espinar', e: 'planta', p: 5, d: 3 }, { id: 14, n: 'Florigon', e: 'planta', p: 6, d: 1, h: 'critico' },
    { id: 15, n: 'Tallox', e: 'planta', p: 3, d: 4 },
    { id: 16, n: 'Volturi', e: 'rayo', p: 8, d: 2 }, { id: 17, n: 'Chispa', e: 'rayo', p: 4, d: 2 },
    { id: 18, n: 'Ampere', e: 'rayo', p: 5, d: 3 }, { id: 19, n: 'Teslum', e: 'rayo', p: 6, d: 2, h: 'robo' },
    { id: 20, n: 'Fulgor', e: 'rayo', p: 3, d: 5, h: 'escudo' },
    { id: 21, n: 'Terragon', e: 'tierra', p: 7, d: 4 }, { id: 22, n: 'Gravillo', e: 'tierra', p: 4, d: 5 },
    { id: 23, n: 'Petrux', e: 'tierra', p: 5, d: 4 }, { id: 24, n: 'Dunal', e: 'tierra', p: 6, d: 2 },
    { id: 25, n: 'Ocreon', e: 'tierra', p: 3, d: 5, h: 'escudo' },
    { id: 26, n: 'Umbrax', e: 'fantasma', p: 8, d: 2 }, { id: 27, n: 'Noctis', e: 'fantasma', p: 5, d: 3 },
    { id: 28, n: 'Spectrin', e: 'fantasma', p: 6, d: 1, h: 'critico' }, { id: 29, n: 'Velisto', e: 'fantasma', p: 3, d: 4, h: 'robo' },
    { id: 30, n: 'Polterg', e: 'fantasma', p: 4, d: 4 }
  ];

  const HP_INICIAL = 15, MANO_INICIAL = 5, MANO_MAX = 7, DANIO_DIRECTO_MAX = 7, DANIO_GUARDIA_MAX = 6, DANIO_CRITICO_MAX = 9;

  function barajar(arr, rnd) {
    rnd = rnd || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function crearPartida(opts) {
    opts = opts || {};
    const nombres = opts.nombres || ['Tú'];
    const mazo = barajar(MAZO);
    const jugadores = nombres.map((nombre, i) => ({
      id: i, nombre: nombre, hp: HP_INICIAL, mano: [], guardia: null, fuera: false, esBot: !!opts.bots && !!opts.bots[i]
    }));
    const st = { jugadores: jugadores, mazo: mazo, descarte: [], turno: 0, ronda: 1, log: [], estado: 'jugando', ganador: null, eventos: [] };
    jugadores.forEach(j => robarCartas(st, j, MANO_INICIAL));
    st.log.push('¡La partida comienza! ' + jugadores.map(j => j.nombre).join(' vs '));
    return st;
  }

  function vivos(st) { return st.jugadores.filter(j => !j.fuera); }

  function robarCartas(st, j, n) {
    for (let i = 0; i < n; i++) {
      if (st.mazo.length === 0) {
        if (st.descarte.length === 0) break;
        st.mazo = barajar(st.descarte); st.descarte = [];
      }
      if (j.mano.length >= MANO_MAX) break;
      j.mano.push(st.mazo.pop());
    }
  }

  function ventaja(a, b) { return VALENCIA[a] === b ? 1 : (VALENCIA[b] === a ? -1 : 0); }

  function calcDano(carta, guardia) {
    let atk = carta.p;
    const v = guardia ? ventaja(carta.e, guardia.e) : 0;
    if (v > 0) atk += 3; else if (v < 0) atk -= 2;
    atk = Math.max(1, atk);
    if (!guardia) return { dano: Math.min(atk, DANIO_DIRECTO_MAX), gana: true, v: v, sinGuardia: true };
    const def = guardia.d + (guardia.h === 'escudo' ? 4 : 0);
    const diff = atk - def;
    if (diff > 0) {
      let dano = Math.min(diff, DANIO_GUARDIA_MAX);
      if (carta.h === 'critico') dano = Math.min(dano * 2, DANIO_CRITICO_MAX);
      return { dano: dano, gana: true, v: v, critico: carta.h === 'critico', robo: carta.h === 'robo' };
    }
    return { dano: 1, gana: false, v: v };
  }

  // Juega una carta del jugador. Devuelve evento {ok, log[], efectos[]}
  function jugarCarta(st, jid, idx, objId) {
    if (st.estado !== 'jugando') return { ok: false, err: 'partida terminada' };
    const j = st.jugadores[jid];
    if (!j || j.fuera) return { ok: false, err: 'jugador fuera' };
    if (st.turno !== jid) return { ok: false, err: 'no es tu turno' };
    const carta = j.mano[idx];
    if (!carta) return { ok: false, err: 'carta inválida' };

    const rivales = vivos(st).filter(r => r.id !== jid);
    let obj = null;
    if (rivales.length === 1) obj = rivales[0];
    else obj = st.jugadores[objId];
    if (!obj || obj.id === jid || obj.fuera) return { ok: false, err: 'objetivo inválido' };

    j.mano.splice(idx, 1);
    const r = calcDano(carta, obj.guardia);
    const efectos = [];
    let resumen = j.nombre + ' arroja ' + carta.n + ' ' + EMOJI[carta.e] + ' contra ' + obj.nombre;

    if (r.gana) {
      obj.hp -= r.dano;
      resumen += ' → ' + r.dano + ' de daño' + (r.critico ? ' ¡CRÍTICO!' : '') + (r.sinGuardia ? ' (sin guardia)' : '') + '.';
      efectos.push('hit');
      if (r.robo && obj.mano.length > 0) {
        const roba = obj.mano.splice(Math.floor(Math.random() * obj.mano.length), 1)[0];
        j.mano.push(roba);
        resumen += ' Roba ' + roba.n + '.';
        efectos.push('robo');
      }
      if (obj.guardia) st.descarte.push(obj.guardia);
      obj.guardia = null;
      if (obj.hp <= 0) { obj.hp = 0; obj.fuera = true; resumen += ' ' + obj.nombre + ' queda FUERA.'; efectos.push('fuera'); }
    } else {
      j.hp -= 1;
      resumen += ' → la guardia de ' + obj.nombre + ' resiste. ' + j.nombre + ' sufre 1 de retroceso.';
      efectos.push('bloqueo');
      if (j.hp <= 0) { j.hp = 0; j.fuera = true; resumen += ' ' + j.nombre + ' queda FUERA.'; efectos.push('fuera'); }
    }

    if (j.guardia) st.descarte.push(j.guardia);
    j.guardia = carta;

    st.log.push(resumen);
    if (st.log.length > 60) st.log = st.log.slice(-60);
    st.eventos = efectos;
    avanzarTurno(st);
    return { ok: true, resumen: resumen, efectos: efectos, dano: r.dano, gana: r.gana };
  }

  function pasar(st, jid) {
    if (st.estado !== 'jugando' || st.turno !== jid) return { ok: false, err: 'no puedes pasar' };
    st.log.push(st.jugadores[jid].nombre + ' pasa su turno.');
    st.eventos = ['pasar'];
    avanzarTurno(st);
    return { ok: true };
  }

  function avanzarTurno(st) {
    const viv = vivos(st);
    if (viv.length <= 1) {
      st.estado = 'terminada';
      st.ganador = viv.length ? viv[0].id : null;
      if (st.ganador !== null) st.log.push('🏆 ' + st.jugadores[st.ganador].nombre + ' gana la partida.');
      st.eventos.push('fin');
      return;
    }
    let n = st.turno;
    for (let i = 0; i < st.jugadores.length; i++) {
      n = (n + 1) % st.jugadores.length;
      if (!st.jugadores[n].fuera) break;
    }
    if (n <= st.turno) st.ronda++;
    st.turno = n;
    const j = st.jugadores[n];
    robarCartas(st, j, 1);
    st.eventos.push('turno');
  }

  // IA: elige la jugada con mayor daño esperado; prioriza escudo si está en desventaja
  function iaJugada(st, jid) {
    const j = st.jugadores[jid];
    const rivales = vivos(st).filter(r => r.id !== jid);
    if (!j || j.fuera || rivales.length === 0) return null;
    let mejor = null;
    j.mano.forEach((c, i) => {
      rivales.forEach(obj => {
        const r = calcDano(c, obj.guardia);
        let score = (r.gana ? r.dano * 10 + (r.robo ? 5 : 0) + (r.critico ? 3 : 0) : -15);
        if (!r.gana && c.h === 'escudo') score = 40 + c.d; // mejor guardia cuando no puede atacar
        if (obj.hp <= r.dano && r.gana) score += 100; // rematar
        score += Math.random() * 4;
        if (!mejor || score > mejor.score) mejor = { idx: i, objId: obj.id, score: score };
      });
    });
    return mejor ? { idx: mejor.idx, objId: mejor.objId } : null;
  }

  // Vista serializada: solo tu mano es visible
  function ver(st, jid) {
    return {
      estado: st.estado, ganador: st.ganador, turno: st.turno, ronda: st.ronda,
      mazo: st.mazo.length, log: st.log.slice(-15),
      jugadores: st.jugadores.map(j => ({
        id: j.id, nombre: j.nombre, hp: j.hp, fuera: j.fuera, esBot: j.esBot,
        guardia: j.guardia, cartas: j.mano.length
      })),
      mano: (st.jugadores[jid] ? st.jugadores[jid].mano : [])
    };
  }

  const api = { ELEMENTOS, EMOJI, VALENCIA, MAZO, HP_INICIAL, MANO_INICIAL, MANO_MAX, crearPartida, jugarCarta, pasar, iaJugada, ver, calcDano, ventaja, robarCartas, vivos };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Motor = api;
})(typeof window !== 'undefined' ? window : this);
