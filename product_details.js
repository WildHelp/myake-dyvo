
/* М'яке диво від Яни — Premium 4.6 */
(() => {
  'use strict';

  const API = 'https://voaadlzlmiyuxclfqmmi.supabase.co';
  const KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const init = () => {
    const grid = document.getElementById('products');
    const viewer = document.getElementById('yg-viewer');
    const stage = viewer?.querySelector('.yg-stage');

    if (!grid || !stage || document.getElementById('p46-info')) {
      return;
    }

    const css = document.createElement('style');
    css.textContent = `
      #yg-viewer .yg-stage {
        overflow-y:auto;
        justify-content:flex-start;
        padding-top:65px;
        padding-bottom:22px;
        box-sizing:border-box;
      }
      #yg-viewer .yg-photo {
        max-height:45vh;
        flex-shrink:0;
      }
      #yg-viewer .yg-controls {
        position:fixed;
        top:42%;
        left:12px;
        right:12px;
      }
      #p46-info {
        width:100%;
        max-width:620px;
        background:#fffaf7;
        color:#352832;
        border-radius:20px;
        padding:18px;
        box-sizing:border-box;
        margin:4px auto 0;
        flex-shrink:0;
      }
      #p46-info h2 {
        font-size:21px;
        margin:0 0 8px;
        color:#352832;
      }
      #p46-info .p46-price {
        font-size:24px;
        font-weight:800;
        color:#a43e65;
        margin:12px 0;
      }
      #p46-info .p46-stock {
        font-size:13px;
        font-weight:700;
        margin:8px 0;
      }
      #p46-info .p46-description {
        font-size:14px;
        line-height:1.65;
        white-space:pre-line;
        overflow-wrap:anywhere;
      }
      #p46-info .p46-add {
        width:100%;
        border:0;
        border-radius:13px;
        padding:15px;
        font-size:16px;
        font-weight:700;
        background:#a43e65;
        color:white;
        cursor:pointer;
        margin-top:12px;
      }
      #p46-info .p46-add:disabled {
        background:#b9aeb3;
        cursor:not-allowed;
      }
      #p46-info .p46-message {
        font-size:13px;
        text-align:center;
        min-height:18px;
        margin-top:7px;
      }
      @media(max-width:600px) {
        #yg-viewer .yg-photo {max-height:38vh}
        #p46-info {padding:15px}
        #yg-viewer .yg-controls {
          left:4px;
          right:4px;
          top:35%;
        }
      }
    `;
    document.head.append(css);

    const panel = document.createElement('section');
    panel.id = 'p46-info';
    panel.hidden = true;

    panel.innerHTML = `
      <h2 id="p46-name"></h2>
      <div id="p46-stock" class="p46-stock"></div>
      <div id="p46-description"
           class="p46-description"></div>
      <div id="p46-price" class="p46-price"></div>
      <button id="p46-add" class="p46-add"
              type="button">
        🛒 Додати в кошик
      </button>
      <div id="p46-message"
           class="p46-message"
           role="status"></div>
    `;

    stage.append(panel);

    const $ = id => document.getElementById(id);

    let selectedId = null;
    let selectedCard = null;
    let requestNumber = 0;

    const money = value =>
      Number(value).toLocaleString('uk-UA', {
        maximumFractionDigits:2
      }) + ' грн';

    const message = text => {
      $('p46-message').textContent = text;
    };

    function showProduct(product) {
      $('p46-name').textContent = product.name || 'Іграшка';

      $('p46-description').textContent =
        product.description ||
        'Авторська в’язана іграшка ручної роботи від Яни.';

      $('p46-price').textContent = money(product.price);

      const stock = Math.max(0, Number(product.stock) || 0);
      const available = stock > 0;

      $('p46-stock').textContent = available
        ? '✓ У наявності · ' + stock + ' шт.'
        : 'Немає в наявності';

      $('p46-stock').style.color = available
        ? '#287a51'
        : '#a43e65';

      $('p46-add').disabled = !available;
      $('p46-add').textContent = available
        ? '🛒 Додати в кошик'
        : 'Немає в наявності';

      message('');
      panel.hidden = false;
    }

    async function loadDetails(id, card) {
      const currentRequest = ++requestNumber;

      selectedId = String(id);
      selectedCard = card;

      panel.hidden = false;
      $('p46-name').textContent =
        card.querySelector('h3')?.textContent || 'Іграшка';

      $('p46-description').textContent = 'Завантаження опису…';
      $('p46-price').textContent = '';
      $('p46-stock').textContent = '';
      $('p46-add').disabled = true;
      message('');

      try {
        const url = API + '/rest/v1/products' +
          '?select=id,name,description,price,stock' +
          '&id=eq.' + encodeURIComponent(id) +
          '&is_published=eq.true&limit=1';

        const response = await fetch(url, {
          headers: {
            apikey: KEY,
            Authorization: 'Bearer ' + KEY
          }
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const rows = await response.json();

        if (currentRequest !== requestNumber) return;

        if (!rows.length) {
          throw new Error('Товар не знайдено');
        }

        showProduct(rows[0]);
      } catch (error) {
        if (currentRequest !== requestNumber) return;

        console.error('Premium 4.6:', error);
        $('p46-description').textContent =
          'Не вдалося завантажити інформацію про товар.';
        $('p46-add').disabled = true;
        message('Спробуйте відкрити товар ще раз.');
      }
    }

    grid.addEventListener('click', event => {
      const img = event.target.closest('.picture img');
      if (!img || !grid.contains(img)) return;

      const card = img.closest('article.product');
      const add = card?.querySelector('[data-add]');

      if (!card || !add) return;

      loadDetails(add.dataset.add, card);
    }, true);

    $('p46-add').addEventListener('click', () => {
      if (!selectedId) return;

      let original = selectedCard?.querySelector('[data-add]');

      if (!original ||
          String(original.dataset.add) !== selectedId) {
        original = [...grid.querySelectorAll('[data-add]')]
          .find(button =>
            String(button.dataset.add) === selectedId
          );
      }

      if (!original || original.disabled) {
        message('Товар зараз недоступний.');
        return;
      }

      original.click();

      message(
        original.textContent.includes('Додано')
          ? '✓ Товар додано в кошик'
          : 'Перевірте доступну кількість у кошику.'
      );
    });

    const observer = new MutationObserver(() => {
      if (!viewer.classList.contains('yg-visible')) {
        requestNumber++;
        selectedId = null;
        selectedCard = null;
        panel.hidden = true;
      }
    });

    observer.observe(viewer, {
      attributes:true,
      attributeFilter:['class']
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
