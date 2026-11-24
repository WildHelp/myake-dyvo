
/* М'яке диво від Яни — Premium 6.0 */
(() => {
  'use strict';

  const API = 'https://myake-dyvo-novaposhta.dmitrywildreed.workers.dev/';
  const BASE = 'https://voaadlzlmiyuxclfqmmi.supabase.co/rest/v1';
  const PUBLIC_KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

  const headers = {
    'Content-Type': 'application/json',
    apikey: PUBLIC_KEY,
    Authorization: 'Bearer ' + PUBLIC_KEY
  };

  const money = n => Number(n).toFixed(2) + ' грн';

  window.openCheckout = function () {
    if (!document.getElementById('drawer') ||
        typeof window.openDrawer !== 'function') return;

    const html = `
      <form id="checkoutForm" class="np-checkout">
        <div class="np-intro">
          🧸 Майже готово! Заповніть дані, щоб Яна
          могла підтвердити ваше замовлення.
        </div>

        <label class="np-field">Ваше ім’я *
          <input name="customer_name" required maxlength="100"
            autocomplete="name" placeholder="Наприклад, Олена">
        </label>

        <label class="np-field">Номер телефону *
          <input name="customer_phone" type="tel" required
            maxlength="20" autocomplete="tel" inputmode="tel"
            placeholder="+380...">
        </label>

        <div class="np-field">
          <label for="np-city">Місто доставки *</label>
          <input id="np-city" name="city" required
            autocomplete="off" maxlength="100"
            placeholder="Почніть вводити місто…">
          <div id="np-cities" class="np-options" hidden></div>
          <small id="np-city-help">Виберіть місто зі списку.</small>
        </div>

        <div class="np-field">
          <label for="np-branch">Відділення Нової пошти *</label>
          <input id="np-branch" name="delivery_branch"
            required autocomplete="off" maxlength="150"
            placeholder="Спочатку виберіть місто" disabled>
          <div id="np-branches" class="np-options" hidden></div>
          <small id="np-branch-help">
            Відділення з’являться після вибору міста.
          </small>
        </div>

        <label class="np-field">Спосіб оплати *
          <select name="payment_method" required>
            <option value="Післяплата">Післяплата</option>
            <option value="Переказ на картку">Переказ на картку</option>
          </select>
        </label>

        <label class="np-field">Коментар
          <textarea name="comment" maxlength="500" rows="3"
            placeholder="Побажання до замовлення"></textarea>
        </label>

        <div class="np-promo">
          <strong>🎁 Маєте промокод?</strong>
          <div class="np-promo-row">
            <input id="promoInput" maxlength="40"
              autocomplete="off" placeholder="Введіть промокод">
            <button id="promoApply" type="button">
              Застосувати
            </button>
          </div>
          <small id="promoMessage" role="status"></small>
        </div>

        <div class="np-summary">
          <div>
            <span>Вартість товарів</span>
            <strong id="orderSubtotal">0 грн</strong>
          </div>
          <div class="np-discount">
            <span>Ваша знижка</span>
            <strong id="orderDiscount">0 грн</strong>
          </div>
          <div class="np-total">
            <span>До сплати</span>
            <strong id="orderTotal">0 грн</strong>
          </div>
        </div>

        <button type="submit" class="np-submit">
          Підтвердити замовлення
        </button>

        <p id="checkoutMessage" role="status"></p>
        <small>🔒 Дані використовуються для оформлення замовлення.</small>
      </form>`;

    window.openDrawer('Оформлення замовлення', html, '');

    const form = document.getElementById('checkoutForm');
    if (!form) return;

    if (!document.getElementById('np-styles')) {
      const style = document.createElement('style');
      style.id = 'np-styles';
      style.textContent = `
        .np-checkout{display:grid;gap:17px;padding:5px 0 25px}
        .np-intro{background:#f9eef3;border-radius:16px;
          padding:15px;line-height:1.5;font-size:14px}
        .np-field{display:flex;flex-direction:column;gap:7px;
          font-size:14px;font-weight:600;min-width:0}
        .np-field input,.np-field select,.np-field textarea,
        .np-promo input{
          box-sizing:border-box;width:100%;max-width:100%;
          padding:14px;border:1px solid #dfced7;border-radius:13px;
          background:#fff;color:#3e2d38;font:inherit;
          font-weight:400;outline:none}
        .np-field input:focus,.np-field select:focus,
        .np-promo input:focus{
          border-color:#a86d89;box-shadow:0 0 0 3px #f4e2eb}
        .np-field input:disabled{background:#f5f1f3}
        .np-field small{font-size:12px;color:#786973}
        .np-options{max-height:230px;overflow-y:auto;
          border:1px solid #e6d6de;border-radius:13px;
          background:white}
        .np-options[hidden]{display:none}
        .np-option{display:block;width:100%;padding:12px;
          text-align:left;border:0;border-bottom:1px solid #f3eaf0;
          background:white;color:#503d49;font-size:14px}
        .np-option:active{background:#fbf0f5}
        .np-submit{width:100%;padding:17px;border:0;
          border-radius:16px;background:linear-gradient(
          110deg,#523c4d,#95617f);color:white;
          font-size:16px;font-weight:700}
        .np-submit:disabled{opacity:.6}
        #checkoutMessage{font-size:14px;line-height:1.5}
        .np-promo{display:grid;gap:10px;padding:16px;
          border:1px dashed #c79aaf;border-radius:16px;
          background:#fff6fa;color:#523c4d}
        .np-promo-row{display:flex;gap:8px}
        .np-promo-row input{flex:1;min-width:0;
          text-transform:uppercase}
        .np-promo-row button{border:0;border-radius:12px;
          padding:10px;background:#95617f;color:#fff;
          font-size:12px;font-weight:700}
        .np-promo-row button:disabled{opacity:.5}
        #promoMessage{font-size:13px;line-height:1.5}
        .np-summary{display:grid;gap:13px;padding:17px;
          background:#f9eef3;border-radius:16px;
          color:#523c4d}
        .np-summary>div{display:flex;justify-content:space-between;
          align-items:center;gap:10px;font-size:14px}
        .np-summary .np-discount{color:#27834c}
        .np-summary .np-total{border-top:1px solid #dfced7;
          padding-top:14px;font-size:17px;font-weight:700}
        #orderTotal{font-size:23px}
      `;
      document.head.append(style);
    }

    const city = form.querySelector('#np-city');
    const branch = form.querySelector('#np-branch');
    const cities = form.querySelector('#np-cities');
    const branches = form.querySelector('#np-branches');
    const cityHelp = form.querySelector('#np-city-help');
    const branchHelp = form.querySelector('#np-branch-help');
    const message = form.querySelector('#checkoutMessage');

    const promoInput = form.querySelector('#promoInput');
    const promoApply = form.querySelector('#promoApply');
    const promoMessage = form.querySelector('#promoMessage');
    const subtotalEl = form.querySelector('#orderSubtotal');
    const discountEl = form.querySelector('#orderDiscount');
    const totalEl = form.querySelector('#orderTotal');

    let cityRef = '';
    let branchSelected = '';
    let branchList = [];
    let timer;
    let cityRequest = 0;
    let branchRequest = 0;
    let manualBranch = false;
    let appliedPromo = null;
    let promoRequest = 0;

    const getItems = () => window.getCheckoutItems?.() || [];

    const getTotal = items => items.reduce(
      (sum, item) =>
        sum + Number(item.price) * Number(item.qty), 0
    );

    const showTotals = () => {
      const subtotal = appliedPromo
        ? Number(appliedPromo.subtotal)
        : getTotal(getItems());

      const discount = appliedPromo
        ? Number(appliedPromo.discount) : 0;

      subtotalEl.textContent = money(subtotal);
      discountEl.textContent = '−' + money(discount);
      totalEl.textContent = money(subtotal - discount);
    };

    showTotals();

    const checkPromo = async (code, items) => {
      const response = await fetch(
        BASE + '/rpc/check_shop_promo', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_code: code,
            p_items: items
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.valid) {
        throw new Error(
          result.message || 'Промокод недійсний'
        );
      }

      return result;
    };

    promoInput.addEventListener('input', () => {
      ++promoRequest;
      appliedPromo = null;
      promoApply.disabled = false;
      promoMessage.textContent = '';
      showTotals();
    });

    promoApply.addEventListener('click', async () => {
      const code = promoInput.value.trim().toUpperCase();
      const items = getItems();

      if (!code) {
        promoMessage.textContent = 'Введіть промокод.';
        return;
      }

      if (!items.length) {
        promoMessage.textContent = 'Кошик порожній.';
        return;
      }

      const seq = ++promoRequest;
      appliedPromo = null;
      showTotals();
      promoApply.disabled = true;
      promoMessage.style.color = '#786973';
      promoMessage.textContent = 'Перевіряємо промокод…';

      try {
        const result = await checkPromo(code, items);

        if (!form.isConnected || seq !== promoRequest) return;

        appliedPromo = result;
        promoInput.value = result.code;
        promoMessage.style.color = '#27834c';
        promoMessage.textContent =
          '✓ Промокод застосовано! Економія: ' +
          money(result.discount);

        showTotals();
      } catch (error) {
        if (seq !== promoRequest) return;

        appliedPromo = null;
        promoMessage.style.color = '#b63b4b';
        promoMessage.textContent = error.message;
        showTotals();
      } finally {
        if (seq === promoRequest) {
          promoApply.disabled = false;
        }
      }
    });

    const hide = element => {
      element.hidden = true;
      element.replaceChildren();
    };

    const options = (container, list, label, select) => {
      container.replaceChildren();

      for (const item of list) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'np-option';
        button.textContent = label(item);
        button.onclick = () => select(item);
        container.append(button);
      }

      container.hidden = !list.length;
    };

    const request = async params => {
      const url = new URL(API);

      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const result = await response.json();

      if (result.error) throw new Error(result.error);

      return Array.isArray(result.data) ? result.data : [];
    };

    const filterBranches = () => {
      const query = branch.value.toLocaleLowerCase('uk');

      const matches = branchList.filter(item =>
        String(item.Description || '')
          .toLocaleLowerCase('uk').includes(query)
      ).slice(0, 50);

      options(branches, matches,
        item => item.Description, item => {
          branch.value = item.Description;
          branchSelected = item.Description;
          hide(branches);
          branchHelp.textContent = '✓ Відділення вибрано.';
        }
      );
    };

    const loadBranches = async () => {
      const seq = ++branchRequest;
      branch.disabled = true;
      branchHelp.textContent = 'Завантажуємо відділення…';

      try {
        const list = await request({
          action: 'warehouses',
          cityRef
        });

        if (!form.isConnected || seq !== branchRequest) return;

        branchList = list.filter(item => item.Description);
        branch.disabled = false;
        branch.placeholder = 'Номер або адреса відділення';

        if (!branchList.length) {
          branchHelp.textContent =
            'Відділень не знайдено. Перевірте місто.';
          return;
        }

        branchHelp.textContent =
          'Виберіть відділення зі списку.';

        filterBranches();
      } catch (error) {
        if (seq !== branchRequest) return;

        console.error('Nova Poshta:', error);
        manualBranch = true;
        branch.disabled = false;
        branch.placeholder = 'Введіть відділення вручну';
        branchHelp.textContent =
          'Список недоступний. Введіть відділення вручну.';
      }
    };

    city.addEventListener('input', () => {
      clearTimeout(timer);

      const seq = ++cityRequest;
      ++branchRequest;

      cityRef = '';
      branchSelected = '';
      manualBranch = false;
      branchList = [];
      branch.value = '';
      branch.disabled = true;
      branch.placeholder = 'Спочатку виберіть місто';

      hide(cities);
      hide(branches);

      const query = city.value.trim();

      if (query.length < 2) {
        cityHelp.textContent = 'Введіть щонайменше 2 літери.';
        return;
      }

      cityHelp.textContent = 'Шукаємо міста…';

      timer = setTimeout(async () => {
        try {
          const list = await request({
            action: 'cities',
            q: query
          });

          if (!form.isConnected || seq !== cityRequest) return;

          const matches = list
            .flatMap(item => item.Addresses || [item])
            .filter(item =>
              item.Ref && (item.Present || item.Description)
            );

          options(cities, matches,
            item => item.Present || item.Description,
            item => {
              cityRef = item.Ref;
              city.value = item.Present || item.Description;
              hide(cities);
              cityHelp.textContent = '✓ Місто вибрано.';
              loadBranches();
            }
          );

          cityHelp.textContent = matches.length
            ? 'Натисніть на потрібне місто.'
            : 'Місто не знайдено.';

        } catch (error) {
          if (seq !== cityRequest) return;
          console.error('City search:', error);
          cityHelp.textContent = 'Помилка пошуку міст.';
        }
      }, 350);
    });

    branch.addEventListener('input', () => {
      branchSelected = '';
      if (!manualBranch) filterBranches();
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();

      const button = form.querySelector('[type="submit"]');

      if (button.disabled) return;

      if (!cityRef) {
        message.textContent = 'Виберіть місто зі списку.';
        city.focus();
        return;
      }

      if (branch.disabled ||
          !branch.value.trim() ||
          (!manualBranch && !branchSelected)) {
        message.textContent = 'Виберіть відділення.';
        return;
      }

      const items = getItems();

      if (!items.length) {
        message.textContent = 'Кошик порожній.';
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      const code = promoInput.value.trim().toUpperCase();

      if (code && (!appliedPromo || appliedPromo.code !== code)) {
        message.textContent =
          'Спочатку застосуйте промокод або видаліть його.';
        return;
      }

      button.disabled = true;
      promoInput.disabled = true;
      promoApply.disabled = true;
      message.textContent = 'Зберігаємо замовлення…';

      try {
        if (code) {
          const fresh = await checkPromo(code, items);

          if (Number(fresh.total) !== Number(appliedPromo.total) ||
              Number(fresh.discount) !== Number(appliedPromo.discount)) {
            appliedPromo = fresh;
            showTotals();
            message.textContent =
              'Сума змінилася. Перевірте її та підтвердьте замовлення.';
            return;
          }

          appliedPromo = fresh;
          showTotals();
        }

        const response = await fetch(BASE + '/orders', {
          method: 'POST',
          headers: {
            ...headers,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            customer_name: data.customer_name.trim(),
            customer_phone: data.customer_phone.trim(),
            city: data.city.trim(),
            delivery_branch: data.delivery_branch.trim(),
            payment_method: data.payment_method,
            items,
            total_amount: getTotal(items),
            status: 'new',
            promo_code: code || null,
comment: (data.comment || '').trim().slice(0, 500)
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));

          throw new Error(
            error.message || 'Помилка оформлення замовлення'
          );
        }

        window.clearCheckoutCart?.();
        window.closeDrawer?.();

        document.getElementById('catalog')
          ?.scrollIntoView({ behavior: 'smooth' });

        alert('✓ Замовлення прийнято! Ми зв’яжемося з вами.');

      } catch (error) {
        console.error(error);
        message.textContent =
          'Не вдалося оформити замовлення: ' + error.message;
      } finally {
        button.disabled = false;
        promoInput.disabled = false;
        promoApply.disabled = false;
      }
    });
  };
})();
      
