
/* М'яке диво від Яни — Premium 6.0 Promo Admin */
(() => {
  'use strict';

  const panel = document.getElementById('adminPanel');
  if (!panel || document.getElementById('promoAdmin')) return;

  const section = document.createElement('section');
  section.className = 'card';
  section.id = 'promoAdmin';

  section.innerHTML = `
    <h2>🎟️ Промокоди</h2>
    <p class="muted">
      Створюй знижки для покупців магазину.
    </p>

    <div class="actions">
      <button id="promoCreate">＋ Створити промокод</button>
      <button id="promoRefresh" class="secondary">Оновити</button>
    </div>

    <form id="promoAdminForm" class="hidden">
      <label>Назва промокоду</label>
      <input id="promoAdminCode" required maxlength="40"
        placeholder="Наприклад, YANA10"
        style="text-transform:uppercase">

      <label>Тип знижки</label>
      <select id="promoAdminType">
        <option value="percent">Відсотки (%)</option>
        <option value="fixed">Гривні (грн)</option>
      </select>

      <label>Розмір знижки</label>
      <input id="promoAdminValue" type="number"
        min="0.01" step="0.01" required>

      <label>Мінімальна сума замовлення, грн</label>
      <input id="promoAdminMin" type="number"
        min="0" step="0.01" value="0" required>

      <label>Діє до (необов'язково)</label>
      <input id="promoAdminExpires" type="datetime-local">

      <div class="checkbox">
        <input id="promoAdminActive" type="checkbox" checked>
        <label for="promoAdminActive">Активний промокод</label>
      </div>

      <div class="actions">
        <button type="submit" id="promoAdminSave">
          Зберегти
        </button>
        <button type="button" id="promoAdminCancel"
          class="secondary">Скасувати</button>
      </div>
    </form>

    <div id="promoAdminStatus" class="status"
      role="status"></div>

    <div id="promoAdminList"></div>
  `;

  panel.append(section);

  const el = id => document.getElementById(id);
  const form = el('promoAdminForm');
  const list = el('promoAdminList');

  let editing = null;
  let loading = 0;

  const status = (message, type = '') => {
    el('promoAdminStatus').textContent = message;
    el('promoAdminStatus').className = 'status ' + type;
  };

  const money = n =>
    Number(n).toLocaleString('uk-UA') + ' грн';

  function reset() {
    editing = null;
    form.reset();
    el('promoAdminMin').value = 0;
    el('promoAdminActive').checked = true;
    el('promoAdminSave').textContent = 'Зберегти';
    form.classList.add('hidden');
  }

  function localDate(value) {
    if (!value) return '';

    const date = new Date(value);
    const local = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 16);
  }

  function edit(promo) {
    editing = promo.id;

    el('promoAdminCode').value = promo.code;
    el('promoAdminType').value = promo.discount_type;
    el('promoAdminValue').value = promo.discount_value;
    el('promoAdminMin').value = promo.min_order_amount;
    el('promoAdminExpires').value =
      localDate(promo.expires_at);

    el('promoAdminActive').checked = promo.active;

    el('promoAdminSave').textContent = 'Зберегти зміни';

    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth' });
  }

  async function load() {
    const seq = ++loading;

    if (typeof db === 'undefined' || !db) return;

    list.textContent = 'Завантажуємо промокоди…';

    try {
      const { data: auth } = await db.auth.getSession();

      if (seq !== loading) return;

      if (!auth?.session) {
        list.replaceChildren();
        return;
      }

      const { data: allowed, error: accessError } =
        await db.rpc('is_shop_admin');

      if (seq !== loading) return;

      if (accessError) throw accessError;

      if (!allowed) {
        list.replaceChildren();
        status('Немає доступу адміністратора.', 'error');
        return;
      }

      const { data, error } = await db
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (seq !== loading) return;
      if (error) throw error;

      list.replaceChildren();

      if (!data?.length) {
        list.textContent = 'Промокодів поки немає.';
        return;
      }

      for (const promo of data) render(promo);

    } catch (error) {
      if (seq !== loading) return;
      list.replaceChildren();
      status(error.message, 'error');
    }
  }

  function render(promo) {
    const card = document.createElement('div');

    card.style.cssText = `
      border:1px solid #eadbdc;
      border-radius:16px;
      padding:16px;
      margin-top:15px;
      background:#fffaf8;
    `;

    const expired = promo.expires_at &&
      new Date(promo.expires_at) <= new Date();

    const active = promo.active && !expired;

    const title = document.createElement('h3');
    title.textContent = promo.code;
    title.style.margin = '0 0 8px';

    const badge = document.createElement('div');
    badge.textContent = expired
      ? '● Термін дії завершився'
      : active ? '● Активний' : '● Вимкнений';

    badge.style.color = active ? '#28734a' : '#9b3549';

    const discount = document.createElement('div');
    discount.style.cssText =
      'font-size:30px;font-weight:750;margin:10px 0';

    discount.textContent = '−' + (
      promo.discount_type === 'percent'
        ? Number(promo.discount_value) + '%'
        : money(promo.discount_value)
    );

    const minimum = document.createElement('div');
    minimum.className = 'muted';
    minimum.textContent = 'Мінімальне замовлення: ' +
      money(promo.min_order_amount);

    const expires = document.createElement('div');
    expires.className = 'muted';
    expires.textContent = 'Діє до: ' + (
      promo.expires_at
        ? new Date(promo.expires_at).toLocaleString('uk-UA')
        : 'Без обмежень'
    );

    const actions = document.createElement('div');
    actions.className = 'actions';

    const button = (text, className, handler) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = className;
      b.textContent = text;
      b.onclick = handler;
      actions.append(b);
    };

    button('✏️ Редагувати', 'secondary',
      () => edit(promo));

    button(
      promo.active ? 'Вимкнути' : 'Увімкнути',
      'secondary',
      async () => {
        try {
          const { data, error } = await db
            .from('promo_codes')
            .update({ active: !promo.active })
            .eq('id', promo.id)
            .select('id')
            .single();

          if (error) throw error;
          if (!data) throw new Error('Зміни не збережено');

          await load();
          status('Статус змінено.', 'ok');
        } catch (error) {
          status(error.message, 'error');
        }
      }
    );

    button('Видалити', 'danger', async () => {
      if (!confirm('Видалити промокод ' + promo.code + '?'))
        return;

      try {
        const { data, error } = await db
          .from('promo_codes')
          .delete()
          .eq('id', promo.id)
          .select('id');

        if (error) throw error;
        if (!data?.length)
          throw new Error('Промокод не видалено');

        if (editing === promo.id) reset();

        await load();
        status('Промокод видалено.', 'ok');
      } catch (error) {
        status(error.message, 'error');
      }
    });

    card.append(
      title, badge, discount,
      minimum, expires, actions
    );

    list.append(card);
  }

  el('promoCreate').onclick = () => {
    reset();
    status('');
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth' });
  };

  el('promoRefresh').onclick = load;
  el('promoAdminCancel').onclick = reset;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const save = el('promoAdminSave');
    if (save.disabled) return;
    save.disabled = true;

    try {
      const code = el('promoAdminCode')
        .value.trim().toUpperCase();

      const type = el('promoAdminType').value;
      const value = Number(el('promoAdminValue').value);
      const minimum = Number(el('promoAdminMin').value);
      const expires = el('promoAdminExpires').value;

      if (!code || !Number.isFinite(value) ||
          value <= 0 || !Number.isFinite(minimum) ||
          minimum < 0) {
        throw new Error('Перевірте введені дані.');
      }

      if (type === 'percent' && value > 100) {
        throw new Error('Знижка не може перевищувати 100%.');
      }

      const payload = {
        code,
        discount_type: type,
        discount_value: value,
        min_order_amount: minimum,
        active: el('promoAdminActive').checked,
        expires_at: expires
          ? new Date(expires).toISOString()
          : null
      };

      const result = editing === null
        ? await db.from('promo_codes')
            .insert(payload).select('id').single()
        : await db.from('promo_codes')
            .update(payload).eq('id', editing)
            .select('id').single();

      if (result.error) throw result.error;

      reset();
      await load();
      status('✓ Промокод збережено!', 'ok');

    } catch (error) {
      status(error.message, 'error');
    } finally {
      save.disabled = false;
    }
  });

  const observer = new MutationObserver(() => {
    if (!panel.classList.contains('hidden')) {
      load();
    } else {
      ++loading;
      list.replaceChildren();
      reset();
      status('');
    }
  });

  observer.observe(panel, {
    attributes: true,
    attributeFilter: ['class']
  });

  if (!panel.classList.contains('hidden')) load();
})();
      
