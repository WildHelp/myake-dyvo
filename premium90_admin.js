
/* М'яке диво — Premium 9.0 Admin */
(() => {
  'use strict';

  function init() {
    const panel = document.getElementById('adminPanel');
    if (!panel || document.getElementById('p90-nav')) return;

    const css = document.createElement('style');

    css.textContent = `
      .main {
        padding: 12px 10px 30px !important;
      }

      header {
        padding: 12px !important;
      }

      header h1 {
        font-size: 22px !important;
      }

      .card {
        padding: 13px !important;
        margin-bottom: 12px !important;
        border-radius: 15px !important;
      }

      .card h2 {
        font-size: 21px !important;
        margin-bottom: 10px;
      }

      .card h3 {
        font-size: 17px !important;
      }

      .card button {
        padding: 9px 12px !important;
        font-size: 13px !important;
      }

      .card input,
      .card select,
      .card textarea {
        padding: 10px !important;
        font-size: 14px !important;
      }

      .card label {
        margin-top: 10px;
      }

      .product {
        padding: 10px 0 !important;
        gap: 10px !important;
      }

      .product img {
        width: 65px !important;
        height: 65px !important;
      }

      .product-info .actions {
        gap: 5px !important;
      }

      .muted {
        font-size: 12px !important;
      }

      #p90-nav {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
        margin-bottom: 14px;
      }

      #p90-nav button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        min-height: 65px;
        padding: 8px 3px;
        background: #fff;
        color: #503b46;
        border: 1px solid #eadbdc;
        border-radius: 12px;
        font-size: 11px;
      }

      #p90-nav button span {
        font-size: 21px;
      }

      #p90-nav button.active {
        background: #9b5271;
        color: white;
        border-color: #9b5271;
      }

      .p90-hide {
        display: none !important;
      }

      #p90-account-footer {
        text-align: center;
        padding: 16px 5px;
        margin-top: 12px;
        border-top: 1px solid #eadbdc;
      }

      #p90-account-footer button {
        font-size: 12px !important;
        padding: 7px 16px !important;
        background: #f4e6eb;
        color: #785568;
      }

      #p90-account-footer small {
        display: block;
        margin-top: 10px;
        color: #82757c;
        font-size: 11px;
      }

      @media(max-width: 360px) {
        #p90-nav {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
    `;

    document.head.append(css);

    const tabs = [
      ['overview', '📊', 'Огляд'],
      ['orders', '📦', 'Замовлення'],
      ['products', '🧸', 'Мої товари'],
      ['editor', '➕', 'Додати'],
      ['promo', '🎟️', 'Промокоди'],
      ['reviews', '⭐', 'Відгуки'],
      ['analytics', '📈', 'Аналітика'],
      ['account', '⚙️', 'Акаунт']
    ];

    let current = 'overview';

    const nav = document.createElement('nav');
    nav.id = 'p90-nav';
    nav.setAttribute('aria-label', 'Розділи адмінпанелі');

    tabs.forEach(([id, icon, name]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.tab = id;

      const symbol = document.createElement('span');
      symbol.textContent = icon;

      button.append(symbol, document.createTextNode(name));

      button.onclick = () => {
        current = id;
        refresh();
        nav.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      };

      nav.append(button);
    });

    panel.prepend(nav);

    const footer = document.createElement('div');
    footer.id = 'p90-account-footer';

    const logout = document.getElementById('logoutBtn');

    if (logout) {
      logout.textContent = 'Вийти з акаунту';
      footer.append(logout);
    }

    const copyright = document.createElement('small');
    copyright.textContent = 'М’яке диво · Premium 9.0';

    footer.append(copyright);
    panel.append(footer);

    function classify(el) {
      if (el.id === 'editorCard') return 'editor';
      if (el.querySelector('#productsList')) return 'products';
      if (el.querySelector('#userLabel')) return 'account';

      const heading = el.querySelector('h2, h3');
      const text = (heading?.textContent || '')
        .toLocaleLowerCase('uk');

      if (text.includes('статистика магазину')) {
        return 'overview';
      }

      if (text.includes('аналітика магазину')) {
        return 'analytics';
      }

      if (text.includes('замовлення')) return 'orders';
      if (text.includes('промокод')) return 'promo';
      if (text.includes('відгуки')) return 'reviews';
      if (text.includes('мої товари')) return 'products';

      return null;
    }

    function refresh() {
      const main = panel.closest('main') || document.body;

      const sections = new Set([
        ...panel.children,
        ...main.children
      ]);

      sections.forEach(el => {
        if (el === panel ||
            el === nav ||
            el === footer ||
            el.id === 'loginPanel') return;

        const type = classify(el);
        if (!type) return;

        if (el.parentElement !== panel) {
          panel.insertBefore(el, footer);
        }

        el.classList.toggle('p90-hide', type !== current);
      });

      nav.querySelectorAll('[data-tab]').forEach(button => {
        const active = button.dataset.tab === current;

        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    document.addEventListener('click', event => {
      const edit = event.target.closest('#productsList .edit');

      if (edit) {
        current = 'editor';
        refresh();

        requestAnimationFrame(() => {
          document.getElementById('editorCard')
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        });
      }
    }, true);

    let scheduled = false;

    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        refresh();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Premium 9.1 — Admin Design Upgrade */
(() => {
  'use strict';

  const style = document.createElement('style');

  style.textContent = `
    header .wrap {
      flex-wrap: nowrap;
      align-items: center;
    }

    header a {
      white-space: nowrap;
      font-size: 12px;
      text-decoration: none;
      background: #f4e6eb;
      padding: 8px 10px;
      border-radius: 10px;
    }

    header .muted {
      font-size: 11px !important;
    }

    #p90-nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #fff9f6f5;
      backdrop-filter: blur(12px);
      padding: 7px 0;
      gap: 5px;
    }

    #p90-nav button {
      min-height: 54px;
      border-radius: 10px;
      font-size: 10px;
      gap: 4px;
      padding: 6px 2px;
    }

    #p90-nav svg {
      width: 21px;
      height: 21px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #adminPanel > section {
      scroll-margin-top: 145px;
    }

    #adminPanel .card {
      border-radius: 13px !important;
      padding: 12px !important;
    }

    #adminPanel h2 {
      font-size: 20px !important;
    }

    #adminPanel h3 {
      font-size: 16px !important;
    }

    #productsList .product {
      padding: 9px 0 !important;
      gap: 9px !important;
    }

    #productsList .product img {
      width: 60px !important;
      height: 60px !important;
    }

    #productsList .product-info strong {
      font-size: 14px;
    }

    #productsList .actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 5px !important;
    }

    #productsList .actions button {
      font-size: 11px !important;
      padding: 8px 4px !important;
      border-radius: 8px !important;
    }

    #productsList button.delete {
      background: #fff0f2 !important;
      color: #9b3549 !important;
      border: 1px solid #edcbd3;
    }

    #p91-product-search {
      margin: 12px 0 8px;
      background: #fff9f6;
      border-radius: 10px;
      font-size: 13px;
    }

    .p91-stock {
      display: inline-block;
      border-radius: 6px;
      padding: 2px 6px;
      margin-top: 5px;
      font-size: 10px;
      font-weight: 650;
    }

    .p91-stock.good {
      color: #28734a;
      background: #e8f5ec;
    }

    .p91-stock.low {
      color: #92671e;
      background: #fff1d8;
    }

    .p91-stock.empty {
      color: #9b3549;
      background: #fce6eb;
    }

    .p91-filtered {
      display: none !important;
    }

    #p90-account-footer {
      padding: 10px 4px;
    }

    #p90-account-footer button {
      display: none;
    }

    #adminPanel.p91-account #logoutBtn {
      display: inline-block;
    }

    #globalStatus {
      font-size: 13px;
    }

    #p91-no-results {
      text-align: center;
      padding: 15px;
      font-size: 13px;
      color: #82757c;
    }
  `;

  document.head.append(style);

  const icons = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    orders: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    products: '<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M8 8V6a4 4 0 018 0v2"/>',
    editor: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    promo: '<path d="M3 5h18v4a3 3 0 000 6v4H3v-4a3 3 0 000-6zM15 5v3M15 11v2M15 16v3"/>',
    reviews: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    analytics: '<path d="M3 3v18h18M7 16l5-6 4 3 5-7"/>',
    account: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0116 0v2"/>'
  };

  function upgrade() {
    const panel = document.getElementById('adminPanel');
    const nav = document.getElementById('p90-nav');
    const list = document.getElementById('productsList');

    if (!panel || !nav || !list) return;

    nav.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.dataset.p91) return;

      const path = icons[btn.dataset.tab];

      if (path) {
        const span = btn.querySelector('span');

        if (span) {
          span.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            path + '</svg>';
        }
      }

      btn.dataset.p91 = '1';
    });

    panel.classList.toggle(
      'p91-account',
      !!nav.querySelector('[data-tab="account"].active')
    );

    const footer = document.querySelector(
      '#p90-account-footer small'
    );

    if (footer &&
        footer.textContent !== 'М’яке диво · Premium 9.1') {
      footer.textContent = 'М’яке диво · Premium 9.1';
    }

    let search = document.getElementById('p91-product-search');

    if (!search) {
      search = document.createElement('input');
      search.id = 'p91-product-search';
      search.type = 'search';
      search.placeholder = 'Пошук іграшок...';
      search.setAttribute('aria-label', 'Пошук товарів');
      list.before(search);

      search.addEventListener('input', filterProducts);
    }

    list.querySelectorAll('.product').forEach(row => {
      if (row.querySelector('.p91-stock')) return;

      const info = row.querySelector('.product-info');
      const muted = info?.querySelector('.muted');

      if (!muted) return;

      const match = muted.textContent.match(/(\d+)\s*шт/);

      if (!match) return;

      const stock = Number(match[1]);
      const badge = document.createElement('span');

      badge.className = 'p91-stock ' +
        (stock === 0 ? 'empty' : stock <= 2 ? 'low' : 'good');

      badge.textContent =
        stock === 0 ? 'Немає в наявності' :
        stock <= 2 ? 'Мало в наявності' :
        'В наявності';

      muted.after(badge);
    });

    const status = document.getElementById('globalStatus');

    if (status &&
        status.textContent.startsWith('Товари завантажено. Зміни')) {
      status.textContent = 'Товари завантажено.';
    }

    filterProducts();
  }

  function filterProducts() {
    const search = document.getElementById('p91-product-search');
    const list = document.getElementById('productsList');

    if (!search || !list) return;

    const query = search.value.trim().toLocaleLowerCase('uk');
    const rows = list.querySelectorAll('.product');

    let visible = 0;

    rows.forEach(row => {
      const name = row.querySelector('strong')?.textContent || '';
      const match = name.toLocaleLowerCase('uk').includes(query);

      row.classList.toggle('p91-filtered', !match);

      if (match) visible++;
    });

    let empty = document.getElementById('p91-no-results');

    if (rows.length && visible === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = 'p91-no-results';
        empty.textContent = 'Іграшок не знайдено';
        list.append(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  let scheduled = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      upgrade();
    });
  }

  const observer = new MutationObserver(schedule);

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  document.addEventListener('click', event => {
    if (event.target.closest('#p90-nav')) {
      schedule();
    }
  });

  schedule();
})();

      
