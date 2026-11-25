
/* М'яке диво від Яни — Premium 9.3 Custom Orders */
(() => {
  'use strict';

  function init() {
    if (typeof db === 'undefined' || !db) return;

    const panel = document.getElementById('adminPanel');
    const stats = document.getElementById('ordersStats');
    const section = stats?.closest('section');

    if (!panel || !section ||
        document.getElementById('p93-custom')) return;

    const statuses = {
      new: 'Нова заявка',
      confirmed: 'Підтверджено',
      in_progress: 'Виготовляється',
      ready: 'Готово',
      shipped: 'Відправлено',
      completed: 'Виконано',
      cancelled: 'Скасовано'
    };

    const colors = {
      new: '#3478b8',
      confirmed: '#a77a26',
      in_progress: '#ce842d',
      ready: '#28734a',
      shipped: '#8056a5',
      completed: '#28734a',
      cancelled: '#9b3549'
    };

    const esc = s => String(s ?? '').replace(
      /[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

    const style = document.createElement('style');

    style.textContent = `
      #p93-tabs {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:7px;
        margin:12px 0;
      }

      #p93-tabs button {
        padding:12px 5px;
        border-radius:12px;
        font-size:12px;
        background:#f3e5ec;
        color:#75465e;
        border:1px solid #eadbe2;
      }

      #p93-tabs button.active {
        background:#98516e;
        color:white;
      }

      #p93-custom[hidden],
      #p93-normal[hidden] {
        display:none !important;
      }

      .p93-card {
        background:white;
        border:1px solid #eadbe2;
        border-radius:14px;
        padding:13px;
        margin:10px 0;
        overflow-wrap:anywhere;
      }

      .p93-card h3 {
        margin:0 0 7px;
        font-size:18px;
      }

      .p93-card p {
        margin:8px 0;
        font-size:13px;
        line-height:1.5;
      }

      .p93-card label {
        font-size:12px;
        margin-top:8px;
      }

      .p93-card input,
      .p93-card select,
      .p93-card textarea {
        font-size:14px;
        padding:10px;
        box-sizing:border-box;
        width:100%;
      }

      .p93-card textarea {
        min-height:65px;
      }

      .p93-fields {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .p93-info {
        background:#fbf3f7;
        padding:10px;
        border-radius:10px;
        margin:10px 0;
      }

      .p93-save {
        width:100%;
        background:#98516e !important;
        color:white !important;
        margin-top:10px;
        border-radius:10px !important;
      }

      #p93-message {
        font-size:13px;
        overflow-wrap:anywhere;
      }

      #p93-refresh {
        width:100%;
        margin:8px 0;
      }
    `;

    document.head.appendChild(style);

    const heading = section.querySelector('h2');

    const normal = document.createElement('div');
    normal.id = 'p93-normal';

    Array.from(section.children).forEach(node => {
      if (node !== heading) normal.appendChild(node);
    });

    const tabs = document.createElement('div');
    tabs.id = 'p93-tabs';

    tabs.innerHTML = `
      <button type="button" id="p93-tab-normal"
        class="active">📦 Звичайні</button>
      <button type="button" id="p93-tab-custom">
        🧶 Індивідуальні
      </button>
    `;

    const custom = document.createElement('div');
    custom.id = 'p93-custom';
    custom.hidden = true;

    custom.innerHTML = `
      <h3 style="font-size:17px">
        Індивідуальні замовлення
      </h3>

      <input id="p93-search"
        placeholder="🔎 Ім’я або телефон">

      <label>Статус заявки</label>

      <select id="p93-filter">
        <option value="all">Усі статуси</option>
        ${Object.entries(statuses).map(([key,name]) =>
          `<option value="${key}">${name}</option>`
        ).join('')}
      </select>

      <button type="button" id="p93-refresh"
        class="secondary">↻ Оновити заявки</button>

      <p id="p93-message" role="status"></p>

      <div id="p93-list"></div>
    `;

    section.append(tabs, normal, custom);

    const el = id => document.getElementById(id);

    let rows = [];
    let names = new Map();
    let requestId = 0;
    let busy = false;

    function message(text, error = false) {
      el('p93-message').textContent = text;
      el('p93-message').style.color =
        error ? '#9b3549' : '#28734a';
    }

    function signedOut() {
      return panel.hidden ||
        panel.classList.contains('hidden');
    }

    function updateCount() {
      const count = rows.filter(
        o => o.status === 'new'
      ).length;

      el('p93-tab-custom').textContent =
        '🧶 Індивідуальні (' + count + ')';
    }

    async function load() {
      if (signedOut()) return false;

      const seq = ++requestId;

      message('Завантаження…');

      try {
        const { data: auth, error: authError } =
          await db.auth.getUser();

        if (seq !== requestId || signedOut()) {
          return false;
        }

        if (authError || !auth?.user) {
          throw new Error('Потрібна авторизація');
        }

        const result = [];

        for (let offset = 0; ; offset += 500) {
          const { data, error } = await db
            .from('custom_orders')
            .select('*')
            .order('created_at', { ascending:false })
            .order('id', { ascending:false })
            .range(offset, offset + 499);

          if (seq !== requestId || signedOut()) {
            return false;
          }

          if (error) throw error;

          result.push(...(data || []));

          if (!data || data.length < 500) break;
        }

        const ids = [...new Set(
          result.map(o => o.product_id)
            .filter(id => id != null)
        )];

        const productNames = new Map();

        for (let i = 0; i < ids.length; i += 100) {
          const { data: products, error } = await db
            .from('products')
            .select('id,name')
            .in('id', ids.slice(i, i + 100));

          if (seq !== requestId || signedOut()) {
            return false;
          }

          if (error) throw error;

          (products || []).forEach(p => {
            productNames.set(String(p.id), p.name);
          });
        }

        rows = result;
        names = productNames;

        updateCount();
        render();
        message('');

        return true;

      } catch (error) {
        if (seq !== requestId || signedOut()) {
          return false;
        }

        rows = [];
        names.clear();

        render();

        el('p93-tab-custom').textContent =
          '🧶 Індивідуальні';

        message('Помилка: ' + error.message, true);

        return false;
      }
    }

    function render() {
      const list = el('p93-list');
      list.replaceChildren();

      if (signedOut()) return;

      const query = el('p93-search')
        .value.trim().toLowerCase();

      const filter = el('p93-filter').value;

      const filtered = rows.filter(o => {
        if (filter !== 'all' &&
            o.status !== filter) return false;

        const text = [
          o.id,
          o.customer_name,
          o.customer_phone,
          names.get(String(o.product_id))
        ].join(' ').toLowerCase();

        return !query || text.includes(query);
      });

      if (!filtered.length) {
        list.textContent = 'Заявок не знайдено.';
        return;
      }

      filtered.forEach(o => {
        const card = document.createElement('div');
        card.className = 'p93-card';

        const name = names.get(String(o.product_id))
          || 'Товар №' + (o.product_id ?? '—');

        const date = new Date(o.created_at)
          .toLocaleString('uk-UA', {
            timeZone:'Europe/Kyiv'
          });

        card.innerHTML = `
          <h3>${esc(name)}</h3>

          <div class="muted" style="font-size:11px">
            №${esc(String(o.id).slice(0,8))}
            · ${esc(date)}
          </div>

          <p style="font-weight:700;color:${
            colors[o.status] || '#82757c'
          }">
            ● ${esc(statuses[o.status] || o.status)}
          </p>

          <p>
            <strong>${esc(o.customer_name)}</strong><br>
            ☎ ${esc(o.customer_phone)}
          </p>

          <div class="p93-info">
            <p>Колір: <strong>${
              esc(o.desired_color || 'Не вказано')
            }</strong></p>

            <p>Розмір: <strong>${
              esc(o.desired_size || 'Не вказано')
            }</strong></p>

            <p>Побажання:<br>${
              esc(o.customer_comment || 'Немає')
            }</p>
          </div>

          <div class="p93-fields">
            <div>
              <label>Ціна, грн</label>
              <input class="p93-price"
                type="number" min="0" step="0.01"
                placeholder="Не узгоджено"
                value="${esc(o.agreed_price)}">
            </div>

            <div>
              <label>Термін, днів</label>
              <input class="p93-days"
                type="number" min="1" step="1"
                placeholder="Не визначено"
                value="${esc(o.production_days)}">
            </div>
          </div>

          <label>Статус</label>

          <select class="p93-status">
            ${Object.entries(statuses).map(([key,name]) =>
              `<option value="${key}"
                ${key === o.status ? 'selected' : ''}>
                ${name}
              </option>`
            ).join('')}
          </select>

          <label>Примітка майстрині</label>

          <textarea class="p93-comment"
            maxlength="1000"
            placeholder="Внутрішня примітка">${
              esc(o.admin_comment)
            }</textarea>

          <button type="button" class="p93-save">
            ✓ Зберегти зміни
          </button>
        `;

        const save = card.querySelector('.p93-save');

        save.disabled = busy;

        save.onclick = async () => {
          if (busy || signedOut()) return;

          const price = card.querySelector('.p93-price');
          const days = card.querySelector('.p93-days');

          if (!price.checkValidity() ||
              !days.checkValidity()) {
            message('Перевірте ціну та термін.', true);
            return;
          }

          const nextStatus =
            card.querySelector('.p93-status').value;

          if (nextStatus === 'cancelled' &&
              o.status !== 'cancelled' &&
              !confirm('Скасувати цю заявку?')) {
            return;
          }

          const payload = {
            agreed_price: price.value === ''
              ? null : Number(price.value),

            production_days: days.value === ''
              ? null : Number(days.value),

            status: nextStatus,

            admin_comment: card
              .querySelector('.p93-comment')
              .value.trim()
          };

          busy = true;

          const controls = custom.querySelectorAll(
            'button,input,select,textarea'
          );

          controls.forEach(c => c.disabled = true);

          save.textContent = 'Зберігаємо…';

          try {
            const { data, error } = await db
              .from('custom_orders')
              .update(payload)
              .eq('id', o.id)
              .eq('status', o.status)
              .select('id')
              .single();

            if (error) throw error;

            if (!data) {
              throw new Error('Зміни не збережено');
            }

            if (await load()) {
              message('✓ Зміни успішно збережено.');
            }

          } catch (error) {
            if (!signedOut()) {
              message('Помилка: ' + error.message, true);
            }

          } finally {
            busy = false;

            custom.querySelectorAll(
              'button,input,select,textarea'
            ).forEach(c => c.disabled = false);

            save.textContent = '✓ Зберегти зміни';
          }
        };

        list.appendChild(card);
      });
    }

    function switchTab(isCustom) {
      normal.hidden = isCustom;
      custom.hidden = !isCustom;

      el('p93-tab-normal').classList.toggle(
        'active', !isCustom
      );

      el('p93-tab-custom').classList.toggle(
        'active', isCustom
      );

      if (isCustom && !busy) load();
    }

    el('p93-tab-normal').onclick = () => {
      switchTab(false);
    };

    el('p93-tab-custom').onclick = () => {
      switchTab(true);
    };

    el('p93-refresh').onclick = () => {
      if (!busy) load();
    };

    el('p93-search').oninput = render;
    el('p93-filter').onchange = render;

    let wasHidden = signedOut();

    new MutationObserver(() => {
      const hidden = signedOut();

      if (hidden === wasHidden) return;

      wasHidden = hidden;

      if (hidden) {
        ++requestId;
        rows = [];
        names.clear();
        el('p93-list').replaceChildren();
        el('p93-search').value = '';
        el('p93-filter').value = 'all';
        el('p93-tab-custom').textContent =
          '🧶 Індивідуальні';
        message('');
        switchTab(false);
      } else {
        load();
      }
    }).observe(panel, {
      attributes:true,
      attributeFilter:['class','hidden']
    });

    if (!signedOut()) load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded', init
    );
  } else {
    init();
  }
})();
      
