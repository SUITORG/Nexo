/* SuitPoke — cliente de juego (menú, IA local, salas online) */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const EL = Motor.EMOJI;
  const HAB = { escudo: '🛡', critico: '💥', robo: '🤲' };

  const App = {
    modo: null, st: null, miId: 0, bots: 1,
    codigo: null, token: null, es: null, sala: null, vistaSrv: null,
    objetivoPend: null, nombre: localStorage.getItem('sp_nombre') || 'Tú', revancha: false
  };

  function pedirNombre() {
    if (App.nombre && App.nombre !== 'Tú') return App.nombre;
    const n = (window.prompt('Tu nombre de jugador:', '') || '').trim().slice(0, 16);
    if (n) { App.nombre = n; localStorage.setItem('sp_nombre', n); }
    return App.nombre;
  }

  function ir(id, silencio) {
    document.querySelectorAll('.pantalla').forEach(s => s.classList.remove('activa'));
    $(id).classList.add('activa');
    if (!silencio) Sonido.play('click');
  }

  function toast(txt) {
    const t = $('toast');
    t.textContent = txt; t.classList.remove('oculto');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('oculto'), 2200);
  }

  function vista() {
    if (App.modo === 'online') return App.vistaSrv;
    return App.st ? Motor.ver(App.st, 0) : null;
  }

  // ---------- render ----------
  function cartaEl(c, mini) {
    const d = document.createElement('div');
    d.className = 'cart' + (mini ? ' mini' : '');
    d.style.setProperty('--el', 'var(--' + c.e + ')');
    d.innerHTML =
      (c.h ? '<span class="hab">' + HAB[c.h] + '</span>' : '') +
      '<div class="emoji">' + EL[c.e] + '</div>' +
      '<div class="nom">' + c.n + '</div>' +
      '<div class="el">' + c.e + '</div>' +
      '<div class="nums"><span>⚔' + c.p + '</span><span>🛡' + c.d + '</span></div>';
    return d;
  }

  function hpBar(el, hp) {
    el.style.width = Math.max(0, hp / Motor.HP_INICIAL * 100) + '%';
    el.classList.toggle('bajo', hp <= 5);
    el.parentElement.querySelector('span').textContent = hp + '/' + Motor.HP_INICIAL;
  }

  function render() {
    const v = vista();
    if (!v) return;
    const yo = v.jugadores[App.miId];

    // rivales
    const zona = $('zona-rivales');
    zona.innerHTML = '';
    v.jugadores.forEach(j => {
      if (j.id === App.miId) return;
      const d = document.createElement('div');
      d.className = 'rival' + (j.fuera ? ' fuera' : '') + (App.objetivoPend !== null && !j.fuera ? ' objetivo' : '');
      d.dataset.jid = j.id;
      d.innerHTML = '<div class="nombre">' + (j.esBot ? '🤖 ' : '') + j.nombre + '</div>' +
        '<div class="hp-env"><div class="hp"></div><span></span></div>';
      hpBar(d.querySelector('.hp'), j.hp);
      const g = document.createElement('div');
      g.className = 'guardia-env';
      if (j.guardia) { g.appendChild(cartaEl(j.guardia, true)); g.appendChild(document.createTextNode('guardia')); }
      else g.innerHTML = '<div style="font-size:1.4rem;opacity:.4">🏳️</div><div>sin guardia</div>';
      d.appendChild(g);
      d.addEventListener('click', () => onRival(j.id));
      zona.appendChild(d);
    });

    // propia
    hpBar($('mi-hp'), yo.hp);
    $('mi-stats').textContent = 'Mano: ' + v.mano.length + ' · Mazo: ' + v.mazo;
    const mg = $('mi-guardia');
    mg.innerHTML = '';
    const env = document.createElement('div');
    env.className = 'guardia-env';
    if (yo.guardia) { env.appendChild(cartaEl(yo.guardia, true)); env.appendChild(document.createTextNode('mi guardia')); }
    else env.innerHTML = '<div style="font-size:1.4rem;opacity:.4">🏳️</div><div>sin guardia</div>';
    mg.appendChild(env);

    // mano
    const mano = $('mano');
    mano.innerHTML = '';
    v.mano.forEach((c, i) => {
      const el = cartaEl(c, false);
      if (v.turno !== App.miId || yo.fuera) el.style.opacity = .55;
      el.addEventListener('click', () => onCarta(i));
      mano.appendChild(el);
    });

    // turno
    const chip = $('chip-turno');
    const esMio = v.turno === App.miId && !yo.fuera;
    chip.textContent = v.estado !== 'jugando' ? 'FIN' : (esMio ? '▶ TU TURNO' : 'TURNO: ' + v.jugadores[v.turno].nombre);
    chip.classList.toggle('mio', esMio);
    $('aviso-turno').textContent = esMio ? 'Toca una carta para arrojarla' : (yo.fuera ? 'Estás fuera — observando' : 'Espera tu turno…');
    $('btn-pasar').disabled = !esMio;

    // log
    $('log').innerHTML = v.log.map(l => '<div class="linea">' + l + '</div>').join('');
    $('log').scrollTop = 1e6;
  }

  function evento(txt) {
    const e = $('evento');
    e.textContent = txt; e.classList.remove('oculto');
    clearTimeout(e._h); e._h = setTimeout(() => e.classList.add('oculto'), 1800);
  }

  function sfxEfectos(efectos, gane) {
    if (!efectos) return;
    if (efectos.includes('critico')) Sonido.play('critico');
    else if (efectos.includes('hit')) Sonido.play('hit');
    if (efectos.includes('bloqueo')) Sonido.play('bloqueo');
    if (efectos.includes('robo')) Sonido.play('robo');
    if (efectos.includes('fuera')) Sonido.play('fuera');
    if (efectos.includes('fin') && $('pantalla-juego').classList.contains('activa')) setTimeout(() => mostrarFin(), 900);
  }

  // ---------- interacción ----------
  function onCarta(idx) {
    const v = vista();
    if (!v || v.estado !== 'jugando') return;
    if (v.turno !== App.miId) { toast('No es tu turno'); return; }
    const vivos = v.jugadores.filter(j => !j.fuera && j.id !== App.miId);
    if (App.objetivoPend === idx) { App.objetivoPend = null; render(); return; }
    if (vivos.length === 1) { lanzar(idx, vivos[0].id); return; }
    App.objetivoPend = idx;
    render();
    toast('Elige al rival objetivo');
  }

  function onRival(jid) {
    if (App.objetivoPend === null) return;
    const idx = App.objetivoPend;
    App.objetivoPend = null;
    lanzar(idx, jid);
  }

  function lanzar(idx, objId) {
    Sonido.play('arrojar');
    if (App.modo === 'local') {
      const r = Motor.jugarCarta(App.st, 0, idx, objId);
      if (!r.ok) { toast(r.err); return; }
      evento(r.resumen);
      sfxEfectos(r.efectos);
      render();
      pasoBots();
    } else {
      Red.accion({ tipo: 'jugar', codigo: App.codigo, token: App.token, idx: idx, objId: objId })
        .then(r => { evento(r.resumen); sfxEfectos(r.efectos); })
        .catch(e => toast(e.message));
    }
  }

  function pasar() {
    Sonido.play('pasar');
    App.objetivoPend = null;
    if (App.modo === 'local') {
      const r = Motor.pasar(App.st, 0);
      if (!r.ok) { toast(r.err); return; }
      render(); pasoBots();
    } else {
      Red.accion({ tipo: 'pasar', codigo: App.codigo, token: App.token })
        .catch(e => toast(e.message));
    }
  }

  // ---------- modo local ----------
  function iniciarIA() {
    pedirNombre();
    App.modo = 'local';
    App.miId = 0;
    App.bots = parseInt(document.querySelector('#sel-bots .seg.activo').dataset.bots, 10);
    const nombres = [App.nombre], bots = [false];
    for (let i = 1; i <= App.bots; i++) { nombres.push('Bot ' + i); bots.push(true); }
    App.st = Motor.crearPartida({ nombres: nombres, bots: bots });
    App.objetivoPend = null;
    ir('pantalla-juego');
    $('partida-codigo').textContent = 'partida local vs ' + App.bots + ' bot' + (App.bots > 1 ? 's' : '');
    render();
    setTimeout(pasoBots, 600);
  }

  function pasoBots() {
    const st = App.st;
    if (st.estado !== 'jugando') { setTimeout(mostrarFin, 700); return; }
    const j = st.jugadores[st.turno];
    if (!j.esBot) { Sonido.play('turno'); render(); return; }
    setTimeout(() => {
      const jugada = Motor.iaJugada(st, j.id);
      const r = jugada ? Motor.jugarCarta(st, j.id, jugada.idx, jugada.objId) : Motor.pasar(st, j.id);
      if (r.ok && r.resumen) { evento(r.resumen); sfxEfectos(r.efectos); }
      render();
      pasoBots();
    }, 850);
  }

  // ---------- modo online ----------
  function abrirStream() {
    if (App.es) App.es.close();
    let turnoPrev = null;
    App.es = Red.stream(App.codigo, App.token, msg => {
      if (msg.tipo === 'lobby') { App.sala = msg.sala; renderLobby(); return; }
      if (msg.tipo !== 'estado' || !msg.vista) return;
      App.sala = msg.sala; App.vistaSrv = msg.vista;
      const v = msg.vista;
      if (v.estado === 'jugando') {
        if (!$('pantalla-juego').classList.contains('activa')) { ir('pantalla-juego'); $('partida-codigo').textContent = 'sala ' + App.codigo; }
        if (turnoPrev !== null && v.turno === App.miId && turnoPrev !== App.miId) Sonido.play('turno');
        turnoPrev = v.turno;
        render();
      } else if (v.estado === 'terminada') {
        render();
        setTimeout(mostrarFin, 800);
      } else {
        renderLobby();
      }
    });
  }

  function renderLobby() {
    if (!App.sala) return;
    $('codigo-sala').textContent = App.sala.codigo;
    const ul = $('lista-lobby');
    ul.innerHTML = App.sala.jugadores.map(j =>
      '<li><span>' + (j.esBot ? '🤖 ' : '') + j.nombre + (j.id === 0 ? ' 👑' : '') + '</span><span class="sutil">' +
      (App.sala.iniciada ? '❤' + j.hp : 'esperando') + '</span></li>').join('');
    const soyHost = App.miId === 0;
    $('btn-iniciar').classList.toggle('oculto', !soyHost || App.sala.iniciada);
    $('btn-bot').classList.toggle('oculto', !soyHost || App.sala.iniciada);
  }

  function crearSala() {
    pedirNombre();
    Red.crear(App.nombre).then(r => {
      App.modo = 'online'; App.codigo = r.codigo; App.token = r.token; App.miId = r.yo;
      App.revancha = false;
      ir('pantalla-sala');
      $('codigo-sala').textContent = r.codigo;
      $('lista-lobby').innerHTML = '';
      abrirStream();
    }).catch(e => toast(e.message));
  }

  function unirse(cod) {
    cod = String(cod || '').toUpperCase().trim();
    if (cod.length !== 4) { toast('Código de 4 letras'); return; }
    const nEscrito = ($('inp-nombre-u').value || '').trim().slice(0, 16);
    if (nEscrito) { App.nombre = nEscrito; localStorage.setItem('sp_nombre', nEscrito); }
    pedirNombre();
    Red.unirse(cod, App.nombre).then(r => {
      App.modo = 'online'; App.codigo = r.codigo; App.token = r.token; App.miId = r.yo;
      ir('pantalla-sala');
      $('codigo-sala').textContent = r.codigo;
      abrirStream();
    }).catch(e => {
      $('unirse-error').textContent = e.message;
      toast(e.message);
    });
  }

  function accionOnline(extra) {
    return Red.accion(Object.assign({ codigo: App.codigo, token: App.token }, extra)).catch(e => toast(e.message));
  }

  function mostrarFin() {
    const v = vista();
    if (!v) return;
    const gana = v.ganador === App.miId;
    $('emoji-fin').textContent = gana ? '🏆' : '😵';
    $('fin-titulo').textContent = gana ? '¡Victoria!' : 'Derrota';
    $('fin-sub').textContent = v.ganador !== null
      ? (gana ? 'Te adueñaste del duelo.' : v.jugadores[v.ganador].nombre + ' gana la partida.')
      : 'Partida terminada.';
    Sonido.play(gana ? 'ganar' : 'perder');
    $('btn-revancha').classList.toggle('oculto', App.modo === 'online' && App.miId !== 0);
    ir('pantalla-fin');
  }

  // ---------- wiring ----------
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => ir(b.dataset.ir)));
  $('btn-sonido').addEventListener('click', () => {
    const on = Sonido.alternar();
    $('btn-sonido').textContent = on ? '🔊' : '🔇';
    toast(on ? 'Sonido activado' : 'Sonido silenciado');
  });
  $('btn-sonido').textContent = Sonido.estaActivo() ? '🔊' : '🔇';

  document.querySelectorAll('#sel-bots .seg').forEach(s => s.addEventListener('click', () => {
    document.querySelectorAll('#sel-bots .seg').forEach(x => x.classList.remove('activo'));
    s.classList.add('activo');
    Sonido.play('click');
  }));

  $('btn-jugar-ia').addEventListener('click', iniciarIA);
  $('btn-crear').addEventListener('click', crearSala);
  $('btn-unirse').addEventListener('click', () => unirse($('inp-codigo').value));
  $('inp-codigo').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, ''); });
  $('inp-codigo').addEventListener('keydown', e => { if (e.key === 'Enter') unirse($('inp-codigo').value); });
  $('btn-copiar').addEventListener('click', () => {
    const enlace = location.origin + location.pathname + '?sala=' + App.codigo;
    (navigator.clipboard ? navigator.clipboard.writeText(enlace) : Promise.reject())
      .then(() => toast('Enlace copiado ✓'))
      .catch(() => { prompt('Copia el enlace:', enlace); });
  });
  $('btn-iniciar').addEventListener('click', () => accionOnline({ tipo: 'iniciar' }));
  $('btn-bot').addEventListener('click', () => accionOnline({ tipo: 'bot' }));
  $('btn-pasar').addEventListener('click', pasar);
  $('btn-salir').addEventListener('click', () => { salir(); ir('pantalla-menu'); });
  $('btn-revancha').addEventListener('click', () => {
    if (App.modo === 'local') iniciarIA();
    else { accionOnline({ tipo: 'iniciar' }); toast('Nueva partida'); }
  });

  function salir() {
    if (App.es) { App.es.close(); App.es = null; }
    App.modo = null; App.st = null; App.vistaSrv = null; App.codigo = null; App.objetivoPend = null;
  }
  document.querySelectorAll('#pantalla-menu [data-ir], #pantalla-sala [data-ir]').forEach(b =>
    b.addEventListener('click', () => { if (b.dataset.ir === 'pantalla-menu') salir(); }));

  // instalar PWA
  let promptInstalar = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); promptInstalar = e;
    $('btn-instalar').classList.remove('oculto');
  });
  $('btn-instalar').addEventListener('click', () => {
    if (promptInstalar) { promptInstalar.prompt(); promptInstalar = null; $('btn-instalar').classList.add('oculto'); }
  });

  // service worker
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  // enlace de invitación ?sala=XXXX
  const params = new URLSearchParams(location.search);
  const salaLink = params.get('sala');
  if (salaLink) {
    $('inp-codigo').value = salaLink.toUpperCase().slice(0, 4);
    ir('pantalla-unirse', true);
    $('inp-nombre-u').focus();
  }
  // guardar nombre escrito en pantalla unirse
  $('inp-nombre-u').addEventListener('change', e => {
    const n = e.target.value.trim().slice(0, 16);
    if (n) { App.nombre = n; localStorage.setItem('sp_nombre', n); }
  });
})();
