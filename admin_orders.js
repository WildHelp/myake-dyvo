
/* М'яке диво від Яни — Orders Premium 6.0 */
(() => {
  'use strict';

  if (typeof db === 'undefined' || !db) return;

  const panel = document.getElementById('adminPanel');
  if (!panel) return;

  const statuses = {
    new: 'Нове',
    confirmed: 'Підтверджено',
    shipped: 'Відправлено',
    completed: 'Виконано',
    cancelled: 'Скасовано'
  };

  const colors = {
    new: '#3478b8',
    confirmed: '#a77a26',
    shipped: '#8056a5',
    completed: '#28734a',
    cancelled: '#9b3549'
  };

  const transitions = {
    new: ['new', 'confirmed', 'cancelled'],
    confirmed: ['confirmed', 'shipped', 'cancelled'],
    shipped: ['shipped', 'completed'],
    completed: ['completed'],
    cancelled: ['cancelled']
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

  const money = n =>
    Number(n || 0).toLocaleString('uk-UA', {
      maximumFractionDigits: 2
    }) + ' грн';

  const section = document.createElement('section');
  section.className = 'card';

  section.innerHTML = `
    <h2>📦 Замовлення</h2>

    <div id="ordersStats" style="
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;margin-bottom:18px">
    </div>

    <input id="ordersSearch"
      placeholder="🔎 Ім’я, телефон або номер замовлення">

    <label>Статус замовлення</label>
    <select id="ordersFilter">
      <option value="all">Усі статуси</option>
      <option value="new">Нові</option>
      <option value="confirmed">Підтверджені</option>
      <option value="shipped">Відправлені</option>
      <option value="completed">Виконані</option>
      <option value="cancelled">Скасовані</option>
    </select>

    <div class="actions">
      <button id="ordersActive" type="button">
        📦 Основні
      </button>
      <button id="ordersArchive" type="button"
        class="secondary">📁 Архів</button>
      <button id="refreshOrders" type="button"
        class="secondary">↻ Оновити</button>
    </div>

    <p id="ordersMessage" class="status"
      role="status"></p>

    <div id="ordersList"></div>
  `;

  panel.appendChild(section);

  const el = id => section.querySelector('#' + id);
  const message = el('ordersMessage');
  const list = el('ordersList');

  let orders = [];
  let archive = false;
  let requestId = 0;
  let busy = false;

  function status(text, type = '') {
    message.textContent = text;
    message.className = 'status ' + type;
  }

  function renderStats() {
    const active = orders.filter(o => !o.archived);

    const stats = [
      ['Нові', active.filter(o =>
        o.status === 'new').length, '#3478b8'],
      ['Підтверджені', active.filter(o =>
        o.status === 'confirmed').length, '#a77a26'],
      ['Відправлені', active.filter(o =>
        o.status === 'shipped').length, '#8056a5'],
      ['Виконані', orders.filter(o =>
        o.status === 'completed').length, '#28734a']
    ];

    el('ordersStats').innerHTML = stats.map(s => `
      <div style="background:#f9eef3;
        padding:15px;border-radius:15px;text-align:center">
        <strong style="font-size:28px;color:${s[2]}">
          ${s[1]}
        </strong>
        <div class="muted">${s[0]}</div>
      </div>
    `).join('');
  }

  async function loadOrders() {
    const seq = ++requestId;

    status('Завантажуємо замовлення…');

    try {
      const { data: auth, error: authError } =
        await db.auth.getUser();

      if (seq !== requestId) return;

      if (authError || !auth?.user) {
        orders = [];
        render();
        status('Увійдіть як адміністратор.');
        return;
      }

      const { data, error } = await db
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (seq !== requestId) return;
      if (error) throw error;

      orders = data || [];
      status('');
      render();

    } catch (error) {
      if (seq !== requestId) return;
      orders = [];
      render();
      status('Помилка: ' + error.message, 'error');
    }
  }

  function render() {
    renderStats();
    list.replaceChildren();

    el('ordersActive').className =
      archive ? 'secondary' : '';

    el('ordersArchive').className =
      archive ? '' : 'secondary';

    const query = el('ordersSearch')
      .value.trim().toLowerCase();

    const filter = el('ordersFilter').value;

    const filtered = orders.filter(o => {
      if (!!o.archived !== archive) return false;

      if (filter !== 'all' &&
          o.status !== filter) return false;

      const text = [
        o.id, o.customer_name,
        o.customer_phone, o.city,
        o.promo_code
      ].join(' ').toLowerCase();

      return !query || text.includes(query);
    });

    if (!filtered.length) {
      list.textContent = archive
        ? 'Архів порожній.'
        : 'Замовлень не знайдено.';
      return;
    }

    for (const order of filtered) {
      renderOrder(order);
    }
  }

  async function updateOrder(order, payload) {
    const { data, error } = await db
      .from('orders')
      .update(payload)
      .eq('id', order.id)
      .eq('status', order.status)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Зміни не збережено');
  }

  async function perform(action, success) {
    if (busy) return;
    busy = true;

    const controls = section.querySelectorAll(
      '#ordersList button, #ordersList select'
    );

    controls.forEach(c => c.disabled = true);
    status('Зберігаємо зміни…');

    try {
      await action();
      await loadOrders();

      if (typeof loadProducts === 'function') {
        await loadProducts();
      }

      status(success, 'ok');

    } catch (error) {
      await loadOrders();
      status('Помилка: ' + error.message, 'error');

    } finally {
      busy = false;
      render();
    }
  }

  function renderOrder(o) {
    const card = document.createElement('div');

    card.style.cssText = `
      border:1px solid #eadbdc;
      border-radius:17px;
      padding:16px;
      margin:15px 0;
      background:#fff;
    `;

    const items = Array.isArray(o.items)
      ? o.items : [];

    const date = o.created_at
      ? new Date(o.created_at)
          .toLocaleString('uk-UA')
      : 'Невідомо';

    const discount = Number(o.discount_amount || 0);

    const subtotal = o.subtotal == null
      ? Number(o.total_amount || 0) + discount
      : Number(o.subtotal);

    const color = colors[o.status] || '#82757c';

    card.innerHTML = `
      <strong style="font-size:17px">
        Замовлення №${esc(String(o.id).slice(0,8))}
      </strong>

      <div class="muted">${esc(date)}</div>

      <div style="color:${color};
        font-weight:700;margin:8px 0">
        ● ${esc(statuses[o.status] || o.status)}
      </div>

      <p>
        <strong>${esc(o.customer_name)}</strong><br>
        ${esc(o.customer_phone)}
      </p>

      <p>${esc(o.city)}<br>
        ${esc(o.delivery_branch)}</p>

      <p>Оплата: ${esc(o.payment_method)}</p>

      <div style="background:#fff9f6;
        padding:12px;border-radius:12px">
        ${items.map(i => `
          <div style="margin:6px 0">
            ${esc(i.name)} × ${esc(i.qty)}
          </div>
        `).join('')}
      </div>

      ${o.comment ? `
        <p><strong>Коментар:</strong><br>
        ${esc(o.comment)}</p>
      ` : ''}

      <div style="background:#f9eef3;
        padding:14px;border-radius:14px;
        margin:15px 0">

        <div style="display:flex;
          justify-content:space-between;gap:8px">
          <span>Вартість</span>
          <strong>${money(subtotal)}</strong>
        </div>

        ${o.promo_code ? `
          <div style="color:#28734a;margin-top:8px">
            🎟️ Промокод: ${esc(o.promo_code)}
          </div>
        ` : ''}

        ${discount > 0 ? `
          <div style="display:flex;
            justify-content:space-between;
            color:#28734a;margin-top:8px">
            <span>Знижка</span>
            <strong>−${money(discount)}</strong>
          </div>
        ` : ''}

        <div style="display:flex;
          justify-content:space-between;
          border-top:1px solid #eadbdc;
          padding-top:12px;margin-top:12px">
          <strong>До сплати</strong>
          <strong style="font-size:22px">
            ${money(o.total_amount)}
          </strong>
        </div>
      </div>

      <label>Статус замовлення</label>
    `;

    const select = document.createElement('select');

    const allowed = transitions[o.status] || [o.status];

    for (const value of allowed) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = statuses[value] || value;
      select.appendChild(option);
    }

    select.value = o.status;
    select.disabled = busy || allowed.length === 1;

    select.onchange = async () => {
      const next = select.value;

      if (next === 'cancelled' &&
          !confirm('Скасувати замовлення?')) {
        select.value = o.status;
        return;
      }

      await perform(
        () => updateOrder(o, { status: next }),
        '✓ Статус замовлення змінено.'
      );
    };

    card.appendChild(select);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const makeButton = (text, cls, handler) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.className = cls;
      button.disabled = busy;
      button.onclick = handler;
      actions.appendChild(button);
    };

    makeButton(
      o.archived ? '↩ Відновити' : '📁 В архів',
      'secondary',
      async () => {
        await perform(
          () => updateOrder(o, {
            archived: !o.archived
          }),
          o.archived
            ? '✓ Замовлення відновлено.'
            : '✓ Замовлення переміщено в архів.'
        );
      }
    );

    if (o.status !== 'shipped') {
      makeButton('🗑️ Видалити', 'danger', async () => {
        const restore = o.stock_reserved &&
          ['new', 'confirmed'].includes(o.status);

        const warning = restore
          ? '\nЗарезервовані товари повернуться до залишків.'
          : '';

        if (!confirm(
          'Назавжди видалити замовлення №' +
          String(o.id).slice(0,8) + '?' +
          warning +
          '\nЦю дію не можна скасувати.'
        )) return;

        await perform(async () => {
          const { data, error } = await db.rpc(
            'delete_shop_order',
            { p_order_id: o.id }
          );

          if (error) throw error;

          if (data !== true) {
            throw new Error('Замовлення не видалено');
          }
        }, '✓ Замовлення видалено.');
      });
    }

    card.appendChild(actions);
    list.appendChild(card);
  }

  el('ordersSearch').oninput = render;
  el('ordersFilter').onchange = render;
  el('refreshOrders').onclick = loadOrders;

  el('ordersActive').onclick = () => {
    archive = false;
    render();
  };

  el('ordersArchive').onclick = () => {
    archive = true;
    render();
  };

  const observer = new MutationObserver(() => {
    if (!panel.classList.contains('hidden')) {
      loadOrders();
    } else {
      ++requestId;
      orders = [];
      archive = false;
      render();
      status('');
    }
  });

  observer.observe(panel, {
    attributes: true,
    attributeFilter: ['class']
  });

  if (!panel.classList.contains('hidden')) {
    loadOrders();
  }
})();
            
