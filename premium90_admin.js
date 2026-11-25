
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
      
