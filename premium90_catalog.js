/* М'яке диво — Premium 9.0 Smart Catalog */
(() => {
  'use strict';

  const KEY = 'yana_p90_filters';

  const defaults = {
    query: '',
    min: '',
    max: '',
    stock: false,
    custom: false
  };

  let state = { ...defaults };

  try {
    state = {
      ...defaults,
      ...JSON.parse(localStorage.getItem(KEY) || '{}')
    };
  } catch {}

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }

  function normalize(value) {
    return String(value ?? '')
      .toLocaleLowerCase('uk')
      .replace(/[’ʼ‘`]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  window.p90MatchProduct = function(product, query) {
    const text = normalize([
      product.name,
      product.description,
      product.category
    ].join(' '));

    const words = normalize(query)
      .split(' ')
      .filter(Boolean);

    if (!words.every(word => text.includes(word))) {
      return false;
    }

    const price = Number(product.price);

    if (state.min !== '' &&
        price < Number(state.min)) {
      return false;
    }

    if (state.max !== '' &&
        price > Number(state.max)) {
      return false;
    }

    if (state.stock &&
        Number(product.stock) <= 0) {
      return false;
    }

    if (state.custom &&
        product.toy_custom !== true) {
      return false;
    }

    return true;
  };

  function init() {
    const search = document.getElementById('search');
    const grid = document.getElementById('products');

    if (!search || !grid) return;
    if (document.getElementById('p90-panel')) return;

    const css = document.createElement('style');

    css.textContent = `
      #p90-panel {
        margin:12px 0;
        border:1px solid #e5c6d1;
        border-radius:18px;
        background:#fffaf6;
        color:#503d49;
        overflow:hidden;
      }

      #p90-panel summary {
        padding:14px 16px;
        cursor:pointer;
        font-weight:700;
      }

      .p90-body {
        padding:4px 16px 16px;
      }

      .p90-prices {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin:10px 0 16px;
      }

      .p90-prices input {
        width:100%;
        min-width:0;
        box-sizing:border-box;
        padding:12px;
        border:1px solid #e5c6d1;
        border-radius:12px;
        background:white;
        color:#503d49;
        font-size:16px;
      }

      .p90-check {
        display:flex;
        align-items:center;
        gap:10px;
        padding:9px 0;
        font-size:14px;
        cursor:pointer;
      }

      .p90-check input {
        width:19px;
        height:19px;
        accent-color:#95657e;
      }

      #p90-reset {
        width:100%;
        margin-top:12px;
        padding:12px;
        border:1px solid #e5c6d1;
        border-radius:12px;
        background:#f4e8ed;
        color:#503d49;
        font-weight:700;
        cursor:pointer;
      }

      #p90-badge {
        color:#a43e65;
        font-size:13px;
        margin-left:8px;
      }
    `;

    document.head.append(css);

    const panel = document.createElement('details');
    panel.id = 'p90-panel';

    panel.innerHTML = `
      <summary>
        ☷ Додаткові фільтри
        <span id="p90-badge"></span>
      </summary>

      <div class="p90-body">
        <strong>Ціна, грн</strong>

        <div class="p90-prices">
          <input id="p90-min"
                 type="number"
                 min="0"
                 step="any"
                 placeholder="Від"
                 aria-label="Мінімальна ціна">

          <input id="p90-max"
                 type="number"
                 min="0"
                 step="any"
                 placeholder="До"
                 aria-label="Максимальна ціна">
        </div>

        <label class="p90-check">
          <input id="p90-stock" type="checkbox">
          Тільки в наявності
        </label>

        <label class="p90-check">
          <input id="p90-custom" type="checkbox">
          Можна на замовлення
        </label>

        <button id="p90-reset" type="button">
          Скинути фільтри
        </button>
      </div>
    `;

    const controls = document.querySelector('.p3-controls');

    if (controls) {
      controls.before(panel);
    } else {
      grid.before(panel);
    }

    const min = panel.querySelector('#p90-min');
    const max = panel.querySelector('#p90-max');
    const stock = panel.querySelector('#p90-stock');
    const custom = panel.querySelector('#p90-custom');
    const badge = panel.querySelector('#p90-badge');

    function updateBadge() {
      const count = [
        state.min !== '',
        state.max !== '',
        state.stock,
        state.custom
      ].filter(Boolean).length;

      badge.textContent = count
        ? '(' + count + ')'
        : '';
    }

    function restore() {
      search.value = state.query || '';
      min.value = state.min;
      max.value = state.max;
      stock.checked = state.stock === true;
      custom.checked = state.custom === true;
      updateBadge();
    }

    function refresh() {
      save();
      updateBadge();

      search.dispatchEvent(
        new Event('input', { bubbles: true })
      );
    }

    function update() {
      state.min = min.value === ''
        ? ''
        : String(Math.max(0, Number(min.value)));

      state.max = max.value === ''
        ? ''
        : String(Math.max(0, Number(max.value)));

      state.stock = stock.checked;
      state.custom = custom.checked;

      if (
        state.min !== '' &&
        state.max !== '' &&
        Number(state.min) > Number(state.max)
      ) {
        [state.min, state.max] =
          [state.max, state.min];

        min.value = state.min;
        max.value = state.max;
      }

      refresh();
    }

    search.addEventListener('input', () => {
      state.query = search.value;
      save();
    });

    min.addEventListener('change', update);
    max.addEventListener('change', update);
    stock.addEventListener('change', update);
    custom.addEventListener('change', update);

    panel.querySelector('#p90-reset')
      .addEventListener('click', () => {
        state = { ...defaults };
        restore();
        refresh();
      });

    restore();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
