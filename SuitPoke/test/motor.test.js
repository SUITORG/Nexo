/* SuitPoke — autocheck del motor (node SuitPoke/test/motor.test.js) */
'use strict';
const assert = require('assert');
const M = require('../js/motor.js');

// 1) Valencia del anillo: cada elemento vence al siguiente
assert.strictEqual(M.VALENCIA.fuego, 'planta');
assert.strictEqual(M.VALENCIA.fantasma, 'fuego');
assert.strictEqual(M.ventaja('fuego', 'planta'), 1);
assert.strictEqual(M.ventaja('planta', 'fuego'), -1);
assert.strictEqual(M.ventaja('fuego', 'fuego'), 0);

// 2) Daño directo sin guardia: limitado a 7
const c7 = { n: 'X', e: 'fuego', p: 8 };
assert.strictEqual(M.calcDano(c7, null).dano, 7);
// con ventaja elemental
const planta = { n: 'Y', e: 'planta', d: 1 };
const r = M.calcDano({ n: 'Z', e: 'fuego', p: 5 }, planta);
assert.ok(r.gana && r.dano > 0);

// 3) Guardia con escudo aguanta más: +4 def
const golpe = { n: 'A', e: 'fuego', p: 5 };
assert.ok(M.calcDano(golpe, { n: 'B', e: 'tierra', d: 4, h: 'escudo' }).gana === false);
assert.ok(M.calcDano(golpe, { n: 'B', e: 'tierra', d: 1 }).gana === true);

// 4) Partida completa simulada: la IA termina la partida siempre
let partidas = 0;
for (let semilla = 0; semilla < 50; semilla++) {
  const st = M.crearPartida({ nombres: ['A', 'B'], bots: [true, true] });
  let pasos = 0;
  while (st.estado === 'jugando' && pasos++ < 500) {
    const j = st.jugadores[st.turno];
    const jugada = M.iaJugada(st, j.id);
    if (jugada && !M.jugarCarta(st, j.id, jugada.idx, jugada.objId).ok) M.pasar(st, j.id);
    else if (!jugada) M.pasar(st, j.id);
  }
  assert.strictEqual(st.estado, 'terminada', 'partida ' + semilla + ' no terminó');
  assert.ok(st.ganador !== null, 'sin ganador en partida ' + semilla);
  const vivos = st.jugadores.filter(j => !j.fuera);
  assert.strictEqual(vivos.length, 1, 'debe quedar 1 vivo');
  partidas++;
}
console.log('OK motor: 4 suites, ' + partidas + ' partidas IA vs IA terminaron con ganador');
