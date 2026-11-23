/* М'яке диво від Яни — checkout with Nova Poshta */
(() => {
  'use strict';

  const API = 'https://myake-dyvo-novaposhta.dmitrywildreed.workers.dev/';
  const SUPABASE = 'https://voaadlzlmiyuxclfqmmi.supabase.co/rest/v1/orders';
  const PUBLIC_KEY = 'sb_publishable_hQyblRY4450gbOKLoXDabQ_dnHyGgn2';

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
        .np-field input,.np-field select,.np-field textarea{
          box-sizing:border-box;width:100%;max-width:100%;
          padding:14px;border:1px solid #dfced7;border-radius:13px;
          background:#fff;color:#3e2d38;font:inherit;
          font-weight:400;outline:none}
        .np-field input:focus,.np-field select:focus{
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

    let cityRef = '';
    let branchSelected = '';
    let branchList = [];
    let timer;
    let cityRequest = 0;
    let branchRequest = 0;
    let manualBranch = false;

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
      if (!response.ok) throw new Error('HTTP ' + response.status);

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

      options(branches, matches, item => item.Description, item => {
        branch.value = item.Description;
        branchSelected = item.Description;
        hide(branches);
        branchHelp.textContent = '✓ Відділення вибрано.';
      });
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

        branchHelp.textContent = 'Виберіть відділення зі списку.';
        filterBranches();
      } catch (error) {
        if (seq !== branchRequest) return;

        console.error('Nova Poshta:', error);
        manualBranch = true;
        branch.disabled = false;
        branch.placeholder = 'Введіть відділення вручну';
        branchHelp.textContent =
          'Список недоступний. Можна ввести відділення вручну.';
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

          
const matches = list.flatMap(item => item.Addresses || [item])
  .filter(item => item.Ref && (item.Present || item.Description));

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

      if (!cityRef) {
        message.textContent = 'Виберіть місто зі списку.';
        city.focus();
        return;
      }

      if (!manualBranch && !branchSelected) {
        message.textContent = 'Виберіть відділення зі списку.';
        branch.focus();
        return;
      }

      const items = window.getCheckoutItems?.() || [];

      if (!items.length) {
        message.textContent = 'Кошик порожній.';
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      const total = items.reduce(
        (sum, item) =>
          sum + Number(item.price) * Number(item.qty), 0
      );

      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      message.textContent = 'Зберігаємо замовлення…';

      try {
        const response = await fetch(SUPABASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: PUBLIC_KEY,
            Authorization: 'Bearer ' + PUBLIC_KEY,
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            customer_name: data.customer_name.trim(),
            customer_phone: data.customer_phone.trim(),
            city: data.city.trim(),
            delivery_branch: data.delivery_branch.trim(),
            payment_method: data.payment_method,
            items,
            total_amount: total,
            status: 'new'
          })
        });

        if (!response.ok) {
          throw new Error('Supabase HTTP ' + response.status);
        }

        message.textContent =
          '✓ Замовлення прийнято! Ми зв’яжемося з вами.';
        form.reset();
        cityRef = '';
        branchSelected = '';
        branchList = [];
        branch.disabled = true;
        hide(cities);
        hide(branches);
      } catch (error) {
        console.error(error);
        message.textContent =
          'Не вдалося зберегти замовлення. Спробуйте ще раз.';
      } finally {
        button.disabled = false;
      }
    });
  };
})();
