(function () {
  const gate = document.getElementById('ageGate');
  const main = document.getElementById('site');
  const AGED = 'sxo_mx_aged';

  function enter() {
    localStorage.setItem(AGED, '1');
    gate.classList.add('hidden');
    main.classList.remove('hidden');
  }

  document.getElementById('ageYes').addEventListener('click', enter);
  document.getElementById('ageNo').addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });

  if (localStorage.getItem(AGED) === '1') enter();
  else main.classList.add('hidden');

  const CATEGORIAS = [
    { id: 'curiosos', nombre: 'Para curiosos', icon: '🎯' },
    { id: 'parejas', nombre: 'Para parejas', icon: '💞' },
    { id: 'lenceria', nombre: 'Lencería', icon: '🪡' },
    { id: 'lubricantes', nombre: 'Lubricantes y cuidado', icon: '🧴' },
    { id: 'kink', nombre: 'Kink suave', icon: '🪢' },
  ];

  const PRODUCTOS = [
    { id: 1, cat: 'curiosos', nombre: 'Mini vibrador clitoral', precio: 499, desc: 'Silicón médico, 9 vibraciones, discreto y fácil de usar.', material: 'Silicón médico' },
    { id: 2, cat: 'curiosos', nombre: 'Starter kit para empezar', precio: 899, desc: 'Vibrador + lubricante + guía digital. Todo para tu primer paso.', material: 'Mixto body-safe' },
    { id: 3, cat: 'curiosos', nombre: 'Estimulador de punto G', precio: 749, desc: 'Curva anatómica, 6 modos, control de una mano.', material: 'Silicón médico' },
    { id: 4, cat: 'curiosos', nombre: 'Bola del amor principiante', precio: 349, desc: 'Silenciosa, con cordón de retiro, para uso interno.', material: 'Silicón + ABS' },
    { id: 5, cat: 'curiosos', nombre: 'Masturbador manual para él', precio: 599, desc: 'Textura interior suave, fácil de lavar y de guardar.', material: 'TPE body-safe' },
    { id: 6, cat: 'curiosos', nombre: 'Anillo vibrador', precio: 449, desc: 'Doble estimulación, 3 velocidades, ajustable.', material: 'Silicón médico' },
    { id: 7, cat: 'curiosos', nombre: 'Mesa educativa: tu cuerpo', precio: 299, desc: 'Guía ilustrada de anatomía y placer sin mitos.', material: 'Papel reciclado' },

    { id: 8, cat: 'parejas', nombre: 'Vibrador de pareja U', precio: 1199, desc: 'Estimula los dos lados a la vez, manos libres.', material: 'Silicón médico' },
    { id: 9, cat: 'parejas', nombre: 'Set de juego para dos', precio: 1399, desc: 'Vibrador + ataduras suaves + lubricante. Noche garantizada.', material: 'Mixto body-safe' },
    { id: 10, cat: 'parejas', nombre: 'Control remoto largo alcance', precio: 1099, desc: 'Se controla a distancia. Emoción para jugar lejos.', material: 'Silicón médico' },
    { id: 11, cat: 'parejas', nombre: 'Baraja de retos íntimos', precio: 249, desc: '52 cartas para explorar juntos sin pena.', material: 'Cartón' },
    { id: 12, cat: 'parejas', nombre: 'Vibrador doble en C', precio: 999, desc: 'Estimulación dual para él y para ella.', material: 'Silicón médico' },
    { id: 13, cat: 'parejas', nombre: 'Juego de dados picantes', precio: 199, desc: 'Tira los dados y decide qué sigue. Diversión ligera.', material: 'Plástico ABS' },

    { id: 14, cat: 'lenceria', nombre: 'Conjunto encaje negro', precio: 699, desc: 'Tallas S–XL. Transparente elegante, no vulgar.', material: 'Encaje + lycra' },
    { id: 15, cat: 'lenceria', nombre: 'Body con abertura', precio: 799, desc: 'Abrochado rápido, favorece todas las siluetas.', material: 'Encaje elástico' },
    { id: 16, cat: 'lenceria', nombre: 'Bóxer seda para él', precio: 549, desc: 'Corte a la medida, tela que se siente piel.', material: 'Seda artificial' },
    { id: 17, cat: 'lenceria', nombre: 'Babydoll con detalle encaje', precio: 649, desc: 'Ligero, fresco, ideal para cualquier noche.', material: 'Poliamida' },
    { id: 18, cat: 'lenceria', nombre: 'Corset básico', precio: 949, desc: 'Con ballenas flexibles, ajuste con lazos.', material: 'Algodón + encaje' },
    { id: 19, cat: 'lenceria', nombre: 'Calcetín liga + liguero', precio: 499, desc: 'Set clásico, talla única ajustable.', material: 'Nylon' },

    { id: 20, cat: 'lubricantes', nombre: 'Lubricante base agua 250ml', precio: 189, desc: 'Compatible con todos los materiales, sin sabor.', material: 'Base agua' },
    { id: 21, cat: 'lubricantes', nombre: 'Lubricante silicona premium', precio: 249, desc: 'Extra duradero, ideal para ducha o bañera.', material: 'Silicona pura' },
    { id: 22, cat: 'lubricantes', nombre: 'Lubricante con sabor fresa', precio: 179, desc: 'Base agua, comestible, aroma suave.', material: 'Base agua' },
    { id: 23, cat: 'lubricantes', nombre: 'Kit limpieza juguetes', precio: 229, desc: 'Limpieza en spray + toallitas antibacterianas.', material: 'Hipoalergénico' },
    { id: 24, cat: 'lubricantes', nombre: 'Preservativos extra finos (12)', precio: 259, desc: 'Delgados y resistentes, probados.', material: 'Látex' },

    { id: 25, cat: 'kink', nombre: 'Ataduras suaves de seda (2m)', precio: 349, desc: 'Para muñecas o tobillos, nudo fácil de soltar.', material: 'Seda' },
    { id: 26, cat: 'kink', nombre: 'Venda para ojos', precio: 199, desc: 'Bloquea la luz por completo, suave al tacto.', material: 'Algodón' },
    { id: 27, cat: 'kink', nombre: 'Set pinzas de pezón', precio: 429, desc: 'Con cadenita, presión ajustable y suave.', material: 'Acero inoxidable' },
    { id: 28, cat: 'kink', nombre: 'Fusta de iniciación', precio: 549, desc: 'Sensación ligera, mango ergonómico.', material: 'Cuero vegano' },
  ];

  let cart = JSON.parse(localStorage.getItem('sxo_cart') || '{}');
  let catActiva = 'curiosos';
  let metodo = 'tarjeta';

  const $ = (id) => document.getElementById(id);

  function fmt(n) { return '$' + n.toLocaleString('es-MX'); }

  function mostrar(view) {
    document.querySelectorAll('.view, #inicio').forEach((v) => v.classList.add('hidden'));
    if (view === 'inicio') {
      $('inicio').classList.remove('hidden');
      window.scrollTo(0, 0);
    } else {
      const el = $(view);
      el.classList.remove('hidden');
      window.scrollTo(0, 0);
      if (view === 'catalogo') renderCat();
      if (view === 'carrito') renderCart();
      if (view === 'pago') renderPago();
    }
  }

  function renderCat() {
    const tabs = $('catTabs');
    tabs.innerHTML = CATEGORIAS.map((c) =>
      `<button class="cat-tab ${c.id === catActiva ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.nombre}</button>`
    ).join('');

    const grid = $('productGrid');
    const items = PRODUCTOS.filter((p) => p.cat === catActiva);
    grid.innerHTML = items.map((p) => {
      const q = cart[p.id] || 0;
      return `<article class="product">
        <div class="product-thumb">${p.nombre.slice(0, 2).toUpperCase()}</div>
        <h3>${p.nombre}</h3>
        <p class="product-desc">${p.desc}</p>
        <p class="product-mat">${p.material}</p>
        <div class="product-foot">
          <span class="product-price">${fmt(p.precio)}</span>
          ${q > 0
            ? `<div class="qty"><button data-q="-${p.id}">−</button><span>${q}</span><button data-q="+${p.id}">+</button></div>`
            : `<button class="btn btn-primary add" data-add="${p.id}">Agregar</button>`}
        </div>
      </article>`;
    }).join('');

    tabs.querySelectorAll('.cat-tab').forEach((t) =>
      t.addEventListener('click', () => { catActiva = t.dataset.cat; renderCat(); })
    );
  }

  function guardar() {
    localStorage.setItem('sxo_cart', JSON.stringify(cart));
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    $('cartCount').textContent = total;
  }

  function cambiarCant(id, delta) {
    id = String(id);
    const p = PRODUCTOS.find((x) => x.id === Number(id));
    if (!p) return;
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    guardar();
    if (!$('carrito').classList.contains('hidden')) renderCart();
    else renderCat();
  }

  $('productGrid').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const q = e.target.closest('[data-q]');
    if (add) cambiarCant(add.dataset.add, 1);
    if (q) {
      const [s, id] = [q.dataset.q[0], q.dataset.q.slice(1)];
      cambiarCant(id, s === '+' ? 1 : -1);
    }
  });

  function renderCart() {
    const ids = Object.keys(cart);
    const empty = $('cartEmpty');
    const summary = $('cartSummary');
    const items = $('cartItems');

    if (!ids.length) {
      empty.classList.remove('hidden');
      summary.classList.add('hidden');
      items.innerHTML = '';
      return;
    }
    empty.classList.add('hidden');
    summary.classList.remove('hidden');

    let subtotal = 0;
    items.innerHTML = ids.map((id) => {
      const p = PRODUCTOS.find((x) => x.id === Number(id));
      if (!p) return '';
      const q = cart[id];
      subtotal += p.precio * q;
      return `<article class="cart-item">
        <div class="product-thumb sm">${p.nombre.slice(0, 2).toUpperCase()}</div>
        <div class="cart-info">
          <h4>${p.nombre}</h4>
          <p>${fmt(p.precio)} × ${q}</p>
        </div>
        <div class="qty"><button data-q="-${id}">−</button><span>${q}</span><button data-q="+${id}">+</button></div>
        <span class="cart-line-total">${fmt(p.precio * q)}</span>
        <button class="cart-remove" data-rm="${id}" title="Quitar">✕</button>
      </article>`;
    }).join('');

    $('subtotal').textContent = fmt(subtotal);
    $('cartTotal').textContent = fmt(subtotal);
    guardar();
  }

  $('cartItems').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    const rm = e.target.closest('[data-rm]');
    if (q) {
      const [s, id] = [q.dataset.q[0], q.dataset.q.slice(1)];
      cambiarCant(id, s === '+' ? 1 : -1);
    }
    if (rm) {
      delete cart[rm.dataset.rm];
      guardar();
      renderCart();
    }
  });

  $('goCheckout').addEventListener('click', () => mostrar('pago'));

  function renderPago() {
    const ids = Object.keys(cart);
    if (!ids.length) { mostrar('carrito'); return; }
    const total = ids.reduce((a, id) => a + (PRODUCTOS.find((p) => p.id === Number(id)).precio * cart[id]), 0);
    $('pagoResumen').innerHTML = ids.map((id) => {
      const p = PRODUCTOS.find((x) => x.id === Number(id));
      return `<p>${p.nombre} × ${cart[id]} — ${fmt(p.precio * cart[id])}</p>`;
    }).join('');
    $('pagoResumen').insertAdjacentHTML('beforeend', `<p class="cart-total">Total: ${fmt(total)}</p>`);
    $('payBtn').textContent = `Pagar ${fmt(total)}`;
    $('payBtn').dataset.total = total;
    $('payForm').classList.remove('hidden');
    $('payResult').classList.add('hidden');
    $('#payResultText').textContent = '';
  }

  document.querySelectorAll('.pmethod').forEach((b) =>
    b.addEventListener('click', () => {
      metodo = b.dataset.method;
      document.querySelectorAll('.pmethod').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      $('cardFields').classList.toggle('hidden', metodo === 'paypal');
      ['payCard', 'payExp', 'payCvc'].forEach((id) => {
        const f = $(id);
        f.required = metodo === 'tarjeta';
        if (metodo !== 'tarjeta') f.value = '';
      });
    })
  );

  $('payForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const total = $('payBtn').dataset.total || 0;
    const metodoTxt = metodo === 'tarjeta' ? `tarjeta terminación ${$('payCard').value.slice(-4)}` : 'PayPal';
    $('payForm').classList.add('hidden');
    $('payResult').classList.remove('hidden');
    const orden = 'SXO-' + Date.now().toString().slice(-6);
    $('payResultText').innerHTML =
      `Pedido <b>${orden}</b> pagado con ${metodoTxt} por <b>${fmt(Number(total))}</b> (simulación).<br>
       Envío en 3–6 días hábiles en caja neutra. Te enviamos el rastreo a <b>${$('payEmail').value}</b>.`;
    cart = {};
    guardar();
    renderCart();
    $('payBtn').textContent = 'Pagar $0';
    delete $('payBtn').dataset.total;
  });

  document.querySelectorAll('[data-view]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      mostrar(el.dataset.view);
    })
  );

  mostrar('inicio');
})();
