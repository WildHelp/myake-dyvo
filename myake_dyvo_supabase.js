
window.openDrawer = function(title, body, foot = '') {
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('drawerBody').innerHTML = body;
  document.getElementById('drawerFoot').innerHTML = foot;
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeDrawer = function() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.body.style.overflow = '';
};

/* М'яке диво від Яни — каталог Supabase */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://voaadlzlmiyuxclfqmmi.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const escapeHTML = value => String(value ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]
  );

  const safeImg = value => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };

  const placeholder = 'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">' +
      '<rect width="100%" height="100%" fill="#f9e9ed"/>' +
      '<text x="50%" y="48%" text-anchor="middle" font-size="70">🧶</text>' +
      '<text x="50%" y="60%" text-anchor="middle" font-size="22" fill="#865a65">Фото скоро буде</text>' +
      '</svg>'
    );

  let products = [];
  let basket = {};
  let category = 'Усі';

  const grid = document.getElementById('products');
  const filters = document.getElementById('filters');
  const search = document.getElementById('search');
  const count = document.getElementById('cartCount');

  if (!grid || !filters || !search || !count) {
    console.error('Не знайдено елементи каталогу.');
    return;
  }

  const money = value =>
    Number(value).toLocaleString('uk-UA', {
      maximumFractionDigits: 2
    }) + ' грн';

  try {
    basket = JSON.parse(
      localStorage.getItem('yana_live_cart') || '{}'
    ) || {};
  } catch {
    basket = {};
  }

  function save() {
    try {
      localStorage.setItem(
        'yana_live_cart',
        JSON.stringify(basket)
      );
    } catch {}

    count.textContent = Object.values(basket)
      .reduce((sum, qty) => sum + Number(qty || 0), 0);
  }

  function filteredProducts() {
    const query = search.value.trim().toLocaleLowerCase('uk');

    return products.filter(p =>
      (category === 'Усі' || p.category === category) &&
      `${p.name} ${p.description || ''}`
        .toLocaleLowerCase('uk')
        .includes(query)
    );
  }

  function render() {
    const categories = [
      'Усі',
      ...new Set(products.map(p => p.category).filter(Boolean))
    ];

    filters.innerHTML = categories.map(c => `
      <button class="filter ${c === category ? 'active' : ''}"
              data-filter="${escapeHTML(c)}">
        ${escapeHTML(c)}
      </button>
    `).join('');

    filters.querySelectorAll('[data-filter]').forEach(button => {
      button.onclick = () => {
        category = button.dataset.filter;
        render();
      };
    });

    const visible = filteredProducts();

    grid.innerHTML = visible.map(p => {
      const image = safeImg(p.image_url) || placeholder;
      const stock = Math.max(0, Number(p.stock) || 0);

      return `
        <article class="product">
          <div class="picture">
            <img loading="lazy"
                 src="${escapeHTML(image)}"
                 alt="${escapeHTML(p.name)}">
          </div>
          <div class="details">
            <span class="tag">
              ${escapeHTML(p.category || 'Ручна робота')}
            </span>
            <h3>${escapeHTML(p.name)}</h3>
            <p>${escapeHTML(
              p.description || 'Авторська в’язана іграшка від Яни'
            )}</p>
            <div class="bottom">
              <span class="price">${money(p.price)}</span>
              <button class="add"
                      data-add="${p.id}"
                      ${stock <= 0 ? 'disabled' : ''}>
                ${stock > 0 ? '+ У кошик' : 'Немає в наявності'}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('[data-add]').forEach(button => {
      button.onclick = () => {
        const p = products.find(
          item => String(item.id) === button.dataset.add
        );
        if (!p) return;

        basket[p.id] = Math.min(
          Number(p.stock),
          Number(basket[p.id] || 0) + 1
        );

        save();
        button.textContent = Number(basket[p.id]) >= Number(p.stock) ? "Більше немає в наявності" : "Додано ✓"; setTimeout(() => button.textContent = "+ У кошик", 1500);
      };
    });

    const noresults = document.getElementById('noresults');
    if (noresults) noresults.hidden = visible.length > 0;

    save();
  }

  function showCart() {
    const lines = Object.entries(basket)
      .map(([id, qty]) => ({
        product: products.find(p => String(p.id) === id),
        qty: Number(qty)
      }))
      .filter(item => item.product && item.qty > 0);

    const total = lines.reduce(
      (sum, item) =>
        sum + Number(item.product.price) * item.qty,
      0
    );

    const content = lines.length
      ? lines.map(({ product: p, qty }) => `
          <div class="cartitem">
            <img src="${escapeHTML(
              safeImg(p.image_url) || placeholder
            )}" alt="">
            <div>
              <strong>${escapeHTML(p.name)}</strong>
              <div>${qty} × ${money(p.price)}</div>
              <div class="qty">
                <button data-minus="${p.id}">−</button>
                <span>${qty}</span>
                <button data-plus="${p.id}">+</button>
              </div>
            </div>
          </div>
        `).join('') +
        `<p><strong>Разом: ${money(total)}</strong></p>`
      : '<p class="empty">Кошик порожній.</p>';

    if (typeof window.openDrawer !== 'function') {
      alert('Не вдалося відкрити кошик.');
      return;
    }

    window.openDrawer(
      'Мій кошик',
      content,
      lines.length
        ? '<button class="btn" id="copy-order">Скопіювати замовлення</button>'
        : '<button class="btn light" onclick="closeDrawer()">До каталогу</button>'
    );

    document.querySelectorAll(
      '[data-minus], [data-plus]'
    ).forEach(button => {
      button.onclick = () => {
        const id = button.dataset.minus || button.dataset.plus;
        const p = products.find(item => String(item.id) === id);
        if (!p) return;

        const change = button.dataset.plus ? 1 : -1;

        basket[id] = Math.max(
          0,
          Math.min(
            Number(p.stock),
            Number(basket[id] || 0) + change
          )
        );

        if (!basket[id]) delete basket[id];

        save();
        showCart();
      };
    });

    const copyButton = document.getElementById('copy-order');

    if (copyButton) {
      copyButton.onclick = async () => {
        const message =
          'Замовлення «М’яке диво від Яни»\n' +
          lines.map(({ product: p, qty }) =>
            `${p.name} — ${qty} шт. × ${money(p.price)}`
          ).join('\n') +
          `\nРазом: ${money(total)}`;

        try {
          await navigator.clipboard.writeText(message);
          alert('Замовлення скопійовано.');
        } catch {
          if (typeof window.showCopy === 'function') {
            window.showCopy(message);
          } else {
            alert(message);
          }
        }
      };
    }
  }

  window.openCart = showCart;

  window.showFavorites = () => {
    category = 'Усі';
    render();
    document.getElementById('catalog')?.scrollIntoView();
  };

  search.addEventListener('input', render);

  async function loadProducts() {
    grid.innerHTML =
      '<p class="empty">Завантажуємо іграшки Яни…</p>';

    try {
      const endpoint =
        `${SUPABASE_URL}/rest/v1/products` +
        '?select=id,name,price,description,image_url,stock,category,is_published' +
        '&is_published=eq.true&order=id.desc';

      const response = await fetch(endpoint, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`);
      }

      const rows = await response.json();

      if (!Array.isArray(rows)) {
        throw new Error('Неправильна відповідь сервера');
      }

      products = rows.filter(
        p => p && p.name && Number.isFinite(Number(p.price))
      );

      render();

      

      const description =
        document.querySelector('#catalog .section-desc');

      if (description) {
        description.textContent =
          'Справжні авторські іграшки Яни. ' +
          'Ціни та наявність оновлюються з каталогу.';
      }

      if (!products.length) {
        grid.innerHTML =
          '<p class="empty">Опублікованих товарів поки немає.</p>';
      }

    } catch (error) {
      console.error(error);

      grid.innerHTML =
        '<p class="empty">Не вдалося завантажити каталог. ' +
        'Перевірте налаштування Supabase.</p>';
    }
  }

  loadProducts();
})();
