/* М'яке диво — Premium 7.1 SEO Share */
(() => {
  'use strict';

  const BASE =
    'https://wildhelp.github.io/myake-dyvo/';

  function init() {
    const grid = document.getElementById('products');
    if (!grid) return;

    const css = document.createElement('style');

    css.textContent = `
      .p70-share,
      .p71-product-link {
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        width:100%;
        box-sizing:border-box;
        padding:12px;
        margin-top:10px;
        border:1px solid #e5c6d1;
        border-radius:14px;
        background:#fff6f8;
        color:#a43e65;
        font-size:14px;
        font-weight:700;
        cursor:pointer;
        text-decoration:none;
      }

      .p71-product-link {
        background:#fffaf6;
        color:#503d49;
      }

      .p70-share:active,
      .p71-product-link:active {
        transform:scale(.97);
      }

      #p70-toast {
        position:fixed;
        bottom:25px;
        left:50%;
        transform:translateX(-50%);
        max-width:90%;
        width:max-content;
        padding:14px 22px;
        background:#503d49;
        color:white;
        border-radius:16px;
        box-shadow:0 8px 30px #0003;
        z-index:2147483647;
        text-align:center;
        font-size:14px;
      }
    `;

    document.head.append(css);

    let toastTimer;
    let selectedId = null;
    let selectedName = '';

    const requestedId =
      new URLSearchParams(location.search)
        .get('product');

    let pendingId =
      requestedId && /^\d+$/.test(requestedId)
        ? requestedId
        : null;

    function toast(text) {
      let el = document.getElementById('p70-toast');

      if (!el) {
        el = document.createElement('div');
        el.id = 'p70-toast';
        el.setAttribute('role', 'status');
        document.body.append(el);
      }

      el.textContent = text;
      el.hidden = false;

      clearTimeout(toastTimer);

      toastTimer = setTimeout(() => {
        el.hidden = true;
      }, 3000);
    }

    function productUrl(id) {
      if (!/^[1-9]\d*$/.test(String(id))) {
        return BASE;
      }

      return BASE + 'products/' + id + '/';
    }

    function legacyUrl(id) {
      const url = new URL(BASE);
      url.searchParams.set('product', id);
      return url.href;
    }

    async function availableUrl(id) {
      const url = productUrl(id);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-cache'
        });

        if (response.ok) return url;
      } catch {}

      return legacyUrl(id);
    }

    async function shareProduct(id, name) {
      const url = await availableUrl(id);

      if (navigator.share) {
        try {
          await navigator.share({
            title: name + ' — М’яке диво',
            text: 'Подивись цю іграшку ручної роботи ♡',
            url
          });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        toast('✓ Посилання скопійовано');
      } catch {
        window.prompt(
          'Скопіюйте посилання на іграшку:',
          url
        );
      }
    }

    function createButton(handler) {
      const button = document.createElement('button');

      button.type = 'button';
      button.className = 'p70-share';
      button.textContent = '↗ Поділитися';

      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        handler();
      });

      return button;
    }

    function createProductLink(id, name) {
      const link = document.createElement('a');

      link.className = 'p71-product-link';
      link.href = productUrl(id);
      link.textContent = 'Сторінка іграшки';

      link.setAttribute(
        'aria-label',
        'Сторінка товару: ' + name
      );

      link.addEventListener('click', async event => {
        event.stopPropagation();

        if (
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        ) return;

        event.preventDefault();

        location.href = await availableUrl(id);
      });

      return link;
    }

    function updateCards() {
      grid.querySelectorAll('article.product')
        .forEach(card => {
          const add = card.querySelector('[data-add]');
          const details = card.querySelector('.details');

          if (!add || !details) return;

          const id = String(add.dataset.add);

          if (!/^[1-9]\d*$/.test(id)) return;

          const name =
            card.querySelector('h3')?.textContent ||
            'В’язана іграшка';

          if (!card.querySelector('.p71-product-link')) {
            details.append(
              createProductLink(id, name)
            );
          }

          if (!card.querySelector('.p70-share')) {
            details.append(
              createButton(() => {
                shareProduct(id, name);
              })
            );
          }
        });
    }

    function updateViewer() {
      const panel =
        document.getElementById('p46-info');

      if (!panel || !selectedId) return;

      if (!panel.querySelector('.p70-share')) {
        panel.append(createButton(() => {
          if (selectedId) {
            shareProduct(selectedId, selectedName);
          }
        }));
      }
    }

    grid.addEventListener('click', event => {
      const img = event.target.closest('.picture img');
      if (!img) return;

      const card = img.closest('article.product');
      const add = card?.querySelector('[data-add]');

      if (!add) return;

      selectedId = String(add.dataset.add);

      selectedName =
        card.querySelector('h3')?.textContent ||
        'В’язана іграшка';

      updateViewer();
    }, true);

    function openRequestedProduct() {
      if (!pendingId) return;

      const viewer =
        document.getElementById('yg-viewer');

      const panel =
        document.getElementById('p46-info');

      if (!viewer || !panel) return;

      const add = [...grid.querySelectorAll('[data-add]')]
        .find(button =>
          String(button.dataset.add) === pendingId
        );

      const img = add
        ?.closest('article.product')
        ?.querySelector('.picture img');

      if (!img) return;

      pendingId = null;
      img.click();
    }

    let scheduled = false;

    function refresh() {
      if (scheduled) return;

      scheduled = true;

      requestAnimationFrame(() => {
        scheduled = false;
        updateCards();
        updateViewer();
        openRequestedProduct();
      });
    }

    const observer = new MutationObserver(refresh);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    refresh();

    if (pendingId) {
      setTimeout(() => {
        if (pendingId) {
          pendingId = null;
          toast(
            'Не вдалося відкрити іграшку. Перегляньте каталог.'
          );
        }
      }, 20000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
